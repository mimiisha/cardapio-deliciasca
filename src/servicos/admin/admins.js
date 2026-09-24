import { carregarAuth, carregarFirestore } from '../../lib/firebase.js'
import { ErroServico, traduzirErroFirebase } from '../erros.js'
import { erroPainel } from './errosPainel.js'

const mensagemPossivelDuplicado =
  'Não foi possível dar o acesso. Talvez essa pessoa já tenha sido adicionada; recarregue a lista.'

export function textoOpcional(valor) {
  return typeof valor === 'string' && valor.trim() !== '' ? valor.trim() : undefined
}

export function dataOpcional(valor) {
  return typeof valor?.toDate === 'function' ? valor.toDate() : undefined
}

function chaveOrdem(admin) {
  return admin.nome ?? admin.email ?? ''
}

export async function listarAdmins() {
  try {
    const { db, sdk } = await carregarFirestore()
    const resultado = await sdk.getDocs(sdk.collection(db, 'admins'))
    return resultado.docs
      .map((documento) => {
        const dados = documento.data()
        return {
          uid: documento.id,
          nome: textoOpcional(dados.nome),
          email: textoOpcional(dados.email),
          criadoEm: dataOpcional(dados.criadoEm),
        }
      })
      .sort((a, b) => chaveOrdem(a).localeCompare(chaveOrdem(b), 'pt-BR', { sensitivity: 'base' }))
  } catch (erro) {
    throw traduzirErroFirebase(erro, 'listar-admins')
  }
}

export async function promoverAdmin(cliente) {
  try {
    const { auth } = await carregarAuth()
    const uidAtual = auth.currentUser?.uid
    if (!uidAtual) throw new ErroServico('desconhecido')
    if (cliente.uid === uidAtual) throw erroPainel('propria-conta')
    const { db, sdk } = await carregarFirestore()
    const referencia = sdk.doc(db, 'admins', cliente.uid)
    const existente = await sdk.getDoc(referencia)
    if (existente.exists()) throw erroPainel('ja-admin')
    try {
      await sdk.setDoc(referencia, {
        email: cliente.email,
        nome: cliente.nome,
        criadoEm: sdk.serverTimestamp(),
        criadoPor: uidAtual,
      })
    } catch (erro) {
      if (erro?.code === 'permission-denied') throw new ErroServico('desconhecido', mensagemPossivelDuplicado)
      throw erro
    }
  } catch (erro) {
    throw traduzirErroFirebase(erro, 'promover-admin')
  }
}
