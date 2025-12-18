# 📄 Relatório de Carregamento A4

> **Documento de Especificação** - Controle de Bobinas 2.0  
> **Versão:** 1.1 | **Data:** 18/12/2025  
> **Status:** ✅ ESPECIFICADO

---

## 🎯 Objetivo

Gerar um relatório impresso em formato A4 ao finalizar um carregamento, contendo todos os dados necessários para:
1. Documentação da entrega
2. Conferência pelo motorista/cliente
3. Comprovante físico do carregamento

---

## ✅ Decisões Tomadas

| Decisão | Escolha | Motivo |
|---------|---------|--------|
| **Onde gerar PDF** | PC Local | Mais simples, sem Puppeteer no Railway |
| **Incluir fotos** | Não | Relatório mais leve e rápido |
| **Quantidade de vias** | 2 | 1 via motorista + 1 via arquivo loja |

---

## 📐 Layout do Relatório

### Estrutura Visual (A4 - 210x297mm)

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │  CORTINAVE                      ROMANEIO DE CARREGAMENTO      │ │
│  │  Palotina/PR                    CAR-2025-00001                │ │
│  │                                 Data: 18/12/2025              │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │  DADOS DO PLANO DE CORTE                                      │ │
│  ├───────────────────────────────────────────────────────────────┤ │
│  │  Código:     PDC-PLA-001                                      │ │
│  │  Cliente:    GRANJA EXEMPLO LTDA                              │ │
│  │  Obra:       Aviário 3 - Barracão Norte                       │ │
│  │  Cidade:     Toledo/PR                                        │ │
│  │  Cor:        Preta                                            │ │
│  │  Medida:     190cm (Cano/Cano)                                │ │
│  │  Gramatura:  190gr                                            │ │
│  │  Metragem Solicitada: 150,00m                                 │ │
│  │  Observações: Entregar pela manhã, ligar antes                │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │  LISTA DE CORTES                              Via: MOTORISTA  │ │
│  ├────┬─────────────┬────────────────────────┬──────────┬───────┤ │
│  │ #  │ Código      │ Origem                 │ Metragem │  OK   │ │
│  ├────┼─────────────┼────────────────────────┼──────────┼───────┤ │
│  │ 1  │ COR-PLA-1-1 │ BOB-PLA-000123         │  25,00m  │  [ ]  │ │
│  │    │             │ Obs: Ponta irregular   │          │       │ │
│  ├────┼─────────────┼────────────────────────┼──────────┼───────┤ │
│  │ 2  │ COR-PLA-1-2 │ BOB-PLA-000123         │  30,00m  │  [ ]  │ │
│  │    │             │ Obs: -                 │          │       │ │
│  ├────┼─────────────┼────────────────────────┼──────────┼───────┤ │
│  │ 3  │ COR-PLA-1-3 │ RET-PLA-000045         │  15,00m  │  [ ]  │ │
│  │    │             │ Obs: Emendado          │          │       │ │
│  ├────┼─────────────┼────────────────────────┼──────────┼───────┤ │
│  │ 4  │ COR-PLA-1-4 │ BOB-PLA-000125         │  40,00m  │  [ ]  │ │
│  │    │             │ Obs: -                 │          │       │ │
│  ├────┼─────────────┼────────────────────────┼──────────┼───────┤ │
│  │ 5  │ COR-PLA-1-5 │ BOB-PLA-000125         │  40,00m  │  [ ]  │ │
│  │    │             │ Obs: Última do rolo    │          │       │ │
│  ├────┴─────────────┴────────────────────────┼──────────┼───────┤ │
│  │                           TOTAL (5 itens) │ 150,00m  │       │ │
│  └───────────────────────────────────────────┴──────────┴───────┘ │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │  CONFERÊNCIA E ASSINATURAS                                    │ │
│  ├───────────────────────────────────────────────────────────────┤ │
│  │                                                               │ │
│  │  Expedidor: _________________________  Data: ___/___/______   │ │
│  │                                                               │ │
│  │  Motorista: _________________________  Placa: _____________   │ │
│  │                                                               │ │
│  │  ┌─────────────────────────────────────────────────────────┐ │ │
│  │  │  Declaro ter recebido os materiais acima descritos em   │ │ │
│  │  │  perfeitas condições de uso.                            │ │ │
│  │  │                                                         │ │ │
│  │  │  Recebido por: _______________________________________  │ │ │
│  │  │  Data/Hora: ___________________________________________ │ │ │
│  │  └─────────────────────────────────────────────────────────┘ │ │
│  │                                                               │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │  ||||||||||||||||||||||||||||       Impresso: 18/12/25 14:35 │ │
│  │  CAR-2025-00001                                 Sistema v2.6 │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Via 1: MOTORISTA / Via 2: ARQUIVO LOJA
*(Mesma estrutura, apenas indica no canto superior direito)*

