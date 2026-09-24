import { mensagemCatalogoDesatualizado } from '../../servicos/admin/errosPainel.js'

const classeBotao =
  'mt-3 inline-flex min-h-11 items-center justify-center rounded-full bg-tinta px-5 py-2 text-base font-semibold text-mostarda hover:bg-tomate-escuro hover:text-papel focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tinta'

function AvisoConflito({ visivel, botaoRef, aoRecarregar }) {
  return (
    <div role="alert">
      {visivel && (
        <div className="mt-4 rounded-2xl border-2 border-tomate-escuro bg-creme p-4">
          <p className="text-base font-semibold text-tinta">{mensagemCatalogoDesatualizado}</p>
          <button ref={botaoRef} type="button" onClick={aoRecarregar} className={classeBotao}>
            Recarregar cardápio
          </button>
        </div>
      )}
    </div>
  )
}

export default AvisoConflito
