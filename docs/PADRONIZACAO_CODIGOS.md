# Padronização de Códigos do Sistema

> **Documento de referência** para todos os códigos utilizados no sistema Controle de Bobinas 2.0.
> Este documento deve ser consultado antes de qualquer implementação que envolva códigos.

---

## 📋 Índice

1. [Produto](#1-produto)
2. [Bobina](#2-bobina) - A definir
3. [Retalho](#3-retalho) - A definir
4. [Plano de Corte](#4-plano-de-corte) - A definir
5. [Corte](#5-corte) - A definir
6. [Locação](#6-locação) - A definir

---

## 🏢 Prefixos das Empresas

| Empresa | Cidade | Prefixo |
|---------|--------|---------|
| BN | Cianorte | `CIA` |
| Cortinave | Palotina | `PLA` |

> **Regra:** Todo código que identifica uma entidade física ou lógica da empresa deve iniciar com o prefixo de 3 letras correspondente.

---

## 1. Produto

### Formato
```
{LOJA}-{NUMERO}
```

| Componente | Descrição | Formato | Exemplo |
|------------|-----------|---------|---------|
| LOJA | Prefixo da empresa | 3 letras | CIA, PLA |
| NUMERO | Código interno | 5 dígitos (00000-99999) | 00123 |

### Exemplos
- `CIA-00001` → Produto #1 da BN (Cianorte)
- `PLA-00452` → Produto #452 da Cortinave (Palotina)

### Regras de Cadastro
1. **Ao criar produto:** Usuário informa apenas o número (ex: `452`)
2. **Sistema completa:** Adiciona prefixo da loja automaticamente (ex: `PLA-00452`)
3. **Armazenamento:** Código completo é salvo no banco de dados
4. **Exibição:** Sempre mostrar código completo

### Etiqueta
❌ **Não possui etiqueta física** - Código apenas para referência no sistema.

### Caracteres
- **Total:** 9 caracteres
- **Compatível com Code 128:** ✅ Sim

---

## 2. Bobina

### Formato
```
BOB-{LOJA}-{SEQUENCIAL}
```

| Componente | Descrição | Formato | Exemplo |
|------------|-----------|---------|---------|
| BOB | Prefixo fixo | 3 letras | BOB |
| LOJA | Prefixo da empresa | 3 letras | CIA, PLA |
| SEQUENCIAL | Número sequencial global | 6 dígitos (000001-999999) | 000042 |

### Exemplos
- `BOB-PLA-000001` → 1ª bobina do sistema (Cortinave)
- `BOB-CIA-000002` → 2ª bobina do sistema (BN)
- `BOB-PLA-000003` → 3ª bobina do sistema (Cortinave)

### Regras
1. **Geração:** Automática pelo sistema
2. **Sequencial:** Único global (não reinicia por ano, não separa por loja)
3. **Loja:** Definida automaticamente baseado no usuário/contexto

### Etiqueta
✅ **Possui etiqueta física**

### Caracteres
- **Total:** 14 caracteres
- **Compatível com Code 128:** ✅ Sim

---

## 3. Retalho

### Formato
```
RET-{LOJA}-{SEQUENCIAL}
```

| Componente | Descrição | Formato | Exemplo |
|------------|-----------|---------|---------|
| RET | Prefixo fixo | 3 letras | RET |
| LOJA | Prefixo da empresa | 3 letras | CIA, PLA |
| SEQUENCIAL | Número sequencial global | 6 dígitos (000001-999999) | 000042 |

### Exemplos
- `RET-PLA-000001` → 1º retalho do sistema (Cortinave)
- `RET-CIA-000002` → 2º retalho do sistema (BN)
- `RET-PLA-000003` → 3º retalho do sistema (Cortinave)

### Regras
1. **Geração:** Automática pelo sistema (quando sobra material de um corte)
2. **Sequencial:** Único global (não reinicia por ano, não separa por loja)
3. **Loja:** Definida automaticamente baseado na bobina de origem

### Etiqueta
✅ **Possui etiqueta física**

### Caracteres
- **Total:** 14 caracteres
- **Compatível com Code 128:** ✅ Sim

---

## 4. Plano de Corte

### Formato
```
PDC-{LOJA}-{SEQUENCIAL}
```

| Componente | Descrição | Formato | Exemplo |
|------------|-----------|---------|---------|
| PDC | Prefixo fixo | 3 letras | PDC |
| LOJA | Prefixo da empresa | 3 letras | CIA, PLA |
| SEQUENCIAL | Número sequencial global | 3 dígitos (001-999) | 042 |

### Exemplos
- `PDC-PLA-001` → 1º plano de corte do sistema (Cortinave)
- `PDC-CIA-002` → 2º plano de corte do sistema (BN)
- `PDC-PLA-003` → 3º plano de corte do sistema (Cortinave)

### Regras
1. **Geração:** Automática pelo sistema (ao criar novo plano)
2. **Sequencial:** Único global (não reinicia por ano, não separa por loja)
3. **Loja:** Definida automaticamente baseado no usuário/contexto
4. **Limite:** 999 planos (problema do "eu do futuro" 😄)

### Etiqueta
❌ **Não possui etiqueta física**

### Caracteres
- **Total:** 11 caracteres
- **Compatível com Code 128:** ✅ Sim

---

## 5. Corte

### Formato
```
COR-{LOJA}-{PLANO}-{SEQUENCIAL}
```

| Componente | Descrição | Formato | Exemplo |
|------------|-----------|---------|---------|
| COR | Prefixo fixo | 3 letras | COR |
| LOJA | Prefixo da empresa | 3 letras | CIA, PLA |
| PLANO | Referência ao plano de corte | 3 dígitos | 001 |
| SEQUENCIAL | Número do corte dentro do plano | 2 dígitos (01-99) | 05 |

### Exemplos
- `COR-PLA-001-01` → 1º corte do plano PDC-PLA-001
- `COR-PLA-001-02` → 2º corte do plano PDC-PLA-001
- `COR-CIA-002-01` → 1º corte do plano PDC-CIA-002

### Regras
1. **Geração:** Automática pelo sistema (ao confirmar corte no app)
2. **Sequencial:** Reinicia para cada plano (01 em cada novo plano)
3. **Loja:** Herdada do plano de corte
4. **Vínculo:** Sempre associado a um plano de corte
5. **Limite:** 99 cortes por plano

### Etiqueta
✅ **Possui etiqueta física** - Principal etiqueta do sistema

### Caracteres
- **Total:** 14 caracteres
- **Compatível com Code 128:** ✅ Sim

---

## 6. Locação

### Formato no Banco de Dados e Display
```
{0000}-{X}-{0000}
```

| Componente | Descrição | Formato | Exemplo |
|------------|-----------|---------|---------|
| SETOR | Área do galpão | 4 dígitos (0001-9999) | 0001 |
| CORREDOR | Identificador do corredor | 1 letra (A-Z) | A |
| POSICAO | Posição na prateleira | 4 dígitos (0001-9999) | 0001 |

### Formato no Código de Barras (Compacto)
```
LOC-{N}-{X}-{N}
```

| Componente | Descrição | Formato | Exemplo |
|------------|-----------|---------|---------|
| LOC | Prefixo fixo | 3 letras | LOC |
| SETOR | Área do galpão | 1-4 dígitos (sem zeros) | 1 |
| CORREDOR | Identificador do corredor | 1 letra (A-Z) | A |
| POSICAO | Posição na prateleira | 1-4 dígitos (sem zeros) | 1 |

> **⚠️ IMPORTANTE:** 
> - **Display na etiqueta:** `0001-A-0001` (com zeros, mais legível)
> - **Código de barras:** `LOC-1-A-1` (compacto, sem zeros à esquerda)
> - **Banco de dados:** `0001-A-0001` (formato padronizado)

### Exemplos

| Banco de Dados | Display na Etiqueta | Código de Barras |
|----------------|---------------------|------------------|
| `0001-A-0001` | `0001-A-0001` | `LOC-1-A-1` |
| `0012-B-0034` | `0012-B-0034` | `LOC-12-B-34` |
| `0150-C-0999` | `0150-C-0999` | `LOC-150-C-999` |

### Regras CRÍTICAS
1. **🆓 Referência LIVRE:** Locação NÃO precisa estar cadastrada previamente
2. **📍 Armazenada nos itens:** Campo `locacao` em bobinas/retalhos/PDC (formato com zeros)
3. **🔄 Formato no banco:** `0000-X-0000` (4 dígitos, 1 letra, 4 dígitos)
4. **🏷️ Código de barras compacto:** `LOC-N-X-N` (sem zeros à esquerda)
5. **✅ Normalização automática:** Sistema converte `LOC-1-A-1` → `0001-A-0001` na busca
6. **📦 Tabela opcional:** Pode existir tabela `locacoes` para catálogo, mas NÃO é obrigatória

### Fluxo de Leitura no Scanner

```
1. Scanner lê: LOC-1-A-1 (código compacto)
2. Sistema identifica: "É uma locação" (prefixo LOC-)
3. Sistema normaliza: 0001-A-0001 (adiciona zeros)
4. Busca no banco: WHERE locacao = '0001-A-0001'
```

### Conceito de Locação Livre

**Como funciona:**
```
1. Operador define locação ao cadastrar bobina: "0001-A-0001"
2. Sistema salva em bobinas.locacao = "0001-A-0001"
3. Etiqueta é impressa com: LOC-0001-A-0001
4. Locação aparece automaticamente no sistema
5. NÃO precisa cadastrar locação antes de usar
```

**Busca de itens:**
```sql
-- Busca bobinas na locação 0001-A-0001
SELECT * FROM bobinas WHERE locacao = '0001-A-0001';

-- Busca retalhos na locação 0001-A-0001
SELECT * FROM retalhos WHERE locacao = '0001-A-0001';
```

### Etiqueta
✅ **Possui etiqueta física** (gerada conforme demanda)

### Caracteres
- **No banco:** 11 caracteres (`0001-A-0001`)
- **No código de barras:** 15 caracteres (`LOC-0001-A-0001`)
- **Compatível com Code 128:** ✅ Sim

### Validação Regex
```javascript
// Formato do banco de dados (sem prefixo)
/^\d{4}-[A-Z]-\d{4}$/

// Formato do código de barras (com prefixo)
/^LOC-\d{4}-[A-Z]-\d{4}$/

// Exemplos válidos no banco:
✅ 0001-A-0001
✅ 0012-B-0034
✅ 0150-C-0999
✅ 9999-Z-9999

// Exemplos válidos no código de barras:
✅ LOC-0001-A-0001
✅ LOC-0012-B-0034
✅ LOC-0150-C-0999
✅ LOC-9999-Z-9999

// Exemplos inválidos:
❌ 1-A-1        (dígitos incompletos)
❌ 0000-A-0001  (setor 0 não permitido)
❌ 0001-a-0001  (letra minúscula)
❌ 0001-AA-0001 (mais de 1 letra)
```

---

## 🔧 Melhorias Futuras - Máscaras de Input

> **Importante:** Implementar máscaras automáticas em todos os campos de código no sistema.

### Requisitos

| Código | Máscara | Exemplo de Input | Resultado |
|--------|---------|------------------|-----------|
| Produto | `XXX-00000` | `123` → | `PLA-00123` |
| Bobina | `BOB-XXX-000000` | (automático) | `BOB-PLA-000001` |
| Retalho | `RET-XXX-000000` | (automático) | `RET-PLA-000001` |
| Plano de Corte | `PDC-XXX-000` | (automático) | `PDC-PLA-001` |
| Corte | `COR-XXX-000-00` | (automático) | `COR-PLA-001-01` |
| Locação | `0000-X-0000` | `1A25` → | `0001-A-0025` |

### Comportamento Esperado

1. **Inserção:**
   - Usuário digita apenas números/letras relevantes
   - Sistema adiciona prefixos e hífens automaticamente
   - Loja é preenchida baseado no contexto do usuário

2. **Consulta/Busca:**
   - Aceitar código com ou sem hífens
   - **Aceitar código com ou sem zeros à esquerda**
   - Busca parcial (ex: digitar `001` encontra `PDC-PLA-001`)
   - Autocompletar quando possível

3. **Exibição:**
   - Sempre mostrar código completo formatado
   - Hífens sempre visíveis
   - Zeros à esquerda sempre visíveis

---

## 🔍 Pesquisa Flexível - Zeros à Esquerda

> **Regra:** O sistema deve aceitar códigos com ou sem zeros à esquerda em todas as pesquisas e inputs.

### Exemplos de Pesquisa

| Usuário digita | Sistema normaliza | Encontra |
|----------------|-------------------|----------|
| `COR-PLA-1-1` | `COR-PLA-001-01` | ✅ |
| `COR-PLA-001-01` | `COR-PLA-001-01` | ✅ |
| `BOB-PLA-1` | `BOB-PLA-000001` | ✅ |
| `BOB-PLA-000001` | `BOB-PLA-000001` | ✅ |
| `RET-CIA-42` | `RET-CIA-000042` | ✅ |
| `PDC-CIA-5` | `PDC-CIA-005` | ✅ |
| `1-A-25` | `0001-A-0025` | ✅ |
| `PLA-123` | `PLA-00123` | ✅ |

### Regras Técnicas

1. **Armazenamento:** Sempre formato completo com zeros (`COR-PLA-001-01`)
2. **Exibição:** Sempre formato completo com zeros (`COR-PLA-001-01`)
3. **Pesquisa:** Normalizar input antes de buscar (adicionar zeros)
4. **Código de Barras:** Sempre formato completo com zeros

---

## � Regras de Medidas

> **Padronização obrigatória** para todas as medidas exibidas no sistema e nas etiquetas.

### Unidades

| Tipo de Medida | Unidade | Formato | Exemplo |
|----------------|---------|---------|---------|
| **Largura** | Centímetros (cm) | Número inteiro + "cm" | `190cm` |
| **Comprimento** | Metros (m) | Decimal com 2 casas + "m" | `150,00m` |
| **Gramatura** | Gramas por m² | Número inteiro + "gr" | `190gr` |

### Formato por Tipo de Tecido

#### Tecido Normal
```
{COR} {LARGURA}cm {BAINHA} {GRAMATURA}gr
```
**Exemplo:** `Preta/Prata 190cm Cano/Cano 190gr`

| Campo | Descrição | Exemplo |
|-------|-----------|---------|
| COR | Cor ou combinação de cores | `Preta/Prata`, `Azul Royal` |
| LARGURA | Largura final em cm | `190`, `140`, `220` |
| BAINHA | Tipo de acabamento | `Cano/Cano`, `Cano/Aberto`, `Simples` |
| GRAMATURA | Peso do tecido | `180`, `190`, `200` |

#### Tecido Bando Y
```
{COR} {LARGURA_MAIOR}x{LARGURA_Y}x{LARGURA_Y}cm {GRAMATURA}gr
```
**Exemplo:** `Preta/Prata 220x80x80cm 190gr`

| Campo | Descrição | Exemplo |
|-------|-----------|---------|
| COR | Cor ou combinação de cores | `Preta/Prata` |
| LARGURA_MAIOR | Largura da parte maior (cm) | `220`, `250` |
| LARGURA_Y | Largura das "pernas" do Y (cm) | `80`, `100` |
| GRAMATURA | Peso do tecido | `180`, `190` |

> **Nota:** No Bando Y, a largura menor (Y) repete duas vezes no formato porque o tecido tem formato de "Y" onde as duas "pernas" têm a mesma medida.

### Exemplos Completos

| Tipo | Linha de Produto na Etiqueta |
|------|------------------------------|
| Normal | `Preta/Prata 190cm Cano/Cano 190gr` |
| Normal | `Azul Royal 140cm Simples 180gr` |
| Bando Y | `Preta/Prata 220x80x80cm 190gr` |
| Bando Y | `Azul/Branca 250x100x100cm 180gr` |

---

## �📊 Resumo dos Códigos

| Entidade | Formato | Caracteres | Etiqueta | Sequencial |
|----------|---------|------------|----------|------------|
| Produto | `{LOJA}-{00000}` | 9 | ❌ | Manual |
| Bobina | `BOB-{LOJA}-{000000}` | 14 | ✅ | Global auto |
| Retalho | `RET-{LOJA}-{000000}` | 14 | ✅ | Global auto |
| Plano de Corte | `PDC-{LOJA}-{000}` | 11 | ❌ | Global auto |
| Corte | `COR-{LOJA}-{PDC}-{00}` | 14 | ✅ | Por plano |
| Locação | `{0000}-{X}-{0000}` | 11 | ✅ | Manual |

### Legenda
- **LOJA:** `PLA` (Cortinave/Palotina) ou `CIA` (BN/Cianorte)
- **Global auto:** Sequencial único no sistema, gerado automaticamente
- **Por plano:** Reinicia a cada novo plano de corte
- **Manual:** Usuário informa o código

---

## 📝 Histórico de Alterações

| Data | Alteração |
|------|-----------|
| 11/12/2025 | Documento criado. Todos os 6 códigos padronizados. |
| 11/12/2025 | Adicionada seção de melhorias futuras (máscaras de input). |
| 11/12/2025 | Corte ajustado para 2 dígitos (01-99). |
| 11/12/2025 | Adicionada regra de pesquisa flexível (zeros à esquerda opcionais). |

