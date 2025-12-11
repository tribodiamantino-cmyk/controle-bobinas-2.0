# Sistema de Cortes com QR Code - Documentação Técnica

## Visão Geral

Sistema completo de rastreabilidade de cortes com validação via QR Code, fotos de contraprova e gestão de armazenamento para o Controle de Bobinas 2.0.

**Data de Implementação:** Janeiro 2025  
**Versão:** 1.0.0  
**Status:** ✅ Produção

---

## Arquitetura do Sistema

### 1. Banco de Dados

#### Novas Tabelas

**`locacoes`** - Localizações físicas no armazém
```sql
- id (PK)
- codigo (UNIQUE, ex: A1-B1-C1)
- descricao
- capacidade
- ativa (boolean)
- created_at, updated_at
```

**`cortes_realizados`** - Registro individual de cada corte
```sql
- id (PK)
- codigo_corte (UNIQUE, auto-gerado: COR-2025-00001)
- alocacao_id (FK → alocacoes_corte)
- plano_id (FK → planos_corte)
- origem_tipo ('bobina' | 'retalho')
- origem_id
- metragem_cortada (decimal)
- foto_medidor (path do arquivo)
- observacoes (text)
- created_at
```

**`plano_locacoes`** - Relacionamento N:N entre planos e locações
```sql
- id (PK)
- plano_id (FK → planos_corte)
- locacao_id (FK → locacoes)
- created_at
```

**`carregamentos`** - Processos de carregamento para envio
```sql
- id (PK)
- codigo_carregamento (UNIQUE, ex: CAR-2025-00001)
- plano_id (FK → planos_corte)
- status ('em_andamento' | 'finalizado' | 'cancelado')
- finalizado_em (datetime)
- created_at, updated_at
```

**`carregamentos_itens`** - Auditoria de cortes validados no carregamento
```sql
- id (PK)
- carregamento_id (FK → carregamentos)
- corte_id (FK → cortes_realizados)
- validado_em (datetime)
```

#### Alterações em Tabelas Existentes

**`planos_corte`** - Novos campos para armazenamento
```sql
+ data_finalizacao (datetime)
+ armazenado (boolean, default false)
+ locacoes_armazenamento (JSON, ex: [1,3,5])
```

**`alocacoes_corte`** - Tracking de cortes
```sql
+ metragem_cortada (decimal, default 0)
+ status_corte ('pendente' | 'em_andamento' | 'concluido')
```

**`bobinas` e `retalhos`** - Referência de localização
```sql
+ locacao_id (FK → locacoes, nullable)
```

---

## Fluxo de Operação

### Fase 1: Preparação (Desktop)
1. Criar plano de corte normal (interface existente)
2. Status: `planejamento` → `em_producao`
3. Sistema aloca automaticamente bobinas/retalhos
4. Imprimir etiquetas de locações (Configurações → Manutenção)

### Fase 2: Produção (Mobile)
1. Operador abre **Ordens Produção** no mobile
2. Seleciona plano em produção
3. Para cada item do plano:
   - **a) Validar Origem:** Escaneia QR da bobina/retalho
     - ✅ Verde: origem correta
     - ❌ Vermelho: origem incorreta (mostra esperado vs escaneado)
   - **b) Registrar Corte:**
     - Informa metragem cortada
     - Tira foto do medidor (contraprova)
     - Observações opcionais
     - Sistema gera código único (COR-2025-00001)
   - **c) QR Corte Gerado:**
     - Mostra QR Code do corte
     - Opções: registrar outro corte | finalizar item
     - Atualiza progresso da alocação

### Fase 3: Armazenamento (Mobile)
4. Quando **todos os itens** de um plano estão cortados:
   - Sistema pede **escanear locações de armazenamento**
   - Operador escaneia QR das prateleiras (ex: A1-B1-C1, A2-B1-C2)
   - Mínimo 1 locação obrigatória
   - Confirma finalização
   - Status: `em_producao` → `finalizado`

### Fase 4: Carregamento (Mobile)
5. Menu **Carregamento** → Lista planos finalizados
6. Operador seleciona plano para carregar
7. Sistema cria registro de carregamento (CAR-2025-00001)
8. Escaneia QR de cada corte:
   - ✅ Verde: corte pertence ao plano
   - ❌ Vermelho: corte não pertence
   - Barra de progresso visual
9. Quando **todos os cortes** validados → Finalizar Carregamento

---

## Endpoints da API

