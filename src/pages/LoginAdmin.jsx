import LayoutAuth from '../components/LayoutAuth.jsx'
import FormularioAuth from '../components/FormularioAuth.jsx'
import CampoTexto from '../components/CampoTexto.jsx'
import CampoSenha from '../components/CampoSenha.jsx'
import { erroEmail, removerVazios } from '../components/validacao.js'
import { useFormulario } from '../hooks/useFormulario.js'
import { navegar } from '../hooks/useRota.js'
import { confirmarAdmin } from '../hooks/useSessao.js'
import { entrarAdmin } from '../servicos/login.js'

function validar({ email, senha }) {
  return removerVazios({
    email: erroEmail(email),
    senha: senha === '' ? 'Informe a senha.' : undefined,
  })
}

async function enviar(valores) {
  const { uid } = await entrarAdmin(valores)
  confirmarAdmin(uid)
  navegar('/admin/painel')
}

function LoginAdmin({ tituloRef }) {
  const { valores, erros, aviso, enviando, alterar, registrar, aoEnviar } = useFormulario({
    inicial: { email: '', senha: '' },
    validar,
    limparAposEnvio: { senha: '' },
    enviar,
  })

  return (
    <LayoutAuth tituloRef={tituloRef} titulo="Área Administrativa" subtitulo="Acesso restrito à equipe do Delícias da Cá.">
      <FormularioAuth aoEnviar={aoEnviar} rotuloBotao="Entrar" aviso={aviso} enviando={enviando}>
        <CampoTexto
          id="admin-email"
          rotulo="E-mail"
          erro={erros.email}
          inputRef={registrar('email')}
          name="email"
          type="email"
          autoComplete="username"
          maxLength={254}
          spellCheck={false}
          autoCapitalize="none"
          value={valores.email}
          onChange={alterar('email')}
        />
        <CampoSenha
          id="admin-senha"
          rotulo="Senha"
          erro={erros.senha}
          inputRef={registrar('senha')}
          name="senha"
          autoComplete="current-password"
          value={valores.senha}
          onChange={alterar('senha')}
        />
      </FormularioAuth>
    </LayoutAuth>
  )
}

export default LoginAdmin
