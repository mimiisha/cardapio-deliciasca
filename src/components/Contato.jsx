function Contato() {
  return (
    <section
      id="contato"
      aria-labelledby="contato-titulo"
      className="scroll-mt-4 rounded-2xl border-l-4 border-tomate bg-manteiga px-4 py-5 sm:px-8 sm:py-7"
    >
      <h2
        id="contato-titulo"
        className="flex items-center gap-3 font-display text-lg leading-snug text-tinta sm:text-2xl"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="size-6 shrink-0 text-tomate-escuro sm:size-8"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M4 5h16v11H9l-5 4z" />
        </svg>
        Entre em contato para mais informações via:
      </h2>
    </section>
  )
}

export default Contato
