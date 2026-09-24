import CartaoTela from './CartaoTela.jsx'

function TelaEmConstrucao({ tituloRef, titulo, descricao }) {
  return (
    <CartaoTela>
      <h1 ref={tituloRef} tabIndex={-1} className="font-display text-3xl text-tinta focus:outline-none sm:text-4xl">
        {titulo}
      </h1>
      <p className="mt-3 text-lg font-semibold text-tinta">Em construção.</p>
      <p className="mt-1 text-base text-tinta-suave">{descricao}</p>
    </CartaoTela>
  )
}

export default TelaEmConstrucao
