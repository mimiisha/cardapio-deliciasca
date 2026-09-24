import { useSyncExternalStore } from 'react'
import { observarSessao } from '../servicos/auth.js'
import { ehAdmin } from '../servicos/admins.js'

const ouvintes = new Set()
let snapshot = Object.freeze({
  estado: 'carregando',
  uid: null,
  email: null,
  nome: null,
  emailVerificado: false,
  admin: null,
  adminFalhou: false,
})
let inicio = null
let agendada = false
let exigencias = 0
let geracao = 0
let adminConferido = null
let adminEmConferencia = null
let adminConfirmadoPendente = null

function publicar(mudancas) {
  snapshot = Object.freeze({ ...snapshot, ...mudancas })
  ouvintes.forEach((ouvinte) => ouvinte())
}

function conferirAdmin() {
  if (exigencias === 0 || snapshot.estado !== 'autenticado') return
  if (adminConferido === geracao || adminEmConferencia === geracao) return
  const rodada = geracao
  adminEmConferencia = rodada
  if (snapshot.admin !== true || snapshot.adminFalhou) publicar({ admin: snapshot.admin === true ? true : null, adminFalhou: false })
  ehAdmin(snapshot.uid)
    .then((resultado) => {
      if (rodada !== geracao) return
      adminEmConferencia = null
      adminConferido = rodada
      publicar({ admin: resultado, adminFalhou: false })
    })
    .catch((erro) => {
      if (import.meta.env.DEV) console.error('[sessao] falha ao verificar admin', erro)
      if (rodada !== geracao) return
      adminEmConferencia = null
      publicar({ admin: null, adminFalhou: true })
    })
}

function aoMudarUsuario(usuario) {
  if (!usuario) {
    geracao += 1
    adminConferido = null
    publicar({ estado: 'anonimo', uid: null, email: null, nome: null, emailVerificado: false, admin: false, adminFalhou: false })
    return
  }
  const mesmoUsuario =
    snapshot.estado === 'autenticado' && snapshot.uid === usuario.uid && snapshot.email === usuario.email
  const dados = {
    estado: 'autenticado',
    uid: usuario.uid,
    email: usuario.email,
    nome: usuario.displayName || null,
    emailVerificado: usuario.emailVerified,
  }
  if (mesmoUsuario) {
    publicar(dados)
    return
  }
  geracao += 1
  adminConferido = null
  const confirmado = adminConfirmadoPendente === usuario.uid
  adminConfirmadoPendente = null
  if (confirmado) adminConferido = geracao
  publicar({ ...dados, admin: confirmado ? true : null, adminFalhou: false })
  conferirAdmin()
}

export function iniciarSessao() {
  if (inicio) return
  if (snapshot.estado === 'erro') publicar({ estado: 'carregando', admin: null, adminFalhou: false })
  inicio = observarSessao(aoMudarUsuario).catch((erro) => {
    if (import.meta.env.DEV) console.error('[sessao] falha ao iniciar', erro)
    inicio = null
    geracao += 1
    publicar({ estado: 'erro', uid: null, email: null, nome: null, emailVerificado: false, admin: false, adminFalhou: false })
  })
}

function iniciarAgendada() {
  agendada = false
  iniciarSessao()
}

function iniciarNoOcio() {
  if (typeof window.requestIdleCallback === 'function') {
    window.requestIdleCallback(iniciarAgendada, { timeout: 2000 })
    return
  }
  setTimeout(iniciarAgendada, 0)
}

export function iniciarSessaoQuandoOcioso() {
  if (inicio || agendada) return
  agendada = true
  if (document.readyState === 'complete') {
    iniciarNoOcio()
    return
  }
  window.addEventListener('load', iniciarNoOcio, { once: true })
}

export function exigirVerificacaoAdmin() {
  exigencias += 1
  conferirAdmin()
  return () => {
    exigencias -= 1
  }
}

export function repetirVerificacaoAdmin() {
  conferirAdmin()
}

export function confirmarAdmin(uid) {
  if (snapshot.estado === 'autenticado' && snapshot.uid === uid) {
    adminConferido = geracao
    adminEmConferencia = null
    publicar({ admin: true, adminFalhou: false })
    return
  }
  adminConfirmadoPendente = uid
}

function assinar(ouvinte) {
  ouvintes.add(ouvinte)
  return () => {
    ouvintes.delete(ouvinte)
  }
}

function lerSnapshot() {
  return snapshot
}

export function useSessao() {
  return useSyncExternalStore(assinar, lerSnapshot)
}
