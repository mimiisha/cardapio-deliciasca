import BarraTopo from '../components/BarraTopo.jsx'
import Header from '../components/Header.jsx'
import Footer from '../components/Footer.jsx'
import LinkRota from '../components/LinkRota.jsx'

const proximos = ['Editar nome e WhatsApp', 'Endereços de entrega', 'Trocar senha', 'Excluir minha conta']

function MinhaConta({ tituloRef }) {
  return (
    <div className="flex min-h-dvh flex-col bg-creme text-tinta">
      <BarraTopo />
      <Header tituloRef={tituloRef} inicio={false} />
      <main className="relative flex-1 px-3 pb-8 sm:px-6 sm:pb-12">
        <div aria-hidden="true" className="absolute inset-x-0 top-0 h-28 bg-tomate bg-bolinhas sm:h-44" />
        <div className="relative mx-auto mt-10 max-w-md rounded-3xl border border-borda bg-papel px-4 py-8 shadow-[0_1px_2px_rgb(43_29_22/0.06),0_16px_40px_-16px_rgb(43_29_22/0.25)] sm:mt-20 sm:px-8 sm:py-10">
          <h1 ref={tituloRef} tabIndex={-1} className="font-display text-3xl text-tinta focus:outline-none sm:text-4xl">
            Minha conta
          </h1>
          <p className="mt-2 text-base text-tinta-suave">Em construção.</p>
          <h2 className="mt-6 text-base font-semibold text-tinta">Em breve você poderá:</h2>
          <ul className="mt-2 list-disc space-y-1 pl-6 text-base text-tinta marker:text-tomate-escuro">
            {proximos.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <LinkRota
            href="/"
            className="mt-6 inline-flex min-h-11 items-center rounded-full px-2 text-sm font-semibold text-tomate-escuro underline decoration-2 underline-offset-4 hover:text-tinta focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tinta"
          >
            Voltar para a loja
          </LinkRota>
        </div>
      </main>
      <Footer />
    </div>
  )
}

export default MinhaConta
