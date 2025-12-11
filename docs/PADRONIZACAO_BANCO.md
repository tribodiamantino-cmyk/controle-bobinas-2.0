# 📊 Padronização do Banco de Dados

> **Documento de Referência** - Controle de Bobinas 2.0  
> **Versão:** 1.0 | **Data:** 2025-12-11  
> **Status:** ✅ Aprovado

---

## 🎯 Objetivo

Estabelecer padrões claros para estrutura do banco de dados, eliminando redundâncias, inconsistências e garantindo manutenibilidade futura.

---

## 📐 Princípios

1. **Uma fonte de verdade** - Cada dado tem um único local canônico
2. **Desnormalização consciente** - Apenas quando justificada por performance
3. **Nomenclatura consistente** - Mesmos campos, mesmos nomes
4. **Histórico preservado** - Itens zerados ficam como "Esgotado", não são deletados

---

## 🗄️ Estrutura das Tabelas Principais

### `produtos` (Fonte de Verdade)

Especificação abstrata do tecido. **Fonte única** para `loja` e `fabricante`.

```sql
produtos:
  id                  INT PRIMARY KEY AUTO_INCREMENT
  codigo              VARCHAR(20) NOT NULL        -- Ex: "CTV-00123"
  loja                ENUM('Cortinave','BN')      -- ⭐ FONTE ÚNICA
  fabricante          ENUM('Propex','Textiloeste') -- ⭐ FONTE ÚNICA
  cor_id              INT FK → configuracoes_cores
  gramatura_id        INT FK → configuracoes_gramaturas
  tipo_tecido         ENUM('Normal','Bando Y')
  largura_sem_costura DECIMAL(10,2)
  tipo_bainha         ENUM('Cano/Cano','Cano/Arame','Arame/Arame')
  largura_final       DECIMAL(10,2)
  largura_maior       DECIMAL(10,2)               -- Bando Y
  largura_y           DECIMAL(10,2)               -- Bando Y
  ativo               BOOLEAN DEFAULT TRUE
  data_criacao        TIMESTAMP
  ultima_atualizacao  TIMESTAMP
```

### `bobinas` (Rolo Físico)

Rolo físico de tecido. Referencia produto para loja/fabricante.

```sql
bobinas:
  id                  INT PRIMARY KEY AUTO_INCREMENT
  codigo_interno      VARCHAR(20) UNIQUE          -- Ex: "CTV-2025-00001"
  nota_fiscal         VARCHAR(50)
  produto_id          INT FK → produtos           -- ⭐ JOIN para loja/fabricante
  loja                ENUM('Cortinave','BN')      -- Snapshot (desnormalização)
  metragem_inicial    DECIMAL(10,2) NOT NULL
  metragem_atual      DECIMAL(10,2) NOT NULL
  metragem_reservada  DECIMAL(10,2) DEFAULT 0
  placa               VARCHAR(100)                -- Código garantia fabricante
  locacao             VARCHAR(12)                 -- ⭐ PADRONIZADO: 0001-A-0001
  status              ENUM('Disponível','Em Uso','Vazia','Bloqueada')  -- ⚠️ NÃO TEM 'Esgotado'!
  observacoes         TEXT
  data_entrada        DATE
  data_criacao        TIMESTAMP
  ultima_atualizacao  TIMESTAMP
```

**Nota sobre `loja` em bobinas:**
- É uma **desnormalização consciente** para evitar JOINs em 90% das queries
- Representa um "snapshot" do momento da entrada
- Bobinas NÃO migram entre lojas

### `retalhos` (Sobra de Corte)

Pedaço restante após cortes ou conversão de bobina.

```sql
retalhos:
  id                  INT PRIMARY KEY AUTO_INCREMENT
  codigo_retalho      VARCHAR(20) UNIQUE          -- Ex: "RET-0001"
  produto_id          INT FK → produtos           -- ⭐ JOIN para loja/fabricante
  bobina_origem_id    INT FK → bobinas NULL       -- Se veio de conversão
  metragem            DECIMAL(10,2) NOT NULL
  metragem_reservada  DECIMAL(10,2) DEFAULT 0
  placa               VARCHAR(100)                -- Herdado da bobina origem
  locacao             VARCHAR(12)                 -- ⭐ PADRONIZADO: 0001-A-0001
  status              ENUM('Disponível','Em uso','Esgotado')
  observacoes         TEXT
  data_criacao        TIMESTAMP
  ultima_atualizacao  TIMESTAMP
```

