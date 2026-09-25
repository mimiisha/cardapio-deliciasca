import { useEffect, useId, useRef, useState } from 'react'
import CampoTexto from '../../components/CampoTexto.jsx'
import { useFormulario } from '../../hooks/useFormulario.js'
import { buscarCep } from '../../servicos/cep.js'
import { camposEndereco, formatarCep, limitesEndereco, validarEndereco } from '../../servicos/enderecos.js'

export const classeBotaoPrincipal =
  'inline-flex min-h-11 items-center justify-center rounded-full bg-tinta px-6 text-base font-semibold text-mostarda hover:bg-tomate-escuro hover:text-papel focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tinta aria-disabled:cursor-not-allowed aria-disabled:opacity-80 aria-disabled:hover:bg-tinta aria-disabled:hover:text-mostarda'

export const classeBotaoSecundario =
  'inline-flex min-h-11 items-center justify-center rounded-full border-2 border-tinta bg-papel px-4 text-sm font-semibold text-tinta hover:bg-manteiga focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tinta aria-disabled:cursor-not-allowed aria-disabled:opacity-80 aria-disabled:hover:bg-papel'

const camposDoCep = ['logradouro', 'bairro', 'cidade', 'uf']

const mensagensCep = {
  buscando: 'Buscando endereço…',
  encontrado: 'Endereço encontrado. Confira os campos preenchidos.',
  mantido: 'Endereço encontrado. Não trocamos o que você já tinha digitado. Confira se está tudo certo.',
  semRua: 'CEP encontrado. Preencha a rua.',
  semRuaNemBairro: 'CEP encontrado. Preencha a rua e o bairro.',
  'nao-encontrado': 'Não encontramos esse CEP. Confira os números ou preencha o endereço à mão.',
  indisponivel: 'Não conseguimos buscar o CEP agora. Preencha o endereço à mão ou tente de novo.',
  invalido: 'Digite os 8 números do CEP, como 01001-000.',
}

function mensagemEncontrado(resultado, mantidos) {
  if (mantidos > 0) return mensagensCep.mantido
  if (resultado.logradouro) return mensagensCep.encontrado
  return resultado.bairro ? mensagensCep.semRua : mensagensCep.semRuaNemBairro
}

function soDigitos(texto) {
  return texto.replace(/\D/g, '')
}

function mascararCep(texto) {
  const digitos = soDigitos(texto).slice(0, 8)
  return digitos.length > 5 ? `${digitos.slice(0, 5)}-${digitos.slice(5)}` : digitos
}

const ordemDosCampos = ['cep', ...camposEndereco.filter((campo) => campo !== 'cep')]

function valoresIniciais(endereco) {
  const valores = Object.fromEntries(ordemDosCampos.map((campo) => [campo, endereco?.[campo] ?? '']))
  return { ...valores, cep: formatarCep(valores.cep) }
}

function mesclarCep(atuais, resultado, preenchidos) {
  const alteracoes = {}
  let mantidos = 0
  for (const campo of camposDoCep) {
    const valor = resultado[campo]
    if (!valor || atuais[campo] === valor) continue
    if (atuais[campo] === '' || preenchidos.has(campo)) alteracoes[campo] = valor
    else mantidos += 1
  }
  return { alteracoes, mantidos }
}

function Campo({ className, ...props }) {
  return (
    <div className={className}>
      <CampoTexto {...props} />
    </div>
  )
}

function OpcaoPadrao({ modo, id, marcado, aoMudar }) {
  if (modo === 'primeiro') return <p className="text-base text-tinta sm:col-span-6">Este será seu endereço padrão.</p>
  if (modo === 'atual') return <p className="text-base text-tinta sm:col-span-6">Este é seu endereço padrão.</p>
  return (
    <div className="sm:col-span-6">
      <label htmlFor={id} className="inline-flex min-h-11 cursor-pointer items-center gap-3 text-base text-tinta">
        <input
          id={id}
          type="checkbox"
          checked={marcado}
          onChange={(evento) => aoMudar(evento.target.checked)}
          className="size-5 shrink-0 accent-tinta focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tinta"
        />
        Usar como endereço padrão
      </label>
    </div>
  )
}

