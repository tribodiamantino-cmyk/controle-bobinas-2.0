# Arquitetura do Sistema - Controle de Bobinas 2.0

> **Documento de referência obrigatória** para toda implementação no projeto.
> Consulte antes de criar qualquer código novo.

---

## 📋 Índice

1. [Visão Geral](#-visão-geral)
2. [Stack Tecnológico](#-stack-tecnológico)
3. [Estrutura de Pastas](#-estrutura-de-pastas)
4. [Banco de Dados](#-banco-de-dados)
5. [Padrões de Código](#-padrões-de-código)
6. [API REST](#-api-rest)
7. [Frontend](#-frontend)
8. [Mobile/Android](#-mobileandroid)
9. [Sistema de Impressão](#-sistema-de-impressão-de-etiquetas)
10. [Deploy](#-deploy)

---

## 🎯 Visão Geral

Sistema de gestão de estoque de bobinas de lona para **Cortinave (Palotina)** e **BN (Cianorte)**.

### Fluxo Principal
```
Bobina → Plano de Corte → Cortes → Carregamento
           ↓
        Retalhos (sobras)
```

### Ambientes
| Ambiente | URL | Banco |
|----------|-----|-------|
| **Produção** | Railway | MySQL Railway |
| **Local** | localhost:3000 | MySQL Local |

---

## 🛠️ Stack Tecnológico

### Backend
| Tecnologia | Versão | Uso |
|------------|--------|-----|
| **Node.js** | 18+ | Runtime |
| **Express** | 4.x | Framework HTTP |
| **MySQL** | 8.x | Banco de dados |
| **mysql2** | - | Driver MySQL |

### Frontend Desktop
| Tecnologia | Uso |
|------------|-----|
| **HTML/CSS/JS** | Vanilla (sem frameworks) |
| **Bootstrap 5** | Componentes UI |
| **DataTables** | Tabelas |
| **SweetAlert2** | Alertas |

### Mobile
| Tecnologia | Versão | Uso |
|------------|--------|-----|
| **Capacitor** | 7.x | Bridge nativo |
| **Vanilla JS** | - | Lógica do app |
| **cordova-plugin-bluetooth-serial** | - | Impressão Bluetooth |

---

## 📁 Estrutura de Pastas

```
controle-bobinas-2.0/
├── .github/
│   └── copilot-instructions.md   # Instruções para IA
├── android/                       # Projeto Android (Capacitor)
├── config/
│   └── database.js               # Conexão MySQL
├── controllers/                   # Lógica de negócio
│   ├── bobinasController.js
│   ├── produtosController.js
│   ├── ordensCorteController.js
│   └── ...
├── database/
│   └── schema.sql                # Referência (migrations são a verdade)
├── docs/                          # 📚 DOCUMENTAÇÃO PERMANENTE
│   ├── ARQUITETURA.md            # Este arquivo
│   ├── PADRONIZACAO_CODIGOS.md   # Padrões de códigos
│   ├── ESPECIFICACAO_ETIQUETAS.md # Layout de etiquetas
│   └── ...
├── middleware/
│   ├── validarReservas.js        # Validação de reservas
│   └── uploadFotos.js            # Upload de imagens
├── migrations/                    # Migrações de banco
│   └── 0XX_descricao.js
├── public/
│   ├── css/
│   ├── js/
│   ├── mobile/                   # App mobile (Capacitor)
│   │   ├── index.html
│   │   ├── api-config.js         # Config de API
│   │   └── ...
│   └── *.html                    # Páginas desktop
├── routes/                        # Rotas Express
├── scripts/                       # Scripts utilitários
├── uploads/                       # Arquivos enviados
├── server.js                      # Entry point
├── package.json
├── README.md                      # Intro do projeto
├── CHANGELOG.md                   # Histórico de versões
└── ROADMAP.md                     # Planejamento futuro
```

---

## 🗄️ Banco de Dados

### Convenções de Nomenclatura

| Elemento | Convenção | Exemplo |
|----------|-----------|---------|
| Tabelas | snake_case, plural | `planos_corte` |
| Colunas | snake_case | `metragem_atual` |
| PKs | `id` (AUTO_INCREMENT) | `id` |
| FKs | `{tabela_singular}_id` | `produto_id` |
| Timestamps | `created_at`, `updated_at` | - |
| Booleanos | `is_` ou `tem_` | `is_ativo` |
| Enums | UPPERCASE no banco | `ENUM('ATIVO', 'INATIVO')` |

### Tabelas Principais

```sql
-- Hierarquia principal
produtos          -- Especificações de tecido
├── bobinas       -- Rolos físicos
│   └── retalhos  -- Sobras de corte
└── planos_corte  -- Ordens de produção
    ├── itens_plano_corte    -- O que cortar
    ├── alocacoes_corte      -- De onde cortar
    └── cortes_realizados    -- Cortes feitos

-- Auxiliares
locacoes          -- Posições no estoque
carregamentos     -- Entregas
```

### Tipos de Dados Padrão

| Tipo de Dado | MySQL | Exemplo |
|--------------|-------|---------|
| ID | `INT UNSIGNED AUTO_INCREMENT` | 1, 2, 3 |
| Código | `VARCHAR(20)` | `BOB-PLA-000001` |
| Metragem | `DECIMAL(10,2)` | 150.00 |
| Dinheiro | `DECIMAL(10,2)` | 1500.00 |
| Status | `ENUM(...)` | `'planejamento'` |
| Data | `DATETIME` | `2025-12-11 14:00:00` |
| Texto curto | `VARCHAR(255)` | Nome |
| Texto longo | `TEXT` | Observações |
| Booleano | `TINYINT(1)` | 0 ou 1 |

### Migrações

**Localização:** `/migrations/0XX_descricao.js`

**Formato:**
```javascript
// migrations/028_adicionar_campo_exemplo.js
exports.up = async function(db) {
    await db.query(`
        ALTER TABLE tabela
        ADD COLUMN novo_campo VARCHAR(50) DEFAULT NULL
    `);
    console.log('✅ Migration 028: Campo adicionado');
};

exports.down = async function(db) {
    await db.query(`ALTER TABLE tabela DROP COLUMN novo_campo`);
};
```

**Execução:** Automática no startup via `server.js:runMigrations()`

---

## 📝 Padrões de Código

### JavaScript (Backend)

```javascript
// ✅ BOM - Estilo do projeto
const criarBobina = async (req, res) => {
    try {
        const { produto_id, metragem, placa } = req.body;
        
        // Validação
        if (!produto_id || !metragem) {
            return res.json({ success: false, error: 'Campos obrigatórios' });
        }
        
        // Query parametrizada (SEMPRE!)
        const [result] = await db.query(
            'INSERT INTO bobinas (produto_id, metragem) VALUES (?, ?)',
            [produto_id, metragem]
        );
        
        console.log('✅ Bobina criada:', result.insertId);
        res.json({ success: true, data: { id: result.insertId } });
        
    } catch (error) {
        console.error('❌ Erro ao criar bobina:', error);
        res.json({ success: false, error: error.message });
    }
};

// ❌ RUIM - Nunca fazer
const ruim = async (req, res) => {
    // SQL Injection vulnerável!
    db.query(`SELECT * FROM bobinas WHERE id = ${req.params.id}`);
    
    // Throw sem try/catch
    throw new Error('Vai derrubar o servidor');
};
```

### Emojis de Log

| Emoji | Significado |
|-------|-------------|
| ✅ | Sucesso |
| ❌ | Erro |
| ⚠️ | Aviso |
| 🔄 | Processando |
| 📦 | Dados/Payload |
| 🔍 | Debug/Busca |

### Respostas de API

```javascript
// Sucesso
res.json({ success: true, data: resultado });
res.json({ success: true, data: [], message: 'Nenhum registro' });

// Erro
res.json({ success: false, error: 'Mensagem de erro' });

// Com paginação
res.json({ 
    success: true, 
    data: registros,
    pagination: { page: 1, total: 100, pages: 10 }
});
```

---

## 🌐 API REST

### Convenções de Rotas

| Método | Rota | Ação |
|--------|------|------|
| GET | `/api/bobinas` | Listar todas |
| GET | `/api/bobinas/:id` | Buscar uma |
| POST | `/api/bobinas` | Criar |
| PUT | `/api/bobinas/:id` | Atualizar |
| DELETE | `/api/bobinas/:id` | Deletar |

### Rotas Mobile (Prefixo `/api/mobile/`)

```
/api/mobile/ordens          # Ordens em produção
/api/mobile/corte           # Registrar corte
/api/mobile/carregamento    # Processo de carga
```

### Autenticação

> ⚠️ **Atualmente:** Sem autenticação (sistema interno)
> **Futuro:** JWT com refresh token

---

## 🖥️ Frontend

### Arquivos Desktop

| Arquivo | Função |
|---------|--------|
| `index.html` | Dashboard |
| `bobinas.html` | Gestão de bobinas |
| `produtos.html` | Cadastro de produtos |
| `planos-corte.html` | Planos de corte |

### Padrões HTML

```html
<!-- Estrutura padrão de página -->
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <title>Página - Controle de Bobinas</title>
    <link href="css/bootstrap.min.css" rel="stylesheet">
    <link href="css/style.css" rel="stylesheet">
</head>
<body>
    <!-- Navbar -->
    <nav>...</nav>
    
    <!-- Conteúdo -->
    <div class="container mt-4">
        <h1>Título</h1>
        <!-- ... -->
    </div>
    
    <!-- Scripts -->
    <script src="js/jquery.min.js"></script>
    <script src="js/bootstrap.bundle.min.js"></script>
    <script src="js/pagina.js"></script>
</body>
</html>
```

### Padrões JavaScript (Frontend)

```javascript
// Chamada de API padrão
async function carregarDados() {
    try {
        const response = await fetch('/api/bobinas');
        const data = await response.json();
        
        if (data.success) {
            renderizarTabela(data.data);
        } else {
            Swal.fire('Erro', data.error, 'error');
        }
    } catch (error) {
        console.error('Erro:', error);
        Swal.fire('Erro', 'Falha na comunicação', 'error');
    }
}

// Confirmação antes de ação destrutiva
async function deletar(id) {
    const result = await Swal.fire({
        title: 'Confirmar exclusão?',
        icon: 'warning',
        showCancelButton: true
    });
    
    if (result.isConfirmed) {
        // proceder...
    }
}
```

---

## 📱 Mobile/Android

### Estrutura do App

```
public/mobile/
├── index.html              # Entry point
├── api-config.js           # URL da API (Railway)
├── app.js                  # Lógica principal
├── bluetooth-printer.js    # Impressão térmica
├── service-worker.js       # PWA/Offline
└── manifest.json           # Config PWA
```

### Configuração API

```javascript
// api-config.js
const API_CONFIG = {
    production: 'https://controle-bobinas-20-production.up.railway.app',
    development: 'http://localhost:3000'
};

// Detecta se é app nativo
function isNativeApp() {
    return window.Capacitor?.isNativePlatform();
}
```

### Build Android

```bash
npm run android:sync    # Sincroniza assets
npm run android:build   # Gera APK debug
npm run android:release # Gera APK release
```

**Ver:** `docs/BUILD_APK.md` para instruções completas.

---

## 🚀 Deploy

### Railway (Produção)

| Config | Valor |
|--------|-------|
| Builder | Nixpacks |
| Branch | main |
| Deploy | Manual |

### Variáveis de Ambiente

```env
# Railway fornece automaticamente:
MYSQLHOST=xxx.railway.internal
MYSQLUSER=root
MYSQLPASSWORD=xxx
MYSQLDATABASE=railway
MYSQLPORT=3306

# Customizadas:
NODE_ENV=production
PORT=3000
```

### Processo de Deploy

1. Commitar alterações
2. Push para `main`
3. Acessar Railway Dashboard
4. Clicar "Deploy" manualmente

**Ver:** `docs/CONFIGURAR_RAILWAY.md` para detalhes.

---

## �️ Sistema de Impressão de Etiquetas

> **IMPORTANTE:** Todas as impressões de etiquetas no sistema (desktop e futuro mobile) devem usar a mesma arquitetura centralizada.

### Problema Anterior (Legado)

Antes da padronização, cada tela implementava impressão de forma diferente:
- `estoque.js` tinha ~500 linhas de código ZPL
- `retalhos.js` tinha QR codes próprios
- Mobile tinha outra implementação completamente separada
- Formatos inconsistentes (57mm, QR, Code128 misturados)

### Arquitetura Atual (Padronizada)

```
┌─────────────────────────────────────────────────────────────────┐
│                    QUALQUER TELA DO SISTEMA                     │
│         (estoque.html, retalhos.html, ordens.html, etc)         │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│              ImpressaoEtiquetas (Módulo JS)                     │
│                 /js/impressao-etiquetas.js                      │
│                                                                 │
│  • abrirModal(tipo, id)     - Modal com preview                 │
│  • adicionar(tipo, id, qtd) - Adiciona à fila                   │
│  • preview(tipo, id)        - Busca dados sem adicionar         │
│  • imprimirDireto(dados)    - Abre janela de impressão          │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    API: /api/impressao                          │
│                controllers/impressaoController.js               │
│                                                                 │
│  POST /adicionar       - Adiciona à fila                        │
│  GET  /preview/:tipo/:id - Gera dados da etiqueta               │
│  GET  /pendentes       - Lista fila                             │
│  PUT  /:id/impressa    - Marca como impressa                    │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                Tabela: fila_impressao                           │
│                                                                 │
│  • tipo_etiqueta (bobina, retalho, corte, locacao)              │
│  • entidade_id                                                  │
│  • dados_etiqueta (JSON)                                        │
│  • status (pendente, impressa, cancelada)                       │
│  • loja (PLA, CIA)                                              │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│           Impressora Elgin L42 Pro Full (USB)                   │
│           (Futuro: Servidor de impressão local)                 │
└─────────────────────────────────────────────────────────────────┘
```

### Como Usar em Qualquer Tela

**1. Incluir dependências no HTML:**
```html
<!-- Bootstrap 5 (para modal) -->
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>

<!-- JsBarcode (para Code 128) -->
<script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>

<!-- Módulo de Impressão -->
<script src="/js/impressao-etiquetas.js"></script>
```

**2. Chamar a função:**
```javascript
// Abre modal com preview e opções
ImpressaoEtiquetas.abrirModal('bobina', 123);
ImpressaoEtiquetas.abrirModal('retalho', 456);
ImpressaoEtiquetas.abrirModal('corte', 789);
ImpressaoEtiquetas.abrirModal('locacao', 10);

// Adicionar direto à fila (sem modal)
ImpressaoEtiquetas.adicionar('bobina', 123, 2); // 2 cópias
```

**3. Em botões de tabela:**
```javascript
// Gera HTML do botão pronto
const btnHtml = ImpressaoEtiquetas.botaoHtml('bobina', id, 'sm');
// Resultado: <button onclick="ImpressaoEtiquetas.abrirModal('bobina', 123)">🖨️</button>
```

### Especificações das Etiquetas

| Parâmetro | Valor |
|-----------|-------|
| **Tamanho** | 60mm x 30mm |
| **Código de Barras** | Code 128 |
| **Impressora Alvo** | Elgin L42 Pro Full (USB) |

**Layout padrão (4 linhas):**
```
┌──────────────────────────────────────────────┐
│             BOB-PLA-000001                   │  Linha 1: Código
│     ║║║║║║║║║║║║║║║║║║║║║║║║║║║║║║           │  Linha 2: Barcode
│   Preta/Prata 190cm Cano/Cano 190gr          │  Linha 3: Produto
│        PROPEX | ABC-1234 | 150,00m           │  Linha 4: Detalhes
└──────────────────────────────────────────────┘
```

**Ver:** `docs/ESPECIFICACAO_ETIQUETAS.md` para layouts detalhados de cada tipo.

### ⚠️ Regras Obrigatórias

1. **NUNCA** criar nova implementação de impressão - use `ImpressaoEtiquetas`
2. **NUNCA** gerar código de barras em outro formato (só Code 128)
3. **SEMPRE** passar pela API `/api/impressao` para consistência
4. **SEMPRE** usar os tipos definidos: `bobina`, `retalho`, `corte`, `locacao`

### Arquivos do Sistema de Impressão

| Arquivo | Função |
|---------|--------|
| `/js/impressao-etiquetas.js` | Módulo frontend (USE ESTE!) |
| `/controllers/impressaoController.js` | Lógica de negócio |
| `/routes/impressao.js` | Endpoints da API |
| `/public/fila-impressao.html` | UI de gerenciamento da fila |
| `/public/preview-etiquetas.html` | Preview visual dos layouts |
| `/migrations/032_add_fila_impressao_table.js` | Tabela de fila |

### Arquivo Obsoleto

| Arquivo | Status |
|---------|--------|
| `/js/impressora.js` | ❌ **OBSOLETO** - Não usar! (código ZPL antigo) |

---

## �📚 Documentos Relacionados

| Documento | Descrição |
|-----------|-----------|
| `docs/PADRONIZACAO_CODIGOS.md` | Formatos de todos os códigos |
| `docs/ESPECIFICACAO_ETIQUETAS.md` | Layout das etiquetas |
| `docs/SISTEMA_VALIDACAO_RESERVAS.md` | Arquitetura de reservas |
| `docs/SISTEMA_CORTES_QR.md` | Sistema de QR codes |
| `docs/BUILD_APK.md` | Como gerar APK |
| `docs/SETUP_ANDROID_ENV.md` | Ambiente Android |
| `docs/CONFIGURAR_RAILWAY.md` | Deploy Railway |
| `docs/GUIA_TESTES_SISTEMA_COMPLETO.md` | Checklist de testes |

---

## 📝 Histórico

| Data | Alteração |
|------|-----------|
| 11/12/2025 | Documento criado - Consolidação de padrões |
| 11/12/2025 | Adicionada seção Sistema de Impressão de Etiquetas |
