import { useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { IlustracaoCategoria } from '../../components/Categorias.jsx'
import Icone from '../../components/admin/Icone.jsx'
import { galeriaCategorias } from '../../components/icones/categorias.js'
import { categoriasPadrao, definirCategoriaAtiva, importarCategoriasPadrao } from '../../servicos/admin/categorias.js'
import { ehConflito } from '../../servicos/admin/errosPainel.js'
import { ErroServico, mensagemGenerica } from '../../servicos/erros.js'
import AdicionarCategoria from './AdicionarCategoria.jsx'
import AvisoConflito from './AvisoConflito.jsx'
import CartaoTela from './CartaoTela.jsx'
import { aplicarCardapio, recarregarCardapio, useCardapio } from './useCardapio.js'

const classeFoco = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tinta'

const classeBotaoContorno = `inline-flex min-h-11 items-center justify-center rounded-full border-2 border-tinta px-5 text-base font-semibold text-tinta hover:bg-tinta/10 aria-disabled:cursor-wait aria-disabled:hover:bg-transparent ${classeFoco}`

const classePrimario = `inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-tinta px-5 py-2 text-center text-base font-semibold text-mostarda hover:bg-tomate-escuro hover:text-papel aria-disabled:cursor-wait aria-disabled:hover:bg-tinta aria-disabled:hover:text-mostarda ${classeFoco}`

function mensagemDoErro(erro) {
  return erro instanceof ErroServico ? erro.message : mensagemGenerica
}

function ItemCategoria({ categoria, posicao, alternando, bloqueado, aoEditar, aoAlternar }) {
  const { nome, icone, ativa } = categoria
  return (
    <li className="flex gap-3 rounded-2xl border border-borda bg-creme p-3 sm:gap-4 sm:p-4">
      <IlustracaoCategoria
        icone={icone}
        posicao={ativa ? posicao : null}
        galeria={galeriaCategorias}
        className="size-16 shrink-0 rounded-xl sm:size-20"
        classeIcone="size-8 sm:size-10"
      />
      <div className="min-w-0 flex-1">
        <h2 className="text-lg font-semibold text-tinta [overflow-wrap:anywhere]">{nome || 'Sem nome'}</h2>
        {!ativa && (
          <p className="mt-1">
            <span className="rounded-full border border-tinta-suave px-2.5 py-0.5 text-sm font-semibold text-tinta">
              Oculta no site
            </span>
          </p>
        )}
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            aria-disabled={bloqueado ? 'true' : undefined}
            onClick={(evento) => aoEditar(categoria, evento.currentTarget)}
            className={`${classeBotaoContorno} px-4`}
          >
            Editar<span className="sr-only"> {nome}</span>
          </button>
          <button
            type="button"
            onClick={() => aoAlternar(categoria)}
            aria-disabled={alternando || bloqueado ? 'true' : undefined}
            className={`${classeBotaoContorno} px-4`}
          >
            {alternando ? 'Salvando…' : ativa ? 'Ocultar do site' : 'Mostrar no site'}
            <span className="sr-only">: {nome}</span>
          </button>
        </div>
      </div>
    </li>
  )
}

function ListaCategorias({ carregando, erro, categorias, alternandoId, aoEditar, aoAlternar, aoTentarDeNovo }) {
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
  if (carregando && (erro || categorias === null)) {
    return <p className="text-base text-tinta-suave">Carregando a lista…</p>
  }
  if (categorias.length === 0) {
    return (
      <p className="text-base text-tinta-suave">
        Nenhuma categoria cadastrada. Enquanto isso, a página inicial mostra “Em breve, novidades no cardápio.”. Você pode
        importar as {categoriasPadrao.length} categorias padrão: {categoriasPadrao.map((categoria) => categoria.nome).join(', ')}.
      </p>
    )
  }
  const posicoes = new Map(
    categorias.filter((categoria) => categoria.ativa && categoria.valida).map((categoria, indice) => [categoria.id, indice]),
  )
  return (
    <ul role="list" className="grid gap-3 lg:grid-cols-2">
      {categorias.map((categoria) => (
        <ItemCategoria
          key={categoria.id}
          categoria={categoria}
          posicao={posicoes.get(categoria.id) ?? null}
          alternando={alternandoId === categoria.id}
          bloqueado={carregando}
          aoEditar={aoEditar}
          aoAlternar={aoAlternar}
        />
      ))}
    </ul>
  )
}

function Categorias({ tituloRef }) {
  const { estado, dados, erro } = useCardapio()
  const [aviso, setAviso] = useState('')
  const [conflito, setConflito] = useState(false)
  const [alternandoId, setAlternandoId] = useState(null)
  const [importando, setImportando] = useState(false)
  const ocupado = useRef(false)
  const dialogoRef = useRef(null)
  const botaoAdicionarRef = useRef(null)
  const botaoRecarregarRef = useRef(null)

  const carregando = estado === 'ocioso' || estado === 'carregando'
  const pronta = estado === 'pronto'
  const categorias = dados?.categorias ?? null
  const erroLista = estado === 'erro' ? erro : ''
  const podeImportar = pronta && categorias.length === 0

  function recarregar() {
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

  function tratarFalha(falha) {
    if (ehConflito(falha)) mostrarConflito()
    else setAviso(mensagemDoErro(falha))
  }

  function abrirNova() {
    if (!pronta) return
    setAviso('')
    dialogoRef.current?.abrir(null, botaoAdicionarRef.current)
  }

  function abrirEdicao(categoria, origem) {
    if (!pronta) return
    const atual = dados.categorias.find((item) => item.id === categoria.id)
    if (!atual) return
    setAviso('')
    dialogoRef.current?.abrir(atual, origem)
  }

  function aoSalvar({ nome, editando, origem, cardapio }) {
    aplicarCardapio(cardapio)
    setConflito(false)
    setAviso(editando ? `Alterações em ${nome} salvas.` : `${nome} foi adicionada ao cardápio.`)
    if (editando && origem?.isConnected) origem.focus()
    else tituloRef?.current?.focus()
  }

  async function alternar(categoria) {
    if (ocupado.current || !pronta) return
    ocupado.current = true
    setAlternandoId(categoria.id)
    setAviso('')
    const ativa = !categoria.ativa
    try {
      aplicarCardapio(await definirCategoriaAtiva(dados, categoria.id, ativa))
      setConflito(false)
      setAviso(ativa ? `${categoria.nome} voltou a aparecer no site.` : `${categoria.nome} foi ocultada do site.`)
    } catch (falha) {
      tratarFalha(falha)
    } finally {
      ocupado.current = false
      setAlternandoId(null)
    }
  }

  async function importar() {
    if (ocupado.current || !pronta) return
    ocupado.current = true
    setImportando(true)
    setAviso('')
    try {
      aplicarCardapio(await importarCategoriasPadrao(dados))
      setConflito(false)
      setAviso(`As ${categoriasPadrao.length} categorias padrão foram importadas.`)
      tituloRef?.current?.focus()
    } catch (falha) {
      if (falha instanceof ErroServico && falha.codigo === 'categorias-ja-importadas') {
        setAviso('As categorias padrão já tinham sido importadas.')
        tituloRef?.current?.focus()
        recarregarCardapio()
      } else {
        tratarFalha(falha)
      }
    } finally {
      ocupado.current = false
      setImportando(false)
    }
  }

  return (
    <CartaoTela>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 ref={tituloRef} tabIndex={-1} className="font-display text-3xl text-tinta focus:outline-none sm:text-4xl">
            Categorias
          </h1>
          <p className="mt-2 max-w-prose text-base text-tinta-suave">
            As categorias visíveis aparecem na seção “Categorias de Produtos” da página inicial, nesta ordem.
          </p>
        </div>
        {pronta && (
          <button
            ref={botaoAdicionarRef}
            type="button"
            onClick={abrirNova}
            className={`${classePrimario} shrink-0 self-start`}
          >
            <Icone nome="adicionar" />
            Adicionar categoria
          </button>
        )}
      </div>

      <AvisoConflito visivel={conflito} botaoRef={botaoRecarregarRef} aoRecarregar={recarregar} />
      <div role="status">
        {aviso && <p className="mt-4 rounded-xl bg-manteiga px-4 py-3 text-base font-semibold text-tinta">{aviso}</p>}
      </div>
      <p role="status" className="sr-only">
        {carregando ? 'Carregando a lista…' : importando ? 'Importando…' : ''}
      </p>

      <div className="mt-6" aria-busy={carregando ? 'true' : undefined}>
        <ListaCategorias
          carregando={carregando}
          erro={erroLista}
          categorias={categorias}
          alternandoId={alternandoId}
          aoEditar={abrirEdicao}
          aoAlternar={alternar}
          aoTentarDeNovo={recarregar}
        />
      </div>

      {podeImportar && (
        <button
          type="button"
          onClick={importar}
          aria-disabled={importando ? 'true' : undefined}
          className={`${classeBotaoContorno} mt-4`}
        >
          {importando ? 'Importando…' : 'Importar categorias padrão'}
        </button>
      )}

      <AdicionarCategoria controleRef={dialogoRef} cardapio={dados} aoSalvar={aoSalvar} aoConflito={mostrarConflito} />
    </CartaoTela>
  )
}

export default Categorias
