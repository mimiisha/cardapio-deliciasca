import { carregarFirestore } from '../../lib/firebase.js'
import { ORDEM_MAXIMA, ordenar, salvarNoCardapio } from './catalogo.js'
import { erroDoPainel, erroPainel } from './errosPainel.js'

export { ORDEM_MAXIMA }

export const categoriasPadrao = Object.freeze([
  { id: 'marmita', nome: 'Marmitas', icone: 'marmita' },
  { id: 'torta', nome: 'Tortas', icone: 'torta' },
  { id: 'sobremesa', nome: 'Sobremesas', icone: 'sobremesa' },
  { id: 'junino', nome: 'Junino', icone: 'junino' },
  { id: 'churrasco', nome: 'Churrasco', icone: 'churrasco' },
  { id: 'massa', nome: 'Massas', icone: 'massa' },
])

export function normalizarNomeCategoria(nome) {
  return nome.normalize('NFC').trim()
}

export function chaveNome(nome) {
  return nome
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLocaleLowerCase('pt-BR')
    .trim()
    .replace(/\s+/g, ' ')
}

export function proximaOrdem(itens) {
  const maior = itens.reduce((atual, item) => Math.max(atual, item.ordem), -1)
  return Math.trunc(Math.min(maior + 1, ORDEM_MAXIMA))
}

function garantirNomeLivre(categorias, nome, idIgnorado) {
  const chave = chaveNome(nome)
  if (categorias.some((categoria) => categoria.id !== idIgnorado && chaveNome(categoria.nome) === chave)) {
    throw erroPainel('nome-duplicado')
  }
}

function acharCategoria(cardapio, id) {
  const categoria = cardapio.categorias.find((item) => item.id === id)
  if (!categoria) throw erroPainel('catalogo-desatualizado')
  return categoria
}

function trocar(cardapio, id, mudancas) {
  return ordenar(cardapio.categorias.map((item) => (item.id === id ? { ...item, ...mudancas } : item)))
}

export async function criarCategoria(cardapio, { nome, icone }) {
  try {
    const nomeLimpo = normalizarNomeCategoria(nome)
    garantirNomeLivre(cardapio.categorias, nomeLimpo)
    const { db, sdk } = await carregarFirestore()
    const referencia = sdk.doc(sdk.collection(db, 'categorias'))
    const ordem = proximaOrdem(cardapio.categorias)
    const nova = { id: referencia.id, nome: nomeLimpo, icone, ordem, ativa: true, valida: true }
    return await salvarNoCardapio(cardapio, { categorias: ordenar([...cardapio.categorias, nova]) }, [
      {
        tipo: 'set',
        referencia,
        dados: {
          nome: nomeLimpo,
          icone,
          ordem,
          ativa: true,
          criadoEm: sdk.serverTimestamp(),
          atualizadoEm: sdk.serverTimestamp(),
        },
      },
    ])
  } catch (erro) {
    throw erroDoPainel(erro, 'criar-categoria', 'salvar-categoria')
  }
}

export async function editarCategoria(cardapio, id, { nome, icone }) {
  try {
    acharCategoria(cardapio, id)
    const nomeLimpo = normalizarNomeCategoria(nome)
    garantirNomeLivre(cardapio.categorias, nomeLimpo, id)
    const { db, sdk } = await carregarFirestore()
    return await salvarNoCardapio(cardapio, { categorias: trocar(cardapio, id, { nome: nomeLimpo, icone }) }, [
      {
        tipo: 'update',
        referencia: sdk.doc(db, 'categorias', id),
        dados: { nome: nomeLimpo, icone, atualizadoEm: sdk.serverTimestamp() },
      },
    ])
  } catch (erro) {
    throw erroDoPainel(erro, 'editar-categoria', 'salvar-categoria')
  }
}

export async function definirCategoriaAtiva(cardapio, id, ativa) {
  try {
    acharCategoria(cardapio, id)
    const { db, sdk } = await carregarFirestore()
    return await salvarNoCardapio(cardapio, { categorias: trocar(cardapio, id, { ativa }) }, [
      {
        tipo: 'update',
        referencia: sdk.doc(db, 'categorias', id),
        dados: { ativa, atualizadoEm: sdk.serverTimestamp() },
      },
    ])
  } catch (erro) {
    throw erroDoPainel(erro, 'ativar-categoria', 'salvar-categoria')
  }
}

export async function importarCategoriasPadrao(cardapio) {
  if (cardapio.categorias.length > 0) throw erroPainel('categorias-ja-importadas')
  try {
    const { db, sdk } = await carregarFirestore()
    const colecao = sdk.collection(db, 'categorias')
    const novas = categoriasPadrao.map(({ id, nome, icone }, ordem) => ({ id, nome, icone, ordem, ativa: true, valida: true }))
    return await salvarNoCardapio(
      cardapio,
      { categorias: ordenar(novas) },
      novas.map(({ id, nome, icone, ordem }) => ({
        tipo: 'set',
        referencia: sdk.doc(colecao, id),
        dados: {
          nome,
          icone,
          ordem,
          ativa: true,
          criadoEm: sdk.serverTimestamp(),
          atualizadoEm: sdk.serverTimestamp(),
        },
      })),
    )
  } catch (erro) {
    if (erro?.code === 'permission-denied') throw erroPainel('categorias-ja-importadas')
    throw erroDoPainel(erro, 'importar-categorias', 'salvar-categoria')
  }
}
