import { fotoDaEscolha } from '../components/icones/avatares.js'
import { republicarUsuario } from './auth.js'
import { sessaoAtual } from './conta.js'
import { ErroServico, traduzirErroFirebase } from './erros.js'

export const mensagemAvatarAtualizado = 'Foto de perfil atualizada.'

const mensagemAvatarInvalido = 'Escolha uma imagem e uma cor da lista.'

export function prepararAvatar(escolha) {
  const chave = escolha?.chave
  const cor = escolha?.cor ?? null
  const valida = (chave === null || typeof chave === 'string') && (cor === null || typeof cor === 'string')
  const foto = valida ? fotoDaEscolha({ chave, cor }) : null
  if (typeof foto !== 'string') throw new ErroServico('avatar-invalido', mensagemAvatarInvalido)
  return foto
}

export async function escolherAvatar(escolha) {
  const foto = prepararAvatar(escolha)
  const { modulo, usuario } = await sessaoAtual('escolher-avatar')
  try {
    await modulo.sdk.updateProfile(usuario, { photoURL: foto })
  } catch (erro) {
    throw traduzirErroFirebase(erro, 'escolher-avatar')
  }
  republicarUsuario(modulo, usuario)
  return { foto, mensagem: mensagemAvatarAtualizado }
}
