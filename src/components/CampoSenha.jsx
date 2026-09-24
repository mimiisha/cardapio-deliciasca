import { useState } from 'react'
import CampoTexto from './CampoTexto.jsx'

function IconeOlho({ riscado }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-5"
    >
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
      {riscado && <path d="M3 3l18 18" />}
    </svg>
  )
}

function CampoSenha({ id, rotuloBotao = 'Mostrar senha', ...propriedades }) {
  const [mostrar, setMostrar] = useState(false)

  return (
    <CampoTexto
      id={id}
      type={mostrar ? 'text' : 'password'}
      maxLength={128}
      spellCheck={false}
      autoCapitalize="none"
      autoCorrect="off"
      {...propriedades}
    >
      <button
        type="button"
        aria-pressed={mostrar}
        aria-controls={id}
        onClick={() => setMostrar((atual) => !atual)}
        className="absolute inset-y-0 right-0 flex size-11 items-center justify-center rounded-xl text-tinta-suave hover:text-tinta focus-visible:outline-2 focus-visible:-outline-offset-6 focus-visible:outline-tinta"
      >
        <IconeOlho riscado={mostrar} />
        <span className="sr-only">{rotuloBotao}</span>
      </button>
    </CampoTexto>
  )
}

export default CampoSenha
