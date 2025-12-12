# Guia de Testes - Mobile v2.0

> **Documento de testes para validação completa dos 3 módulos**  
> Data: 12/12/2025 | Versão: 2.0.0

---

## 📋 Índice

1. [Preparação do Ambiente](#preparação-do-ambiente)
2. [Testes de API (Backend)](#testes-de-api-backend)
3. [Testes de Frontend (Navegador)](#testes-de-frontend-navegador)
4. [Módulo CONSULTAS](#módulo-consultas)
5. [Módulo PDC](#módulo-pdc)
6. [Módulo CARREGAMENTO](#módulo-carregamento)
7. [Testes de Integração](#testes-de-integração)
8. [Checklist Final](#checklist-final)

---

## Preparação do Ambiente

### 1. Servidor Local

```bash
# Iniciar servidor
cd "c:\controle bobinas 2.0"
npm run dev

# Servidor deve subir em: http://localhost:3000
```

### 2. Banco de Dados

Verifique se há dados de teste:

```sql
-- Produtos
SELECT COUNT(*) FROM produtos;

-- Bobinas disponíveis
SELECT COUNT(*) FROM bobinas WHERE status = 'Disponível';

-- Retalhos disponíveis
SELECT COUNT(*) FROM retalhos WHERE status = 'Disponível';

-- PDCs em produção
SELECT COUNT(*) FROM planos_corte WHERE status = 'em_producao';

-- PDCs finalizados
SELECT COUNT(*) FROM planos_corte WHERE status = 'finalizado';

-- Cortes realizados
SELECT COUNT(*) FROM cortes_realizados;

-- Locações
SELECT COUNT(*) FROM locacoes;
```

### 3. Dados de Teste Necessários

**Criar se não existir:**

```sql
-- Pelo menos 1 bobina
INSERT INTO bobinas (codigo_bobina, produto_id, metragem_atual, locacao, loja, status)
VALUES ('BOB-PLA-000001', 1, 150.00, '0001-A-0001', 'PLA', 'Disponível');

-- Pelo menos 1 retalho
INSERT INTO retalhos (codigo_retalho, produto_id, metragem, locacao, loja, status)
VALUES ('RET-PLA-000001', 1, 50.00, '0001-B-0001', 'PLA', 'Disponível');

-- Pelo menos 1 PDC em produção
INSERT INTO planos_corte (codigo_plano, cliente, aviario, status, loja)
VALUES ('PDC-PLA-001', 'Cliente Teste', 'Aviário 1', 'em_producao', 'PLA');

-- Pelo menos 1 PDC finalizado
INSERT INTO planos_corte (codigo_plano, cliente, aviario, status, data_finalizacao, loja)
VALUES ('PDC-PLA-002', 'Cliente Teste 2', 'Aviário 2', 'finalizado', NOW(), 'PLA');
```

---

## Testes de API (Backend)

### Ferramenta Recomendada

- **Postman** ou **Insomnia**
- **Base URL:** `http://localhost:3000/api`
- **Headers:** `Content-Type: application/json`

### 1. Health Check

```http
GET /api/health

✅ Resposta esperada:
{
  "status": "ok",
  "database": "connected",
  "version": "2.4.0"
}
```

### 2. Validar Código

```http
GET /api/mobile/validar-codigo/BOB-PLA-000001

✅ Resposta esperada:
{
  "success": true,
  "data": {
    "tipo": "bobina",
    "id": 1,
    "codigo": "BOB-PLA-000001",
    "metragem_atual": 150.00,
    "status": "Disponível"
  }
}
```

**Testar também:**
- `RET-PLA-000001` (retalho)
- `PDC-PLA-001` (plano de corte)
- `LOC-1` (locação)
- `CODIGO-INVALIDO` (deve retornar success: false)

### 3. PDCs em Produção

```http
GET /api/mobile/pdcs/producao

✅ Resposta esperada:
{
  "success": true,
  "data": [
    {
      "id": 1,
      "codigo_plano": "PDC-PLA-001",
      "cliente": "Cliente Teste",
      "aviario": "Aviário 1",
      "status": "em_producao",
      "total_cortes": 10,
      "cortes_concluidos": 5,
      "progresso": 50
    }
  ]
}
```

### 4. Origens do PDC

```http
GET /api/mobile/pdcs/1/origens

✅ Resposta esperada:
{
  "success": true,
  "pdc": { ... },
  "origens": [
    {
      "tipo": "bobina",
      "id": 1,
      "codigo": "BOB-PLA-000001",
      "locacao": "0001-A-0001",
      "produto": "Lona 220g Verde",
      "cortes": [...]
    }
  ]
}
```

### 5. Validar Origem

```http
POST /api/mobile/pdcs/validar-origem
Content-Type: application/json

{
  "pdc_id": 1,
  "origem_esperada_id": 1,
  "origem_esperada_tipo": "bobina",
  "codigo_escaneado": "BOB-PLA-000001"
}

✅ Resposta esperada:
{
  "success": true,
  "valido": true,
  "origem": { ... }
}
```

### 6. Carregamentos Disponíveis

```http
GET /api/mobile/carregamento/disponiveis

✅ Resposta esperada:
{
  "success": true,
  "data": [
    {
      "id": 2,
      "codigo_plano": "PDC-PLA-002",
      "cliente": "Cliente Teste 2",
      "status": "finalizado",
      "total_cortes": 15,
      "locacoes": ["0001-C-0001", "0001-C-0002"]
    }
  ]
}
```

### 7. Validar Corte em Carregamento

```http
POST /api/mobile/carregamento/validar-corte
Content-Type: application/json

{
  "carregamento_id": 1,
  "codigo_corte": "COR-2025-00001"
}

✅ Resposta esperada (sucesso):
{
  "success": true,
  "valido": true,
  "corte": { ... },
  "progresso": {
    "validados": 1,
    "total": 15,
    "percentual": 6.67
  }
}

❌ Resposta esperada (corte de outro PDC):
{
  "success": true,
  "valido": false,
  "erro": "Corte pertence a outro PDC",
  "corte": {
    "codigo_corte": "COR-2025-00001",
    "pdc_correto": "PDC-PLA-003",
    "cliente": "Outro Cliente"
  }
}
```

---

## Testes de Frontend (Navegador)

### Acessar Mobile

```
http://localhost:3000/mobile/index.html
```

### Ferramentas do Navegador

**Chrome DevTools (F12):**
1. Device Mode (Ctrl+Shift+M) → Selecionar "iPhone 12 Pro" ou similar
2. Console → Ver logs de debug
3. Network → Monitorar requisições

### Simular Scanner

Como não há câmera no navegador, simule códigos:

```javascript
// No console do DevTools

// Simular scan de bobina
consultas.processarCodigo('BOB-PLA-000001');

// Simular scan de retalho
consultas.processarCodigo('RET-PLA-000001');

// Simular scan de corte
carregamento.processarScan('COR-2025-00001');
```

---

## Módulo CONSULTAS

### Tela Inicial

**URL:** `http://localhost:3000/mobile/consultas.html`

**Checklist:**
- [ ] Header "🔍 CONSULTAS" visível
- [ ] Botão "Voltar" funciona (redireciona para index.html)
- [ ] Botão "INICIAR SCANNER" visível
- [ ] Input manual "Código do Item" visível
- [ ] Botão "BUSCAR" visível

---

### Teste 1: Consulta Manual de Bobina

**Passos:**
1. Digite no input: `BOB-PLA-000001`
2. Clique em "BUSCAR"

**Resultado Esperado:**
- ✅ Loading aparece
- ✅ Seção de detalhes aparece
- ✅ Header mostra: "BOBINA BOB-PLA-000001"
- ✅ Card de informações exibe:
  - Código da bobina
  - Produto (com cor/gramatura)
  - Fabricante
  - Metragem atual com barra de progresso
  - Locação atual
  - Status (badge colorido)
- ✅ Botões "Imprimir Etiqueta" e "Ver Histórico" visíveis
- ✅ Botão "Nova Consulta" visível

**Console (F12):**
```
✅ Código válido: BOB-PLA-000001
✅ Tipo detectado: bobina
✅ Buscar bobina: BOB-PLA-000001
```

---

### Teste 2: Consulta de Retalho

**Passos:**
1. Voltar para scanner (botão "Nova Consulta")
2. Digite: `RET-PLA-000001`
3. Clique em "BUSCAR"

**Resultado Esperado:**
- ✅ Header mostra: "RETALHO RET-PLA-000001"
- ✅ Exibe informações:
  - Código do retalho
  - Produto original
  - Metragem
  - Origem (bobina ou outro retalho)
  - Locação
  - Status

---

### Teste 3: Consulta de Corte

**Passos:**
1. Nova consulta
2. Digite: `COR-2025-00001` (se existir)
3. Buscar

**Resultado Esperado:**
- ✅ Header: "CORTE COR-2025-00001"
- ✅ Exibe:
  - Código do corte
  - PDC associado
  - Cliente
  - Metragem cortada
  - Origem (bobina/retalho)
  - Data/hora do corte
  - **Foto do medidor** (se tiver)

---

### Teste 4: Consulta de Locação

**Passos:**
1. Nova consulta
2. Digite: `LOC-1`
3. Buscar

**Resultado Esperado:**
- ✅ Header: "LOCAÇÃO LOC-1"
- ✅ Exibe:
  - Código da locação
  - Setor (ex: 0001-A-0001)
  - **Lista de itens armazenados** (bobinas/retalhos)
  - Total de itens

---

### Teste 5: Código Inválido

**Passos:**
1. Nova consulta
2. Digite: `INVALIDO-123`
3. Buscar

**Resultado Esperado:**
- ❌ Toast de erro: "Código não encontrado"
- ✅ Permanece na tela de scanner

---

### Teste 6: Imprimir Etiqueta

**Passos:**
1. Consultar uma bobina
2. Clicar em "Imprimir Etiqueta"

**Resultado Esperado:**
- ✅ Toast: "Impressão solicitada" (atualmente placeholder)
- ⚠️ **TODO:** Integrar com sistema de impressão

---

### Teste 7: Ver Histórico

**Passos:**
1. Consultar uma bobina
2. Clicar em "Ver Histórico"

**Resultado Esperado:**
- ✅ Toast: "Em desenvolvimento" (placeholder)
- ⚠️ **TODO:** Implementar tela de histórico

---

## Módulo PDC

### Tela Inicial

**URL:** `http://localhost:3000/mobile/pdc.html`

**Checklist:**
- [ ] Header "🏭 PDC" visível
- [ ] Botão "Voltar" funciona
- [ ] Botão refresh funciona
- [ ] Lista de PDCs em produção carregada

---

### Teste 8: Listar PDCs em Produção

**Resultado Esperado:**
- ✅ Carrega automaticamente ao abrir página
- ✅ Exibe lista de PDCs com:
  - Código do plano (ex: PDC-PLA-001)
  - Cliente
  - Aviário
  - Barra de progresso (% de cortes concluídos)
  - Badge com total de cortes
- ✅ Se não houver PDCs: mensagem "Nenhum PDC em produção"

---

### Teste 9: Abrir PDC e Ver Origens

**Passos:**
1. Clicar em um PDC da lista

**Resultado Esperado:**
- ✅ Transição para tela de origens
- ✅ Header mostra código do PDC
- ✅ Breadcrumb: PDC > Origens
- ✅ Lista de origens agrupadas:
  - Ícone (bobina 🎯 ou retalho ✂️)
  - Código (BOB-XXX ou RET-XXX)
  - Produto
  - Locação
  - Progresso (X/Y cortes)
- ✅ Botão "Voltar" retorna à lista de PDCs

---

### Teste 10: Validar Origem com Scanner

**Passos:**
1. Abrir um PDC
2. Clicar em uma origem (ex: BOB-PLA-000001)
3. Clicar em "VALIDAR ORIGEM"
4. **Simular scan no console:**
   ```javascript
   pdc.processarScan('BOB-PLA-000001');
   ```

**Resultado Esperado:**
- ✅ Scanner "abre" (no app real seria câmera)
- ✅ Código validado com sucesso
- ✅ Feedback: vibração + beep + toast verde
- ✅ Transição para lista de cortes
- ✅ Botão de validação desaparece (origem validada)

---

### Teste 11: Validar Origem ERRADA

**Passos:**
1. Mesma situação do teste anterior
2. Simular scan de código diferente:
   ```javascript
   pdc.processarScan('BOB-PLA-999999');
   ```

**Resultado Esperado:**
- ❌ Toast de erro: "Origem incorreta! Esperado: BOB-PLA-000001"
- ❌ Feedback de erro (vibração longa)
- ✅ Permanece na tela aguardando código correto

---

### Teste 12: Iniciar Corte

**Passos:**
1. Após validar origem
2. Clicar em um corte da lista (botão "CORTAR")

**Resultado Esperado:**
- ✅ Transição para tela de corte
- ✅ Exibe:
  - Origem (código + locação)
  - Metragem a cortar
  - Cliente/aviário
- ✅ Seção "📷 Foto do Medidor" visível
- ✅ Botão "TIRAR FOTO" visível
- ✅ Botão "CONFIRMAR CORTE" desabilitado (ainda sem foto)

---

### Teste 13: Tirar Foto (Simulado)

**Passos:**
1. Na tela de corte
2. Clicar em "TIRAR FOTO"

**Resultado Esperado (navegador):**
- ⚠️ Erro: "Camera plugin não disponível no navegador"
- ✅ Para testar, simule foto no console:
   ```javascript
   pdc.camera.ultimaFoto = {
     base64: 'data:image/jpeg;base64,/9j/4AAQSkZJRg...',
     format: 'jpeg',
     dataUrl: 'data:image/jpeg;base64,...',
     timestamp: Date.now()
   };
   pdc.renderCorteForm();
   ```

**Resultado Esperado (APK real):**
- ✅ Câmera nativa abre
- ✅ Captura foto do medidor
- ✅ Preview da foto aparece na tela
- ✅ Botão "CONFIRMAR CORTE" fica habilitado

---

### Teste 14: Confirmar Corte (sem foto)

**Passos:**
1. Tentar clicar em "CONFIRMAR CORTE" sem foto

**Resultado Esperado:**
- ❌ Toast de aviso: "Tire a foto do medidor antes de confirmar"
- ✅ Botão permanece desabilitado

---

### Teste 15: Confirmar Corte (com foto)

**Passos:**
1. Após simular foto (teste 13)
2. Clicar em "CONFIRMAR CORTE"

**Resultado Esperado:**
- ✅ Loading: "Registrando corte..."
- ✅ Upload da foto (FormData multipart)
- ✅ Sucesso: tela de confirmação com código gerado
  - "✅ Corte Registrado!"
  - Código: COR-2025-00123
  - Metragem cortada
  - Foto exibida
- ✅ Botão "IMPRIMIR ETIQUETA" visível
- ✅ Botão "PRÓXIMO CORTE" visível

**Console Network (F12 → Network):**
- ✅ Request POST para `/api/mobile/registrar-corte`
- ✅ Content-Type: multipart/form-data
- ✅ Response 200 com { success: true, corte: {...} }

---

### Teste 16: Atualizar Locação da Origem

**Passos:**
1. Após finalizar todos cortes de uma origem
2. Clicar em "ATUALIZAR LOCAÇÃO"
3. Simular scan:
   ```javascript
   pdc.processarScan('LOC-5');
   ```

**Resultado Esperado:**
- ✅ Scanner abre
- ✅ Valida código LOC-XXX
- ✅ Atualiza locação da bobina/retalho
- ✅ Toast: "Locação atualizada: LOC-5"
- ✅ Volta para lista de origens

---

### Teste 17: Finalizar PDC

**Passos:**
1. Finalizar todos cortes de todas origens
2. Botão "FINALIZAR PDC" aparece na tela de origens
3. Clicar em "FINALIZAR PDC"

**Resultado Esperado:**
- ✅ Transição para tela de finalização
- ✅ Lista vazia de locações
- ✅ Instruções: "Escaneie as locações onde os cortes estão armazenados"
- ✅ Botão "ESCANEAR LOCAÇÃO"

---

### Teste 18: Escanear Locações de Armazenamento

**Passos:**
1. Na tela de finalização
2. Clicar em "ESCANEAR LOCAÇÃO"
3. Simular múltiplos scans:
   ```javascript
   pdc.processarScan('LOC-10');
   pdc.processarScan('LOC-11');
   pdc.processarScan('LOC-12');
   ```

**Resultado Esperado:**
- ✅ Cada scan adiciona locação à lista
- ✅ Badges aparecem na tela
- ✅ Botão "X" para remover locação
- ✅ Botão "FINALIZAR PDC" fica habilitado após 1+ locações

---

### Teste 19: Confirmar Finalização do PDC

**Passos:**
1. Após escanear locações
2. Clicar em "FINALIZAR PDC"

**Resultado Esperado:**
- ✅ Loading: "Finalizando PDC..."
- ✅ Request POST para `/api/mobile/pdcs/1/finalizar`
- ✅ Sucesso: tela de conclusão
  - "✅ PDC Finalizado!"
  - Código do PDC
  - Total de cortes
  - Locações registradas
- ✅ Botão "NOVO PDC" volta para lista

---

## Módulo CARREGAMENTO

### Tela Inicial

**URL:** `http://localhost:3000/mobile/carregamento.html`

**Checklist:**
- [ ] Header "📦 CARREGAMENTO" visível
- [ ] Botão "Voltar" funciona
- [ ] Botão refresh funciona
- [ ] Lista de PDCs finalizados carregada
- [ ] Botão "Ver Carregamentos Anteriores" visível

---

### Teste 20: Listar PDCs Finalizados

**Resultado Esperado:**
- ✅ Lista PDCs com status='finalizado'
- ✅ Exibe:
  - Código do plano
  - Cliente + aviário
  - Badge com total de cortes
  - Locações dos cortes (badges azuis)
  - Data de finalização
- ✅ Se não houver: mensagem "Nenhum PDC disponível"

---

### Teste 21: Iniciar Carregamento

**Passos:**
1. Clicar em um PDC da lista

**Resultado Esperado:**
- ✅ Loading: "Iniciando carregamento..."
- ✅ Request POST para `/api/mobile/carregamento/iniciar`
- ✅ Transição para tela de validação
- ✅ Exibe:
  - Código PDC
  - Cliente
  - Locações (alert info com badges)
  - Barra de progresso (0/X cortes validados - 0%)
- ✅ Botão "INICIAR SCANNER" visível
- ✅ Seção "Últimos Validados" vazia

---

### Teste 22: Validar Corte Correto

**Passos:**
1. Na tela de validação
2. Clicar em "INICIAR SCANNER"
3. Simular scan de corte pertencente ao PDC:
   ```javascript
   carregamento.processarScan('COR-2025-00001');
   ```

**Resultado Esperado:**
- ✅ Loading: "Validando corte..."
- ✅ Request POST para `/api/mobile/carregamento/validar-corte`
- ✅ Sucesso: feedback positivo
  - Vibração + beep
  - Toast verde: "✅ COR-2025-00001 - 25,50m"
- ✅ Progresso atualiza: "1/15 cortes validados - 6%"
- ✅ Barra de progresso: 6%
- ✅ Corte aparece em "Últimos Validados" (alert verde)

---

### Teste 23: Validar Corte ERRADO (outro PDC)

**Passos:**
1. Simular scan de corte de outro PDC:
   ```javascript
   carregamento.processarScan('COR-2025-99999');
   ```

**Resultado Esperado:**
- ❌ Erro: feedback negativo (vibração longa)
- ❌ Toast vermelho:
   ```
   ❌ ERRO: Corte pertence a outro PDC!
   
   PDC Correto: PDC-PLA-003
   Cliente: Outro Cliente
   ```
- ✅ Progresso NÃO atualiza
- ✅ Corte NÃO aparece na lista

---

### Teste 24: Validar Corte Duplicado

**Passos:**
1. Escanear mesmo corte novamente:
   ```javascript
   carregamento.processarScan('COR-2025-00001');
   ```

**Resultado Esperado:**
- ❌ Toast de erro: "Este corte já foi validado"
- ✅ Progresso NÃO muda

---

### Teste 25: Completar Validação (100%)

**Passos:**
1. Validar todos os cortes do PDC
2. Progresso chega a 15/15 - 100%

**Resultado Esperado:**
- ✅ Barra de progresso: 100% (verde)
- ✅ Alert verde aparece: "Todos cortes validados!"
- ✅ Botão "FINALIZAR CARREGAMENTO" aparece (grande, verde)

---

### Teste 26: Tentar Finalizar Antes de 100%

**Passos:**
1. Com progresso < 100%, tentar finalizar (se botão estiver visível)

**Resultado Esperado:**
- ❌ Toast: "Faltam X cortes para validar"
- ✅ Não finaliza

---

### Teste 27: Finalizar Carregamento

**Passos:**
1. Com 100% validado
2. Clicar em "FINALIZAR CARREGAMENTO"

**Resultado Esperado:**
- ✅ Loading: "Finalizando carregamento..."
- ✅ Request POST para `/api/mobile/carregamento/1/finalizar`
- ✅ Sucesso: tela de conclusão
  - Ícone grande verde ✅
  - "Carregamento Concluído!"
  - Código PDC + cliente
  - "15 cortes validados"
  - Alert info: "Todos cortes validados e registrados"
- ✅ Botão "NOVO CARREGAMENTO"

---

### Teste 28: Ver Histórico de Carregamentos

**Passos:**
1. Na tela inicial, clicar em "Ver Carregamentos Anteriores"

**Resultado Esperado:**
- ✅ Transição para tela de histórico
- ✅ Lista carregamentos concluídos:
  - Código do carregamento
  - PDC + cliente
  - Data/hora de conclusão
  - Badge com total de cortes
- ✅ Se não houver: "Nenhum carregamento realizado"

---

## Testes de Integração

### Fluxo Completo: PDC → Cortes → Carregamento

**Cenário:** Ciclo completo de produção

**Passos:**
1. **PDC:** Criar novo PDC em produção
2. **PDC:** Adicionar itens ao plano
3. **PDC:** Alocar origens (bobinas/retalhos)
4. **Mobile PDC:** Abrir PDC
5. **Mobile PDC:** Validar origem
6. **Mobile PDC:** Realizar todos cortes com fotos
7. **Mobile PDC:** Atualizar locações
8. **Mobile PDC:** Finalizar PDC com locações de armazenamento
9. **Mobile Carregamento:** Abrir PDC finalizado
10. **Mobile Carregamento:** Validar todos cortes
11. **Mobile Carregamento:** Finalizar carregamento

**Resultado Esperado:**
- ✅ Todos passos executam sem erros
- ✅ Dados persistem no banco
- ✅ Status atualizam corretamente
- ✅ Fotos salvas em `uploads/cortes/`
- ✅ Códigos gerados sequencialmente
- ✅ Progresso calculado corretamente

---

### Teste de Validações Cruzadas

**Cenário:** Evitar erros de operação

**Casos:**
1. ✅ Não permitir cortar sem validar origem
2. ✅ Não permitir confirmar corte sem foto
3. ✅ Não permitir validar corte de outro PDC em carregamento
4. ✅ Não permitir finalizar PDC sem escanear locações
5. ✅ Não permitir finalizar carregamento antes de 100%

---

## Checklist Final

### Funcionalidades Básicas

- [ ] **CONSULTAS**
  - [ ] Scanner de códigos (simulado)
  - [ ] Busca manual
  - [ ] Detalhes de bobina
  - [ ] Detalhes de retalho
  - [ ] Detalhes de corte
  - [ ] Detalhes de locação
  - [ ] Tratamento de erros

- [ ] **PDC**
  - [ ] Listar PDCs em produção
  - [ ] Abrir PDC e ver origens
  - [ ] Validar origem via scanner
  - [ ] Listar cortes pendentes
  - [ ] Tirar foto do medidor (no APK)
  - [ ] Confirmar corte com upload
  - [ ] Atualizar locação da origem
  - [ ] Escanear locações de armazenamento
  - [ ] Finalizar PDC

- [ ] **CARREGAMENTO**
  - [ ] Listar PDCs finalizados
  - [ ] Iniciar carregamento
  - [ ] Validar cortes via scanner
  - [ ] Progresso em tempo real
  - [ ] Detectar cortes de outros PDCs
  - [ ] Detectar duplicados
  - [ ] Finalizar carregamento
  - [ ] Ver histórico

### Performance

- [ ] Loading states em todas requisições
- [ ] Feedback visual imediato (< 100ms)
- [ ] Requisições HTTP < 2s
- [ ] Animações suaves
- [ ] Sem travamentos na UI

### UX/UI

- [ ] Navegação intuitiva
- [ ] Botões "Voltar" funcionam
- [ ] Toasts aparecem e desaparecem
- [ ] Progress bars animadas
- [ ] Badges coloridas por status
- [ ] Ícones corretos (Bootstrap Icons)
- [ ] Responsivo (testes em vários tamanhos)

### Segurança

- [ ] Input validado antes de enviar
- [ ] Códigos inválidos rejeitados
- [ ] Erros de API tratados
- [ ] Timeout em requisições longas

---

## Logs de Debug

### Ativar Debug Mode

```javascript
// public/mobile/js/config.js
const CONFIG = {
  // ...
  DEBUG: true  // ← Alterar para true
};
```

### Logs Esperados no Console

**CONSULTAS:**
```
Iniciando módulo CONSULTAS
✅ Código válido: BOB-PLA-000001
✅ Tipo detectado: bobina
✅ Buscar bobina: BOB-PLA-000001
```

**PDC:**
```
Iniciando módulo PDC
Carregando lista de PDCs...
✅ PDCs carregados: 3
Abrindo PDC: 1
✅ Origens carregadas: 2
Validando origem: BOB-PLA-000001
✅ Origem validada
```

**CARREGAMENTO:**
```
Iniciando módulo CARREGAMENTO
Carregando PDCs disponíveis...
✅ PDCs finalizados: 2
Iniciando carregamento do PDC: 2
Validando corte: COR-2025-00001
✅ Corte validado: progresso 6.67%
```

---

## Próximos Passos Após Testes

### Se tudo passar ✅
→ **Prosseguir para Build APK**

### Se encontrar bugs 🐛
1. Documentar erro no console
2. Registrar endpoint/módulo afetado
3. Criar issue ou fix imediato
4. Re-testar após correção

---

## Notas Importantes

⚠️ **Scanner no Navegador**
- Scanner real só funciona no APK com ML Kit
- Use simulações no console para testes desktop

⚠️ **Camera no Navegador**
- Camera plugin não disponível no navegador
- Simule fotos no console para testes

⚠️ **Impressão**
- Endpoints de impressão são placeholders
- Integração com sistema de impressão pendente

⚠️ **Histórico**
- Endpoint de histórico é placeholder
- Implementação futura

---

**Documento criado em:** 12/12/2025  
**Autor:** Sistema de Testes Mobile v2.0  
**Versão:** 1.0.0
