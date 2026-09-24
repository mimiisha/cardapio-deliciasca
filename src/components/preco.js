export const PRECO_MAXIMO_CENTAVOS = 100000

const formatoMoeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

const soDigitos = /^\d+$/

const comMilhar = /^\d{1,3}(\.\d{3})+$/

const decimais = /^\d{1,2}$/

export function formatarPreco(centavos) {
  return formatoMoeda.format(centavos / 100)
}

export function formatarPrecoParaCampo(centavos) {
  const inteiro = Math.trunc(centavos / 100)
  const resto = String(centavos % 100).padStart(2, '0')
  return `${inteiro},${resto}`
}

function parteInteira(texto) {
  if (soDigitos.test(texto)) return texto
  if (comMilhar.test(texto)) return texto.replaceAll('.', '')
  return null
}

function separar(limpo) {
  const virgulas = limpo.split(',')
  if (virgulas.length > 2) return null
  if (virgulas.length === 2) {
    const [inteiro, fracao] = virgulas
    if (!decimais.test(fracao)) return null
    return { inteiro: parteInteira(inteiro), fracao }
  }
  const pontos = limpo.split('.')
  if (pontos.length === 2 && decimais.test(pontos[1]) && soDigitos.test(pontos[0])) {
    return { inteiro: pontos[0], fracao: pontos[1] }
  }
  return { inteiro: parteInteira(limpo), fracao: '' }
}

export function analisarPreco(texto) {
  if (typeof texto !== 'string') return { centavos: null, motivo: 'vazio' }
  const limpo = texto.replace(/R\$/gi, '').replace(/\s/g, '')
  if (limpo === '') return { centavos: null, motivo: 'vazio' }
  const partes = separar(limpo)
  if (!partes || partes.inteiro === null) return { centavos: null, motivo: 'invalido' }
  const inteiro = partes.inteiro.replace(/^0+(?=\d)/, '')
  if (inteiro.length > 7) return { centavos: null, motivo: 'acima' }
  const centavos = Number(inteiro) * 100 + Number(partes.fracao.padEnd(2, '0'))
  if (centavos === 0) return { centavos: null, motivo: 'zero' }
  if (centavos > PRECO_MAXIMO_CENTAVOS) return { centavos: null, motivo: 'acima' }
  return { centavos, motivo: '' }
}

export function lerPrecoEmCentavos(texto) {
  return analisarPreco(texto).centavos
}
