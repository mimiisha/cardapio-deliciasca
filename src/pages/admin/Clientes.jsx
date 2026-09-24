import { useEffect, useId, useState } from 'react'
import { compararPorNome, LIMITE_CLIENTES, listarClientes } from '../../servicos/admin/clientes.js'
import { ErroServico, mensagemGenerica } from '../../servicos/erros.js'
import CartaoTela from './CartaoTela.jsx'

const formatoData = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })

const ESPERA_ANUNCIO = 700

const classeFoco = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tinta'

const classeBotaoContorno = `inline-flex min-h-11 items-center justify-center rounded-full border-2 border-tinta px-5 text-base font-semibold text-tinta hover:bg-tinta/10 aria-disabled:cursor-wait aria-disabled:hover:bg-transparent ${classeFoco}`

const classeCampo = `block min-h-11 w-full rounded-xl border-2 border-tinta-suave bg-papel px-3 py-2 text-base text-tinta ${classeFoco}`

const ordens = {
  nome: { rotulo: 'Nome (A–Z)', comparar: compararPorNome },
  recentes: { rotulo: 'Cadastro mais recente', comparar: compararPorCadastro },
}

function compararPorCadastro(a, b) {
  if (!a.criadoEm !== !b.criadoEm) return a.criadoEm ? -1 : 1
  const diferenca = a.criadoEm && b.criadoEm ? b.criadoEm.getTime() - a.criadoEm.getTime() : 0
  return diferenca || compararPorNome(a, b)
}

function mensagemDoErro(erro) {
  return erro instanceof ErroServico ? erro.message : mensagemGenerica
}

function semAcento(texto) {
  return texto.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLocaleLowerCase('pt-BR')
}

function soDigitos(texto) {
  return texto.replace(/\D/g, '')
}

function filtrar(clientes, termo) {
  const termoNome = semAcento(termo.trim())
  if (!termoNome) return clientes
  const termoDigitos = soDigitos(termo)
  return clientes.filter(
    (cliente) =>
      semAcento(cliente.nome).includes(termoNome) ||
      (termoDigitos !== '' && cliente.whatsapp !== undefined && soDigitos(cliente.whatsapp).includes(termoDigitos)),
  )
}

function formatarWhatsapp(e164) {
  const digitos = soDigitos(e164)
  if (!digitos.startsWith('55')) return e164
  const nacional = digitos.slice(2)
  const ddd = nacional.slice(0, 2)
  const numero = nacional.slice(2)
  if (numero.length === 9) return `(${ddd}) ${numero.slice(0, 5)}-${numero.slice(5)}`
  if (numero.length === 8) return `(${ddd}) ${numero.slice(0, 4)}-${numero.slice(4)}`
  return e164
}

function formatarEndereco({ logradouro, numero, complemento, bairro }) {
  const linha = complemento ? `${logradouro}, ${numero}, ${complemento}` : `${logradouro}, ${numero}`
  return `${linha} — ${bairro}`
}

function textoPedidos(total) {
  if (total === 0) return 'Nenhum pedido ainda'
  return total === 1 ? '1 pedido' : `${total} pedidos`
}

function textoContador(total) {
  return total === 1 ? '1 cliente' : `${total} clientes`
}

function Data({ valor }) {
  return <time dateTime={valor.toISOString()}>{formatoData.format(valor)}</time>
}

function LinkWhatsapp({ whatsapp, nome }) {
  return (
    <a
      href={`https://wa.me/${soDigitos(whatsapp)}`}
      target="_blank"
      rel="noopener noreferrer"
      className={`-mx-1 inline-flex min-h-11 items-center rounded-lg px-1 text-base font-semibold text-tomate-escuro underline decoration-2 underline-offset-4 hover:text-tinta ${classeFoco}`}
    >
      <span className="sr-only">Conversar com {nome || 'cliente sem nome'} no WhatsApp: </span>
      {formatarWhatsapp(whatsapp)}
      <span className="sr-only"> (abre em nova aba)</span>
    </a>
  )
}

function ItemCliente({ cliente }) {
  const { nome, whatsapp, enderecoPadrao, totalPedidos, ultimoPedidoEm, criadoEm } = cliente
  return (
    <li className="flex flex-col rounded-2xl border border-borda bg-creme p-4">
      <h2 className="text-lg font-semibold text-tinta [overflow-wrap:anywhere]">{nome || 'Sem nome'}</h2>
      {whatsapp ? (
        <p className="mt-0.5">
          <LinkWhatsapp whatsapp={whatsapp} nome={nome} />
        </p>
      ) : (
        <p className="mt-1 text-sm text-tinta-suave">WhatsApp não informado</p>
      )}
      <div className="mt-2 text-sm">
        {enderecoPadrao ? (
          <>
            <p className="text-tinta [overflow-wrap:anywhere]">{formatarEndereco(enderecoPadrao)}</p>
            {enderecoPadrao.referencia && (
              <p className="mt-0.5 text-tinta-suave [overflow-wrap:anywhere]">Referência: {enderecoPadrao.referencia}</p>
            )}
          </>
        ) : (
          <p className="text-tinta-suave">Endereço ainda não informado</p>
        )}
      </div>
      <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-tinta">
        <span className="rounded-full bg-manteiga px-2.5 py-0.5 font-semibold">{textoPedidos(totalPedidos)}</span>
        {ultimoPedidoEm && (
          <span>
            Último pedido em <Data valor={ultimoPedidoEm} />
          </span>
        )}
      </p>
      {criadoEm && (
        <p className="mt-2 text-sm text-tinta-suave">
          Cliente desde <Data valor={criadoEm} />
        </p>
      )}
    </li>
  )
}

