# Briefing — Painel de Pedidos e Gestão de Marmitas

**Versão:** 1.0 (rascunho para validação com a cliente)
**Data:** setembro de 2026
**Tipo de produto:** Aplicação web responsiva (mobile-first) com duas áreas: Cliente e Administração

---

## 1. Contexto e problema

A empreendedora produz e entrega marmitas/refeições em datas fixas da semana (sextas e domingos). Hoje os pedidos chegam por canais informais (WhatsApp, mensagens avulsas), o que gera:

- retrabalho para anotar e conferir cada pedido;
- risco de esquecer ou duplicar pedidos;
- dificuldade de saber, de forma consolidada, **quanto** precisa produzir de cada item para cada data;
- controle de recebimentos manual e sujeito a erro;
- clientes recorrentes precisando repetir toda a conversa a cada semana.

O painel existe para transformar esse fluxo informal em um processo previsível: o cliente pede sozinho, a empreendedora vê a agenda pronta e sabe exatamente o que produzir e quanto tem a receber.

---

## 2. Objetivos

**Objetivo primário:** centralizar a captação de pedidos e a gestão da operação em um único lugar.

**Objetivos específicos:**

| # | Objetivo | Como se mede |
|---|---|---|
| O1 | Reduzir o tempo gasto anotando pedidos manualmente | Tempo médio por semana antes/depois |
| O2 | Eliminar erros de pedido (item ou quantidade errada) | Nº de pedidos corrigidos ou refeitos |
| O3 | Aumentar a recompra de clientes existentes | % de pedidos feitos via "Pedir de novo" |
| O4 | Dar previsibilidade de produção | Lista de produção disponível antes do prazo de compra de insumos |
| O5 | Controlar recebimentos | % de pedidos com pagamento conciliado no painel |

---

## 3. Públicos

**Cliente final** — pessoa que compra marmitas com alguma recorrência. Usa quase sempre o celular, muitas vezes com pressa. Não tolera cadastro longo. Precisa de: pedir rápido, repetir o último pedido, saber quando recebe e quanto vai pagar.

**Empreendedora (admin)** — usuária única do painel administrativo. Não é técnica. Usa o painel em momentos específicos: ao planejar as compras, ao produzir e ao separar as entregas. Precisa de: telas diretas, números grandes, listas imprimíveis ou fáceis de ler no celular na cozinha.

---

## 4. Escopo funcional — Área do Cliente

### 4.1 Cadastro e acesso
- Cadastro com nome, telefone/WhatsApp, e-mail e senha.
- Login por e-mail + senha. Recuperação de senha por e-mail.
- Endereço de entrega salvo no perfil (rua, número, complemento, bairro, referência).
- Possibilidade de mais de um endereço, com um marcado como padrão.
- Edição de dados cadastrais.

### 4.2 Catálogo e montagem do pedido
- Listagem dos produtos disponíveis com foto, nome, descrição curta e preço.
- Indicação clara quando um item estiver indisponível para a data escolhida.
- Seleção de quantidade por item e carrinho com subtotal atualizado.
- Campo de observação por item (ex.: "sem cebola") e observação geral do pedido.

### 4.3 Escolha da data de entrega
- O cliente escolhe a data de recebimento entre as **datas liberadas pela administradora** — por padrão, sextas e domingos.
- Datas com prazo de pedido encerrado ou com capacidade esgotada aparecem bloqueadas, com o motivo visível ("pedidos encerrados", "agenda cheia").
- Escolha entre **entrega** ou **retirada**, quando ambas estiverem habilitadas.

> **Regra importante:** as datas devem vir de uma configuração no painel admin, não fixadas no código. Sexta e domingo são o padrão de hoje, mas a empreendedora precisa poder bloquear um feriado, abrir uma data extra ou mudar os dias da semana sem depender do desenvolvedor.

### 4.4 Confirmação e pagamento
- Resumo do pedido antes de confirmar: itens, data, endereço, taxa de entrega (se houver) e total.
- Instruções de pagamento (ver pendência P3 na seção 11).
- Tela de confirmação com número do pedido e resumo.

### 4.5 Histórico de pedidos
- Lista de pedidos anteriores, do mais recente para o mais antigo, com data, itens, valor e status.
- Botão **"Pedir de novo"** em cada pedido: recria o carrinho com os mesmos itens e quantidades, e leva o cliente direto para a escolha da nova data.
- Ao repetir um pedido, o sistema precisa: (a) recalcular com os **preços atuais**, (b) avisar se algum item saiu do catálogo ou está indisponível, e (c) deixar o cliente ajustar antes de confirmar.
- Acompanhamento do status do pedido em andamento.

