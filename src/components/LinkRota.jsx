import { caminhoInterno, navegar } from '../hooks/useRota.js'

function LinkRota({ ref, href, className, onFocus, onPointerDown, aoNavegar, 'aria-current': atual, children }) {
  const destino = caminhoInterno(href) ? href : '/'

  function aoClicar(evento) {
    if (evento.defaultPrevented || evento.button !== 0) return
    if (evento.metaKey || evento.ctrlKey || evento.shiftKey || evento.altKey) return
    evento.preventDefault()
    navegar(destino)
    aoNavegar?.()
  }

  return (
    <a
      ref={ref}
      href={destino}
      className={className}
      aria-current={atual}
      onClick={aoClicar}
      onFocus={onFocus}
      onPointerDown={onPointerDown}
    >
      {children}
    </a>
  )
}

export default LinkRota
