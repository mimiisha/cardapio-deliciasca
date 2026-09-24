import { ErroServico, mensagemGenerica, traduzirErroFirebase } from '../erros.js'

export const mensagemNomeDuplicado = 'Já existe uma categoria com esse nome.'

export const mensagemCatalogoDesatualizado =
  'O cardápio foi alterado em outra aba ou por outra pessoa. Recarregue e faça a alteração de novo.'

const mensagensPainel = {
  'ja-admin': 'Essa pessoa já tem acesso de administração.',
  'propria-conta': 'Essa é a sua conta. Você já tem acesso de administração.',
  'nome-duplicado': mensagemNomeDuplicado,
  'categorias-ja-importadas': 'As categorias padrão já foram importadas. Recarregue a lista.',
  'catalogo-desatualizado': mensagemCatalogoDesatualizado,
  'catalogo-grande':
    'O cardápio passou do limite do site (100 categorias, 100 selos ou 500 produtos visíveis). Oculte itens antes de continuar.',
  'listar-clientes': mensagemGenerica,
  'listar-cardapio': mensagemGenerica,
  'salvar-categoria': mensagemGenerica,
  'salvar-selo': mensagemGenerica,
  'salvar-produto': mensagemGenerica,
  'publicar-cardapio': mensagemGenerica,
}

export function erroPainel(codigo, mensagem) {
  return new ErroServico(codigo, mensagem ?? (Object.hasOwn(mensagensPainel, codigo) ? mensagensPainel[codigo] : mensagemGenerica))
}

export function erroDoPainel(erro, operacao, codigoPadrao) {
  const traduzido = traduzirErroFirebase(erro, operacao)
  return traduzido.codigo === 'desconhecido' ? erroPainel(codigoPadrao) : traduzido
}

export function ehConflito(erro) {
  return erro instanceof ErroServico && erro.codigo === 'catalogo-desatualizado'
}
