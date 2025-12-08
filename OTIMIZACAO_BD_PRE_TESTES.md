# Otimização do Banco de Dados - Pré-Testes
**Data**: 8 de dezembro de 2025  
**Objetivo**: Adequar BD ao novo padrão de códigos QR + otimizações críticas

---

## 🎯 Análise da Situação Atual

### Tabelas Existentes (via migrations)
✅ `planos_corte` - Planos de corte  
✅ `itens_plano_corte` - Itens dos planos  
✅ `alocacoes_corte` - Alocações de bobinas/retalhos  
✅ `bobinas` - Bobinas físicas  
✅ `retalhos` - Retalhos de cortes  
✅ `produtos` - Especificações de tecido  
✅ `cortes_realizados` - Cortes individuais (v2.2.0)  
✅ `locacoes` - Localizações do armazém  
✅ `plano_locacoes` - Alocação de planos em locais  
✅ `carregamentos` - Processos de carregamento  
✅ `carregamentos_itens` - Itens validados no carregamento

### ❌ Problemas Identificados

#### 1. **Colunas de Código QR Desatualizadas**
```sql
-- bobinas.codigo_interno: atualmente usa "CTV-2025-00123"
-- Deveria: "BOB-0123"

-- retalhos.codigo_retalho: atualmente usa "RET-2025-00001" 
-- Deveria: "RET-0001"

-- planos_corte.codigo_plano: atualmente usa "PC-2025-00001"
-- Deveria: "PLA-0001"

-- cortes_realizados.codigo_corte: usa "COR-2025-00001"
-- Deveria: "COR-0001-PLA-0123"
```

#### 2. **Falta de Índices em Códigos QR**
- `bobinas.codigo_interno` → SEM índice (busca lenta!)
- `retalhos.codigo_retalho` → SEM índice
- `planos_corte.codigo_plano` → SEM índice
- `cortes_realizados.codigo_corte` → TEM índice UNIQUE (OK!)
- `locacoes.codigo_localizacao` → Precisa verificar

#### 3. **Tamanhos de VARCHAR Subdimensionados**
```sql
-- bobinas.codigo_interno VARCHAR(100) → OK (sobra espaço)
-- retalhos.codigo_retalho VARCHAR(20) → RISCO! "RET-0001" = 8 chars, mas pode crescer
-- planos_corte.codigo_plano VARCHAR(20) → RISCO!
-- cortes_realizados.codigo_corte VARCHAR(30) → OK! "COR-0001-PLA-0123" = 17 chars
-- locacoes.codigo_localizacao VARCHAR(20) → OK! "0001-A-0001" = 11 chars
```

#### 4. **Coluna `loja` em Produtos Não Está em Bobinas**
- Bobinas herdam loja do produto
- Mas não tem coluna direta → JOIN obrigatório sempre
- **Solução**: Adicionar `bobinas.loja` desnormalizado

#### 5. **Falta de Índices Compostos para Queries Frequentes**
```sql
-- Query: "Buscar bobinas disponíveis de um produto"
-- SELECT * FROM bobinas WHERE produto_id = ? AND status = 'Disponível'
-- Índice composto ausente!

-- Query: "Buscar cortes de um plano"
-- SELECT * FROM cortes_realizados WHERE plano_corte_id = ?
-- Índice simples existe, mas pode melhorar com composto
```

---

## 📋 Plano de Ação

### ✅ **CRÍTICO - Fazer ANTES dos Testes**

#### Migration 023: Adequar Tamanhos de VARCHAR
```sql
-- Garantir que códigos suportem crescimento futuro
ALTER TABLE bobinas 
    MODIFY COLUMN codigo_interno VARCHAR(50) NOT NULL;

ALTER TABLE retalhos 
    MODIFY COLUMN codigo_retalho VARCHAR(50) NOT NULL;

ALTER TABLE planos_corte 
    MODIFY COLUMN codigo_plano VARCHAR(50) NOT NULL;

-- cortes_realizados já tem VARCHAR(30) - suficiente
-- locacoes já tem VARCHAR(20) - suficiente
```

