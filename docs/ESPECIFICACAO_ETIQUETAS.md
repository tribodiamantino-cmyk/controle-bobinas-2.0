# Especificação de Etiquetas - Controle de Bobinas 2.0# Especificação de Etiquetas - Controle de Bobinas 2.0# Especificação de Etiquetas - Controle de Bobinas 2.0



> **Documento de referência** para layout e impressão de etiquetas.

> Todas as etiquetas são impressas na **Elgin L42 Pro Full** em formato **60x30mm**.

> **Documento de referência** para layout e impressão de etiquetas.> **Documento de referência** para layout e impressão de etiquetas.

---

> Todas as etiquetas são impressas na **Elgin L42 Pro Full** em formato **60x30mm**.> Todas as etiquetas são impressas na **Elgin L42 Pro Full** em formato **60x30mm**.

## Índice



1. [Configurações Gerais](#configurações-gerais)

2. [Regras de Medidas](#regras-de-medidas)------

3. [Bobina](#1-bobina)

4. [Retalho](#2-retalho)

5. [Corte](#3-corte)

6. [Locação](#4-locação)## 📋 Índice## 📋 Índice

7. [Bando Y](#5-bando-y-variação)

8. [Modo Teste](#modo-teste)

9. [Impressão em Lote](#impressão-em-lote)

10. [Integração no Sistema](#integração-no-sistema)1. [Configurações Gerais](#-configurações-gerais)1. [Configurações Gerais](#-configurações-gerais)



---2. [Regras de Medidas](#-regras-de-medidas)2. [Regras de Medidas](#-regras-de-medidas)



## Configurações Gerais3. [Bobina](#1-bobina)3. [Bobina](#1-bobina)



| Parâmetro | Valor |4. [Retalho](#2-retalho)---

|-----------|-------|

| **Impressora** | Elgin L42 Pro Full |5. [Corte](#3-corte)

| **Conexão** | USB (via servidor de impressão no PC) |

| **Tamanho da Etiqueta** | 60mm x 30mm |6. [Locação](#4-locação)## 📦 Impressão em Lote

| **Código de Barras** | Code 128 |

| **Altura do Código** | 10mm (padrão) / 15mm (locação) |7. [Bando Y (Variação)](#5-bando-y-variação)

| **Margens** | Sem margens (conteúdo centralizado) |

8. [Impressão em Lote](#-impressão-em-lote)### Cenário de Uso

### Arquitetura de Impressão

```9. [Integração no Sistema](#-integração-no-sistema)

App Mobile → API Railway → PC Local (polling 5s) → Elgin L42 (USB)

```Quando uma remessa de bobinas chega (10-15 bobinas), é necessário imprimir todas as etiquetas de uma vez:



### Preview Visual---

Arquivo: `public/preview-etiquetas.html`

```javascript

---

## 🖨️ Configurações Gerais// Método 1: Array de IDs (bobinas de uma remessa)

## Regras de Medidas

const bobinasRemessa = [101, 102, 103, 104, 105];

### Unidades Obrigatórias

| Parâmetro | Valor |ImpressaoEtiquetas.imprimirLote('bobina', bobinasRemessa);

| Tipo | Unidade | Formato | Exemplo |

|------|---------|---------|---------||-----------|-------|

| **Largura** | cm | Número inteiro + "cm" | `190cm` |

| **Comprimento** | m | Decimal 2 casas + "m" | `150,00m` || **Impressora** | Elgin L42 Pro Full |// Método 2: Adicionar lote à fila (impressão posterior)

| **Gramatura** | gr | Número inteiro + "gr" | `190gr` |

| **Conexão** | USB (via servidor de impressão no PC) |ImpressaoEtiquetas.adicionarLote('bobina', bobinasRemessa);

### Formato da Linha de Produto

| **Tamanho da Etiqueta** | 60mm x 30mm |```

**Tecido Normal:**

```| **Código de Barras** | Code 128 |

{COR} {LARGURA}cm {BAINHA} {GRAMATURA}gr

```| **Altura do Código** | 10mm (padrão) / 15mm (locação) |### Seleção Visual na Tela

Exemplo: `Preta/Prata 190cm Cano/Cano 190gr`

| **Margens** | Sem margens (conteúdo centralizado) |

**Tecido Bando Y:**

```Para permitir seleção visual de múltiplos itens:

{COR} {LM}x{LY}x{LY}cm {GRAMATURA}gr

```### Arquitetura de Impressão

Exemplo: `Preta/Prata 220x80x80cm 190gr`

``````javascript

---

App Mobile → API Railway → PC Local (polling 5s) → Elgin L42 (USB)// 1. Adicionar checkbox em cada linha da tabela

## 1. Bobina

```const checkboxHtml = ImpressaoEtiquetas.checkboxSelecaoHtml(bobina.id);

### Código

```

BOB-{LOJA}-{000000}

```### Preview Visual// 2. Adicionar barra de ações de lote (aparece quando há seleção)

Exemplo: `BOB-PLA-000001` (14 caracteres)

Arquivo: `public/preview-etiquetas.html`const barraHtml = ImpressaoEtiquetas.barraAcoesLoteHtml();

### Layout Visual (60x30mm)

```document.getElementById('container').insertAdjacentHTML('afterbegin', barraHtml);

┌──────────────────────────────────────────────────────────┐

│                    BOB-PLA-000001                        │ 6mm  - Código---

│       ║║║║║║║║║║║║║║║║║║║║║║║║║║║║║║║║║║║║║║║           │ 10mm - Barcode

│         Preta/Prata 190cm Cano/Cano 190gr                │ 7mm  - Produto// 3. Inicializar eventos de seleção

│           PROPEX | ABC-1234 | 150,00m                    │ 7mm  - Detalhes

└──────────────────────────────────────────────────────────┘## 📏 Regras de MedidasImpressaoEtiquetas.inicializarSelecaoLote();

```



### Campos da Linha 4 (Detalhes)

| Campo | Descrição | Obrigatório |### Unidades Obrigatórias// 4. Ações disponíveis na barra

|-------|-----------|-------------|

| Fabricante | Nome do fornecedor | Sempre |ImpressaoEtiquetas.imprimirSelecionados();  // Imprimir agora

| Placa | ID do cliente | Se houver |

| Metragem | Total em metros | Sempre || Tipo | Unidade | Formato | Exemplo |ImpressaoEtiquetas.adicionarSelecionadosAFila();  // Adicionar à fila



---|------|---------|---------|---------|```



## 2. Retalho| **Largura** | cm | Número inteiro + "cm" | `190cm` |



### Código| **Comprimento** | m | Decimal 2 casas + "m" | `150,00m` |### Comportamento

```

RET-{LOJA}-{000000}| **Gramatura** | gr | Número inteiro + "gr" | `190gr` |

```

Exemplo: `RET-PLA-000001`| Função | Descrição |



### Layout Visual (60x30mm)### Formato da Linha de Produto|--------|-----------|

```

┌──────────────────────────────────────────────────────────┐| `imprimirLote(tipo, ids)` | Abre janela com todas etiquetas para impressão única |

│                    RET-PLA-000001                        │ 6mm  - Código

│       ║║║║║║║║║║║║║║║║║║║║║║║║║║║║║║║║║║║║║║║           │ 10mm - Barcode**Tecido Normal:**| `adicionarLote(tipo, ids)` | Adiciona todas à fila (status pendente) |

│         Preta/Prata 190cm Cano/Cano 190gr                │ 7mm  - Produto

│                  PROPEX | 35,50m                         │ 7mm  - Detalhes```| `checkboxSelecaoHtml(id)` | Gera HTML do checkbox para linha |

└──────────────────────────────────────────────────────────┘

```{COR} {LARGURA}cm {BAINHA} {GRAMATURA}gr| `barraAcoesLoteHtml()` | Barra flutuante com contador e botões |



> **Diferença da Bobina:** Retalho NÃO exibe placa na etiqueta```| `imprimirSelecionados()` | Imprime itens marcados |



---Exemplo: `Preta/Prata 190cm Cano/Cano 190gr`| `inicializarSelecaoLote()` | Configura eventos de seleção |



## 3. Corte



### Código**Tecido Bando Y:**### Fluxo de Recebimento de Remessa

```

COR-{LOJA}-{PDC}-{00}```

```

Exemplo: `COR-PLA-001-01`{COR} {LM}x{LY}x{LY}cm {GRAMATURA}gr```



### Layout Visual (60x30mm)```1. Bobinas cadastradas no sistema

```

┌──────────────────────────────────────────────────────────┐Exemplo: `Preta/Prata 220x80x80cm 190gr`2. Listar bobinas da remessa (filtro por data/NF)

│                    COR-PLA-001-01                        │ 6mm  - Código

│       ║║║║║║║║║║║║║║║║║║║║║║║║║║║║║║║║║║║║║║║           │ 10mm - Barcode3. Marcar checkbox "Selecionar Todos" 

│         Preta/Prata 190cm Cano/Cano 190gr                │ 7mm  - Produto

│           25,00m | JOÃO SILVA | AV-03                    │ 7mm  - Detalhes> **Nota:** No Bando Y, `LM` = Largura Maior, `LY` = Largura Y (repete 2x pois as "pernas" do Y têm mesma medida)4. Clicar "Imprimir Selecionados"

└──────────────────────────────────────────────────────────┘

```5. Janela abre com todas etiquetas



------6. Ctrl+P → Impressora Elgin L42 Pro Full



## 4. Locação```



### Código## 1. Bobina

```

{0000}-{X}-{0000}---

```

Exemplo: `0001-A-0001`### Código



### Layout Visual (60x30mm) - SIMPLIFICADO 50/50```## 📝 Histórico de Alterações[Retalho](#2-retalho)

```

┌──────────────────────────────────────────────────────────┐BOB-{LOJA}-{000000}5. [Corte](#3-corte)

│                                                          │

│                    0001-A-0001                           │ 15mm - Código GRANDE```6. [Locação](#4-locação)

│                                                          │

├──────────────────────────────────────────────────────────┤Exemplo: `BOB-PLA-000001` (14 caracteres)7. [Bando Y (Variação)](#5-bando-y-variação)

│       ║║║║║║║║║║║║║║║║║║║║║║║║║║║║║║║║║║║║║║║           │

│       ║║║║║║║║║║║║║║║║║║║║║║║║║║║║║║║║║║║║║║║           │ 15mm - Barcode GRANDE

└──────────────────────────────────────────────────────────┘

```### Layout Visual (60x30mm)---



> **Diferença:** Locações NÃO são cadastradas no sistema. São códigos livres digitados quando necessário.```



---┌──────────────────────────────────────────────────────────┐## 🖨️ Configurações Gerais



## 5. Bando Y (Variação)│                    BOB-PLA-000001                        │ 6mm  - Código



Bando Y é um tipo especial de tecido com formato em "Y". Aplica-se a Bobina, Retalho e Corte.│       ║║║║║║║║║║║║║║║║║║║║║║║║║║║║║║║║║║║║║║║           │ 10mm - Barcode| Parâmetro | Valor |



### Diferença na Linha de Produto│         Preta/Prata 190cm Cano/Cano 190gr                │ 7mm  - Produto|-----------|-------|



**Normal:**│           PROPEX | ABC-1234 | 150,00m                    │ 7mm  - Detalhes| **Impressora** | Elgin L42 Pro Full |

```

Preta/Prata 190cm Cano/Cano 190gr└──────────────────────────────────────────────────────────┘| **Conexão** | USB (via servidor de impressão no PC) |

```

```| **Tamanho da Etiqueta** | 60mm x 30mm |

**Bando Y:**

```| **Código de Barras** | Code 128 |

Preta/Prata 220x80x80cm 190gr

```### Especificações por Linha| **Altura do Código** | 10mm (padrão) / 15mm (locação) |



> **Nota:** O Bando Y NÃO tem bainha, por isso não aparece "Cano/Cano"| **Margens** | Sem margens (conteúdo centralizado) |



---| Linha | Conteúdo | Altura | Fonte |



## Modo Teste|-------|----------|--------|-------|### Arquitetura de Impressão



Durante desenvolvimento/implantação, ative o **Modo Teste** para visualizar etiquetas sem impressora física.| 1 | Código da bobina | 6mm | Courier, Negrito, 14px |```



### Ativar Modo Teste| 2 | Code 128 (sem texto) | 10mm | - |App Mobile → API Railway → PC Local (polling 5s) → Elgin L42 (USB)



No console do navegador ou no início do script:| 3 | Produto | 7mm | Arial, 10px |```

```javascript

ImpressaoEtiquetas.MODO_TESTE = true;| 4 | Detalhes | 7mm | Arial, Negrito, 10px |

```

### Preview Visual

### Comportamento

### Campos da Linha 3 (Produto)Arquivo: `public/preview-etiquetas.html`

| Modo | Ação ao Imprimir |

|------|------------------|| Campo | Descrição | Exemplo |

| Normal | Abre janela e dispara impressão automaticamente |

| Teste | Abre janela com preview visual, botões manuais ||-------|-----------|---------|---



### O que o Modo Teste Faz| Cor(es) | Nome das cores | `Preta/Prata` |



1. **Ao adicionar à fila**: Abre janela mostrando a etiqueta| Largura | Em centímetros | `190cm` |## 📏 Regras de Medidas

2. **Ao imprimir direto**: Mostra preview visual ao invés de imprimir

3. **Em lotes**: Mostra todas as etiquetas com header informativo| Bainha | Tipo acabamento | `Cano/Cano` |



### Visual do Modo Teste| Gramatura | Peso g/m² | `190gr` |### Unidades Obrigatórias



```

┌─────────────────────────────────────────────┐

│  🧪 MODO TESTE                              │### Campos da Linha 4 (Detalhes)| Tipo | Unidade | Formato | Exemplo |

│  Simulação de impressão - 14:32:05          │

├─────────────────────────────────────────────┤| Campo | Descrição | Obrigatório ||------|---------|---------|---------|

│  Tipo: bobina | Código: BOB-PLA-000001      │

│  Quantidade: 1                               │|-------|-----------|-------------|| **Largura** | cm | Número inteiro + "cm" | `190cm` |

├─────────────────────────────────────────────┤

│                                             │| Fabricante | Nome do fornecedor | ✅ Sempre || **Comprimento** | m | Decimal 2 casas + "m" | `150,00m` |

│    ┌─────────────────────────────────┐     │

│    │     BOB-PLA-000001              │     │| Placa | ID do cliente | ⚠️ Se houver || **Gramatura** | gr | Número inteiro + "gr" | `190gr` |

│    │     ║║║║║║║║║║║║║║║║║          │     │

│    │  Preta/Prata 190cm 190gr        │     │| Metragem | Total em metros | ✅ Sempre |

│    │     PROPEX | 150,00m            │     │

│    └─────────────────────────────────┘     │### Formato da Linha de Produto

│                                             │

│  [🖨️ Testar Impressão]  [✖ Fechar]         │### Variação: Sem Placa

└─────────────────────────────────────────────┘

``````**Tecido Normal:**



### Desativar│           SANSUY | 200,00m                               │```

```javascript

ImpressaoEtiquetas.MODO_TESTE = false;```{COR} {LARGURA}cm {BAINHA} {GRAMATURA}gr

```

Se não houver placa, exibir apenas: `FABRICANTE | METRAGEM````

---

Exemplo: `Preta/Prata 190cm Cano/Cano 190gr`

## Impressão em Lote

---

### Cenário de Uso

**Tecido Bando Y:**

Quando uma remessa de bobinas chega (10-15 bobinas), é necessário imprimir todas as etiquetas de uma vez.

## 2. Retalho```

### Uso Programático

{COR} {LM}x{LY}x{LY}cm {GRAMATURA}gr

```javascript

// Método 1: Imprimir lote diretamente### Código```

const ids = [101, 102, 103, 104, 105];

ImpressaoEtiquetas.imprimirLote('bobina', ids);```Exemplo: `Preta/Prata 220x80x80cm 190gr`



// Método 2: Adicionar lote à filaRET-{LOJA}-{000000}

ImpressaoEtiquetas.adicionarLote('bobina', ids);

``````> **Nota:** No Bando Y, `LM` = Largura Maior, `LY` = Largura Y (repete 2x pois as "pernas" do Y têm mesma medida)



### Seleção Visual na TelaExemplo: `RET-PLA-000001` (14 caracteres)



```javascript---

// 1. Adicionar checkbox em cada linha

const checkboxHtml = ImpressaoEtiquetas.checkboxSelecaoHtml('bobina', id);### Layout Visual (60x30mm)



// 2. Adicionar barra de ações```## 1. Bobina

const barraHtml = ImpressaoEtiquetas.barraAcoesLoteHtml();

┌──────────────────────────────────────────────────────────┐

// 3. Inicializar eventos

ImpressaoEtiquetas.inicializarSelecaoLote();│                    RET-PLA-000001                        │ 6mm  - Código### Código



// 4. Ações disponíveis│       ║║║║║║║║║║║║║║║║║║║║║║║║║║║║║║║║║║║║║║║           │ 10mm - Barcode```

ImpressaoEtiquetas.imprimirSelecionados();

ImpressaoEtiquetas.adicionarSelecionadosAFila();│         Preta/Prata 190cm Cano/Cano 190gr                │ 7mm  - ProdutoBOB-{LOJA}-{000000}

```

│                  PROPEX | 35,50m                         │ 7mm  - Detalhes```

### Funções Disponíveis

└──────────────────────────────────────────────────────────┘Exemplo: `BOB-PLA-000001` (14 caracteres)

| Função | Descrição |

|--------|-----------|```

| `imprimirLote(tipo, ids)` | Abre janela com todas etiquetas |

| `adicionarLote(tipo, ids)` | Adiciona todas à fila |### Layout Visual (60x30mm)

| `checkboxSelecaoHtml(tipo, id)` | HTML do checkbox |

| `barraAcoesLoteHtml()` | Barra com contador e botões |### Especificações por Linha```

| `imprimirSelecionados()` | Imprime marcados |

| `inicializarSelecaoLote()` | Configura eventos |┌──────────────────────────────────────────────────────────┐



---| Linha | Conteúdo | Altura | Fonte |│                    BOB-PLA-000001                        │ 6mm  - Código



## Integração no Sistema|-------|----------|--------|-------|│       ║║║║║║║║║║║║║║║║║║║║║║║║║║║║║║║║║║║║║║║           │ 10mm - Barcode



> **REGRA:** Toda impressão de etiqueta deve usar o módulo `ImpressaoEtiquetas`.| 1 | Código do retalho | 6mm | Courier, Negrito, 14px |│         Preta/Prata 190cm Cano/Cano 190gr                │ 7mm  - Produto



### Dependências| 2 | Code 128 (sem texto) | 10mm | - |│           PROPEX | ABC-1234 | 150,00m                    │ 7mm  - Detalhes



```html| 3 | Produto (herdado da bobina) | 7mm | Arial, 10px |└──────────────────────────────────────────────────────────┘

<!-- Bootstrap 5 (para modal) -->

<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>| 4 | Detalhes | 7mm | Arial, Negrito, 10px |```



<!-- JsBarcode (para Code 128) -->

<script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>

### Campos da Linha 4 (Detalhes)### Especificações por Linha

<!-- Módulo de Impressão -->

<script src="/js/impressao-etiquetas.js"></script>| Campo | Descrição | Obrigatório |

```

|-------|-----------|-------------|| Linha | Conteúdo | Altura | Fonte |

### Uso Básico

| Fabricante | Herdado da bobina | ✅ Sempre ||-------|----------|--------|-------|

```javascript

// Abre modal com preview| Metragem | Metros restantes | ✅ Sempre || 1 | Código da bobina | 6mm | Courier, Negrito, 14px |

ImpressaoEtiquetas.abrirModal('bobina', 123);

ImpressaoEtiquetas.abrirModal('retalho', 456);| 2 | Code 128 (sem texto) | 10mm | - |

ImpressaoEtiquetas.abrirModal('corte', 789);

ImpressaoEtiquetas.abrirModal('locacao', 10);> **Diferença da Bobina:** Retalho **NÃO exibe placa** na etiqueta (apenas no banco de dados)| 3 | Produto | 7mm | Arial, 10px |

```

| 4 | Detalhes | 7mm | Arial, Negrito, 10px |

### Em Botões de Tabela

---

```javascript

`<button class="btn btn-sm btn-secondary" ### Campos da Linha 3 (Produto)

        onclick="ImpressaoEtiquetas.abrirModal('bobina', ${id})">

    🖨️## 3. Corte| Campo | Descrição | Exemplo |

</button>`

```|-------|-----------|---------|



### O Que NÃO Fazer### Código| Cor(es) | Nome das cores | `Preta/Prata` |



```javascript```| Largura | Em centímetros | `190cm` |

// ❌ Nunca criar implementação própria

window.open('minhaEtiqueta.html');COR-{LOJA}-{PDC}-{00}| Bainha | Tipo acabamento | `Cano/Cano` |



// ❌ Nunca usar QR Code (é Code 128!)```| Gramatura | Peso g/m² | `190gr` |

new QRCode(element, codigo);

Exemplo: `COR-PLA-001-01` (14 caracteres)

// ❌ Nunca usar arquivo legado

import { imprimirEtiquetaBobina } from './impressora.js';### Campos da Linha 4 (Detalhes)

```

### Layout Visual (60x30mm)| Campo | Descrição | Obrigatório |

```javascript

// ✅ CORRETO - Sempre usar o módulo```|-------|-----------|-------------|

ImpressaoEtiquetas.abrirModal('bobina', id);

```┌──────────────────────────────────────────────────────────┐| Fabricante | Nome do fornecedor | ✅ Sempre |



---│                    COR-PLA-001-01                        │ 6mm  - Código| Placa | ID do cliente | ⚠️ Se houver |



## Histórico de Alterações│       ║║║║║║║║║║║║║║║║║║║║║║║║║║║║║║║║║║║║║║║           │ 10mm - Barcode| Metragem | Total em metros | ✅ Sempre |



| Data | Alteração |│         Preta/Prata 190cm Cano/Cano 190gr                │ 7mm  - Produto

|------|-----------|

| 11/12/2025 | Documento criado |│           25,00m | JOÃO SILVA | AV-03                    │ 7mm  - Detalhes### Variação: Sem Placa

| 11/12/2025 | Adicionada seção Modo Teste |

| 11/12/2025 | Adicionada seção Impressão em Lote |└──────────────────────────────────────────────────────────┘```


```│           SANSUY | 200,00m                               │

```

### Especificações por LinhaSe não houver placa, exibir apenas: `FABRICANTE | METRAGEM`



| Linha | Conteúdo | Altura | Fonte |---

|-------|----------|--------|-------|

| 1 | Código do corte | 6mm | Courier, Negrito, 14px |## 2. Retalho

| 2 | Code 128 (sem texto) | 10mm | - |

| 3 | Produto (do item do plano) | 7mm | Arial, 10px |### Código

| 4 | Detalhes do pedido | 7mm | Arial, Negrito, 10px |```

RET-{LOJA}-{000000}

### Campos da Linha 4 (Detalhes)```

| Campo | Descrição | Exemplo |Exemplo: `RET-PLA-000001` (14 caracteres)

|-------|-----------|---------|

| Metragem | Metros cortados | `25,00m` |### Layout Visual (60x30mm)

| Cliente | Nome do cliente | `JOÃO SILVA` |```

| Aviário | Identificação | `AV-03` |┌──────────────────────────────────────────────────────────┐

│                    RET-PLA-000001                        │ 6mm  - Código

---│       ║║║║║║║║║║║║║║║║║║║║║║║║║║║║║║║║║║║║║║║           │ 10mm - Barcode

│         Preta/Prata 190cm Cano/Cano 190gr                │ 7mm  - Produto

## 4. Locação│                  PROPEX | 35,50m                         │ 7mm  - Detalhes

└──────────────────────────────────────────────────────────┘

### Código```

```

{0000}-{X}-{0000}### Especificações por Linha

```

Exemplo: `0001-A-0001` (11 caracteres)| Linha | Conteúdo | Altura | Fonte |

|-------|----------|--------|-------|

### Layout Visual (60x30mm) - **SIMPLIFICADO 50/50**| 1 | Código do retalho | 6mm | Courier, Negrito, 14px |

```| 2 | Code 128 (sem texto) | 10mm | - |

┌──────────────────────────────────────────────────────────┐| 3 | Produto (herdado da bobina) | 7mm | Arial, 10px |

│                                                          │| 4 | Detalhes | 7mm | Arial, Negrito, 10px |

│                    0001-A-0001                           │ 15mm - Código GRANDE

│                                                          │### Campos da Linha 4 (Detalhes)

├──────────────────────────────────────────────────────────┤| Campo | Descrição | Obrigatório |

│       ║║║║║║║║║║║║║║║║║║║║║║║║║║║║║║║║║║║║║║║           │|-------|-----------|-------------|

│       ║║║║║║║║║║║║║║║║║║║║║║║║║║║║║║║║║║║║║║║           │ 15mm - Barcode GRANDE| Fabricante | Herdado da bobina | ✅ Sempre |

└──────────────────────────────────────────────────────────┘| Metragem | Metros restantes | ✅ Sempre |

```

> **Diferença da Bobina:** Retalho **NÃO exibe placa** na etiqueta (apenas no banco de dados)

### Especificações

---

| Linha | Conteúdo | Altura | Fonte |

|-------|----------|--------|-------|## 3. Corte

| 1 | Código da locação | 15mm (50%) | Courier, Negrito, **26px** |

| 2 | Code 128 (sem texto) | 15mm (50%) | Altura 45px |### Código

```

> **Diferença:** Layout mais simples com apenas 2 elementos, ambos grandes para fácil visualização no galpão.COR-{LOJA}-{PDC}-{00}

```

### Componentes do CódigoExemplo: `COR-PLA-001-01` (14 caracteres)

| Campo | Descrição | Formato |

|-------|-----------|---------|### Layout Visual (60x30mm)

| SETOR | Área do galpão | 4 dígitos (0001-9999) |```

| CORREDOR | Identificador | 1 letra (A-Z) |┌──────────────────────────────────────────────────────────┐

| POSIÇÃO | Local na prateleira | 4 dígitos (0001-9999) |│                    COR-PLA-001-01                        │ 6mm  - Código

│       ║║║║║║║║║║║║║║║║║║║║║║║║║║║║║║║║║║║║║║║           │ 10mm - Barcode

---│         Preta/Prata 190cm Cano/Cano 190gr                │ 7mm  - Produto

│           25,00m | JOÃO SILVA | AV-03                    │ 7mm  - Detalhes

## 5. Bando Y (Variação)└──────────────────────────────────────────────────────────┘

```

> **Bando Y** é um tipo especial de tecido com formato em "Y". Aplica-se a Bobina, Retalho e Corte.

### Especificações por Linha

### Diferença na Linha de Produto

| Linha | Conteúdo | Altura | Fonte |

**Normal:**|-------|----------|--------|-------|

```| 1 | Código do corte | 6mm | Courier, Negrito, 14px |

Preta/Prata 190cm Cano/Cano 190gr| 2 | Code 128 (sem texto) | 10mm | - |

```| 3 | Produto (do item do plano) | 7mm | Arial, 10px |

| 4 | Detalhes do pedido | 7mm | Arial, Negrito, 10px |

**Bando Y:**

```### Campos da Linha 4 (Detalhes)

Preta/Prata 220x80x80cm 190gr| Campo | Descrição | Exemplo |

```|-------|-----------|---------|

| Metragem | Metros cortados | `25,00m` |

### Formato das Medidas Bando Y| Cliente | Nome do cliente | `JOÃO SILVA` |

```| Aviário | Identificação | `AV-03` |

{LARGURA_MAIOR}x{LARGURA_Y}x{LARGURA_Y}cm

```---



| Campo | Descrição | Exemplo |## 4. Locação

|-------|-----------|---------|

| LARGURA_MAIOR | Parte maior do Y | `220` |### Código

| LARGURA_Y | "Pernas" do Y (repete 2x) | `80` |```

{0000}-{X}-{0000}

### Exemplos```

Exemplo: `0001-A-0001` (11 caracteres)

| Tipo | Linha de Produto |

|------|------------------|### Layout Visual (60x30mm) - **SIMPLIFICADO 50/50**

| Bobina Bando Y | `Preta/Prata 220x80x80cm 190gr` |```

| Retalho Bando Y | `Azul/Branca 250x100x100cm 180gr` |┌──────────────────────────────────────────────────────────┐

| Corte Bando Y | `Preta/Prata 220x80x80cm 190gr` |│                                                          │

│                    0001-A-0001                           │ 15mm - Código GRANDE

> **Nota:** O Bando Y **NÃO tem bainha**, por isso não aparece o campo "Cano/Cano" etc.│                                                          │

├──────────────────────────────────────────────────────────┤

---│       ║║║║║║║║║║║║║║║║║║║║║║║║║║║║║║║║║║║║║║║           │

│       ║║║║║║║║║║║║║║║║║║║║║║║║║║║║║║║║║║║║║║║           │ 15mm - Barcode GRANDE

## 📊 Resumo Visual└──────────────────────────────────────────────────────────┘

```

| Etiqueta | Layout | Linhas | Barcode |

|----------|--------|--------|---------|### Especificações

| **Bobina** | 4 linhas | Código + Barcode + Produto + Detalhes | 10mm |

| **Retalho** | 4 linhas | Código + Barcode + Produto + Detalhes | 10mm || Linha | Conteúdo | Altura | Fonte |

| **Corte** | 4 linhas | Código + Barcode + Produto + Detalhes | 10mm ||-------|----------|--------|-------|

| **Locação** | 2 linhas (50/50) | Código + Barcode | 15mm || 1 | Código da locação | 15mm (50%) | Courier, Negrito, **26px** |

| 2 | Code 128 (sem texto) | 15mm (50%) | Altura 45px |

---

> **Diferença:** Layout mais simples com apenas 2 elementos, ambos grandes para fácil visualização no galpão.

## 📦 Impressão em Lote

### Componentes do Código

### Cenário de Uso| Campo | Descrição | Formato |

|-------|-----------|---------|

Quando uma remessa de bobinas chega (10-15 bobinas), é necessário imprimir todas as etiquetas de uma vez:| SETOR | Área do galpão | 4 dígitos (0001-9999) |

| CORREDOR | Identificador | 1 letra (A-Z) |

```javascript| POSIÇÃO | Local na prateleira | 4 dígitos (0001-9999) |

// Método 1: Array de IDs (bobinas de uma remessa)

const bobinasRemessa = [101, 102, 103, 104, 105];---

ImpressaoEtiquetas.imprimirLote('bobina', bobinasRemessa);

## 5. Bando Y (Variação)

// Método 2: Adicionar lote à fila (impressão posterior)

ImpressaoEtiquetas.adicionarLote('bobina', bobinasRemessa);> **Bando Y** é um tipo especial de tecido com formato em "Y". Aplica-se a Bobina, Retalho e Corte.

```

### Diferença na Linha de Produto

### Seleção Visual na Tela

**Normal:**

Para permitir seleção visual de múltiplos itens:```

Preta/Prata 190cm Cano/Cano 190gr

```javascript```

// 1. Adicionar checkbox em cada linha da tabela

const checkboxHtml = ImpressaoEtiquetas.checkboxSelecaoHtml(bobina.id);**Bando Y:**

```

// 2. Adicionar barra de ações de lote (aparece quando há seleção)Preta/Prata 220x80x80cm 190gr

const barraHtml = ImpressaoEtiquetas.barraAcoesLoteHtml();```

document.getElementById('container').insertAdjacentHTML('afterbegin', barraHtml);

### Formato das Medidas Bando Y

// 3. Inicializar eventos de seleção```

ImpressaoEtiquetas.inicializarSelecaoLote();{LARGURA_MAIOR}x{LARGURA_Y}x{LARGURA_Y}cm

```

// 4. Ações disponíveis na barra

ImpressaoEtiquetas.imprimirSelecionados();  // Imprimir agora| Campo | Descrição | Exemplo |

ImpressaoEtiquetas.adicionarSelecionadosAFila();  // Adicionar à fila|-------|-----------|---------|

```| LARGURA_MAIOR | Parte maior do Y | `220` |

| LARGURA_Y | "Pernas" do Y (repete 2x) | `80` |

### Comportamento

### Exemplos

| Função | Descrição |

|--------|-----------|| Tipo | Linha de Produto |

| `imprimirLote(tipo, ids)` | Abre janela com todas etiquetas para impressão única ||------|------------------|

| `adicionarLote(tipo, ids)` | Adiciona todas à fila (status pendente) || Bobina Bando Y | `Preta/Prata 220x80x80cm 190gr` |

| `checkboxSelecaoHtml(id)` | Gera HTML do checkbox para linha || Retalho Bando Y | `Azul/Branca 250x100x100cm 180gr` |

| `barraAcoesLoteHtml()` | Barra flutuante com contador e botões || Corte Bando Y | `Preta/Prata 220x80x80cm 190gr` |

| `imprimirSelecionados()` | Imprime itens marcados |

| `inicializarSelecaoLote()` | Configura eventos de seleção |> **Nota:** O Bando Y **NÃO tem bainha**, por isso não aparece o campo "Cano/Cano" etc.



### Fluxo de Recebimento de Remessa---



```## 📊 Resumo Visual

1. Bobinas cadastradas no sistema

2. Listar bobinas da remessa (filtro por data/NF)| Etiqueta | Layout | Linhas | Barcode |

3. Marcar checkbox "Selecionar Todos" |----------|--------|--------|---------|

4. Clicar "Imprimir Selecionados"| **Bobina** | 4 linhas | Código + Barcode + Produto + Detalhes | 10mm |

5. Janela abre com todas etiquetas| **Retalho** | 4 linhas | Código + Barcode + Produto + Detalhes | 10mm |

6. Ctrl+P → Impressora Elgin L42 Pro Full| **Corte** | 4 linhas | Código + Barcode + Produto + Detalhes | 10mm |

```| **Locação** | 2 linhas (50/50) | Código + Barcode | 15mm |



------



## 🔗 Integração no Sistema## � Integração no Sistema



> **REGRA:** Toda impressão de etiqueta no sistema deve usar o módulo `ImpressaoEtiquetas`.> **REGRA:** Toda impressão de etiqueta no sistema deve usar o módulo `ImpressaoEtiquetas`.

> Ver `docs/ARQUITETURA.md` seção "Sistema de Impressão" para arquitetura completa.> Ver `docs/ARQUITETURA.md` seção "Sistema de Impressão" para arquitetura completa.



### Dependências Necessárias### Dependências Necessárias



Adicione no HTML antes do `</body>`:Adicione no HTML antes do `</body>`:



```html```html

<!-- Bootstrap 5 (para modal) --><!-- Bootstrap 5 (para modal) -->

<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script><script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>



<!-- JsBarcode (para Code 128) --><!-- JsBarcode (para Code 128) -->

<script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script><script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>



<!-- Módulo de Impressão (OBRIGATÓRIO) --><!-- Módulo de Impressão (OBRIGATÓRIO) -->

<script src="/js/impressao-etiquetas.js"></script><script src="/js/impressao-etiquetas.js"></script>

``````



### Uso Básico### Uso Básico



```javascript```javascript

// Abre modal com preview da etiqueta// Abre modal com preview da etiqueta

ImpressaoEtiquetas.abrirModal('bobina', 123);ImpressaoEtiquetas.abrirModal('bobina', 123);

ImpressaoEtiquetas.abrirModal('retalho', 456);ImpressaoEtiquetas.abrirModal('retalho', 456);

ImpressaoEtiquetas.abrirModal('corte', 789);ImpressaoEtiquetas.abrirModal('corte', 789);

ImpressaoEtiquetas.abrirModal('locacao', 10);ImpressaoEtiquetas.abrirModal('locacao', 10);

``````



### Em Botões de Tabela### Em Botões de Tabela



```javascript```javascript

// Padrão para botões de impressão em listagens// Padrão para botões de impressão em listagens

`<button class="btn btn-sm btn-secondary" `<button class="btn btn-sm btn-secondary" 

        onclick="ImpressaoEtiquetas.abrirModal('bobina', ${id})"         onclick="ImpressaoEtiquetas.abrirModal('bobina', ${id})" 

        title="Imprimir etiqueta">        title="Imprimir etiqueta">

    🖨️    🖨️

</button>`</button>`

``````



### Adicionar à Fila (Sem Modal)### Adicionar à Fila (Sem Modal)



```javascript```javascript

// Adiciona direto à fila sem mostrar modal// Adiciona direto à fila sem mostrar modal

await ImpressaoEtiquetas.adicionar('bobina', 123);await ImpressaoEtiquetas.adicionar('bobina', 123);



// Com quantidade específica// Com quantidade específica

await ImpressaoEtiquetas.adicionar('retalho', 456, 3); // 3 cópiasawait ImpressaoEtiquetas.adicionar('retalho', 456, 3); // 3 cópias

``````



### Tipos Válidos### Tipos Válidos



| Tipo | Descrição | Exemplo de Código || Tipo | Descrição | Exemplo de Código |

|------|-----------|-------------------||------|-----------|-------------------|

| `bobina` | Bobina de lona | `BOB-PLA-000001` || `bobina` | Bobina de lona | `BOB-PLA-000001` |

| `retalho` | Retalho de bobina | `RET-PLA-000001` || `retalho` | Retalho de bobina | `RET-PLA-000001` |

| `corte` | Corte realizado | `COR-PLA-001-01` || `corte` | Corte realizado | `COR-PLA-001-01` |

| `locacao` | Posição no estoque | `0001-A-0001` || `locacao` | Posição no estoque | `0001-A-0001` |



### ⚠️ O Que NÃO Fazer### ⚠️ O Que NÃO Fazer



```javascript```javascript

// ❌ ERRADO - Nunca criar implementação própria de impressão// ❌ ERRADO - Nunca criar implementação própria de impressão

function minhaImpressao() {function minhaImpressao() {

    window.open('minhaEtiqueta.html'); // NÃO!    window.open('minhaEtiqueta.html'); // NÃO!

}}



// ❌ ERRADO - Nunca gerar código de barras em outro lugar// ❌ ERRADO - Nunca gerar código de barras em outro lugar

const qr = new QRCode(element, codigo); // NÃO! Use Code 128const qr = new QRCode(element, codigo); // NÃO! Use Code 128



// ❌ ERRADO - Nunca usar arquivo legado// ❌ ERRADO - Nunca usar arquivo legado

import { imprimirEtiquetaBobina } from './impressora.js'; // OBSOLETO!import { imprimirEtiquetaBobina } from './impressora.js'; // OBSOLETO!

``````



```javascript```javascript

// ✅ CORRETO - Sempre usar o módulo padronizado// ✅ CORRETO - Sempre usar o módulo padronizado

ImpressaoEtiquetas.abrirModal('bobina', id);ImpressaoEtiquetas.abrirModal('bobina', id);

``````



------



## 📝 Histórico de Alterações## �📝 Histórico de Alterações



| Data | Alteração || Data | Alteração |

|------|-----------||------|-----------|

| 11/12/2025 | Documento criado com layout de Bobina || 11/12/2025 | Documento criado com layout de Bobina |

| 11/12/2025 | Adicionados layouts de Retalho, Corte e Locação || 11/12/2025 | Adicionados layouts de Retalho, Corte e Locação |

| 11/12/2025 | Definida variação Bando Y para todos os tipos || 11/12/2025 | Definida variação Bando Y para todos os tipos |

| 11/12/2025 | Padronização de medidas: largura em cm, comprimento em m || 11/12/2025 | Padronização de medidas: largura em cm, comprimento em m |

| 11/12/2025 | Locação simplificada para layout 50/50 (código + barcode) || 11/12/2025 | Locação simplificada para layout 50/50 (código + barcode) |

| 11/12/2025 | Adicionada seção de Integração no Sistema || 11/12/2025 | Adicionada seção de Integração no Sistema |

| 11/12/2025 | Adicionada seção de Impressão em Lote |
