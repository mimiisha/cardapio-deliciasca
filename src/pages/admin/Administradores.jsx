import { useEffect, useState } from 'react'
import { useSessao } from '../../hooks/useSessao.js'
import { listarAdmins } from '../../servicos/admin/admins.js'
import { ErroServico, mensagemGenerica } from '../../servicos/erros.js'
import AdicionarAdmin from './AdicionarAdmin.jsx'
import CartaoTela from './CartaoTela.jsx'

const formatoData = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })

const classeBotaoContorno =
  'inline-flex min-h-11 items-center justify-center rounded-full border-2 border-tinta px-5 text-base font-semibold text-tinta hover:bg-tinta/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tinta'

function mensagemDoErro(erro) {
  return erro instanceof ErroServico ? erro.message : mensagemGenerica
}

function ItemAdmin({ admin, ehVoce }) {
  return (
    <li className="rounded-2xl border border-borda bg-creme p-4">
      <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className="text-base font-semibold text-tinta">{admin.nome ?? 'Sem nome'}</span>
        {ehVoce && (
          <span className="rounded-full bg-manteiga px-2.5 py-0.5 text-sm font-semibold text-tinta">Você</span>
        )}
      </p>
      {admin.email && <p className="mt-1 text-sm text-tinta [overflow-wrap:anywhere]">{admin.email}</p>}
      {admin.criadoEm && (
        <p className="mt-1 text-sm text-tinta-suave">
          Na administração desde <time dateTime={admin.criadoEm.toISOString()}>{formatoData.format(admin.criadoEm)}</time>
        </p>
      )}
    </li>
  )
}

function ListaAdmins({ carregando, erro, admins, uidAtual, aoTentarDeNovo }) {
  if (erro && !carregando) {
    return (
      <div role="alert" className="rounded-2xl border-2 border-tomate-escuro bg-creme p-4">
        <p className="text-base font-semibold text-tinta">Não foi possível carregar a lista.</p>
        <p className="mt-1 text-sm text-tinta">{erro}</p>
        <button type="button" onClick={aoTentarDeNovo} className={`${classeBotaoContorno} mt-3`}>
          Tentar de novo
        </button>
      </div>
    )
  }
  if (carregando && (erro || admins === null)) {
    return <p className="text-base text-tinta-suave">Carregando a lista…</p>
  }
  if (admins.length === 0) {
    return <p className="text-base text-tinta-suave">Nenhuma pessoa na lista.</p>
  }
  return (
    <ul role="list" className="grid gap-3 sm:grid-cols-2">
      {admins.map((admin) => (
        <ItemAdmin key={admin.uid} admin={admin} ehVoce={admin.uid === uidAtual} />
      ))}
    </ul>
  )
}

function Administradores({ tituloRef }) {
  const { uid } = useSessao()
  const [pedido, setPedido] = useState(0)
  const [resultado, setResultado] = useState({ pedido: -1, admins: null, erro: '' })
  const [aviso, setAviso] = useState('')

  useEffect(() => {
    let ativo = true
    listarAdmins().then(
      (admins) => {
        if (ativo) setResultado({ pedido, admins, erro: '' })
      },
      (erro) => {
        if (ativo) setResultado((atual) => ({ ...atual, pedido, erro: mensagemDoErro(erro) }))
      },
    )
    return () => {
      ativo = false
    }
  }, [pedido])

  const carregando = resultado.pedido !== pedido

  function tentarDeNovo() {
    tituloRef?.current?.focus()
    setPedido((atual) => atual + 1)
  }

  function aoPromover(cliente) {
    setAviso(`${cliente.nome || cliente.email} agora faz parte da administração.`)
    setPedido((atual) => atual + 1)
    tituloRef?.current?.focus()
  }

  return (
    <CartaoTela>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 ref={tituloRef} tabIndex={-1} className="font-display text-3xl text-tinta focus:outline-none sm:text-4xl">
            Administradores
          </h1>
          <p className="mt-2 max-w-prose text-base text-tinta-suave">
            Quem está aqui tem acesso ao painel. Só pessoas que já têm cadastro no site podem ser promovidas.
          </p>
        </div>
        <AdicionarAdmin admins={resultado.admins ?? []} uidAtual={uid} aoPromover={aoPromover} />
      </div>

      <div role="status">
        {aviso && <p className="mt-4 rounded-xl bg-manteiga px-4 py-3 text-base font-semibold text-tinta">{aviso}</p>}
      </div>
      <p role="status" className="sr-only">
        {carregando ? 'Carregando a lista…' : ''}
      </p>

      <h2 className="mt-6 font-display text-xl text-tinta">Cadastrados</h2>
      <div className="mt-3" aria-busy={carregando ? 'true' : undefined}>
        <ListaAdmins
          carregando={carregando}
          erro={resultado.erro}
          admins={resultado.admins}
          uidAtual={uid}
          aoTentarDeNovo={tentarDeNovo}
        />
      </div>
    </CartaoTela>
  )
}

export default Administradores
