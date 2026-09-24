function FormularioAuth({ aoEnviar, rotuloBotao, aviso, acaoSecundaria, enviando = false, larga = false, children }) {
  function aoClicar(evento) {
    if (enviando) evento.preventDefault()
  }

  const botao = (
    <button
      type="submit"
      aria-disabled={enviando ? 'true' : undefined}
      onClick={aoClicar}
      className="flex min-h-11 w-full items-center justify-center rounded-full bg-tinta px-6 text-base font-semibold text-mostarda hover:bg-tomate-escuro hover:text-papel focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tinta aria-disabled:cursor-wait aria-disabled:hover:bg-tinta aria-disabled:hover:text-mostarda"
    >
      {enviando ? 'Enviando…' : rotuloBotao}
    </button>
  )

  return (
    <>
      <p className={`${larga ? 'mt-3' : 'mt-6'} text-sm text-tinta-suave`}>Todos os campos são obrigatórios.</p>

      <form
        noValidate
        onSubmit={aoEnviar}
        className={larga ? 'mt-3 grid items-start gap-4 sm:grid-cols-2' : 'mt-4 space-y-5'}
      >
        {children}

        {acaoSecundaria ? (
          <div className={`grid gap-3 sm:grid-cols-2 ${larga ? 'sm:col-span-2' : ''}`}>
            {botao}
            {acaoSecundaria}
          </div>
        ) : (
          botao
        )}

        <p aria-live="polite" role="status" className={`text-base font-medium text-tinta ${larga ? 'sm:col-span-2' : ''}`}>
          {enviando ? <span className="sr-only">Enviando…</span> : aviso}
        </p>
      </form>
    </>
  )
}

export default FormularioAuth
