import LinkRota from './LinkRota.jsx'

function LinkAlternativo({ href, margem = 'mt-2', children }) {
  return (
    <LinkRota
      href={href}
      className={`${margem} flex min-h-11 w-full items-center justify-center rounded-full border-2 border-tinta px-6 text-base font-semibold text-tinta hover:bg-manteiga focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tinta`}
    >
      {children}
    </LinkRota>
  )
}

export default LinkAlternativo
