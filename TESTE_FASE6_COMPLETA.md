# 🧪 Guia de Teste - Fase 6 Completa

**Data de Deploy**: 08/12/2024  
**Commit**: c2c3e51  
**Funcionalidades**: Finalização de Planos + Sistema de Retalhos + Histórico

---

## 🎯 O Que Foi Implementado

### 1. ✅ Finalização de Planos de Corte

**Backend**:
- `POST /api/mobile/finalizar-plano/:planoId`
- Valida que plano está em `em_producao`
- Verifica se todos os cortes foram confirmados
- Gera retalhos automaticamente de sobras ≥10m
- Libera metragens reservadas
- Atualiza status para `finalizado` com timestamp

**Frontend Desktop**:
- Modal de confirmação com resumo detalhado
- Mostra: cliente, aviário, total de cortes, confirmados, metragem, bobinas utilizadas
- Aviso se nem todos os cortes foram confirmados
- Exibição dos retalhos gerados após finalização
- Botão "Finalizar" visível nos cards com status `em_producao`

### 2. ♻️ Sistema Completo de Retalhos

**Database**:
- Migration `021_add_qr_code_retalhos.js`
- Adiciona campo `qr_code` VARCHAR(50) UNIQUE
- Gera QR codes automáticos para retalhos existentes (formato: `R-{id}`)

**Backend**:
- QR code automático ao criar retalho manual
- QR code automático ao gerar retalhos na finalização
- Código sequencial `RET-2024-00001` (ano dinâmico)

**Frontend - Nova Página `retalhos.html`**:
- Menu principal: "Retalhos" entre "Ordens de Corte" e "Configurações"
- Listagem completa com tabela
- Filtros:
  - Busca geral (código, produto, localização)
  - Loja (Cortinave/BN)
  - Metragem (10-30m, 30-50m, 50m+)
  - Status (disponível, reservado, usado)
- Estatísticas no topo:
  - Total de retalhos
  - Metragem total
  - Disponíveis
  - Reservados
- CRUD completo:
  - ➕ Criar retalho manual
  - ✏️ Editar metragem/localização
  - 🗑️ Excluir retalho
  - 🖨️ Imprimir etiqueta com QR code

### 3. 📅 Histórico e Rastreabilidade

**Backend**:
- `GET /api/ordens-corte/:id/historico`
- Retorna eventos cronológicos:
  - 📝 Criação do plano
  - 🔗 Alocações de bobinas/retalhos
  - ▶️ Início de produção (primeiro corte confirmado)
  - ✅ Cada corte confirmado
  - 🏁 Finalização do plano
  - 📦 Retalhos gerados

**Frontend**:
- Sistema de tabs no modal de detalhes do plano
- Tab "📦 Itens do Plano" (visualização original)
- Tab "📅 Histórico" (nova timeline visual)
- Timeline estilizada com:
  - Ícones por tipo de evento
  - Cores diferenciadas
  - Data/hora de cada evento
  - Descrição detalhada

---

## 🧪 Roteiro de Teste Completo

### Pré-requisitos
1. Acesse o Railway: https://[seu-app].railway.app
2. Verifique que a migration 021 rodou com sucesso (logs do Railway)
3. Tenha alguns planos de corte já criados

### Teste 1: Finalização de Plano (Desktop)

**Cenário**: Finalizar um plano que já teve todos os cortes validados no app mobile

1. Acesse "Ordens de Corte"
2. Localize um plano com status **Em Produção** que tenha badge "✅ PRONTO - Todos cortados"
3. Clique no botão **"✓ Finalizar"** (verde, último botão do card)
4. **Validar modal de confirmação**:
   - ✅ Título: "✅ Finalizar Plano de Corte"
   - ✅ Resumo mostra: código, cliente, aviário
   - ✅ Resumo mostra: total de cortes, confirmados, metragem, bobinas
   - ✅ Se nem todos confirmados, aparece aviso amarelo
