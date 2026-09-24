import BarraTopo from '../components/BarraTopo.jsx'
import Header from '../components/Header.jsx'
import Sobre from '../components/Sobre.jsx'
import Categorias from '../components/Categorias.jsx'
import Contato from '../components/Contato.jsx'
import Footer from '../components/Footer.jsx'

function Home({ tituloRef }) {
  return (
    <div className="flex min-h-dvh flex-col bg-creme text-tinta">
      <BarraTopo />
      <Header tituloRef={tituloRef} />
      <main className="relative flex-1 px-3 pb-8 sm:px-6 sm:pb-12">
        <div aria-hidden="true" className="absolute inset-x-0 top-0 h-28 bg-tomate bg-bolinhas sm:h-44" />
        <div className="relative mx-auto mt-14 max-w-4xl space-y-12 rounded-3xl border border-borda bg-papel px-3 py-8 shadow-[0_1px_2px_rgb(43_29_22/0.06),0_16px_40px_-16px_rgb(43_29_22/0.25)] sm:mt-24 sm:space-y-16 sm:px-10 sm:py-12">
          <Sobre />
          <Categorias />
          <Contato />
        </div>
      </main>
      <Footer />
    </div>
  )
}

export default Home