function FormularioEndereco({ titulo, tituloRef, endereco, modoPadrao, aoSalvar, aoCancelar }) {
  const prefixo = useId()
  const [inicial] = useState(() => valoresIniciais(endereco))
  const [padrao, setPadrao] = useState(false)
  const [consulta, setConsulta] = useState('')
  const preenchidos = useRef(new Set())
  const sequencia = useRef(0)
  const valoresRef = useRef(inicial)
  const { valores, erros, aviso, enviando, alterar, registrar, aoEnviar, definirValores } = useFormulario({
    inicial,
    validar: validarEndereco,
    enviar: (enviados) => aoSalvar(enviados, { padrao }),
  })

  useEffect(() => {
    valoresRef.current = valores
  })

  function alterarCampo(nome, transformar) {
    const base = alterar(nome)
    return (evento) => {
      preenchidos.current.delete(nome)
      if (transformar) evento.target.value = transformar(evento.target.value)
      base(evento)
    }
  }

  async function consultarCep(digitos) {
    const numero = ++sequencia.current
    setConsulta(mensagensCep.buscando)
    const resultado = await buscarCep(digitos)
    if (numero !== sequencia.current) return
    if (resultado.tipo !== 'encontrado') {
      setConsulta(mensagensCep[resultado.tipo] ?? mensagensCep.indisponivel)
      return
    }
    const { alteracoes, mantidos } = mesclarCep(valoresRef.current, resultado, preenchidos.current)
    for (const campo of Object.keys(alteracoes)) preenchidos.current.add(campo)
    definirValores((atuais) => ({ ...atuais, ...alteracoes }))
    setConsulta(mensagemEncontrado(resultado, mantidos))
  }

  function trocarCep(texto) {
    const anterior = soDigitos(valoresRef.current.cep)
    const cep = mascararCep(texto)
    const digitos = soDigitos(cep)
    valoresRef.current = { ...valoresRef.current, cep }
    definirValores((atuais) => ({ ...atuais, cep }))
    if (digitos.length === 8 && digitos !== anterior) {
      consultarCep(digitos)
    } else if (digitos.length < 8) {
      sequencia.current += 1
      setConsulta('')
    }
  }

  function aoColarCep(evento) {
    const colado = soDigitos(evento.clipboardData.getData('text'))
    if (colado === '') return
    evento.preventDefault()
    const campo = evento.currentTarget
    const antes = campo.value.slice(0, campo.selectionStart ?? campo.value.length)
    const depois = campo.value.slice(campo.selectionEnd ?? campo.value.length)
    trocarCep(colado.length >= 8 ? colado : `${antes}${colado}${depois}`)
  }

  function buscarAgora() {
    const digitos = soDigitos(valores.cep)
    if (digitos.length !== 8) {
      sequencia.current += 1
      setConsulta(mensagensCep.invalido)
      return
    }
    consultarCep(digitos)
  }

  function aoClicarSalvar(evento) {
    if (enviando) evento.preventDefault()
  }

  const idCep = `${prefixo}-cep`
  const descricaoCep =
    [erros.cep && `${idCep}-erro`, consulta && `${idCep}-consulta`].filter(Boolean).join(' ') || undefined
  const tituloId = `${prefixo}-titulo`

  return (
    <form noValidate onSubmit={aoEnviar} aria-labelledby={tituloId}>
      <h3
        id={tituloId}
        ref={tituloRef}
        tabIndex={-1}
        className="rounded font-display text-xl text-tinta focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tinta"
      >
        {titulo}
      </h3>
      <p className="mt-1 text-sm text-tinta-suave">Campos sem “(opcional)” são obrigatórios.</p>
      <div className="mt-4 grid items-start gap-4 sm:grid-cols-6">
        <div className="space-y-1.5 sm:col-span-6">
          <label htmlFor={idCep} className="block text-sm font-semibold">
            CEP (opcional)
          </label>
          <div className="flex flex-wrap gap-2">
            <input
              ref={registrar('cep')}
              id={idCep}
              name="cep"
              type="text"
              inputMode="numeric"
              autoComplete="shipping postal-code"
              maxLength={9}
              placeholder="00000-000"
              aria-invalid={erros.cep ? true : undefined}
              aria-describedby={descricaoCep}
              value={valores.cep}
              onChange={(evento) => trocarCep(evento.target.value)}
              onPaste={aoColarCep}
              className={`block min-h-11 w-36 min-w-0 flex-1 rounded-xl border-2 bg-papel px-3 py-2 text-base text-tinta placeholder:text-tinta-suave focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tinta sm:max-w-48 sm:flex-none ${erros.cep ? 'border-tomate-escuro' : 'border-tinta-suave'}`}
            />
            <button type="button" onClick={buscarAgora} className={classeBotaoSecundario}>
              Buscar CEP
            </button>
          </div>
          <p id={`${idCep}-consulta`} role="status" className={consulta ? 'text-sm font-semibold text-tinta' : 'sr-only'}>
            {consulta}
          </p>
          {erros.cep && (
            <p id={`${idCep}-erro`} className="text-sm font-medium text-tomate-escuro">
              {erros.cep}
            </p>
          )}
        </div>
        <Campo
          className="sm:col-span-6"
          id={`${prefixo}-apelido`}
          rotulo="Apelido (opcional)"
          dica="Por exemplo: Casa, Trabalho."
          erro={erros.apelido}
          inputRef={registrar('apelido')}
          required={false}
          name="apelido"
          type="text"
          autoComplete="off"
          maxLength={limitesEndereco.apelido}
          value={valores.apelido}
          onChange={alterarCampo('apelido')}
        />
        <Campo
          className="sm:col-span-4"
          id={`${prefixo}-logradouro`}
          rotulo="Rua"
          erro={erros.logradouro}
          inputRef={registrar('logradouro')}
          name="logradouro"
          type="text"
          autoComplete="shipping address-line1"
          maxLength={limitesEndereco.logradouro}
          value={valores.logradouro}
          onChange={alterarCampo('logradouro')}
        />
        <Campo
          className="sm:col-span-2"
          id={`${prefixo}-numero`}
          rotulo="Número"
          dica="Sem número? Use S/N."
          erro={erros.numero}
          inputRef={registrar('numero')}
          name="numero"
          type="text"
          autoComplete="off"
          maxLength={limitesEndereco.numero}
          value={valores.numero}
          onChange={alterarCampo('numero')}
        />
        <Campo
          className="sm:col-span-3"
          id={`${prefixo}-complemento`}
          rotulo="Complemento (opcional)"
          erro={erros.complemento}
          inputRef={registrar('complemento')}
          required={false}
          name="complemento"
          type="text"
          autoComplete="shipping address-line2"
          maxLength={limitesEndereco.complemento}
          value={valores.complemento}
          onChange={alterarCampo('complemento')}
        />
        <Campo
          className="sm:col-span-3"
          id={`${prefixo}-bairro`}
          rotulo="Bairro"
          erro={erros.bairro}
          inputRef={registrar('bairro')}
          name="bairro"
          type="text"
          autoComplete="shipping address-level3"
          maxLength={limitesEndereco.bairro}
          value={valores.bairro}
          onChange={alterarCampo('bairro')}
        />
        <Campo
          className="sm:col-span-4"
          id={`${prefixo}-cidade`}
          rotulo="Cidade (opcional)"
          erro={erros.cidade}
          inputRef={registrar('cidade')}
          required={false}
          name="cidade"
          type="text"
          autoComplete="shipping address-level2"
          maxLength={limitesEndereco.cidade}
          value={valores.cidade}
          onChange={alterarCampo('cidade')}
        />
        <Campo
          className="sm:col-span-2"
          id={`${prefixo}-uf`}
          rotulo="UF (opcional)"
          erro={erros.uf}
          inputRef={registrar('uf')}
          required={false}
          name="uf"
          type="text"
          autoComplete="shipping address-level1"
          autoCapitalize="characters"
          maxLength={limitesEndereco.uf}
          value={valores.uf}
          onChange={alterarCampo('uf', (texto) => texto.toUpperCase())}
        />
        <Campo
          className="sm:col-span-6"
          id={`${prefixo}-referencia`}
          rotulo="Ponto de referência (opcional)"
          dica="Não informe senhas de portão ou códigos de acesso."
          erro={erros.referencia}
          inputRef={registrar('referencia')}
          required={false}
          name="referencia"
          type="text"
          autoComplete="off"
          maxLength={limitesEndereco.referencia}
          value={valores.referencia}
          onChange={alterarCampo('referencia')}
        />
        <OpcaoPadrao modo={modoPadrao} id={`${prefixo}-padrao`} marcado={padrao} aoMudar={setPadrao} />
        <div className="flex flex-col gap-3 sm:col-span-6 sm:flex-row">
          <button
            type="submit"
            aria-disabled={enviando ? 'true' : undefined}
            onClick={aoClicarSalvar}
            className={classeBotaoPrincipal}
          >
            {enviando ? 'Salvando…' : 'Salvar endereço'}
          </button>
          <button type="button" onClick={aoCancelar} className={classeBotaoSecundario}>
            Cancelar
          </button>
        </div>
        <p role="status" className="text-base font-medium text-tinta sm:col-span-6">
          {enviando ? <span className="sr-only">Salvando…</span> : aviso}
        </p>
      </div>
    </form>
  )
}

export default FormularioEndereco
