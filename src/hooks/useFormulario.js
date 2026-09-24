import { useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { ErroServico, mensagemGenerica } from '../servicos/erros.js'

export function useFormulario({ inicial, validar, limparAposEnvio, enviar, contar }) {
  const [valores, setValores] = useState(inicial)
  const [tentou, setTentou] = useState(false)
  const [aviso, setAviso] = useState('')
  const [enviando, setEnviando] = useState(false)
  const emAndamento = useRef(false)
  const campos = useRef({})

  const erros = tentou ? validar(valores) : {}

  function alterar(nome) {
    return (evento) => {
      setValores((atuais) => ({ ...atuais, [nome]: evento.target.value }))
      setAviso('')
    }
  }

  function registrar(nome) {
    return (elemento) => {
      campos.current[nome] = elemento
    }
  }

  async function enviarAoServidor() {
    emAndamento.current = true
    setEnviando(true)
    setTentou(false)
    setAviso('')
    try {
      const mensagem = await enviar(valores)
      setAviso(mensagem ?? '')
    } catch (erro) {
      if (erro instanceof ErroServico) {
        setAviso(erro.message)
      } else {
        if (import.meta.env.DEV) console.error('[formulario] erro inesperado', erro)
        setAviso(mensagemGenerica)
      }
    } finally {
      setValores((atuais) => ({ ...atuais, ...limparAposEnvio }))
      emAndamento.current = false
      setEnviando(false)
    }
  }

  function aoEnviar(evento) {
    evento.preventDefault()
    if (emAndamento.current) return
    const novosErros = validar(valores)
    const primeiroInvalido = Object.keys(inicial).find((nome) => novosErros[nome])
    if (primeiroInvalido) {
      const quantidade = contar ? contar(novosErros) : Object.keys(novosErros).length
      flushSync(() => {
        setTentou(true)
        setAviso(quantidade === 1 ? 'Há 1 campo com erro.' : `Há ${quantidade} campos com erro.`)
      })
      campos.current[primeiroInvalido]?.focus()
      return
    }
    enviarAoServidor()
  }

  return { valores, erros, aviso, enviando, alterar, registrar, aoEnviar }
}
