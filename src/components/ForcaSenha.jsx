const coresNivel = ['', 'bg-tomate-escuro', 'bg-tinta-suave', 'bg-tinta']

function ForcaSenha({ id, avaliacao }) {
  const { nivel, rotulo } = avaliacao

  return (
    <div id={id} className="space-y-1">
      <div aria-hidden="true" className="flex gap-1">
        {[1, 2, 3].map((segmento) => (
          <span
            key={segmento}
            className={`h-1.5 flex-1 rounded-full ${segmento <= nivel ? coresNivel[nivel] : 'bg-borda'}`}
          />
        ))}
      </div>
      <p className="text-sm text-tinta">
        Força da senha: <span className="font-semibold">{rotulo}</span>
      </p>
    </div>
  )
}

export default ForcaSenha
