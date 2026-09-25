const formatoFoto = /^\/avatares\/([a-z0-9-]{1,30})\.svg(?:#([a-z-]{1,20}))?$/

const letraOuNumero = /[\p{L}\p{N}]/u

export const hexCores = Object.freeze({
  creme: '#fbf4e8',
  manteiga: '#fdebc0',
  mostarda: '#f7c548',
  tomate: '#d2452b',
  colorau: '#a3301b',
  canela: '#6b4f3f',
  cafe: '#2b1d16',
  'cheiro-verde': '#2f6b4f',
})

const coresPorTom = [
  ['-pele-media-clara', 'cheiro-verde'],
  ['-pele-media-escura', 'manteiga'],
  ['-pele-clara', 'tomate'],
  ['-pele-media', 'manteiga'],
  ['-pele-escura', 'mostarda'],
  ['-neutra', 'cafe'],
]

export function corPadrao(chave) {
  const tom = coresPorTom.find(([sufixo]) => chave.endsWith(sufixo))
  return tom ? tom[1] : null
}

export function lerAvatar(foto) {
  const resultado = typeof foto === 'string' ? formatoFoto.exec(foto) : null
  if (!resultado) return null
  const [, chave, cor] = resultado
  const padrao = corPadrao(chave)
  return { chave, cor: padrao && Object.hasOwn(hexCores, cor ?? '') ? cor : padrao }
}

export function urlAvatar(chave) {
  return `/avatares/${chave}.svg`
}

function inicialDe(palavra) {
  const letra = [...palavra].find((caractere) => letraOuNumero.test(caractere))
  return letra ? [...letra.toLocaleUpperCase('pt-BR')][0] : ''
}

export function iniciais(nome) {
  if (typeof nome !== 'string') return ''
  const letras = nome.trim().split(/\s+/).map(inicialDe).filter(Boolean)
  if (letras.length === 0) return ''
  return letras.length === 1 ? letras[0] : letras[0] + letras[letras.length - 1]
}

export function corDoAvatar(uid) {
  let soma = 0
  for (const caractere of typeof uid === 'string' ? uid : '') soma = (soma * 31 + caractere.codePointAt(0)) % 9973
  return soma
}
