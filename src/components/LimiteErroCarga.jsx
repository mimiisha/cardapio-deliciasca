import { Component } from 'react'
import LayoutAuth from './LayoutAuth.jsx'

class LimiteErroCarga extends Component {
  constructor(props) {
    super(props)
    this.state = { falhou: false }
  }

  static getDerivedStateFromError() {
    return { falhou: true }
  }

  componentDidCatch(erro) {
    if (import.meta.env.DEV) console.error('[app] falha ao carregar a tela', erro)
  }

  componentDidUpdate(_propsAnteriores, estadoAnterior) {
    if (!estadoAnterior.falhou && this.state.falhou) this.props.tituloRef?.current?.focus()
  }

  render() {
    if (!this.state.falhou) return this.props.children
    return (
      <LayoutAuth tituloRef={this.props.tituloRef} titulo="Não foi possível abrir a tela">
        <p role="alert" className="mt-4 text-base text-tinta">
          Verifique sua conexão e recarregue a página.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-6 flex min-h-11 w-full items-center justify-center rounded-full bg-tinta px-6 text-base font-semibold text-mostarda hover:bg-tomate-escuro hover:text-papel focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tinta"
        >
          Recarregar
        </button>
      </LayoutAuth>
    )
  }
}

export default LimiteErroCarga