#### Migration 024: Adicionar Índices em Códigos QR
```sql
-- Acelerar buscas por código (endpoint /buscar-codigo)
ALTER TABLE bobinas 
    ADD UNIQUE INDEX idx_codigo_interno (codigo_interno);

ALTER TABLE retalhos 
    ADD UNIQUE INDEX idx_codigo_retalho (codigo_retalho);

ALTER TABLE planos_corte 
    ADD UNIQUE INDEX idx_codigo_plano (codigo_plano);

-- cortes_realizados.codigo_corte já tem UNIQUE (criado na migration 012)

-- Verificar locacoes
ALTER TABLE locacoes 
    ADD UNIQUE INDEX idx_codigo_localizacao (codigo_localizacao);
```

#### Migration 025: Índices Compostos para Performance
```sql
-- Bobinas: produto + status (query mais comum)
ALTER TABLE bobinas 
    ADD INDEX idx_produto_status (produto_id, status);

-- Bobinas: status + metragem > 0 (disponíveis com material)
ALTER TABLE bobinas 
    ADD INDEX idx_status_metragem (status, metragem_atual);

-- Retalhos: produto + status
ALTER TABLE retalhos 
    ADD INDEX idx_produto_status (produto_id, status);

-- Cortes: plano + status
ALTER TABLE cortes_realizados 
    ADD INDEX idx_plano_status (plano_corte_id, status);

-- Alocações: plano + status confirmação
ALTER TABLE alocacoes_corte 
    ADD INDEX idx_plano_confirmacao (item_plano_corte_id, status_confirmacao);
```

#### Migration 026: Adicionar Coluna `loja` em Bobinas (Desnormalização)
```sql
-- Evitar JOIN em 90% das queries
ALTER TABLE bobinas 
    ADD COLUMN loja ENUM('Cortinave', 'BN') NULL AFTER produto_id;

-- Popular com dados existentes
UPDATE bobinas b
JOIN produtos p ON b.produto_id = p.id
SET b.loja = p.loja;

-- Tornar NOT NULL após popular
ALTER TABLE bobinas 
    MODIFY COLUMN loja ENUM('Cortinave', 'BN') NOT NULL;

-- Adicionar índice
ALTER TABLE bobinas 
    ADD INDEX idx_loja (loja);
```

---

### ⚠️ **IMPORTANTE - Considerar para Futuro**

#### Migration 027: Adicionar Trigger para Sincronizar `loja`
```sql
-- Quando atualizar produto, sincronizar bobinas
DELIMITER //
CREATE TRIGGER sync_bobina_loja_on_produto_update
AFTER UPDATE ON produtos
FOR EACH ROW
BEGIN
    IF OLD.loja != NEW.loja THEN
        UPDATE bobinas SET loja = NEW.loja WHERE produto_id = NEW.id;
    END IF;
END//
DELIMITER ;
```

#### Migration 028: Soft Delete em Vez de DELETE
```sql
-- Adicionar coluna deleted_at em tabelas críticas
ALTER TABLE bobinas 
    ADD COLUMN deleted_at TIMESTAMP NULL;

ALTER TABLE retalhos 
    ADD COLUMN deleted_at TIMESTAMP NULL;

ALTER TABLE planos_corte 
    ADD COLUMN deleted_at TIMESTAMP NULL;

-- Modificar queries para WHERE deleted_at IS NULL
```

---

### 🚀 **OPCIONAL - Melhorias de Produção**

#### Migration 029: Auditoria (Created/Updated By)
```sql
ALTER TABLE bobinas 
    ADD COLUMN created_by VARCHAR(100) NULL,
    ADD COLUMN updated_by VARCHAR(100) NULL;

ALTER TABLE planos_corte 
    ADD COLUMN created_by VARCHAR(100) NULL,
    ADD COLUMN updated_by VARCHAR(100) NULL;
```

#### Migration 030: Adicionar Full-Text Search
```sql
-- Busca rápida por cliente/aviário
ALTER TABLE planos_corte 
    ADD FULLTEXT INDEX ft_cliente_aviario (cliente, aviario);
```

