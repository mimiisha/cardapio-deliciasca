import { useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import LinkRota from '../../components/LinkRota.jsx'
import Icone from '../../components/admin/Icone.jsx'
import { publicarCardapio } from '../../servicos/admin/catalogo.js'
import { ehConflito } from '../../servicos/admin/errosPainel.js'
import { ErroServico, mensagemGenerica } from '../../servicos/erros.js'
import AvisoConflito from './AvisoConflito.jsx'
import CartaoTela from './CartaoTela.jsx'
import { descricoesTelas } from './descricoes.js'
import { gruposAdmin, telasAdmin } from './telas.js'
import { aplicarCardapio, recarregarCardapio, useCardapio } from './useCardapio.js'

const classeFoco = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tinta'

const classePrimario = `mt-3 inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-tinta px-5 py-2 text-center text-base font-semibold text-mostarda hover:bg-tomate-escuro hover:text-papel aria-disabled:cursor-wait aria-disabled:hover:bg-tinta aria-disabled:hover:text-mostarda ${classeFoco}`

const classeContorno = `mt-3 inline-flex min-h-11 items-center justify-center rounded-full border-2 border-tinta px-5 text-base font-semibold text-tinta hover:bg-tinta/10 ${classeFoco}`

const formatoData = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' })

const formatoHora = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' })

function situacaoPublicacao({ versao, publicadoEm }) {
  if (versao === 0) return 'Ainda não publicado'
  if (!publicadoEm) return 'Publicado'
  return `Publicado em ${formatoData.format(publicadoEm)} às ${formatoHora.format(publicadoEm)}`
}

function CartaoCardapioSite() {
  const { estado, dados, erro } = useCardapio()
  const [publicando, setPublicando] = useState(false)
  const [aviso, setAviso] = useState('')
  const [conflito, setConflito] = useState(false)
  const ocupado = useRef(false)
  const situacaoRef = useRef(null)
  const botaoRecarregarRef = useRef(null)

  const carregando = estado === 'ocioso' || estado === 'carregando'
  const nuncaPublicado = dados?.versao === 0

  function recarregar() {
    setAviso('')
    setConflito(false)
    flushSync(recarregarCardapio)
    situacaoRef.current?.focus()
  }

  async function publicar() {
    if (ocupado.current || estado !== 'pronto') return
    ocupado.current = true
    setPublicando(true)
    setAviso('')
    try {
      aplicarCardapio(await publicarCardapio())
      setConflito(false)
      setAviso('Cardápio publicado. O site já mostra a versão atual.')
    } catch (falha) {
      if (ehConflito(falha)) {
        flushSync(() => setConflito(true))
        botaoRecarregarRef.current?.focus()
      } else {
        setAviso(falha instanceof ErroServico ? falha.message : mensagemGenerica)
      }
    } finally {
      ocupado.current = false
      setPublicando(false)
    }
  }

  return (
    <section aria-labelledby="cardapio-site-titulo" className="mt-6 rounded-2xl border border-borda bg-manteiga p-4 sm:p-5">
      <h2 id="cardapio-site-titulo" className="font-display text-xl text-tinta">
        Cardápio do site
      </h2>
      <p className="mt-1 max-w-prose text-sm text-tinta">
        As alterações em categorias, selos e produtos já atualizam o site. Publique de novo se o site estiver diferente do
        painel.
      </p>

      {estado === 'erro' ? (
        <div role="alert" className="mt-3">
          <p className="text-base font-semibold text-tinta">Não foi possível ver a situação do cardápio.</p>
          <p className="mt-1 text-sm text-tinta">{erro}</p>
          <button type="button" onClick={recarregar} className={classeContorno}>
            Tentar de novo
          </button>
        </div>
      ) : (
        <p ref={situacaoRef} tabIndex={-1} className="mt-3 text-base font-semibold text-tinta focus:outline-none">
          {carregando || !dados ? 'Carregando…' : situacaoPublicacao(dados)}
        </p>
      )}

      {estado === 'pronto' && (
        <button
          type="button"
          onClick={publicar}
          aria-disabled={publicando ? 'true' : undefined}
          className={classePrimario}
        >
          {publicando ? 'Publicando…' : nuncaPublicado ? 'Publicar cardápio' : 'Republicar cardápio'}
        </button>
      )}

      <AvisoConflito visivel={conflito} botaoRef={botaoRecarregarRef} aoRecarregar={recarregar} />
      <div role="status">
        {publicando ? (
          <span className="sr-only">Publicando…</span>
        ) : (
          aviso && <p className="mt-3 text-base font-semibold text-tinta">{aviso}</p>
        )}
      </div>
    </section>
  )
}

function PainelInicio({ tituloRef }) {
  return (
    <CartaoTela>
      <h1 ref={tituloRef} tabIndex={-1} className="font-display text-3xl text-tinta focus:outline-none sm:text-4xl">
        Início
      </h1>
      <p className="mt-2 text-base text-tinta-suave">Olá! Escolha por onde começar.</p>

      <CartaoCardapioSite />

      <div className="mt-6 space-y-8">
        {gruposAdmin.map((grupo) => (
          <div key={grupo}>
            <h2 className="font-display text-xl text-tinta">{grupo}</h2>
            <ul className="mt-3 grid gap-3 sm:grid-cols-2">
              {telasAdmin
                .filter((tela) => tela.grupo === grupo)
                .map((tela) => (
                  <li key={tela.id}>
                    <LinkRota
                      href={tela.caminho}
                      className="flex h-full min-h-11 items-start gap-3 rounded-2xl border border-borda bg-creme p-4 text-tinta hover:border-tinta hover:bg-manteiga focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tinta"
                    >
                      <Icone nome={tela.id} className="mt-0.5 size-6 text-tomate-escuro" />
                      <span>
                        <span className="block text-base font-semibold">{tela.rotulo}</span>
                        <span className="mt-1 block text-sm text-tinta-suave">{descricoesTelas[tela.id]}</span>
                      </span>
                    </LinkRota>
                  </li>
                ))}
            </ul>
          </div>
        ))}
      </div>
    </CartaoTela>
  )
}

export default PainelInicio
