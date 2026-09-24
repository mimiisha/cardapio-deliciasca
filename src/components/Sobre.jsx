function Sobre() {
  return (
    <section id="sobre" aria-labelledby="sobre-titulo" className="scroll-mt-4">
      <h2
        id="sobre-titulo"
        className="font-display text-2xl leading-tight text-tinta after:mt-2 after:block after:h-1 after:w-12 after:rounded-full after:bg-tomate sm:text-3xl"
      >
        Sobre o Delícias da Cá
      </h2>
      <div className="mt-4 flex items-start gap-4 sm:items-center sm:gap-10">
        <p className="flex-1 text-sm leading-relaxed text-tinta-suave sm:text-lg">
          Marmitas caseiras feitas com carinho, com ingredientes frescos e tempero de
          casa. Você encomenda durante a semana e recebe sua comida quentinha às
          sextas e aos domingos.
        </p>
        <div
          aria-hidden="true"
          className="grid size-24 shrink-0 place-items-center rounded-full bg-[radial-gradient(circle_at_30%_30%,var(--color-manteiga),var(--color-mostarda))] text-tomate-escuro shadow-md ring-2 ring-tomate ring-offset-4 ring-offset-papel sm:size-40"
        >
          <svg
            viewBox="0 0 48 48"
            className="size-12 sm:size-20"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M6 24h36M9 24a15 15 0 0 0 30 0M19 40h10" />
            <path d="M18 17c-2-2.5 2-4 0-7M24 17c-2-2.5 2-4 0-7M30 17c-2-2.5 2-4 0-7" />
          </svg>
        </div>
      </div>
    </section>
  )
}

export default Sobre
