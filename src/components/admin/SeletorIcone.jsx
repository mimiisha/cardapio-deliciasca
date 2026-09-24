function SeletorIcone({ galeria, nome, valor, onMudar, erro, idErro, idDescricao, campoRef }) {
  const descricao = [idDescricao, erro && idErro].filter(Boolean).join(' ')
  const opcoes = Object.entries(galeria)
  const alvoFoco = Object.hasOwn(galeria, valor) ? valor : opcoes[0][0]

  return (
    <fieldset aria-describedby={descricao || undefined} className="min-w-0">
      <legend className="text-sm font-semibold text-tinta">Ícone</legend>
      <div className="mt-2 grid grid-cols-[repeat(auto-fill,minmax(6.5rem,1fr))] gap-2">
        {opcoes.map(([chave, { rotulo, d }]) => (
          <label key={chave} className="relative block cursor-pointer">
            <input
              ref={chave === alvoFoco ? campoRef : undefined}
              type="radio"
              name={nome}
              value={chave}
              checked={valor === chave}
              onChange={onMudar}
              aria-invalid={erro ? true : undefined}
              className="peer sr-only"
            />
            <span className="flex min-h-11 h-full flex-col items-center justify-center gap-1 rounded-xl border-2 border-tinta-suave/70 bg-papel px-1.5 py-2 text-center text-sm text-tinta hover:border-tinta peer-checked:border-tinta peer-checked:bg-manteiga peer-checked:font-semibold peer-checked:shadow-[inset_0_0_0_2px_var(--color-tinta)] peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-tinta">
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="size-8 shrink-0"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d={d} />
              </svg>
              <span className="wrap-break-word">{rotulo}</span>
            </span>
            <span
              aria-hidden="true"
              className="absolute right-1.5 top-1.5 hidden size-5 place-items-center rounded-full bg-tinta text-mostarda peer-checked:grid"
            >
              <svg
                viewBox="0 0 24 24"
                className="size-3.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 12.5l4.5 4.5L19 7.5" />
              </svg>
            </span>
          </label>
        ))}
      </div>
      {erro && (
        <p id={idErro} className="mt-2 text-sm font-medium text-tomate-escuro">
          {erro}
        </p>
      )}
    </fieldset>
  )
}

export default SeletorIcone
