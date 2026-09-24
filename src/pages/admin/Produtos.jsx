import { useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import LinkRota from '../../components/LinkRota.jsx'
import SeloProduto from '../../components/SeloProduto.jsx'
import Icone from '../../components/admin/Icone.jsx'
import { formatarPreco } from '../../components/preco.js'
import { ehConflito } from '../../servicos/admin/errosPainel.js'
import { definirProdutoAtivo } from '../../servicos/admin/produtos.js'
import { ErroServico, mensagemGenerica } from '../../servicos/erros.js'
import AdicionarProduto from './AdicionarProduto.jsx'
import AvisoConflito from './AvisoConflito.jsx'
import CartaoTela from './CartaoTela.jsx'
import { aplicarCardapio, recarregarCardapio, useCardapio } from './useCardapio.js'

const classeFoco = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tinta'

const classeBotaoContorno = `inline-flex min-h-11 items-center justify-center rounded-full border-2 border-tinta px-5 text-base font-semibold text-tinta hover:bg-tinta/10 aria-disabled:cursor-wait aria-disabled:hover:bg-transparent ${classeFoco}`

const classePrimario = `inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-tinta px-5 py-2 text-center text-base font-semibold text-mostarda hover:bg-tomate-escuro hover:text-papel aria-disabled:cursor-wait aria-disabled:hover:bg-tinta aria-disabled:hover:text-mostarda ${classeFoco}`

const classeLink = `inline-flex min-h-11 items-center font-semibold text-tomate-escuro underline underline-offset-4 hover:text-tinta ${classeFoco}`

function mensagemDoErro(erro) {
  return erro instanceof ErroServico ? erro.message : mensagemGenerica
}

function agrupar(produtos, categorias) {
  const conhecidas = new Set(categorias.map((categoria) => categoria.id))
  const grupos = categorias
    .map((categoria) => ({
      id: categoria.id,
      titulo: categoria.nome || 'Sem nome',
      oculta: !categoria.ativa,
      produtos: produtos.filter((produto) => produto.categoriaId === categoria.id),
    }))
    .filter((grupo) => grupo.produtos.length > 0)
  const orfaos = produtos.filter((produto) => !conhecidas.has(produto.categoriaId))
  if (orfaos.length > 0) grupos.push({ id: '', titulo: 'Categoria não encontrada', oculta: false, produtos: orfaos })
  return grupos
}

function ListaTamanhos({ tamanhos }) {
  if (tamanhos.length === 1 && tamanhos[0].nome === '') {
    return <p className="mt-2 text-base font-semibold text-tinta">{formatarPreco(tamanhos[0].precoCentavos)}</p>
  }
  return (
    <ul role="list" aria-label="Tamanhos e preços" className="mt-2 space-y-0.5 text-base text-tinta">
      {tamanhos.map((tamanho) => (
        <li key={tamanho.id}>
          {tamanho.nome || 'Sem nome'} — <span className="font-semibold">{formatarPreco(tamanho.precoCentavos)}</span>
        </li>
      ))}
    </ul>
  )
}

function SelosDoProduto({ produto, selos }) {
  const escolhidos = selos.filter((selo) => produto.selosIds.includes(selo.id))
  if (escolhidos.length === 0) return null
  return (
    <ul role="list" aria-label="Selos" className="mt-3 flex flex-wrap gap-2">
      {escolhidos.map((selo) => (
        <li key={selo.id} className="flex max-w-full flex-wrap items-center gap-x-1.5">
          <SeloProduto nome={selo.nome || 'Sem nome'} icone={selo.icone} />
          {!selo.ativo && <span className="text-sm text-tinta-suave">(oculto)</span>}
        </li>
      ))}
    </ul>
  )
}

function ItemProduto({ produto, selos, alternando, bloqueado, aoEditar, aoAlternar }) {
  const { ativo, descricao } = produto
  const nome = produto.nome || 'Sem nome'
  return (
    <li className="rounded-2xl border border-borda bg-creme p-3 sm:p-4">
      <h3 className="text-lg font-semibold text-tinta [overflow-wrap:anywhere]">
        {nome}
        {!ativo && <span className="sr-only">, oculto</span>}
      </h3>
      {!ativo && (
        <p className="mt-1">
          <span aria-hidden="true" className="rounded-full border border-tinta-suave px-2.5 py-0.5 text-sm font-semibold text-tinta">
            Oculto
          </span>
        </p>
      )}
      {descricao && <p className="mt-1 text-base text-tinta-suave [overflow-wrap:anywhere]">{descricao}</p>}
      <ListaTamanhos tamanhos={produto.tamanhos} />
      <SelosDoProduto produto={produto} selos={selos} />
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          aria-disabled={bloqueado ? 'true' : undefined}
          onClick={(evento) => aoEditar(produto, evento.currentTarget)}
          className={`${classeBotaoContorno} px-4`}
        >
          Editar<span className="sr-only"> {nome}</span>
        </button>
        <button
          type="button"
          onClick={() => aoAlternar(produto)}
          aria-disabled={alternando || bloqueado ? 'true' : undefined}
          className={`${classeBotaoContorno} px-4`}
        >
          {alternando ? 'Salvando…' : ativo ? 'Ocultar do cardápio' : 'Mostrar no cardápio'}
          <span className="sr-only">: {nome}</span>
        </button>
      </div>
    </li>
  )
}

function GrupoCategoria({ grupo, selos, alternandoId, bloqueado, aoEditar, aoAlternar }) {
  const idTitulo = `grupo-produtos-${grupo.id || 'sem-categoria'}`
  return (
    <section aria-labelledby={idTitulo}>
      <h2 id={idTitulo} className="font-display text-2xl text-tinta [overflow-wrap:anywhere]">
        {grupo.titulo}
        {grupo.oculta && <span className="text-lg text-tinta-suave"> (oculta)</span>}
      </h2>
      <ul role="list" className="mt-3 grid gap-3 lg:grid-cols-2">
        {grupo.produtos.map((produto) => (
          <ItemProduto
            key={produto.id}
            produto={produto}
            selos={selos}
            alternando={alternandoId === produto.id}
            bloqueado={bloqueado}
            aoEditar={aoEditar}
            aoAlternar={aoAlternar}
          />
        ))}
      </ul>
    </section>
  )
}

function ListaProdutos({ carregando, erro, dados, alternandoId, aoEditar, aoAlternar, aoTentarDeNovo }) {
  if (erro && !carregando) {
    return (
      <div role="alert" className="rounded-2xl border-2 border-tomate-escuro bg-creme p-4">
        <p className="text-base font-semibold text-tinta">Não foi possível carregar a lista.</p>
        <p className="mt-1 text-sm text-tinta">{erro}</p>
        <button type="button" onClick={aoTentarDeNovo} className={`${classeBotaoContorno} mt-3`}>
          Tentar de novo
        </button>
      </div>
    )
  }
  if (carregando && (erro || dados === null)) {
    return <p className="text-base text-tinta-suave">Carregando a lista…</p>
  }
  if (dados.produtos.length === 0) {
    return <p className="text-base text-tinta-suave">Nenhum produto cadastrado.</p>
  }
  return (
    <div className="space-y-8">
      {agrupar(dados.produtos, dados.categorias).map((grupo) => (
        <GrupoCategoria
          key={grupo.id || 'sem-categoria'}
          grupo={grupo}
          selos={dados.selos}
          alternandoId={alternandoId}
          bloqueado={carregando}
          aoEditar={aoEditar}
          aoAlternar={aoAlternar}
        />
      ))}
    </div>
  )
}

function Produtos({ tituloRef }) {
  const { estado, dados, erro: erroCarga } = useCardapio()
  const [aviso, setAviso] = useState('')
  const [conflito, setConflito] = useState(false)
  const [alternandoId, setAlternandoId] = useState(null)
  const ocupado = useRef(false)
  const dialogoRef = useRef(null)
  const botaoAdicionarRef = useRef(null)
  const botaoRecarregarRef = useRef(null)

  const carregando = estado === 'ocioso' || estado === 'carregando'
  const pronta = estado === 'pronto'
  const erro = estado === 'erro' ? erroCarga : ''
  const temCategoriaAtiva = pronta && dados.categorias.some((categoria) => categoria.ativa)

  function tentarDeNovo() {
    setAviso('')
    setConflito(false)
    tituloRef?.current?.focus()
    recarregarCardapio()
  }

  function mostrarConflito() {
    flushSync(() => {
      setAviso('')
      setConflito(true)
    })
    botaoRecarregarRef.current?.focus()
  }

  function abrirNovo() {
    if (!temCategoriaAtiva) return
    setAviso('')
    dialogoRef.current?.abrir(null, botaoAdicionarRef.current)
  }

  function abrirEdicao(produto, origem) {
    if (!pronta) return
    const atual = dados.produtos.find((item) => item.id === produto.id)
    if (!atual) return
    setAviso('')
    dialogoRef.current?.abrir(atual, origem)
  }

  function aoSalvar({ nome, editando, origem, cardapio }) {
    aplicarCardapio(cardapio)
    setConflito(false)
    setAviso(editando ? `Alterações no produto ${nome} salvas.` : `O produto ${nome} foi cadastrado.`)
    if (editando && origem?.isConnected) origem.focus()
    else tituloRef?.current?.focus()
  }

  async function alternar(produto) {
    if (ocupado.current || !pronta) return
    ocupado.current = true
    setAlternandoId(produto.id)
    setAviso('')
    const ativo = !produto.ativo
    try {
      aplicarCardapio(await definirProdutoAtivo(dados, produto.id, ativo))
      setConflito(false)
      setAviso(ativo ? `O produto ${produto.nome} voltou ao cardápio.` : `O produto ${produto.nome} foi ocultado do cardápio.`)
    } catch (falha) {
      if (ehConflito(falha)) mostrarConflito()
      else setAviso(mensagemDoErro(falha))
    } finally {
      ocupado.current = false
      setAlternandoId(null)
    }
  }

  return (
    <CartaoTela>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 ref={tituloRef} tabIndex={-1} className="font-display text-3xl text-tinta focus:outline-none sm:text-4xl">
            Produtos
          </h1>
          <p className="mt-2 max-w-prose text-base text-tinta-suave">
            Produtos visíveis aparecem no cardápio quando a categoria deles também está visível.
          </p>
        </div>
        {temCategoriaAtiva && (
          <button
            ref={botaoAdicionarRef}
            type="button"
            onClick={abrirNovo}
            className={`${classePrimario} shrink-0 self-start`}
          >
            <Icone nome="adicionar" />
            Cadastrar produto
          </button>
        )}
      </div>

      {pronta && !temCategoriaAtiva && (
        <div className="mt-4 rounded-2xl border border-borda bg-manteiga px-4 py-3">
          <p className="text-base font-semibold text-tinta">Cadastre uma categoria antes de adicionar produtos.</p>
          <LinkRota href="/admin/painel/categorias" className={classeLink}>
            Ir para Categorias
          </LinkRota>
        </div>
      )}

      <AvisoConflito visivel={conflito} botaoRef={botaoRecarregarRef} aoRecarregar={tentarDeNovo} />
      <div role="status">
        {aviso && <p className="mt-4 rounded-xl bg-manteiga px-4 py-3 text-base font-semibold text-tinta">{aviso}</p>}
      </div>
      <p role="status" className="sr-only">
        {carregando ? 'Carregando a lista…' : ''}
      </p>

      <div className="mt-6" aria-busy={carregando ? 'true' : undefined}>
        <ListaProdutos
          carregando={carregando}
          erro={erro}
          dados={dados}
          alternandoId={alternandoId}
          aoEditar={abrirEdicao}
          aoAlternar={alternar}
          aoTentarDeNovo={tentarDeNovo}
        />
      </div>

      <AdicionarProduto controleRef={dialogoRef} cardapio={dados} aoSalvar={aoSalvar} aoConflito={mostrarConflito} />
    </CartaoTela>
  )
}

export default Produtos
