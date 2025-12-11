# Funcionalidades do Sistema - Controle de Bobinas 2.0

> **Documento de referência** para entender o que o sistema faz e como funciona.
> Consulte para entender fluxos de negócio e regras antes de implementar alterações.

---

## 📋 Índice

1. [Visão Geral](#-visão-geral)
2. [Módulos do Sistema](#-módulos-do-sistema)
3. [Fluxos Principais](#-fluxos-principais)
4. [Regras de Negócio](#-regras-de-negócio)
5. [Perfis de Usuário](#-perfis-de-usuário)
6. [Integrações](#-integrações)

---

## 🎯 Visão Geral

### O que é o Sistema?

Sistema de **gestão de estoque de bobinas de lona** para fabricação de cortinas de aviário. Usado por duas empresas:

| Empresa | Cidade | Prefixo | Função |
|---------|--------|---------|--------|
| **Cortinave** | Palotina/PR | `PLA` | Fabricante principal |
| **BN** | Cianorte/PR | `CIA` | Fabricante secundário |

### Conceitos Fundamentais

```
PRODUTO (abstrato)     →    BOBINA (física)     →    CORTE (execução)
Especificação do         Rolo de lona no           Pedaço cortado
tecido (cor, largura,    estoque com               para cliente
gramatura, bainha)       metragem específica       específico
```

**Analogia simples:**
- **Produto** = Receita de um bolo (especificação)
- **Bobina** = Bolo pronto na prateleira (estoque físico)
- **Corte** = Fatia vendida para cliente (consumo)

### Problema que Resolve

1. **Controle de estoque** - Saber quanto tem de cada tipo de lona
2. **Rastreabilidade** - Saber de qual bobina saiu cada corte
3. **Planejamento** - Organizar cortes antes de executar
4. **Operação mobile** - Trabalhadores no galpão usam celular
5. **Impressão de etiquetas** - Identificar materiais fisicamente

---

## 🧩 Módulos do Sistema

### 1. Produtos

**O que é:** Cadastro das especificações de tecido disponíveis.

**Campos principais:**
| Campo | Descrição | Exemplo |
|-------|-----------|---------|
| Código | Identificador único | `PLA-00123` |
| Loja | Empresa dona | Cortinave, BN |
| Cor | Combinação de cores | Preta/Prata |
| Gramatura | Peso do tecido | 190gr |
| Largura | Em centímetros | 190cm |
| Tipo Bainha | Acabamento | Cano/Cano |
| Fabricante | Fornecedor | PROPEX, SANSUY |
| Tipo Tecido | Normal ou especial | Normal, Bando Y |

**Funcionalidades:**
- ✅ Criar produto
- ✅ Listar produtos com filtros
- ✅ Editar produto
- ✅ Desativar produto (não deleta, preserva histórico)
- ✅ Ver bobinas de um produto

**Tela:** `produtos.html`

---

### 2. Bobinas

**O que é:** Gestão dos rolos físicos de lona em estoque.

**Campos principais:**
| Campo | Descrição | Exemplo |
|-------|-----------|---------|
| Código Interno | ID único do sistema | `BOB-PLA-000001` |
| Produto | Qual especificação | Preta/Prata 190cm |
| Metragem Inicial | Quanto veio | 150,00m |
| Metragem Atual | Quanto tem agora | 125,50m |
| Metragem Reservada | Quanto está alocado | 25,00m |
| Placa | ID do cliente/lote | ABC-1234 |
| Nota Fiscal | Documento de entrada | NF-12345 |
| Status | Situação atual | Disponível, Em Uso, Vazia |

**Funcionalidades:**
- ✅ Entrada de bobina (com nota fiscal)
- ✅ Listar bobinas com filtros
- ✅ Ver detalhes da bobina
- ✅ Ver histórico de cortes
- ✅ Gerar etiqueta com código de barras
- ✅ Atualizar placa

**Cálculo de disponibilidade:**
```
Metragem Disponível = Metragem Atual - Metragem Reservada
```

**Tela:** `estoque.html`

---

### 3. Retalhos

**O que é:** Sobras de bobinas após cortes que ainda podem ser usadas.

**Origem:** Quando uma bobina tem material sobrando após um plano de corte ser finalizado, esse material vira um retalho com código próprio.

**Campos principais:**
| Campo | Descrição | Exemplo |
|-------|-----------|---------|
| Código | ID único | `RET-PLA-000001` |
| Bobina Origem | De onde veio | BOB-PLA-000001 |
| Produto | Mesma especificação | Preta/Prata 190cm |
| Metragem | Quanto sobrou | 35,50m |
| Placa | Herdada da bobina | ABC-1234 |
| Status | Situação | Disponível |

**Funcionalidades:**
- ✅ Geração automática (quando bobina é consumida parcialmente)
- ✅ Listar retalhos
- ✅ Usar em novos planos de corte
- ✅ Gerar etiqueta

**Regra importante:** Retalhos são **priorizados** na alocação automática (usar sobras primeiro).

**Tela:** `retalhos.html`

---

### 4. Planos de Corte

**O que é:** Ordens de produção que especificam o que cortar para um cliente.

**Status do plano:**
```
planejamento → em_producao → finalizado
     ↓              ↓            ↓
  Criando       Cortando      Pronto
```

**Campos principais:**
| Campo | Descrição | Exemplo |
|-------|-----------|---------|
| Código | ID único | `PDC-PLA-001` |
| Cliente | Nome do cliente | João Silva |
| Aviário | Identificação | AV-03 |
| Loja | Empresa | Cortinave |
| Status | Fase atual | em_producao |
| Itens | O que cortar | 3 produtos, 75m total |

**Funcionalidades:**
- ✅ Criar plano com múltiplos itens
- ✅ Alocação automática (sistema escolhe bobinas/retalhos)
- ✅ Alocação manual (operador escolhe)
- ✅ Iniciar produção (reserva metragens)
- ✅ Acompanhar progresso
- ✅ Finalizar plano
- ✅ Cancelar plano (libera reservas)

**Tela:** `ordens.html`

---

### 5. Cortes (Mobile)

**O que é:** Execução dos cortes no galpão via app Android.

**Fluxo de um corte:**
```
1. Abrir plano em produção
2. Selecionar item para cortar
3. Escanear QR da bobina/retalho (validação)
4. Informar metragem cortada
5. Tirar foto do medidor (contraprova)
6. Confirmar → Gera código COR-XXXXXX
7. Imprimir etiqueta do corte
```

**Campos do corte:**
| Campo | Descrição | Exemplo |
|-------|-----------|---------|
| Código | ID único | `COR-PLA-001-01` |
| Plano | De qual plano | PDC-PLA-001 |
| Origem | De onde veio | BOB-PLA-000001 |
| Metragem | Quanto cortou | 25,00m |
| Foto Medidor | Prova do corte | foto_123.jpg |
| Operador | Quem cortou | Carlos |

**Funcionalidades:**
- ✅ Listar planos em produção
- ✅ Validar origem por QR code
- ✅ Registrar metragem cortada
- ✅ Upload de foto do medidor
- ✅ Gerar código único do corte
- ✅ Imprimir etiqueta via Bluetooth

**App:** `public/mobile/`

---

### 6. Locações

**O que é:** Posições físicas no estoque onde os planos finalizados são guardados.

**Formato do código:**
```
{SETOR}-{CORREDOR}-{POSIÇÃO}
 0001  -    A     -  0001
```

**Funcionalidades:**
- ✅ Cadastrar locações
- ✅ Gerar etiqueta de locação
- ✅ Associar plano finalizado a locação
- ✅ Escanear QR para encontrar

**Tela:** Integrado em `ordens.html`

---

### 7. Carregamento

**O que é:** Processo de validação na saída para entrega ao cliente.

**Fluxo:**
```
1. Criar carregamento (lista de cortes esperados)
2. Escanear QR de cada corte
3. Sistema valida se pertence ao carregamento
4. Verde = OK / Vermelho = Erro
5. Quando 100% validado → Carregamento finalizado
```

**Funcionalidades:**
- ✅ Criar carregamento
- ✅ Validar cortes por QR
- ✅ Feedback visual (verde/vermelho)
- ✅ Finalizar carregamento
- ✅ Histórico de entregas

---

### 8. Configurações

**O que é:** Cadastros auxiliares do sistema.

**Inclui:**
- ✅ Cores disponíveis
- ✅ Gramaturas disponíveis
- ✅ Obras padrão (templates de pedido)

**Tela:** `configuracoes.html`

---

## 🔄 Fluxos Principais

### Fluxo 1: Entrada de Material

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Receber    │ →   │  Cadastrar  │ →   │   Gerar     │
│  Nota Fiscal│     │   Bobina    │     │  Etiqueta   │
└─────────────┘     └─────────────┘     └─────────────┘
                           │
                    ┌──────┴──────┐
                    │  Informar   │
                    │  Produto,   │
                    │  Metragem,  │
                    │  Placa      │
                    └─────────────┘
```

**Passos:**
1. Receber bobina física + nota fiscal
2. Acessar `estoque.html` → Nova Bobina
3. Selecionar produto, informar metragem, placa
4. Sistema gera código `BOB-XXX-XXXXXX`
5. Imprimir etiqueta e colar na bobina

---

### Fluxo 2: Criação de Plano de Corte

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Receber   │ →   │   Criar     │ →   │  Alocação   │
│   Pedido    │     │   Plano     │     │  Automática │
└─────────────┘     └─────────────┘     └─────────────┘
                           │                   │
                    ┌──────┴──────┐     ┌──────┴──────┐
                    │  Cliente,   │     │  Sistema    │
                    │  Aviário,   │     │  escolhe    │
                    │  Produtos   │     │  bobinas    │
                    └─────────────┘     └─────────────┘
```

**Passos:**
1. Cliente faz pedido (telefone, WhatsApp, etc.)
2. Acessar `ordens.html` → Novo Plano
3. Informar cliente, aviário
4. Adicionar itens (produto + metragem)
5. Sistema calcula se tem estoque
6. Alocação automática seleciona bobinas/retalhos

---

### Fluxo 3: Execução de Cortes (Mobile)

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Iniciar   │ →   │  Escanear   │ →   │  Registrar  │ →   │  Imprimir   │
│  Produção   │     │  QR Bobina  │     │   Corte     │     │  Etiqueta   │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
                           │                   │
                    ┌──────┴──────┐     ┌──────┴──────┐
                    │   Valida    │     │  Metragem   │
                    │   origem    │     │  + Foto     │
                    │   correta   │     │  medidor    │
                    └─────────────┘     └─────────────┘
```

**Passos:**
1. No desktop: Iniciar Produção do plano (reserva metragens)
2. No app mobile: Ver planos em produção
3. Selecionar plano → Ver itens pendentes
4. Selecionar item → Escanear QR da bobina
5. Sistema valida se é a origem correta
6. Informar metragem cortada
7. Tirar foto do medidor (prova)
8. Confirmar → Sistema gera código COR
9. Imprimir etiqueta via Bluetooth
10. Repetir para todos os itens

---

### Fluxo 4: Finalização e Armazenamento

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Todos     │ →   │  Escanear   │ →   │   Plano     │
│   Cortes    │     │  Locação    │     │ Finalizado  │
│   Feitos    │     │  no Estoque │     │             │
└─────────────┘     └─────────────┘     └─────────────┘
```

**Passos:**
1. Todos os itens do plano cortados
2. Escanear QR da locação no estoque
3. Sistema associa plano à locação
4. Plano marcado como "finalizado"
5. Metragens reservadas são liberadas
6. Sobras viram retalhos automaticamente

---

### Fluxo 5: Carregamento para Entrega

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Criar     │ →   │  Escanear   │ →   │  Carregar   │
│ Carregamento│     │  Cada Corte │     │  no Caminhão│
└─────────────┘     └─────────────┘     └─────────────┘
                           │
                    ┌──────┴──────┐
                    │ ✅ Verde =  │
                    │    Correto  │
                    │ ❌ Vermelho │
                    │    = Errado │
                    └─────────────┘
```

**Passos:**
1. Criar carregamento com lista de cortes esperados
2. No momento da carga, escanear QR de cada corte
3. Sistema mostra verde (OK) ou vermelho (errado)
4. Quando 100% validado → Finalizar carregamento
5. Material sai para entrega

---

## ⚖️ Regras de Negócio

### R1: Metragem Reservada

> Quando um plano entra em produção, as metragens são **reservadas** nas bobinas/retalhos.

```
Bobina com 150m → Plano reserva 50m → Disponível = 100m
```

- Reserva acontece ao "Iniciar Produção"
- Reserva é liberada ao "Finalizar" ou "Cancelar"
- Sistema usa **triggers do banco** para sincronizar
- Nunca fazer UPDATE manual em `metragem_reservada`

### R2: Prioridade de Alocação

> Sistema prioriza usar **retalhos** antes de **bobinas novas**.

Ordem de preferência:
1. Retalhos disponíveis (usar sobras primeiro)
2. Bobinas parcialmente usadas (completar)
3. Bobinas cheias (abrir nova)

### R3: Validação de Origem

> Antes de cortar, operador deve escanear QR da bobina para **validar** que é a origem correta.

- Previne erros de cortar material errado
- Garante rastreabilidade
- Registro de quem/quando validou

### R4: Foto do Medidor (Contraprova)

> Todo corte deve ter foto do medidor como **prova** da metragem cortada.

- Obrigatório para registrar corte
- Timestamp automático
- Armazenada no servidor

### R5: Geração de Retalhos

> Quando uma bobina/retalho tem sobra após finalização do plano, vira um **novo retalho** automaticamente.

```
Bobina 150m → Corta 120m → Sobra 30m → Gera RET-XXX-XXXXXX
```

- Herda produto, placa, fabricante da origem
- Código sequencial próprio
- Disponível para novos planos

### R6: Códigos Únicos

> Todo material tem código único e permanente.

| Entidade | Formato | Imutável |
|----------|---------|----------|
| Produto | PLA-00123 | ✅ |
| Bobina | BOB-PLA-000001 | ✅ |
| Retalho | RET-PLA-000001 | ✅ |
| Plano | PDC-PLA-001 | ✅ |
| Corte | COR-PLA-001-01 | ✅ |
| Locação | 0001-A-0001 | ✅ |

**Ver:** `docs/PADRONIZACAO_CODIGOS.md`

### R7: Status de Plano

```
planejamento → em_producao → finalizado
      ↓
  cancelado
```

- **planejamento**: Pode editar, adicionar/remover itens
- **em_producao**: Metragens reservadas, cortes sendo feitos
- **finalizado**: Concluído, sobras viraram retalhos
- **cancelado**: Reservas liberadas, histórico mantido

---

## 👥 Perfis de Usuário

### Escritório (Desktop)

**Quem:** Administração, vendas, gerência

**Responsabilidades:**
- Cadastrar produtos
- Entrada de bobinas (nota fiscal)
- Criar planos de corte
- Iniciar/finalizar produção
- Gerar relatórios
- Configurações do sistema

**Acesso:** Computador com navegador

---

### Galpão (Mobile)

**Quem:** Operadores de corte

**Responsabilidades:**
- Executar cortes
- Validar materiais por QR
- Registrar metragens
- Tirar fotos de contraprova
- Imprimir etiquetas
- Armazenar em locações

**Acesso:** App Android + Impressora Bluetooth

---

### Motorista (Mobile)

**Quem:** Responsável pela entrega

**Responsabilidades:**
- Validar carregamento
- Escanear cortes para conferência
- Confirmar saída

**Acesso:** App Android

---

## 🔌 Integrações

### Impressora Térmica

| Modelo | Conexão | Uso |
|--------|---------|-----|
| **Elgin L42 Pro Full** | USB | Escritório (etiquetas profissionais) |
| **M58-LL** | Bluetooth | Galpão (etiquetas móveis) |

**Etiquetas:**
- 60mm x 30mm
- Código de barras Code 128
- Ver `docs/ESPECIFICACAO_ETIQUETAS.md`

### Câmera do Celular

- Escanear QR codes
- Tirar foto do medidor
- Upload automático

### API Railway

- Backend hospedado na nuvem
- App mobile conecta via HTTPS
- Sincronização em tempo real

---

## 📊 Métricas e Indicadores

### Dashboard (Futuro)

- Total de metragem em estoque
- Metragem por produto
- Planos em produção
- Cortes do dia/semana/mês
- Bobinas com estoque baixo
- Retalhos disponíveis

---

## 📝 Histórico

| Data | Alteração |
|------|-----------|
| 11/12/2025 | Documento criado com funcionalidades atuais |
