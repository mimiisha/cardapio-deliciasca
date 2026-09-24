import { useImperativeHandle, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import CampoTexto from '../../components/CampoTexto.jsx'
import SeloProduto from '../../components/SeloProduto.jsx'
import Icone from '../../components/admin/Icone.jsx'
import { analisarPreco, formatarPrecoParaCampo, lerPrecoEmCentavos } from '../../components/preco.js'
import { removerVazios, temCaractereInvisivel } from '../../components/validacao.js'
import { useFormulario } from '../../hooks/useFormulario.js'
import { chaveNome } from '../../servicos/admin/categorias.js'
import { ehConflito } from '../../servicos/admin/errosPainel.js'
import {
  criarProduto,
  editarProduto,
  mensagemProdutoDuplicado,
  normalizarNomeProduto,
  novoIdTamanho,
} from '../../servicos/admin/produtos.js'

const classeFoco = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tinta'

const classeBotao = `inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 py-2 text-center text-base font-semibold ${classeFoco}`

const classePrimario = `${classeBotao} bg-tinta text-mostarda hover:bg-tomate-escuro hover:text-papel aria-disabled:cursor-wait aria-disabled:hover:bg-tinta aria-disabled:hover:text-mostarda`

const classeSecundario = `${classeBotao} border-2 border-tinta text-tinta hover:bg-tinta/10 aria-disabled:cursor-wait aria-disabled:hover:bg-transparent`

const classeCampo = `block min-h-11 w-full rounded-xl border-2 bg-papel px-3 py-2 text-base text-tinta ${classeFoco}`

const NOME_MINIMO = 2

const NOME_MAXIMO = 60

const DESCRICAO_MAXIMA = 160

const TAMANHO_NOME_MAXIMO = 20

const TAMANHOS_MAXIMO = 6

const SELOS_MAXIMO = 6

const mensagensPreco = {
  vazio: 'Informe o preço, por exemplo 18,50.',
  invalido: 'Use só números, com até 2 casas depois da vírgula, por exemplo 18,50.',
  zero: 'O preço precisa ser maior que zero.',
  acima: 'O preço máximo é R$ 1.000,00.',
}

function limpar(texto) {
  return texto.normalize('NFC').trim()
}

function erroNome(nome, produtos, idAtual) {
  const limpo = normalizarNomeProduto(nome)
  if (limpo === '') return 'Informe o nome do produto.'
  if (temCaractereInvisivel(limpo)) return 'O nome tem caracteres inválidos. Digite de novo.'
  if (limpo.length < NOME_MINIMO) return `Use pelo menos ${NOME_MINIMO} caracteres.`
  if (limpo.length > NOME_MAXIMO) return `Use no máximo ${NOME_MAXIMO} caracteres.`
  const chave = chaveNome(limpo)
  if (produtos.some((produto) => produto.id !== idAtual && chaveNome(produto.nome) === chave)) return mensagemProdutoDuplicado
  return undefined
}

function erroDescricao(descricao) {
  const limpa = limpar(descricao)
  if (temCaractereInvisivel(limpa)) return 'A descrição tem caracteres inválidos. Digite de novo.'
  if (limpa.length > DESCRICAO_MAXIMA) return `Use no máximo ${DESCRICAO_MAXIMA} caracteres.`
  return undefined
}

function erroNomeTamanho(nome, indice, tamanhos) {
  const limpo = limpar(nome)
  if (limpo === '') return tamanhos.length > 1 ? 'Informe o nome do tamanho.' : undefined
  if (temCaractereInvisivel(limpo)) return 'O nome tem caracteres inválidos. Digite de novo.'
  if (limpo.length > TAMANHO_NOME_MAXIMO) return `Use no máximo ${TAMANHO_NOME_MAXIMO} caracteres.`
  const chave = chaveNome(limpo)
  const repetido = tamanhos.slice(0, indice).some((outro) => chaveNome(limpar(outro.nome)) === chave)
  return repetido ? 'Já existe um tamanho com esse nome.' : undefined
}

function errosTamanhos(tamanhos) {
  const linhas = tamanhos.map((tamanho, indice) => {
    const { motivo } = analisarPreco(tamanho.preco)
    return removerVazios({ nome: erroNomeTamanho(tamanho.nome, indice, tamanhos), preco: mensagensPreco[motivo] })
  })
  return linhas.some((linha) => linha.nome || linha.preco) ? linhas : undefined
}

function validarProduto(valores, contexto) {
  return removerVazios({
    nome: erroNome(valores.nome, contexto.produtos, contexto.idAtual),
    descricao: erroDescricao(valores.descricao),
    categoriaId: contexto.categoriasValidas.has(valores.categoriaId) ? undefined : 'Escolha a categoria.',
    tamanhos: errosTamanhos(valores.tamanhos),
    selosIds: valores.selosIds.length > SELOS_MAXIMO ? `Escolha no máximo ${SELOS_MAXIMO} selos.` : undefined,
  })
}

function contarErros(erros) {
  return Object.entries(erros).reduce((total, [campo, erro]) => {
    if (campo !== 'tamanhos') return total + 1
    return total + erro.reduce((soma, linha) => soma + (linha.nome ? 1 : 0) + (linha.preco ? 1 : 0), 0)
  }, 0)
}

function opcoesCategoria(categorias, idAtual) {
  return categorias
    .filter((categoria) => categoria.ativa || categoria.id === idAtual)
    .map((categoria) => ({
      id: categoria.id,
      rotulo: categoria.ativa ? categoria.nome : `${categoria.nome} (oculta)`,
    }))
}

function valoresIniciais(produto, categorias, selos) {
  if (!produto) {
    return { nome: '', descricao: '', categoriaId: '', tamanhos: [{ id: novoIdTamanho(), nome: '', preco: '' }], selosIds: [] }
  }
  const existeCategoria = categorias.some((categoria) => categoria.id === produto.categoriaId)
  const idsSelos = new Set(selos.map((selo) => selo.id))
  const tamanhos = produto.tamanhos.map(({ id, nome, precoCentavos }) => ({
    id,
    nome,
    preco: precoCentavos > 0 ? formatarPrecoParaCampo(precoCentavos) : '',
  }))
  return {
    nome: produto.nome,
    descricao: produto.descricao,
    categoriaId: existeCategoria ? produto.categoriaId : '',
    tamanhos: tamanhos.length > 0 ? tamanhos : [{ id: novoIdTamanho(), nome: '', preco: '' }],
    selosIds: produto.selosIds.filter((id) => idsSelos.has(id)),
  }
}

function CampoCategoria({ valor, opcoes, erro, aoMudar, campoRef }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor="categoria-produto" className="block text-sm font-semibold">
        Categoria
      </label>
      <select
        ref={campoRef}
        id="categoria-produto"
        required
        value={valor}
        onChange={aoMudar}
        aria-invalid={erro ? true : undefined}
        aria-describedby={erro ? 'categoria-produto-erro' : undefined}
        className={`${classeCampo} ${erro ? 'border-tomate-escuro' : 'border-tinta-suave'}`}
      >
        <option value="">Escolha a categoria</option>
        {opcoes.map((opcao) => (
          <option key={opcao.id} value={opcao.id}>
            {opcao.rotulo}
          </option>
        ))}
      </select>
      {erro && (
        <p id="categoria-produto-erro" className="text-sm font-medium text-tomate-escuro">
          {erro}
        </p>
      )}
    </div>
  )
}