---

## 📋 Seções do Relatório

### 1. Cabeçalho
| Campo | Descrição | Fonte |
|-------|-----------|-------|
| Logo/Nome Empresa | CORTINAVE ou BN | `planos_corte.loja` |
| Cidade | Palotina/PR ou Cianorte/PR | Baseado na loja |
| Título | "ROMANEIO DE CARREGAMENTO" | Fixo |
| Código Carregamento | CAR-2025-00001 | `carregamentos.codigo` |
| Data do Carregamento | 18/12/2025 | `carregamentos.data_conclusao` |

### 2. Dados do Plano de Corte
| Campo | Descrição | Fonte |
|-------|-----------|-------|
| Código PDC | PDC-PLA-001 | `planos_corte.codigo_plano` |
| Cliente | Nome do cliente | `planos_corte.cliente` |
| Obra | Nome da obra/aviário | `planos_corte.obra` |
| Cidade | Cidade da entrega | `planos_corte.cidade` |
| Cor | Cor do produto | `planos_corte.cor` |
| Medida | Largura + bainha | `planos_corte.medida` + `planos_corte.bainha` |
| Gramatura | Gramatura do tecido | `planos_corte.gramatura` |
| Metragem Solicitada | Total do PDC | `planos_corte.metragem_total` |
| Observações | Obs gerais do PDC | `planos_corte.observacoes` |

### 3. Lista de Cortes (com checkbox OK)
| Coluna | Descrição | Fonte |
|--------|-----------|-------|
| # | Número sequencial | Ordem na lista |
| Código | Código do corte | `cortes_realizados.codigo_corte` |
| Origem | Bobina/Retalho de onde foi cortado | `cortes_realizados.codigo_origem` |
| Obs | Observações específicas do corte | `cortes_realizados.observacoes` |
| Metragem | Metros cortados | `cortes_realizados.metragem_cortada` |
| OK | **Checkbox para conferência manual** | Campo em branco [ ] |

### 4. Totalizadores
| Campo | Cálculo |
|-------|---------|
| Quantidade de Itens | COUNT de cortes_realizados |
| Metragem Total | SUM de metragem_cortada |

### 5. Área de Conferência e Assinaturas
| Campo | Uso |
|-------|-----|
| Expedidor | Nome + assinatura de quem preparou |
| Motorista | Nome + assinatura + placa do veículo |
| Recebido por | Assinatura do cliente na entrega |
| Data/Hora | Preenchido na entrega |

### 6. Rodapé
- Código de barras do carregamento (para referência)
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

#### Endpoint: Dados do Relatório
```javascript
GET /api/carregamento/:id/relatorio

Response: {
    success: true,
    data: {
        carregamento: {
            id: 1,
            codigo: "CAR-2025-00001",
            data_inicio: "2025-12-18T10:00:00",
            data_conclusao: "2025-12-18T14:30:00",
            status: "finalizado"
        },
        plano: {
            id: 1,
            codigo_plano: "PDC-PLA-001",
            cliente: "GRANJA EXEMPLO LTDA",
            obra: "Aviário 3 - Barracão Norte",
            cidade: "Toledo/PR",
            cor: "Preta",
            medida: "190cm",
            bainha: "Cano/Cano",
            gramatura: "190gr",
            metragem_total: 150.00,
            observacoes: "Entregar pela manhã",
            loja: "Cortinave"
        },
        cortes: [
            {
                sequencial: 1,
                codigo_corte: "COR-PLA-1-1",
                codigo_origem: "BOB-PLA-000123",
                metragem_cortada: 25.00,
                observacoes: "Ponta irregular"
            },
            // ...
        ],
        totais: {
            quantidade_cortes: 5,
            metragem_total: 150.00
        }
    }
}
```

