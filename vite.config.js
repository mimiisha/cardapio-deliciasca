import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

const variaveisFirebase = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
]

export default defineConfig(({ command, mode }) => {
  if (command === 'build') {
    const env = loadEnv(mode, process.cwd(), 'VITE_FIREBASE_')
    const ausentes = variaveisFirebase.filter((nome) => !env[nome] || env[nome].trim() === '')
    if (ausentes.length > 0) {
      throw new Error(`Build interrompido: variáveis de ambiente ausentes: ${ausentes.join(', ')}`)
    }
  }

  return {
    plugins: [react(), tailwindcss()],
    build: {
      chunkSizeWarningLimit: 600,
      rolldownOptions: { output: { codeSplitting: { groups: [{ name: 'inicial', tags: ['$initial'] }] } } },
    },
  }
})
