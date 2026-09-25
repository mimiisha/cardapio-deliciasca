import { formatarWhatsapp } from '../../servicos/normalizar.js'

function soDigitos(texto) {
  return texto.replace(/\D/g, '')
}

function LinkWhatsapp({ whatsapp, nome }) {
  return (
    <a
      href={`https://wa.me/${soDigitos(whatsapp)}`}
      target="_blank"
      rel="noopener noreferrer"
      className="-mx-1 inline-flex min-h-11 items-center rounded-lg px-1 text-base font-semibold text-tomate-escuro underline decoration-2 underline-offset-4 hover:text-tinta focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tinta"
    >
      {formatarWhatsapp(whatsapp)}
      <span className="sr-only">
        , WhatsApp de {nome || 'cliente sem nome'} (abre em nova aba)
      </span>
    </a>
  )
}

export default LinkWhatsapp
