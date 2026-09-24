export const mensagemGenerica = 'Não foi possível concluir agora. Tente novamente.'

export const mensagemEmailNaoVerificado = 'Confirme seu e-mail pelo link que enviamos.'

const mensagens = {
  credenciais: 'E-mail ou senha incorretos.',
  limite: 'Muitas tentativas. Aguarde alguns minutos e tente de novo.',
  rede: 'Sem conexão. Verifique sua internet e tente de novo.',
  'email-nao-verificado': mensagemEmailNaoVerificado,
  config: mensagemGenerica,
  desconhecido: mensagemGenerica,
}

export class ErroServico extends Error {
  constructor(codigo, mensagem) {
    super(mensagem ?? mensagens[codigo] ?? mensagemGenerica)
    this.name = 'ErroServico'
    this.codigo = mensagem || mensagens[codigo] ? codigo : 'desconhecido'
  }
}

const codigosCredenciais = new Set([
  'auth/invalid-credential',
  'auth/wrong-password',
  'auth/user-not-found',
  'auth/invalid-login-credentials',
  'auth/user-disabled',
  'auth/invalid-email',
])

const codigosRede = new Set(['auth/network-request-failed', 'unavailable'])

const codigosConfig = new Set(['auth/operation-not-allowed', 'auth/invalid-api-key', 'auth/configuration-not-found'])

function ehConfig(codigo) {
  return codigosConfig.has(codigo) || codigo.startsWith('auth/api-key-not-valid')
}

function registrarEmDesenvolvimento(codigo, operacao, erro) {
  if (import.meta.env.DEV) console.error(`[${operacao}] ${codigo}`, erro)
}

export function traduzirErroFirebase(erro, operacao) {
  if (erro instanceof ErroServico) return erro
  const codigo = typeof erro?.code === 'string' ? erro.code : ''
  if (operacao === 'login' && codigosCredenciais.has(codigo)) return new ErroServico('credenciais')
  if (codigo === 'auth/too-many-requests') return new ErroServico('limite')
  if (codigosRede.has(codigo)) return new ErroServico('rede')
  if (ehConfig(codigo)) {
    registrarEmDesenvolvimento(codigo, operacao, erro)
    return new ErroServico('config')
  }
  registrarEmDesenvolvimento(codigo || 'sem-codigo', operacao, erro)
  return new ErroServico('desconhecido')
}
