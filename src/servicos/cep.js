import { temCaractereInvisivel } from '../components/validacao.js'

const TEMPO_LIMITE = 5000

const formatoCep = /^[0-9]{8}$/

const formatoUf = /^[A-Z]{2}$/

const separadoresCep = /[\s.-]/g

const memoria = new Map()

export function digitosDoCep(texto) {
  return typeof texto === 'string' ? texto.replace(separadoresCep, '') : ''
}

export function textoConfiavel(valor, maximo) {
  if (typeof valor !== 'string') return ''
  const limpo = valor.normalize('NFC').trim()
  if (limpo.length > maximo || temCaractereInvisivel(limpo)) return ''
  return limpo
}

export function interpretarRespostaCep(corpo) {
  if (corpo === null || typeof corpo !== 'object' || Array.isArray(corpo)) return { tipo: 'indisponivel' }
  if (corpo.erro === true || corpo.erro === 'true') return { tipo: 'nao-encontrado' }
  const uf = textoConfiavel(corpo.uf, 2)
  return {
    tipo: 'encontrado',
    logradouro: textoConfiavel(corpo.logradouro, 100),
    bairro: textoConfiavel(corpo.bairro, 60),
    cidade: textoConfiavel(corpo.localidade, 60),
    uf: formatoUf.test(uf) ? uf : '',
  }
}

function registrar(motivo, erro) {
  if (import.meta.env.DEV) console.warn(`[cep] ${motivo}`, erro ?? '')
}

async function consultar(cep) {
  const controle = new AbortController()
  const espera = setTimeout(() => controle.abort(), TEMPO_LIMITE)
  try {
    const resposta = await fetch(`https://viacep.com.br/ws/${cep}/json/`, {
      method: 'GET',
      signal: controle.signal,
      credentials: 'omit',
      referrerPolicy: 'no-referrer',
      redirect: 'error',
    })
    if (!resposta.ok) {
      registrar(`HTTP ${resposta.status}`)
      return { tipo: 'indisponivel' }
    }
    return interpretarRespostaCep(await resposta.json())
  } catch (erro) {
    registrar('falha na consulta', erro)
    return { tipo: 'indisponivel' }
  } finally {
    clearTimeout(espera)
  }
}

export async function buscarCep(texto) {
  const cep = digitosDoCep(texto)
  if (!formatoCep.test(cep)) return { tipo: 'invalido' }
  const guardado = memoria.get(cep)
  if (guardado) return { ...guardado }
  const resultado = await consultar(cep)
  if (resultado.tipo === 'encontrado' || resultado.tipo === 'nao-encontrado') memoria.set(cep, resultado)
  return { ...resultado }
}
