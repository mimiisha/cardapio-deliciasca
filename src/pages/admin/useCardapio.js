import { useEffect, useSyncExternalStore } from 'react'
import { carregarCardapio } from '../../servicos/admin/catalogo.js'
import { ErroServico, mensagemGenerica } from '../../servicos/erros.js'

const inicial = Object.freeze({ estado: 'ocioso', dados: null, erro: '' })

let atual = inicial

let pedido = 0

const ouvintes = new Set()

function publicar(proximo) {
  atual = proximo
  ouvintes.forEach((ouvinte) => ouvinte())
}

function assinar(ouvinte) {
  ouvintes.add(ouvinte)
  return () => ouvintes.delete(ouvinte)
}

function ler() {
  return atual
}

export function recarregarCardapio() {
  pedido += 1
  const numero = pedido
  publicar({ ...atual, estado: 'carregando', erro: '' })
  carregarCardapio().then(
    (dados) => {
      if (numero === pedido) publicar({ estado: 'pronto', dados, erro: '' })
    },
    (erro) => {
      if (numero !== pedido) return
      publicar({ ...atual, estado: 'erro', erro: erro instanceof ErroServico ? erro.message : mensagemGenerica })
    },
  )
}

export function aplicarCardapio(dados) {
  pedido += 1
  publicar({ estado: 'pronto', dados, erro: '' })
}

export function limparCardapio() {
  pedido += 1
  publicar(inicial)
}

export function useCardapio() {
  const cardapio = useSyncExternalStore(assinar, ler)
  const { estado } = cardapio

  useEffect(() => {
    if (estado === 'ocioso' && atual.estado === 'ocioso') recarregarCardapio()
  }, [estado])

  return cardapio
}
