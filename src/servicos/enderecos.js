import { carregarFirestore } from '../lib/firebase.js'
import { temCaractereInvisivel } from '../components/validacao.js'
import { mensagemSemCadastro } from './clientes.js'
import { sessaoAtual } from './conta.js'
import { ErroServico, traduzirErroFirebase } from './erros.js'

export const LIMITE_ENDERECOS = 5

export const vagas = ['1', '2', '3', '4', '5']

export const camposEndereco = [
  'apelido',
  'cep',
  'logradouro',
  'numero',
  'complemento',
  'bairro',
  'cidade',
  'uf',
  'referencia',
]

export const limitesEndereco = {
  apelido: 30,
  cep: 9,
  logradouro: 100,
  numero: 10,
  complemento: 60,
  bairro: 60,
  cidade: 60,
  uf: 2,
  referencia: 120,
}

export const mensagemLimiteEnderecos = 'Você já tem 5 endereços. Remova um para adicionar outro.'

export const mensagemListaDesatualizada = 'Sua lista de endereços mudou em outra aba. Recarregue e tente de novo.'

const mensagemDadosInvalidos = 'Confira os campos do endereço e tente de novo.'

const nomesCampos = {
  apelido: 'no apelido',
  logradouro: 'na rua',
  numero: 'no número',
  complemento: 'no complemento',
  bairro: 'no bairro',
  cidade: 'na cidade',
  referencia: 'no ponto de referência',
}

const formatoCep = /^[0-9]{8}$/

const formatoUf = /^[A-Z]{2}$/

const semNumero = /^s\s*\/?\s*n[º°o.]?$/i

function limpar(valor) {
  return typeof valor === 'string' ? valor.normalize('NFC').trim() : ''
}

export function normalizarEndereco(valores) {
  const limpos = Object.fromEntries(camposEndereco.map((campo) => [campo, limpar(valores?.[campo])]))
  limpos.cep = limpos.cep.replace(/[\s.-]/g, '')
  limpos.uf = limpos.uf.toUpperCase()
  if (semNumero.test(limpos.numero)) limpos.numero = 'S/N'
  return limpos
}

function erroTexto(campo, valor, { minimo = 0, vazio } = {}) {
  if (valor === '') return minimo > 0 ? vazio : undefined
  if (temCaractereInvisivel(valor)) return `Há caracteres inválidos ${nomesCampos[campo]}.`
  if (valor.length > limitesEndereco[campo]) return `Use no máximo ${limitesEndereco[campo]} caracteres ${nomesCampos[campo]}.`
  if (valor.length < minimo) return vazio
  return undefined
}

export function validarEndereco(valores) {
  const e = normalizarEndereco(valores)
  const erros = {
    cep: e.cep !== '' && !formatoCep.test(e.cep) ? 'Informe o CEP com 8 números, como 01001-000.' : undefined,
    apelido: erroTexto('apelido', e.apelido),
    logradouro: erroTexto('logradouro', e.logradouro, { minimo: 2, vazio: 'Informe a rua.' }),
    numero: erroTexto('numero', e.numero, { minimo: 1, vazio: 'Informe o número. Se não houver, use S/N.' }),
    complemento: erroTexto('complemento', e.complemento),
    bairro: erroTexto('bairro', e.bairro, { minimo: 2, vazio: 'Informe o bairro.' }),
    cidade: erroTexto('cidade', e.cidade),
    uf: e.uf !== '' && !formatoUf.test(e.uf) ? 'Informe a UF com 2 letras, como SP.' : undefined,
    referencia: erroTexto('referencia', e.referencia),
  }
  return Object.fromEntries(Object.entries(erros).filter(([, mensagem]) => mensagem))
}

export function prepararEndereco(valores) {
  if (Object.keys(validarEndereco(valores)).length > 0) throw new ErroServico('dados-invalidos', mensagemDadosInvalidos)
  return normalizarEndereco(valores)
}