5. Clique em **"✅ Confirmar Finalização"**
6. **Validar resultado**:
   - ✅ Mensagem de sucesso no topo
   - ✅ Se foram gerados retalhos, lista aparece em azul claro
   - ✅ Mostra: código do retalho (RET-2024-XXXXX), metragem, produto
7. Clique em **"Fechar"**
8. **Validar Kanban**:
   - ✅ Plano sumiu da coluna "Em Produção"
   - ✅ Plano apareceu na coluna "Finalizado"

### Teste 2: Página de Retalhos

1. No menu principal, clique em **"Retalhos"**
2. **Validar layout inicial**:
   - ✅ Cards de estatísticas no topo (Total, Metragem, Disponíveis, Reservados)
   - ✅ Barra de filtros (Busca, Loja, Metragem, Status)
   - ✅ Botão "➕ Novo Retalho"
   - ✅ Tabela com colunas: Código, QR Code, Produto, Metragem, etc.
3. **Validar retalhos gerados automaticamente**:
   - ✅ Aparecem retalhos com código RET-2024-XXXXX
   - ✅ Coluna "QR Code" mostra código R-{id}
   - ✅ Coluna "Origem" mostra ícone 📦 e código da bobina
   - ✅ Observações dizem "Gerado automaticamente do plano..."

### Teste 3: Filtros de Retalhos

1. Na barra de busca, digite um código de produto
   - ✅ Tabela filtra em tempo real
2. Selecione "Cortinave" no filtro de Loja
   - ✅ Mostra apenas retalhos dessa loja
3. Selecione "10m - 30m" no filtro de Metragem
   - ✅ Mostra apenas retalhos nessa faixa
4. Clique em "🔄 Limpar"
   - ✅ Todos os filtros resetam

### Teste 4: Criar Retalho Manual

1. Clique em **"➕ Novo Retalho"**
2. **Preencher formulário**:
   - Produto: Selecione qualquer produto
   - Metragem: Digite "25.50"
   - Localização: Digite "A1-B2-C3"
   - Observações: Digite "Sobra de corte manual"
3. Clique em **"💾 Salvar"**
4. **Validar**:
   - ✅ Mensagem de sucesso
   - ✅ Modal fecha
   - ✅ Novo retalho aparece na tabela
   - ✅ Código é RET-2024-XXXXX (sequencial)
   - ✅ QR Code é R-{id}
   - ✅ Origem mostra "Manual" (cinza)

### Teste 5: Imprimir Etiqueta de Retalho

1. Na linha de qualquer retalho, clique no botão **🖨️**
2. **Validar preview**:
   - ✅ QR Code visível
   - ✅ Código do retalho embaixo
   - ✅ Nome do produto e especificações
   - ✅ Metragem em destaque
3. Clique em **"🖨️ Imprimir"**
4. **Validar**:
   - ✅ Abre janela de impressão do navegador
   - ✅ Layout otimizado para 57mm
   - ✅ Apenas preto (monocromático)

### Teste 6: Editar Retalho

1. Clique no botão **✏️** de qualquer retalho
2. **Validar modal**:
   - ✅ Código aparece (desabilitado)
   - ✅ Metragem editável
   - ✅ Localização editável
   - ✅ Observações editável
3. Altere a metragem para "30.00"
4. Clique em **"💾 Salvar"**
5. **Validar**:
   - ✅ Mensagem de sucesso
   - ✅ Tabela atualiza automaticamente
   - ✅ Nova metragem aparece

### Teste 7: Histórico do Plano

1. Em "Ordens de Corte", clique em qualquer plano (card inteiro)
2. **Validar modal de detalhes**:
   - ✅ Duas abas no topo: "📦 Itens do Plano" | "📅 Histórico"
