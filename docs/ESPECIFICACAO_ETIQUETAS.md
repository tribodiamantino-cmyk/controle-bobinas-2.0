# Especificação de Etiquetas - Controle de Bobinas 2.0

> **Documento de referência** para layout e impressão de etiquetas.
> Todas as etiquetas são impressas na **Elgin L42 Pro Full** em formato **60x30mm**.

---

## 📋 Índice

1. [Configurações Gerais](#-configurações-gerais)
2. [Regras de Medidas](#-regras-de-medidas)
3. [Bobina](#1-bobina)
4. [Retalho](#2-retalho)
5. [Corte](#3-corte)
6. [Locação](#4-locação)
7. [Bando Y (Variação)](#5-bando-y-variação)
8. [Impressão em Lote](#-impressão-em-lote)
9. [Integração no Sistema](#-integração-no-sistema)

---

## 🖨️ Configurações Gerais

| Parâmetro | Valor |
|-----------|-------|
| **Impressora** | Elgin L42 Pro Full |
| **Conexão** | USB (via servidor de impressão no PC) |
| **Tamanho da Etiqueta** | 60mm x 30mm |
| **Código de Barras** | Code 128 |
| **Altura do Código** | 10mm (padrão) / 15mm (locação) |
| **Margens** | Sem margens (conteúdo centralizado) |

### Arquitetura de Impressão

```
App Mobile → API Railway → PC Local (polling 5s) → Elgin L42 (USB)
```

### Preview Visual

Arquivo: `public/preview-etiquetas.html`

---

## 📏 Regras de Medidas

### Unidades Obrigatórias

| Tipo | Unidade | Formato | Exemplo |
|------|---------|---------|---------|
| **Largura** | cm | Número inteiro + "cm" | `190cm` |
| **Comprimento** | m | Decimal 2 casas + "m" | `150,00m` |
| **Gramatura** | gr | Número inteiro + "gr" | `190gr` |

### Formato da Linha de Produto

**Tecido Normal:**
```
{COR} {LARGURA}cm {BAINHA} {GRAMATURA}gr
```
Exemplo: `Preta/Prata 190cm Cano/Cano 190gr`

**Tecido Bando Y:**
```
{COR} {LM}x{LY}x{LY}cm {GRAMATURA}gr
```
Exemplo: `Preta/Prata 220x80x80cm 190gr`

---

## 1. Bobina

### Código
```
BOB-{LOJA}-{000000}
```
Exemplo: `BOB-PLA-000001` (14 caracteres)

### Layout Visual (60x30mm)
```
┌──────────────────────────────────────────────────────────┐
│                    BOB-PLA-000001                        │ 6mm  - Código
│       ║║║║║║║║║║║║║║║║║║║║║║║║║║║║║║║║║║║║║║║           │ 10mm - Barcode
│         Preta/Prata 190cm Cano/Cano 190gr                │ 7mm  - Produto
│           PROPEX | ABC-1234 | 150,00m                    │ 7mm  - Detalhes
└──────────────────────────────────────────────────────────┘
```

### Especificações por Linha

| Linha | Conteúdo | Altura | Fonte |
|-------|----------|--------|-------|
| 1 | Código da bobina | 6mm | Courier, Negrito, 14px |
| 2 | Code 128 (sem texto) | 10mm | - |
| 3 | Produto | 7mm | Arial, 10px |
| 4 | Detalhes | 7mm | Arial, Negrito, 10px |

### Campos da Linha 4 (Detalhes)

| Campo | Descrição | Obrigatório |
|-------|-----------|-------------|
| Fabricante | Fabricante do tecido | ✅ Sempre |
| Placa | Código da placa de transporte | ⚠️ Se disponível |
| Metragem | Metros totais | ✅ Sempre |

---

## 2. Retalho

### Código
```
RET-{LOJA}-{000000}
```
Exemplo: `RET-PLA-000001` (14 caracteres)

### Layout Visual (60x30mm)
```
┌──────────────────────────────────────────────────────────┐
│                    RET-PLA-000001                        │ 6mm  - Código
│       ║║║║║║║║║║║║║║║║║║║║║║║║║║║║║║║║║║║║║║║           │ 10mm - Barcode
│         Preta/Prata 190cm Cano/Cano 190gr                │ 7mm  - Produto
│                  PROPEX | 35,50m                         │ 7mm  - Detalhes
└──────────────────────────────────────────────────────────┘
```

### Especificações por Linha

| Linha | Conteúdo | Altura | Fonte |
|-------|----------|--------|-------|
| 1 | Código do retalho | 6mm | Courier, Negrito, 14px |
| 2 | Code 128 (sem texto) | 10mm | - |
| 3 | Produto (herdado da bobina) | 7mm | Arial, 10px |
| 4 | Detalhes | 7mm | Arial, Negrito, 10px |

### Campos da Linha 4 (Detalhes)

| Campo | Descrição | Obrigatório |
|-------|-----------|-------------|
| Fabricante | Herdado da bobina | ✅ Sempre |
| Metragem | Metros restantes | ✅ Sempre |

> **Diferença da Bobina:** Retalho **NÃO exibe placa** na etiqueta (apenas no banco de dados)

---

## 3. Corte

### Código
```
COR-{LOJA}-{PDC}-{00}
```
Exemplo: `COR-PLA-001-01` (14 caracteres)

### Layout Visual (60x30mm)
```
┌──────────────────────────────────────────────────────────┐
│                    COR-PLA-001-01                        │ 6mm  - Código
│       ║║║║║║║║║║║║║║║║║║║║║║║║║║║║║║║║║║║║║║║           │ 10mm - Barcode
│         Preta/Prata 190cm Cano/Cano 190gr                │ 7mm  - Produto
│           25,00m | JOÃO SILVA | AV-03                    │ 7mm  - Detalhes
└──────────────────────────────────────────────────────────┘
```

### Especificações por Linha

| Linha | Conteúdo | Altura | Fonte |
|-------|----------|--------|-------|
| 1 | Código do corte | 6mm | Courier, Negrito, 14px |
| 2 | Code 128 (sem texto) | 10mm | - |
| 3 | Produto (do item do plano) | 7mm | Arial, 10px |
| 4 | Detalhes do pedido | 7mm | Arial, Negrito, 10px |

### Campos da Linha 4 (Detalhes)

| Campo | Descrição | Exemplo |
|-------|-----------|---------|
| Metragem | Metros cortados | `25,00m` |
| Cliente | Nome do cliente | `JOÃO SILVA` |
| Aviário | Identificação | `AV-03` |

---

## 4. Locação

### Código no Banco de Dados
```
{0000}-{X}-{0000}
```
Exemplo: `0001-A-0001` (11 caracteres)

### Código no Código de Barras (Etiqueta)
```
LOC-{0000}-{X}-{0000}
```
Exemplo: `LOC-0001-A-0001` (15 caracteres)

> **⚠️ IMPORTANTE:** O prefixo `LOC-` é usado **APENAS no código de barras** para distinguir de outros tipos durante a leitura no scanner. No banco de dados, armazena-se apenas `0001-A-0001`.

### Layout Visual (60x30mm) - **SIMPLIFICADO 50/50**
```
┌──────────────────────────────────────────────────────────┐
│                                                          │
│                    0001-A-0001                           │ 15mm - Código GRANDE
│                                                          │
├──────────────────────────────────────────────────────────┤
│       ║║║║║║║║║║║║║║║║║║║║║║║║║║║║║║║║║║║║║║║           │
│       ║║║║║║║║║║║║║║║║║║║║║║║║║║║║║║║║║║║║║║║           │ 15mm - Barcode GRANDE
└──────────────────────────────────────────────────────────┘
         (código de barras contém: LOC-0001-A-0001)
```

### Especificações

| Linha | Conteúdo | Altura | Fonte |
|-------|----------|--------|-------|
| 1 | Código da locação (visual) | 15mm (50%) | Courier, Negrito, **26px** |
| 2 | Code 128 (LOC-0000-X-0000) | 15mm (50%) | Altura 45px |

> **Diferença:** Layout mais simples com apenas 2 elementos, ambos grandes para fácil visualização no galpão.

### Componentes do Código

| Campo | Descrição | Formato |
|-------|-----------|---------|
| LOC | Prefixo (apenas no barcode) | 3 letras |
| SETOR | Área do galpão | 4 dígitos (0001-9999) |
| CORREDOR | Identificador | 1 letra (A-Z) |
| POSIÇÃO | Local na prateleira | 4 dígitos (0001-9999) |

### Fluxo de Leitura

```
1. Scanner lê código de barras: LOC-0001-A-0001
2. Sistema identifica prefixo LOC- → É uma locação
3. Sistema extrai valor: 0001-A-0001
4. Busca no banco: WHERE locacao = '0001-A-0001'
```

---

## 5. Bando Y (Variação)

> **Bando Y** é um tipo especial de tecido com formato em "Y". Aplica-se a Bobina, Retalho e Corte.

### Diferença na Linha de Produto

**Normal:**
```
Preta/Prata 190cm Cano/Cano 190gr
```

**Bando Y:**
```
Preta/Prata 220x80x80cm 190gr
```

### Formato das Medidas Bando Y
```
{LARGURA_MAIOR}x{LARGURA_Y}x{LARGURA_Y}cm
```

| Campo | Descrição | Exemplo |
|-------|-----------|---------|
| LARGURA_MAIOR | Parte maior do Y | `220` |
| LARGURA_Y | "Pernas" do Y (repete 2x) | `80` |

### Exemplos

| Tipo | Linha de Produto |
|------|------------------|
| Bobina Bando Y | `Preta/Prata 220x80x80cm 190gr` |
| Retalho Bando Y | `Azul/Branca 250x100x100cm 180gr` |
| Corte Bando Y | `Preta/Prata 220x80x80cm 190gr` |

> **Nota:** O Bando Y **NÃO tem bainha**, por isso não aparece o campo "Cano/Cano" etc.

---

## 📊 Resumo Visual

| Etiqueta | Layout | Linhas | Barcode | Conteúdo do Barcode |
|----------|--------|--------|---------|---------------------|
| **Bobina** | 4 linhas | Código + Barcode + Produto + Detalhes | 10mm | `BOB-PLA-000001` |
| **Retalho** | 4 linhas | Código + Barcode + Produto + Detalhes | 10mm | `RET-PLA-000001` |
| **Corte** | 4 linhas | Código + Barcode + Produto + Detalhes | 10mm | `COR-PLA-001-01` |
| **Locação** | 2 linhas (50/50) | Código + Barcode | 15mm | `LOC-0001-A-0001` |

---

## 📦 Impressão em Lote

### Cenário de Uso

Quando uma remessa de bobinas chega (10-15 bobinas), é necessário imprimir todas as etiquetas de uma vez:

```javascript
// Método 1: Array de IDs (bobinas de uma remessa)
const bobinasRemessa = [101, 102, 103, 104, 105];
ImpressaoEtiquetas.imprimirLote('bobina', bobinasRemessa);

// Método 2: Adicionar lote à fila (impressão posterior)
ImpressaoEtiquetas.adicionarLote('bobina', bobinasRemessa);
```

### Seleção Visual na Tela

Para permitir seleção visual de múltiplos itens:

```javascript
// 1. Adicionar checkbox em cada linha da tabela
const checkboxHtml = ImpressaoEtiquetas.checkboxSelecaoHtml(bobina.id);

// 2. Adicionar barra de ações de lote (aparece quando há seleção)
ImpressaoEtiquetas.renderizarBarraLote('#container');
```

---

## 🔌 Integração no Sistema

### Métodos Principais

```javascript
// Imprimir etiqueta individual
ImpressaoEtiquetas.abrirModal('bobina', 123);
ImpressaoEtiquetas.abrirModal('retalho', 456);
ImpressaoEtiquetas.abrirModal('corte', 'COR-PLA-001-01');
ImpressaoEtiquetas.abrirModal('locacao', 10);

// Imprimir lote
ImpressaoEtiquetas.imprimirLote('bobina', [101, 102, 103]);
```

### Tipos de Etiqueta

| Tipo | Descrição | Identificador |
|------|-----------|---------------|
| `bobina` | Rolo de tecido | ID numérico |
| `retalho` | Sobra de corte | ID numérico |
| `corte` | Peça cortada | Código `COR-XXX-XXX-XX` |
| `locacao` | Posição no estoque | ID ou código `0001-A-0001` |

### Campos dos Dados

| Campo | Descrição | Exemplo |
|-------|-----------|---------|
| `codigo` | Código impresso (e no barcode) | `BOB-PLA-000001` |
| `produto` | Descrição do produto | `Preta/Prata 190cm Cano/Cano 190gr` |
| `fabricante` | Nome do fabricante | `PROPEX` |
| `placa` | Código da placa (bobina) | `ABC-1234` |
| `metragem` | Metragem atual | `150,00m` |
| `locacao` | Posição no estoque | `0001-A-0001` |

---

## 📝 Histórico de Alterações

| Data | Versão | Alteração |
|------|--------|-----------|
| 17/12/2025 | 2.0 | Padronização código de barras locação: `LOC-0000-X-0000` |
| 11/12/2025 | 1.0 | Documento inicial |

---

*Documento mantido pela equipe de desenvolvimento. Última revisão: Dezembro 2025*
