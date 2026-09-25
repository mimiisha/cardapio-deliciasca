import { useEffect } from 'react'
import LayoutAdmin from '../components/admin/LayoutAdmin.jsx'
import { limparCardapio } from './admin/useCardapio.js'
import Administradores from './admin/Administradores.jsx'
import Agenda from './admin/Agenda.jsx'
import Categorias from './admin/Categorias.jsx'
import Clientes from './admin/Clientes.jsx'
import PainelInicio from './admin/PainelInicio.jsx'
import Produtos from './admin/Produtos.jsx'
import Selos from './admin/Selos.jsx'
import TelaEmConstrucao from './admin/TelaEmConstrucao.jsx'
import { descricoesTelas } from './admin/descricoes.js'
import { telasAdmin } from './admin/telas.js'

function ConteudoTela({ tela, tituloRef }) {
  if (tela.id === 'inicio') return <PainelInicio tituloRef={tituloRef} />
  if (tela.id === 'agenda') return <Agenda tituloRef={tituloRef} fonte="inativa" />
  if (tela.id === 'produtos') return <Produtos tituloRef={tituloRef} />
  if (tela.id === 'categorias') return <Categorias tituloRef={tituloRef} />
  if (tela.id === 'selos') return <Selos tituloRef={tituloRef} />
  if (tela.id === 'clientes') return <Clientes tituloRef={tituloRef} />
  if (tela.id === 'administradores') return <Administradores tituloRef={tituloRef} />
  return <TelaEmConstrucao key={tela.id} tituloRef={tituloRef} titulo={tela.rotulo} descricao={descricoesTelas[tela.id]} />
}

function PainelAdmin({ tituloRef, tela }) {
  const atual = telasAdmin.find((item) => item.id === tela) ?? telasAdmin[0]

  useEffect(() => limparCardapio, [])

  return (
    <LayoutAdmin telaAtual={atual.id} tituloRef={tituloRef}>
      <ConteudoTela tela={atual} tituloRef={tituloRef} />
    </LayoutAdmin>
  )
}

export default PainelAdmin
