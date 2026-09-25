import { corPadrao, hexCores, lerAvatar } from '../fotoAvatar.js'

function lista(pares) {
  return Object.freeze(pares.map(([chave, rotulo]) => Object.freeze({ chave, rotulo })))
}

export const rostos = lista([
  ['pessoa-neutra', 'Rosto amarelo'],
  ['pessoa-pele-clara', 'Cabelo curto, pele clara'],
  ['pessoa-pele-media', 'Cabelo curto, pele média'],
  ['pessoa-pele-escura', 'Cabelo curto, pele escura'],
  ['cacheado-pele-media-clara', 'Cabelo cacheado, pele média-clara'],
  ['cacheado-pele-media-escura', 'Cabelo cacheado, pele média-escura'],
  ['cacheado-pele-escura', 'Cabelo cacheado, pele escura'],
  ['cabelo-longo-pele-clara', 'Cabelo longo, pele clara'],
  ['cabelo-longo-pele-media', 'Cabelo longo, pele média'],
  ['cabelo-longo-pele-escura', 'Cabelo longo, pele escura'],
  ['longo-ruivo-pele-clara', 'Cabelo longo ruivo, pele clara'],
  ['longo-loiro-pele-media-clara', 'Cabelo longo loiro, pele média-clara'],
  ['longo-cacheado-pele-escura', 'Cabelo longo cacheado, pele escura'],
  ['ruivo-pele-clara', 'Cabelo ruivo, pele clara'],
  ['ruivo-pele-media', 'Cabelo ruivo, pele média'],
  ['barba-pele-clara', 'Barba, pele clara'],
  ['barba-pele-media', 'Barba, pele média'],
  ['barba-pele-escura', 'Barba, pele escura'],
  ['careca-pele-clara', 'Careca, pele clara'],
  ['careca-pele-media-escura', 'Careca, pele média-escura'],
  ['oculos-pele-media', 'Óculos, pele média'],
  ['oculos-pele-escura', 'Óculos, pele escura'],
  ['grisalho-pele-media', 'Cabelo grisalho, pele média'],
  ['grisalho-pele-escura', 'Cabelo grisalho, pele escura'],
  ['oculos-grisalho-pele-media', 'Óculos e cabelo grisalho, pele média'],
  ['pessoa-idosa-pele-media-clara', 'Pessoa idosa, pele média-clara'],
  ['pessoa-idosa-pele-escura', 'Pessoa idosa, pele escura'],
  ['lenco-pele-media', 'Lenço na cabeça, pele média'],
  ['touca-chef-pele-clara', 'Touca de chef, pele clara'],
  ['touca-chef-pele-media-escura', 'Touca de chef, pele média-escura'],
  ['touca-chef-pele-escura', 'Touca de chef, pele escura'],
])

export const comidas = lista([
  ['frango', 'Frango'],
  ['marmita', 'Marmita'],
  ['panela', 'Panela'],
  ['torta', 'Torta'],
  ['bolo', 'Bolo'],
  ['cafe', 'Café'],
  ['pao', 'Pão'],
  ['maca', 'Maçã'],
  ['colher', 'Colher de pau'],
  ['chef', 'Chapéu de chef'],
  ['cenoura', 'Cenoura'],
  ['pimenta', 'Pimenta'],
  ['peixe', 'Peixe'],
  ['girassol', 'Girassol'],
  ['gato', 'Gato'],
  ['cachorro', 'Cachorro'],
])

export const coresFundo = Object.freeze(
  [
    ['creme', 'Creme'],
    ['manteiga', 'Manteiga'],
    ['mostarda', 'Mostarda'],
    ['tomate', 'Tomate'],
    ['colorau', 'Colorau'],
    ['canela', 'Canela'],
    ['cafe', 'Café'],
    ['cheiro-verde', 'Cheiro-verde'],
  ].map(([chave, rotulo]) => Object.freeze({ chave, rotulo, hex: hexCores[chave] })),
)

const rotulos = new Map([...rostos, ...comidas].map(({ chave, rotulo }) => [chave, rotulo]))

export function ehRosto(chave) {
  return rostos.some((rosto) => rosto.chave === chave)
}

export function ehComida(chave) {
  return comidas.some((comida) => comida.chave === chave)
}

export function ehCorFundo(cor) {
  return coresFundo.some((opcao) => opcao.chave === cor)
}

export function rotuloAvatar(chave) {
  return rotulos.get(chave) ?? ''
}

export function escolhaDaFoto(foto) {
  const avatar = lerAvatar(foto)
  if (!avatar || !rotulos.has(avatar.chave)) return { chave: null, cor: null }
  return ehRosto(avatar.chave) ? avatar : { chave: avatar.chave, cor: null }
}

export function fotoDaEscolha({ chave, cor }) {
  if (chave === null) return ''
  if (ehComida(chave)) return `/avatares/${chave}.svg`
  if (!ehRosto(chave)) return null
  const corFinal = cor ?? corPadrao(chave)
  return ehCorFundo(corFinal) ? `/avatares/${chave}.svg#${corFinal}` : null
}

export function resumoAvatar(foto) {
  const { chave } = escolhaDaFoto(foto)
  return chave ? rotuloAvatar(chave) : 'Iniciais'
}
