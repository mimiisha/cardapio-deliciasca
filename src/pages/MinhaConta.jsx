import { useEffect, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import BarraTopo from '../components/BarraTopo.jsx'
import Header from '../components/Header.jsx'
import Footer from '../components/Footer.jsx'
import LinkRota from '../components/LinkRota.jsx'
import FormularioAuth from '../components/FormularioAuth.jsx'
import CampoTexto from '../components/CampoTexto.jsx'
import { erroNome, erroWhatsapp, removerVazios, tamanhoMaximoNome } from '../components/validacao.js'
import { useFormulario } from '../hooks/useFormulario.js'
import { atualizarMinhaConta, completarCadastro, lerMinhaConta } from '../servicos/conta.js'
import { ErroServico, mensagemGenerica } from '../servicos/erros.js'
import { formatarWhatsapp } from '../servicos/normalizar.js'
import { resumoAvatar } from '../components/icones/avatares.js'
import { useSessao } from '../hooks/useSessao.js'
import FotoPerfil from './conta/FotoPerfil.jsx'
import EnderecosEntrega from './conta/EnderecosEntrega.jsx'
import { resumoEnderecos, useEnderecos } from './conta/useEnderecos.js'

const secoesEmBreve = [
  { id: 'senha', titulo: 'Trocar senha', texto: 'Em breve.' },
  { id: 'excluir', titulo: 'Excluir minha conta', texto: 'Em breve.' },
]

const classeBotao =
  'flex min-h-11 w-full items-center justify-center rounded-full bg-tinta px-6 text-base font-semibold text-mostarda hover:bg-tomate-escuro hover:text-papel focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tinta sm:w-auto'

const classeAvisoIncompleto = 'mt-6 rounded-2xl border-2 border-tomate-escuro bg-manteiga px-4 py-4 sm:px-5'

function validar({ nome, whatsapp }) {
  return removerVazios({ nome: erroNome(nome), whatsapp: erroWhatsapp(whatsapp) })
}

function mensagemDoErro(erro) {
  return erro instanceof ErroServico ? erro.message : mensagemGenerica
}

function EmailSomenteLeitura({ email }) {
  return (
    <dl className="space-y-1.5 sm:col-span-2">
      <dt className="text-sm font-semibold">E-mail</dt>
      <dd className="text-base text-tinta [overflow-wrap:anywhere]">{email}</dd>
      <dd className="text-sm text-tinta-suave">Para trocar o e-mail, fale com a gente.</dd>
    </dl>
  )
}

function CamposPessoais({ prefixo, valores, erros, registrar, alterar, nomeRef }) {
  const registrarNome = registrar('nome')
  return (
    <>
      <CampoTexto
        id={`${prefixo}-nome`}
        rotulo="Nome"
        erro={erros.nome}
        inputRef={(elemento) => {
          registrarNome(elemento)
          if (nomeRef) nomeRef.current = elemento
        }}
        name="nome"
        type="text"
        autoComplete="name"
        maxLength={tamanhoMaximoNome}
        value={valores.nome}
        onChange={alterar('nome')}
      />
      <CampoTexto
        id={`${prefixo}-whatsapp`}
        rotulo="WhatsApp"
        erro={erros.whatsapp}
        inputRef={registrar('whatsapp')}
        name="whatsapp"
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        maxLength={20}
        value={valores.whatsapp}
        onChange={alterar('whatsapp')}
      />
    </>
  )
}

function FormularioCompletarCadastro({ dados, nomeRef, aoConcluir }) {
  const { valores, erros, aviso, enviando, alterar, registrar, aoEnviar } = useFormulario({
    inicial: { nome: dados.nome, whatsapp: '' },
    validar,
    enviar: async (enviados) => {
      aoConcluir(await completarCadastro(enviados))
    },
  })

  return (
    <FormularioAuth larga aoEnviar={aoEnviar} rotuloBotao="Completar cadastro" aviso={aviso} enviando={enviando}>
      <CamposPessoais
        prefixo="completar"
        valores={valores}
        erros={erros}
        registrar={registrar}
        alterar={alterar}
        nomeRef={nomeRef}
      />
      <EmailSomenteLeitura email={dados.email} />
    </FormularioAuth>
  )
}

function FormularioMeusDados({ dados, aoSalvar }) {
  const { valores, erros, aviso, enviando, alterar, registrar, aoEnviar } = useFormulario({
    inicial: { nome: dados.nome, whatsapp: formatarWhatsapp(dados.whatsapp) },
    validar,
    enviar: async (enviados) => {
      const resultado = await atualizarMinhaConta(enviados)
      aoSalvar(resultado)
      return {
        mensagem: resultado.mensagem,
        valores: { nome: resultado.nome, whatsapp: formatarWhatsapp(resultado.whatsapp) },
      }
    },
  })

  return (
    <FormularioAuth larga aoEnviar={aoEnviar} rotuloBotao="Salvar alterações" aviso={aviso} enviando={enviando}>
      <CamposPessoais prefixo="conta" valores={valores} erros={erros} registrar={registrar} alterar={alterar} />
      <EmailSomenteLeitura email={dados.email} />
    </FormularioAuth>
  )
}

function SecaoConta({ id, titulo, resumo, aberta, aoAlternar, botaoRef, children }) {
  const painelId = `secao-${id}`
  const resumoId = `secao-${id}-resumo`
  const mostrarResumo = !aberta && Boolean(resumo)
  return (
    <section className="border-b border-borda">
      <h2 className="-mx-2 font-display text-xl text-tinta sm:text-2xl">
        <button
          ref={botaoRef}
          type="button"
          aria-expanded={aberta}
          aria-controls={painelId}
          aria-describedby={mostrarResumo ? resumoId : undefined}
          onClick={aoAlternar}
          className="my-1 flex min-h-14 w-full items-center gap-3 rounded-lg px-2 py-2 text-left hover:text-tomate-escuro focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tinta"
        >
          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span>{titulo}</span>
            {mostrarResumo && (
              <span
                id={resumoId}
                aria-hidden="true"
                className="font-sans text-sm text-tinta-suave [overflow-wrap:anywhere]"
              >
                {resumo}
              </span>
            )}
          </span>
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`size-6 shrink-0 motion-safe:transition-transform ${aberta ? 'rotate-180' : ''}`}
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>
      </h2>
      <div id={painelId} hidden={!aberta} className="pb-6">
        {children}
      </div>
    </section>
  )
}