### QR Codes (`/api/qrcodes`)
```
GET  /bobina/:id            - Gera QR de bobina (BOB-123)
GET  /retalho/:id           - Gera QR de retalho (RET-456)
GET  /corte/:codigo         - Gera QR de corte (CORTE-COR-2025-00001)
GET  /locacao/:id           - Gera QR de locação (LOC-5)
POST /locacoes/lote         - Gera múltiplos QRs de locações
```

### Cortes (`/api/mobile/corte`)
```
POST /registrar-corte       - Cria novo corte
  Body: { alocacao_id, metragem_cortada, foto_medidor, observacoes }
  
GET  /:codigo_corte         - Consulta corte por código
GET  /plano/:plano_id       - Lista cortes de um plano
```

### Locações (`/api/locacoes`)
```
GET    /                    - Lista todas locações
GET    /:id                 - Busca locação por ID
POST   /                    - Cria nova locação
PUT    /:id                 - Atualiza locação
DELETE /:id                 - Desativa locação (soft delete)
```

### Mobile - Validação
```
POST /api/mobile/validar-qr-bobina
  Body: { qr_data, alocacao_id }
  Response: { success, data: { origem_tipo, origem_id } }

POST /api/mobile/upload-foto-medidor
  Content-Type: multipart/form-data
  Field: foto (file)
  Response: { success, data: { filePath } }
```

### Mobile - Armazenamento
```
POST /api/mobile/plano/:id/adicionar-locacao
  Body: { locacao_id }

POST /api/mobile/plano/:id/finalizar
  Body: { locacoes_ids: [1,3,5] }
```

### Mobile - Carregamento
```
GET  /api/mobile/carregamento/planos-finalizados
POST /api/mobile/carregamento/iniciar
  Body: { plano_id }
  Response: { success, data: { id, codigo_carregamento, cortes: [...] } }

POST /api/mobile/carregamento/validar-scan
  Body: { carregamento_id, codigo_corte }
  Response: { success, data: { corte } }

POST /api/mobile/carregamento/finalizar
  Body: { carregamento_id }
```

---

## Upload de Fotos

### Middleware (`middleware/uploadFotos.js`)
```javascript
- Biblioteca: multer + sharp
- Limite: 5MB por arquivo
- Formato: JPEG comprimido
- Destino: ./uploads/fotos-medidor/
- Nome: medidor_{timestamp}.jpg
- Compressão: resize(1200px width), quality 80%, progressive
```

### Acesso
```
URL: /uploads/fotos-medidor/medidor_1704067200000.jpg
Configurado em server.js: app.use('/uploads', express.static('uploads'))
```

---

## Geração de Códigos Únicos

### Padrão de Códigos

**Cortes:**
```
COR-{YEAR}-{SEQ}
Exemplo: COR-2025-00001, COR-2025-00002
Implementação: cortesController.js:gerarCodigoCorte()
```

**Carregamentos:**
```
CAR-{YEAR}-{SEQ}
Exemplo: CAR-2025-00001
Implementação: routes/mobile.js (inline na rota /carregamento/iniciar)
```

**Locações:**
```
{RUA}-{PRATELEIRA}-{COLUNA}
Exemplo: A1-B1-C1, B2-B2-C3
Formato fixo definido nas migrations (seed inicial)
```

---

## Locações Iniciais (Seed)

17 locações criadas automaticamente na migration 019:

### Rua A
- **Prateleira 1:** A1-B1-C1, A1-B1-C2
- **Prateleira 2:** A1-B2-C1, A1-B2-C2, A1-B2-C3
- **Prateleira 3:** A2-B1-C1, A2-B1-C2
- **Prateleira 4:** A2-B2-C1, A2-B2-C2, A2-B2-C3

### Rua B
- **Prateleira 1:** B1-B1-C1, B1-B1-C2
- **Prateleira 2:** B1-B2-C1, B1-B2-C2, B1-B2-C3
- **Prateleira 3:** B2-B2-C1, B2-B2-C2

---

## Interface Mobile (PWA)

### Telas Implementadas

1. **Menu Principal** (3 cards)
   - 🏭 Ordens Produção
   - 🔍 Consultas
   - 🚚 Carregamento

2. **Submenu Consultas**
   - 📦 Consultar Bobina (já existia)
   - ✂️ Consultar Corte (novo)

3. **Validar Bobina Origem**
   - Scanner QR
   - Validação backend (match esperado vs escaneado)
   - Feedback verde/vermelho

4. **Registrar Corte**
   - Input metragem (com max validation)
   - Upload foto (preview + botão remover)
   - Observações opcionais

5. **QR Corte Gerado**
   - QR Code grande
   - Código em destaque
   - Progresso do item (já cortado / restante)
   - Botões: cortar mais | finalizar item