#### Fila de Impressão de Relatórios
```sql
CREATE TABLE fila_impressao_relatorios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tipo ENUM('carregamento', 'inventario', 'producao') NOT NULL,
    entidade_id INT NOT NULL,
    loja ENUM('Cortinave', 'BN') NOT NULL,
    copias INT DEFAULT 2,
    status ENUM('pendente', 'impresso', 'erro') DEFAULT 'pendente',
    tentativas INT DEFAULT 0,
    erro_msg TEXT,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_impressao TIMESTAMP NULL
);
```

### Servidor de Impressão Local (Node.js)

> **PDF gerado localmente** - O servidor local recebe os dados JSON e gera o PDF com Puppeteer

#### Estrutura de Pastas
```
servidor-impressao/
├── package.json
├── config.json              # Configurações
├── src/
│   ├── index.js             # Entry point
│   ├── polling.js           # Consulta API (5s)
│   ├── queue.js             # Gerenciamento de filas
│   ├── printers/
│   │   ├── thermal.js       # Elgin L42 (etiquetas 60x30)
│   │   └── pdf.js           # Impressora A4 (relatórios)
│   ├── templates/
│   │   └── romaneio.html    # Template HTML do relatório
│   └── utils/
│       ├── pdf-generator.js # HTML → PDF com Puppeteer
│       └── logger.js        # Logs
└── logs/
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
            "type": "default",
            "copies": 2
        }
    }
}
```

#### Fluxo de Geração do PDF
```
1. Polling detecta relatório pendente
2. Busca dados: GET /api/carregamento/:id/relatorio
3. Carrega template HTML (romaneio.html)
4. Substitui variáveis pelos dados reais
5. Puppeteer renderiza HTML → PDF
6. Envia PDF para impressora A4 (2 cópias)
7. Marca como impresso na API
```

---

## 📦 Template HTML do Relatório

