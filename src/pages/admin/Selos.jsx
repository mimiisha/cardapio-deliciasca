import { useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import SeloProduto from '../../components/SeloProduto.jsx'
import Icone from '../../components/admin/Icone.jsx'
import { ehConflito } from '../../servicos/admin/errosPainel.js'
import { contarUsos, definirSeloAtivo, iconesPresenca, textoProdutos } from '../../servicos/admin/selos.js'
import { ErroServico, mensagemGenerica } from '../../servicos/erros.js'
import AdicionarSelo from './AdicionarSelo.jsx'
import AvisoConflito from './AvisoConflito.jsx'
import CartaoTela from './CartaoTela.jsx'
import { aplicarCardapio, recarregarCardapio, useCardapio } from './useCardapio.js'

const classeFoco = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tinta'

const classeBotaoContorno = `inline-flex min-h-11 items-center justify-center rounded-full border-2 border-tinta px-5 text-base font-semibold text-tinta hover:bg-tinta/10 aria-disabled:cursor-wait aria-disabled:hover:bg-transparent ${classeFoco}`

const classePrimario = `inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-tinta px-5 py-2 text-center text-base font-semibold text-mostarda hover:bg-tomate-escuro hover:text-papel aria-disabled:cursor-wait aria-disabled:hover:bg-tinta aria-disabled:hover:text-mostarda ${classeFoco}`

function mensagemDoErro(erro) {
  return erro instanceof ErroServico ? erro.message : mensagemGenerica
}

function ConfirmarOcultar({ selo, usos, confirmarRef, aoConfirmar, aoCancelar }) {
  const idTexto = `ocultar-selo-${selo.id}`
  return (
    <div className="mt-3 rounded-xl border-2 border-tomate-escuro bg-papel p-3">
      <p id={idTexto} className="text-base font-semibold text-tinta">
        Ocultar remove o aviso de {textoProdutos(usos)} no site.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          ref={confirmarRef}
          type="button"
          onClick={() => aoConfirmar(selo)}
          aria-describedby={idTexto}
          className={`${classePrimario} px-4`}
        >
          Ocultar mesmo assim<span className="sr-only">: {selo.nome}</span>
        </button>
        <button type="button" onClick={aoCancelar} className={`${classeBotaoContorno} px-4`}>
          Cancelar
        </button>
      </div>
    </div>
  )
}

function ItemSelo({ selo, usos, alternando, bloqueado, confirmando, confirmarRef, aoEditar, aoAlternar, aoConfirmar, aoCancelar }) {
  const { icone, ativo } = selo
  const nome = selo.nome || 'Sem nome'
  return (
    <li className="rounded-2xl border border-borda bg-creme p-3 sm:p-4">
      <h2>
        <SeloProduto nome={nome} icone={icone} />
        {!ativo && <span className="sr-only">, oculto</span>}
      </h2>
      {!ativo && (
        <p className="mt-2">
          <span aria-hidden="true" className="rounded-full border border-tinta-suave px-2.5 py-0.5 text-sm font-semibold text-tinta">
            Oculto
          </span>
        </p>
      )}
      {usos > 0 && <p className="mt-2 text-sm text-tinta-suave">Usado em {textoProdutos(usos)}.</p>}
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          aria-disabled={bloqueado ? 'true' : undefined}
          onClick={(evento) => aoEditar(selo, evento.currentTarget)}
          className={`${classeBotaoContorno} px-4`}
        >
          Editar<span className="sr-only"> {nome}</span>
        </button>
        <button
          type="button"
          onClick={(evento) => aoAlternar(selo, evento.currentTarget)}
          aria-disabled={alternando || bloqueado ? 'true' : undefined}
          className={`${classeBotaoContorno} px-4`}
        >
          {alternando ? 'Salvando…' : ativo ? 'Ocultar dos produtos' : 'Mostrar nos produtos'}
          <span className="sr-only">: {nome}</span>
        </button>
      </div>
      {confirmando && (
        <ConfirmarOcultar
          selo={selo}
          usos={usos}
          confirmarRef={confirmarRef}
          aoConfirmar={aoConfirmar}
          aoCancelar={aoCancelar}
        />
      )}
    </li>
  )
}

function ListaSelos({ carregando, erro, dados, alternandoId, confirmandoId, confirmarRef, acoes }) {
  if (erro && !carregando) {
    return (
      <div role="alert" className="rounded-2xl border-2 border-tomate-escuro bg-creme p-4">
        <p className="text-base font-semibold text-tinta">Não foi possível carregar a lista.</p>
        <p className="mt-1 text-sm text-tinta">{erro}</p>
        <button type="button" onClick={acoes.aoTentarDeNovo} className={`${classeBotaoContorno} mt-3`}>
          Tentar de novo
        </button>
      </div>
    )
  }
  if (carregando && (erro || dados === null)) {
    return <p className="text-base text-tinta-suave">Carregando a lista…</p>
  }
  if (dados.selos.length === 0) {
    return <p className="text-base text-tinta-suave">Nenhum selo cadastrado.</p>
  }
  return (
    <ul role="list" className="grid gap-3 lg:grid-cols-2">
      {dados.selos.map((selo) => (
        <ItemSelo
          key={selo.id}
          selo={selo}
          usos={contarUsos(dados.produtos, selo.id)}
          alternando={alternandoId === selo.id}
          bloqueado={carregando}
          confirmando={confirmandoId === selo.id}
          confirmarRef={confirmarRef}
          aoEditar={acoes.aoEditar}
          aoAlternar={acoes.aoAlternar}
          aoConfirmar={acoes.aoConfirmar}
          aoCancelar={acoes.aoCancelar}
        />
      ))}
    </ul>
  )
}

function Selos({ tituloRef }) {
  const { estado, dados, erro } = useCardapio()
  const [aviso, setAviso] = useState('')
  const [conflito, setConflito] = useState(false)
  const [alternandoId, setAlternandoId] = useState(null)
  const [confirmandoId, setConfirmandoId] = useState(null)
  const ocupado = useRef(false)
  const dialogoRef = useRef(null)
  const botaoAdicionarRef = useRef(null)
  const botaoRecarregarRef = useRef(null)
  const confirmarRef = useRef(null)
  const origemConfirmacao = useRef(null)

  const carregando = estado === 'ocioso' || estado === 'carregando'
  const pronta = estado === 'pronto'
  const erroLista = estado === 'erro' ? erro : ''

  function recarregar() {
    setAviso('')
    setConflito(false)
    setConfirmandoId(null)
    tituloRef?.current?.focus()
    recarregarCardapio()
  }

  function mostrarConflito() {
    flushSync(() => {
      setAviso('')
      setConfirmandoId(null)
      setConflito(true)
    })
    botaoRecarregarRef.current?.focus()
  }

  function abrirNovo() {
    if (!pronta) return
    setAviso('')
    dialogoRef.current?.abrir(null, botaoAdicionarRef.current)
  }

  function abrirEdicao(selo, origem) {
    if (!pronta) return
    const atual = dados.selos.find((item) => item.id === selo.id)
    if (!atual) return
    setAviso('')
    setConfirmandoId(null)
    dialogoRef.current?.abrir(atual, origem)
  }

  function aoSalvar({ nome, editando, origem, cardapio }) {
    aplicarCardapio(cardapio)
    setConflito(false)
    setAviso(editando ? `Alterações no selo ${nome} salvas.` : `O selo ${nome} foi adicionado.`)
    if (editando && origem?.isConnected) origem.focus()
    else tituloRef?.current?.focus()
  }

  async function gravarAtivo(selo, ativo) {
    if (ocupado.current || !pronta) return
    ocupado.current = true
    setAlternandoId(selo.id)
    setAviso('')
    try {
      aplicarCardapio(await definirSeloAtivo(dados, selo.id, ativo))
      setConflito(false)
      setAviso(ativo ? `O selo ${selo.nome} voltou a aparecer nos produtos.` : `O selo ${selo.nome} foi ocultado dos produtos.`)
    } catch (falha) {
      if (ehConflito(falha)) mostrarConflito()
      else setAviso(mensagemDoErro(falha))
    } finally {
      ocupado.current = false
      setAlternandoId(null)
    }
  }

  function alternar(selo, origem) {
    if (ocupado.current || !pronta) return
    const usos = contarUsos(dados.produtos, selo.id)
    if (selo.ativo && usos > 0 && iconesPresenca.includes(selo.icone)) {
      origemConfirmacao.current = origem
      setAviso('')
      flushSync(() => setConfirmandoId(selo.id))
      confirmarRef.current?.focus()
      return
    }
    setConfirmandoId(null)
    gravarAtivo(selo, !selo.ativo)
  }

  function confirmarOcultar(selo) {
    const origem = origemConfirmacao.current
    setConfirmandoId(null)
    if (origem?.isConnected) origem.focus()
    gravarAtivo(selo, false)
  }

  function cancelarOcultar() {
    const origem = origemConfirmacao.current
    flushSync(() => setConfirmandoId(null))
    if (origem?.isConnected) origem.focus()
  }

  return (
    <CartaoTela>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 ref={tituloRef} tabIndex={-1} className="font-display text-3xl text-tinta focus:outline-none sm:text-4xl">
            Selos
          </h1>
          <p className="mt-2 max-w-prose text-base text-tinta-suave">
            Os selos visíveis aparecem nos produtos do cardápio do site.
          </p>
        </div>
        {pronta && (
          <button
            ref={botaoAdicionarRef}
            type="button"
            onClick={abrirNovo}
            className={`${classePrimario} shrink-0 self-start`}
          >
            <Icone nome="adicionar" />
            Adicionar selo
          </button>
        )}
      </div>

      <AvisoConflito visivel={conflito} botaoRef={botaoRecarregarRef} aoRecarregar={recarregar} />
      <div role="status">
        {aviso && <p className="mt-4 rounded-xl bg-manteiga px-4 py-3 text-base font-semibold text-tinta">{aviso}</p>}
      </div>
      <p role="status" className="sr-only">
        {carregando ? 'Carregando a lista…' : ''}
      </p>

      <div className="mt-6" aria-busy={carregando ? 'true' : undefined}>
        <ListaSelos
          carregando={carregando}
          erro={erroLista}
          dados={dados}
          alternandoId={alternandoId}
          confirmandoId={confirmandoId}
          confirmarRef={confirmarRef}
          acoes={{
            aoEditar: abrirEdicao,
            aoAlternar: alternar,
            aoConfirmar: confirmarOcultar,
            aoCancelar: cancelarOcultar,
            aoTentarDeNovo: recarregar,
          }}
        />
      </div>

      <AdicionarSelo controleRef={dialogoRef} cardapio={dados} aoSalvar={aoSalvar} aoConflito={mostrarConflito} />
    </CartaoTela>
  )
}

export default Selos
