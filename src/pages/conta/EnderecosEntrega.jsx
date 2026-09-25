import { useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import LinkRota from '../../components/LinkRota.jsx'
import {
  LIMITE_ENDERECOS,
  adicionarEndereco,
  definirPadrao,
  editarEndereco,
  linhasEndereco,
  mensagemLimiteEnderecos,
  removerEndereco,
} from '../../servicos/enderecos.js'
import { ErroServico, mensagemGenerica } from '../../servicos/erros.js'
import FormularioEndereco, { classeBotaoPrincipal, classeBotaoSecundario } from './FormularioEndereco.jsx'

function mensagemDoErro(erro) {
  if (erro instanceof ErroServico) return erro.message
  if (import.meta.env.DEV) console.error('[enderecos] erro inesperado', erro)
  return mensagemGenerica
}

function tituloEndereco(endereco) {
  const linhas = linhasEndereco(endereco)
  return endereco.apelido ? { titulo: endereco.apelido, linhas } : { titulo: linhas[0], linhas: linhas.slice(1) }
}

function mapaDeRefs(mapa, id) {
  return (elemento) => {
    if (elemento) mapa.set(id, elemento)
    else mapa.delete(id)
  }
}

function ConfirmarRemocao({ id, titulo, aviso, textoRef, removendo, aoConfirmar, aoCancelar }) {
  const avisoId = `endereco-${id}-aviso-remocao`
  return (
    <div className="mt-3 rounded-xl border-2 border-tomate-escuro bg-papel p-3">
      <p ref={textoRef} tabIndex={-1} className="rounded text-base font-semibold text-tinta [overflow-wrap:anywhere] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tinta">
        Remover “{titulo}”?
      </p>
      <p id={avisoId} className="mt-1 text-sm text-tinta">{aviso}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          aria-describedby={avisoId}
          aria-disabled={removendo ? 'true' : undefined}
          onClick={aoConfirmar}
          className="inline-flex min-h-11 items-center justify-center rounded-full bg-tomate-escuro px-4 text-sm font-semibold text-papel hover:bg-tinta focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tinta aria-disabled:cursor-wait"
        >
          {removendo ? 'Removendo…' : 'Sim, remover'}
        </button>
        <button type="button" onClick={aoCancelar} className={classeBotaoSecundario}>
          Cancelar
        </button>
      </div>
    </div>
  )
}

function ItemEndereco({ endereco, padrao, refs, children }) {
  const { titulo, linhas } = tituloEndereco(endereco)
  const tituloId = `endereco-${endereco.id}-titulo`
  return (
    <>
      <h3
        id={tituloId}
        ref={mapaDeRefs(refs.titulos, endereco.id)}
        tabIndex={-1}
        className="rounded font-display text-lg text-tinta [overflow-wrap:anywhere] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tinta"
      >
        {titulo}
        {padrao && (
          <span className="ml-3 inline-block rounded-full border border-tinta-suave/70 bg-manteiga px-2.5 py-0.5 align-middle font-sans text-sm font-semibold text-tinta">
            Padrão
          </span>
        )}
      </h3>
      {linhas.length > 0 && (
        <p className="mt-1 text-base text-tinta [overflow-wrap:anywhere]">
          {linhas.map((linha) => (
            <span key={linha} className="block">
              {linha}
            </span>
          ))}
        </p>
      )}
      {endereco.referencia && (
        <p className="mt-1 text-sm text-tinta-suave [overflow-wrap:anywhere]">Referência: {endereco.referencia}</p>
      )}
      {children(titulo)}
    </>
  )
}

function AcoesEndereco({ id, titulo, padrao, ocupado, refs, aoEditar, aoTornarPadrao, aoRemover }) {
  const desabilitado = ocupado ? 'true' : undefined
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      <button
        type="button"
        ref={mapaDeRefs(refs.editar, id)}
        aria-disabled={desabilitado}
        onClick={aoEditar}
        className={classeBotaoSecundario}
      >
        Editar<span className="sr-only"> {titulo}</span>
      </button>
      {!padrao && (
        <button type="button" aria-disabled={desabilitado} onClick={aoTornarPadrao} className={classeBotaoSecundario}>
          Tornar padrão<span className="sr-only"> {titulo}</span>
        </button>
      )}
      <button
        type="button"
        ref={mapaDeRefs(refs.remover, id)}
        aria-disabled={desabilitado}
        onClick={aoRemover}
        className={classeBotaoSecundario}
      >
        Remover<span className="sr-only"> {titulo}</span>
      </button>
    </div>
  )
}

