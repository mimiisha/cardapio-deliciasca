import { Suspense, lazy, useCallback, useEffect, useRef } from 'react'
import { navegar, useRota } from './hooks/useRota.js'
import {
  exigirVerificacaoAdmin,
  iniciarSessao,
  iniciarSessaoQuandoOcioso,
  repetirVerificacaoAdmin,
  useSessao,
} from './hooks/useSessao.js'
import { prepararServicos } from './servicos/auth.js'
import LayoutAuth from './components/LayoutAuth.jsx'
import LimiteErroCarga from './components/LimiteErroCarga.jsx'
import Home from './pages/Home.jsx'
import { telasAdmin } from './pages/admin/telas.js'
import { idCategoriaValido } from './servicos/publico/catalogo.js'

const raizPainel = '/admin/painel'

function carregarPainel() {
  return import('./pages/PainelAdmin.jsx')
}

const PainelAdmin = lazy(carregarPainel)
const LoginAdmin = lazy(() => import('./pages/LoginAdmin.jsx'))
const LoginCliente = lazy(() => import('./pages/LoginCliente.jsx'))
const Cadastro = lazy(() => import('./pages/Cadastro.jsx'))
const MinhaConta = lazy(() => import('./pages/MinhaConta.jsx'))
const Cardapio = lazy(() => import('./pages/Cardapio.jsx'))

const prefixoCardapio = '/cardapio/'

const paginas = {
  '/': { chave: '/', titulo: 'Delícias da Cá', Componente: Home, sessaoOciosa: true },
  '/admin': {
    chave: '/admin',
    titulo: 'Área Administrativa — Delícias da Cá',
    tituloCarga: 'Área Administrativa',
    Componente: LoginAdmin,
    firestore: true,
    preparaPainel: true,
  },
  '/entrar': { chave: '/entrar', titulo: 'Entrar — Delícias da Cá', tituloCarga: 'Entrar', Componente: LoginCliente },
  '/cadastro': {
    chave: '/cadastro',
    titulo: 'Criar conta — Delícias da Cá',
    tituloCarga: 'Criar conta',
    Componente: Cadastro,
    firestore: true,
  },
  '/minha-conta': {
    chave: '/minha-conta',
    titulo: 'Minha conta — Delícias da Cá',
    tituloCarga: 'Minha conta',
    Componente: MinhaConta,
    exige: 'cliente',
  },
}

const paginasPainel = Object.fromEntries(
  telasAdmin.map((tela) => [
    tela.caminho,
    {
      chave: raizPainel,
      titulo: `${tela.rotulo} — Painel — Delícias da Cá`,
      tituloCarga: 'Painel administrativo',
      Componente: PainelAdmin,
      exige: 'admin',
      firestore: true,
      preparaPainel: true,
      tela: tela.id,
    },
  ]),
)

let ultimaCardapio = null

function paginaCardapio(categoriaId) {
  if (ultimaCardapio?.categoriaId !== categoriaId) {
    ultimaCardapio = {
      chave: `${prefixoCardapio}${categoriaId}`,
      titulo: 'Cardápio — Delícias da Cá',
      tituloCarga: 'Cardápio',
      Componente: Cardapio,
      sessaoOciosa: true,
      categoriaId,
    }
  }
  return ultimaCardapio
}

function resolverPagina(caminho) {
  if (caminho.startsWith(prefixoCardapio)) {
    const categoriaId = caminho.slice(prefixoCardapio.length)
    return idCategoriaValido(categoriaId) ? paginaCardapio(categoriaId) : paginas['/']
  }
  if (caminho === raizPainel || caminho.startsWith(`${raizPainel}/`)) {
    return Object.hasOwn(paginasPainel, caminho) ? paginasPainel[caminho] : paginasPainel[raizPainel]
  }
  return Object.hasOwn(paginas, caminho) ? paginas[caminho] : paginas['/']
}

function prepararPainel() {
  carregarPainel().catch((erro) => {
    if (import.meta.env.DEV) console.error('[app] falha ao preparar o painel', erro)
  })
}

function Carregando({ tituloRef, titulo }) {
  return (
    <LayoutAuth tituloRef={tituloRef} titulo={titulo}>
      <p role="status" className="mt-6 text-base text-tinta">
        Carregando…
      </p>
    </LayoutAuth>
  )
}