### Template: romaneio.html
```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <style>
        @page { 
            size: A4; 
            margin: 12mm; 
        }
        * { 
            margin: 0; 
            padding: 0; 
            box-sizing: border-box; 
        }
        body { 
            font-family: Arial, sans-serif; 
            font-size: 11pt; 
            line-height: 1.4;
        }
        
        /* Cabeçalho */
        .header {
            display: flex;
            justify-content: space-between;
            border: 2px solid #000;
            padding: 10px 15px;
            margin-bottom: 15px;
        }
        .header-left { font-weight: bold; }
        .header-left .empresa { font-size: 18pt; }
        .header-left .cidade { font-size: 10pt; color: #666; }
        .header-right { text-align: right; }
        .header-right .titulo { font-size: 14pt; font-weight: bold; }
        .header-right .codigo { font-size: 12pt; }
        .header-right .data { font-size: 10pt; color: #666; }
        
        /* Seções */
        .section {
            border: 1px solid #000;
            margin-bottom: 12px;
        }
        .section-title {
            background: #e0e0e0;
            padding: 5px 10px;
            font-weight: bold;
            border-bottom: 1px solid #000;
        }
        .section-content {
            padding: 10px;
        }
        .section-content p {
            margin-bottom: 5px;
        }
        .section-content .label {
            font-weight: bold;
            display: inline-block;
            width: 160px;
        }
        
        /* Tabela de Cortes */
        table {
            width: 100%;
            border-collapse: collapse;
        }
        th, td {
            border: 1px solid #000;
            padding: 6px 8px;
            text-align: left;
        }
        th {
            background: #e0e0e0;
            font-weight: bold;
        }
        .col-seq { width: 5%; text-align: center; }
        .col-codigo { width: 18%; }
        .col-origem { width: 20%; }
        .col-obs { width: 37%; font-size: 9pt; }
        .col-metragem { width: 12%; text-align: right; }
        .col-ok { width: 8%; text-align: center; }
        .checkbox { 
            width: 14px; 
            height: 14px; 
            border: 1px solid #000; 
            display: inline-block; 
        }
        .obs-row { font-size: 9pt; color: #444; }
        .total-row { font-weight: bold; background: #f5f5f5; }
        
        /* Via */
        .via-indicator {
            position: absolute;
            top: 12mm;
            right: 12mm;
            font-size: 9pt;
            color: #666;
            border: 1px dashed #999;
            padding: 2px 8px;
        }
        
        /* Assinaturas */
        .assinaturas {
            margin-top: 15px;
        }
        .assinatura-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 25px;
        }
        .assinatura-campo {
            flex: 1;
            margin-right: 20px;
        }
        .assinatura-campo:last-child {
            margin-right: 0;
        }
        .linha-assinatura {
            border-bottom: 1px solid #000;
            margin-top: 30px;
            margin-bottom: 3px;
        }
        .assinatura-label {
            font-size: 9pt;
        }
        
        /* Declaração */
        .declaracao {
            border: 1px solid #000;
            padding: 10px;
            margin-top: 10px;
            font-size: 10pt;
        }
        
        /* Rodapé */
        .footer {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border: 1px solid #000;
            padding: 8px;
            margin-top: 15px;
        }
        .footer .barcode {
            font-family: 'Libre Barcode 128', monospace;
            font-size: 36pt;
        }
        .footer .info {
            font-size: 9pt;
            text-align: right;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="via-indicator">Via: {{VIA}}</div>
    
    <div class="header">
        <div class="header-left">
            <div class="empresa">{{EMPRESA}}</div>
            <div class="cidade">{{CIDADE_EMPRESA}}</div>
        </div>
        <div class="header-right">
            <div class="titulo">ROMANEIO DE CARREGAMENTO</div>
            <div class="codigo">{{CODIGO_CARREGAMENTO}}</div>
            <div class="data">Data: {{DATA_CARREGAMENTO}}</div>
        </div>
    </div>
    
    <div class="section">
        <div class="section-title">DADOS DO PLANO DE CORTE</div>
        <div class="section-content">
            <p><span class="label">Código:</span> {{CODIGO_PDC}}</p>
            <p><span class="label">Cliente:</span> {{CLIENTE}}</p>
            <p><span class="label">Obra:</span> {{OBRA}}</p>
            <p><span class="label">Cidade:</span> {{CIDADE_ENTREGA}}</p>
            <p><span class="label">Cor:</span> {{COR}}</p>
            <p><span class="label">Medida:</span> {{MEDIDA}} ({{BAINHA}})</p>
            <p><span class="label">Gramatura:</span> {{GRAMATURA}}</p>
            <p><span class="label">Metragem Solicitada:</span> {{METRAGEM_SOLICITADA}}m</p>
            <p><span class="label">Observações:</span> {{OBSERVACOES_PDC}}</p>
        </div>
    </div>
    
    <div class="section">
        <div class="section-title">LISTA DE CORTES</div>
        <table>
            <thead>
                <tr>
                    <th class="col-seq">#</th>
                    <th class="col-codigo">Código</th>
                    <th class="col-origem">Origem</th>
                    <th class="col-obs">Observações</th>
                    <th class="col-metragem">Metragem</th>
                    <th class="col-ok">OK</th>
                </tr>
            </thead>
            <tbody>
                {{#CORTES}}
                <tr>
                    <td class="col-seq">{{SEQ}}</td>
                    <td class="col-codigo">{{CODIGO_CORTE}}</td>
                    <td class="col-origem">{{CODIGO_ORIGEM}}</td>
                    <td class="col-obs">{{OBS_CORTE}}</td>
                    <td class="col-metragem">{{METRAGEM}}m</td>
                    <td class="col-ok"><span class="checkbox"></span></td>
                </tr>
                {{/CORTES}}
                <tr class="total-row">
                    <td colspan="4" style="text-align: right;">TOTAL ({{QTD_ITENS}} itens)</td>
                    <td class="col-metragem">{{METRAGEM_TOTAL}}m</td>
                    <td class="col-ok"></td>
                </tr>
            </tbody>
        </table>
    </div>
    
    <div class="section">
        <div class="section-title">CONFERÊNCIA E ASSINATURAS</div>
        <div class="section-content assinaturas">
            <div class="assinatura-row">
                <div class="assinatura-campo">
                    <div class="linha-assinatura"></div>
                    <div class="assinatura-label">Expedidor</div>
                </div>
                <div class="assinatura-campo">
                    <div class="linha-assinatura"></div>
                    <div class="assinatura-label">Data</div>
                </div>
            </div>
            <div class="assinatura-row">
                <div class="assinatura-campo">
                    <div class="linha-assinatura"></div>
                    <div class="assinatura-label">Motorista</div>
                </div>
                <div class="assinatura-campo">
                    <div class="linha-assinatura"></div>
                    <div class="assinatura-label">Placa</div>
                </div>
            </div>
            <div class="declaracao">
                <strong>Declaro ter recebido os materiais acima descritos em perfeitas condições de uso.</strong>
                <div class="assinatura-row" style="margin-top: 15px; margin-bottom: 0;">
                    <div class="assinatura-campo">
                        <div class="linha-assinatura"></div>
                        <div class="assinatura-label">Recebido por</div>
                    </div>
                    <div class="assinatura-campo">
                        <div class="linha-assinatura"></div>
                        <div class="assinatura-label">Data/Hora</div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <div class="footer">
        <div class="barcode">{{CODIGO_BARRAS}}</div>
        <div class="info">
            Impresso: {{DATA_IMPRESSAO}}<br>
            Sistema v{{VERSAO}}
        </div>
    </div>
</body>
</html>
```

