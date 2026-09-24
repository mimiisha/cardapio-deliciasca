import { iconeSeloGenerico, iconesSelo } from '../../components/icones/selos.js'
import { categoriasDoCatalogo, idCategoriaValido, itensUnicos, listaDe, camposDe, lerCatalogoBruto, textoDe } from './catalogo.js'

const PRECO_MINIMO = 1

const PRECO_MAXIMO = 100000

const TAMANHOS_MAXIMO = 6

const SELOS_MAXIMO = 6

const formatoIdTamanho = /^[a-z0-9]{8}$/

function iconeSelo(icone) {
  return typeof icone === 'string' && Object.hasOwn(iconesSelo, icone) ? icone : iconeSeloGenerico
}

function converterSelo(campos) {
  const id = textoDe(campos.id, 40)
  const nome = textoDe(campos.nome, 30)
  if (!idCategoriaValido(id) || !nome) return null
  return { id, nome, icone: iconeSelo(campos.icone?.stringValue) }
}

function precoDe(campo) {
  const valor = campo?.integerValue
  const numero = typeof valor === 'string' || typeof valor === 'number' ? Number(valor) : Number.NaN
  return Number.isSafeInteger(numero) && numero >= PRECO_MINIMO && numero <= PRECO_MAXIMO ? numero : null
}

function converterTamanho(valor) {
  const campos = camposDe(valor)
  const id = textoDe(campos.id, 8)
  const nome = textoDe(campos.nome, 20)
  const precoCentavos = precoDe(campos.precoCentavos)
  if (!id || !formatoIdTamanho.test(id) || nome === null || precoCentavos === null) return null
  return { id, nome, precoCentavos }
}

function tamanhosDe(campo) {
  const vistos = new Set()
  return listaDe(campo)
    .map(converterTamanho)
    .filter((tamanho) => {
      if (!tamanho || vistos.has(tamanho.id)) return false
      vistos.add(tamanho.id)
      return true
    })
    .slice(0, TAMANHOS_MAXIMO)
}

function idsDe(campo) {
  return listaDe(campo)
    .map((valor) => valor?.stringValue)
    .filter(idCategoriaValido)
}

function converterProduto(campos) {
  const id = textoDe(campos.id, 40)
  const nome = textoDe(campos.nome, 60)
  const descricao = campos.descricao === undefined ? '' : textoDe(campos.descricao, 160)
  const categoriaId = campos.categoriaId?.stringValue
  const tamanhos = tamanhosDe(campos.tamanhos)
  if (!idCategoriaValido(id) || !nome || descricao === null || !idCategoriaValido(categoriaId) || tamanhos.length === 0) {
    return null
  }
  return { id, nome, descricao, categoriaId, selosIds: idsDe(campos.selosIds), tamanhos }
}

function selosDoProduto(selosIds, selos) {
  const escolhidos = new Set(selosIds)
  return selos.filter((selo) => escolhidos.has(selo.id)).slice(0, SELOS_MAXIMO)
}

export async function lerCategoriaPublica(id) {
  const bruto = await lerCatalogoBruto()
  if (bruto.estado === 'erro') return { estado: 'erro' }
  if (bruto.estado === 'ausente') return { estado: 'nao-encontrada' }
  const categoria = categoriasDoCatalogo(bruto.campos).find((item) => item.id === id)
  if (!categoria) return { estado: 'nao-encontrada' }
  const selos = itensUnicos(bruto.campos.selos, converterSelo)
  const produtos = itensUnicos(bruto.campos.produtos, converterProduto)
    .filter((produto) => produto.categoriaId === id)
    .map((produto) => ({
      id: produto.id,
      nome: produto.nome,
      descricao: produto.descricao,
      tamanhos: produto.tamanhos,
      selos: selosDoProduto(produto.selosIds, selos),
    }))
  return { estado: 'ok', categoria, produtos }
}
