import { useImperativeHandle, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import CampoTexto from '../../components/CampoTexto.jsx'
import SeloProduto from '../../components/SeloProduto.jsx'
import SeletorIcone from '../../components/admin/SeletorIcone.jsx'
import { chavesSeloGaleria, iconeSeloGenerico, iconesSelo } from '../../components/icones/selos.js'
import { removerVazios, temCaractereInvisivel } from '../../components/validacao.js'
import { useFormulario } from '../../hooks/useFormulario.js'
import { chaveNome } from '../../servicos/admin/categorias.js'
import { ehConflito } from '../../servicos/admin/errosPainel.js'
import {
  contarUsos,
  criarSelo,
  editarSelo,
  iconesAlergeno,
  mensagemSeloDuplicado,
  normalizarNomeSelo,
  textoProdutos,
} from '../../servicos/admin/selos.js'

const classeBotao =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 py-2 text-center text-base font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tinta'

const classePrimario = `${classeBotao} bg-tinta text-mostarda hover:bg-tomate-escuro hover:text-papel aria-disabled:cursor-wait aria-disabled:hover:bg-tinta aria-disabled:hover:text-mostarda`

const classeSecundario = `${classeBotao} border-2 border-tinta text-tinta hover:bg-tinta/10 aria-disabled:cursor-wait aria-disabled:hover:bg-transparent`

const NOME_MINIMO = 2

const NOME_MAXIMO = 30

const galeriaSelos = Object.freeze(Object.fromEntries(chavesSeloGaleria.map((chave) => [chave, iconesSelo[chave]])))

function galeriaDoSelo(iconeAtual) {
  if (!iconeAtual || Object.hasOwn(galeriaSelos, iconeAtual) || !Object.hasOwn(iconesSelo, iconeAtual)) return galeriaSelos
  return { ...galeriaSelos, [iconeAtual]: iconesSelo[iconeAtual] }
}

const alergenos = {
  'sem-gluten': { termo: 'gluten', rotulo: 'Sem glúten', palavra: 'glúten' },
  'sem-lactose': { termo: 'lactose', rotulo: 'Sem lactose', palavra: 'lactose' },
  'sem-acucar': { termo: 'acucar', rotulo: 'Sem açúcar', palavra: 'açúcar' },
}

const termosLacteos = [
  { termo: 'lactose', palavra: 'lactose' },
  { termo: 'leite', palavra: 'leite' },
  { termo: 'lacteo', palavra: 'lácteos' },
  { termo: 'laticinio', palavra: 'laticínios' },
]

const presencas = {
  gluten: [
    { termo: 'gluten', palavra: 'glúten' },
    { termo: 'trigo', palavra: 'trigo' },
  ],
  lacteo: termosLacteos,
  queijo: termosLacteos,
}

const frasesAusencia = ['sem', 's', 'zero', 'livre de', 'livres de', 'nao contem', 'isento de', 'isenta de', 'isentos de', 'isentas de']

const frasesPresenca = ['contem', 'com']

const negacoes = [' nao ', ' nao e ', ' nao eh ']

function negado(chave, trecho) {
  return negacoes.some((negacao) => chave.includes(`${negacao.trimEnd()}${trecho}`))
}

function achar(chave, trechos) {
  return trechos.some((trecho) => chave.includes(trecho) && !negado(chave, trecho))
}

function formas(termo) {
  return [termo, `${termo}s`]
}

function nomeNaGaleria(chaveIcone, rotulo) {
  const daGaleria = Object.hasOwn(iconesSelo, chaveIcone) ? iconesSelo[chaveIcone].rotulo : ''
  return daGaleria && daGaleria !== rotulo ? `${rotulo} (${daGaleria})` : rotulo
}

function temAusencia(chave, termo) {
  const trechos = formas(termo).flatMap((forma) => [...frasesAusencia.map((frase) => ` ${frase} ${forma} `), ` ${forma} free `])
  return achar(chave, trechos)
}

function temPresenca(chave, termo) {
  return achar(
    chave,
    formas(termo).flatMap((forma) => frasesPresenca.map((frase) => ` ${frase} ${forma} `)),
  )
}

function alertaAlergeno(nome, icone) {
  if (!icone) return ''
  const chave = ` ${chaveNome(nome).replace(/[^a-z0-9]+/g, ' ')} `
  const doIcone = Object.hasOwn(alergenos, icone) ? alergenos[icone] : null
  if (doIcone && (!temAusencia(chave, doIcone.termo) || temPresenca(chave, doIcone.termo))) {
    return `Esse ícone indica ${doIcone.rotulo}, mas o nome não diz que o produto é sem ${doIcone.palavra}. Confira antes de salvar.`
  }
  const contradito = Object.hasOwn(presencas, icone) ? presencas[icone].find(({ termo }) => temAusencia(chave, termo)) : null
  if (contradito) {
    return `O nome diz que o produto é sem ${contradito.palavra}, mas o ícone escolhido indica que contém ${contradito.palavra}. Confira antes de salvar.`
  }
  const doNome = Object.entries(alergenos).find(([chaveIcone, { termo }]) => chaveIcone !== icone && temAusencia(chave, termo))
  if (doNome) {
    const [chaveIcone, { rotulo, palavra }] = doNome
    return `O nome fala de sem ${palavra}, mas o ícone escolhido não é o de ${nomeNaGaleria(chaveIcone, rotulo)}. Confira antes de salvar.`
  }
  return ''
}

function erroNome(nome, selos, idAtual) {
  const limpo = normalizarNomeSelo(nome)
  if (limpo === '') return 'Informe o nome do selo.'
  if (temCaractereInvisivel(limpo)) return 'O nome tem caracteres inválidos. Digite de novo.'
  if (limpo.length < NOME_MINIMO) return `Use pelo menos ${NOME_MINIMO} caracteres.`
  if (limpo.length > NOME_MAXIMO) return `Use no máximo ${NOME_MAXIMO} caracteres.`
  const chave = chaveNome(limpo)
  if (selos.some((selo) => selo.id !== idAtual && chaveNome(selo.nome) === chave)) return mensagemSeloDuplicado
  return undefined
}

const mensagemConfirmar = 'Marque a confirmação para salvar.'

function validarSelo({ nome, icone, confirmado, confirmadoUso }, contexto) {
  const alerta = alertaAlergeno(nome, icone)
  return removerVazios({
    nome: erroNome(nome, contexto.selos, contexto.idAtual),
    icone: icone && Object.hasOwn(contexto.galeria, icone) ? undefined : 'Escolha um ícone.',
    confirmado: alerta && confirmado !== alerta ? mensagemConfirmar : undefined,
    confirmadoUso: contexto.usos > 0 && confirmadoUso !== 'sim' ? mensagemConfirmar : undefined,
  })
}

function impedirEnvio(evento) {
  evento.preventDefault()
}

function FormularioSelo({ selo, cardapio, campoRef, bloqueioRef, aoCancelar, aoConcluir, aoConflito }) {
  const editando = selo !== null
  const galeria = galeriaDoSelo(selo?.icone)
  const selos = cardapio?.selos ?? []
  const usos = editando ? contarUsos(cardapio?.produtos ?? [], selo.id) : 0
  const travado = usos > 0 && iconesAlergeno.includes(selo.icone)

  const { valores, erros, aviso, enviando, alterar, registrar, aoEnviar } = useFormulario({
    inicial: { nome: selo?.nome ?? '', icone: selo?.icone ?? '', confirmado: '', confirmadoUso: '' },
    validar: (atuais) => validarSelo(atuais, { selos, idAtual: selo?.id, galeria, usos }),
    enviar: async ({ nome, icone }) => {
      bloqueioRef.current = true
      let proximo
      try {
        proximo = editando ? await editarSelo(cardapio, selo.id, { nome, icone }) : await criarSelo(cardapio, { nome, icone })
      } catch (falha) {
        bloqueioRef.current = false
        if (!ehConflito(falha)) throw falha
        aoConflito()
        return ''
      } finally {
        bloqueioRef.current = false
      }
      aoConcluir({ nome: normalizarNomeSelo(nome), editando, cardapio: proximo })
      return ''
    },
  })

  function registrarNome(elemento) {
    registrar('nome')(elemento)
    campoRef.current = elemento
  }

  const nomePrevia = valores.nome.trim() || 'Nome do selo'
  const alerta = alertaAlergeno(valores.nome, valores.icone)

  function alterarDesconfirmando(campo) {
    const mudarCampo = alterar(campo)
    const mudarConfirmacao = alterar('confirmado')
    const mudarConfirmacaoUso = alterar('confirmadoUso')
    return (evento) => {
      mudarCampo(evento)
      mudarConfirmacao({ target: { value: '' } })
      mudarConfirmacaoUso({ target: { value: '' } })
    }
  }

  function alternarConfirmacaoUso(evento) {
    alterar('confirmadoUso')({ target: { value: evento.target.checked ? 'sim' : '' } })
  }

  if (travado) {
    return (
      <form noValidate onSubmit={impedirEnvio} className="mt-4 space-y-5">
        <CampoTexto
          id="nome-selo"
          rotulo="Nome"
          autoComplete="off"
          readOnly
          required={false}
          className="block min-h-11 w-full cursor-default rounded-xl border-2 border-transparent bg-creme px-3 py-2 text-base font-semibold text-tinta focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tinta"
          dica={`Não dá para mudar o nome: este selo indica alérgeno e está em ${textoProdutos(usos)}. Para mudar, crie um selo novo e troque nos produtos.`}
          value={valores.nome}
          inputRef={registrarNome}
        />

        <figure aria-hidden="true">
          <figcaption className="text-sm font-semibold text-tinta">Como aparece no produto</figcaption>
          <div className="mt-2">
            <SeloProduto nome={valores.nome || 'Sem nome'} icone={valores.icone || iconeSeloGenerico} />
          </div>
        </figure>

        <button type="button" onClick={aoCancelar} className={classeSecundario}>
          Fechar
        </button>
      </form>
    )
  }

  function alternarConfirmacao(evento) {
    alterar('confirmado')({ target: { value: evento.target.checked ? alerta : '' } })
  }

  return (
    <form noValidate onSubmit={aoEnviar} className="mt-4 space-y-5">
      <CampoTexto
        id="nome-selo"
        rotulo="Nome"
        autoComplete="off"
        maxLength={NOME_MAXIMO}
        dica={`De ${NOME_MINIMO} a ${NOME_MAXIMO} caracteres, como aparece no produto.`}
        value={valores.nome}
        onChange={alterarDesconfirmando('nome')}
        inputRef={registrarNome}
        erro={erros.nome}
      />

      <SeletorIcone
        galeria={galeria}
        nome="icone-selo"
        valor={valores.icone}
        onMudar={alterarDesconfirmando('icone')}
        erro={erros.icone}
        idErro="icone-selo-erro"
        idDescricao={alerta ? 'alerta-selo' : undefined}
        campoRef={registrar('icone')}
      />

      <div role="status">
        {alerta && (
          <p id="alerta-selo" className="rounded-xl border-2 border-tomate-escuro bg-manteiga px-4 py-3 text-base font-semibold text-tinta">
            {alerta}
          </p>
        )}
      </div>

      {alerta && (
        <div className="-mt-2 space-y-1.5">
          <label className="flex min-h-11 cursor-pointer items-center gap-3 text-base text-tinta">
            <input
              ref={registrar('confirmado')}
              type="checkbox"
              checked={valores.confirmado === alerta}
              onChange={alternarConfirmacao}
              aria-invalid={erros.confirmado ? true : undefined}
              aria-describedby={erros.confirmado ? 'confirmado-selo-erro alerta-selo' : 'alerta-selo'}
              className="size-5 shrink-0 accent-tinta focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tinta"
            />
            Confirmo que o ícone está correto para esse selo
          </label>
          {erros.confirmado && (
            <p id="confirmado-selo-erro" className="text-sm font-medium text-tomate-escuro">
              {erros.confirmado}
            </p>
          )}
        </div>
      )}

      {usos > 0 && (
        <div className="space-y-1.5 rounded-xl border border-borda bg-creme px-4 py-3">
          <p id="usos-selo" className="text-base font-semibold text-tinta">
            Usado em {textoProdutos(usos)}.
          </p>
          <label className="flex min-h-11 cursor-pointer items-center gap-3 text-base text-tinta">
            <input
              ref={registrar('confirmadoUso')}
              type="checkbox"
              checked={valores.confirmadoUso === 'sim'}
              onChange={alternarConfirmacaoUso}
              aria-invalid={erros.confirmadoUso ? true : undefined}
              aria-describedby={erros.confirmadoUso ? 'confirmado-uso-selo-erro usos-selo' : 'usos-selo'}
              className="size-5 shrink-0 accent-tinta focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tinta"
            />
            Confirmo a alteração em todos esses produtos
          </label>
          {erros.confirmadoUso && (
            <p id="confirmado-uso-selo-erro" className="text-sm font-medium text-tomate-escuro">
              {erros.confirmadoUso}
            </p>
          )}
        </div>
      )}

      <figure aria-hidden="true">
        <figcaption className="text-sm font-semibold text-tinta">Como aparece no produto</figcaption>
        <div className="mt-2">
          <SeloProduto nome={nomePrevia} icone={valores.icone || iconeSeloGenerico} />
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
          {enviando ? 'Salvando…' : editando ? 'Salvar alterações' : 'Adicionar selo'}
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

function AdicionarSelo({ controleRef, cardapio, aoSalvar, aoConflito }) {
  const [sessao, setSessao] = useState({ abertura: 0, selo: null })
  const dialogoRef = useRef(null)
  const campoRef = useRef(null)
  const origemRef = useRef(null)
  const bloqueioRef = useRef(false)
  const concluiu = useRef(false)

  useImperativeHandle(controleRef, () => ({
    abrir(selo, origem) {
      concluiu.current = false
      origemRef.current = origem ?? null
      flushSync(() => setSessao((atual) => ({ abertura: atual.abertura + 1, selo: selo ?? null })))
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

  const { selo } = sessao
  const editando = selo !== null
  const travado = editando && iconesAlergeno.includes(selo.icone) && contarUsos(cardapio?.produtos ?? [], selo.id) > 0

  return (
    <dialog
      ref={dialogoRef}
      aria-labelledby="titulo-dialogo-selo"
      onCancel={aoCancelarDialogo}
      onClose={aoFechar}
      className="m-auto max-h-[calc(100dvh-1.5rem)] w-[min(calc(100%-1.5rem),40rem)] max-w-none overflow-y-auto rounded-3xl border border-borda bg-papel p-5 text-tinta shadow-2xl backdrop:bg-tinta/50 sm:p-7"
    >
      <h2 id="titulo-dialogo-selo" className="font-display text-2xl text-tinta">
        {travado ? 'Selo em uso' : editando ? 'Editar selo' : 'Adicionar selo'}
      </h2>
      {sessao.abertura > 0 && (
        <FormularioSelo
          key={sessao.abertura}
          selo={selo}
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

export default AdicionarSelo
