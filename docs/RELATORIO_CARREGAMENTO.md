# 📄 Relatório de Carregamento A4

> **Documento de Especificação** - Controle de Bobinas 2.0  
> **Versão:** 1.0 | **Data:** 18/12/2025  
> **Status:** 📋 PLANEJAMENTO

---

## 🎯 Objetivo

Gerar um relatório impresso em formato A4 ao finalizar um carregamento, contendo todos os dados necessários para:
1. Documentação da entrega
2. Conferência pelo motorista/cliente
3. Comprovante físico do carregamento
4. Registro de fotos de contraprova (opcional)

---

## 📐 Layout do Relatório

### Estrutura Visual (A4 - 210x297mm)

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              CORTINAVE / BN                              │   │
│  │          RELATÓRIO DE CARREGAMENTO                       │   │
│  │              CAR-2025-00001                              │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  DADOS DO PLANO                                          │   │
│  │  PDC: PDC-PLA-001       Cliente: GRANJA EXEMPLO          │   │
│  │  Obra: Aviário 3        Data Criação: 15/12/2025         │   │
│  │  Status: ENTREGUE       Data Entrega: 18/12/2025         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  LISTA DE CORTES                                         │   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │  #  │ Código        │ Produto              │ Metragem   │   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │  1  │ COR-PLA-1-1   │ Preta 190cm C/C 190gr│ 25,00m    │   │
│  │  2  │ COR-PLA-1-2   │ Preta 190cm C/C 190gr│ 30,00m    │   │
│  │  3  │ COR-PLA-1-3   │ Branca 200cm A/A 200g│ 15,00m    │   │
│  │  ... │ ...          │ ...                   │ ...       │   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │                            TOTAL GERAL:     │ 150,00m   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  RESUMO POR PRODUTO                                      │   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │  Produto                        │ Qtd Cortes │ Metragem │   │
│  │  Preta 190cm Cano/Cano 190gr    │     5      │  75,00m  │   │
│  │  Branca 200cm Arame/Arame 200gr │     3      │  45,00m  │   │
│  │  Azul 180cm Cano/Arame 180gr    │     2      │  30,00m  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  ASSINATURAS                                             │   │
│  │                                                          │   │
│  │  Responsável Corte: _____________________________        │   │
│  │                                                          │   │
│  │  Motorista: _____________________________________        │   │
│  │                                                          │   │
│  │  Recebido por: __________________________________        │   │
│  │                                                          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Impresso em: 18/12/2025 14:35    v2.6.0                │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📋 Seções do Relatório

### 1. Cabeçalho
| Campo | Descrição | Fonte |
|-------|-----------|-------|
| Logo/Nome Empresa | CORTINAVE ou BN | `planos_corte.loja` |
| Título | "RELATÓRIO DE CARREGAMENTO" | Fixo |
| Código Carregamento | CAR-2025-00001 | `carregamentos.codigo` |

### 2. Dados do Plano
| Campo | Descrição | Fonte |
|-------|-----------|-------|
| Código PDC | PDC-PLA-001 | `planos_corte.codigo_plano` |
| Cliente | Nome do cliente | `planos_corte.cliente` |
| Obra | Nome da obra/aviário | `planos_corte.obra` |
| Data Criação | Data do plano | `planos_corte.data_criacao` |
| Data Entrega | Data de finalização | `carregamentos.data_conclusao` |
| Status | ENTREGUE | `planos_corte.status` |

### 3. Lista de Cortes
| Coluna | Descrição | Fonte |
|--------|-----------|-------|
| # | Número sequencial | Ordem na lista |
| Código | Código do corte | `cortes_realizados.codigo_corte` |
| Produto | Descrição curta | Composição de `cor + largura + bainha + gramatura` |
| Origem | Bobina/Retalho | `cortes_realizados.codigo_origem` |
| Metragem | Metros cortados | `cortes_realizados.metragem_cortada` |

### 4. Resumo por Produto
Agrupamento da lista de cortes por produto com totalizadores.

### 5. Totalizadores
| Campo | Cálculo |
|-------|---------|
| Total de Cortes | COUNT de cortes_realizados |
| Metragem Total | SUM de metragem_cortada |

