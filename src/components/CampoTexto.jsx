const classeCampo =
  'block min-h-11 w-full rounded-xl border-2 bg-papel px-3 py-2 text-base text-tinta focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tinta'

function CampoTexto({ id, rotulo, erro, dica, complemento, complementoId, inputRef, children, ...atributos }) {
  const descricao = [dica && `${id}-dica`, complemento && complementoId, erro && `${id}-erro`].filter(Boolean).join(' ')
  const borda = erro ? 'border-tomate-escuro' : 'border-tinta-suave'
  const campo = (
    <input
      ref={inputRef}
      id={id}
      required
      aria-invalid={erro ? true : undefined}
      aria-describedby={descricao || undefined}
      className={children ? `${classeCampo} pr-12 ${borda}` : `${classeCampo} ${borda}`}
      {...atributos}
    />
  )

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-semibold">
        {rotulo}
      </label>
      {children ? (
        <div className="relative">
          {campo}
          {children}
        </div>
      ) : (
        campo
      )}
      {dica && (
        <p id={`${id}-dica`} className="text-sm text-tinta-suave">
          {dica}
        </p>
      )}
      {complemento}
      {erro && (
        <p id={`${id}-erro`} className="text-sm font-medium text-tomate-escuro">
          {erro}
        </p>
      )}
    </div>
  )
}

export default CampoTexto
