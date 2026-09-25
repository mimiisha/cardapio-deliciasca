import { carregarAuth } from '../lib/firebase.js'
import { erroNome, erroWhatsapp } from '../components/validacao.js'
import { republicarUsuario } from './auth.js'
import { atualizarPerfil, criarPerfil, lerPerfil, mensagemSemCadastro, prepararDados } from './clientes.js'
import { ErroServico, traduzirErroFirebase } from './erros.js'
import { normalizarNome, normalizarWhatsapp } from './normalizar.js'

export const mensagemContaAtualizada = 'Dados atualizados.'

export const mensagemNomeAtrasado = 'Seus dados foram salvos, mas o nome no menu pode demorar a atualizar.'

export const mensagemCadastroCompleto = 'Cadastro completo.'

export const mensagemCadastroNomeAtrasado = 'Cadastro completo, mas o nome no menu pode demorar a atualizar.'

export const mensagemCadastroJaExistia = 'Seu cadastro já existia; carregamos seus dados.'

const mensagemSemEmail = 'Sua conta está sem e-mail. Fale com a gente para completar seu cadastro.'

const mensagemSemSessao = 'Sua sessão terminou. Entre de novo para continuar.'

const mensagemDadosInvalidos = 'Confira o nome e o WhatsApp e tente de novo.'

export function prepararMinhaConta({ nome, whatsapp }) {
  const nomeLimpo = normalizarNome(String(nome ?? ''))
  const whatsappTexto = String(whatsapp ?? '')
  if (erroNome(nomeLimpo) || erroWhatsapp(whatsappTexto)) throw new ErroServico('dados-invalidos', mensagemDadosInvalidos)
  return { nome: nomeLimpo, whatsapp: normalizarWhatsapp(whatsappTexto) }
}

const formatoVaga = /^[1-5]$/

function textoDaCopia(valor) {
  return typeof valor === 'string' ? valor.trim() : ''
}

export function padraoDoPerfil(perfil) {
  const copia = perfil?.enderecoPadrao
  const id = perfil?.enderecoPadraoId
  if (typeof id !== 'string' || !formatoVaga.test(id) || copia === null || typeof copia !== 'object') return null
  const padrao = { apelido: textoDaCopia(copia.apelido), logradouro: textoDaCopia(copia.logradouro), numero: textoDaCopia(copia.numero) }
  return padrao.apelido || padrao.logradouro ? padrao : null
}

export function extrairMinhaConta(perfil, emailDaSessao) {
  if (!perfil) throw new ErroServico('sem-cadastro', mensagemSemCadastro)
  return {
    nome: typeof perfil.nome === 'string' ? perfil.nome : '',
    whatsapp: typeof perfil.whatsapp === 'string' ? perfil.whatsapp : '',
    email: typeof perfil.email === 'string' && perfil.email !== '' ? perfil.email : (emailDaSessao ?? ''),
    enderecoPadrao: padraoDoPerfil(perfil),
  }
}

export async function sessaoAtual(operacao) {
  let modulo
  try {
    modulo = await carregarAuth()
    await modulo.auth.authStateReady()
  } catch (erro) {
    throw traduzirErroFirebase(erro, operacao)
  }
  const usuario = modulo.auth.currentUser
  if (!usuario) throw new ErroServico('sem-sessao', mensagemSemSessao)
  return { modulo, usuario }
}

export function rascunhoCadastro(usuario) {
  return {
    completo: false,
    nome: typeof usuario.displayName === 'string' ? usuario.displayName.trim() : '',
    whatsapp: '',
    email: usuario.email ?? '',
  }
}

export async function lerMinhaConta() {
  const { usuario } = await sessaoAtual('ler-conta')
  const perfil = await lerPerfil(usuario.uid)
  if (!perfil) return rascunhoCadastro(usuario)
  return { completo: true, ...extrairMinhaConta(perfil, usuario.email) }
}

async function gravarNomeDaConta(modulo, usuario, nome) {
  if (usuario.displayName === nome) return true
  try {
    await modulo.sdk.updateProfile(usuario, { displayName: nome })
  } catch (erro) {
    if (import.meta.env.DEV) console.error('[conta] dados salvos, mas falhou ao atualizar o nome da conta', erro)
    return false
  }
  republicarUsuario(modulo, usuario)
  return true
}

async function perfilJaExistente(uid) {
  try {
    return await lerPerfil(uid)
  } catch (erro) {
    if (import.meta.env.DEV) console.error('[conta] falhou ao reler o cadastro após erro na criação', erro)
    return null
  }
}

export async function completarCadastro(valores) {
  const dados = prepararMinhaConta(valores)
  const { modulo, usuario } = await sessaoAtual('completar-cadastro')
  if (!usuario.email) throw new ErroServico('sem-email', mensagemSemEmail)
  try {
    await criarPerfil(usuario.uid, { ...prepararDados(dados), email: usuario.email })
  } catch (erro) {
    const existente = await perfilJaExistente(usuario.uid)
    if (!existente) throw erro
    return { completo: true, ...extrairMinhaConta(existente, usuario.email), jaExistia: true, mensagem: mensagemCadastroJaExistia }
  }
  const nomeGravado = await gravarNomeDaConta(modulo, usuario, dados.nome)
  return {
    completo: true,
    ...dados,
    email: usuario.email,
    jaExistia: false,
    mensagem: nomeGravado ? mensagemCadastroCompleto : mensagemCadastroNomeAtrasado,
  }
}

export async function atualizarMinhaConta(valores) {
  const dados = prepararMinhaConta(valores)
  const { modulo, usuario } = await sessaoAtual('atualizar-conta')
  await atualizarPerfil(usuario.uid, dados)
  const nomeGravado = await gravarNomeDaConta(modulo, usuario, dados.nome)
  return { ...dados, mensagem: nomeGravado ? mensagemContaAtualizada : mensagemNomeAtrasado }
}
