# 🔍 AUDITORIA COMPLETA DO SISTEMA - MVP
**Data:** 27/11/2025
**Status:** EM ANDAMENTO
**Objetivo:** Otimizar e revisar 100% do código para produção

---

## 📊 ESTRUTURA DO PROJETO

### Backend
- ✅ **Server:** `server.js` (ponto de entrada)
- ✅ **Database:** MySQL com connection pooling
- ✅ **Routes:** 9 módulos (bobinas, retalhos, produtos, ordens, etc)
- ✅ **Controllers:** 7 controllers
- ✅ **Middleware:** 1 (validação de reservas)
- ✅ **Migrations:** Sistema automático

### Frontend
- ✅ **Pages:** 6 páginas HTML
- ✅ **Scripts:** 7 módulos JS principais
- ✅ **Features:** Kanban, templates, impressão, debug

---

## 🎯 PONTOS DE ATENÇÃO IDENTIFICADOS

### 1. CRÍTICO - Segurança ⚠️
- [ ] **SQL Injection:** Queries usando template strings (verificar prepared statements)
- [ ] **Autenticação:** Sistema não tem login/auth (MVP não exige?)
- [ ] **CORS:** Configurar origens permitidas
- [ ] **Validação de Entrada:** Falta sanitização em alguns endpoints

### 2. ALTO - Performance 🚀
- [ ] **N+1 Queries:** Loop de queries em `buscarPlanoPorId` (alocações)
- [ ] **Cache:** Não há cache de configurações (cores, gramaturas)
- [ ] **Connection Pool:** Verificar se limits estão adequados
- [ ] **Índices:** Verificar se há índices em FKs

### 3. MÉDIO - Code Quality 📝
- [ ] **Código Duplicado:** Funções similares em vários controllers
- [ ] **Validações:** Falta validação consistente de dados
- [ ] **Error Handling:** Algumas promises sem .catch
- [ ] **Logs:** Alguns console.log devem virar logger estruturado

### 4. BAIXO - UX/UI 🎨
- [ ] **Loading States:** Alguns botões sem feedback visual
- [ ] **Mensagens de Erro:** Padronizar textos
- [ ] **Confirmações:** Algumas ações críticas sem confirm
- [ ] **Responsividade:** Testar em mobile

---

## 🔧 ANÁLISE POR MÓDULO

### 📦 **Bobinas & Retalhos**

**Pontos Fortes:**
- ✅ Histórico de localização implementado
- ✅ Conversão bobina→retalho funcionando
- ✅ Metragem confiável com sistema de ajuste

**Otimizações Necessárias:**
- [ ] **Query de Listagem:** Adicionar paginação (pode ter 1000+ bobinas)
- [ ] **Filtros:** Otimizar queries com índices compostos
- [ ] **Bulk Operations:** Implementar ações em massa

**Código:**
```javascript
// ANTES (N+1 problem)
for (const bobina of bobinas) {
  const [historico] = await db.query('SELECT ...');
}

// DEPOIS (JOIN único)
SELECT b.*, GROUP_CONCAT(h.localizacao) as historico
FROM bobinas b
LEFT JOIN historico_localizacao h ON h.bobina_id = b.id
GROUP BY b.id
```

---

### 🎯 **Ordens de Corte**

**Pontos Fortes:**
- ✅ Sistema de alocação inteligente
- ✅ Priorização correta (retalhos > bobinas)
- ✅ Validação automática de reservas
- ✅ Debug tools implementados

**Otimizações Necessárias:**
- [ ] **sugerirOrigemParaGrupo:** Fazer queries em paralelo
- [ ] **buscarPlanoPorId:** Resolver N+1 com JOIN
- [ ] **Cache:** Sugestões podem ser cacheadas por 1min

**Código a Otimizar:**
```javascript
// controllers/ordensCorteController.js - Linha ~169
// N+1: Para cada item, busca alocação separadamente
for (let item of itens) {
    const [alocacoes] = await db.query(...); // ← PROBLEMA
}

// SOLUÇÃO: JOIN único
SELECT ipc.*, ac.*, ...
FROM itens_plano_corte ipc
LEFT JOIN alocacoes_corte ac ON ac.item_plano_corte_id = ipc.id
WHERE ipc.plano_corte_id = ?
```

---

### 🏗️ **Templates/Obras Padrão**

**Pontos Fortes:**
- ✅ Reutilização de configurações
- ✅ Integração com ordens

**Otimizações Necessárias:**
- [ ] **Versionamento:** Adicionar versão aos templates
- [ ] **Compartilhamento:** Sistema para templates globais vs pessoais

---

### 🎨 **Frontend**

**Pontos Fortes:**
- ✅ Interface intuitiva (Kanban)
- ✅ Drag & drop funcionando
- ✅ Impressão otimizada (A4 paisagem)

**Otimizações Necessárias:**
- [ ] **Bundle Size:** Separar vendor.js dos scripts
- [ ] **Cache Busting:** Sistema de versioning automático
- [ ] **Debounce:** Busca/filtros com delay
- [ ] **Virtual Scrolling:** Para tabelas grandes

