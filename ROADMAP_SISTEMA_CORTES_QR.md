# 🎯 ROADMAP - Sistema de Cortes com QR Code e Validação

## 📋 Visão Geral

Sistema completo de rastreabilidade de cortes usando QR Codes para:
- Validação de origem (bobinas/retalhos)
- Registro de cortes com foto de contraprova
- Geração de etiquetas QR para cada corte
- Armazenamento de planos completos com locações
- Validação de carregamento (expedição)

---

## 🎯 OBJETIVOS

### 1. **Rastreabilidade Total**
- Cada corte tem código único (COR-2025-00001)
- Foto do medidor como contraprova
- Histórico completo de quem cortou, quando e onde

### 2. **Validação por QR Code**
- Bobina origem → Validar antes de cortar
- Corte individual → Rastreamento
- Locação → Validar armazenamento do plano
- Carregamento → Validar expedição

### 3. **Eficiência Operacional**
- Guarda plano completo de uma vez (não item por item)
- Carregamento com checklist visual (verde/vermelho)
- Redução de erros humanos

---

## 🏗️ ARQUITETURA DE DADOS

### **Fluxo de Dados:**

```
PLANO DE CORTE (Desktop)
    ↓
ITENS DO PLANO (alocados com bobinas/retalhos)
    ↓
CORTES REALIZADOS (mobile - múltiplos cortes por item)
    ↓
PLANO FINALIZADO + LOCAÇÕES (mobile - armazenamento)
    ↓
CARREGAMENTO (mobile - validação de expedição)
```

### **Novas Entidades:**

1. **`locacoes`** - Cadastro de locações físicas
2. **`cortes_realizados`** - Cada corte individual
3. **`plano_locacoes`** - Onde plano foi guardado
4. **`carregamentos`** - Processo de expedição
5. **`carregamentos_itens`** - Auditoria de scan

---

## 📊 FASE 1 - BANCO DE DADOS (2-3 dias)

### ✅ **Migration 011: Tabela `locacoes`**

```sql
CREATE TABLE locacoes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    codigo_locacao VARCHAR(20) NOT NULL UNIQUE,
    descricao VARCHAR(200) NULL,
    corredor VARCHAR(10) NULL,
    prateleira VARCHAR(10) NULL,
    posicao VARCHAR(10) NULL,
    ativo BOOLEAN DEFAULT TRUE,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_codigo (codigo_locacao)
);
```

**Seeds iniciais:**
```sql
INSERT INTO locacoes (codigo_locacao, corredor, prateleira, posicao) VALUES
('A1-B1-C1', 'A', '1', 'B1-C1'),
('A1-B2-C2', 'A', '1', 'B2-C2'),
('A1-B2-C3', 'A', '1', 'B2-C3'),
('A1-B2-C4', 'A', '1', 'B2-C4'),
('A2-B1-C1', 'A', '2', 'B1-C1');
-- ... adicionar conforme necessidade
```

---

### ✅ **Migration 012: Tabela `cortes_realizados`**

