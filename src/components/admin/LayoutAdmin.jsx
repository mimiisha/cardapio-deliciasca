import { useEffect, useRef, useState } from 'react'
import Icone from './Icone.jsx'
import MenuAdmin from './MenuAdmin.jsx'
import SairAdmin from './SairAdmin.jsx'

const consultaDesktop = '(min-width: 64rem)'

const classeBotao =
  'flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-full px-4 text-base font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tinta'

function LayoutAdmin({ telaAtual, tituloRef, children }) {
  const [aberto, setAberto] = useState(false)
  const botaoMenuRef = useRef(null)
  const primeiroItemRef = useRef(null)
  const devolverFoco = useRef(null)

  useEffect(() => {
    if (aberto) {
      primeiroItemRef.current?.focus()
      return
    }
    const destino = devolverFoco.current
    devolverFoco.current = null
    if (destino === 'botao') botaoMenuRef.current?.focus()
    if (destino === 'titulo') tituloRef?.current?.focus()
  }, [aberto, tituloRef])

  useEffect(() => {
    if (!aberto) return
    function aoTeclar(evento) {
      if (evento.key !== 'Escape') return
      evento.preventDefault()
      devolverFoco.current = 'botao'
      setAberto(false)
    }
    document.addEventListener('keydown', aoTeclar)
    return () => document.removeEventListener('keydown', aoTeclar)
  }, [aberto])

  useEffect(() => {
    const consulta = window.matchMedia(consultaDesktop)
    function aoMudar(evento) {
      if (evento.matches) setAberto(false)
    }
    consulta.addEventListener('change', aoMudar)
    return () => consulta.removeEventListener('change', aoMudar)
  }, [])

  function fechar(destino) {
    devolverFoco.current = destino
    setAberto(false)
  }

  function aoEscolher(id) {
    if (!aberto) return
    fechar(id === telaAtual ? 'titulo' : null)
  }

  return (
    <div className="min-h-dvh bg-creme text-tinta lg:flex">
      <a
        href="#conteudo-admin"
        inert={aberto}
        className="sr-only z-50 rounded-full bg-tinta px-4 py-2 font-semibold text-mostarda focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:inline-flex focus:min-h-11 focus:items-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tinta"
      >
        Pular para o conteúdo
      </a>

      <div
        inert={aberto}
        className="sticky top-0 z-30 flex items-center justify-between gap-2 border-t-8 border-tomate-escuro bg-mostarda px-3 py-1.5 shadow-[0_1px_0_rgb(43_29_22/0.12)] sm:px-6 lg:hidden"
      >
        <p className="font-display text-lg text-tinta">Delícias da Cá — Admin</p>
        <button
          ref={botaoMenuRef}
          type="button"
          aria-expanded={aberto}
          aria-controls="menu-admin"
          onClick={() => setAberto(true)}
          className={`${classeBotao} bg-tinta text-mostarda hover:bg-tomate-escuro hover:text-papel`}
        >
          <Icone nome="menu" />
          Menu
        </button>
      </div>

      {aberto && (
        <div aria-hidden="true" onClick={() => fechar('botao')} className="fixed inset-0 z-40 bg-tinta/50 lg:hidden" />
      )}

      <aside
        id="menu-admin"
        role={aberto ? 'dialog' : undefined}
        aria-modal={aberto ? 'true' : undefined}
        aria-label={aberto ? 'Menu do painel' : undefined}
        className={`${aberto ? 'fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] shadow-2xl' : 'hidden'} flex-col overflow-y-auto bg-papel lg:sticky lg:top-0 lg:z-auto lg:flex lg:h-dvh lg:w-64 lg:max-w-none lg:shrink-0 lg:border-r lg:border-borda lg:shadow-none`}
      >
        <div className="flex items-center justify-between gap-2 border-t-8 border-tomate-escuro bg-mostarda px-4 py-3">
          <p className="font-display text-xl text-tinta">
            Delícias da Cá
            <span className="block font-sans text-sm font-semibold">Painel administrativo</span>
          </p>
          {aberto && (
            <button
              type="button"
              onClick={() => fechar('botao')}
              className={`${classeBotao} border-2 border-tinta text-tinta hover:bg-tinta/10 lg:hidden`}
            >
              <Icone nome="fechar" />
              Fechar
            </button>
          )}
        </div>
        <div className="flex-1">
          <MenuAdmin telaAtual={telaAtual} primeiroItemRef={primeiroItemRef} aoEscolher={aoEscolher} />
        </div>
        <SairAdmin />
      </aside>

      <main id="conteudo-admin" tabIndex={-1} inert={aberto} className="flex-1 px-3 py-6 focus:outline-none sm:px-6 lg:px-10 lg:py-10">
        <div className="mx-auto max-w-4xl">{children}</div>
      </main>
    </div>
  )
}

export default LayoutAdmin
