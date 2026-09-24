import { useEffect, useState } from 'react'
import BarraTopo from '../components/BarraTopo.jsx'
import Footer from '../components/Footer.jsx'
import Header from '../components/Header.jsx'
import LinkRota from '../components/LinkRota.jsx'
import SeloProduto from '../components/SeloProduto.jsx'
import { formatarPreco } from '../components/preco.js'
import { lerCategoriaPublica } from '../servicos/publico/cardapio.js'

const avisoProducao = 'Produção caseira: pode haver traços de outros ingredientes. Os selos não listam todos os ingredientes.'

const avisoSelosSem =
  'Os selos “sem” indicam que a receita não leva o ingrediente, mas a cozinha não é exclusiva. Em caso de alergia ou doença celíaca, fale com a gente antes de pedir.'

const iconesSelosSem = new Set(['sem-gluten', 'sem-lactose', 'sem-acucar'])

const classeFoco = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tinta'

const classeLink = `inline-flex min-h-11 items-center gap-2 font-semibold text-tomate-escuro underline underline-offset-4 hover:text-tinta ${classeFoco}`

const classeBotao = `mt-4 inline-flex min-h-11 items-center justify-center rounded-full border-2 border-tinta px-5 text-base font-semibold text-tinta hover:bg-tinta/10 ${classeFoco}`

function Precos({ tamanhos }) {
  if (tamanhos.length === 1 && tamanhos[0].nome === '') {
    return <p className="mt-3 text-lg font-semibold text-tinta">{formatarPreco(tamanhos[0].precoCentavos)}</p>
  }
  return (
    <ul role="list" className="mt-3 space-y-1 text-base text-tinta">
      {tamanhos.map((tamanho) => (
        <li key={tamanho.id} className="[overflow-wrap:anywhere]">
          {tamanho.nome || 'Único'} — <span className="font-semibold">{formatarPreco(tamanho.precoCentavos)}</span>
        </li>
      ))}
    </ul>
  )
}

function SelosDoProduto({ produto }) {
  if (produto.selos.length === 0) return null
  const idTitulo = `selos-titulo-${produto.id}`
  return (
    <div className="mt-3">
      <p id={idTitulo} className="sr-only">
        Características do produto
      </p>
      <ul role="list" aria-labelledby={idTitulo} className="flex flex-wrap gap-2">
        {produto.selos.map((selo) => (
          <li key={selo.id} className="max-w-full">
            <SeloProduto nome={selo.nome} icone={selo.icone} classeIcone="size-4" />
          </li>
        ))}
      </ul>
    </div>
  )
}

function ItemProduto({ produto }) {
  return (
    <li className="rounded-2xl border border-borda bg-creme p-4 sm:p-5">
      <h2 className="font-display text-xl text-tinta [overflow-wrap:anywhere] sm:text-2xl">{produto.nome}</h2>
      {produto.descricao && (
        <p className="mt-1 text-base text-tinta-suave [overflow-wrap:anywhere]">{produto.descricao}</p>
      )}
      <Precos tamanhos={produto.tamanhos} />
      <SelosDoProduto produto={produto} />
    </li>
  )
}

function AvisoAlergenos({ produtos }) {
  const temSeloSem = produtos.some((produto) => produto.selos.some((selo) => iconesSelosSem.has(selo.icone)))
  return (
    <div className="mt-6 rounded-2xl border border-borda bg-manteiga px-4 py-3">
      <p className="text-base font-semibold text-tinta">{avisoProducao}</p>
      {temSeloSem && <p className="mt-1 text-base text-tinta">{avisoSelosSem}</p>}
    </div>
  )
}

function textoStatus(dados) {
  if (dados === null) return 'Carregando o cardápio…'
  if (dados.estado === 'erro') return ''
  if (dados.estado === 'nao-encontrada') return 'Essa categoria não existe ou não está mais no cardápio.'
  const quantidade = dados.produtos.length
  if (quantidade === 0) return 'Em breve, novidades nesta categoria.'
  return `${dados.categoria.nome}: ${quantidade === 1 ? '1 produto' : `${quantidade} produtos`}.`
}

