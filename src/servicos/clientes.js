import { carregarFirestore } from '../lib/firebase.js'
import { ErroServico, traduzirErroFirebase } from './erros.js'
import { normalizarWhatsapp } from './normalizar.js'

export function prepararDados({ nome, whatsapp }) {
  const nomeLimpo = nome.trim()
  const whatsappE164 = normalizarWhatsapp(whatsapp)
  if ([...nomeLimpo].length < 2 || whatsappE164 === null) throw new ErroServico('desconhecido')
  return { nome: nomeLimpo, whatsapp: whatsappE164 }
}

export async function criarPerfil(uid, { nome, whatsapp, email }) {
  try {
    const { db, sdk } = await carregarFirestore()
    await sdk.setDoc(sdk.doc(db, 'clientes', uid), { nome, whatsapp, email, criadoEm: sdk.serverTimestamp() })
  } catch (erro) {
    throw traduzirErroFirebase(erro, 'criar-perfil')
  }
}

export async function lerPerfil(uid) {
  try {
    const { db, sdk } = await carregarFirestore()
    const documento = await sdk.getDoc(sdk.doc(db, 'clientes', uid))
    return documento.exists() ? documento.data() : null
  } catch (erro) {
    throw traduzirErroFirebase(erro, 'ler-perfil')
  }
}
