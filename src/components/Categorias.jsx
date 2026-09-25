import { useEffect, useRef, useState } from 'react'
import { lerCategoriasPublicas } from '../servicos/publico/catalogo.js'
import LinkRota from './LinkRota.jsx'

const tons = {
  quente: 'bg-linear-to-br from-tomate to-tomate-escuro text-papel',
  manteiga: 'bg-linear-to-br from-mostarda to-mostarda-escuro text-tinta',
  neutro: 'bg-borda text-tinta-suave',
}

const QUANTIDADE_ESQUELETOS = 6

let promessaGaleria = null

function carregarGaleria() {
  if (!promessaGaleria) {
    promessaGaleria = import('./icones/categorias.js').then(
      (modulo) => modulo.galeriaCategorias,
      (erro) => {
        if (import.meta.env.DEV) console.warn('[categorias] falha ao carregar os ícones', erro)
        promessaGaleria = null
        return null
      },
    )
  }
  return promessaGaleria
}

function caminhoDoIcone(galeria, icone) {
  if (!galeria) return null
  return galeria.iconesCategoria[galeria.iconeCategoriaValido(icone)].d
}

export function IlustracaoCategoria({ icone, posicao, galeria, className = '', classeIcone = '' }) {
  const caminho = caminhoDoIcone(galeria, icone)
  const tom = posicao === null ? 'neutro' : posicao % 2 === 0 ? 'quente' : 'manteiga'
  return (
    <div aria-hidden="true" className={`relative grid place-items-center overflow-hidden ${tons[tom]} ${className}`}>
      <span className="absolute inset-0 bg-bolinhas" />
      {caminho && (
        <svg
          viewBox="0 0 24 24"
          className={`relative ${classeIcone}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d={caminho} />
        </svg>
      )}
    </div>
  )
}

const classeCartao =
  'flex flex-col overflow-hidden rounded-xl border border-borda bg-papel shadow-sm sm:rounded-2xl'

const classeRotulo =
  'border-t border-borda bg-manteiga px-0.5 py-2 text-center text-sm font-medium text-tinta wrap-break-word hyphens-auto sm:px-1 sm:py-3 sm:text-base sm:font-semibold'

const classeMovimento =
  'group motion-safe:transition motion-safe:duration-200 motion-safe:ease-out hover:shadow-lg motion-safe:hover:-translate-y-1'

const classeLinkCartao =
  'w-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tinta'

export function CartaoCategoria({ nome, icone, posicao, galeria, href, elemento: Elemento = 'li', interativo = true }) {
  const movimento = interativo ? classeMovimento : ''
  const conteudo = (
    <>
      <IlustracaoCategoria
        icone={icone}
        posicao={posicao}
        galeria={galeria}
        className="aspect-[4/3]"
        classeIcone="size-8 motion-safe:transition-transform motion-safe:duration-300 motion-safe:group-hover:scale-110 sm:size-12"
      />
      <span className={classeRotulo}>{nome}</span>
    </>
  )
  if (href) {
    return (
      <Elemento className="flex">
        <LinkRota href={href} className={`${classeCartao} ${movimento} ${classeLinkCartao}`}>
          {conteudo}
        </LinkRota>
      </Elemento>
    )
  }
  return <Elemento className={`${classeCartao} ${movimento}`}>{conteudo}</Elemento>
}

function Esqueleto({ indice }) {
  return (
    <li aria-hidden={indice > 0 ? 'true' : undefined} className={classeCartao}>
      <div className="aspect-[4/3] bg-borda/60 motion-safe:animate-pulse" />
      <span className={classeRotulo}>
        {indice === 0 ? <span className="sr-only">Carregando categorias…</span> : null}
        <span aria-hidden="true">{' '}</span>
      </span>
    </li>
  )
}

const classeBotao =
  'mt-3 inline-flex min-h-11 items-center justify-center rounded-full border-2 border-tinta px-5 text-base font-semibold text-tinta hover:bg-tinta/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tinta'

function ListaCategorias({ estado, galeria, aoTentarDeNovo, alertar }) {
  const classeLista = 'mt-6 grid grid-cols-3 gap-2 sm:mt-8 sm:gap-6'
  if (estado === null) {
    return (
      <ul aria-busy="true" className={classeLista}>
        {Array.from({ length: QUANTIDADE_ESQUELETOS }, (_, indice) => (
          <Esqueleto key={indice} indice={indice} />
        ))}
      </ul>
    )
  }
  if (estado.origem === 'erro') {
    return (
      <div className="mt-6 text-center sm:mt-8">
        <p role={alertar ? 'alert' : undefined} className="text-base text-tinta">
          Não foi possível carregar as categorias.
        </p>
        <button type="button" onClick={aoTentarDeNovo} className={classeBotao}>
          Tentar de novo
        </button>
      </div>
    )
  }
  if (estado.categorias.length === 0) {
    return <p className="mt-6 text-center text-base text-tinta-suave sm:mt-8">Em breve, novidades no cardápio.</p>
  }
  return (
    <ul className={classeLista}>
      {estado.categorias.map(({ id, nome, icone }, indice) => (
        <CartaoCategoria key={id} nome={nome} icone={icone} posicao={indice} galeria={galeria} href={`/cardapio/${id}`} />
      ))}
    </ul>
  )
}

function Categorias() {
  const [tentativa, setTentativa] = useState(0)
  const [resultado, setResultado] = useState({ tentativa: -1, estado: null, galeria: null })
  const tituloRef = useRef(null)

  useEffect(() => {
    let ativo = true
    Promise.all([lerCategoriasPublicas(), carregarGaleria()]).then(([estado, galeria]) => {
      if (ativo) setResultado({ tentativa, estado, galeria })
    })
    return () => {
      ativo = false
    }
  }, [tentativa])

  function tentarDeNovo() {
    tituloRef.current?.focus()
    setTentativa((atual) => atual + 1)
  }

  const estado = resultado.tentativa === tentativa ? resultado.estado : null

  return (
    <section id="produtos" aria-labelledby="produtos-titulo" className="scroll-mt-4">
      <h2 ref={tituloRef} tabIndex={-1} id="produtos-titulo" className="text-center focus:outline-none">
        <span className="block font-display text-3xl leading-tight sm:text-4xl">Categorias</span>{' '}
        <span className="mt-1 block text-sm font-bold uppercase tracking-[0.18em] text-tomate-escuro sm:text-base">
          de Produtos
        </span>
      </h2>
      <ListaCategorias estado={estado} galeria={resultado.galeria} aoTentarDeNovo={tentarDeNovo} alertar={tentativa > 0} />
    </section>
  )
}

export default Categorias
