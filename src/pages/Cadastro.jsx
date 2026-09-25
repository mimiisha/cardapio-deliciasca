import LayoutAuth from '../components/LayoutAuth.jsx'
import FormularioAuth from '../components/FormularioAuth.jsx'
import CampoTexto from '../components/CampoTexto.jsx'
import CampoSenha from '../components/CampoSenha.jsx'
import ForcaSenha from '../components/ForcaSenha.jsx'
import LinkAlternativo from '../components/LinkAlternativo.jsx'
import {
  avaliarSenha,
  comprimento,
  erroEmail,
  erroNome,
  erroWhatsapp,
  removerVazios,
  senhaComum,
  tamanhoMinimoSenha,
} from '../components/validacao.js'
import { useFormulario } from '../hooks/useFormulario.js'
import { cadastrarCliente } from '../servicos/login.js'

const avisoCadastro = 'Enviamos um link de confirmação para o seu e-mail. Confira também a caixa de spam.'

async function enviar(valores) {
  await cadastrarCliente(valores)
  return avisoCadastro
}

function erroSenha(senha) {
  if (senha === '') return 'Informe a senha.'
  if (comprimento(senha) < tamanhoMinimoSenha) return `A senha precisa ter pelo menos ${tamanhoMinimoSenha} caracteres.`
  if (senhaComum(senha)) return 'Essa senha é muito comum. Escolha outra.'
  return undefined
}

function erroConfirmacao(senha, confirmacao) {
  if (confirmacao === '') return 'Confirme a senha.'
  if (confirmacao !== senha) return 'As senhas não coincidem.'
  return undefined
}

function validar({ nome, whatsapp, email, senha, confirmacao }) {
  return removerVazios({
    nome: erroNome(nome),
    whatsapp: erroWhatsapp(whatsapp),
    email: erroEmail(email),
    senha: erroSenha(senha),
    confirmacao: erroConfirmacao(senha, confirmacao),
  })
}

function Cadastro({ tituloRef }) {
  const { valores, erros, aviso, enviando, alterar, registrar, aoEnviar } = useFormulario({
    inicial: { nome: '', whatsapp: '', email: '', senha: '', confirmacao: '' },
    validar,
    limparAposEnvio: { senha: '', confirmacao: '' },
    enviar,
  })

  const forca = avaliarSenha(valores.senha, [valores.nome, valores.email.split('@')[0]])

  return (
    <LayoutAuth
      tituloRef={tituloRef}
      titulo="Criar conta"
      subtitulo="Cadastre-se para encomendar suas marmitas."
      largura="larga"
    >
      <FormularioAuth
        larga
        aoEnviar={aoEnviar}
        rotuloBotao="Criar conta"
        aviso={aviso}
        enviando={enviando}
        acaoSecundaria={
          <LinkAlternativo href="/entrar" margem="">
            Já tenho conta<span className="sr-only">, entrar</span>
          </LinkAlternativo>
        }
      >
        <CampoTexto
          id="cadastro-nome"
          rotulo="Nome"
          erro={erros.nome}
          inputRef={registrar('nome')}
          name="nome"
          type="text"
          autoComplete="name"
          maxLength={100}
          value={valores.nome}
          onChange={alterar('nome')}
        />
        <CampoTexto
          id="cadastro-whatsapp"
          rotulo="WhatsApp"
          erro={erros.whatsapp}
          inputRef={registrar('whatsapp')}
          name="whatsapp"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          maxLength={20}
          value={valores.whatsapp}
          onChange={alterar('whatsapp')}
        />
        <div className="sm:col-span-2">
          <CampoTexto
            id="cadastro-email"
            rotulo="E-mail"
            erro={erros.email}
            inputRef={registrar('email')}
            name="email"
            type="email"
            autoComplete="email"
            maxLength={254}
            spellCheck={false}
            autoCapitalize="none"
            value={valores.email}
            onChange={alterar('email')}
          />
        </div>
        <CampoSenha
          id="cadastro-senha"
          rotulo="Senha"
          erro={erros.senha}
          dica={`Mínimo de ${tamanhoMinimoSenha} caracteres.`}
          complemento={forca.nivel > 0 ? <ForcaSenha id="cadastro-senha-forca" avaliacao={forca} /> : null}
          complementoId="cadastro-senha-forca"
          inputRef={registrar('senha')}
          name="senha"
          autoComplete="new-password"
          value={valores.senha}
          onChange={alterar('senha')}
        />
        <CampoSenha
          id="cadastro-confirmar"
          rotulo="Confirmar senha"
          rotuloBotao="Mostrar confirmação de senha"
          erro={erros.confirmacao}
          inputRef={registrar('confirmacao')}
          name="confirmacao"
          autoComplete="new-password"
          value={valores.confirmacao}
          onChange={alterar('confirmacao')}
        />
      </FormularioAuth>
    </LayoutAuth>
  )
}

export default Cadastro
