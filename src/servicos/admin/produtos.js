import { carregarFirestore } from '../../lib/firebase.js'
import { ordenar, salvarNoCardapio } from './catalogo.js'
import { chaveNome, proximaOrdem } from './categorias.js'
import { erroDoPainel, erroPainel } from './errosPainel.js'

export const mensagemProdutoDuplicado = 'Já existe um produto com esse nome.'

const alfabetoId = 'abcdefghijklmnopqrstuvwxyz0123456789'

const formatoIdTamanho = /^[a-z0-9]{8}$/

const limiteSorteio = 252

export function novoIdTamanho() {
  let id = ''
  while (id.length < 8) {
    const sorteio = crypto.getRandomValues(new Uint8Array(16))
    for (const valor of sorteio) {
      if (valor < limiteSorteio && id.length < 8) id += alfabetoId[valor % alfabetoId.length]
    }
  }
  return id
}

function limparTexto(texto) {
  return typeof texto === 'string' ? texto.normalize('NFC').trim() : ''
}

export function normalizarNomeProduto(nome) {
  return limparTexto(nome)
}

function garantirNomeLivre(produtos, nome, idIgnorado) {
  const chave = chaveNome(nome)
  if (produtos.some((produto) => produto.id !== idIgnorado && chaveNome(produto.nome) === chave)) {
    throw erroPainel('nome-duplicado', mensagemProdutoDuplicado)
  }
}

function idLivre(id, usados) {
  let escolhido = typeof id === 'string' && formatoIdTamanho.test(id) ? id : novoIdTamanho()
  while (usados.has(escolhido)) escolhido = novoIdTamanho()
  usados.add(escolhido)
  return escolhido
}

function limparTamanhos(tamanhos) {
  const usados = new Set()
  return tamanhos.map(({ id, nome, precoCentavos }) => ({
    id: idLivre(id, usados),
    nome: limparTexto(nome),
    precoCentavos: Math.trunc(precoCentavos),
  }))
}

function limparSelos(selosIds, selos) {
  const existentes = new Set(selos.map((selo) => selo.id))
  return [...new Set(selosIds)].filter((id) => typeof id === 'string' && existentes.has(id))
}

function prepararCampos(cardapio, dados, idIgnorado) {
  const nome = normalizarNomeProduto(dados.nome)
  garantirNomeLivre(cardapio.produtos, nome, idIgnorado)
  if (!cardapio.categorias.some((categoria) => categoria.id === dados.categoriaId)) throw erroPainel('catalogo-desatualizado')
  return {
    nome,
    descricao: limparTexto(dados.descricao),
    categoriaId: dados.categoriaId,
    selosIds: limparSelos(dados.selosIds ?? [], cardapio.selos),
    tamanhos: limparTamanhos(dados.tamanhos),
  }
}

function acharProduto(cardapio, id) {
  const produto = cardapio.produtos.find((item) => item.id === id)
  if (!produto) throw erroPainel('catalogo-desatualizado')
  return produto
}

function trocar(cardapio, id, mudancas) {
  return ordenar(cardapio.produtos.map((item) => (item.id === id ? { ...item, ...mudancas } : item)))
}

export async function criarProduto(cardapio, dados) {
  try {
    const campos = prepararCampos(cardapio, dados)
    const { db, sdk } = await carregarFirestore()
    const referencia = sdk.doc(sdk.collection(db, 'produtos'))
    const ordem = proximaOrdem(cardapio.produtos)
    const novo = { id: referencia.id, ...campos, ativo: true, ordem, valido: true }
    return await salvarNoCardapio(cardapio, { produtos: ordenar([...cardapio.produtos, novo]) }, [
      {
        tipo: 'set',
        referencia,
        dados: {
          ...campos,
          ativo: true,
          ordem,
          criadoEm: sdk.serverTimestamp(),
          atualizadoEm: sdk.serverTimestamp(),
        },
      },
    ])
  } catch (erro) {
    throw erroDoPainel(erro, 'criar-produto', 'salvar-produto')
  }
}

export async function editarProduto(cardapio, id, dados) {
  try {
    acharProduto(cardapio, id)
    const campos = prepararCampos(cardapio, dados, id)
    const { db, sdk } = await carregarFirestore()
    return await salvarNoCardapio(cardapio, { produtos: trocar(cardapio, id, { ...campos, valido: true }) }, [
      {
        tipo: 'update',
        referencia: sdk.doc(db, 'produtos', id),
        dados: { ...campos, atualizadoEm: sdk.serverTimestamp() },
      },
    ])
  } catch (erro) {
    throw erroDoPainel(erro, 'editar-produto', 'salvar-produto')
  }
}

export async function definirProdutoAtivo(cardapio, id, ativo) {
  try {
    acharProduto(cardapio, id)
    const { db, sdk } = await carregarFirestore()
    return await salvarNoCardapio(cardapio, { produtos: trocar(cardapio, id, { ativo }) }, [
      {
        tipo: 'update',
        referencia: sdk.doc(db, 'produtos', id),
        dados: { ativo, atualizadoEm: sdk.serverTimestamp() },
      },
    ])
  } catch (erro) {
    throw erroDoPainel(erro, 'ativar-produto', 'salvar-produto')
  }
}