### 6. Área de Assinaturas
Campos para assinatura manual:
- Responsável pelo corte
- Motorista
- Recebido por (cliente)

### 7. Rodapé
- Data/hora de impressão
- Versão do sistema

---

## 🖨️ Arquitetura de Impressão

### Fluxo Atual (Etiquetas Térmicas)

```
App Mobile → API Railway → Fila Impressão (MySQL) → PC Local (polling) → Elgin L42 (USB)
```

### Fluxo Proposto (Relatório A4)

```
Finalizar Carregamento → API Railway → Gera PDF → Fila Impressão A4 → PC Local → Impressora A4
                                              ou
                              → Download direto pelo usuário
```

---

## 🖥️ Servidor de Impressão Local

### Arquitetura Proposta

```
┌─────────────────────────────────────────────────────────────────┐
│                         PC LOCAL                                │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │           SERVIDOR DE IMPRESSÃO (Node.js)                │   │
│  │                                                          │   │
│  │   ┌─────────────────┐    ┌─────────────────┐            │   │
│  │   │  Polling API    │    │  Gerenciador    │            │   │
│  │   │  (5s interval)  │───▶│  de Filas       │            │   │
│  │   └─────────────────┘    └─────────────────┘            │   │
│  │                                │                         │   │
│  │                    ┌───────────┴───────────┐            │   │
│  │                    ▼                       ▼            │   │
│  │         ┌──────────────────┐   ┌──────────────────┐    │   │
│  │         │ Fila Etiquetas   │   │ Fila Relatórios  │    │   │
│  │         │ (60x30mm)        │   │ (A4)             │    │   │
│  │         └──────────────────┘   └──────────────────┘    │   │
│  │                    │                       │            │   │
│  │                    ▼                       ▼            │   │
│  │         ┌──────────────────┐   ┌──────────────────┐    │   │
│  │         │ Elgin L42 Pro    │   │ Impressora A4    │    │   │
│  │         │ (USB - Térmica)  │   │ (USB/Rede)       │    │   │
│  │         └──────────────────┘   └──────────────────┘    │   │
│  │                                                          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Componentes do Servidor Local

#### 1. Módulo de Polling
- Consulta `GET /api/impressao/pendentes?loja=PLA` a cada 5 segundos
- Filtra por tipo: `etiqueta` ou `relatorio`
- Baixa dados necessários para impressão

#### 2. Gerenciador de Filas
- Fila separada para cada tipo de impressão
- Priorização (etiquetas têm prioridade sobre relatórios)
- Retry em caso de falha

#### 3. Impressora de Etiquetas (existente)
- Elgin L42 Pro Full (USB)
- Formato 60x30mm
- Code 128

#### 4. Impressora de Relatórios (novo)
- Qualquer impressora A4 (USB ou rede)
- PDF gerado pelo servidor
- Formato A4 retrato

---

## 🔧 Implementação Técnica

### Backend (Railway)

#### Novo Endpoint: Gerar Relatório
```javascript
GET /api/carregamento/:id/relatorio

Response: {
    success: true,
    data: {
        carregamento: { ... },
        plano: { ... },
        cortes: [ ... ],
        resumo_produtos: [ ... ],
        totais: { ... }
    }
}
```

#### Novo Endpoint: PDF do Relatório
```javascript
GET /api/carregamento/:id/relatorio/pdf