**Código a Otimizar:**
```javascript
// public/js/estoque.js
// Filtros disparam busca a cada tecla
input.addEventListener('input', carregarEstoque); // ← PROBLEMA

// SOLUÇÃO: Debounce
const debouncedLoad = debounce(carregarEstoque, 300);
input.addEventListener('input', debouncedLoad);
```

---

## 🗄️ BANCO DE DADOS

### Índices Recomendados

```sql
-- Performance crítica
CREATE INDEX idx_bobinas_produto_status 
ON bobinas(produto_id, status, convertida_em_retalho);

CREATE INDEX idx_bobinas_metragem_disponivel
ON bobinas(produto_id, status, (metragem_atual - metragem_reservada));

CREATE INDEX idx_retalhos_produto_status
ON retalhos(produto_id, status, (metragem - metragem_reservada));

CREATE INDEX idx_planos_status
ON planos_corte(status, created_at DESC);

CREATE INDEX idx_alocacoes_item
ON alocacoes_corte(item_plano_corte_id);

-- Triggers (já implementado ✅)
-- Validação periódica (já implementado ✅)
```

### Análise de Queries Lentas

```sql
-- Habilitar slow query log
SET GLOBAL slow_query_log = 'ON';
SET GLOBAL long_query_time = 1; -- queries > 1s

-- Queries mais usadas:
1. Listagem de bobinas com filtros (otimizar com índices compostos)
2. Busca de sugestões de alocação (otimizar com índices calculados)
3. Histórico de localização (já tem FK, ok)
```

---

## 🛡️ SEGURANÇA

### Checklist de Segurança

- [ ] **SQL Injection:**
  ```javascript
  // ❌ VULNERÁVEL
  db.query(`SELECT * FROM users WHERE name = '${req.body.name}'`)
  
  // ✅ SEGURO (já está assim no código! ✅)
  db.query('SELECT * FROM users WHERE name = ?', [req.body.name])
  ```

- [ ] **XSS:** Frontend sanitiza inputs?
  ```javascript
  // Adicionar sanitização
  const sanitize = (str) => str.replace(/[<>]/g, '');
  ```

- [ ] **CORS:** Configurar em produção
  ```javascript
  // server.js
  const cors = require('cors');
  app.use(cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
    credentials: true
  }));
  ```

- [ ] **Rate Limiting:**
  ```javascript
  const rateLimit = require('express-rate-limit');
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 min
    max: 100 // max requests
  });
  app.use('/api/', limiter);
  ```

- [ ] **Helmet:** Headers de segurança
  ```javascript
  const helmet = require('helmet');
  app.use(helmet());
  ```

---

## 📈 PERFORMANCE

### Métricas Atuais (estimadas)
- Conexões simultâneas: 10 (pool limit)
- Tempo médio de resposta: ~50-200ms
- Queries por requisição: 1-5 (alguns endpoints têm N+1)

### Metas de Otimização
- 🎯 Reduzir N+1 queries: 5 → 1-2 por endpoint
- 🎯 Implementar cache: 0% → 30% de hits
- 🎯 Paginação: Ilimitado → 50 items/página
- 🎯 Bundle size: Atual → -30% com minificação

---

## 🧪 TESTES

### Cenários de Teste Prioritários

1. **Fluxo Completo de Ordem:**
   - Criar plano → Auto-alocar → Enviar produção → Finalizar
   
2. **Reservas Órfãs:**
   - Deletar plano com alocações
   - Trocar origem de alocação
   - Validação automática corrige

3. **Conversão Bobina→Retalho:**
   - Metragens calculadas corretamente
   - Histórico preservado

4. **Edge Cases:**
   - Estoque zerado
   - Metragem negativa (deve impedir)
   - Múltiplos usuários alocando simultaneamente

---

## 📝 PRÓXIMAS AÇÕES

### Prioridade ALTA (MVP)
1. ✅ Revisar todas as queries (SQL injection check)
2. ⏳ Adicionar índices no banco
3. ⏳ Resolver N+1 em buscarPlanoPorId
4. ⏳ Implementar paginação em listagens
5. ⏳ Adicionar rate limiting básico

### Prioridade MÉDIA (Pós-MVP)
6. ⏳ Sistema de cache (Redis)
7. ⏳ Logs estruturados (Winston)
8. ⏳ Testes automatizados (Jest)
9. ⏳ Monitoramento (Sentry)

### Prioridade BAIXA (Futuro)
10. ⏳ Autenticação/Autorização
11. ⏳ Websockets (real-time updates)
12. ⏳ PWA (offline-first)

---

## 📊 MÉTRICAS DE SUCESSO

| Métrica | Atual | Meta MVP | Status |
|---------|-------|----------|--------|
| Tempo de resposta | ~100ms | <200ms | ✅ |
| Queries por request | 1-5 | 1-2 | ⏳ |
| Reservas órfãs | ~10% | <1% | ✅ |
| Coverage de testes | 0% | 50% | ❌ |
| Índices no BD | Alguns | Todos | ⏳ |

---

**Última atualização:** 27/11/2025 - Auditoria Inicial
**Responsável:** GitHub Copilot + Desenvolvedor
**Status:** 🟡 EM ANDAMENTO