function ListaEnderecos({ enderecos, padraoId, aplicar, recarregar, secaoRef }) {
  const [modo, setModo] = useState(null)
  const [confirmando, setConfirmando] = useState(null)
  const [ocupado, setOcupado] = useState(null)
  const [aviso, setAviso] = useState('')
  const [desatualizada, setDesatualizada] = useState(false)
  const [refs] = useState(() => ({ titulos: new Map(), editar: new Map(), remover: new Map() }))
  const formularioRef = useRef(null)
  const confirmacaoRef = useRef(null)
  const adicionarRef = useRef(null)
  const cheio = enderecos.length >= LIMITE_ENDERECOS
  const atual = { enderecos, padraoId }

  function registrarFalha(erro) {
    if (erro instanceof ErroServico && erro.codigo === 'lista-desatualizada') setDesatualizada(true)
  }

  function abrirFormulario(novoModo) {
    flushSync(() => {
      setModo(novoModo)
      setConfirmando(null)
      setAviso('')
    })
    formularioRef.current?.focus()
  }

  function adicionar() {
    if (cheio || ocupado) return
    abrirFormulario({ tipo: 'novo' })
  }

  function focarOrigem(origem) {
    if (origem.tipo === 'editar') refs.editar.get(origem.id)?.focus()
    else adicionarRef.current?.focus()
  }

  function cancelarFormulario() {
    const origem = modo
    flushSync(() => setModo(null))
    focarOrigem(origem)
  }

  async function salvar(valores, { padrao }) {
    const origem = modo
    let resultado
    try {
      resultado =
        origem.tipo === 'novo'
          ? await adicionarEndereco(atual, valores, { padrao })
          : await editarEndereco(atual, origem.id, valores, { padrao })
    } catch (erro) {
      registrarFalha(erro)
      throw erro
    }
    flushSync(() => {
      aplicar(resultado)
      setModo(null)
      setAviso(resultado.mensagem)
    })
    const titulo = refs.titulos.get(resultado.id)
    if (titulo) titulo.focus()
    else focarOrigem(origem)
  }

  function pedirRemocao(id) {
    if (ocupado) return
    flushSync(() => {
      setConfirmando(id)
      setAviso('')
    })
    confirmacaoRef.current?.focus()
  }

  function cancelarRemocao(id) {
    flushSync(() => setConfirmando(null))
    refs.remover.get(id)?.focus()
  }

  async function executar(id, acao, focarDepois) {
    if (ocupado) return
    setOcupado(id)
    setAviso('')
    try {
      const resultado = await acao()
      flushSync(() => {
        aplicar(resultado)
        setConfirmando(null)
        setAviso(resultado.mensagem)
      })
      focarDepois(resultado)
    } catch (erro) {
      registrarFalha(erro)
      setAviso(mensagemDoErro(erro))
    } finally {
      setOcupado(null)
    }
  }

  function confirmarRemocao(id) {
    const indice = enderecos.findIndex((endereco) => endereco.id === id)
    const proximo = enderecos[indice + 1] ?? null
    executar(
      id,
      () => removerEndereco(atual, id),
      () => {
        if (proximo) refs.titulos.get(proximo.id)?.focus()
        else adicionarRef.current?.focus()
      },
    )
  }

  function tornarPadrao(id) {
    executar(
      id,
      () => definirPadrao(atual, id),
      () => refs.titulos.get(id)?.focus(),
    )
  }

  function recarregarLista() {
    flushSync(() => recarregar())
    secaoRef.current?.focus()
  }

  function avisoRemocao(endereco) {
    if (endereco.id !== padraoId) return 'Essa ação não pode ser desfeita.'
    const proximo = enderecos.find((item) => item.id !== endereco.id)
    return proximo
      ? `${tituloEndereco(proximo).titulo} passará a ser o endereço padrão.`
      : 'Você ficará sem endereço padrão.'
  }

  return (
    <>
      <p role="status" className={aviso ? 'mb-4 text-base font-semibold text-tinta' : 'sr-only'}>
        {aviso}
      </p>
      {desatualizada && (
        <button type="button" onClick={recarregarLista} className={`mb-4 ${classeBotaoSecundario}`}>
          Recarregar endereços
        </button>
      )}
      {enderecos.length === 0 ? (
        <p className="text-base text-tinta">Você ainda não tem endereços cadastrados.</p>
      ) : (
        <ul role="list" className="space-y-3">
          {enderecos.map((endereco) => {
            const ehPadrao = endereco.id === padraoId
            const editando = modo?.tipo === 'editar' && modo.id === endereco.id
            return (
              <li key={endereco.id} className="rounded-2xl border border-borda bg-creme px-4 py-4">
                {editando ? (
                  <FormularioEndereco
                    titulo="Editar endereço"
                    tituloRef={formularioRef}
                    endereco={endereco}
                    modoPadrao={ehPadrao ? 'atual' : 'escolher'}
                    aoSalvar={salvar}
                    aoCancelar={cancelarFormulario}
                  />
                ) : (
                  <ItemEndereco endereco={endereco} padrao={ehPadrao} refs={refs}>
                    {(titulo) =>
                      confirmando === endereco.id ? (
                        <ConfirmarRemocao
                          id={endereco.id}
                          titulo={titulo}
                          aviso={avisoRemocao(endereco)}
                          textoRef={confirmacaoRef}
                          removendo={ocupado === endereco.id}
                          aoConfirmar={() => confirmarRemocao(endereco.id)}
                          aoCancelar={() => cancelarRemocao(endereco.id)}
                        />
                      ) : (
                        <AcoesEndereco
                          id={endereco.id}
                          titulo={titulo}
                          padrao={ehPadrao}
                          ocupado={Boolean(ocupado)}
                          refs={refs}
                          aoEditar={() => !ocupado && abrirFormulario({ tipo: 'editar', id: endereco.id })}
                          aoTornarPadrao={() => tornarPadrao(endereco.id)}
                          aoRemover={() => pedirRemocao(endereco.id)}
                        />
                      )
                    }
                  </ItemEndereco>
                )}
              </li>
            )
          })}
        </ul>
      )}
      {modo?.tipo === 'novo' ? (
        <div className="mt-4 rounded-2xl border border-borda bg-creme px-4 py-4">
          <FormularioEndereco
            titulo="Novo endereço"
            tituloRef={formularioRef}
            endereco={null}
            modoPadrao={padraoId === null ? 'primeiro' : 'escolher'}
            aoSalvar={salvar}
            aoCancelar={cancelarFormulario}
          />
        </div>
      ) : (
        <div className="mt-4">
          <button
            ref={adicionarRef}
            type="button"
            aria-disabled={cheio || ocupado ? 'true' : undefined}
            aria-describedby={cheio ? 'enderecos-limite' : undefined}
            onClick={adicionar}
            className={classeBotaoPrincipal}
          >
            Adicionar endereço
          </button>
          {cheio && (
            <p id="enderecos-limite" className="mt-2 text-sm text-tinta-suave">
              {mensagemLimiteEnderecos}
            </p>
          )}
        </div>
      )}
    </>
  )
}

