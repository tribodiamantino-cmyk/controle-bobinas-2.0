# 🖨️ Servidor de Impressão Local

> Servidor para impressão automática de etiquetas e relatórios do Controle de Bobinas 2.0

## � Instalação Rápida (Executável)

### Para o usuário final:

1. Baixe a pasta `dist/` com os arquivos:
   - `ServidorImpressao.exe`
   - `config.json`
   - `Instalar.bat`
   - `Iniciar.bat`
   - `templates/romaneio.html`

2. Execute `Instalar.bat` **como Administrador**

3. Configure o `config.json` com o nome das impressoras

4. Use o atalho na Área de Trabalho para iniciar

---

## � Para Desenvolvedores

### Gerar o executável (.exe)

```bash
cd servidor-impressao

# Instalar dependências (incluindo pkg)
npm install

# Gerar executável Windows 64-bit
npm run build

# Gerar executável + preparar pasta de distribuição
npm run build:all
```

O executável será gerado em `dist/ServidorImpressao.exe`

### Estrutura da pasta dist/ (para distribuição)

```
dist/
├── ServidorImpressao.exe    # Executável principal
├── config.json              # Configurações (editar antes de usar)
├── Instalar.bat             # Instalador automático
├── Iniciar.bat              # Script para iniciar
├── LEIA-ME.txt              # Instruções para usuário
├── templates/
│   └── romaneio.html        # Template do relatório A4
└── logs/                    # Logs (criado automaticamente)
```

---

## 📋 Requisitos

- **Windows** 10/11 (64-bit)
- **Impressora Elgin L42 Pro Full** (USB) - Etiquetas 60x30mm
- **Impressora A4** (USB ou rede) - Relatórios
- **Conexão com internet** - Para acessar a API

---

## ⚙️ Configuração (config.json)

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
            "tipo": "windows"
        },
        "a4": {
            "nome": "",
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
| `api.pollingInterval` | Intervalo de consulta em ms (padrão: 5000 = 5s) |
| `api.loja` | Código da loja: `PLA` (Cortinave) ou `CIA` (BN) |
| `impressoras.termica.nome` | **Nome exato** da impressora de etiquetas no Windows |
| `impressoras.a4.nome` | Nome da impressora A4 (deixe vazio para usar padrão) |
| `impressoras.a4.copias` | Número de cópias do romaneio (padrão: 2) |

### Descobrir nome das impressoras

Abra o **Prompt de Comando** e execute:
```cmd
wmic printer get name
```

Use o nome **exatamente como aparece** no config.json.

---

## � Como Funciona

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
│      ├─ Etiquetas → Elgin L42 (ZPL via Windows)                 │
│      └─ Relatórios → PDF → Impressora A4 (2 cópias)             │
│                                                                 │
│   4. CONFIRMAÇÃO                                                │
│      └─ Marca como impresso na API Railway                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

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

---

## 🐛 Troubleshooting

### O servidor não inicia

1. Verifique se o `config.json` existe na mesma pasta do .exe
2. Verifique se o JSON está válido (sem erros de sintaxe)

### Impressora térmica não imprime

1. Verifique se a impressora está conectada e ligada
2. Verifique o nome **exato** da impressora no `config.json`
3. Teste manualmente: `copy arquivo.txt "\\%COMPUTERNAME%\NomeImpressora"`

### Relatório não imprime

1. Verifique se a impressora A4 está configurada como padrão
2. Verifique se o Chrome está instalado (Puppeteer precisa)
3. Verifique os logs em `logs/`

### API não responde

1. Verifique a URL em `config.json`
2. Teste no navegador: `https://seu-railway.app/api/health`
3. Verifique a conexão com internet

---

## 📝 Logs

Os logs são salvos em:
- **Console**: Colorido, em tempo real
- **Arquivo**: `logs/YYYY-MM-DD.log`

---

*Servidor de Impressão - Controle de Bobinas 2.0 v2.6.0*
