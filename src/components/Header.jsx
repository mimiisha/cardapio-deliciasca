import { useState } from 'react'
import LinkRota from './LinkRota.jsx'
import MenuConta from './MenuConta.jsx'
import { iniciarSessao, useSessao } from '../hooks/useSessao.js'

const links = [
  { href: '#sobre', rotulo: 'Sobre' },
  { href: '#contato', rotulo: 'Contato' },
  { href: '#produtos', rotulo: 'Produtos' },
  { href: '/entrar', rotulo: 'Log-in', destaque: true },
]

const classeLink =
  'flex min-h-11 min-w-11 items-center justify-center rounded-full px-1 text-sm font-semibold text-tinta decoration-2 underline-offset-4 hover:bg-tinta/10 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tinta sm:px-4 sm:text-base'

const classeDestaque =
  'ml-1 flex min-h-11 min-w-11 items-center justify-center rounded-full bg-tinta px-2 text-sm font-semibold text-mostarda hover:bg-tomate-escuro hover:text-papel focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tinta sm:px-5 sm:text-base'

function LogoChef() {
  return (
    <svg aria-hidden="true" viewBox="0 0 48 48" className="size-11">
      <circle cx="24" cy="24" r="23" className="fill-tomate stroke-papel" strokeWidth="2" />
      <path d="M15 30v-4.5a6 6 0 0 1 2.5-11.3 7 7 0 0 1 13 0A6 6 0 0 1 33 25.5V30z" className="fill-papel" />
      <rect x="15" y="31.5" width="18" height="5" rx="1.5" className="fill-papel" />
      <path d="M21 24v6M27 24v6" className="stroke-tomate" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
    </svg>
  )
}

const classeLogo =
  'flex min-h-11 min-w-11 items-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tinta'

function Logo({ tituloRef, inicio }) {
  if (!inicio) {
    return (
      <LinkRota href="/" className={`${classeLogo} shrink-0`}>
        <LogoChef />
        <span className="sr-only">Delícias da Cá, página inicial</span>
      </LinkRota>
    )
  }
  return (
    <h1 ref={tituloRef} tabIndex={-1} className="shrink-0 focus:outline-none">
      <a href="#" className={classeLogo}>
        <LogoChef />
        <span className="sr-only">Delícias da Cá</span>
      </a>
    </h1>
  )
}

function Header({ tituloRef, inicio = true }) {
  const sessao = useSessao()
  const logado = sessao.estado === 'autenticado' && sessao.emailVerificado
  const [aviso, setAviso] = useState({ texto: '', erro: false })

  return (
    <header className="bg-mostarda shadow-[0_1px_0_rgb(43_29_22/0.12)]">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-2 px-3 py-1.5 sm:px-6">
        <Logo tituloRef={tituloRef} inicio={inicio} />
        <nav aria-label="Principal">
          <ul className="flex flex-wrap justify-end">
            {links.map((link) => (
              <li key={link.rotulo}>
                {link.destaque && logado ? (
                  <MenuConta nome={sessao.nome} tituloRef={tituloRef} aoAvisar={setAviso} classeBotao={classeDestaque} />
                ) : link.href.startsWith('/') ? (
                  <LinkRota
                    href={link.href}
                    className={link.destaque ? classeDestaque : classeLink}
                    onFocus={iniciarSessao}
                    onPointerDown={iniciarSessao}
                  >
                    {link.rotulo}
                  </LinkRota>
                ) : (
                  <a href={inicio ? link.href : `/${link.href}`} className={link.destaque ? classeDestaque : classeLink}>
                    {link.rotulo}
                  </a>
                )}
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <p
        role="status"
        className={
          aviso.erro ? 'mx-auto max-w-5xl px-3 pb-2 text-right text-sm font-medium text-tinta sm:px-6' : 'sr-only'
        }
      >
        {aviso.texto}
      </p>
    </header>
  )
}

export default Header