export function rotuloEndereco(endereco) {
  if (endereco.apelido) return endereco.apelido
  return endereco.numero ? `${endereco.logradouro}, ${endereco.numero}` : endereco.logradouro
}

export function formatarCep(cep) {
  return formatoCep.test(cep) ? `${cep.slice(0, 5)}-${cep.slice(5)}` : cep
}

export function linhasEndereco(endereco) {
  const rua = [endereco.logradouro, endereco.numero, endereco.complemento].filter(Boolean).join(', ')
  const cidade = [endereco.cidade, endereco.uf].filter(Boolean).join('/')
  const regiao = [endereco.bairro, cidade].filter(Boolean).join(' — ')
  const cep = endereco.cep ? `CEP ${formatarCep(endereco.cep)}` : ''
  return [rua, regiao, cep].filter(Boolean)
}

function copiaDoEndereco(endereco) {
  return Object.fromEntries(camposEndereco.map((campo) => [campo, endereco[campo]]))
}

function lerEndereco(documento) {
  if (!vagas.includes(documento.id)) return null
  const dados = documento.data() ?? {}
  const endereco = Object.fromEntries(camposEndereco.map((campo) => [campo, typeof dados[campo] === 'string' ? dados[campo] : '']))
  return { id: documento.id, ...endereco }
}

function ordenar(enderecos) {
  return [...enderecos].sort((a, b) => Number(a.id) - Number(b.id))
}

function padraoValido(enderecos, padraoId) {
  return enderecos.some((endereco) => endereco.id === padraoId) ? padraoId : null
}

export async function listarEnderecos() {
  const { usuario } = await sessaoAtual('listar-enderecos')
  try {
    const { db, sdk } = await carregarFirestore()
    const [cliente, lista] = await Promise.all([
      sdk.getDoc(sdk.doc(db, 'clientes', usuario.uid)),
      sdk.getDocs(sdk.collection(db, 'clientes', usuario.uid, 'enderecos')),
    ])
    if (!cliente.exists()) throw new ErroServico('sem-cadastro', mensagemSemCadastro)
    const enderecos = ordenar(lista.docs.map(lerEndereco).filter(Boolean))
    return { enderecos, padraoId: padraoValido(enderecos, cliente.data()?.enderecoPadraoId), mensagem: '' }
  } catch (erro) {
    throw traduzirErroFirebase(erro, 'listar-enderecos')
  }
}

function traduzirEscrita(erro, operacao, { semCadastro = false } = {}) {
  if (erro instanceof ErroServico) return erro
  if (erro?.code === 'not-found') {
    return semCadastro
      ? new ErroServico('sem-cadastro', mensagemSemCadastro)
      : new ErroServico('lista-desatualizada', mensagemListaDesatualizada)
  }
  if (erro?.code === 'permission-denied') return new ErroServico('lista-desatualizada', mensagemListaDesatualizada)
  return traduzirErroFirebase(erro, operacao)
}

function estadoAtual(atual) {
  const enderecos = ordenar(Array.isArray(atual?.enderecos) ? atual.enderecos : [])
  return { enderecos, padraoId: padraoValido(enderecos, atual?.padraoId) }
}

function localizar(enderecos, id) {
  const endereco = enderecos.find((item) => item.id === id)
  if (!endereco) throw new ErroServico('lista-desatualizada', mensagemListaDesatualizada)
  return endereco
}

async function gravar(operacao, montar, opcoes) {
  const { usuario } = await sessaoAtual(operacao)
  try {
    const { db, sdk } = await carregarFirestore()
    const lote = sdk.writeBatch(db)
    const referencias = {
      cliente: sdk.doc(db, 'clientes', usuario.uid),
      endereco: (id) => sdk.doc(db, 'clientes', usuario.uid, 'enderecos', id),
    }
    montar({ lote, sdk, referencias, agora: sdk.serverTimestamp() })
    await lote.commit()
  } catch (erro) {
    throw traduzirEscrita(erro, operacao, opcoes)
  }
}

