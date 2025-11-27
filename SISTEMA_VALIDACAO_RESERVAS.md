# Sistema Automático de Prevenção de Reservas Órfãs

## 📋 Visão Geral

Este documento descreve o sistema multi-camadas implementado para prevenir e corrigir automaticamente o problema de **metragens reservadas órfãs** - situações onde bobinas/retalhos aparecem como reservados mesmo sem planos de corte ativos.

## 🔍 Problema Identificado

**Sintomas:**
- Metragens aparecem como reservadas mesmo sem planos em produção
- Auto-alocação não encontra estoque disponível
- Bobinas/retalhos ficam "travados" indevidamente

**Causas Raízes:**

1. **excluirPlano()** - Deletava alocações sem liberar as reservas
2. **alocarOrigem()** - Trocava fonte sem liberar a antiga
3. **Acúmulo histórico** - Reservas órfãs acumuladas ao longo do tempo

## 🛡️ Solução Implementada

### Camada 1: Prevenção no Banco de Dados (Triggers)

**Arquivo:** `database/migrations/add_triggers_reservas.sql`

**Triggers criados:**

#### `after_alocacao_delete`
```sql
-- Automaticamente libera reserva quando alocação é excluída
-- Apenas se o plano estava em produção
```

#### `after_alocacao_update`
```sql
-- Detecta troca de fonte (bobina/retalho)
-- Libera reserva da fonte antiga
-- Aplica reserva na fonte nova
-- Apenas para planos em produção
```

**Ativação:**
- Migration automática ao iniciar o servidor
- Arquivo: `database/migrations/006_add_triggers_reservas.js`

### Camada 2: Correção no Backend (Controllers)

**Arquivo:** `controllers/ordensCorteController.js`

**Funções corrigidas:**

#### `excluirPlano()` (linhas ~887-937)
```javascript
// ANTES: DELETE direto
// DEPOIS: 
// 1. Busca todas as alocações
// 2. Libera metragem_reservada de cada fonte
// 3. Então executa DELETE
```

#### `alocarOrigem()` (linhas ~408-540)
```javascript
// ANTES: UPDATE direto
// DEPOIS:
// 1. Verifica se plano está em_producao
// 2. Se trocando fonte: libera antiga, reserva nova
// 3. Usa GREATEST(0, X) para evitar negativos
```

#### `limparReservasOrfas()` (linhas ~1217-1265) - NOVA
```javascript
// Função de emergência/manutenção
// 1. Reset: metragem_reservada = 0 em tudo
// 2. Busca alocações ativas (status = em_producao)
// 3. Recalcula e aplica apenas reservas válidas
// 4. Retorna estatísticas
```

### Camada 3: Validação Automática (Middleware)

**Arquivo:** `middleware/validarReservas.js`

**Funcionalidades:**

#### `validarECorrigirReservas()`
- Executa algoritmo de validação completo
- Compara reservas atuais vs. esperadas
- Corrige inconsistências automaticamente
- Retorna estatísticas detalhadas

#### `iniciarValidacaoPeriodica()`
- Aguarda 5s após servidor iniciar (garante BD pronto)
- Executa primeira validação
- Agenda validações periódicas a cada **1 hora**
- Logs no console com resultados

**Integração:**
```javascript
// server.js
const { iniciarValidacaoPeriodica } = require('./middleware/validarReservas');

app.listen(PORT, () => {
    iniciarValidacaoPeriodica(); // ← Ativa sistema automático
});
```

### Camada 4: Interface de Manutenção (UI)

**Arquivos:** 
- `public/configuracoes.html`
- `public/js/configuracoes.js`

**Funcionalidades:**

- Tab **🔧 Manutenção** na página de Configurações
- Botão "🧹 Executar Limpeza de Reservas"
- Explicação clara de quando usar
- Confirmação antes de executar
- Feedback detalhado dos resultados

**Endpoint:**
```
POST /api/ordens-corte/admin/limpar-reservas
```

## 📊 Algoritmo de Validação

```
1. RESETAR todas metragens_reservadas → 0

2. BUSCAR alocações ativas:
   SELECT * FROM alocacoes_corte ac
   JOIN planos_corte pc ON ...
   WHERE pc.status = 'em_producao'

3. CALCULAR reservas corretas:
   Para cada alocação:
     reservas[origem_id] += metragem_alocada

4. APLICAR apenas reservas calculadas:
   UPDATE bobinas/retalhos
   SET metragem_reservada = [valor_calculado]
   WHERE id = [origem_id]

5. REPORTAR:
   - Reservas órfãs removidas
   - Reservas ativas recalculadas
```