---

## 📅 Fases de Implementação

### Fase 1: Endpoint de Dados (Backend Railway)
- [ ] Criar `GET /api/carregamento/:id/relatorio`
- [ ] Retornar todos os dados do carregamento + PDC + cortes
- [ ] Testar com dados reais

### Fase 2: Fila de Impressão (Backend Railway)
- [ ] Criar migration para tabela `fila_impressao_relatorios`
- [ ] Ao finalizar carregamento, adicionar à fila automaticamente
- [ ] Endpoint `GET /api/impressao/relatorios/pendentes?loja=PLA`
- [ ] Endpoint `POST /api/impressao/relatorios/:id/marcar-impresso`

### Fase 3: Servidor de Impressão Local
- [ ] Criar projeto Node.js separado (`servidor-impressao/`)
- [ ] Implementar polling para buscar pendências
- [ ] Criar template HTML do romaneio
- [ ] Implementar geração de PDF com Puppeteer
- [ ] Integrar com impressora A4 do sistema (2 cópias)
- [ ] Testar impressão automática

### Fase 4: Integração Etiquetas (Migrar Sistema Atual)
- [ ] Migrar fila de etiquetas para mesmo servidor
- [ ] Unificar polling (etiquetas + relatórios)
- [ ] Priorizar etiquetas sobre relatórios

---

## ❓ Perguntas Pendentes

1. ~~Onde gerar o PDF?~~ **→ PC Local (decidido)**
2. ~~Incluir fotos?~~ **→ Não (decidido)**
3. ~~Quantas cópias?~~ **→ 2 vias (decidido)**
4. Qual impressora A4 será usada? (nome/modelo para configurar)
5. O PC local terá IP fixo na rede ou usará USB direto?

---

## 📝 Notas Técnicas

### Dependências do Servidor Local
```json
{
    "dependencies": {
        "puppeteer": "^21.0.0",
        "axios": "^1.6.0",
        "node-schedule": "^2.1.0"
    }
}
```

### Impressão no Windows
O servidor local usará o comando `print` do Windows ou biblioteca `pdf-to-printer`:
```javascript
const printer = require('pdf-to-printer');
await printer.print(pdfPath, { 
    printer: "HP LaserJet",
    copies: 2
});
```

---

## 📝 Próximos Passos

1. ✅ Criar documento de especificação
2. ✅ Validar layout e decisões com usuário
3. ⏳ Implementar endpoint de dados
4. ⏳ Criar migration para fila de relatórios
5. ⏳ Desenvolver servidor de impressão local
6. ⏳ Testar com impressora real

---

*Documento criado em 18/12/2025 - Controle de Bobinas 2.0 v2.6.0*