---

## � Tabelas de Ordens/Planos de Corte

### `planos_corte` (Ordem de Produção)

Plano de corte com múltiplos itens a serem cortados.

```sql
planos_corte:
  id                  INT PRIMARY KEY AUTO_INCREMENT
  codigo_plano        VARCHAR(50) UNIQUE          -- Ex: "PDC-PLA-001"
  loja                ENUM('Cortinave','BN')
  cliente             VARCHAR(200)
  obra                VARCHAR(200)
  status              ENUM('rascunho','pendente','em_producao','finalizado','cancelado')
  data_criacao        TIMESTAMP
  data_finalizacao    TIMESTAMP NULL
  observacoes         TEXT
```

### `itens_plano_corte` (O Que Cortar)

Cada item do plano de corte especifica produto e metragem.

```sql
itens_plano_corte:
  id                  INT PRIMARY KEY AUTO_INCREMENT
  plano_corte_id      INT FK → planos_corte       -- ⭐ FK para plano
  produto_id          INT FK → produtos
  metragem_necessaria DECIMAL(10,2) NOT NULL
  quantidade          INT DEFAULT 1
  observacoes         TEXT
```

### `alocacoes_corte` (De Onde Cortar)

Vincula item do plano a uma bobina ou retalho específico.

```sql
alocacoes_corte:
  id                  INT PRIMARY KEY AUTO_INCREMENT
  item_plano_corte_id INT FK → itens_plano_corte  -- ⭐ FK para item (NÃO para plano!)
  tipo_origem         ENUM('bobina','retalho')
  bobina_id           INT FK → bobinas NULL
  retalho_id          INT FK → retalhos NULL
  metragem_alocada    DECIMAL(10,2) NOT NULL
```

### `cortes_realizados` (Registro de Corte Físico)

Quando o corte é efetivamente realizado.

```sql
cortes_realizados:
  id                  INT PRIMARY KEY AUTO_INCREMENT
  codigo_corte        VARCHAR(50) UNIQUE          -- Ex: "COR-2025-00001"
  plano_corte_id      INT FK → planos_corte
  item_plano_corte_id INT FK → itens_plano_corte
  alocacao_corte_id   INT FK → alocacoes_corte
  metragem_cortada    DECIMAL(10,2)
  foto_medidor        VARCHAR(255)                -- Path da contraprova
  data_corte          TIMESTAMP
```

### ⚠️ Relacionamento Importante

```
planos_corte (1)
    └──→ itens_plano_corte (N)      -- plano_corte_id
            └──→ alocacoes_corte (N)  -- item_plano_corte_id
                    └──→ cortes_realizados (1)

⚠️ ATENÇÃO: alocacoes_corte NÃO tem FK direta para planos_corte!
   Para chegar ao plano, deve passar por itens_plano_corte.
```

---

## �📍 Campo `locacao` - Padronização

### Formato

```
0001-A-0001
├──┤ │ ├──┤
 │   │   │
 │   │   └── Posição (1-9999)
 │   └────── Corredor (A-Z)
 └────────── Área/Galpão (1-9999)
```

### Regras

| Aspecto | Especificação |
|---------|---------------|
| **Tipo** | VARCHAR(12) |
| **Nullable** | Sim (ainda não guardado) |
| **Regex validação** | `^[1-9]\d{0,3}-[A-Z]-[1-9]\d{0,3}$` |
| **Display** | Com zeros à esquerda: `0001-A-0001` |
| **Storage** | Com zeros: `0001-A-0001` |
| **Range** | `0001-A-0001` até `9999-Z-9999` |

### Exemplos Válidos

```
0001-A-0001  ✅
0150-B-0025  ✅
9999-Z-9999  ✅
1-A-1        ❌ (deve ter zeros)
0000-A-0001  ❌ (zero não permitido)
0001-a-0001  ❌ (letra minúscula)
```

### Frontend - Máscara

