import { carregarAuth, carregarFirestore } from '../lib/firebase.js'

export async function ehAdmin(uid) {
  const { auth } = await carregarAuth()
  const emailAtual = auth.currentUser?.uid === uid ? auth.currentUser.email : null
  if (!emailAtual) return false
  const { db, sdk } = await carregarFirestore()
  const documento = await sdk.getDoc(sdk.doc(db, 'admins', uid))
  return documento.exists() && documento.data().email === emailAtual
}