```sql
CREATE TABLE cortes_realizados (
    id INT AUTO_INCREMENT PRIMARY KEY,
    codigo_corte VARCHAR(30) NOT NULL UNIQUE COMMENT 'COR-2025-00001',
    
    -- Vinculação
    plano_corte_id INT NOT NULL,
    item_plano_corte_id INT NOT NULL,
    alocacao_corte_id INT NOT NULL,
    
    -- Origem do corte
    origem_tipo ENUM('bobina', 'retalho') NOT NULL,
    bobina_id INT NULL,
    retalho_id INT NULL,
    
    -- Dados do corte
    metragem_cortada DECIMAL(10,2) NOT NULL,
    produto_id INT NOT NULL,
    
    -- Validações (produção)
    bobina_validada_qr BOOLEAN DEFAULT FALSE,
    data_validacao_bobina TIMESTAMP NULL,
    
    foto_medidor_url VARCHAR(500) NULL,
    foto_medidor_timestamp TIMESTAMP NULL,
    
    -- Operador
    operador_nome VARCHAR(100) NULL,
    operador_id INT NULL,
    
    -- Carregamento
    carregado BOOLEAN DEFAULT FALSE,
    carregado_por VARCHAR(100) NULL,
    data_carregamento TIMESTAMP NULL,
    carregamento_id INT NULL,
    
    -- Controle
    status ENUM('em_andamento', 'concluido', 'cancelado') DEFAULT 'em_andamento',
    data_corte TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_conclusao TIMESTAMP NULL,
    observacoes TEXT NULL,
    
    FOREIGN KEY (plano_corte_id) REFERENCES planos_corte(id),
    FOREIGN KEY (item_plano_corte_id) REFERENCES itens_plano_corte(id),
    FOREIGN KEY (alocacao_corte_id) REFERENCES alocacoes_corte(id),
    FOREIGN KEY (bobina_id) REFERENCES bobinas(id),
    FOREIGN KEY (retalho_id) REFERENCES retalhos(id),
    FOREIGN KEY (produto_id) REFERENCES produtos(id),
    
    INDEX idx_codigo (codigo_corte),
    INDEX idx_plano (plano_corte_id),
    INDEX idx_status (status),
    INDEX idx_carregado (carregado),
    INDEX idx_data (data_corte)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

### ✅ **Migration 013: Tabela `plano_locacoes`**

```sql
CREATE TABLE plano_locacoes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    plano_corte_id INT NOT NULL,
    locacao_id INT NOT NULL,
    codigo_locacao VARCHAR(20) NOT NULL,
    
    -- Validação
    validada_qr BOOLEAN DEFAULT FALSE,
    data_scan TIMESTAMP NULL,
    ordem_scan INT NULL,
    
    FOREIGN KEY (plano_corte_id) REFERENCES planos_corte(id),
    FOREIGN KEY (locacao_id) REFERENCES locacoes(id),
    INDEX idx_plano (plano_corte_id),
    INDEX idx_locacao (locacao_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

### ✅ **Migration 014: Alterar `planos_corte`**

```sql
ALTER TABLE planos_corte
ADD COLUMN locacoes_validadas BOOLEAN DEFAULT FALSE,
ADD COLUMN data_armazenamento TIMESTAMP NULL,
ADD COLUMN armazenado_por VARCHAR(100) NULL,
ADD COLUMN data_finalizacao TIMESTAMP NULL;
```

---

### ✅ **Migration 015: Alterar `alocacoes_corte`**

```sql
ALTER TABLE alocacoes_corte
ADD COLUMN cortes_realizados INT DEFAULT 0,
ADD COLUMN metragem_cortada DECIMAL(10,2) DEFAULT 0,
ADD COLUMN metragem_restante DECIMAL(10,2) NULL,
ADD COLUMN status_corte ENUM('pendente', 'em_andamento', 'concluido') DEFAULT 'pendente';
```

---

### ✅ **Migration 016: Tabela `carregamentos`**

```sql
CREATE TABLE carregamentos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    codigo_carregamento VARCHAR(30) NOT NULL UNIQUE COMMENT 'CAR-2025-00001',
    plano_corte_id INT NOT NULL,
    
    status ENUM('em_andamento', 'concluido', 'cancelado') DEFAULT 'em_andamento',
    
    total_cortes INT NOT NULL,
    cortes_carregados INT DEFAULT 0,
    
    operador_nome VARCHAR(100) NULL,
    operador_id INT NULL,
    
    data_inicio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_conclusao TIMESTAMP NULL,
    observacoes TEXT NULL,
    
    FOREIGN KEY (plano_corte_id) REFERENCES planos_corte(id),
    INDEX idx_plano (plano_corte_id),
    INDEX idx_status (status),
    INDEX idx_data (data_inicio)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

### ✅ **Migration 017: Tabela `carregamentos_itens`**

```sql
CREATE TABLE carregamentos_itens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    carregamento_id INT NOT NULL,
    corte_id INT NOT NULL,
    
    ordem_scan INT NOT NULL,
    data_scan TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (carregamento_id) REFERENCES carregamentos(id),
    FOREIGN KEY (corte_id) REFERENCES cortes_realizados(id),
    INDEX idx_carregamento (carregamento_id),
    INDEX idx_corte (corte_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

### ✅ **Migration 018: Alterar `bobinas` e `retalhos`**

```sql
ALTER TABLE bobinas
ADD COLUMN locacao_id INT NULL,
ADD FOREIGN KEY (locacao_id) REFERENCES locacoes(id);

ALTER TABLE retalhos
ADD COLUMN locacao_id INT NULL,
ADD FOREIGN KEY (locacao_id) REFERENCES locacoes(id);
```

---

## 🔧 FASE 2 - BACKEND APIs (3-4 dias)

### **2.1 - Controller: `qrcodesController.js`** (NOVO)

**Rotas:**
- `GET /api/qrcodes/bobina/:id` - QR da bobina
- `GET /api/qrcodes/retalho/:id` - QR do retalho
- `GET /api/qrcodes/corte/:codigo_corte` - QR do corte
- `GET /api/qrcodes/locacao/:codigo_locacao` - QR da locação
- `POST /api/qrcodes/locacoes/lote` - Múltiplos QR de locações

**Dependências:**
```bash
npm install qrcode
```

**Exemplo de implementação:**
```javascript
const QRCode = require('qrcode');

exports.gerarQRBobina = async (req, res) => {
    try {
        const { id } = req.params;
        const [bobina] = await db.query(
            'SELECT codigo_interno FROM bobinas WHERE id = ?',
            [id]
        );
        
        if (!bobina || bobina.length === 0) {
            return res.status(404).json({ 
                success: false, 
                error: 'Bobina não encontrada' 
            });
        }
        
        const qrDataURL = await QRCode.toDataURL(bobina[0].codigo_interno, {
            errorCorrectionLevel: 'H',
            width: 300,
            margin: 2
        });
        
        res.json({ 
            success: true, 
            qrCodeDataURL: qrDataURL,
            codigo: bobina[0].codigo_interno
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
};
```

---

### **2.2 - Controller: `cortesController.js`** (NOVO)

**Rotas:**
- `POST /api/cortes/registrar` - Criar novo corte
- `GET /api/cortes/:codigo_corte` - Detalhes do corte
- `GET /api/cortes/plano/:plano_id` - Listar cortes do plano
- `PUT /api/cortes/:id/foto-medidor` - Upload foto (multer)

---

### **2.3 - Controller: `locacoesController.js`** (NOVO)

**Rotas:**
- `GET /api/locacoes` - Listar todas
- `POST /api/locacoes` - Criar nova
- `GET /api/locacoes/:id` - Detalhes
- `PUT /api/locacoes/:id` - Atualizar
- `DELETE /api/locacoes/:id` - Desativar

---

### **2.4 - Routes: `mobile.js`** (EXPANDIR)

**Novas rotas:**

```javascript
// Validação de bobina
POST /api/mobile/validar-qr-bobina
Body: { alocacao_id, qr_escaneado }
Response: { success, validado, bobina }

// Registrar corte
POST /api/mobile/registrar-corte
Body: { 
    alocacao_id, 
    metragem_cortada, 
    operador_nome 
}
Response: { 
    success, 
    corte: { codigo_corte, qr_code_url },
    restante 
}

// Upload foto medidor
POST /api/mobile/upload-foto-medidor
Body: FormData
Response: { success, foto_url }

// Consultar corte
GET /api/mobile/corte/:codigo_corte
Response: { success, data: { corte, plano, origem, ... } }

// Adicionar locação ao plano
POST /api/mobile/plano/:plano_id/adicionar-locacao
Body: { codigo_locacao }
Response: { success, locacoes }

// Finalizar plano
POST /api/mobile/plano/:plano_id/finalizar
Body: { operador_nome, locacoes_ids }
Response: { success, plano_finalizado }

// Carregamento - listar planos finalizados
GET /api/mobile/carregamento/planos-finalizados
Response: { success, data: [...] }

// Carregamento - iniciar
POST /api/mobile/carregamento/iniciar
Body: { plano_id, operador_nome }
Response: { success, carregamento, cortes }

// Carregamento - validar scan
POST /api/mobile/carregamento/validar-scan
Body: { carregamento_id, codigo_corte }
Response: { success, valido, progresso }

// Carregamento - finalizar
POST /api/mobile/carregamento/finalizar
Body: { carregamento_id }
Response: { success, carregamento }
```

---

### **2.5 - Middleware: Upload de Fotos**

```bash
npm install multer sharp
```

```javascript
// middleware/uploadFotos.js
const multer = require('multer');
const path = require('path');
const sharp = require('sharp');

const storage = multer.diskStorage({
    destination: './uploads/fotos-medidor/',
    filename: (req, file, cb) => {
        const timestamp = Date.now();
        const ext = path.extname(file.originalname);
        cb(null, `medidor_${timestamp}${ext}`);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Apenas imagens são permitidas'));
        }
    }
});

// Compressão automática
async function comprimirImagem(filePath) {
    await sharp(filePath)
        .resize(1200, null, { withoutEnlargement: true })
        .jpeg({ quality: 80 })
        .toFile(filePath.replace('.', '_compressed.'));
}

module.exports = { upload, comprimirImagem };
```

---

## 📱 FASE 3 - MOBILE: Produção (3-4 dias)

### **3.1 - Expandir Menu Principal**

```javascript
// public/mobile/index.html - Atualizar menu

<button class="menu-card" onclick="abrirTelaConsultas()">
    <div class="card-icon">🔍</div>
    <div class="card-title">Consultas</div>
    <div class="card-desc">Bobinas e Cortes via QR</div>
</button>

<button class="menu-card" onclick="abrirTelaCarregamento()">
    <div class="card-icon">📦</div>
    <div class="card-title">Carregamento</div>
    <div class="card-desc">Validar cortes finalizados</div>
</button>
```

---

### **3.2 - Tela: Validação de Bobina**

**HTML:**
```html
<div id="tela-validar-bobina" class="tela">
    <div class="tela-header">
        <button class="btn-back" onclick="voltarDetalhesPlan()">← Voltar</button>
        <h2>📦 Validar Origem</h2>
    </div>
    
    <div class="info-box">
        <h3 id="item-produto-nome"></h3>
        <p id="item-metragem"></p>
        <p>📍 Buscar na locação: <strong id="item-locacao"></strong></p>
        <p>🎯 Bobina esperada: <strong id="bobina-esperada"></strong></p>
    </div>
    
    <div id="scanner-bobina" class="qr-reader"></div>
    <p class="scanner-instrucao">Escaneie o QR Code da bobina</p>
</div>
```

**JavaScript:**
```javascript
async function iniciarValidacaoBobina(alocacaoId) {
    // Buscar dados da alocação
    const response = await fetch(`/api/mobile/alocacao/${alocacaoId}`);
    const data = await response.json();
    
    // Preencher informações
    document.getElementById('item-produto-nome').textContent = data.produto;
    document.getElementById('item-metragem').textContent = `${data.metragem}m`;
    document.getElementById('item-locacao').textContent = data.locacao;
    document.getElementById('bobina-esperada').textContent = data.origem_codigo;
    
    // Iniciar scanner
    html5QrcodeScanner = new Html5QrcodeScanner(
        "scanner-bobina",
        { fps: 10, qrbox: 250 }
    );
    
    html5QrcodeScanner.render(async (decodedText) => {
        await validarQRBobina(alocacaoId, decodedText);
    });
}

async function validarQRBobina(alocacaoId, qrEscaneado) {
    const response = await fetch('/api/mobile/validar-qr-bobina', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alocacao_id: alocacaoId, qr_escaneado: qrEscaneado })
    });
    
    const data = await response.json();
    
    if (data.validado) {
        mostrarToast('✅ Bobina validada!', 'success');
        abrirTelaRegistrarCorte(alocacaoId);
    } else {
        mostrarToast('❌ Bobina incorreta!', 'error');
    }
}
```

---

### **3.3 - Tela: Registrar Corte**

**HTML:**
```html
<div id="tela-registrar-corte" class="tela">
    <div class="tela-header">
        <h2>✂️ Registrar Corte</h2>
    </div>
    
    <div class="bobina-validada">
        ✅ Bobina Validada: <strong id="corte-bobina-codigo"></strong>
    </div>
    
    <form id="form-registrar-corte">
        <div class="form-group">
            <label>Metragem alocada: <span id="corte-metragem-total"></span>m</label>
            <label>Já cortado: <span id="corte-metragem-cortada">0</span>m</label>
            <label>Restante: <span id="corte-metragem-restante"></span>m</label>
        </div>
        
        <div class="form-group">
            <label for="metragem-corte">Metragem deste corte (m) *</label>
            <input type="number" id="metragem-corte" step="0.01" min="0.01" required>
        </div>
        
        <div class="form-group">
            <label>Foto do Medidor *</label>
            <input type="file" id="foto-medidor" accept="image/*" capture="environment" required>
            <div id="preview-foto" class="foto-preview"></div>
        </div>
        
        <button type="submit" class="btn btn-primary">💾 Registrar Corte</button>
    </form>
</div>
```

---

### **3.4 - Tela: QR Code do Corte Gerado**

**HTML:**
```html
<div id="tela-qr-corte" class="tela">
    <div class="success-box">
        <h2>✅ Corte Registrado!</h2>
        <div id="qr-corte-container"></div>
        <h3 id="codigo-corte-gerado"></h3>
        <p id="detalhes-corte"></p>
    </div>
    
    <div class="btn-group">
        <button class="btn btn-secondary" onclick="imprimirEtiquetaCorte()">
            🖨️ Imprimir Etiqueta
        </button>
        <button class="btn btn-primary" onclick="outroCorte()">
            ➕ Outro Corte
        </button>
        <button class="btn btn-primary" onclick="finalizarItem()">
            ✅ Finalizar Item
        </button>
    </div>
</div>
```

---

### **3.5 - Tela: Finalizar Plano + Locações**

**HTML:**
```html
<div id="tela-finalizar-plano" class="tela">
    <div class="tela-header">
        <h2>✅ Plano Concluído!</h2>
        <p id="codigo-plano-finalizar"></p>
    </div>
    
    <div class="resumo-plano">
        <h3>📊 Resumo:</h3>
        <p>• <span id="resumo-itens"></span> itens cortados ✓</p>
        <p>• <span id="resumo-cortes"></span> cortes realizados</p>
        <p>• Total: <span id="resumo-metragem"></span>m cortados</p>
    </div>
    
    <div class="locacoes-section">
        <h3>📍 Armazenar Cortes</h3>
        <p>Escaneie a(s) locação(ões) onde guardará este plano:</p>
        
        <div id="locacoes-lista"></div>
        
        <button class="btn btn-primary" onclick="escanearLocacao()">
            📷 Escanear Locação
        </button>
        
        <button class="btn btn-success" id="btn-finalizar-plano" onclick="confirmarFinalizacaoPlano()" disabled>
            ✅ Finalizar e Guardar
        </button>
    </div>
</div>
```

---

## 📱 FASE 4 - MOBILE: Consultas (1 dia)

### **4.1 - Submenu de Consultas**

```html
<div id="tela-consultas" class="tela">
    <div class="menu-grid">
        <button class="menu-card" onclick="consultarBobina()">
            <div class="card-icon">📦</div>
            <div class="card-title">Consultar Bobina</div>
        </button>
        
        <button class="menu-card" onclick="consultarCorte()">
            <div class="card-icon">✂️</div>
            <div class="card-title">Consultar Corte</div>
        </button>
    </div>
</div>
```

### **4.2 - Tela de Consulta de Corte**

Similar à consulta de bobina, mas mostrando:
- Dados do corte
- Origem (bobina/retalho)
- Plano origem
- Operador
- Foto do medidor
- Status de carregamento

---

## 📦 FASE 5 - MOBILE: Carregamento (2-3 dias)

### **5.1 - Lista de Planos Finalizados**

```javascript
async function carregarPlanosFinalizados() {
    const response = await fetch('/api/mobile/carregamento/planos-finalizados');
    const data = await response.json();
    
    const container = document.getElementById('planos-finalizados-container');
    container.innerHTML = data.data.map(plano => `
        <div class="plano-card" onclick="iniciarCarregamento(${plano.plano_id})">
            <div class="plano-header">
                <span class="plano-numero">${plano.codigo_plano}</span>
                <span class="plano-status">${plano.status_carregamento}</span>
            </div>
            <div class="plano-info">
                <p>Cliente: ${plano.cliente}</p>
                <p>📍 Locações: ${plano.locacoes.join(', ')}</p>
                <p>📦 ${plano.cortes_carregados}/${plano.total_cortes} cortes</p>
            </div>
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${plano.percentual}%"></div>
            </div>
        </div>
    `).join('');
}
```

### **5.2 - Validação de Carregamento com Scanner**

```javascript
async function iniciarCarregamento(planoId) {
    const response = await fetch('/api/mobile/carregamento/iniciar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            plano_id: planoId, 
            operador_nome: 'Operador Mobile' 
        })
    });
    
    const data = await response.json();
    carregamentoAtual = data.carregamento;
    
    renderizarListaCortes(data.cortes);
    iniciarScannerCarregamento();
}

async function validarScanCarregamento(codigoCorte) {
    const response = await fetch('/api/mobile/carregamento/validar-scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            carregamento_id: carregamentoAtual.id,
            codigo_corte: codigoCorte
        })
    });
    
    const data = await response.json();
    
    if (data.valido) {
        mostrarToast('✅ Corte validado!', 'success');
        atualizarListaCortes(codigoCorte, true);
        atualizarProgresso(data.progresso);
    } else {
        mostrarToast('❌ ' + data.erro, 'error');
    }
}
```

---

## 🖨️ FASE 6 - IMPRESSÃO DE ETIQUETAS (1-2 dias)

### **6.1 - Página: Etiqueta de Corte**

```html
<!-- public/impressao/etiqueta-corte.html -->
<!DOCTYPE html>
<html>
<head>
    <title>Etiqueta - Corte</title>
    <style>
        @page { size: 10cm 5cm; margin: 0; }
        body { 
            font-family: Arial; 
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 5cm;
        }
        .qr-code { width: 3cm; height: 3cm; }
        .codigo { font-size: 14pt; font-weight: bold; }
        .info { font-size: 10pt; }
    </style>
</head>
<body>
    <img class="qr-code" id="qr-image" />
    <div class="codigo" id="codigo-corte"></div>
    <div class="info" id="info-corte"></div>
    <script src="/js/impressao-etiqueta-corte.js"></script>
</body>
</html>
```

### **6.2 - Página: Etiquetas de Locações em Lote**

```html
<!-- public/impressao/etiquetas-locacoes.html -->
<!-- Grid de etiquetas para imprimir múltiplas de uma vez -->
```

---

## ✅ FASE 7 - TESTES E AJUSTES (2-3 dias)

### **7.1 - Testes de Integração**
- [ ] Fluxo completo: Criar plano → Cortar → Finalizar → Carregar
- [ ] Validação QR em diferentes cenários
- [ ] Upload de fotos (diferentes formatos/tamanhos)
- [ ] Múltiplos cortes por alocação
- [ ] Múltiplas locações por plano

### **7.2 - Testes de Performance**
- [ ] Compressão de imagens funcionando
- [ ] Queries otimizadas (índices criados)
- [ ] Scanner QR responsivo

### **7.3 - Testes de Usabilidade**
- [ ] Feedback visual claro (verde/vermelho)
- [ ] Toasts e alertas funcionando
- [ ] Navegação fluida entre telas

---

## 📋 CHECKLIST DE CONCLUSÃO

### **Banco de Dados:**
- [ ] Todas migrations executadas sem erro
- [ ] Seeds de locações criados
- [ ] Índices criados e funcionando
- [ ] Foreign keys corretas

### **Backend:**
- [ ] QR Codes gerando corretamente
- [ ] Upload de fotos funcionando
- [ ] APIs de validação testadas
- [ ] APIs de carregamento testadas

### **Mobile:**
- [ ] Scanner QR operacional
- [ ] Fluxo de produção completo
- [ ] Consultas funcionando
- [ ] Carregamento validando corretamente
- [ ] Feedback visual implementado

### **Impressão:**
- [ ] Etiquetas de cortes imprimindo
- [ ] Etiquetas de locações em lote
- [ ] Layout otimizado para impressoras térmicas

### **Documentação:**
- [ ] ROADMAP.md atualizado
- [ ] CHANGELOG.md com novidades
- [ ] Criar SISTEMA_CORTES_QR.md (documentação técnica)
- [ ] Atualizar .github/copilot-instructions.md

---

## ⏱️ CRONOGRAMA TOTAL

| Fase | Tarefa | Dias | Status |
|------|--------|------|--------|
| 1 | Banco de Dados | 2-3 | ⏳ Pendente |
| 2 | Backend APIs | 3-4 | ⏳ Pendente |
| 3 | Mobile - Produção | 3-4 | ⏳ Pendente |
| 4 | Mobile - Consultas | 1 | ⏳ Pendente |
| 5 | Mobile - Carregamento | 2-3 | ⏳ Pendente |
| 6 | Impressão | 1-2 | ⏳ Pendente |
| 7 | Testes | 2-3 | ⏳ Pendente |
| **TOTAL** | | **14-20 dias** | **~3-4 semanas** |

---

## 🚀 PRÓXIMOS PASSOS

1. ✅ Revisar e aprovar este ROADMAP
2. ⏳ Começar implementação pela Fase 1 (Banco de Dados)
3. ⏳ Testar cada fase antes de avançar
4. ⏳ Documentar descobertas e ajustes

---

## 📝 OBSERVAÇÕES IMPORTANTES

### **Prioridades:**
1. **Fase 1-2 (Banco + Backend):** Fundação - não pode ter erro
2. **Fase 3 (Mobile Produção):** Core do sistema
3. **Fase 5 (Carregamento):** Validação de expedição crítica
4. **Fase 4, 6 (Consultas, Impressão):** Complementares

### **Riscos:**
- Upload de fotos pode ser pesado (compressão é crucial)
- Scanner QR pode ter problemas com iluminação (testar no ambiente real)
- Impressoras térmicas podem ter formatos diferentes (testar cedo)

### **Melhorias Futuras:**
- OCR na foto do medidor (detectar metragem automaticamente)
- Sincronização offline (PWA completo)
- Relatórios de produtividade
- Dashboard analytics
