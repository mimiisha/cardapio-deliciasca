import { useId, useState } from 'react'
import LinkWhatsapp from '../../components/admin/LinkWhatsapp.jsx'
import { formatarPreco } from '../../components/preco.js'
import CartaoTela from './CartaoTela.jsx'
import {
  agruparPorData,
  contarPorStatus,
  diaEmSaoPaulo,
  diasDaSemana,
  filtrarPedidos,
  formatarCabecalhoDia,
  formatarDiaAgenda,
  formatarIntervaloSemana,
  formatarPrazoAgenda,
  inicioSemanaDomingo,
  letraDoDia,
  numeroDoDia,
  proximaDataEntrega,
  resumoDaData,
  rotuloFormaPagamento,
  rotuloSituacao,
  rotuloStatus,
  rotuloStatusPagamento,
  situacaoDaData,
  somarDias,
  STATUS_PEDIDO,
  subtotalDoItem,
} from './agenda/modelo.js'

const classeFoco = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tinta'

const classeBotaoContorno = `inline-flex min-h-11 items-center justify-center gap-2 rounded-full border-2 border-tinta px-5 text-base font-semibold text-tinta hover:bg-tinta/10 ${classeFoco}`

const classeCampo = `block min-h-11 w-full rounded-xl border-2 border-tinta-suave bg-papel px-3 py-2 text-base text-tinta ${classeFoco}`

const classesSituacao = {
  aberta: 'bg-manteiga text-tinta',
  encerrada: 'border-2 border-tinta text-tinta',
  esgotada: 'bg-tinta text-papel',
  bloqueada: 'bg-tomate-escuro text-papel',
  passada: 'border-2 border-tinta-suave text-tinta-suave',
}

const classeEtiqueta = 'inline-flex items-center rounded-full px-3 py-0.5 text-sm font-semibold'

const semDados = { datas: [], pedidos: [] }

function textoQuantidade(total, singular, plural) {
  return total === 1 ? `1 ${singular}` : `${total} ${plural}`
}

function formatarEndereco({ logradouro, numero, complemento, bairro, cidade, uf, cep }) {
  const linha = [logradouro, numero, complemento].filter(Boolean).join(', ')
  const local = [bairro, [cidade, uf].filter(Boolean).join('/')].filter(Boolean).join(' — ')
  const completo = local ? `${linha} — ${local}` : linha
  return /^[0-9]{8}$/.test(cep ?? '') ? `${completo} — CEP ${cep.slice(0, 5)}-${cep.slice(5)}` : completo
}

function textoItem(item) {
  const tamanho = item.tamanhoNome ? ` (${item.tamanhoNome})` : ''
  return `${item.quantidade}× ${item.produtoNome}${tamanho} — ${formatarPreco(subtotalDoItem(item))}`
}

function Seta({ direcao }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-5 shrink-0"
    >
      <path d={direcao === 'anterior' ? 'M15 6l-6 6 6 6' : 'M9 6l6 6-6 6'} />
    </svg>
  )
}

function AvisoInativa() {
  return (
    <div className="mt-6 rounded-2xl border-2 border-tinta bg-manteiga p-4">
      <p className="text-base font-semibold text-tinta">
        Os pedidos pelo site ainda não estão ativos. Assim que estiverem, eles aparecem aqui.
      </p>
    </div>
  )
}

function nomeDoDia({ dia, ehHoje, temData, totalPedidos }) {
  const partes = [formatarDiaAgenda(dia)]
  if (ehHoje) partes.push('hoje')
  if (!temData && totalPedidos === 0) partes.push('sem entrega')
  else partes.push(totalPedidos === 0 ? 'nenhum pedido' : textoQuantidade(totalPedidos, 'pedido', 'pedidos'))
  return partes.join(', ')
}

function classeNumero({ selecionado, ehHoje, temData }) {
  if (selecionado) return 'bg-tinta text-mostarda font-semibold'
  if (ehHoje) return 'text-tomate-escuro font-bold ring-2 ring-inset ring-tomate-escuro'
  return temData ? 'text-tinta font-semibold' : 'text-tinta-suave'
}

