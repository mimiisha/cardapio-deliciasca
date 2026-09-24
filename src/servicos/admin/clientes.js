import { carregarFirestore } from '../../lib/firebase.js'
import { traduzirErroFirebase } from '../erros.js'
import { erroPainel } from './errosPainel.js'
import { normalizarEmail } from '../normalizar.js'
import { dataOpcional, textoOpcional } from './admins.js'

export const LIMITE_CLIENTES = 500

export async function buscarClientePorEmail(email) {
  try {
    const { db, sdk } = await carregarFirestore()
    const consulta = sdk.query(
      sdk.collection(db, 'clientes'),
      sdk.where('email', '==', normalizarEmail(email)),
      sdk.limit(1),
    )
    const resultado = await sdk.getDocs(consulta)
    if (resultado.empty) return null
    const documento = resultado.docs[0]
    const dados = documento.data()
    return {
      uid: documento.id,
      nome: typeof dados.nome === 'string' ? dados.nome : '',
      email: typeof dados.email === 'string' ? dados.email : '',
    }
  } catch (erro) {
    throw traduzirErroFirebase(erro, 'buscar-cliente')
  }
}

const formatoE164Generico = /^[+][1-9][0-9]{7,14}$/

function whatsappOpcional(valor) {
  const texto = textoOpcional(valor)
  return texto && formatoE164Generico.test(texto) ? texto : undefined
}

function enderecoOpcional(valor) {
  if (typeof valor !== 'object' || valor === null) return undefined
  const logradouro = textoOpcional(valor.logradouro)
  const numero = textoOpcional(valor.numero)
  const bairro = textoOpcional(valor.bairro)
  if (!logradouro || !numero || !bairro) return undefined
  const endereco = { logradouro, numero, bairro }
  const complemento = textoOpcional(valor.complemento)
  const referencia = textoOpcional(valor.referencia)
  if (complemento) endereco.complemento = complemento
  if (referencia) endereco.referencia = referencia
  return endereco
}

function contagemOpcional(valor) {
  return Number.isSafeInteger(valor) && valor > 0 ? valor : 0
}

function resumirCliente(documento) {
  const dados = documento.data()
  return {
    uid: documento.id,
    nome: textoOpcional(dados.nome) ?? '',
    whatsapp: whatsappOpcional(dados.whatsapp),
    criadoEm: dataOpcional(dados.criadoEm),
    enderecoPadrao: enderecoOpcional(dados.enderecoPadrao),
    totalPedidos: contagemOpcional(dados.totalPedidos),
    ultimoPedidoEm: dataOpcional(dados.ultimoPedidoEm),
  }
}

export function compararPorNome(a, b) {
  if (!a.nome !== !b.nome) return a.nome ? -1 : 1
  return a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' })
}

export async function listarClientes() {
  try {
    const { db, sdk } = await carregarFirestore()
    const consulta = sdk.query(sdk.collection(db, 'clientes'), sdk.limit(LIMITE_CLIENTES + 1))
    const resultado = await sdk.getDocs(consulta)
    const excedeuLimite = resultado.docs.length > LIMITE_CLIENTES
    const clientes = resultado.docs.slice(0, LIMITE_CLIENTES).map(resumirCliente).sort(compararPorNome)
    return { clientes, excedeuLimite }
  } catch (erro) {
    const traduzido = traduzirErroFirebase(erro, 'listar-clientes')
    throw traduzido.codigo === 'desconhecido' ? erroPainel('listar-clientes') : traduzido
  }
}