### 4.6 Cancelamento
- O cliente pode cancelar sozinho **até o prazo de corte** da data escolhida.
- Depois do prazo, o cancelamento só pode ser feito pela administradora (o insumo já foi comprado).

---

## 5. Escopo funcional — Painel Administrativo

### 5.1 Agenda de entregas
- Visão por data: quantos pedidos, quantos itens no total, valor total previsto.
- Ao abrir uma data: lista de pedidos com cliente, itens, endereço, forma de pagamento e status.
- Filtros por status (pendente, confirmado, pago, entregue, cancelado).

### 5.2 Lista de produção *(função de maior valor prático)*
- Para cada data, um resumo consolidado do que precisa ser produzido, somando todos os pedidos:
  ```
  Sexta, 18/09 — 23 marmitas
  • Frango grelhado ............ 12
  • Carne de panela ............  7
  • Vegetariano ................  4
  ```
- Lista separada de observações especiais, para não se perderem no meio dos pedidos.
- Formato legível no celular e/ou imprimível.

### 5.3 Romaneio de entrega
- Lista de entregas da data, agrupada por bairro/região, com nome, telefone, endereço, itens e valor a receber (quando o pagamento for na entrega).
- Marcação rápida de "entregue".

### 5.4 Gestão de produtos
- Cadastro, edição e remoção de produtos: nome, descrição, foto, preço, categoria.
- Ativar/desativar um produto sem apagá-lo (para não quebrar o histórico de pedidos antigos).
- Opcional: limite de unidades disponíveis por produto por data.

> **Regra importante:** alterar o preço de um produto **não pode** alterar o valor de pedidos já fechados. O pedido guarda o preço praticado no momento da compra.

### 5.5 Gestão de datas e capacidade
- Configurar quais dias da semana ficam abertos (padrão: sexta e domingo).
- Definir a **capacidade máxima** de marmitas por data.
- Definir o **prazo de corte** de cada data (ex.: pedidos para sexta encerram na quarta às 20h).
- Bloquear datas específicas (férias, feriados) e abrir datas extras.

### 5.6 Financeiro
- Total a receber por data e por período.
- Marcação manual de "pagamento recebido" por pedido.
- Lista de pedidos com pagamento pendente.
- Exportação simples (CSV) dos pedidos de um período.

### 5.7 Clientes
- Lista de clientes com contato, total de pedidos e data do último pedido.
- Acesso ao histórico individual.

---

## 6. Regras de negócio consolidadas

| ID | Regra |
|---|---|
| RN1 | Pedidos só podem ser feitos para datas abertas pela administradora (padrão: sextas e domingos) |
| RN2 | Cada data tem um prazo de corte; encerrado o prazo, a data não aceita novos pedidos |
| RN3 | Cada data tem capacidade máxima; atingido o limite, a data é bloqueada automaticamente |
| RN4 | O pedido armazena o preço vigente na data da compra e não é afetado por reajustes posteriores |
| RN5 | O cliente pode cancelar até o prazo de corte; após isso, apenas a administradora |
| RN6 | Produtos desativados somem do catálogo mas permanecem nos pedidos históricos |
| RN7 | "Pedir de novo" revalida disponibilidade e preço antes de confirmar |
| RN8 | Status do pedido segue o fluxo: Aguardando confirmação → Confirmado → Em preparo → Saiu para entrega → Entregue. Cancelado é um estado terminal alcançável a partir dos três primeiros |

---

## 7. Fluxos principais

**Fluxo 1 — Primeiro pedido**
Cadastro → catálogo → carrinho → escolha da data → endereço → resumo → confirmação → instruções de pagamento.

**Fluxo 2 — Recompra (o mais importante para a retenção)**
Login → histórico → "Pedir de novo" → escolha da nova data → confirmação. Meta: **menos de 4 toques** entre o login e o pedido confirmado.

**Fluxo 3 — Preparo da semana (admin)**
Prazo de corte encerra → abrir a data → conferir lista de produção → comprar insumos → produzir → imprimir romaneio → marcar entregas → conferir recebimentos.

---

## 8. Modelo de dados (entidades)

- **Cliente** — nome, telefone, e-mail, senha (hash), data de cadastro
- **Endereço** — cliente, logradouro, número, complemento, bairro, referência, padrão (sim/não)
- **Produto** — nome, descrição, foto, preço atual, categoria, ativo (sim/não)
- **DataDeEntrega** — data, capacidade máxima, prazo de corte, status (aberta/fechada/bloqueada)
- **Pedido** — cliente, data de entrega, endereço, modalidade (entrega/retirada), status, taxa de entrega, valor total, observação, forma de pagamento, status do pagamento, data de criação
- **ItemPedido** — pedido, produto, quantidade, **preço unitário no momento da compra**, observação
- **Configuração** — dias da semana padrão, taxa de entrega por região, textos de pagamento