3. Clique na aba **"📅 Histórico"**
4. **Validar timeline**:
   - ✅ Linha vertical conectando eventos
   - ✅ Ícones circulares coloridos para cada evento
   - ✅ Primeiro evento: 📝 Criação do plano
   - ✅ Eventos de alocação: 🔗 com código da bobina/retalho
   - ✅ Se em produção: ▶️ Início de produção
   - ✅ Eventos de corte: ✅ com detalhes do corte
   - ✅ Se finalizado: 🏁 Finalização + 📦 Retalhos gerados
5. **Validar ordenação**:
   - ✅ Eventos em ordem cronológica (mais antigo no topo)
   - ✅ Data e hora formatadas (DD/MM/YYYY HH:MM)

### Teste 8: Fluxo Completo End-to-End

**Objetivo**: Criar um plano do zero até a finalização

1. **Desktop**: Criar plano de corte
   - Cliente: "Teste Fase 6"
   - Aviário: "Aviário 10"
   - Adicionar 3-4 cortes
2. **Desktop**: Alocar automaticamente
3. **Desktop**: Enviar para produção
4. **Mobile**: Validar todos os cortes
   - Escanear bobinas
   - Tirar fotos
   - Confirmar metragens
5. **Desktop**: Verificar badge "✅ PRONTO"
6. **Desktop**: Clicar em "Histórico"
   - ✅ Ver todos os eventos até agora
7. **Desktop**: Finalizar plano
   - ✅ Ver retalhos gerados (se sobras ≥10m)
8. **Desktop**: Ir em "Retalhos"
   - ✅ Encontrar retalhos do plano
   - ✅ Imprimir etiqueta de um deles
9. **Desktop**: Voltar ao plano e ver "Histórico"
   - ✅ Evento de finalização aparece
   - ✅ Retalhos gerados listados

---

## 🐛 Possíveis Problemas e Soluções

### Migration não roda
- **Causa**: Railway não reiniciou após push
- **Solução**: Ir em Settings → Restart Service

### QR code não aparece
- **Causa**: Campo qr_code ainda não existe
- **Solução**: Verificar logs da migration 021

### Erro "db.promise is not a function"
- **Causa**: Ambiente local sem MySQL
- **Solução**: IGNORAR - só acontece localmente, Railway funciona

### Retalhos não aparecem após finalização
- **Causa**: Sobras < 10m (não gera retalho)
- **Solução**: Testar com bobinas que deixem sobra maior

### Timeline vazia
- **Causa**: Plano muito antigo sem timestamps
- **Solução**: Testar com plano novo

---

## 📊 Validação de Sucesso

Checklist para confirmar que tudo está funcionando:

- [ ] Migration 021 executada com sucesso (logs do Railway)
- [ ] Campo `qr_code` existe na tabela `retalhos`
- [ ] Endpoint `/api/mobile/finalizar-plano/:id` retorna 200
- [ ] Endpoint `/api/ordens-corte/:id/historico` retorna eventos
- [ ] Página `/retalhos.html` carrega sem erros
- [ ] Finalização de plano gera retalhos (se sobra ≥10m)
- [ ] Retalhos têm QR code no formato R-{id}
- [ ] Timeline mostra eventos cronológicos
- [ ] Impressão de etiqueta funciona
- [ ] Filtros de retalhos funcionam
- [ ] Estatísticas atualizam corretamente

---

## 🎉 Próximos Passos (Opcional)

Caso queira continuar a implementação:

1. **Filtros Avançados em Ordens** (Task 7):
   - Filtro por período (data início/fim)
   - Ordenação (mais recente, mais antigo, maior metragem)
   - Paginação (se > 50 planos)

2. **Relatórios Básicos** (Task 8):
   - Dashboard com gráficos
   - Produtividade (planos/dia)
   - Consumo por produto
   - Retalhos gerados no mês
   - Tempo médio de corte

---

**Status Atual**: ✅ Fase 6 - 75% Completa (6 de 8 tarefas)

**Última Atualização**: 08/12/2024 - 14:30
