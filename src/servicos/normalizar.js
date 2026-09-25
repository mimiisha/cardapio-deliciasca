const formatoE164 = /^[+]55[1-9][0-9]{9,10}$/

export function normalizarEmail(email) {
  return email.trim().toLowerCase()
}

export function normalizarWhatsapp(whatsapp) {
  const digitos = whatsapp.replace(/\D/g, '')
  const nacional = digitos.length === 10 || digitos.length === 11
  const comPais = (digitos.length === 12 || digitos.length === 13) && digitos.startsWith('55')
  const e164 = nacional ? `+55${digitos}` : comPais ? `+${digitos}` : ''
  return formatoE164.test(e164) ? e164 : null
}

export function normalizarNome(nome) {
  return nome.normalize('NFC').trim()
}

export function formatarWhatsapp(e164) {
  if (!formatoE164.test(e164)) return e164
  const ddd = e164.slice(3, 5)
  const numero = e164.slice(5)
  const corte = numero.length === 9 ? 5 : 4
  return `(${ddd}) ${numero.slice(0, corte)}-${numero.slice(corte)}`
}
