import LinkRota from './LinkRota.jsx'
import Footer from './Footer.jsx'

const classesCartao = {
  padrao: 'mt-10 max-w-md py-8 sm:mt-20 sm:py-10',
  larga: 'mt-6 max-w-3xl py-6 sm:mt-8 sm:py-7',
}

function LayoutAuth({ tituloRef, titulo, subtitulo, largura = 'padrao', children }) {
  const larga = largura === 'larga'

  return (
    <div className="flex min-h-dvh flex-col bg-creme text-tinta">
      <div aria-hidden="true" className="h-2 bg-tomate-escuro" />
      <main className="relative flex-1 px-3 pb-8 sm:px-6 sm:pb-12">
        <div aria-hidden="true" className="absolute inset-x-0 top-0 h-28 bg-tomate bg-bolinhas sm:h-44" />
        <div
          className={`relative mx-auto rounded-3xl border border-borda bg-papel px-4 shadow-[0_1px_2px_rgb(43_29_22/0.06),0_16px_40px_-16px_rgb(43_29_22/0.25)] sm:px-8 ${classesCartao[largura]}`}
        >
          <h1 ref={tituloRef} tabIndex={-1} className="font-display text-3xl text-tinta focus:outline-none sm:text-4xl">
            {titulo}
          </h1>
          {subtitulo && <p className={`${larga ? 'mt-1' : 'mt-2'} text-base text-tinta-suave`}>{subtitulo}</p>}

          {children}

          <LinkRota
            href="/"
            className={`${larga ? 'mt-2' : 'mt-6'} inline-flex min-h-11 items-center rounded-full px-2 text-sm font-semibold text-tomate-escuro underline decoration-2 underline-offset-4 hover:text-tinta focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tinta`}
          >
            Voltar para a loja
          </LinkRota>
        </div>
      </main>
      <Footer />
    </div>
  )
}

export default LayoutAuth