function marcarPadrao(lote, referencias, agora, endereco) {
  lote.update(referencias.cliente, {
    enderecoPadraoId: endereco.id,
    enderecoPadrao: copiaDoEndereco(endereco),
    atualizadoEm: agora,
  })
}

export async function adicionarEndereco(atual, valores, { padrao = false } = {}) {
  const dados = prepararEndereco(valores)
  const { enderecos, padraoId } = estadoAtual(atual)
  const vaga = vagas.find((id) => !enderecos.some((endereco) => endereco.id === id))
  if (enderecos.length >= LIMITE_ENDERECOS || !vaga) throw new ErroServico('limite-enderecos', mensagemLimiteEnderecos)
  const novo = { id: vaga, ...dados }
  const viraPadrao = padraoId === null || padrao
  await gravar(
    'adicionar-endereco',
    ({ lote, referencias, agora }) => {
      lote.set(referencias.endereco(vaga), { ...dados, criadoEm: agora, atualizadoEm: agora })
      if (viraPadrao) marcarPadrao(lote, referencias, agora, novo)
    },
    { semCadastro: viraPadrao },
  )
  return {
    enderecos: ordenar([...enderecos, novo]),
    padraoId: viraPadrao ? vaga : padraoId,
    mensagem: viraPadrao ? 'Endereço adicionado como padrão.' : 'Endereço adicionado.',
    id: vaga,
  }
}

export async function editarEndereco(atual, id, valores, { padrao = false } = {}) {
  const dados = prepararEndereco(valores)
  const { enderecos, padraoId } = estadoAtual(atual)
  localizar(enderecos, id)
  const editado = { id, ...dados }
  const viraPadrao = padraoId === id || padrao
  await gravar('editar-endereco', ({ lote, referencias, agora }) => {
    lote.update(referencias.endereco(id), { ...dados, atualizadoEm: agora })
    if (viraPadrao) marcarPadrao(lote, referencias, agora, editado)
  })
  return {
    enderecos: enderecos.map((endereco) => (endereco.id === id ? editado : endereco)),
    padraoId: viraPadrao ? id : padraoId,
    mensagem: padraoId !== id && viraPadrao ? 'Endereço atualizado e definido como padrão.' : 'Endereço atualizado.',
    id,
  }
}

export async function removerEndereco(atual, id) {
  const { enderecos, padraoId } = estadoAtual(atual)
  localizar(enderecos, id)
  const restantes = enderecos.filter((endereco) => endereco.id !== id)
  const eraPadrao = padraoId === id
  const promovido = eraPadrao ? (restantes[0] ?? null) : null
  await gravar('remover-endereco', ({ lote, sdk, referencias, agora }) => {
    lote.delete(referencias.endereco(id))
    if (!eraPadrao) return
    if (promovido) {
      marcarPadrao(lote, referencias, agora, promovido)
    } else {
      lote.update(referencias.cliente, {
        enderecoPadraoId: sdk.deleteField(),
        enderecoPadrao: sdk.deleteField(),
        atualizadoEm: agora,
      })
    }
  })
  return {
    enderecos: restantes,
    padraoId: eraPadrao ? (promovido?.id ?? null) : padraoId,
    mensagem: promovido ? `Endereço removido. ${rotuloEndereco(promovido)} agora é o padrão.` : 'Endereço removido.',
    id,
  }
}

export async function definirPadrao(atual, id) {
  const { enderecos, padraoId } = estadoAtual(atual)
  const endereco = localizar(enderecos, id)
  if (padraoId !== id) {
    await gravar('definir-padrao', ({ lote, referencias, agora }) => {
      marcarPadrao(lote, referencias, agora, endereco)
    })
  }
  return { enderecos, padraoId: id, mensagem: `${rotuloEndereco(endereco)} agora é o endereço padrão.`, id }
}