6. **Finalizar Plano (Locações)**
   - Scanner QR de locações
   - Lista de locações escaneadas
   - Botão confirmar (habilitado após 1+ locação)

7. **Consultar Corte**
   - Scanner QR
   - Detalhes completos (metragem, origem, data)
   - Preview da foto de contraprova
   - Botão imprimir etiqueta

8. **Lista Planos Finalizados**
   - Cards com: cliente, total itens, cortes, locações
   - Click para iniciar carregamento

9. **Validação Carregamento**
   - Scanner QR de cortes
   - Feedback verde (pertence) / vermelho (não pertence)
   - Barra de progresso
   - Lista de validados com ✅
   - Botão finalizar (habilitado quando 100%)

### Estilos CSS Novos
```css
- .info-box (warning, success)
- .success-box (gradiente verde com ícone grande)
- .codigo-display (monospace, grande)
- .qr-display-container
- .foto-preview (com botão remove)
- .locacoes-list / .locacao-item
- .progresso-carregamento / .progresso-bar / .progresso-fill
- .scan-feedback (slideDown animation)
- .cortes-validados-list
```

---

## Páginas de Impressão

### 1. Etiqueta de Corte (`/impressao/etiqueta-corte.html`)
**Formato:** 100mm x 50mm (impressora térmica)  
**Conteúdo:**
- QR Code 30mm x 30mm
- Código do corte (grande, monospace)
- Metragem, produto, origem, data
- Rodapé com logo

**Uso:**
```javascript
// No mobile app.js
window.open(`/impressao/etiqueta-corte.html?codigo=${corteAtual.codigo_corte}`, '_blank');
```

### 2. Etiquetas de Locações em Lote (`/impressao/etiquetas-locacoes.html`)
**Formato:** 100mm x 50mm, múltiplas etiquetas (page-break-after)  
**Features:**
- Filtro por rua/prateleira
- Carrega todas locações ativas via `/api/locacoes`
- Gera QR de cada locação via `/api/qrcodes/locacao/:id`
- Preview em grid
- Impressão em lote

**Acesso:**
```
Desktop → Configurações → Manutenção → 🖨️ Imprimir Etiquetas de Locações
```

---

## Validações e Regras de Negócio

### 1. Validação de Origem
- **Objetivo:** Garantir que operador cortou a bobina correta
- **Implementação:** `controllers/cortesController.js:validarOrigem()`
- **Lógica:**
  ```javascript
  if (qrData === `BOB-${alocacao.origem_id}` && alocacao.origem_tipo === 'bobina') → ✅
  if (qrData === `RET-${alocacao.origem_id}` && alocacao.origem_tipo === 'retalho') → ✅
  else → ❌ "Origem incorreta"
  ```

### 2. Metragem Cortada
- **Max:** metragem_alocada - metragem_cortada (restante)
- **Validação backend:** `cortesController.js:registrarCorte()`
- **Erro se:** `metragem_cortada > restante`

### 3. Status de Alocação
- **pendente:** nenhum corte registrado
- **em_andamento:** 0 < cortado < alocado
- **concluido:** cortado >= alocado
- **Auto-atualizado:** ao criar corte, soma metragem_cortada e recalcula status

### 4. Finalização de Plano
- **Condição:** TODOS os itens com status_corte = 'concluido'
- **Obrigatório:** Pelo menos 1 locação escaneada
- **Ação:** planos_corte.status = 'finalizado', armazenado = true

### 5. Carregamento
- **Condição inicial:** Apenas planos com status = 'finalizado'
- **Validação de scan:** codigo_corte deve estar em cortes_realizados WHERE plano_id = X
- **Finalização:** Todos os cortes do plano devem ser validados

---

## Migrations Executadas

| # | Nome | Descrição |
|---|------|-----------|
| 011 | `add_locacoes_table` | Cria tabela de localizações físicas |
| 012 | `add_cortes_realizados_table` | Tabela de cortes com código único |
| 013 | `add_plano_locacoes_table` | N:N planos ↔ locações |
| 014 | `alter_planos_corte_add_armazenamento` | Campos data_finalizacao, armazenado, locacoes_armazenamento |
| 015 | `alter_alocacoes_corte_add_status` | Campos metragem_cortada, status_corte |
| 016 | `add_carregamentos_table` | Processos de carregamento |
| 017 | `add_carregamentos_itens_table` | Auditoria de cortes validados |
| 018 | `alter_bobinas_retalhos_add_locacao` | FK locacao_id em bobinas e retalhos |
| 019 | `seed_locacoes_iniciais` | 17 locações padrão (A1-B1-C1 até B2-B2-C2) |

