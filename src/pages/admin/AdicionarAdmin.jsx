import { useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import CampoTexto from '../../components/CampoTexto.jsx'
import Icone from '../../components/admin/Icone.jsx'
import { erroEmail, removerVazios } from '../../components/validacao.js'
import { useFormulario } from '../../hooks/useFormulario.js'
import { promoverAdmin } from '../../servicos/admin/admins.js'
import { buscarClientePorEmail } from '../../servicos/admin/clientes.js'
import { ErroServico, mensagemGenerica } from '../../servicos/erros.js'

const classeBotao =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 py-2 text-center text-base font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tinta'

const classePrimario = `${classeBotao} bg-tinta text-mostarda hover:bg-tomate-escuro hover:text-papel aria-disabled:cursor-wait aria-disabled:hover:bg-tinta aria-disabled:hover:text-mostarda`

const classeSecundario = `${classeBotao} border-2 border-tinta text-tinta hover:bg-tinta/10`

const mensagemNaoEncontrado =
  'Não encontramos cadastro com esse e-mail. Peça para a pessoa se cadastrar em /cadastro primeiro.'

function validar({ email }) {
  return removerVazios({ email: erroEmail(email) })
}

function situacaoDe(cliente, admins, uidAtual) {
  if (cliente.uid === uidAtual) return 'propria-conta'
  if (admins.some((admin) => admin.uid === cliente.uid)) return 'ja-admin'
  return 'disponivel'
}

const textosSituacao = {
  'propria-conta': 'Essa é a sua conta. Você já tem acesso de administração.',
  'ja-admin': 'Essa pessoa já tem acesso de administração.',
}

function ConteudoDialogo({ admins, uidAtual, campoRef, resultadoRef, bloqueioRef, aoCancelar, aoConcluir }) {
  const [encontrado, setEncontrado] = useState(null)
  const [promovendo, setPromovendo] = useState(false)
  const [avisoPromocao, setAvisoPromocao] = useState('')

  const { valores, erros, aviso, enviando, alterar, registrar, aoEnviar } = useFormulario({
    inicial: { email: '' },
    validar,
    enviar: async ({ email }) => {
      const cliente = await buscarClientePorEmail(email)
      if (!cliente) return mensagemNaoEncontrado
      flushSync(() => {
        setAvisoPromocao('')
        setEncontrado(cliente)
      })
      resultadoRef.current?.focus()
      return ''
    },
  })

  function registrarCampo(elemento) {
    registrar('email')(elemento)
    campoRef.current = elemento
  }

  function buscarOutro() {
    if (bloqueioRef.current) return
    flushSync(() => {
      setEncontrado(null)
      setAvisoPromocao('')
    })
    campoRef.current?.focus()
  }

  async function tornarAdmin() {
    if (bloqueioRef.current) return
    bloqueioRef.current = true
    setPromovendo(true)
    setAvisoPromocao('')
    try {
      await promoverAdmin(encontrado)
      aoConcluir(encontrado)
    } catch (erro) {
      setAvisoPromocao(erro instanceof ErroServico ? erro.message : mensagemGenerica)
    } finally {
      bloqueioRef.current = false
      setPromovendo(false)
    }
  }

  const situacao = encontrado ? situacaoDe(encontrado, admins, uidAtual) : null
  const ocupado = enviando || promovendo

  return (
    <>
      {encontrado ? (
        <div className="mt-4">
          <h3
            ref={resultadoRef}
            tabIndex={-1}
            aria-describedby={
              situacao === 'disponivel' ? 'cadastro-encontrado' : 'cadastro-encontrado situacao-encontrado'
            }
            className="text-base font-semibold text-tinta focus:outline-none"
          >
            Cadastro encontrado
          </h3>
          <div id="cadastro-encontrado" className="mt-2 rounded-2xl border border-borda bg-creme p-4">
            <p className="text-base font-semibold text-tinta">{encontrado.nome || 'Sem nome'}</p>
            <p className="mt-1 text-sm text-tinta [overflow-wrap:anywhere]">{encontrado.email}</p>
          </div>
          {situacao !== 'disponivel' && (
            <p id="situacao-encontrado" className="mt-3 text-base font-medium text-tinta">
              {textosSituacao[situacao]}
            </p>
          )}
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            {situacao === 'disponivel' && (
              <button
                type="button"
                onClick={tornarAdmin}
                aria-disabled={promovendo ? 'true' : undefined}
                className={classePrimario}
              >
                {promovendo ? 'Salvando…' : 'Dar acesso de administração'}
              </button>
            )}
            <button
              type="button"
              onClick={buscarOutro}
              aria-disabled={promovendo ? 'true' : undefined}
              className={`${classeSecundario} aria-disabled:cursor-wait aria-disabled:hover:bg-transparent`}
            >
              Buscar outro e-mail
            </button>
            <button
              type="button"
              onClick={aoCancelar}
              aria-disabled={promovendo ? 'true' : undefined}
              className={`${classeSecundario} aria-disabled:cursor-wait aria-disabled:hover:bg-transparent`}
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <form noValidate onSubmit={aoEnviar} className="mt-4 space-y-4">
          <CampoTexto
            id="email-novo-admin"
            rotulo="E-mail da pessoa"
            type="email"
            autoComplete="off"
            spellCheck={false}
            autoCapitalize="none"
            maxLength={254}
            dica="Use o e-mail que a pessoa usou no cadastro do site."
            value={valores.email}
            onChange={alterar('email')}
            inputRef={registrarCampo}
            erro={erros.email}
          />
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <button
              type="submit"
              aria-disabled={enviando ? 'true' : undefined}
              onClick={(evento) => {
                if (enviando) evento.preventDefault()
              }}
              className={classePrimario}
            >
              {enviando ? 'Buscando…' : 'Buscar'}
            </button>
            <button type="button" onClick={aoCancelar} className={classeSecundario}>
              Cancelar
            </button>
          </div>
        </form>
      )}

      <div role="status">
        {ocupado ? (
          <span className="sr-only">{enviando ? 'Buscando…' : 'Salvando…'}</span>
        ) : (
          (avisoPromocao || aviso) && (
            <p className="mt-4 text-base font-medium text-tinta">{avisoPromocao || aviso}</p>
          )
        )}
      </div>
    </>
  )
}

function AdicionarAdmin({ admins, uidAtual, aoPromover }) {
  const [abertura, setAbertura] = useState(0)
  const dialogoRef = useRef(null)
  const botaoRef = useRef(null)
  const campoRef = useRef(null)
  const concluiu = useRef(false)
  const resultadoRef = useRef(null)
  const bloqueioRef = useRef(false)

  function abrir() {
    concluiu.current = false
    flushSync(() => setAbertura((atual) => atual + 1))
    dialogoRef.current?.showModal()
    campoRef.current?.focus()
  }

  function fechar() {
    if (bloqueioRef.current) return
    dialogoRef.current?.close()
  }

  function aoCancelarDialogo(evento) {
    if (bloqueioRef.current) evento.preventDefault()
  }

  function aoFechar() {
    if (bloqueioRef.current) {
      dialogoRef.current?.showModal()
      resultadoRef.current?.focus()
      return
    }
    if (!concluiu.current) botaoRef.current?.focus()
  }

  function aoConcluir(cliente) {
    concluiu.current = true
    bloqueioRef.current = false
    fechar()
    aoPromover(cliente)
  }

  return (
    <>
      <button ref={botaoRef} type="button" onClick={abrir} className={`${classePrimario} shrink-0 self-start`}>
        <Icone nome="adicionar" />
        Adicionar à administração
      </button>

      <dialog
        ref={dialogoRef}
        aria-labelledby="titulo-adicionar-admin"
        aria-describedby="descricao-adicionar-admin"
        onCancel={aoCancelarDialogo}
        onClose={aoFechar}
        className="m-auto max-h-[calc(100dvh-1.5rem)] w-[min(calc(100%-1.5rem),32rem)] max-w-none overflow-y-auto rounded-3xl border border-borda bg-papel p-5 text-tinta shadow-2xl backdrop:bg-tinta/50 sm:p-7"
      >
        <h2 id="titulo-adicionar-admin" className="font-display text-2xl text-tinta">
          Adicionar à administração
        </h2>
        <p id="descricao-adicionar-admin" className="mt-2 text-base text-tinta-suave">
          Busque pelo e-mail de alguém que já tem cadastro no site.
        </p>
        {abertura > 0 && (
          <ConteudoDialogo
            key={abertura}
            admins={admins}
            uidAtual={uidAtual}
            campoRef={campoRef}
            resultadoRef={resultadoRef}
            bloqueioRef={bloqueioRef}
            aoCancelar={fechar}
            aoConcluir={aoConcluir}
          />
        )}
      </dialog>
    </>
  )
}

export default AdicionarAdmin