function VerificacaoAcesso({ tituloRef, titulo, falhou }) {
  function tentarDeNovo() {
    tituloRef.current?.focus()
    repetirVerificacaoAdmin()
  }

  return (
    <LayoutAuth tituloRef={tituloRef} titulo={titulo}>
      <p role="status" className={falhou ? 'sr-only' : 'mt-6 text-base text-tinta'}>
        {falhou ? '' : 'Carregando…'}
      </p>
      <p role="alert" className={falhou ? 'mt-6 text-base text-tinta' : 'sr-only'}>
        {falhou ? 'Não foi possível confirmar seu acesso. Verifique sua conexão e tente de novo.' : ''}
      </p>
      {falhou && (
        <button
          type="button"
          onClick={tentarDeNovo}
          className="mt-6 flex min-h-11 w-full items-center justify-center rounded-full bg-tinta px-6 text-base font-semibold text-mostarda hover:bg-tomate-escuro hover:text-papel focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tinta"
        >
          Tentar de novo
        </button>
      )}
    </LayoutAuth>
  )
}

function AoMontar({ acao }) {
  useEffect(() => {
    acao()
  }, [acao])
  return null
}

function situacaoAcesso(pagina, sessao) {
  if (!pagina.exige) return 'liberado'
  if (sessao.estado === 'carregando') return 'aguardando'
  if (pagina.exige === 'cliente') {
    return sessao.estado === 'autenticado' && sessao.emailVerificado ? 'liberado' : 'negado'
  }
  if (sessao.estado === 'autenticado') {
    if (sessao.admin === true) return sessao.emailVerificado ? 'liberado' : 'negado'
    if (sessao.admin === null) return sessao.adminFalhou ? 'falhou' : 'aguardando'
  }
  return 'negado'
}

function App() {
  const caminho = useRota()
  const sessao = useSessao()
  const pagina = resolverPagina(caminho)
  const acesso = situacaoAcesso(pagina, sessao)
  const destinoNegado = pagina.exige === 'cliente' ? '/entrar' : '/admin'
  const tituloRef = useRef(null)
  const paginaAnterior = useRef(pagina)
  const acessoAnterior = useRef(acesso)
  const focoPendente = useRef(false)

  const focarTituloAposCarga = useCallback(() => {
    if (!focoPendente.current) return
    focoPendente.current = false
    if (document.activeElement === document.body) tituloRef.current?.focus()
  }, [])

  useEffect(() => {
    if (pagina.sessaoOciosa) {
      iniciarSessaoQuandoOcioso()
      return undefined
    }
    iniciarSessao()
    if (pagina.firestore) prepararServicos({ firestore: true })
    if (pagina.preparaPainel) prepararPainel()
    return pagina.exige === 'admin' ? exigirVerificacaoAdmin() : undefined
  }, [pagina])

  useEffect(() => {
    document.title = pagina.titulo
    if (paginaAnterior.current === pagina) return
    paginaAnterior.current = pagina
    window.scrollTo(0, 0)
    tituloRef.current?.focus()
    focoPendente.current = true
  }, [pagina])

  useEffect(() => {
    const anterior = acessoAnterior.current
    acessoAnterior.current = acesso
    if (acesso === 'negado') {
      navegar(destinoNegado, anterior === 'liberado' ? { saiu: true } : null)
      return
    }
    if (anterior !== acesso && acesso !== 'aguardando' && document.activeElement === document.body) {
      tituloRef.current?.focus()
      focoPendente.current = true
    }
  }, [acesso, destinoNegado])

  if (acesso !== 'liberado') {
    return <VerificacaoAcesso tituloRef={tituloRef} titulo={pagina.tituloCarga} falhou={acesso === 'falhou'} />
  }

  const { Componente } = pagina
  return (
    <LimiteErroCarga key={pagina.chave} tituloRef={tituloRef}>
      <Suspense fallback={<Carregando tituloRef={tituloRef} titulo={pagina.tituloCarga} />}>
        <Componente tituloRef={tituloRef} tela={pagina.tela} categoriaId={pagina.categoriaId} />
        <AoMontar acao={focarTituloAposCarga} />
      </Suspense>
    </LimiteErroCarga>
  )
}

export default App
