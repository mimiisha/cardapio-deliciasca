import { useState } from 'react'
import { corDoAvatar, hexCores, iniciais, lerAvatar, urlAvatar } from './fotoAvatar.js'

const cores = ['bg-tomate-escuro text-papel', 'bg-mostarda text-tinta', 'bg-papel text-tinta-suave']

function Avatar({ uid, nome, foto, tamanho = 28 }) {
  const [falhou, setFalhou] = useState(null)
  const avatar = lerAvatar(foto)
  const letras = iniciais(nome)
  const usarImagem = avatar !== null && falhou !== avatar.chave
  if (!usarImagem && letras === '') return null
  const medida = { width: tamanho, height: tamanho }

  if (usarImagem) {
    const fundo = avatar.cor ? hexCores[avatar.cor] : null
    return (
      <span
        aria-hidden="true"
        className="inline-flex shrink-0 overflow-hidden rounded-full bg-papel ring-2 ring-papel"
        style={fundo ? { ...medida, backgroundColor: fundo, padding: Math.round(tamanho * 0.12) } : medida}
      >
        <img
          src={urlAvatar(avatar.chave)}
          alt=""
          width={tamanho}
          height={tamanho}
          decoding="async"
          onError={() => setFalhou(avatar.chave)}
          className="size-full rounded-full"
        />
      </span>
    )
  }

  return (
    <span
      aria-hidden="true"
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-semibold leading-none ring-2 ring-papel ${cores[corDoAvatar(uid) % cores.length]}`}
      style={{ ...medida, fontSize: Math.round(tamanho * 0.42) }}
    >
      {letras}
    </span>
  )
}

export default Avatar
