import LinkRota from '../LinkRota.jsx'
import Icone from './Icone.jsx'
import { gruposAdmin, telasAdmin } from '../../pages/admin/telas.js'

const classeItem =
  'flex min-h-11 items-center gap-3 rounded-r-xl border-l-4 px-3 py-2 text-base text-tinta hover:bg-manteiga focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tinta'

function ItemMenu({ tela, ativa, itemRef, aoEscolher }) {
  return (
    <li>
      <LinkRota
        ref={itemRef}
        href={tela.caminho}
        aria-current={ativa ? 'page' : undefined}
        aoNavegar={() => aoEscolher(tela.id)}
        className={`${classeItem} ${ativa ? 'border-tomate-escuro bg-manteiga font-bold' : 'border-transparent font-medium'}`}
      >
        <Icone nome={tela.id} />
        {tela.rotulo}
      </LinkRota>
    </li>
  )
}

function MenuAdmin({ telaAtual, primeiroItemRef, aoEscolher }) {
  const soltas = telasAdmin.filter((tela) => tela.grupo === null)

  return (
    <nav aria-label="Painel administrativo" className="space-y-5 px-3 py-4">
      <ul className="space-y-1">
        {soltas.map((tela, indice) => (
          <ItemMenu
            key={tela.id}
            tela={tela}
            ativa={tela.id === telaAtual}
            itemRef={indice === 0 ? primeiroItemRef : undefined}
            aoEscolher={aoEscolher}
          />
        ))}
      </ul>
      {gruposAdmin.map((grupo, indice) => (
        <div key={grupo}>
          <p id={`menu-grupo-${indice}`} className="mb-1 px-4 text-sm font-semibold tracking-wide text-tinta-suave uppercase">
            {grupo}
          </p>
          <ul aria-labelledby={`menu-grupo-${indice}`} className="space-y-1">
            {telasAdmin
              .filter((tela) => tela.grupo === grupo)
              .map((tela) => (
                <ItemMenu key={tela.id} tela={tela} ativa={tela.id === telaAtual} aoEscolher={aoEscolher} />
              ))}
          </ul>
        </div>
      ))}
    </nav>
  )
}

export default MenuAdmin