function ListaClientes({ carregando, erro, clientes, visiveis, termo, aoTentarDeNovo }) {
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
  if (carregando && (erro || clientes === null)) {
    return <p className="text-base text-tinta-suave">Carregando a lista…</p>
  }
  if (clientes.length === 0) {
    return <p className="text-base text-tinta-suave">Nenhum cliente cadastrado ainda.</p>
  }
  if (visiveis.length === 0) {
    return (
      <p className="text-base text-tinta-suave [overflow-wrap:anywhere]">
        Nenhum cliente encontrado para “{termo.trim()}”.
      </p>
    )
  }
  return (
    <ul role="list" className="grid gap-3 lg:grid-cols-2">
      {visiveis.map((cliente) => (
        <ItemCliente key={cliente.uid} cliente={cliente} />
      ))}
    </ul>
  )
}

function Clientes({ tituloRef }) {
  const idBusca = useId()
  const idOrdem = useId()
  const [pedido, setPedido] = useState(0)
  const [resultado, setResultado] = useState({ pedido: -1, clientes: null, excedeuLimite: false, erro: '' })
  const [termo, setTermo] = useState('')
  const [ordem, setOrdem] = useState('nome')

  useEffect(() => {
    let ativo = true
    listarClientes().then(
      ({ clientes, excedeuLimite }) => {
        if (ativo) setResultado({ pedido, clientes, excedeuLimite, erro: '' })
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
  const { clientes, excedeuLimite, erro } = resultado
  const pronto = clientes !== null && !erro
  const visiveis = pronto ? [...filtrar(clientes, termo)].sort(ordens[ordem].comparar) : []
  const textoStatus = carregando ? 'Carregando a lista…' : pronto ? textoContador(visiveis.length) : ''
  const [anuncio, setAnuncio] = useState('')

  useEffect(() => {
    const espera = setTimeout(() => setAnuncio(textoStatus), carregando ? 0 : ESPERA_ANUNCIO)
    return () => clearTimeout(espera)
  }, [textoStatus, termo, carregando])

  function atualizar() {
    if (carregando) return
    setPedido((atual) => atual + 1)
  }

  function tentarDeNovo() {
    tituloRef?.current?.focus()
    setPedido((atual) => atual + 1)
  }

  return (
    <CartaoTela>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 ref={tituloRef} tabIndex={-1} className="font-display text-3xl text-tinta focus:outline-none sm:text-4xl">
            Clientes
          </h1>
          <p className="mt-2 max-w-prose text-base text-tinta-suave">
            Quem tem cadastro no site, com contato, endereço e quantos pedidos já fez.
          </p>
        </div>
        <button
          type="button"
          onClick={atualizar}
          aria-disabled={carregando ? 'true' : undefined}
          className={`${classeBotaoContorno} self-start`}
        >
          {carregando && clientes !== null ? 'Atualizando…' : 'Atualizar'}
        </button>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
        <div className="space-y-1.5">
          <label htmlFor={idBusca} className="block text-sm font-semibold text-tinta">
            Buscar por nome ou WhatsApp
          </label>
          <input
            id={idBusca}
            type="search"
            value={termo}
            onChange={(evento) => setTermo(evento.target.value)}
            maxLength={100}
            autoComplete="off"
            spellCheck={false}
            className={classeCampo}
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor={idOrdem} className="block text-sm font-semibold text-tinta">
            Ordenar por
          </label>
          <select
            id={idOrdem}
            value={ordem}
            onChange={(evento) => setOrdem(evento.target.value)}
            className={`${classeCampo} sm:w-auto`}
          >
            {Object.entries(ordens).map(([valor, { rotulo }]) => (
              <option key={valor} value={valor}>
                {rotulo}
              </option>
            ))}
          </select>
        </div>
      </div>

      <p role="status" className="sr-only">
        {anuncio}
      </p>
      <p aria-hidden="true" className="mt-4 text-sm font-semibold text-tinta">
        {pronto ? textoContador(visiveis.length) : ''}
      </p>

      {pronto && excedeuLimite && (
        <p className="mt-3 rounded-xl bg-manteiga px-4 py-3 text-base font-semibold text-tinta">
          Mostrando os primeiros {LIMITE_CLIENTES} clientes. Os demais ainda não aparecem nesta lista.
        </p>
      )}

      <div className="mt-3" aria-busy={carregando ? 'true' : undefined}>
        <ListaClientes
          carregando={carregando}
          erro={erro}
          clientes={clientes}
          visiveis={visiveis}
          termo={termo}
          aoTentarDeNovo={tentarDeNovo}
        />
      </div>
    </CartaoTela>
  )
}

export default Clientes