function resumoDados(carga) {
  if (carga.estado === 'carregando') return 'Carregando…'
  if (carga.estado === 'erro') return 'Não foi possível carregar'
  if (carga.estado === 'incompleto') return 'Incompleto'
  const { nome, whatsapp } = carga.dados
  if (!whatsapp) return nome
  return (
    <>
      {nome && `${nome} · `}
      <span className="whitespace-nowrap">{formatarWhatsapp(whatsapp)}</span>
    </>
  )
}

function MinhaConta({ tituloRef }) {
  const [carga, setCarga] = useState({ estado: 'carregando' })
  const [tentativa, setTentativa] = useState(0)
  const [abertas, setAbertas] = useState({})
  const sessao = useSessao()
  const campoNomeRef = useRef(null)
  const botaoDadosRef = useRef(null)
  const botaoEnderecosRef = useRef(null)
  const enderecos = useEnderecos(Boolean(abertas.enderecos) && carga.estado === 'pronto')

  useEffect(() => {
    let ativo = true
    lerMinhaConta().then(
      (dados) => {
        if (!ativo) return
        setCarga({ estado: dados.completo ? 'pronto' : 'incompleto', dados })
        if (!dados.completo) setAbertas((atuais) => ({ ...atuais, dados: true }))
      },
      (erro) => {
        if (!ativo) return
        if (!(erro instanceof ErroServico) && import.meta.env.DEV) console.error('[conta] erro inesperado ao ler', erro)
        setCarga({ estado: 'erro', erro })
      },
    )
    return () => {
      ativo = false
    }
  }, [tentativa])

  function alternar(id) {
    setAbertas((atuais) => ({ ...atuais, [id]: !atuais[id] }))
  }

  function tentarDeNovo() {
    flushSync(() => {
      setCarga({ estado: 'carregando' })
      setTentativa((atual) => atual + 1)
    })
    tituloRef.current?.focus()
  }

  function completarAgora() {
    flushSync(() => {
      setAbertas((atuais) => ({ ...atuais, dados: true }))
    })
    campoNomeRef.current?.focus()
  }

  function concluirCadastro(dados) {
    flushSync(() => {
      setCarga({ estado: 'pronto', dados, aviso: dados.mensagem })
    })
    botaoDadosRef.current?.focus()
  }

  function aoSalvarDados({ nome, whatsapp }) {
    setCarga((atual) =>
      atual.estado === 'pronto' ? { estado: 'pronto', dados: { ...atual.dados, nome, whatsapp } } : atual,
    )
  }

  function secaoEmBreve(secao) {
    return (
      <SecaoConta
        key={secao.id}
        id={secao.id}
        titulo={secao.titulo}
        resumo="Em breve"
        aberta={Boolean(abertas[secao.id])}
        aoAlternar={() => alternar(secao.id)}
      >
        <p className="text-base text-tinta">{secao.texto}</p>
      </SecaoConta>
    )
  }

  const incompleto = carga.estado === 'incompleto'
  const semSessao = carga.estado === 'erro' && carga.erro?.codigo === 'sem-sessao'
  const mensagemErro = carga.estado === 'erro' ? mensagemDoErro(carga.erro) : ''
  const erroNoStatus = carga.estado === 'erro' && tentativa === 0
  const textoStatus =
    carga.estado === 'carregando'
      ? 'Carregando seus dados…'
      : incompleto
        ? 'Faltam dados para completar seu cadastro.'
        : erroNoStatus
          ? mensagemErro
          : carga.estado === 'pronto'
            ? (carga.aviso ?? '')
            : ''
  const classeStatus = incompleto
    ? 'text-base font-semibold text-tinta'
    : textoStatus
      ? 'mt-4 text-base text-tinta'
      : 'sr-only'

  return (
    <div className="flex min-h-dvh flex-col bg-creme text-tinta">
      <BarraTopo />
      <Header tituloRef={tituloRef} inicio={false} />
      <main className="relative flex-1 px-3 pb-8 sm:px-6 sm:pb-12">
        <div aria-hidden="true" className="absolute inset-x-0 top-0 h-28 bg-tomate bg-bolinhas sm:h-44" />
        <div className="relative mx-auto mt-10 max-w-3xl rounded-3xl border border-borda bg-papel px-4 py-8 shadow-[0_1px_2px_rgb(43_29_22/0.06),0_16px_40px_-16px_rgb(43_29_22/0.25)] sm:mt-20 sm:px-8 sm:py-10">
          <h1 ref={tituloRef} tabIndex={-1} className="font-display text-3xl text-tinta focus:outline-none sm:text-4xl">
            Minha conta
          </h1>
          <div className={incompleto ? classeAvisoIncompleto : undefined}>
            <p role="status" className={classeStatus}>
              {textoStatus}
            </p>
            {incompleto && (
              <button type="button" onClick={completarAgora} className={`mt-3 ${classeBotao}`}>
                Completar agora
              </button>
            )}
          </div>
          {carga.estado === 'erro' && (
            <>
              {!erroNoStatus && (
                <p role="alert" className="mt-4 text-base text-tinta">
                  {mensagemErro}
                </p>
              )}
              {semSessao ? (
                <LinkRota href="/entrar" className={`mt-4 ${classeBotao}`}>
                  Entrar de novo
                </LinkRota>
              ) : (
                <button type="button" onClick={tentarDeNovo} className={`mt-4 ${classeBotao}`}>
                  Tentar de novo
                </button>
              )}
            </>
          )}
          <div className="mt-6 border-t border-borda">
            <SecaoConta
              id="dados"
              titulo="Meus dados"
              resumo={resumoDados(carga)}
              aberta={Boolean(abertas.dados)}
              aoAlternar={() => alternar('dados')}
              botaoRef={botaoDadosRef}
            >
              {carga.estado === 'carregando' && <p className="text-base text-tinta-suave">Carregando seus dados…</p>}
              {carga.estado === 'erro' && <p className="text-base text-tinta-suave">Seus dados não foram carregados.</p>}
              {incompleto && (
                <FormularioCompletarCadastro dados={carga.dados} nomeRef={campoNomeRef} aoConcluir={concluirCadastro} />
              )}
              {carga.estado === 'pronto' && <FormularioMeusDados dados={carga.dados} aoSalvar={aoSalvarDados} />}
            </SecaoConta>
            <SecaoConta
              id="foto"
              titulo="Foto de perfil"
              resumo={resumoAvatar(sessao.foto)}
              aberta={Boolean(abertas.foto)}
              aoAlternar={() => alternar('foto')}
            >
              <FotoPerfil />
            </SecaoConta>
            <SecaoConta
              id="enderecos"
              titulo="Endereços de entrega"
              resumo={resumoEnderecos(carga, enderecos)}
              aberta={Boolean(abertas.enderecos)}
              aoAlternar={() => alternar('enderecos')}
              botaoRef={botaoEnderecosRef}
            >
              <EnderecosEntrega estadoConta={carga.estado} lista={enderecos} secaoRef={botaoEnderecosRef} />
            </SecaoConta>
            {secoesEmBreve.map(secaoEmBreve)}
          </div>
          <LinkRota
            href="/"
            className="mt-6 inline-flex min-h-11 items-center rounded-full px-2 text-sm font-semibold text-tomate-escuro underline decoration-2 underline-offset-4 hover:text-tinta focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tinta"
          >
            Voltar para a loja
          </LinkRota>
        </div>
      </main>
      <Footer />
    </div>
  )
}

export default MinhaConta
