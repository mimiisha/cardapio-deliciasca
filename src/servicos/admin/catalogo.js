import { iconeCategoriaValido } from '../../components/icones/categorias.js'
import { iconeSeloGenerico, iconesSelo } from '../../components/icones/selos.js'
import { carregarFirestore } from '../../lib/firebase.js'
import { compararCategorias, invalidarCatalogoPublico } from '../publico/catalogo.js'
import { erroDoPainel, erroPainel } from './errosPainel.js'

export const ORDEM_MAXIMA = 9999

export const LIMITES_CATALOGO = Object.freeze({ categorias: 100, selos: 100, produtos: 500 })

const SELOS_POR_PRODUTO = 6

export function iconeSeloValido(icone) {
  return typeof icone === 'string' && Object.hasOwn(iconesSelo, icone) ? icone : iconeSeloGenerico
}

function textoLimpo(valor) {
  return typeof valor === 'string' ? valor.trim() : ''
}

export function resumirCategoria(id, dados) {
  const nome = textoLimpo(dados.nome)
  const ordemValida = Number.isSafeInteger(dados.ordem)
  return {
    id,
    nome,
    icone: iconeCategoriaValido(dados.icone),
    ordem: ordemValida ? dados.ordem : ORDEM_MAXIMA,
    ativa: dados.ativa === true,
    valida: nome !== '' && ordemValida && typeof dados.ativa === 'boolean',
  }
}

export function resumirSelo(id, dados) {
  const nome = textoLimpo(dados.nome)
  const ordemValida = Number.isSafeInteger(dados.ordem)
  return {
    id,
    nome,
    icone: iconeSeloValido(dados.icone),
    ordem: ordemValida ? dados.ordem : ORDEM_MAXIMA,
    ativo: dados.ativo === true,
    valido: nome !== '' && ordemValida && typeof dados.ativo === 'boolean',
  }
}

function resumirTamanho(tamanho) {
  if (!tamanho || typeof tamanho !== 'object') return null
  const { id, nome, precoCentavos } = tamanho
  if (typeof id !== 'string' || !Number.isSafeInteger(precoCentavos)) return null
  return { id, nome: textoLimpo(nome), precoCentavos }
}

export function resumirProduto(id, dados) {
  const nome = textoLimpo(dados.nome)
  const ordemValida = Number.isSafeInteger(dados.ordem)
  const brutos = Array.isArray(dados.tamanhos) ? dados.tamanhos : []
  const tamanhos = brutos.map(resumirTamanho).filter(Boolean)
  const selosIds = Array.isArray(dados.selosIds) ? [...new Set(dados.selosIds.filter((item) => typeof item === 'string'))] : []
  return {
    id,
    nome,
    descricao: textoLimpo(dados.descricao),
    categoriaId: typeof dados.categoriaId === 'string' ? dados.categoriaId : '',
    selosIds,
    tamanhos,
    ativo: dados.ativo === true,
    ordem: ordemValida ? dados.ordem : ORDEM_MAXIMA,
    valido:
      nome !== '' &&
      ordemValida &&
      typeof dados.ativo === 'boolean' &&
      typeof dados.descricao === 'string' &&
      typeof dados.categoriaId === 'string' &&
      tamanhos.length > 0 &&
      tamanhos.length === brutos.length,
  }
}

export function ordenar(lista) {
  return [...lista].sort(compararCategorias)
}

export function montarCatalogo({ categorias, selos, produtos }) {
  const categoriasVisiveis = ordenar(categorias.filter((categoria) => categoria.ativa && categoria.valida))
  const selosVisiveis = ordenar(selos.filter((selo) => selo.ativo && selo.valido))
  const idsCategorias = new Set(categoriasVisiveis.map((categoria) => categoria.id))
  const posicaoSelo = new Map(selosVisiveis.map((selo, indice) => [selo.id, indice]))
  const produtosVisiveis = ordenar(
    produtos.filter((produto) => produto.ativo && produto.valido && idsCategorias.has(produto.categoriaId)),
  )
  if (
    categoriasVisiveis.length > LIMITES_CATALOGO.categorias ||
    selosVisiveis.length > LIMITES_CATALOGO.selos ||
    produtosVisiveis.length > LIMITES_CATALOGO.produtos
  ) {
    throw erroPainel('catalogo-grande')
  }
  return {
    categorias: categoriasVisiveis.map(({ id, nome, icone }) => ({ id, nome, icone })),
    selos: selosVisiveis.map(({ id, nome, icone }) => ({ id, nome, icone })),
    produtos: produtosVisiveis.map((produto) => ({
      id: produto.id,
      nome: produto.nome,
      descricao: produto.descricao,
      categoriaId: produto.categoriaId,
      selosIds: [...new Set(produto.selosIds)]
        .filter((id) => posicaoSelo.has(id))
        .sort((a, b) => posicaoSelo.get(a) - posicaoSelo.get(b))
        .slice(0, SELOS_POR_PRODUTO),
      tamanhos: produto.tamanhos.map(({ id, nome, precoCentavos }) => ({ id, nome, precoCentavos })),
    })),
  }
}

