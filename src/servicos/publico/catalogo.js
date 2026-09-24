import { iconeCategoriaGenerico, iconesCategoria } from '../../components/icones/categorias.js'
import { chaveApi, projetoId } from '../../lib/firebase.js'

const TEMPO_LIMITE = 6000

const formatoId = /^[A-Za-z0-9_-]{1,40}$/

const endereco = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projetoId)}/databases/(default)/documents/publico/catalogo?key=${encodeURIComponent(chaveApi)}`

export function idCategoriaValido(id) {
  return typeof id === 'string' && formatoId.test(id)
}

export function iconeValido(icone) {
  return typeof icone === 'string' && Object.hasOwn(iconesCategoria, icone) ? icone : iconeCategoriaGenerico
}

export function compararCategorias(a, b) {
  return a.ordem - b.ordem || a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' })
}

export function listaDe(campo) {
  const valores = campo?.arrayValue?.values
  return Array.isArray(valores) ? valores : []
}

export function camposDe(valor) {
  const campos = valor?.mapValue?.fields
  return campos && typeof campos === 'object' ? campos : {}
}

export function textoDe(campo, maximo) {
  const valor = campo?.stringValue
  if (typeof valor !== 'string') return null
  const limpo = valor.trim()
  return limpo.length <= maximo ? limpo : null
}

export function itensUnicos(campo, converter) {
  const vistos = new Set()
  return listaDe(campo).reduce((itens, valor) => {
    const item = converter(camposDe(valor))
    if (item && !vistos.has(item.id)) {
      vistos.add(item.id)
      itens.push(item)
    }
    return itens
  }, [])
}

function converterCategoria(campos) {
  const id = textoDe(campos.id, 40)
  const nome = textoDe(campos.nome, 40)
  if (!idCategoriaValido(id) || !nome) return null
  return { id, nome, icone: iconeValido(campos.icone?.stringValue) }
}

export function categoriasDoCatalogo(campos) {
  return itensUnicos(campos.categorias, converterCategoria)
}

function registrar(motivo, erro) {
  if (import.meta.env.DEV) console.warn(`[catalogo-publico] ${motivo}`, erro ?? '')
}

async function buscar() {
  const controle = new AbortController()
  const espera = setTimeout(() => controle.abort(), TEMPO_LIMITE)
  try {
    const resposta = await fetch(endereco, { signal: controle.signal, credentials: 'omit' })
    if (resposta.status === 404) return { estado: 'ausente' }
    if (!resposta.ok) {
      registrar(`HTTP ${resposta.status}`)
      return { estado: 'erro' }
    }
    const corpo = await resposta.json()
    const campos = corpo?.fields && typeof corpo.fields === 'object' ? corpo.fields : {}
    return { estado: 'ok', campos }
  } catch (erro) {
    registrar('falha na leitura', erro)
    return { estado: 'erro' }
  } finally {
    clearTimeout(espera)
  }
}

let promessa = null

export function invalidarCatalogoPublico() {
  promessa = null
}

export function lerCatalogoBruto() {
  if (promessa) return promessa
  const atual = buscar().then((resultado) => {
    if (resultado.estado === 'erro' && promessa === atual) promessa = null
    return resultado
  })
  promessa = atual
  return atual
}

export async function lerCategoriasPublicas() {
  const bruto = await lerCatalogoBruto()
  if (bruto.estado === 'erro') return { origem: 'erro', categorias: [] }
  const categorias = bruto.estado === 'ok' ? categoriasDoCatalogo(bruto.campos) : []
  return { origem: categorias.length > 0 ? 'servidor' : 'vazia', categorias }
}
