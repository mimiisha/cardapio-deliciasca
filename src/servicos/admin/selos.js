import { carregarFirestore } from '../../lib/firebase.js'
import { iconeSeloValido, ordenar, salvarNoCardapio } from './catalogo.js'
import { chaveNome, proximaOrdem } from './categorias.js'
import { erroDoPainel, erroPainel } from './errosPainel.js'

export { iconeSeloValido }

export const mensagemSeloDuplicado = 'Já existe um selo com esse nome.'

export const iconesAlergeno = Object.freeze(['sem-gluten', 'sem-lactose', 'sem-acucar', 'gluten', 'lacteo', 'queijo'])

export const iconesPresenca = Object.freeze(['gluten', 'lacteo', 'queijo'])

export function normalizarNomeSelo(nome) {
  return nome.normalize('NFC').trim()
}

export function contarUsos(produtos, idSelo) {
  return produtos.reduce((total, produto) => total + (produto.selosIds.includes(idSelo) ? 1 : 0), 0)
}

export function textoProdutos(quantidade) {
  return quantidade === 1 ? '1 produto' : `${quantidade} produtos`
}

function garantirNomeLivre(selos, nome, idIgnorado) {
  const chave = chaveNome(nome)
  if (selos.some((selo) => selo.id !== idIgnorado && chaveNome(selo.nome) === chave)) {
    throw erroPainel('nome-duplicado', mensagemSeloDuplicado)
  }
}

function acharSelo(cardapio, id) {
  const selo = cardapio.selos.find((item) => item.id === id)
  if (!selo) throw erroPainel('catalogo-desatualizado')
  return selo
}

function trocar(cardapio, id, mudancas) {
  return ordenar(cardapio.selos.map((item) => (item.id === id ? { ...item, ...mudancas } : item)))
}

export async function criarSelo(cardapio, { nome, icone }) {
  try {
    const nomeLimpo = normalizarNomeSelo(nome)
    garantirNomeLivre(cardapio.selos, nomeLimpo)
    const { db, sdk } = await carregarFirestore()
    const referencia = sdk.doc(sdk.collection(db, 'selos'))
    const ordem = proximaOrdem(cardapio.selos)
    const novo = { id: referencia.id, nome: nomeLimpo, icone, ordem, ativo: true, valido: true }
    return await salvarNoCardapio(cardapio, { selos: ordenar([...cardapio.selos, novo]) }, [
      {
        tipo: 'set',
        referencia,
        dados: {
          nome: nomeLimpo,
          icone,
          ordem,
          ativo: true,
          criadoEm: sdk.serverTimestamp(),
          atualizadoEm: sdk.serverTimestamp(),
        },
      },
    ])
  } catch (erro) {
    throw erroDoPainel(erro, 'criar-selo', 'salvar-selo')
  }
}

export async function editarSelo(cardapio, id, { nome, icone }) {
  try {
    acharSelo(cardapio, id)
    const nomeLimpo = normalizarNomeSelo(nome)
    garantirNomeLivre(cardapio.selos, nomeLimpo, id)
    const { db, sdk } = await carregarFirestore()
    return await salvarNoCardapio(cardapio, { selos: trocar(cardapio, id, { nome: nomeLimpo, icone }) }, [
      {
        tipo: 'update',
        referencia: sdk.doc(db, 'selos', id),
        dados: { nome: nomeLimpo, icone, atualizadoEm: sdk.serverTimestamp() },
      },
    ])
  } catch (erro) {
    throw erroDoPainel(erro, 'editar-selo', 'salvar-selo')
  }
}

export async function definirSeloAtivo(cardapio, id, ativo) {
  try {
    acharSelo(cardapio, id)
    const { db, sdk } = await carregarFirestore()
    return await salvarNoCardapio(cardapio, { selos: trocar(cardapio, id, { ativo }) }, [
      {
        tipo: 'update',
        referencia: sdk.doc(db, 'selos', id),
        dados: { ativo, atualizadoEm: sdk.serverTimestamp() },
      },
    ])
  } catch (erro) {
    throw erroDoPainel(erro, 'ativar-selo', 'salvar-selo')
  }
}
