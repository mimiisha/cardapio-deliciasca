const tracos = {
  inicio: 'M3 11l9-7 9 7M5 9.5V20h14V9.5M10 20v-6h4v6',
  agenda: 'M4 6h16v14H4zM4 10h16M8 3v4M16 3v4',
  producao: 'M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01',
  romaneio: 'M3 7h11v9H3zM14 10h4l3 3v3h-7M5 18a2 2 0 1 0 4 0a2 2 0 1 0-4 0M15 18a2 2 0 1 0 4 0a2 2 0 1 0-4 0',
  produtos: 'M3 11h18a9 9 0 0 1-18 0zM9 7c0-1.5 1.5-1.5 1.5-3M14 7c0-1.5 1.5-1.5 1.5-3',
  categorias: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
  selos: 'M3 4v7.2a2 2 0 0 0 .6 1.4l8.8 8.8a2 2 0 0 0 2.8 0l6.2-6.2a2 2 0 0 0 0-2.8L12.6 3.6A2 2 0 0 0 11.2 3H4a1 1 0 0 0-1 1zM6 7.5a1.5 1.5 0 1 0 3 0 1.5 1.5 0 1 0-3 0',
  datas: 'M3 12a9 9 0 1 0 18 0a9 9 0 1 0-18 0M12 7v5l3 2',
  financeiro: 'M3 6h18v12H3zM9 12a3 3 0 1 0 6 0a3 3 0 1 0-6 0',
  clientes: 'M5 7a4 4 0 1 0 8 0a4 4 0 1 0-8 0M2 21v-1a7 7 0 0 1 14 0v1M16 3.5a4 4 0 0 1 0 7M22 21v-1a7 7 0 0 0-4-6.3',
  administradores: 'M12 3l8 3v6c0 5-3.5 8-8 9c-4.5-1-8-4-8-9V6zM9 12l2 2 4-4',
  configuracoes: 'M4 6h9M17 6h3M4 12h3M11 12h9M4 18h11M19 18h1M15 4v4M9 10v4M17 16v4',
  sair: 'M14 4h5v16h-5M10 8l-4 4 4 4M6 12h10',
  menu: 'M4 6h16M4 12h16M4 18h16',
  fechar: 'M6 6l12 12M18 6L6 18',
  adicionar: 'M12 5v14M5 12h14',
}

function Icone({ nome, className = 'size-5' }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`shrink-0 ${className}`}
    >
      <path d={tracos[nome]} />
    </svg>
  )
}

export default Icone
