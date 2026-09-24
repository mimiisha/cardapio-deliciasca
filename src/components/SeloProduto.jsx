import { iconeSeloGenerico, iconesSelo } from './icones/selos.js'

function SeloProduto({ nome, icone, classeIcone = 'size-5' }) {
  const chave = typeof icone === 'string' && Object.hasOwn(iconesSelo, icone) ? icone : iconeSeloGenerico
  return (
    <span className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-manteiga px-3 py-1 text-sm text-tinta">
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className={`${classeIcone} shrink-0`}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d={iconesSelo[chave].d} />
      </svg>
      <span className="min-w-0 [overflow-wrap:anywhere]">{nome}</span>
    </span>
  )
}

export default SeloProduto
