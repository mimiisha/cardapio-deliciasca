import { useImperativeHandle, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { CartaoCategoria } from '../../components/Categorias.jsx'
import CampoTexto from '../../components/CampoTexto.jsx'
import SeletorIcone from '../../components/admin/SeletorIcone.jsx'
import { galeriaCategorias, iconeCategoriaGenerico, iconesCategoria } from '../../components/icones/categorias.js'
import { removerVazios, temCaractereInvisivel } from '../../components/validacao.js'
import { useFormulario } from '../../hooks/useFormulario.js'
import { chaveNome, criarCategoria, editarCategoria, normalizarNomeCategoria } from '../../servicos/admin/categorias.js'
import { ehConflito, mensagemNomeDuplicado } from '../../servicos/admin/errosPainel.js'

const classeBotao =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 py-2 text-center text-base font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tinta'

const classePrimario = `${classeBotao} bg-tinta text-mostarda hover:bg-tomate-escuro hover:text-papel aria-disabled:cursor-wait aria-disabled:hover:bg-tinta aria-disabled:hover:text-mostarda`

const classeSecundario = `${classeBotao} border-2 border-tinta text-tinta hover:bg-tinta/10 aria-disabled:cursor-wait aria-disabled:hover:bg-transparent`

const NOME_MINIMO = 2

const NOME_MAXIMO = 40

function erroNome(nome, categorias, idAtual) {
  const limpo = normalizarNomeCategoria(nome)
  if (limpo === '') return 'Informe o nome da categoria.'
  if (temCaractereInvisivel(limpo)) return 'O nome tem caracteres inválidos. Digite de novo.'
  if (limpo.length < NOME_MINIMO) return `Use pelo menos ${NOME_MINIMO} caracteres.`
  if (limpo.length > NOME_MAXIMO) return `Use no máximo ${NOME_MAXIMO} caracteres.`
  const chave = chaveNome(limpo)
  if (categorias.some((categoria) => categoria.id !== idAtual && chaveNome(categoria.nome) === chave)) {
    return mensagemNomeDuplicado
  }
  return undefined
}

function validarCategoria({ nome, icone }, categorias, idAtual) {
  return removerVazios({
    nome: erroNome(nome, categorias, idAtual),
    icone: icone ? undefined : 'Escolha um ícone.',
  })
}

function FormularioCategoria({ categoria, cardapio, posicao, oculta, campoRef, bloqueioRef, aoCancelar, aoConcluir, aoConflito }) {
  const categorias = cardapio?.categorias ?? []
  const editando = categoria !== null

  const { valores, erros, aviso, enviando, alterar, registrar, aoEnviar } = useFormulario({
    inicial: { nome: categoria?.nome ?? '', icone: categoria?.icone ?? '' },
    validar: (atuais) => validarCategoria(atuais, categorias, categoria?.id),
    enviar: async ({ nome, icone }) => {
      bloqueioRef.current = true
      let proximo
      try {
        proximo = editando
          ? await editarCategoria(cardapio, categoria.id, { nome, icone })
          : await criarCategoria(cardapio, { nome, icone })
      } catch (falha) {
        bloqueioRef.current = false
        if (!ehConflito(falha)) throw falha
        aoConflito()
        return ''
      } finally {
        bloqueioRef.current = false
      }
      aoConcluir({ nome: normalizarNomeCategoria(nome), editando, cardapio: proximo })
      return ''
    },
  })

  function registrarNome(elemento) {
    registrar('nome')(elemento)
    campoRef.current = elemento
  }

  const nomePrevia = valores.nome.trim() || 'Nome da categoria'

  return (
    <form noValidate onSubmit={aoEnviar} className="mt-4 space-y-5">
      <CampoTexto
        id="nome-categoria"
        rotulo="Nome"
        autoComplete="off"
        maxLength={NOME_MAXIMO}
        dica={`De ${NOME_MINIMO} a ${NOME_MAXIMO} caracteres, como aparece na página inicial.`}
        value={valores.nome}
        onChange={alterar('nome')}
        inputRef={registrarNome}
        erro={erros.nome}
      />

      <SeletorIcone
        galeria={iconesCategoria}
        nome="icone-categoria"
        valor={valores.icone}
        onMudar={alterar('icone')}
        erro={erros.icone}
        idErro="icone-categoria-erro"
        campoRef={registrar('icone')}
      />

      <figure aria-hidden="true">
        <figcaption className="text-sm font-semibold text-tinta">
          {oculta ? 'Como aparece na página inicial quando mostrada no site' : 'Como aparece na página inicial'}
        </figcaption>
        <div className="mt-2 w-32 sm:w-40">
          <CartaoCategoria
            elemento="div"
            interativo={false}
            nome={nomePrevia}
            icone={valores.icone || iconeCategoriaGenerico}
            posicao={posicao}
            galeria={galeriaCategorias}
          />
        </div>
      </figure>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <button
          type="submit"
          aria-disabled={enviando ? 'true' : undefined}
          onClick={(evento) => {
            if (enviando) evento.preventDefault()
          }}
          className={classePrimario}
        >
          {enviando ? 'Salvando…' : editando ? 'Salvar alterações' : 'Adicionar categoria'}
        </button>
        <button
          type="button"
          onClick={aoCancelar}
          aria-disabled={enviando ? 'true' : undefined}
          className={classeSecundario}
        >
          Cancelar
        </button>
      </div>

      <div role="status">
        {enviando ? (
          <span className="sr-only">Salvando…</span>
        ) : (
          aviso && <p className="text-base font-medium text-tinta">{aviso}</p>
        )}
      </div>
    </form>
  )
}

function AdicionarCategoria({ controleRef, cardapio, aoSalvar, aoConflito }) {
  const [sessao, setSessao] = useState({ abertura: 0, categoria: null })
  const dialogoRef = useRef(null)
  const campoRef = useRef(null)
  const origemRef = useRef(null)
  const bloqueioRef = useRef(false)
  const concluiu = useRef(false)

  useImperativeHandle(controleRef, () => ({
    abrir(categoria, origem) {
      concluiu.current = false
      origemRef.current = origem ?? null
      flushSync(() => setSessao((atual) => ({ abertura: atual.abertura + 1, categoria: categoria ?? null })))
      dialogoRef.current?.showModal()
      campoRef.current?.focus()
    },
  }))

  function fechar() {
    if (bloqueioRef.current) return
    dialogoRef.current?.close()
  }

  function aoCancelarDialogo(evento) {
    if (bloqueioRef.current) evento.preventDefault()
  }

  function aoFechar() {
    if (bloqueioRef.current) {
      dialogoRef.current?.showModal()
      campoRef.current?.focus()
      return
    }
    if (!concluiu.current) origemRef.current?.focus()
  }

  function aoConcluir(resultado) {
    concluiu.current = true
    dialogoRef.current?.close()
    aoSalvar({ ...resultado, origem: origemRef.current })
  }

  function aoConflitoFormulario() {
    concluiu.current = true
    dialogoRef.current?.close()
    aoConflito()
  }

  const categorias = cardapio?.categorias ?? []

  const { categoria } = sessao
  const editando = categoria !== null
  const ativas = categorias.filter((item) => item.ativa && item.valida)
  const oculta = editando && !categoria.ativa
  const posicao = editando && categoria.ativa && categoria.valida ? ativas.findIndex((item) => item.id === categoria.id) : ativas.length

  return (
    <dialog
      ref={dialogoRef}
      aria-labelledby="titulo-dialogo-categoria"
      onCancel={aoCancelarDialogo}
      onClose={aoFechar}
      className="m-auto max-h-[calc(100dvh-1.5rem)] w-[min(calc(100%-1.5rem),40rem)] max-w-none overflow-y-auto rounded-3xl border border-borda bg-papel p-5 text-tinta shadow-2xl backdrop:bg-tinta/50 sm:p-7"
    >
      <h2 id="titulo-dialogo-categoria" className="font-display text-2xl text-tinta">
        {editando ? 'Editar categoria' : 'Adicionar categoria'}
      </h2>
      {sessao.abertura > 0 && (
        <FormularioCategoria
          key={sessao.abertura}
          categoria={categoria}
          cardapio={cardapio}
          posicao={Math.max(posicao, 0)}
          oculta={oculta}
          campoRef={campoRef}
          bloqueioRef={bloqueioRef}
          aoCancelar={fechar}
          aoConcluir={aoConcluir}
          aoConflito={aoConflitoFormulario}
        />
      )}
    </dialog>
  )
}

export default AdicionarCategoria
