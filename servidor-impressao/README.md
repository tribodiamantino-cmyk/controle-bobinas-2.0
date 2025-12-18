# 🖨️ Servidor de Impressão Local

> Servidor para impressão automática de etiquetas e relatórios do Controle de Bobinas 2.0

## 📋 Requisitos

- **Node.js** 18+ 
- **Windows** (para impressão via driver)
- **Impressora Elgin L42 Pro Full** (USB) - Etiquetas 60x30mm
- **Impressora A4** (USB ou rede) - Relatórios

## 🚀 Instalação

### 1. Instalar dependências
```bash
cd servidor-impressao
npm install
```

### 2. Configurar impressoras

Edite o arquivo `config.json`:

```json
{
    "api": {
        "baseUrl": "https://controle-bobinas-20-production.up.railway.app",
        "pollingInterval": 5000,
        "loja": "PLA"
    },
    "impressoras": {
        "termica": {
            "nome": "Elgin L42 Pro Full",
            "tipo": "usb",
            "vendorId": "0x0525",
            "productId": "0xa700",
            "larguraEtiqueta": 60,
            "alturaEtiqueta": 30
        },
        "a4": {
            "nome": "HP LaserJet Pro",
            "copias": 2
        }
    },
    "logs": {
        "nivel": "info",
        "arquivo": true
    }
}
```

| Campo | Descrição |
|-------|-----------|
| `api.baseUrl` | URL da API Railway |
| `api.pollingInterval` | Intervalo de consulta (ms) |
| `api.loja` | Código da loja: `PLA` (Cortinave) ou `CIA` (BN) |
| `impressoras.termica.nome` | Nome da impressora no Windows |
| `impressoras.a4.nome` | Nome da impressora A4 (deixe vazio para usar padrão) |
| `impressoras.a4.copias` | Número de cópias do romaneio (padrão: 2) |

### 3. Encontrar nome das impressoras

No Windows, execute:
```cmd
wmic printer get name
```

### 4. Iniciar servidor

```bash
npm start
```

Ou em modo desenvolvimento (com auto-reload):
```bash
npm run dev
```

## 🔧 Como Funciona

```
┌─────────────────────────────────────────────────────────────────┐
│                      SERVIDOR LOCAL                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   1. POLLING (a cada 5s)                                        │
│      └─ Consulta API: GET /api/impressao/pendentes              │
│      └─ Consulta API: GET /api/impressao/relatorios/pendentes   │
│                                                                 │
│   2. FILA DE IMPRESSÃO                                          │
│      ├─ Fila Etiquetas (prioridade alta)                        │
│      └─ Fila Relatórios (prioridade normal)                     │
│                                                                 │
│   3. IMPRESSÃO                                                  │
│      ├─ Etiquetas → Elgin L42 (ZPL via USB/Windows)             │
│      └─ Relatórios → PDF → Impressora A4 (2 cópias)             │
│                                                                 │
│   4. CONFIRMAÇÃO                                                │
│      └─ Marca como impresso na API Railway                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## 📦 Estrutura de Arquivos

```
servidor-impressao/
├── package.json
├── config.json           # Configurações
├── README.md             # Este arquivo
├── src/
│   ├── index.js          # Entry point
│   ├── polling.js        # Consulta API
│   ├── queue.js          # Gerenciamento de filas
│   ├── printers/
│   │   ├── thermal.js    # Impressora térmica (etiquetas)
│   │   └── pdf.js        # Impressora A4 (relatórios)
│   ├── templates/
│   │   └── romaneio.html # Template do romaneio de carregamento
│   └── utils/
│       └── logger.js     # Logs
└── logs/                 # Arquivos de log diários
```

## 🏷️ Tipos de Impressão

### Etiquetas (60x30mm)

- **Bobinas**: `BOB-PLA-000001`
- **Retalhos**: `RET-PLA-000042`
- **Cortes**: `COR-PLA-1-1`
- **Locações**: `0001-A-0001`

### Relatórios A4

- **Romaneio de Carregamento**: Impresso automaticamente ao finalizar carregamento
  - 2 vias: MOTORISTA + ARQUIVO LOJA
  - Contém: dados do PDC, lista de cortes, observações, assinaturas

## 🔍 Logs

Os logs são salvos em:
- **Console**: Colorido, em tempo real
- **Arquivo**: `logs/YYYY-MM-DD.log` (se `logs.arquivo: true`)

Níveis de log:
- `debug`: Detalhado (para desenvolvimento)
- `info`: Normal (padrão)
- `warn`: Avisos
- `error`: Erros

## ⚙️ Executar como Serviço Windows

Para manter o servidor rodando mesmo após logout:

### Opção 1: PM2
```bash
npm install -g pm2
pm2 start src/index.js --name "servidor-impressao"
pm2 save
pm2 startup
```

### Opção 2: NSSM (Non-Sucking Service Manager)
```bash
nssm install ServidorImpressao "C:\caminho\node.exe" "C:\servidor-impressao\src\index.js"
nssm start ServidorImpressao
```

## 🐛 Troubleshooting

### Impressora térmica não imprime

1. Verifique se a impressora está conectada e ligada
2. Verifique o nome da impressora no `config.json`
3. Teste manualmente: `print /d:"Nome Impressora" arquivo.txt`

### Relatório não imprime

1. Verifique se a impressora A4 está configurada como padrão
2. Instale o Chrome/Chromium (Puppeteer precisa)
3. Verifique os logs em `logs/`

### API não responde

1. Verifique a URL em `config.json`
2. Teste no navegador: `https://seu-railway.app/api/health`
3. Verifique a conexão com internet

## 📝 API Endpoints Utilizados

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/health` | Verificar conexão |
| GET | `/api/impressao/pendentes?loja=PLA` | Etiquetas pendentes |
| GET | `/api/impressao/relatorios/pendentes?loja=PLA` | Relatórios pendentes |
| GET | `/api/carregamento/:id/relatorio` | Dados do romaneio |
| POST | `/api/impressao/:id/marcar-impresso` | Confirmar etiqueta |
| POST | `/api/impressao/relatorios/:id/marcar-impresso` | Confirmar relatório |

---

*Servidor de Impressão - Controle de Bobinas 2.0 v2.6.0*
