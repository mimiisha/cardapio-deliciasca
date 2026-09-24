const variaveis = {
  VITE_FIREBASE_API_KEY: import.meta.env.VITE_FIREBASE_API_KEY,
  VITE_FIREBASE_AUTH_DOMAIN: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  VITE_FIREBASE_PROJECT_ID: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  VITE_FIREBASE_STORAGE_BUCKET: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  VITE_FIREBASE_MESSAGING_SENDER_ID: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  VITE_FIREBASE_APP_ID: import.meta.env.VITE_FIREBASE_APP_ID,
}

const ausentes = Object.entries(variaveis)
  .filter(([, valor]) => typeof valor !== 'string' || valor.trim() === '')
  .map(([nome]) => nome)

if (ausentes.length > 0) {
  throw new Error(`Configuração do Firebase incompleta. Defina no .env.local: ${ausentes.join(', ')}`)
}

const configuracao = {
  apiKey: variaveis.VITE_FIREBASE_API_KEY,
  authDomain: variaveis.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: variaveis.VITE_FIREBASE_PROJECT_ID,
  storageBucket: variaveis.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: variaveis.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: variaveis.VITE_FIREBASE_APP_ID,
}

export const projetoId = configuracao.projectId

export const chaveApi = configuracao.apiKey

let promessaApp = null
let promessaAuth = null
let promessaFirestore = null
let instanciaAuth = null

function carregarApp() {
  if (promessaApp) return promessaApp
  const promessa = import('firebase/app').then(({ getApp, getApps, initializeApp }) =>
    getApps().length > 0 ? getApp() : initializeApp(configuracao),
  )
  promessaApp = promessa
  promessa.catch(() => {
    if (promessaApp === promessa) promessaApp = null
  })
  return promessa
}

export function carregarAuth() {
  if (promessaAuth) return promessaAuth
  const promessa = Promise.all([carregarApp(), import('firebase/auth')]).then(([app, sdk]) => {
    if (!instanciaAuth) {
      instanciaAuth = sdk.initializeAuth(app, {
        persistence: [sdk.indexedDBLocalPersistence, sdk.browserLocalPersistence, sdk.browserSessionPersistence],
      })
      instanciaAuth.languageCode = 'pt-BR'
    }
    return { auth: instanciaAuth, sdk }
  })
  promessaAuth = promessa
  promessa.catch(() => {
    if (promessaAuth === promessa) promessaAuth = null
  })
  return promessa
}

export function carregarFirestore() {
  if (promessaFirestore) return promessaFirestore
  const promessa = Promise.all([carregarApp(), carregarAuth(), import('firebase/firestore')]).then(([app, , sdk]) => ({
    db: sdk.getFirestore(app),
    sdk,
  }))
  promessaFirestore = promessa
  promessa.catch(() => {
    if (promessaFirestore === promessa) promessaFirestore = null
  })
  return promessa
}
