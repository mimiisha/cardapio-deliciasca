export const gruposAdmin = ['Operação', 'Cardápio', 'Planejamento', 'Gestão', 'Sistema']

export const telasAdmin = [
  { id: 'inicio', rotulo: 'Início', caminho: '/admin/painel', grupo: null },
  { id: 'agenda', rotulo: 'Agenda de entregas', caminho: '/admin/painel/agenda', grupo: 'Operação' },
  { id: 'producao', rotulo: 'Lista de produção', caminho: '/admin/painel/producao', grupo: 'Operação' },
  { id: 'romaneio', rotulo: 'Romaneio', caminho: '/admin/painel/romaneio', grupo: 'Operação' },
  { id: 'produtos', rotulo: 'Produtos', caminho: '/admin/painel/produtos', grupo: 'Cardápio' },
  { id: 'categorias', rotulo: 'Categorias', caminho: '/admin/painel/categorias', grupo: 'Cardápio' },
  { id: 'selos', rotulo: 'Selos', caminho: '/admin/painel/selos', grupo: 'Cardápio' },
  { id: 'datas', rotulo: 'Datas e capacidade', caminho: '/admin/painel/datas', grupo: 'Planejamento' },
  { id: 'financeiro', rotulo: 'Financeiro', caminho: '/admin/painel/financeiro', grupo: 'Gestão' },
  { id: 'clientes', rotulo: 'Clientes', caminho: '/admin/painel/clientes', grupo: 'Gestão' },
  { id: 'administradores', rotulo: 'Administradores', caminho: '/admin/painel/administradores', grupo: 'Sistema' },
  { id: 'configuracoes', rotulo: 'Configurações', caminho: '/admin/painel/configuracoes', grupo: 'Sistema' },
]