function BotaoDia({ dia, selecionado, ehHoje, temData, totalPedidos, aoEscolher }) {
  return (
    <button
      type="button"
      aria-pressed={selecionado}
      aria-current={ehHoje ? 'date' : undefined}
      onClick={() => aoEscolher(dia)}
      className={`flex min-h-14 w-full flex-col items-center justify-center gap-1 rounded-xl py-1 hover:bg-tinta/5 ${classeFoco}`}
    >
      <span
        aria-hidden="true"
        className={`flex size-10 items-center justify-center rounded-full text-lg tabular-nums ${classeNumero({ selecionado, ehHoje, temData })}`}
      >
        {numeroDoDia(dia)}
      </span>
      <span aria-hidden="true" className={`size-1.5 rounded-full ${totalPedidos > 0 ? 'bg-tomate-escuro' : ''}`} />
      <span className="sr-only">{nomeDoDia({ dia, ehHoje, temData, totalPedidos })}</span>
    </button>
  )
}

function FaixaSemana({ selecionado, hoje, datasPorDia, grupos, aoEscolher, aoMudarSemana }) {
  const dias = diasDaSemana(selecionado)
  const intervalo = formatarIntervaloSemana(selecionado)
  const classeSeta = `inline-flex size-11 shrink-0 items-center justify-center rounded-full border-2 border-tinta text-tinta hover:bg-tinta/10 ${classeFoco}`

  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <button type="button" onClick={() => aoMudarSemana(-1)} className={classeSeta}>
          <Seta direcao="anterior" />
          <span className="sr-only">Semana anterior</span>
        </button>
        <p className="text-center text-sm font-semibold text-tinta">{intervalo}</p>
        <button type="button" onClick={() => aoMudarSemana(1)} className={classeSeta}>
          <Seta direcao="proxima" />
          <span className="sr-only">Próxima semana</span>
        </button>
      </div>
      <div role="group" aria-label={`Dias da semana, ${intervalo}`} className="-mx-3 mt-3 grid grid-cols-7 sm:mx-0">
        {dias.map((dia) => (
          <div key={dia} className="flex min-w-0 flex-col items-center">
            <span aria-hidden="true" className="text-sm font-semibold text-tinta-suave">
              {letraDoDia(dia)}
            </span>
            <BotaoDia
              dia={dia}
              selecionado={dia === selecionado}
              ehHoje={dia === hoje}
              temData={datasPorDia.has(dia)}
              totalPedidos={grupos.get(dia)?.length ?? 0}
              aoEscolher={aoEscolher}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

function Metrica({ rotulo, children }) {
  return (
    <div className="min-w-0">
      <dt className="text-sm text-tinta-suave">{rotulo}</dt>
      <dd className="text-lg font-semibold text-tinta [overflow-wrap:anywhere]">{children}</dd>
    </div>
  )
}

function ItemPedido({ item }) {
  return (
    <li className="[overflow-wrap:anywhere]">
      <span className="text-base text-tinta">{textoItem(item)}</span>
      {item.observacao && <span className="block text-sm text-tinta-suave">Observação: {item.observacao}</span>}
    </li>
  )
}

function CartaoPedido({ pedido }) {
  const idTitulo = useId()
  const { numero, cliente, modalidade, endereco, itens, observacao, statusPagamento, status, totalCentavos } = pedido
  const cancelado = status === 'cancelado'
  return (
    <li>
      <article aria-labelledby={idTitulo} className="flex h-full flex-col rounded-2xl border border-borda bg-papel p-4">
        <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
          <h3 id={idTitulo} className="text-lg font-semibold text-tinta [overflow-wrap:anywhere]">
            Pedido {numero}
          </h3>
          <p
            className={`${classeEtiqueta} ${cancelado ? 'border-2 border-tomate-escuro text-tomate-escuro' : 'bg-manteiga text-tinta'}`}
          >
            <span className="sr-only">Status: </span>
            {rotuloStatus(status)}
          </p>
        </div>

        <p className="mt-2 text-base font-semibold text-tinta [overflow-wrap:anywhere]">{cliente.nome || 'Sem nome'}</p>
        {cliente.whatsapp ? (
          <p>
            <LinkWhatsapp whatsapp={cliente.whatsapp} nome={cliente.nome} />
          </p>
        ) : (
          <p className="text-sm text-tinta-suave">WhatsApp não informado</p>
        )}

        <h4 className="mt-3 text-sm font-semibold text-tinta">Itens</h4>
        <ul role="list" className="mt-1 space-y-1.5">
          {itens.map((item, indice) => (
            <ItemPedido key={indice} item={item} />
          ))}
        </ul>

        {observacao && (
          <p className="mt-3 rounded-xl bg-creme px-3 py-2 text-sm text-tinta [overflow-wrap:anywhere]">
            <span className="font-semibold">Observação do pedido:</span> {observacao}
          </p>
        )}

        <dl className="mt-3 space-y-2 text-sm">
          <div>
            <dt className="font-semibold text-tinta">Recebimento</dt>
            <dd className="text-tinta [overflow-wrap:anywhere]">
              {modalidade === 'retirada' ? (
                'Retirada no local'
              ) : (
                <>
                  Entrega
                  <span className="block">{endereco ? formatarEndereco(endereco) : 'Endereço não informado'}</span>
                  {endereco?.referencia && (
                    <span className="block text-tinta-suave">Referência: {endereco.referencia}</span>
                  )}
                </>
              )}
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-tinta">Pagamento</dt>
            <dd className="text-tinta">
              {rotuloFormaPagamento(pedido.formaPagamento, modalidade)}
              <span className="block font-semibold">{rotuloStatusPagamento(statusPagamento)}</span>
            </dd>
          </div>
        </dl>

        <p className="mt-auto flex items-baseline justify-between gap-3 border-t border-borda pt-3 text-base text-tinta">
          <span className="font-semibold">Total</span>
          <span className="text-lg font-semibold">{formatarPreco(totalCentavos)}</span>
        </p>
        {cancelado && <p className="mt-1 text-sm text-tinta-suave">Pedido cancelado: não entra nos totais do dia.</p>}
      </article>
    </li>
  )
}

function PedidosDoDia({ pedidos }) {
  const idStatus = useId()
  const [status, setStatus] = useState('todos')
  const [soPendentes, setSoPendentes] = useState(false)
  const contagem = contarPorStatus(pedidos)
  const visiveis = filtrarPedidos(pedidos, { status, soPendentes })

  return (
    <div className="mt-6">
      <div className="grid gap-3 sm:grid-cols-[minmax(0,16rem)_auto] sm:items-end sm:justify-start sm:gap-6">
        <div className="space-y-1.5">
          <label htmlFor={idStatus} className="block text-sm font-semibold text-tinta">
            Status do pedido
          </label>
          <select id={idStatus} value={status} onChange={(evento) => setStatus(evento.target.value)} className={classeCampo}>
            <option value="todos">Todos ({pedidos.length})</option>
            {STATUS_PEDIDO.map((valor) => (
              <option key={valor} value={valor}>
                {rotuloStatus(valor)} ({contagem[valor]})
              </option>
            ))}
          </select>
        </div>
        <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl px-2 text-base text-tinta hover:bg-tinta/5">
          <input
            type="checkbox"
            checked={soPendentes}
            onChange={(evento) => setSoPendentes(evento.target.checked)}
            className={`size-5 shrink-0 accent-tinta ${classeFoco}`}
          />
          Só pagamentos pendentes
        </label>
      </div>

      <p role="status" className="mt-3 text-sm font-semibold text-tinta">
        Mostrando {visiveis.length} de {textoQuantidade(pedidos.length, 'pedido', 'pedidos')}.
      </p>

      {visiveis.length === 0 ? (
        <p className="mt-3 text-base text-tinta-suave">Nenhum pedido com esses filtros.</p>
      ) : (
        <ul role="list" className="mt-3 grid gap-3 lg:grid-cols-2">
          {visiveis.map((pedido) => (
            <CartaoPedido key={pedido.id} pedido={pedido} />
          ))}
        </ul>
      )}
    </div>
  )
}

function ConteudoDia({ data, pedidos, agora }) {
  if (!data && pedidos.length === 0) {
    return <p className="text-center text-base text-tinta-suave">Não há entregas neste dia.</p>
  }
  const resumo = resumoDaData(pedidos)
  const situacao = data ? situacaoDaData(data, agora) : null
  const prazo = data ? formatarPrazoAgenda(data.prazoCorte) : ''

  return (
    <div>
      {data && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <p className={`${classeEtiqueta} ${classesSituacao[situacao] ?? classesSituacao.passada}`}>
            <span className="sr-only">Situação da data: </span>
            {rotuloSituacao(situacao)}
          </p>
          {prazo && <p className="text-sm text-tinta-suave">Pedidos até {prazo}</p>}
        </div>
      )}
      {data?.status === 'bloqueada' && data.motivo && (
        <p className="mt-2 text-sm text-tinta [overflow-wrap:anywhere]">Motivo do bloqueio: {data.motivo}</p>
      )}

      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 rounded-2xl border border-borda bg-creme p-4 sm:grid-cols-3 lg:grid-cols-5">
        <Metrica rotulo="Pedidos">{resumo.pedidos}</Metrica>
        <Metrica rotulo="Unidades">{resumo.unidades}</Metrica>
        {data && (
          <Metrica rotulo="Lotação">
            {data.reservadas} de {data.capacidade}
          </Metrica>
        )}
        <Metrica rotulo="Valor previsto">{formatarPreco(resumo.valorCentavos)}</Metrica>
        <Metrica rotulo="A receber">{formatarPreco(resumo.aReceberCentavos)}</Metrica>
      </dl>

      {pedidos.length === 0 ? (
        <p className="mt-6 text-base text-tinta-suave">Nenhum pedido para esta data.</p>
      ) : (
        <PedidosDoDia pedidos={pedidos} />
      )}
    </div>
  )
}

function Calendario({ datas, pedidos, agora, conteudo }) {
  const [escolhido, setEscolhido] = useState(null)
  const [anuncio, setAnuncio] = useState('')
  const hoje = diaEmSaoPaulo(agora)
  const datasPorDia = new Map(datas.map((data) => [data.id, data]))
  const grupos = agruparPorData(pedidos)
  const selecionado = escolhido ?? proximaDataEntrega(datas, hoje) ?? hoje
  const cabecalho = formatarCabecalhoDia(selecionado)
  const pedidosDoDia = grupos.get(selecionado) ?? []

  function mudarSemana(passo) {
    const dias = diasDaSemana(somarDias(inicioSemanaDomingo(selecionado), passo * 7))
    const destino = dias.find((dia) => datasPorDia.has(dia)) ?? (dias.includes(hoje) ? hoje : dias[0])
    setEscolhido(destino)
    setAnuncio(
      `Semana de ${formatarDiaAgenda(dias[0])} a ${formatarDiaAgenda(dias[6])}. Dia selecionado: ${formatarDiaAgenda(destino)}.`,
    )
  }

  function escolherDia(dia) {
    setEscolhido(dia)
    setAnuncio(`Dia selecionado: ${formatarDiaAgenda(dia)}.`)
  }

  return (
    <div>
      <FaixaSemana
        selecionado={selecionado}
        hoje={hoje}
        datasPorDia={datasPorDia}
        grupos={grupos}
        aoEscolher={escolherDia}
        aoMudarSemana={mudarSemana}
      />
      <h2 className="mt-3 border-y border-borda py-3 text-center font-display text-xl text-tinta sm:text-2xl">
        <time dateTime={selecionado}>{cabecalho}</time>
      </h2>
      <p role="status" className="sr-only">
        {anuncio}
      </p>
      <div className="mt-4">
        {conteudo ?? <ConteudoDia key={selecionado} data={datasPorDia.get(selecionado) ?? null} pedidos={pedidosDoDia} agora={agora} />}
      </div>
    </div>
  )
}

function Agenda({ tituloRef, fonte = 'inativa', aoTentarDeNovo }) {
  const [agora] = useState(() => new Date())
  const dados = typeof fonte === 'object' && !fonte.erro ? fonte : semDados

  function tentarDeNovo() {
    tituloRef?.current?.focus()
    aoTentarDeNovo()
  }

  let conteudo = null
  if (fonte === 'carregando') {
    conteudo = <p className="text-center text-base text-tinta-suave">Carregando a agenda…</p>
  } else if (typeof fonte === 'object' && fonte.erro) {
    conteudo = (
      <div role="alert" className="rounded-2xl border-2 border-tomate-escuro bg-creme p-4">
        <p className="text-base font-semibold text-tinta">Não foi possível carregar a agenda.</p>
        <p className="mt-1 text-sm text-tinta">{fonte.erro}</p>
        {aoTentarDeNovo && (
          <button type="button" onClick={tentarDeNovo} className={`${classeBotaoContorno} mt-3`}>
            Tentar de novo
          </button>
        )}
      </div>
    )
  }

  return (
    <CartaoTela>
      <h1 ref={tituloRef} tabIndex={-1} className="font-display text-3xl text-tinta focus:outline-none sm:text-4xl">
        Agenda de entregas
      </h1>
      <p className="mt-2 max-w-prose text-base text-tinta-suave">
        Pedidos de cada dia de entrega, com unidades, valor previsto e quanto falta receber.
      </p>

      {fonte === 'inativa' && <AvisoInativa />}

      <div className="mt-6" aria-busy={fonte === 'carregando' ? 'true' : undefined}>
        <Calendario datas={dados.datas} pedidos={dados.pedidos} agora={agora} conteudo={conteudo} />
      </div>
    </CartaoTela>
  )
}

export default Agenda