function LinhaTamanho({ tamanho, posicao, total, erro, nomeRef, aoMudar, aoFormatar, aoRemover }) {
  const base = `tamanho-${tamanho.id}`
  const unico = total === 1
  const descricaoNome = [unico && 'tamanhos-dica', erro?.nome && `${base}-nome-erro`].filter(Boolean).join(' ')
  const descricaoPreco = erro?.preco ? `${base}-preco-erro` : undefined

  return (
    <li>
      <fieldset className="rounded-2xl border border-borda bg-creme p-3 sm:p-4">
        <legend className={unico ? 'sr-only' : 'px-1 text-sm font-semibold text-tinta'}>Tamanho {posicao}</legend>
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_11rem_auto] sm:items-start">
          <div className="space-y-1.5">
            <label htmlFor={`${base}-nome`} className="block text-sm font-semibold">
              Nome do tamanho
            </label>
            <input
              ref={nomeRef}
              id={`${base}-nome`}
              type="text"
              autoComplete="off"
              required={!unico}
              maxLength={TAMANHO_NOME_MAXIMO}
              value={tamanho.nome}
              onChange={(evento) => aoMudar(tamanho.id, 'nome', evento.target.value)}
              aria-invalid={erro?.nome ? true : undefined}
              aria-describedby={descricaoNome || undefined}
              className={`${classeCampo} ${erro?.nome ? 'border-tomate-escuro' : 'border-tinta-suave'}`}
            />
            {erro?.nome && (
              <p id={`${base}-nome-erro`} className="text-sm font-medium text-tomate-escuro">
                {erro.nome}
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <label htmlFor={`${base}-preco`} className="block text-sm font-semibold">
              Preço<span className="sr-only"> em reais</span>
            </label>
            <div className="flex items-center gap-2">
              <span aria-hidden="true" className="text-base font-semibold text-tinta">
                R$
              </span>
              <input
                id={`${base}-preco`}
                type="text"
                inputMode="decimal"
                autoComplete="off"
                required
                maxLength={12}
                value={tamanho.preco}
                onChange={(evento) => aoMudar(tamanho.id, 'preco', evento.target.value)}
                onBlur={() => aoFormatar(tamanho.id)}
                aria-invalid={erro?.preco ? true : undefined}
                aria-describedby={descricaoPreco}
                className={`${classeCampo} ${erro?.preco ? 'border-tomate-escuro' : 'border-tinta-suave'}`}
              />
            </div>
            {erro?.preco && (
              <p id={`${base}-preco-erro`} className="text-sm font-medium text-tomate-escuro">
                {erro.preco}
              </p>
            )}
          </div>
          {!unico && (
            <button
              type="button"
              onClick={() => aoRemover(tamanho.id)}
              className={`${classeSecundario} min-w-11 px-4 sm:mt-[1.625rem]`}
            >
              Remover<span className="sr-only"> tamanho {posicao}</span>
            </button>
          )}
        </div>
      </fieldset>
    </li>
  )
}

function CampoTamanhos({ tamanhos, erros, campoRef, aoMudarLista }) {
  const nomes = useRef(new Map())

  function registrarNome(id) {
    return (elemento) => {
      if (elemento) nomes.current.set(id, elemento)
      else nomes.current.delete(id)
    }
  }

  function registrarGrupo(elemento) {
    campoRef(elemento ? { focus: () => elemento.querySelector('[aria-invalid="true"]')?.focus() } : null)
  }

  function mudar(id, campo, valor) {
    aoMudarLista(tamanhos.map((tamanho) => (tamanho.id === id ? { ...tamanho, [campo]: valor } : tamanho)))
  }

  function formatar(id) {
    const tamanho = tamanhos.find((item) => item.id === id)
    const centavos = tamanho ? lerPrecoEmCentavos(tamanho.preco) : null
    if (centavos === null) return
    const formatado = formatarPrecoParaCampo(centavos)
    if (formatado !== tamanho.preco) mudar(id, 'preco', formatado)
  }

  function focarNome(id) {
    nomes.current.get(id)?.focus()
  }

  function adicionar() {
    if (tamanhos.length >= TAMANHOS_MAXIMO) return
    const novo = { id: novoIdTamanho(), nome: '', preco: '' }
    flushSync(() => aoMudarLista([...tamanhos, novo]))
    focarNome(novo.id)
  }

  function remover(id) {
    const indice = tamanhos.findIndex((tamanho) => tamanho.id === id)
    const restantes = tamanhos.filter((tamanho) => tamanho.id !== id)
    const alvo = restantes[indice] ?? restantes[indice - 1]
    flushSync(() => aoMudarLista(restantes))
    if (alvo) focarNome(alvo.id)
  }

  return (
    <fieldset ref={registrarGrupo} className="space-y-3">
      <legend className="text-base font-semibold text-tinta">Tamanhos e preços</legend>
      {tamanhos.length === 1 && (
        <p id="tamanhos-dica" className="text-sm text-tinta-suave">
          Deixe o nome em branco se houver um só tamanho.
        </p>
      )}
      <ul role="list" className="space-y-3">
        {tamanhos.map((tamanho, indice) => (
          <LinhaTamanho
            key={tamanho.id}
            tamanho={tamanho}
            posicao={indice + 1}
            total={tamanhos.length}
            erro={erros?.[indice]}
            nomeRef={registrarNome(tamanho.id)}
            aoMudar={mudar}
            aoFormatar={formatar}
            aoRemover={remover}
          />
        ))}
      </ul>
      {tamanhos.length < TAMANHOS_MAXIMO ? (
        <button type="button" onClick={adicionar} className={classeSecundario}>
          <Icone nome="adicionar" />
          Adicionar tamanho
        </button>
      ) : (
        <p className="text-sm text-tinta-suave">Máximo de {TAMANHOS_MAXIMO} tamanhos.</p>
      )}
    </fieldset>
  )
}

function CampoSelos({ opcoes, marcados, campoRef, aoMudar }) {
  const quantidade = marcados.length
  const excesso = quantidade - SELOS_MAXIMO
  const mensagemLimite =
    excesso > 0
      ? `Você escolheu ${quantidade} selos. Desmarque ${excesso} para ficar com até ${SELOS_MAXIMO}.`
      : excesso === 0
        ? `Limite de ${SELOS_MAXIMO} atingido.`
        : ''
  const descricao = ['selos-produto-contador', mensagemLimite && 'selos-produto-limite'].filter(Boolean).join(' ')

  function registrarGrupo(elemento) {
    campoRef(elemento ? { focus: () => (elemento.querySelector('input:checked') ?? elemento.querySelector('input'))?.focus() } : null)
  }

  function alternar(id, marcado) {
    aoMudar(marcado ? [...marcados, id] : marcados.filter((item) => item !== id))
  }

  return (
    <fieldset ref={registrarGrupo} aria-describedby={descricao} className="space-y-2">
      <legend className="text-base font-semibold text-tinta">Selos (até {SELOS_MAXIMO})</legend>
      <p id="selos-produto-contador" className="text-sm text-tinta-suave">
        {quantidade} de {SELOS_MAXIMO} {quantidade === 1 ? 'escolhido' : 'escolhidos'}
      </p>
      <div role="status">
        {mensagemLimite && (
          <p
            id="selos-produto-limite"
            className={`text-sm font-semibold ${excesso > 0 ? 'text-tomate-escuro' : 'text-tinta'}`}
          >
            {mensagemLimite}
          </p>
        )}
      </div>
      {opcoes.length === 0 ? (
        <p className="text-base text-tinta-suave">Nenhum selo cadastrado.</p>
      ) : (
        <ul role="list" className="grid gap-1 sm:grid-cols-2">
          {opcoes.map((selo) => {
            const marcado = marcados.includes(selo.id)
            return (
              <li key={selo.id}>
                <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl px-2 py-1 text-base text-tinta hover:bg-tinta/5">
                  <input
                    type="checkbox"
                    checked={marcado}
                    onChange={(evento) => alternar(selo.id, evento.target.checked)}
                    className={`size-5 shrink-0 accent-tinta ${classeFoco}`}
                  />
                  <span className="flex min-w-0 flex-wrap items-center gap-x-2">
                    <SeloProduto nome={selo.nome || 'Sem nome'} icone={selo.icone} />
                    {!selo.ativo && <span className="text-sm text-tinta-suave">(oculto)</span>}
                  </span>
                </label>
              </li>
            )
          })}
        </ul>
      )}
    </fieldset>
  )
}

function FormularioProduto({ produto, cardapio, campoRef, bloqueioRef, aoCancelar, aoConcluir, aoConflito }) {
  const editando = produto !== null
  const produtos = cardapio?.produtos ?? []
  const categorias = cardapio?.categorias ?? []
  const selos = cardapio?.selos ?? []
  const [inicial] = useState(() => valoresIniciais(produto, categorias, selos))
  const opcoes = opcoesCategoria(categorias, editando ? produto.categoriaId : null)
  const [opcoesSelo] = useState(() =>
    selos.filter((selo) => selo.ativo || inicial.selosIds.includes(selo.id)),
  )
  const contexto = {
    produtos,
    idAtual: produto?.id,
    categoriasValidas: new Set(opcoes.map((opcao) => opcao.id)),
  }

  const { valores, erros, aviso, enviando, alterar, registrar, aoEnviar } = useFormulario({
    inicial,
    validar: (atuais) => validarProduto(atuais, contexto),
    contar: contarErros,
    enviar: async ({ nome, descricao, categoriaId, tamanhos, selosIds }) => {
      const dados = {
        nome,
        descricao,
        categoriaId,
        selosIds: opcoesSelo.filter((selo) => selosIds.includes(selo.id)).map((selo) => selo.id),
        tamanhos: tamanhos.map((tamanho) => ({
          id: tamanho.id,
          nome: tamanho.nome,
          precoCentavos: lerPrecoEmCentavos(tamanho.preco),
        })),
      }
      bloqueioRef.current = true
      let proximo
      try {
        proximo = editando ? await editarProduto(cardapio, produto.id, dados) : await criarProduto(cardapio, dados)
      } catch (falha) {
        bloqueioRef.current = false
        if (!ehConflito(falha)) throw falha
        aoConflito()
        return ''
      } finally {
        bloqueioRef.current = false
      }
      aoConcluir({ nome: normalizarNomeProduto(nome), editando, cardapio: proximo })
      return ''
    },
  })

  function registrarNome(elemento) {
    registrar('nome')(elemento)
    campoRef.current = elemento
  }

  function definir(campo) {
    return (valor) => alterar(campo)({ target: { value: valor } })
  }

  return (
    <form noValidate onSubmit={aoEnviar} className="mt-4 space-y-6">
      <CampoTexto
        id="nome-produto"
        rotulo="Nome"
        autoComplete="off"
        maxLength={NOME_MAXIMO}
        dica={`De ${NOME_MINIMO} a ${NOME_MAXIMO} caracteres, como aparece no cardápio.`}
        value={valores.nome}
        onChange={alterar('nome')}
        inputRef={registrarNome}
        erro={erros.nome}
      />

      <CampoTexto
        id="descricao-produto"
        rotulo="Descrição curta (opcional)"
        required={false}
        autoComplete="off"
        maxLength={DESCRICAO_MAXIMA}
        dica={`${valores.descricao.length} de ${DESCRICAO_MAXIMA} caracteres`}
        value={valores.descricao}
        onChange={alterar('descricao')}
        inputRef={registrar('descricao')}
        erro={erros.descricao}
      />

      <CampoCategoria
        valor={valores.categoriaId}
        opcoes={opcoes}
        erro={erros.categoriaId}
        aoMudar={alterar('categoriaId')}
        campoRef={registrar('categoriaId')}
      />

      <CampoTamanhos
        tamanhos={valores.tamanhos}
        erros={erros.tamanhos}
        campoRef={registrar('tamanhos')}
        aoMudarLista={definir('tamanhos')}
      />

      <CampoSelos
        opcoes={opcoesSelo}
        marcados={valores.selosIds}
        campoRef={registrar('selosIds')}
        aoMudar={definir('selosIds')}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <button
          type="submit"
          aria-disabled={enviando ? 'true' : undefined}
          onClick={(evento) => {
            if (enviando) evento.preventDefault()
          }}
          className={classePrimario}
        >
          {enviando ? 'Salvando…' : editando ? 'Salvar alterações' : 'Cadastrar produto'}
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

function AdicionarProduto({ controleRef, cardapio, aoSalvar, aoConflito }) {
  const [sessao, setSessao] = useState({ abertura: 0, produto: null })
  const dialogoRef = useRef(null)
  const campoRef = useRef(null)
  const origemRef = useRef(null)
  const bloqueioRef = useRef(false)
  const concluiu = useRef(false)

  useImperativeHandle(controleRef, () => ({
    abrir(produto, origem) {
      concluiu.current = false
      origemRef.current = origem ?? null
      flushSync(() => setSessao((atual) => ({ abertura: atual.abertura + 1, produto: produto ?? null })))
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

  const { produto } = sessao
  const editando = produto !== null

  return (
    <dialog
      ref={dialogoRef}
      aria-labelledby="titulo-dialogo-produto"
      onCancel={aoCancelarDialogo}
      onClose={aoFechar}
      className="m-auto max-h-[calc(100dvh-1.5rem)] w-[min(calc(100%-1.5rem),46rem)] max-w-none overflow-y-auto rounded-3xl border border-borda bg-papel p-5 text-tinta shadow-2xl backdrop:bg-tinta/50 sm:p-7"
    >
      <h2 id="titulo-dialogo-produto" className="font-display text-2xl text-tinta">
        {editando ? 'Editar produto' : 'Cadastrar produto'}
      </h2>
      {sessao.abertura > 0 && (
        <FormularioProduto
          key={sessao.abertura}
          produto={produto}
          cardapio={cardapio}
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

export default AdicionarProduto
