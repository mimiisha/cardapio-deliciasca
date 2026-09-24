import LinkRota from './LinkRota.jsx'

function BarraTopo() {
  return (
    <div className="bg-tomate-escuro">
      <nav aria-label="Acesso administrativo" className="flex justify-end px-3 py-1.5 sm:px-4">
        <LinkRota
          href="/admin"
          className="inline-flex min-h-6 min-w-6 items-center px-1 text-sm text-papel underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-papel"
        >
          Área Admin
        </LinkRota>
      </nav>
    </div>
  )
}

export default BarraTopo
