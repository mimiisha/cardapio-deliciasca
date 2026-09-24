import { useSyncExternalStore } from 'react'

const ouvintes = new Set()

function avisar() {
  ouvintes.forEach((ouvinte) => ouvinte())
}

function assinar(ouvinte) {
  ouvintes.add(ouvinte)
  if (ouvintes.size === 1) window.addEventListener('popstate', avisar)
  return () => {
    ouvintes.delete(ouvinte)
    if (ouvintes.size === 0) window.removeEventListener('popstate', avisar)
  }
}

function lerCaminho() {
  const caminho = window.location.pathname.replace(/\/+$/, '')
  return caminho === '' ? '/' : caminho
}

function temCaractereProibido(texto) {
  return [...texto].some((caractere) => {
    const codigo = caractere.codePointAt(0)
    return caractere === '\\' || codigo <= 0x1f || codigo === 0x7f
  })
}

export function caminhoInterno(destino) {
  if (typeof destino !== 'string' || !destino.startsWith('/') || destino.startsWith('/', 1)) return false
  if (temCaractereProibido(destino)) return false
  try {
    return new URL(destino, window.location.origin).origin === window.location.origin
  } catch {
    return false
  }
}

export function navegar(destino, estado = null) {
  if (!caminhoInterno(destino)) return
  if (destino === window.location.pathname + window.location.hash) return
  window.history.pushState(estado, '', destino)
  avisar()
}

export function useRota() {
  return useSyncExternalStore(assinar, lerCaminho)
}
