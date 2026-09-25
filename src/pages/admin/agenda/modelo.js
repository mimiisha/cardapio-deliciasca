export const STATUS_PEDIDO = ['aguardando', 'confirmado', 'em-preparo', 'saiu', 'entregue', 'cancelado']

const rotulosStatus = {
  aguardando: 'Aguardando confirmação',
  confirmado: 'Confirmado',
  'em-preparo': 'Em preparo',
  saiu: 'Saiu para entrega',
  entregue: 'Entregue',
  cancelado: 'Cancelado',
}

const rotulosForma = {
  'pix-antecipado': 'PIX antecipado',
  'na-entrega': 'Na entrega',
}

const rotulosStatusPagamento = {
  pendente: 'Pendente',
  pago: 'Pago',
}

const rotulosSituacao = {
  passada: 'Data passada',
  bloqueada: 'Bloqueada',
  encerrada: 'Pedidos encerrados',
  esgotada: 'Agenda cheia',
  aberta: 'Aberta',
}

const formatoDia = new Intl.DateTimeFormat('pt-BR', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  timeZone: 'UTC',
})

const formatoPrazo = new Intl.DateTimeFormat('pt-BR', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'America/Sao_Paulo',
})

const formatoDiaCorrente = new Intl.DateTimeFormat('en-CA', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  timeZone: 'America/Sao_Paulo',
})

const formatoIdDia = /^(\d{4})-(\d{2})-(\d{2})$/

function instanteDoDia(id) {
  const partes = formatoIdDia.exec(id)
  if (!partes) return null
  const [, ano, mes, dia] = partes.map(Number)
  const instante = new Date(Date.UTC(ano, mes - 1, dia, 12))
  if (instante.getUTCMonth() !== mes - 1 || instante.getUTCDate() !== dia) return null
  return instante
}

export function formatarDiaAgenda(id) {
  const instante = instanteDoDia(id)
  return instante ? formatoDia.format(instante) : id
}

export function formatarPrazoAgenda(data) {
  return data instanceof Date && !Number.isNaN(data.getTime()) ? formatoPrazo.format(data) : ''
}

export function diaEmSaoPaulo(agora) {
  return formatoDiaCorrente.format(agora)
}

export function rotuloStatus(status) {
  return rotulosStatus[status] ?? 'Status desconhecido'
}

export function rotuloFormaPagamento(forma, modalidade) {
  if (forma === 'na-entrega' && modalidade === 'retirada') return 'Na retirada'
  return rotulosForma[forma] ?? 'Forma desconhecida'
}

export function rotuloStatusPagamento(status) {
  return rotulosStatusPagamento[status] ?? 'Situação desconhecida'
}

export function rotuloPagamento(pedido) {
  return `${rotuloFormaPagamento(pedido.formaPagamento, pedido.modalidade)} — ${rotuloStatusPagamento(pedido.statusPagamento)}`
}

export function situacaoDaData(data, agora) {
  if (data.id < diaEmSaoPaulo(agora)) return 'passada'
  if (data.status === 'bloqueada') return 'bloqueada'
  if (data.prazoCorte instanceof Date && data.prazoCorte.getTime() <= agora.getTime()) return 'encerrada'
  if (data.reservadas >= data.capacidade) return 'esgotada'
  return 'aberta'
}

export function rotuloSituacao(situacao) {
  return rotulosSituacao[situacao] ?? 'Situação desconhecida'
}

function ativo(pedido) {
  return pedido.status !== 'cancelado'
}

export function pagamentoPendente(pedido) {
  return ativo(pedido) && pedido.statusPagamento === 'pendente'
}

export function unidadesDoPedido(pedido) {
  return pedido.itens.reduce((soma, item) => soma + item.quantidade, 0)
}

export function subtotalDoItem(item) {
  return item.quantidade * item.precoCentavos
}