function classeStatus(dados) {
  if (dados === null || (dados.estado === 'ok' && dados.produtos.length === 0)) return 'mt-6 text-base text-tinta-suave'
  if (dados.estado === 'nao-encontrada') return 'mt-4 text-base text-tinta'
  return 'sr-only'
}

function Conteudo({ dados, aoTentarDeNovo }) {
  if (dados === null) return null
  if (dados.estado === 'erro') {
    return (
      <div className="mt-6">
        <p role="alert" className="text-base text-tinta">
          Não foi possível carregar o cardápio. Verifique sua conexão e tente de novo.
        </p>
        <button type="button" onClick={aoTentarDeNovo} className={classeBotao}>
          Tentar de novo
        </button>
      </div>
    )
  }
  if (dados.estado === 'nao-encontrada') {
    return (
      <p className="mt-2">
        <a href="/#produtos" className={classeLink}>
          Ver todas as categorias
        </a>
      </p>
    )
  }
  if (dados.produtos.length === 0) return null
  return (
    <>
      <AvisoAlergenos produtos={dados.produtos} />
      <ul role="list" className="mt-6 grid gap-4 sm:grid-cols-2">
        {dados.produtos.map((produto) => (
          <ItemProduto key={produto.id} produto={produto} />
        ))}
      </ul>
    </>
  )
}

function tituloDe(dados) {
  if (dados?.estado === 'ok') return dados.categoria.nome
  if (dados?.estado === 'nao-encontrada') return 'Categoria não encontrada'
  return 'Cardápio'
}

function lerSemFalhar(categoriaId) {
  return lerCategoriaPublica(categoriaId).catch((erro) => {
    if (import.meta.env.DEV) console.error('[cardapio] falha ao montar a categoria', erro)
    return { estado: 'erro' }
  })
}

function Cardapio({ tituloRef, categoriaId }) {
  const [tentativa, setTentativa] = useState(0)
  const [resultado, setResultado] = useState({ tentativa: -1, dados: null })

  useEffect(() => {
    let ativo = true
    lerSemFalhar(categoriaId).then((dados) => {
      if (ativo) setResultado({ tentativa, dados })
    })
    return () => {
      ativo = false
    }
  }, [categoriaId, tentativa])

  const dados = resultado.tentativa === tentativa ? resultado.dados : null
  const titulo = tituloDe(dados)
  const estado = dados?.estado

  useEffect(() => {
    if (estado === 'ok') document.title = `${titulo} — Cardápio — Delícias da Cá`
    if (estado === 'nao-encontrada') document.title = 'Categoria não encontrada — Delícias da Cá'
  }, [estado, titulo])

  function tentarDeNovo() {
    tituloRef?.current?.focus()
    setTentativa((atual) => atual + 1)
  }

  return (
    <div className="flex min-h-dvh flex-col bg-creme text-tinta">
      <BarraTopo />
      <Header tituloRef={tituloRef} inicio={false} />
      <main className="relative flex-1 px-3 pb-8 sm:px-6 sm:pb-12">
        <div aria-hidden="true" className="absolute inset-x-0 top-0 h-28 bg-tomate bg-bolinhas sm:h-44" />
        <div className="relative mx-auto mt-14 max-w-4xl rounded-3xl border border-borda bg-papel px-4 py-6 shadow-[0_1px_2px_rgb(43_29_22/0.06),0_16px_40px_-16px_rgb(43_29_22/0.25)] sm:mt-24 sm:px-10 sm:py-10">
          <LinkRota href="/" className={classeLink}>
            <span aria-hidden="true">←</span>
            Voltar para a página inicial
          </LinkRota>
          <h1
            ref={tituloRef}
            tabIndex={-1}
            className="mt-4 font-display text-3xl text-tinta [overflow-wrap:anywhere] focus:outline-none sm:text-4xl"
          >
            {titulo}
          </h1>
          <p role="status" className={classeStatus(dados)}>
            {textoStatus(dados)}
          </p>
          <Conteudo dados={dados} aoTentarDeNovo={tentarDeNovo} />
        </div>
      </main>
      <Footer />
    </div>
  )
}

export default Cardapio