function EnderecosEntrega({ estadoConta, lista, secaoRef }) {
  if (estadoConta === 'carregando') return <p className="text-base text-tinta-suave">Carregando seus dados…</p>
  if (estadoConta === 'erro') return <p className="text-base text-tinta-suave">Seus dados não foram carregados.</p>
  if (estadoConta === 'incompleto') return <p className="text-base text-tinta">Complete seus dados para cadastrar endereços.</p>
  if (lista.estado === 'erro') {
    const semSessao = lista.erro?.codigo === 'sem-sessao'
    return (
      <>
        <p role="alert" className="text-base text-tinta">
          {mensagemDoErro(lista.erro)}
        </p>
        {semSessao ? (
          <LinkRota href="/entrar" className={`mt-4 ${classeBotaoPrincipal}`}>
            Entrar de novo
          </LinkRota>
        ) : (
          <button
            type="button"
            onClick={() => {
              flushSync(() => lista.recarregar())
              secaoRef.current?.focus()
            }}
            className={`mt-4 ${classeBotaoPrincipal}`}
          >
            Tentar de novo
          </button>
        )}
      </>
    )
  }
  if (lista.estado !== 'pronto') return <p className="text-base text-tinta-suave">Carregando endereços…</p>
  return (
    <ListaEnderecos
      enderecos={lista.enderecos}
      padraoId={lista.padraoId}
      aplicar={lista.aplicar}
      recarregar={lista.recarregar}
      secaoRef={secaoRef}
    />
  )
}

export default EnderecosEntrega