function lerVersao(documento) {
  if (!documento.exists()) return { versao: 0, publicadoEm: null }
  const dados = documento.data()
  const versao = Number.isSafeInteger(dados.versao) && dados.versao > 0 ? dados.versao : 0
  const publicadoEm = typeof dados.atualizadoEm?.toDate === 'function' ? dados.atualizadoEm.toDate() : null
  return { versao, publicadoEm }
}

function referenciaCatalogo(db, sdk) {
  return sdk.doc(db, 'publico', 'catalogo')
}

async function lerCardapio(db, sdk) {
  const [categorias, selos, produtos, catalogo] = await Promise.all([
    sdk.getDocs(sdk.collection(db, 'categorias')),
    sdk.getDocs(sdk.collection(db, 'selos')),
    sdk.getDocs(sdk.collection(db, 'produtos')),
    sdk.getDoc(referenciaCatalogo(db, sdk)),
  ])
  return {
    categorias: ordenar(categorias.docs.map((documento) => resumirCategoria(documento.id, documento.data()))),
    selos: ordenar(selos.docs.map((documento) => resumirSelo(documento.id, documento.data()))),
    produtos: ordenar(produtos.docs.map((documento) => resumirProduto(documento.id, documento.data()))),
    ...lerVersao(catalogo),
  }
}

export async function carregarCardapio() {
  try {
    const { db, sdk } = await carregarFirestore()
    return await lerCardapio(db, sdk)
  } catch (erro) {
    throw erroDoPainel(erro, 'listar-cardapio', 'listar-cardapio')
  }
}

async function versaoMudou(db, sdk, versaoAtual) {
  try {
    const { versao } = lerVersao(await sdk.getDoc(referenciaCatalogo(db, sdk)))
    return versao !== versaoAtual
  } catch (erro) {
    if (import.meta.env.DEV) console.error('[catalogo] falha ao conferir a versão', erro)
    return false
  }
}

const operacoesPermitidas = new Set(['set', 'update'])

export async function gravarComCatalogo(origemOps, catalogoNovo, versaoAtual) {
  const { db, sdk } = await carregarFirestore()
  const versao = versaoAtual + 1
  const lote = sdk.writeBatch(db)
  origemOps.forEach(({ tipo, referencia, dados }) => {
    if (!operacoesPermitidas.has(tipo)) throw new TypeError(`Operação de escrita inválida: ${tipo}`)
    lote[tipo](referencia, dados)
  })
  lote.set(referenciaCatalogo(db, sdk), { versao, atualizadoEm: sdk.serverTimestamp(), ...catalogoNovo })
  try {
    await lote.commit()
  } catch (erro) {
    if (erro?.code === 'permission-denied' && (await versaoMudou(db, sdk, versaoAtual))) {
      throw erroPainel('catalogo-desatualizado')
    }
    throw erro
  } finally {
    invalidarCatalogoPublico()
  }
  return { versao, publicadoEm: new Date() }
}

export async function salvarNoCardapio(cardapio, mudancas, origemOps) {
  const proximo = { ...cardapio, ...mudancas }
  const catalogo = montarCatalogo(proximo)
  const { versao, publicadoEm } = await gravarComCatalogo(origemOps, catalogo, cardapio.versao)
  return { ...proximo, versao, publicadoEm }
}

export async function publicarCardapio() {
  try {
    const { db, sdk } = await carregarFirestore()
    const lido = await lerCardapio(db, sdk)
    const catalogo = montarCatalogo(lido)
    const { versao, publicadoEm } = await gravarComCatalogo([], catalogo, lido.versao)
    return { ...lido, versao, publicadoEm }
  } catch (erro) {
    throw erroDoPainel(erro, 'publicar-cardapio', 'publicar-cardapio')
  }
}