## 🔄 Fluxo Automático

```
┌─────────────────┐
│ Servidor Inicia │
└────────┬────────┘
         │
         ▼
┌─────────────────────┐
│ Aguarda 5 segundos  │
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│ 1ª Validação        │
│ (ao iniciar)        │
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│ Validações          │
│ Periódicas          │
│ (a cada 1 hora)     │
└─────────────────────┘
```

## 🛠️ Uso Manual

**Quando usar a ferramenta de manutenção:**

1. **Após descobrir inconsistências** - Se notar metragens reservadas sem planos ativos
2. **Antes de alocar grandes quantidades** - Garantir que o sistema está consistente
3. **Troubleshooting** - Investigar problemas de auto-alocação

**Como usar:**

1. Acesse **Configurações** → Tab **🔧 Manutenção**
2. Clique em **"🧹 Executar Limpeza de Reservas"**
3. Confirme a ação
4. Aguarde o resultado (normalmente < 1 segundo)

## 📈 Monitoramento

**Logs do Sistema:**

```
🔄 Sistema de validação automática iniciado (intervalo: 1 hora)
🔍 Executando primeira validação de metragens reservadas...
✅ Validação de reservas concluída: 5 reserva(s) órfã(s) removida(s), 12 reserva(s) ativa(s) recalculada(s)
```

**Em caso de erro de BD:**
```
⚠️  Banco de dados não disponível para validação (será tentado novamente)
```

**Sistema consistente:**
```
✅ Validação de reservas concluída: Sistema consistente (8 reserva(s) ativa(s))
```

## 🔧 Configuração

**Intervalo de validação periódica:**

Arquivo: `middleware/validarReservas.js`
```javascript
const INTERVALO = 60 * 60 * 1000; // 1 hora (em milissegundos)
```

Para alterar:
- 30 minutos: `30 * 60 * 1000`
- 2 horas: `2 * 60 * 60 * 1000`
- 15 minutos: `15 * 60 * 1000`

## ✅ Status de Implementação

- [x] Identificação das causas raízes
- [x] Correção de `excluirPlano()`
- [x] Correção de `alocarOrigem()`
- [x] Criação de `limparReservasOrfas()`
- [x] Triggers SQL criados
- [x] Migration automática configurada
- [x] Middleware de validação implementado
- [x] Validação periódica configurada
- [x] Interface de manutenção (UI)
- [x] Tratamento de erros robusto
- [x] Documentação completa
- [x] Todos os commits enviados ao repositório

## 🚀 Próximos Passos

1. **Monitorar logs** - Acompanhar validações automáticas nos próximos dias
2. **Coletar métricas** - Quantas reservas órfãs são encontradas/corrigidas
3. **Dashboard (futuro)** - Criar página mostrando histórico de validações
4. **Alertas (futuro)** - Notificar se muitas órfãs são detectadas (possível novo bug)

## 🐛 Troubleshooting

### Validação não está rodando

1. Verificar logs do servidor: `🔄 Sistema de validação automática iniciado`
2. Aguardar 5 segundos após servidor iniciar
3. Verificar se BD está acessível

### Triggers não foram criados

1. Verificar logs: `⚙️  Aplicando migration: Triggers de Reservas`
2. Executar manualmente:
   ```bash
   mysql -u root -p controle_bobinas < database/migrations/add_triggers_reservas.sql
   ```
3. Verificar:
   ```sql
   SHOW TRIGGERS FROM controle_bobinas WHERE `Table` = 'alocacoes_corte';
   ```

### Reservas ainda aparecem órfãs

1. Usar ferramenta manual de limpeza
2. Aguardar próxima validação automática (até 1 hora)
3. Verificar se há planos com status diferente de 'em_producao' mas que deveriam estar

## 📝 Commits Relacionados

- `386f740` - Ajustar impressão de ordens para A4 paisagem
- `6d32fe7` - Corrigir modal de criação de plano a partir de template
- `9ffa4e7` - Fix: Corrigir liberação de reservas ao excluir planos
- `14447b7` - Feat: Adicionar ferramenta de manutenção de reservas
- `9189fdb` - Feat: Sistema automático de prevenção de reservas órfãs
- `89f11b0` - Fix: Melhorar tratamento de erro no middleware de validação

---

**Última atualização:** 2024-11-26
**Versão:** 1.0.0
**Status:** ✅ Implementado e Ativo
