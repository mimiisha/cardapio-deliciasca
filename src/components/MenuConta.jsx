import { useEffect, useId, useRef, useState } from 'react'
import LinkRota from './LinkRota.jsx'
import { useRota } from '../hooks/useRota.js'
import { sair } from '../servicos/auth.js'
import { ErroServico, mensagemGenerica } from '../servicos/erros.js'

const classeItem =
  'flex min-h-11 w-full items-center rounded-xl px-3 text-left text-base font-semibold text-tinta hover:bg-manteiga focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tinta'

function Seta({ aberto }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      className={`size-3.5 shrink-0 motion-safe:transition-transform ${aberto ? 'rotate-180' : ''}`}
    >
      <path d="M5 7.5l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function MenuConta({ nome, tituloRef, aoAvisar, classeBotao }) {
  const [aberto, setAberto] = useState(false)
  const [saindo, setSaindo] = useState(false)
  const emAndamento = useRef(false)
  const raizRef = useRef(null)
  const botaoRef = useRef(null)
  const idPainel = useId()
  const caminho = useRota()
  const nomeCompleto = typeof nome === 'string' ? nome.trim() : ''
  const primeiroNome = nomeCompleto.split(/\s+/)[0] || 'Minha conta'
  const rotulo = nomeCompleto ? `${nomeCompleto}, menu da conta` : 'Minha conta'

  useEffect(() => {
    if (!aberto) return undefined
    function aoApontar(evento) {
      if (!raizRef.current?.contains(evento.target)) setAberto(false)
    }
    document.addEventListener('pointerdown', aoApontar)
    return () => document.removeEventListener('pointerdown', aoApontar)
  }, [aberto])

  function fecharEFocar() {
    setAberto(false)
    botaoRef.current?.focus()
  }

  function aoTeclar(evento) {
    if (evento.key !== 'Escape' || !aberto) return
    evento.stopPropagation()
    fecharEFocar()
  }

  function aoPerderFoco(evento) {
    const destino = evento.relatedTarget
    if (aberto && destino && !raizRef.current?.contains(destino)) setAberto(false)
  }

  async function aoSair() {
    if (emAndamento.current) return
    emAndamento.current = true
    setSaindo(true)
    aoAvisar({ texto: '', erro: false })
    try {
      await sair()
      aoAvisar({ texto: 'Você saiu da sua conta.', erro: false })
      tituloRef?.current?.focus()
    } catch (erro) {
      if (!(erro instanceof ErroServico) && import.meta.env.DEV) console.error('[menu-conta] erro ao sair', erro)
      aoAvisar({ texto: erro instanceof ErroServico ? erro.message : mensagemGenerica, erro: true })
      fecharEFocar()
    } finally {
      emAndamento.current = false
      setSaindo(false)
    }
  }

  return (
    <div ref={raizRef} className="relative" onKeyDown={aoTeclar} onBlur={aoPerderFoco}>
      <button
        ref={botaoRef}
        type="button"
        aria-expanded={aberto}
        aria-controls={idPainel}
        onClick={() => setAberto((valor) => !valor)}
        className={`${classeBotao} gap-0.5 pr-1.5 sm:pr-4`}
      >
        <span aria-hidden="true" className="max-w-10 truncate min-[360px]:max-w-20 sm:max-w-40">
          {primeiroNome}
        </span>
        <span className="sr-only">{rotulo}</span>
        <Seta aberto={aberto} />
      </button>
      <ul
        id={idPainel}
        hidden={!aberto}
        className="absolute top-full right-0 z-30 mt-2 w-56 space-y-1 rounded-2xl border border-borda bg-papel p-1.5 shadow-[0_1px_2px_rgb(43_29_22/0.08),0_12px_28px_-8px_rgb(43_29_22/0.3)]"
      >
        <li>
          <LinkRota
            href="/minha-conta"
            className={classeItem}
            aria-current={caminho === '/minha-conta' ? 'page' : undefined}
            aoNavegar={fecharEFocar}
          >
            Configurações
          </LinkRota>
        </li>
        <li>
          <button
            type="button"
            onClick={aoSair}
            aria-disabled={saindo ? 'true' : undefined}
            className={`${classeItem} aria-disabled:cursor-wait aria-disabled:hover:bg-transparent`}
          >
            {saindo ? 'Saindo…' : 'Sair'}
          </button>
        </li>
      </ul>
    </div>
  )
}

export default MenuConta
