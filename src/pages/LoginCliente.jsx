import { useEffect, useRef, useState } from 'react'
import LayoutAuth from '../components/LayoutAuth.jsx'
import FormularioAuth from '../components/FormularioAuth.jsx'
import CampoTexto from '../components/CampoTexto.jsx'
import CampoSenha from '../components/CampoSenha.jsx'
import LinkAlternativo from '../components/LinkAlternativo.jsx'
import { erroEmail, removerVazios } from '../components/validacao.js'
import { useFormulario } from '../hooks/useFormulario.js'
import { navegar } from '../hooks/useRota.js'
import { entrarCliente, reenviarVerificacao } from '../servicos/login.js'
import { ErroServico, mensagemEmailNaoVerificado, mensagemGenerica } from '../servicos/erros.js'

function validar({ email, senha }) {
  return removerVazios({
    email: erroEmail(email),
    senha: senha === '' ? 'Informe a senha.' : undefined,
  })
}

function ReenviarConfirmacao() {
  const [status, setStatus] = useState('')
  const [enviando, setEnviando] = useState(false)
  const emAndamento = useRef(false)

  async function aoClicar() {
    if (emAndamento.current) return
    emAndamento.current = true
    setEnviando(true)
    setStatus('')
    try {
      await reenviarVerificacao()
      setStatus('Enviamos um novo link de confirmação. Confira também a caixa de spam.')
    } catch (erro) {
      if (erro instanceof ErroServico) {
        setStatus(erro.message)
      } else {
        if (import.meta.env.DEV) console.error('[reenviar] erro inesperado', erro)
        setStatus(mensagemGenerica)
      }
    } finally {
      emAndamento.current = false
      setEnviando(false)
    }
  }

  return (
    <div className="mt-4 space-y-2">
      <button
        type="button"
        onClick={aoClicar}
        aria-disabled={enviando ? 'true' : undefined}
        className="flex min-h-11 w-full items-center justify-center rounded-full border-2 border-tinta px-6 text-base font-semibold text-tinta hover:bg-manteiga focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tinta aria-disabled:cursor-wait"
      >
        {enviando ? 'Enviando…' : 'Reenviar e-mail de confirmação'}
      </button>
      <p aria-live="polite" role="status" className="text-base font-medium text-tinta">
        {enviando ? <span className="sr-only">Enviando…</span> : status}
      </p>
    </div>
  )
}

function AvisoSaida() {
  const [saiu] = useState(() => window.history.state?.saiu === true)
  const [texto, setTexto] = useState('')

  useEffect(() => {
    if (!saiu) return undefined
    if (window.history.state?.saiu === true) window.history.replaceState(null, '')
    const espera = setTimeout(() => setTexto('Você saiu da sua conta.'), 150)
    return () => clearTimeout(espera)
  }, [saiu])

  return (
    <p role="status" className={texto ? 'mt-4 text-base font-medium text-tinta' : 'sr-only'}>
      {texto}
    </p>
  )
}

function LoginCliente({ tituloRef }) {
  const [naoVerificado, setNaoVerificado] = useState(false)

  async function enviar(valores) {
    setNaoVerificado(false)
    const { emailVerificado } = await entrarCliente(valores)
    if (!emailVerificado) {
      setNaoVerificado(true)
      return mensagemEmailNaoVerificado
    }
    navegar('/')
  }

  const { valores, erros, aviso, enviando, alterar, registrar, aoEnviar } = useFormulario({
    inicial: { email: '', senha: '' },
    validar,
    limparAposEnvio: { senha: '' },
    enviar,
  })

  return (
    <LayoutAuth tituloRef={tituloRef} titulo="Entrar" subtitulo="Acesse sua conta para encomendar suas marmitas.">
      <AvisoSaida />
      <FormularioAuth aoEnviar={aoEnviar} rotuloBotao="Entrar" aviso={aviso} enviando={enviando}>
        <CampoTexto
          id="cliente-email"
          rotulo="E-mail"
          erro={erros.email}
          inputRef={registrar('email')}
          name="email"
          type="email"
          autoComplete="username"
          maxLength={254}
          spellCheck={false}
          autoCapitalize="none"
          value={valores.email}
          onChange={alterar('email')}
        />
        <CampoSenha
          id="cliente-senha"
          rotulo="Senha"
          erro={erros.senha}
          inputRef={registrar('senha')}
          name="senha"
          autoComplete="current-password"
          value={valores.senha}
          onChange={alterar('senha')}
        />
      </FormularioAuth>
      {naoVerificado && <ReenviarConfirmacao />}
      <LinkAlternativo href="/cadastro">
        Não tenho conta<span className="sr-only">, criar conta</span>
      </LinkAlternativo>
    </LayoutAuth>
  )
}

export default LoginCliente
