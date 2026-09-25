import { normalizarWhatsapp } from '../servicos/normalizar.js'

const formatoEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const tamanhoMinimoSenha = 8

const senhasComuns = new Set([
  '123456',
  '12345678',
  '123456789',
  '1234567890',
  '123123',
  '111111',
  '000000',
  'senha',
  'senha123',
  'senha1234',
  'mudar123',
  'teste123',
  'password',
  'password1',
  'qwerty',
  'qwerty123',
  'abc123',
  'abcd1234',
  'iloveyou',
  'admin',
  'admin123',
  'brasil',
  'flamengo',
  'corinthians',
])

const fileirasTeclado = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm']

const rotulosForca = ['', 'Ruim', 'Boa', 'Ótima']

const nivelPorPontos = [1, 1, 2, 2, 3]

export function comprimento(texto) {
  return [...texto].length
}

const caractereInvisivel =
  /[\p{Cc}\p{Cf}\p{Zl}\p{Zp}\u00AD\u061C\u180E\u200B\u200C\u200E\u200F\u202A-\u202E\u2060-\u2064\u2066-\u206F\uFEFF\uFFF9-\uFFFB]/u

export function temCaractereInvisivel(texto) {
  return caractereInvisivel.test(texto.replaceAll('\u200D', ''))
}

export const tamanhoMaximoNome = 100

export function erroNome(nome) {
  const limpo = nome.trim()
  if (limpo === '') return 'Informe seu nome.'
  if (temCaractereInvisivel(limpo)) return 'O nome contém caracteres inválidos.'
  if (comprimento(limpo) < 2) return 'Informe seu nome completo.'
  if (limpo.length > tamanhoMaximoNome) return `Use no máximo ${tamanhoMaximoNome} caracteres no nome.`
  return undefined
}

export function erroEmail(email) {
  if (email.trim() === '') return 'Informe o e-mail.'
  if (!formatoEmail.test(email.trim())) return 'Informe um e-mail válido, como nome@exemplo.com.'
  return undefined
}

export function erroWhatsapp(whatsapp) {
  if (whatsapp.replace(/\D/g, '') === '') return 'Informe o WhatsApp.'
  if (normalizarWhatsapp(whatsapp) === null) return 'Informe o WhatsApp com DDD, como (11) 98765-4321.'
  return undefined
}

export function senhaComum(senha) {
  return senhasComuns.has(senha.trim().toLowerCase())
}

function temPadraoObvio(texto) {
  if (/(.)\1{2,}/u.test(texto)) return true
  const codigos = [...texto].map((caractere) => caractere.codePointAt(0))
  for (let i = 0; i + 3 < codigos.length; i++) {
    const passo = codigos[i + 1] - codigos[i]
    if (Math.abs(passo) === 1 && codigos[i + 2] - codigos[i + 1] === passo && codigos[i + 3] - codigos[i + 2] === passo) {
      return true
    }
  }
  return fileirasTeclado.some((fileira) => {
    for (let i = 0; i + 4 <= fileira.length; i++) {
      if (texto.includes(fileira.slice(i, i + 4))) return true
    }
    return false
  })
}

function contemContexto(texto, contexto) {
  return contexto
    .flatMap((valor) => valor.toLowerCase().split(/[\s@._-]+/))
    .filter((parte) => comprimento(parte) >= 3)
    .some((parte) => texto.includes(parte))
}

function pontosPorComprimento(tamanho) {
  if (tamanho >= 20) return 4
  if (tamanho >= 16) return 3
  if (tamanho >= 12) return 2
  if (tamanho >= tamanhoMinimoSenha) return 1
  return 0
}

export function avaliarSenha(senha, contexto = []) {
  const tamanho = comprimento(senha)
  if (tamanho === 0) return { nivel: 0, rotulo: rotulosForca[0] }
  const texto = senha.toLowerCase()
  const ruim = { nivel: 1, rotulo: rotulosForca[1] }
  if (tamanho < tamanhoMinimoSenha || senhaComum(senha) || new Set(texto).size <= 3) return ruim

  const tipos = [/\p{Ll}/u, /\p{Lu}/u, /\p{N}/u, /[^\p{L}\p{N}]/u].filter((tipo) => tipo.test(senha)).length
  let pontos = pontosPorComprimento(tamanho)
  if (tipos >= 3) pontos += 1
  if (temPadraoObvio(texto)) pontos -= 1
  if (contemContexto(texto, contexto)) pontos -= 1

  const nivel = nivelPorPontos[Math.min(4, Math.max(1, pontos))]
  return { nivel, rotulo: rotulosForca[nivel] }
}

export function removerVazios(erros) {
  return Object.fromEntries(Object.entries(erros).filter(([, mensagem]) => mensagem))
}