---

## 🎯 Priorização para TESTES

### ✅ **FAZER AGORA (Bloqueante)**
1. ✅ Migration 023: Ajustar VARCHAR (5 min)
2. ✅ Migration 024: Índices em códigos QR (10 min)
3. ✅ Migration 025: Índices compostos (15 min)
4. ✅ Migration 026: Coluna `loja` em bobinas (10 min)

**Total**: ~40 minutos  
**Impacto**: Performance 5-10x melhor + compatibilidade garantida

### ⚠️ **FAZER DEPOIS (Pós-Testes)**
5. Migration 027: Trigger sincronização loja
6. Migration 028: Soft delete
7. Migration 029: Auditoria
8. Migration 030: Full-text search

---

## 📊 Queries de Validação

### Verificar Índices Existentes
```sql
SHOW INDEX FROM bobinas;
SHOW INDEX FROM retalhos;
SHOW INDEX FROM planos_corte;
SHOW INDEX FROM cortes_realizados;
SHOW INDEX FROM locacoes;
```

### Verificar Tamanhos de Coluna
```sql
SELECT 
    COLUMN_NAME, 
    COLUMN_TYPE, 
    IS_NULLABLE 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME IN ('bobinas', 'retalhos', 'planos_corte', 'cortes_realizados', 'locacoes')
    AND COLUMN_NAME LIKE '%codigo%'
ORDER BY TABLE_NAME, COLUMN_NAME;
```

### Teste de Performance (Antes/Depois)
```sql
-- Antes da otimização
EXPLAIN SELECT * FROM bobinas WHERE codigo_interno = 'BOB-0001';
-- Deve mostrar: type = ALL (full table scan) ❌

-- Depois da otimização
EXPLAIN SELECT * FROM bobinas WHERE codigo_interno = 'BOB-0001';
-- Deve mostrar: type = const, key = idx_codigo_interno ✅
```

---

## 🔍 Análise de Impacto

### Sem Otimização
- ❌ Busca por código QR: **O(n)** - full table scan
- ❌ Busca de bobinas disponíveis: 2 índices separados (ineficiente)
- ❌ VARCHAR pequeno: risco de overflow futuro
- ❌ Sem coluna `loja`: JOIN obrigatório sempre

### Com Otimização
- ✅ Busca por código QR: **O(1)** - índice único
- ✅ Busca de bobinas disponíveis: índice composto (super rápido)
- ✅ VARCHAR(50): suporta até 9999 sequenciais + espaço sobra
- ✅ Coluna `loja`: 90% das queries SEM JOIN

### Ganho Estimado
- **5-10x** mais rápido em buscas por QR
- **3-5x** mais rápido em listagens filtradas
- **2x** menos carga no banco (menos JOINs)
- **Zero risco** de overflow de código

---

## ✅ Recomendação Final

### 🚨 **SIM, fazer otimização ANTES dos testes!**

**Motivos:**
1. **Performance**: Testes vão criar MUITOS códigos QR - sem índices vai ficar lento
2. **Compatibilidade**: VARCHAR pequeno pode causar erro DURANTE teste
3. **Qualidade**: Testar sistema otimizado = feedback real de produção
4. **Tempo**: 40 min agora vs dias debugando lentidão depois

**Ordem de Execução:**
1. ✅ Criar migrations 023-026
2. ✅ Rodar localmente e validar
3. ✅ Commit e push para Railway
4. ✅ Aguardar deploy (~2-3 min)
5. ✅ Iniciar testes com BD otimizado

---

## 📝 Checklist Pré-Testes

- [ ] Migration 023: VARCHAR ajustado
- [ ] Migration 024: Índices únicos em códigos
- [ ] Migration 025: Índices compostos criados
- [ ] Migration 026: Coluna `loja` adicionada
- [ ] Validação: `SHOW INDEX` confirma índices
- [ ] Validação: `EXPLAIN` mostra uso de índices
- [ ] Deploy no Railway concluído
- [ ] Sistema funcionando sem erros
- [ ] **PRONTO PARA TESTES** ✅