**Execução:** Automática via `server.js:runMigrations()` ao iniciar servidor

---

## Dependências Instaladas

```json
{
  "qrcode": "^1.5.3",     // Geração de QR Codes em Base64
  "multer": "^1.4.5",     // Upload de arquivos multipart
  "sharp": "^0.33.0"      // Compressão de imagens
}
```

**Instalação:**
```bash
npm install qrcode multer sharp
```

---

## Estrutura de Arquivos Criados

```
controllers/
  ├─ cortesController.js          (270 linhas)
  ├─ locacoesController.js        (120 linhas)
  └─ qrcodesController.js         (150 linhas)

routes/
  ├─ qrcodes.js                   (30 linhas)
  ├─ locacoes.js                  (25 linhas)
  └─ mobile.js                    (400+ linhas, expandido)

middleware/
  └─ uploadFotos.js               (40 linhas)

public/mobile/
  ├─ index.html                   (600+ linhas, 9 novas telas)
  ├─ app.js                       (1600+ linhas, 500+ novas)
  └─ styles.css                   (1100+ linhas, 300+ novas)

public/impressao/
  ├─ etiqueta-corte.html          (240 linhas)
  └─ etiquetas-locacoes.html      (350 linhas)

migrations/
  ├─ 011_add_locacoes_table.js
  ├─ 012_add_cortes_realizados_table.js
  ├─ 013_add_plano_locacoes_table.js
  ├─ 014_alter_planos_corte_add_armazenamento.js
  ├─ 015_alter_alocacoes_corte_add_status.js
  ├─ 016_add_carregamentos_table.js
  ├─ 017_add_carregamentos_itens_table.js
  ├─ 018_alter_bobinas_retalhos_add_locacao.js
  └─ 019_seed_locacoes_iniciais.js

uploads/
  └─ fotos-medidor/               (pasta para uploads)
```

**Total:** ~5000 linhas de código adicionadas

---

## Testes Recomendados

### Fluxo End-to-End
1. **Criar plano:** Desktop → Ordens → Novo Plano → 2 itens diferentes
2. **Iniciar produção:** Clicar "Iniciar Produção"
3. **Validar origem:** Mobile → Ordens → Selecionar plano → Item 1 → Escanear QR bobina
4. **Registrar corte:** Metragem = 50% do alocado → Foto → Salvar
5. **Repetir:** Outro corte com 50% restante → Finalizar item
6. **Item 2:** Repetir validação + cortes
7. **Finalizar plano:** Escanear 2 locações → Confirmar
8. **Carregamento:** Mobile → Carregamento → Selecionar plano → Escanear todos QRs de cortes
9. **Finalizar:** Verificar status e auditoria

### Validações Negativas
- Escanear QR errado na validação de origem → deve mostrar erro vermelho
- Tentar cortar mais metragem que restante → deve bloquear no backend
- Escanear corte de outro plano no carregamento → deve mostrar vermelho
- Tentar finalizar plano sem locações → botão deve estar desabilitado

### Performance
- Testar upload de foto 5MB → verificar compressão
- Carregar lista de 50+ locações na impressão em lote
- Escanear QR rapidamente (< 1s de resposta)

---

## Troubleshooting

### Erro: "Origin validation failed"
**Causa:** QR escaneado não corresponde à origem esperada  
**Solução:** Verificar se alocação aponta para bobina/retalho correto

### Fotos não aparecem
**Causa:** Caminho `filePath` incorreto ou pasta não existe  
**Solução:** Verificar `uploads/fotos-medidor/` criada e servidor servindo `/uploads`

### QR Code não gera
**Causa:** Biblioteca qrcode não instalada  
**Solução:** `npm install qrcode`

### Migration não roda
**Causa:** Tabela `migrations` não existe  
**Solução:** Executar `npm run migrate` manualmente

---

## Melhorias Futuras

- [ ] Etiquetas com código de barras (além de QR)
- [ ] Exportar relatório de carregamento em PDF
- [ ] Notificação push quando plano finalizado
- [ ] Integração com leitor QR via Bluetooth
- [ ] Dashboard de produtividade (cortes/hora)
- [ ] Histórico de movimentações de planos entre locações
- [ ] API para impressora térmica direta (sem browser)

---

## Referências

- **Biblioteca QR Code:** https://github.com/soldair/node-qrcode
- **Multer Docs:** https://github.com/expressjs/multer
- **Sharp Docs:** https://sharp.pixelplumbing.com/
- **PWA Best Practices:** https://web.dev/pwa-checklist/

---

**Última Atualização:** Janeiro 2025  
**Responsável:** Equipe de Desenvolvimento Controle de Bobinas 2.0