```javascript
// Input com máscara automática
// Usuário digita: 1A1
// Campo mostra: 0001-A-0001

function formatarLocacao(valor) {
    // Remove não alfanuméricos
    const limpo = valor.replace(/[^0-9A-Za-z]/g, '').toUpperCase();
    
    // Extrai partes
    const match = limpo.match(/^(\d{1,4})([A-Z])?(\d{0,4})?$/);
    if (!match) return valor;
    
    const [, area, corredor, posicao] = match;
    
    let resultado = area.padStart(4, '0');
    if (corredor) resultado += '-' + corredor;
    if (posicao) resultado += '-' + posicao.padStart(4, '0');
    
    return resultado;
}
```

### Backend - Validação

```javascript
function validarLocacao(locacao) {
    if (!locacao) return true; // NULL permitido
    const regex = /^\d{4}-[A-Z]-\d{4}$/;
    return regex.test(locacao);
}
```

---

## 🔄 Status e Visibilidade

### Status de Bobinas

| Status | Significado |
|--------|-------------|
| `Disponível` | Bobina com metragem disponível para uso |
| `Em Uso` | Bobina sendo usada em plano de corte |
| `Vazia` | Bobina com metragem zerada (convertida ou usada) |
| `Bloqueada` | Bobina bloqueada por algum motivo |

**⚠️ ENUM exato:** `'Disponível', 'Em Uso', 'Vazia', 'Bloqueada'`  
**NÃO existe** `'Esgotado'` em bobinas!

### Regra de Ocultar Itens Zerados

| Situação | Status | Visível na Lista | No Banco |
|----------|--------|------------------|----------|
| Metragem > 0 | Disponível/Em Uso | ✅ Sim | ✅ Mantido |
| Metragem = 0 | **Vazia** | ❌ Não | ✅ Mantido |
| Convertido em retalho | **Vazia** | ❌ Não | ✅ Mantido |

### Query Padrão para Listagens

```sql
-- Bobinas disponíveis (exclui vazias)
SELECT * FROM bobinas WHERE status NOT IN ('Vazia', 'Bloqueada');

-- Retalhos disponíveis  
SELECT * FROM retalhos WHERE status != 'Esgotado';

-- Histórico completo (admin)
SELECT * FROM bobinas; -- Inclui Vazia
```

---

## 🚫 O que NÃO Fazer

### ❌ Buscar `fabricante` de `bobinas`
```javascript
// ERRADO - bobinas não tem fabricante
SELECT b.fabricante FROM bobinas b

// CORRETO - buscar do produto
SELECT p.fabricante 
FROM bobinas b 
JOIN produtos p ON b.produto_id = p.id
```

### ❌ Usar tabela `locacoes`
```javascript
// ERRADO - tabela eliminada
SELECT * FROM locacoes WHERE id = ?

// CORRETO - campo texto em bobinas/retalhos
SELECT locacao FROM bobinas WHERE id = ?
```

### ❌ Deletar fisicamente itens zerados
```javascript
// ERRADO - perde histórico
DELETE FROM bobinas WHERE metragem_atual = 0

// CORRETO - marcar como vazia
UPDATE bobinas SET status = 'Vazia' WHERE metragem_atual = 0
```

---

## 🗑️ Tabelas Eliminadas

### `locacoes` (REMOVIDA)

**Motivo:** Locação é campo dinâmico, não precisa de cadastro prévio.

**Migração:**
1. Converter `bobinas.locacao_id` → `bobinas.locacao` (VARCHAR)
2. Converter `retalhos.localizacao_atual` → `retalhos.locacao` (VARCHAR)
3. Dropar tabela `locacoes`
4. Dropar tabela `plano_locacoes` (se existir)

---

## 📋 Checklist de Conformidade

Ao criar/modificar código, verificar:

- [ ] `fabricante` vem de `produtos`, nunca de `bobinas`
- [ ] `loja` pode vir de `bobinas.loja` (performance) ou `produtos.loja`
- [ ] `locacao` é VARCHAR(12), formato `0000-X-0000`
- [ ] Listagens filtram `status != 'Esgotado'`
- [ ] Itens zerados recebem `status = 'Esgotado'`, nunca DELETE

---

## 📚 Referências

- `docs/PADRONIZACAO_CODIGOS.md` - Códigos de entidades (BOB, RET, PDC)
- `docs/SISTEMA_VALIDACAO_RESERVAS.md` - Metragem reservada
- `docs/ARQUITETURA.md` - Padrões gerais

---

## 📝 Histórico de Alterações

| Data | Versão | Descrição |
|------|--------|-----------|
| 2025-12-11 | 1.0 | Documento inicial - Padronização completa |
