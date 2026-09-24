import { carregarAuth } from '../lib/firebase.js'
import { ehAdmin } from './admins.js'
import { republicarUsuario } from './auth.js'
import { criarPerfil, lerPerfil, prepararDados } from './clientes.js'
import { ErroServico, traduzirErroFirebase } from './erros.js'
import { normalizarEmail } from './normalizar.js'

async function encerrarSessao({ auth, sdk }, operacao) {
  try {
    await sdk.signOut(auth)
  } catch (erro) {
    if (import.meta.env.DEV) console.error(`[${operacao}] falha ao encerrar sessão`, erro)
  }
}

async function usarPersistenciaLocal({ auth, sdk }) {
  await sdk.setPersistence(auth, sdk.indexedDBLocalPersistence)
}

async function usarPersistenciaDeSessao({ auth, sdk }) {
  await sdk.setPersistence(auth, sdk.browserSessionPersistence)
}

async function prepararLogin(persistencia, operacao) {
  const modulo = await carregarAuth()
  await modulo.auth.authStateReady()
  if (modulo.auth.currentUser) await encerrarSessao(modulo, operacao)
  await persistencia(modulo)
  return modulo
}

async function desfazerCadastro(modulo, usuario) {
  try {
    await modulo.sdk.deleteUser(usuario)
  } catch (erro) {
    if (import.meta.env.DEV) console.error('[cadastro] falha ao desfazer conta sem perfil', erro)
    await encerrarSessao(modulo, 'cadastro')
  }
}

async function definirNome(modulo, usuario, nome, operacao) {
  try {
    await modulo.sdk.updateProfile(usuario, { displayName: nome })
    return true
  } catch (erro) {
    if (import.meta.env.DEV) console.error(`[${operacao}] falha ao gravar nome na conta`, erro)
    return false
  }
}

export async function cadastrarCliente({ nome, whatsapp, email, senha }) {
  const dados = prepararDados({ nome, whatsapp })

  let modulo
  let credencial
  try {
    modulo = await prepararLogin(usarPersistenciaLocal, 'cadastro')
    credencial = await modulo.sdk.createUserWithEmailAndPassword(modulo.auth, normalizarEmail(email), senha)
  } catch (erro) {
    if (erro?.code === 'auth/email-already-in-use') return
    throw traduzirErroFirebase(erro, 'cadastro')
  }

  const usuario = credencial.user
  try {
    await criarPerfil(usuario.uid, { ...dados, email: usuario.email })
  } catch (erro) {
    await desfazerCadastro(modulo, usuario)
    throw traduzirErroFirebase(erro, 'criar-perfil')
  }

  await definirNome(modulo, usuario, dados.nome, 'cadastro')

  try {
    await modulo.sdk.sendEmailVerification(usuario)
  } catch (erro) {
    throw traduzirErroFirebase(erro, 'verificacao')
  } finally {
    await encerrarSessao(modulo, 'cadastro')
  }
}

async function manterAdminEmSessao(modulo, usuario) {
  if (!usuario.emailVerified) return
  try {
    if (await ehAdmin(usuario.uid)) await usarPersistenciaDeSessao(modulo)
  } catch (erro) {
    if (import.meta.env.DEV) console.error('[login] falha ao conferir admin; sessão segue local', erro)
  }
}

async function completarNome(modulo, usuario) {
  if (!usuario.emailVerified || usuario.displayName) return
  let perfil
  try {
    perfil = await lerPerfil(usuario.uid)
  } catch (erro) {
    if (import.meta.env.DEV) console.error('[login] falha ao ler perfil para o nome da conta', erro)
    return
  }
  const nome = typeof perfil?.nome === 'string' ? perfil.nome.trim() : ''
  if (nome === '') return
  if (await definirNome(modulo, usuario, nome, 'login')) republicarUsuario(modulo, usuario)
}

export async function entrarCliente({ email, senha }) {
  let modulo
  let usuario
  try {
    modulo = await prepararLogin(usarPersistenciaLocal, 'login')
    usuario = (await modulo.sdk.signInWithEmailAndPassword(modulo.auth, normalizarEmail(email), senha)).user
  } catch (erro) {
    throw traduzirErroFirebase(erro, 'login')
  }
  completarNome(modulo, usuario)
  await manterAdminEmSessao(modulo, usuario)
  return { emailVerificado: usuario.emailVerified }
}

const mensagensAdminNaoVerificado = {
  enviado: 'Enviamos um link de confirmação para o seu e-mail. Confirme e entre de novo.',
  recente:
    'Seu e-mail ainda não foi confirmado. Já enviamos um link há pouco; confira a caixa de entrada e o spam.',
  falhou:
    'Seu e-mail ainda não foi confirmado. Não foi possível reenviar o link agora; tente de novo em alguns minutos.',
}

async function enviarConfirmacaoAdmin(modulo, usuario) {
  try {
    await modulo.sdk.sendEmailVerification(usuario)
    return mensagensAdminNaoVerificado.enviado
  } catch (erro) {
    if (erro?.code === 'auth/too-many-requests') return mensagensAdminNaoVerificado.recente
    if (import.meta.env.DEV) console.error('[admin] falha ao reenviar confirmação de e-mail', erro)
    return mensagensAdminNaoVerificado.falhou
  }
}

export async function entrarAdmin({ email, senha }) {
  let modulo
  let usuario
  try {
    modulo = await prepararLogin(usarPersistenciaDeSessao, 'admin')
    usuario = (await modulo.sdk.signInWithEmailAndPassword(modulo.auth, normalizarEmail(email), senha)).user
  } catch (erro) {
    throw traduzirErroFirebase(erro, 'login')
  }

  if (!usuario.emailVerified) {
    const mensagem = await enviarConfirmacaoAdmin(modulo, usuario)
    await encerrarSessao(modulo, 'admin')
    throw new ErroServico('email-nao-verificado', mensagem)
  }

  let permitido
  try {
    permitido = await ehAdmin(usuario.uid)
  } catch (erro) {
    const falha = traduzirErroFirebase(erro, 'admin')
    await encerrarSessao(modulo, 'admin')
    throw falha
  }

  if (!permitido) {
    await encerrarSessao(modulo, 'admin')
    throw new ErroServico('credenciais')
  }

  return { uid: usuario.uid }
}

export async function reenviarVerificacao() {
  let modulo
  try {
    modulo = await carregarAuth()
    await modulo.auth.authStateReady()
  } catch (erro) {
    throw traduzirErroFirebase(erro, 'reenviar-verificacao')
  }
  const usuario = modulo.auth.currentUser
  if (!usuario) throw new ErroServico('desconhecido', 'Entre de novo para reenviar o e-mail de confirmação.')
  try {
    await modulo.sdk.sendEmailVerification(usuario)
  } catch (erro) {
    throw traduzirErroFirebase(erro, 'reenviar-verificacao')
  }
}