---

## 9. Requisitos não funcionais

- **Mobile-first.** A maior parte do acesso será por celular. O desktop é secundário, inclusive no admin.
- **Responsivo** em telas de 320px a 1920px.
- **Fluxo de pedido em poucos passos** — cada campo a mais no cadastro derruba conversão.
- **Acessibilidade básica:** contraste adequado, áreas de toque de no mínimo 44px, textos legíveis sem zoom.
- **Segurança:** senhas com hash, acesso administrativo separado e protegido, dados pessoais acessíveis apenas ao próprio cliente e à administradora.
- **LGPD:** coletar apenas o necessário, ter política de privacidade simples e permitir exclusão da conta.
- **Disponibilidade:** o pico de acesso acontece perto do prazo de corte; o sistema precisa aguentar esse momento.

---

## 10. Sugestão de arquitetura

Considerando o domínio de Dart/Flutter já existente:

- **Front-end:** Flutter Web (PWA) — uma base de código atende cliente e admin, com rotas e permissões distintas. Permite evoluir para app nativo Android/iOS depois sem reescrever.
- **Back-end/BaaS:** Firebase (Auth + Firestore + Storage para as fotos) ou Supabase (Auth + Postgres + Storage). Ambos eliminam a necessidade de servidor próprio e cabem no orçamento de um projeto pequeno.
  - Firebase: integração mais direta com Flutter; modelagem NoSQL exige atenção nas consultas por data.
  - Supabase: Postgres relacional, mais natural para os relatórios financeiros e a lista de produção.
- **Notificações:** link direto para WhatsApp (`wa.me`) na v1, por custo zero. Integração com a API oficial do WhatsApp fica para uma fase posterior.
- **Hospedagem:** Firebase Hosting, Vercel ou Netlify.

Essa é uma recomendação a validar — a decisão final depende do orçamento e de quem vai manter o sistema.

---

## 11. Pendências a confirmar com a cliente

| ID | Pergunta | Por que importa |
|---|---|---|
| P1 | Qual o prazo de corte ideal para cada data? | Define quando ela consegue comprar insumos |
| P2 | Quantas marmitas ela consegue produzir por data, no máximo? | Evita aceitar pedido que não consegue entregar |
| P3 | O pagamento será antecipado (PIX com comprovante) ou na entrega? | Muda o fluxo de checkout e o controle financeiro |
| P4 | Existe taxa de entrega? Varia por bairro? | Afeta cálculo do total e cadastro de regiões |
| P5 | O cardápio é fixo ou muda a cada semana? | Se muda, o catálogo precisa ser vinculado à data |
| P6 | Existe pedido mínimo? | Regra de validação no carrinho |
| P7 | Retirada no local é uma opção? | Habilita ou não a modalidade |
| P8 | Quem vai cadastrar os produtos e tirar as fotos? | Impacta o prazo de lançamento |

---

## 12. Fora do escopo da versão 1

Registrado aqui para evitar ampliação silenciosa do projeto:

- Pagamento online integrado (gateway, cartão, PIX automático)
- App nativo publicado nas lojas
- Programa de fidelidade, cupons e promoções
- Múltiplos administradores com níveis de permissão
- Controle de estoque de insumos
- Emissão de nota fiscal
- Entrega com rastreamento em tempo real
- Assinatura/plano semanal recorrente

---

## 13. Fases sugeridas

**Fase 1 — Base**
Cadastro e login, catálogo, carrinho, escolha de data com prazo de corte e capacidade, confirmação de pedido.

**Fase 2 — Operação**
Painel admin: agenda, lista de produção, romaneio, gestão de produtos, gestão de datas.

**Fase 3 — Recorrência**
Histórico, "Pedir de novo", status do pedido, notificações via WhatsApp.

**Fase 4 — Controle**
Financeiro, exportação, base de clientes.

---

## 14. Critérios de aceite da v1

- [ ] Um cliente novo consegue se cadastrar e concluir um pedido em menos de 3 minutos
- [ ] Um cliente recorrente consegue repetir um pedido em menos de 4 toques
- [ ] Nenhum pedido é aceito para data com prazo encerrado ou capacidade esgotada
- [ ] A administradora consegue ver, para qualquer data, quantas unidades de cada produto precisa produzir
- [ ] Alterar o preço de um produto não altera nenhum pedido já registrado
- [ ] Toda a jornada do cliente funciona em um celular de 360px de largura
