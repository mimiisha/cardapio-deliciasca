import { useRef, useState } from 'react'
import Avatar from '../../components/Avatar.jsx'
import { coresFundo, escolhaDaFoto, ehRosto, fotoDaEscolha, rotuloAvatar } from '../../components/icones/avatares.js'
import { corPadrao } from '../../components/fotoAvatar.js'
import { useSessao } from '../../hooks/useSessao.js'
import { ErroServico, mensagemGenerica } from '../../servicos/erros.js'
import { escolherAvatar } from '../../servicos/perfil.js'
import { classeBotaoPrincipal } from './FormularioEndereco.jsx'
import SeletorAvatar from './SeletorAvatar.jsx'

function FotoPerfil() {
  const sessao = useSessao()
  const atual = escolhaDaFoto(sessao.foto)
  const [chave, setChave] = useState(atual.chave)
  const [cor, setCor] = useState(atual.cor)
  const [enviando, setEnviando] = useState(false)
  const [aviso, setAviso] = useState('')
  const emAndamento = useRef(false)

  const escolha = { chave, cor: chave !== null && ehRosto(chave) ? (cor ?? corPadrao(chave)) : null }
  const fotoEscolhida = fotoDaEscolha(escolha)
  const igual = fotoEscolhida === fotoDaEscolha(atual)
  const bloqueado = igual || enviando
  const nomeCor = coresFundo.find((opcao) => opcao.chave === escolha.cor)?.rotulo
  const descricaoPrevia =
    chave === null
      ? 'Iniciais do nome'
      : nomeCor
        ? `${rotuloAvatar(chave)}, fundo ${nomeCor.toLocaleLowerCase('pt-BR')}`
        : rotuloAvatar(chave)

  function escolherImagem(nova) {
    setChave(nova)
    setAviso('')
  }

  function escolherCor(nova) {
    setCor(nova)
    setAviso('')
  }

  async function salvar(evento) {
    evento.preventDefault()
    if (emAndamento.current) return
    if (igual) {
      setAviso('Escolha outra imagem ou cor antes de salvar.')
      return
    }
    emAndamento.current = true
    setEnviando(true)
    setAviso('')
    try {
      const resultado = await escolherAvatar(escolha)
      setAviso(resultado.mensagem)
    } catch (erro) {
      if (!(erro instanceof ErroServico) && import.meta.env.DEV) console.error('[foto-perfil] erro inesperado', erro)
      setAviso(erro instanceof ErroServico ? erro.message : mensagemGenerica)
    } finally {
      emAndamento.current = false
      setEnviando(false)
    }
  }

  return (
    <form noValidate onSubmit={salvar}>
      <div className="flex items-center gap-4">
        <Avatar uid={sessao.uid} nome={sessao.nome || 'Cliente'} foto={fotoEscolhida ?? ''} tamanho={96} />
        <p className="min-w-0 text-base text-tinta">
          <span className="block text-sm font-semibold text-tinta-suave">Prévia</span>
          {descricaoPrevia}
        </p>
      </div>
      <div className="mt-6">
        <SeletorAvatar
          uid={sessao.uid}
          nome={sessao.nome}
          escolha={escolha}
          corEscolhida={cor}
          aoEscolherImagem={escolherImagem}
          aoEscolherCor={escolherCor}
        />
      </div>
      <button
        type="submit"
        aria-disabled={bloqueado ? 'true' : undefined}
        className={`mt-6 w-full sm:w-auto ${classeBotaoPrincipal}`}
      >
        {enviando ? 'Salvando…' : 'Salvar foto de perfil'}
      </button>
      <p role="status" className={aviso ? 'mt-4 text-base font-semibold text-tinta' : 'sr-only'}>
        {aviso}
      </p>
    </form>
  )
}

export default FotoPerfil
