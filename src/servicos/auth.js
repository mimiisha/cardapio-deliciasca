import { carregarAuth, carregarFirestore } from '../lib/firebase.js'
import { traduzirErroFirebase } from './erros.js'

const observadores = new Set()

export function prepararServicos({ firestore = false } = {}) {
  const carga = firestore ? carregarFirestore() : carregarAuth()
  carga.catch((erro) => {
    if (import.meta.env.DEV) console.error('[servicos] falha ao preparar', erro)
  })
}

export function republicarUsuario({ auth }, usuario) {
  if (auth.currentUser !== usuario) return
  observadores.forEach((aoMudar) => aoMudar(usuario))
}

export async function sair() {
  try {
    const { auth, sdk } = await carregarAuth()
    await sdk.signOut(auth)
  } catch (erro) {
    throw traduzirErroFirebase(erro, 'sair')
  }
}

export async function observarSessao(aoMudar) {
  try {
    const { auth, sdk } = await carregarAuth()
    const cancelar = sdk.onIdTokenChanged(auth, aoMudar)
    observadores.add(aoMudar)
    return () => {
      observadores.delete(aoMudar)
      cancelar()
    }
  } catch (erro) {
    throw traduzirErroFirebase(erro, 'sessao')
  }
}
