import { useEffect, useState } from 'react'
import { ErroServico } from '../../servicos/erros.js'
import { listarEnderecos } from '../../servicos/enderecos.js'

function quantidade(total) {
  return total === 1 ? '1 endereço' : `${total} endereços`
}

export function resumoEnderecos(conta, lista) {
  if (conta.estado === 'carregando') return 'Carregando…'
  if (conta.estado === 'erro') return 'Não foi possível carregar'
  if (conta.estado === 'incompleto') return 'Nenhum endereço'
  if (lista.estado === 'pronto') {
    const total = lista.enderecos.length
    if (total === 0) return 'Nenhum endereço'
    const padrao = lista.enderecos.find((endereco) => endereco.id === lista.padraoId)
    return padrao ? `${quantidade(total)} · Padrão: ${padrao.apelido || padrao.logradouro}` : quantidade(total)
  }
  const copia = conta.dados?.enderecoPadrao
  return copia ? `Padrão: ${copia.apelido || copia.logradouro}` : 'Nenhum endereço'
}

export function useEnderecos(ativo) {
  const [carga, setCarga] = useState({ estado: 'ocioso' })
  const buscar = ativo && carga.estado === 'ocioso'

  useEffect(() => {
    if (!buscar) return undefined
    let vivo = true
    listarEnderecos().then(
      ({ enderecos, padraoId }) => {
        if (vivo) setCarga({ estado: 'pronto', enderecos, padraoId })
      },
      (erro) => {
        if (!vivo) return
        if (!(erro instanceof ErroServico) && import.meta.env.DEV) console.error('[enderecos] erro inesperado ao listar', erro)
        setCarga({ estado: 'erro', erro })
      },
    )
    return () => {
      vivo = false
    }
  }, [buscar])

  function aplicar({ enderecos, padraoId }) {
    setCarga({ estado: 'pronto', enderecos, padraoId })
  }

  function recarregar() {
    setCarga({ estado: 'ocioso' })
  }

  return { ...carga, estado: buscar ? 'carregando' : carga.estado, aplicar, recarregar }
}