export function resumoDaData(pedidos) {
  return pedidos.filter(ativo).reduce(
    (resumo, pedido) => ({
      pedidos: resumo.pedidos + 1,
      unidades: resumo.unidades + unidadesDoPedido(pedido),
      valorCentavos: resumo.valorCentavos + pedido.totalCentavos,
      aReceberCentavos: resumo.aReceberCentavos + (pedido.statusPagamento === 'pendente' ? pedido.totalCentavos : 0),
    }),
    { pedidos: 0, unidades: 0, valorCentavos: 0, aReceberCentavos: 0 },
  )
}

export function filtrarPorStatus(pedidos, status) {
  if (status === 'todos') return pedidos
  return pedidos.filter((pedido) => pedido.status === status)
}

export function filtrarPedidos(pedidos, { status = 'todos', soPendentes = false } = {}) {
  const porStatus = filtrarPorStatus(pedidos, status)
  return soPendentes ? porStatus.filter(pagamentoPendente) : porStatus
}

export function contarPorStatus(pedidos) {
  const contagem = Object.fromEntries(STATUS_PEDIDO.map((status) => [status, 0]))
  for (const pedido of pedidos) {
    if (pedido.status in contagem) contagem[pedido.status] += 1
  }
  return contagem
}

function posicaoStatus(status) {
  const posicao = STATUS_PEDIDO.indexOf(status)
  return posicao === -1 ? STATUS_PEDIDO.length : posicao
}

export function compararPedidos(a, b) {
  return (
    posicaoStatus(a.status) - posicaoStatus(b.status) ||
    a.numero.localeCompare(b.numero, 'pt-BR', { numeric: true })
  )
}

export function agruparPorData(pedidos) {
  const grupos = new Map()
  for (const pedido of pedidos) {
    const grupo = grupos.get(pedido.dataEntregaId)
    if (grupo) grupo.push(pedido)
    else grupos.set(pedido.dataEntregaId, [pedido])
  }
  for (const grupo of grupos.values()) grupo.sort(compararPedidos)
  return grupos
}

const letrasSemana = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']

const formatoCabecalho = new Intl.DateTimeFormat('pt-BR', {
  weekday: 'long',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
})

const formatoIntervalo = new Intl.DateTimeFormat('pt-BR', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
})

function idDoInstante(instante) {
  return instante.toISOString().slice(0, 10)
}

export function somarDias(id, dias) {
  const instante = instanteDoDia(id)
  if (!instante) return id
  instante.setUTCDate(instante.getUTCDate() + dias)
  return idDoInstante(instante)
}

export function inicioSemanaDomingo(id) {
  const instante = instanteDoDia(id)
  if (!instante) return id
  return somarDias(id, -instante.getUTCDay())
}

export function diasDaSemana(id) {
  const inicio = inicioSemanaDomingo(id)
  return Array.from({ length: 7 }, (_, indice) => somarDias(inicio, indice))
}

export function letraDoDia(id) {
  const instante = instanteDoDia(id)
  return instante ? letrasSemana[instante.getUTCDay()] : ''
}

export function numeroDoDia(id) {
  const instante = instanteDoDia(id)
  return instante ? instante.getUTCDate() : ''
}

function maiuscula(texto) {
  return texto.charAt(0).toLocaleUpperCase('pt-BR') + texto.slice(1)
}

export function formatarCabecalhoDia(id) {
  const instante = instanteDoDia(id)
  if (!instante) return id
  const partes = Object.fromEntries(formatoCabecalho.formatToParts(instante).map(({ type, value }) => [type, value]))
  return `${maiuscula(partes.weekday)} – ${partes.day} de ${partes.month} de ${partes.year}`
}

export function formatarIntervaloSemana(id) {
  const [inicio, , , , , , fim] = diasDaSemana(id)
  const instanteInicio = instanteDoDia(inicio)
  const instanteFim = instanteDoDia(fim)
  if (!instanteInicio || !instanteFim) return id
  return formatoIntervalo.formatRange(instanteInicio, instanteFim)
}

export function proximaDataEntrega(datas, hoje) {
  return datas.reduce((melhor, data) => (data.id >= hoje && (melhor === null || data.id < melhor) ? data.id : melhor), null)
}
