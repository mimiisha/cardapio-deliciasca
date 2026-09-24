import { useRef, useState } from 'react'
import Icone from './Icone.jsx'
import { navegar } from '../../hooks/useRota.js'
import { sair } from '../../servicos/auth.js'
import { ErroServico, mensagemGenerica } from '../../servicos/erros.js'

function SairAdmin() {
  const [status, setStatus] = useState('')
  const [saindo, setSaindo] = useState(false)
  const emAndamento = useRef(false)

  async function aoSair() {
    if (emAndamento.current) return
    emAndamento.current = true
    setSaindo(true)
    setStatus('')
    try {
      await sair()
      navegar('/admin')
    } catch (erro) {
      if (!(erro instanceof ErroServico) && import.meta.env.DEV) console.error('[painel] erro ao sair', erro)
      setStatus(erro instanceof ErroServico ? erro.message : mensagemGenerica)
    } finally {
      emAndamento.current = false
      setSaindo(false)
    }
  }

  return (
    <div className="border-t border-borda px-3 py-4">
      <button
        type="button"
        onClick={aoSair}
        aria-disabled={saindo ? 'true' : undefined}
        className="flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-tinta px-6 text-base font-semibold text-mostarda hover:bg-tomate-escuro hover:text-papel focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tinta aria-disabled:cursor-wait"
      >
        <Icone nome="sair" />
        {saindo ? 'Saindo…' : 'Sair'}
      </button>
      <p role="status" className="mt-2 text-sm font-medium text-tinta">
        {saindo ? <span className="sr-only">Saindo…</span> : status}
      </p>
    </div>
  )
}

export default SairAdmin