Response: application/pdf (download)
```

#### Nova Tabela: fila_impressao_relatorios
```sql
CREATE TABLE fila_impressao_relatorios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tipo ENUM('carregamento', 'inventario', 'producao') NOT NULL,
    entidade_id INT NOT NULL,
    loja ENUM('Cortinave', 'BN') NOT NULL,
    status ENUM('pendente', 'impresso', 'erro') DEFAULT 'pendente',
    tentativas INT DEFAULT 0,
    erro_msg TEXT,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_impressao TIMESTAMP NULL
);
```

### Servidor Local (Node.js)

#### Estrutura de Pastas
```
servidor-impressao/
├── package.json
├── config.json           # Configurações (URL API, intervalo polling)
├── src/
│   ├── index.js          # Entry point
│   ├── polling.js        # Consulta API
│   ├── queue.js          # Gerenciamento de filas
│   ├── printers/
│   │   ├── thermal.js    # Impressão etiquetas (Elgin L42)
│   │   └── pdf.js        # Impressão A4 (qualquer impressora)
│   └── utils/
│       └── logger.js     # Logs
└── logs/                 # Arquivos de log
```

#### Configuração (config.json)
```json
{
    "api": {
        "baseUrl": "https://controle-bobinas-20-production.up.railway.app",
        "pollingInterval": 5000,
        "loja": "PLA"
    },
    "printers": {
        "thermal": {
            "name": "Elgin L42 Pro Full",
            "type": "usb"
        },
        "pdf": {
            "name": "HP LaserJet",
            "type": "network",
            "copies": 2
        }
    }
}
```

---

## 📦 Geração de PDF

### Opções de Biblioteca

| Biblioteca | Prós | Contras |
|------------|------|---------|
| **PDFKit** | Leve, controle total | Código verboso |
| **Puppeteer** | HTML → PDF fácil | Pesado (Chrome) |
| **jsPDF** | Frontend/Backend | Menos recursos |
| **pdf-lib** | Edição avançada | Complexo |

**Recomendação:** **Puppeteer** (HTML → PDF com CSS)
- Facilita criar layout bonito com HTML/CSS
- Suporte a tabelas, quebra de página automática
- Pode rodar no servidor Railway ou local

### Exemplo de Template HTML
```html
<!DOCTYPE html>
<html>
<head>
    <style>
        @page { size: A4; margin: 15mm; }
        body { font-family: Arial; font-size: 12pt; }
        .header { text-align: center; margin-bottom: 20px; }
        .section { margin-bottom: 15px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #333; padding: 8px; }
        th { background: #f0f0f0; }
        .assinaturas { margin-top: 30px; }
        .linha-assinatura { 
            border-bottom: 1px solid #333; 
            width: 300px; 
            margin: 20px 0; 
        }
    </style>
</head>
<body>
    <!-- Conteúdo dinâmico -->
</body>
</html>
```

---

## 📅 Fases de Implementação

### Fase 1: Endpoint de Dados (Backend)
- [ ] Criar `GET /api/carregamento/:id/relatorio`
- [ ] Retornar todos os dados necessários em JSON
- [ ] Testar com dados reais

### Fase 2: Geração de PDF (Backend)
- [ ] Instalar Puppeteer no Railway
- [ ] Criar template HTML do relatório
- [ ] Criar `GET /api/carregamento/:id/relatorio/pdf`
- [ ] Testar download de PDF

### Fase 3: Integração no Mobile
- [ ] Botão "Imprimir Relatório" após finalizar carregamento
- [ ] Opção 1: Download PDF no celular
- [ ] Opção 2: Enviar para fila de impressão

### Fase 4: Servidor de Impressão Local
- [ ] Criar projeto Node.js separado
- [ ] Implementar polling para relatórios
- [ ] Integrar com impressora A4
- [ ] Testar impressão automática

### Fase 5: Refinamentos
- [ ] Adicionar fotos de contraprova (opcional)
- [ ] Múltiplas cópias
- [ ] Histórico de relatórios impressos

---

## ❓ Decisões Pendentes

1. **Onde gerar o PDF?**
   - [ ] Railway (centralizado, mais pesado)
   - [ ] Servidor local (descentralizado, mais leve)

2. **Incluir fotos de contraprova?**
   - [ ] Sim, no relatório
   - [ ] Não, apenas lista de cortes
   - [ ] Opcional (checkbox)

3. **Modelo de impressora A4?**
   - Definir junto com cliente (USB ou rede)

4. **Quantas cópias?**
   - [ ] 1 (arquivo digital)
   - [ ] 2 (empresa + cliente)
   - [ ] 3 (empresa + motorista + cliente)

---

## 📝 Próximos Passos

1. ✅ Criar este documento de especificação
2. ⏳ Validar layout com usuário
3. ⏳ Implementar endpoint de dados
4. ⏳ Criar template HTML
5. ⏳ Gerar PDF
6. ⏳ Testar com impressora real

---

*Documento criado em 18/12/2025 - Controle de Bobinas 2.0 v2.6.0*
