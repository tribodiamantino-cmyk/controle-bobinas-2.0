# 📱 Mobile v2.0 - Documentação Técnica Completa

> **Sistema de Gestão de Bobinas - App Mobile para Chão de Fábrica**  
> Versão: 2.0.0 | Data: 11/12/2025

---

## 📋 ÍNDICE

1. [Visão Geral](#visão-geral)
2. [Especificações Técnicas](#especificações-técnicas)
3. [Arquitetura](#arquitetura)
4. [Módulo 1: CONSULTAS](#módulo-1-consultas)
5. [Módulo 2: PDC](#módulo-2-pdc)
6. [Módulo 3: CARREGAMENTO](#módulo-3-carregamento)
7. [Componentes Compartilhados](#componentes-compartilhados)
8. [APIs](#apis)
9. [Guia de Implementação](#guia-de-implementação)

---

## VISÃO GERAL

### Objetivo
Aplicativo mobile para operadores de chão de fábrica gerenciarem:
- ✅ Consulta de itens (bobinas, retalhos, cortes, locações)
- ✅ Execução de planos de corte (PDCs)
- ✅ Carregamento de materiais cortados

### Características
- 📱 **Plataforma:** Android (Capacitor 7)
- 📷 **Scanner:** Câmera + ML Kit (Code 128)
- 🖨️ **Impressão:** Servidor web (não Bluetooth)
- 📡 **Conectividade:** Sempre online (Wi-Fi)
- 👤 **Autenticação:** Nenhuma (v1.0)

### Hardware Alvo
- **Dispositivo:** Xiaomi Mi 13T
- **OS:** Android 13+
- **Quantidade:** 1 dispositivo no chão de fábrica

---

## ESPECIFICAÇÕES TÉCNICAS

### Stack Frontend
```json
{
  "framework": "Vanilla JavaScript",
  "ui": "HTML5 + CSS3 + Bootstrap 5",
  "mobile": "Capacitor 7",
  "scanner": "@capacitor-mlkit/barcode-scanning",
  "camera": "@capacitor/camera",
  "http": "Fetch API",
  "state": "LocalStorage (cache)",
  "icons": "Bootstrap Icons"
}
```

### Stack Backend
```json
{
  "api": "Node.js + Express",
  "database": "MySQL 8",
  "storage": "uploads/ (fotos)",
  "compression": "Sharp (server-side)",
  "hosting": "Railway"
}
```

### Padrões de Código
- **Códigos de Barras:** Code 128
- **Formatos:**
  - `BOB-PLA-000001` (Bobina)
  - `RET-CIA-000042` (Retalho)
  - `COR-2025-00001` (Corte)
  - `PDC-PLA-015` (Plano)
  - `LOC-15` (Locação)

---

## ARQUITETURA

### Estrutura de Arquivos

```
public/mobile/
├── index.html              # Menu principal (3 botões)
├── consultas.html          # Módulo de consultas
├── pdc.html               # Módulo de PDCs
├── carregamento.html      # Módulo de carregamento
├── css/
│   ├── mobile.css         # Estilos globais
│   ├── consultas.css      # Estilos específicos
│   ├── pdc.css           # Estilos específicos
│   └── carregamento.css   # Estilos específicos
├── js/
│   ├── config.js          # Configurações (API_URL)
│   ├── api.js             # Camada de API
│   ├── scanner.js         # Scanner de código de barras
│   ├── camera.js          # Câmera para fotos
│   ├── utils.js           # Utilidades gerais
│   ├── consultas.js       # Lógica do módulo
│   ├── pdc.js            # Lógica do módulo
│   └── carregamento.js    # Lógica do módulo
└── assets/
    └── images/            # Ícones e imagens
```

### Fluxo de Navegação

```
┌─────────────────┐
│  MENU PRINCIPAL │
└────────┬────────┘
         │
    ┌────┴────┬────────────┬────────────┐
    │         │            │            │
┌───▼──┐  ┌──▼───┐    ┌───▼───┐    ┌──▼──┐
│CONSU │  │ PDC  │    │CARREG │    │SAIR │
│LTAS  │  │      │    │AMENTO │    │     │
└──────┘  └──────┘    └───────┘    └─────┘
```

---

## MÓDULO 1: CONSULTAS 🔍

### Funcionalidades
1. Escanear código de barras
2. Identificar tipo automaticamente
3. Mostrar detalhes completos
4. Ações: Imprimir, Ver Histórico

### Telas

#### 1.1 Scanner Principal
```html
<!-- consultas.html -->
<div class="scanner-container">
  <div class="scanner-view" id="scannerView"></div>
  <div class="scanner-overlay">
    <h2>Escaneie o código de barras</h2>
    <p>BOB, RET, COR ou LOC</p>
  </div>
  <input type="text" id="manualInput" placeholder="Ou digite o código...">
</div>
```

**Comportamento:**
- Abre câmera automaticamente
- Detecta Code 128
- Vibra ao escanear
- Feedback visual (verde/vermelho)

#### 1.2 Detalhes - Bobina
```javascript
// Estrutura de dados
{
  tipo: 'bobina',
  codigo: 'BOB-PLA-000001',
  produto: 'Verde 200gr 6,20m',
  fabricante: 'Propex',
  metragem_atual: 45.50,
  metragem_reservada: 12.00,
  metragem_disponivel: 33.50,
  locacao: '0015-A-0023',
  status: 'Disponível',
  data_entrada: '2025-12-10',
  nota_fiscal: '123456'
}
```

**Layout:**
```
┌────────────────────────┐
│ 📦 BOB-PLA-000001     │
├────────────────────────┤
│ 🏷️ PRODUTO            │
│ Verde 200gr 6,20m      │
│ Propex                 │
│                        │
│ 📏 METRAGEM            │
│ Atual: 45,50m          │
│ Reservada: 12,00m      │
│ Disponível: 33,50m     │
│                        │
│ 📍 LOCALIZAÇÃO         │
│ 0015-A-0023           │
│                        │
│ ✅ STATUS              │
│ Disponível             │
├────────────────────────┤
│ [🖨️ ETIQ] [📊 HIST]  │
│ [📷 ESCANEAR OUTRO]   │
└────────────────────────┘
```

#### 1.3 Detalhes - Retalho
Similar a bobina + campo "Origem"

#### 1.4 Detalhes - Corte
```javascript
{
  tipo: 'corte',
  codigo_corte: 'COR-2025-00123',
  metragem: 12.50,
  pdc: 'PDC-PLA-015',
  cliente: 'Granja São José',
  aviario: 'Aviário 3',
  produto: 'Verde 200gr 6,20m',
  origem: 'BOB-PLA-000001',
  status: 'concluido',
  carregado: false,
  data_corte: '2025-12-11 14:30',
  foto_medidor: 'url...'
}
```

#### 1.5 Detalhes - Locação
```javascript
{
  tipo: 'locacao',
  codigo: 'LOC-15',
  locacao: '0015-A-0023',
  itens: [
    { tipo: 'bobina', codigo: 'BOB-PLA-000001', metragem: 45.50 },
    { tipo: 'retalho', codigo: 'RET-PLA-000089', metragem: 8.20 }
  ]
}
```

**Layout:**
```
┌────────────────────────┐
│ 📍 LOC-15             │
│ 0015-A-0023           │
├────────────────────────┤
│ 📦 ITENS (2)          │
│                        │
│ 📦 BOB-PLA-000001     │
│ 45,50m disponível      │
│ [VER DETALHES]        │
│                        │
│ ♻️ RET-PLA-000089     │
│ 8,20m disponível       │
│ [VER DETALHES]        │
└────────────────────────┘
```

### JavaScript - consultas.js

```javascript
// Exemplo de implementação
class ConsultasModule {
  constructor() {
    this.scanner = null;
    this.init();
  }

  async init() {
    await this.initScanner();
    this.attachEventListeners();
  }

  async initScanner() {
    const BarcodeScanner = window.BarcodeScanner;
    this.scanner = await BarcodeScanner.prepare();
  }

  async scanCode() {
    try {
      const result = await this.scanner.scan();
      await this.processCode(result.code);
    } catch (err) {
      console.error('Scan failed:', err);
    }
  }

  async processCode(code) {
    // 1. Validar código
    const validation = await API.validateCode(code);
    
    // 2. Buscar detalhes
    const details = await API.getDetails(validation.tipo, validation.id);
    
    // 3. Renderizar
    this.renderDetails(validation.tipo, details);
  }

  renderDetails(tipo, data) {
    const templates = {
      bobina: this.renderBobina,
      retalho: this.renderRetalho,
      corte: this.renderCorte,
      locacao: this.renderLocacao
    };
    
    const html = templates[tipo](data);
    document.getElementById('detailsContainer').innerHTML = html;
  }

  renderBobina(data) {
    return `
      <div class="detail-card">
        <h2>📦 ${data.codigo}</h2>
        <div class="info-section">
          <h3>🏷️ PRODUTO</h3>
          <p>${data.produto}</p>
          <p>${data.fabricante}</p>
        </div>
        <div class="info-section">
          <h3>📏 METRAGEM</h3>
          <p>Atual: ${data.metragem_atual}m</p>
          <p>Reservada: ${data.metragem_reservada}m</p>
          <p>Disponível: ${data.metragem_disponivel}m</p>
        </div>
        <div class="actions">
          <button onclick="imprimir('${data.id}')">🖨️ ETIQ</button>
          <button onclick="verHistorico('${data.id}')">📊 HIST</button>
        </div>
      </div>
    `;
  }
}

// Inicializar
const consultas = new ConsultasModule();
```

---

## MÓDULO 2: PDC (PLANOS DE CORTE) ✂️

### Fluxo Completo

```
1. Lista PDCs em produção
2. Operador escolhe PDC
3. Ver origens agrupadas
4. Escolher origem para cortar
5. Escanear código da origem (validação)
6. Ver lista de cortes desta origem
7. Iniciar próximo corte pendente
8. Tirar foto do medidor (obrigatória)
9. Confirmar corte
10. Sistema gera código + imprime etiqueta
11. Repetir 7-10 para outros cortes da mesma origem
12. Escanear nova locação da origem
13. Ir para próxima origem (voltar ao passo 4)
14. Quando tudo cortado → escanear locações de armazenamento
15. Finalizar PDC
```

### Telas

#### 2.1 Lista de PDCs
```javascript
// GET /api/mobile/pdcs/producao
{
  success: true,
  data: [
    {
      id: 15,
      codigo_plano: 'PDC-PLA-015',
      cliente: 'Granja São José',
      aviario: 'Aviário 3',
      total_cortes: 12,
      cortes_concluidos: 5,
      progresso: 42,
      total_origens: 3
    }
  ]
}
```

**Layout:**
```
┌────────────────────────┐
│ ✂️ PDC              │
│ Planos em Produção (3) │
├────────────────────────┤
│ PDC-PLA-015           │
│ Granja São José       │
│ Aviário 3             │
│ ────────────          │
│ 5/12 cortes ✅        │
│ ████████░░░░ 42%      │
│ 📍 3 origens          │
├────────────────────────┤
│ PDC-CIA-008           │
│ Fazenda Boa Vista     │
│ ...                    │
└────────────────────────┘
```

#### 2.2 Origens Agrupadas
```javascript
// GET /api/mobile/pdcs/:id/origens
{
  pdc: { id: 15, codigo_plano: 'PDC-PLA-015', ... },
  origens: [
    {
      tipo: 'bobina',
      id: 1,
      codigo: 'BOB-PLA-000001',
      locacao: '0015-A-0023',
      produto: 'Verde 200gr 6,20m',
      cortes: [
        { id: 123, codigo_corte: 'COR-2025-00120', metragem: 12.50, status: 'concluido' },
        { id: 124, metragem: 15.30, status: 'pendente' }
      ],
      total_cortes: 4,
      cortes_concluidos: 2
    }
  ]
}
```

**Layout:**
```
┌────────────────────────┐
│ PDC-PLA-015           │
│ Granja São José       │
├────────────────────────┤
│ 📊 PROGRESSO          │
│ 5/12 cortes           │
│ ████████░░░░ 42%      │
├────────────────────────┤
│ 🎯 ORIGENS (3)        │
│                        │
│ 📦 BOB-PLA-000001     │
│ Verde 200gr • Propex   │
│ ✂️ 4 cortes           │
│ ✅ 2 concluídos       │
│ 📍 0015-A-0023        │
│ [CORTAR]              │
├────────────────────────┤
│ ♻️ RET-PLA-000089     │
│ ...                    │
└────────────────────────┘
```

#### 2.3 Scanner de Validação de Origem
```
POST /api/mobile/pdcs/validar-origem
{
  pdc_id: 15,
  origem_esperada_id: 1,
  origem_esperada_tipo: 'bobina',
  codigo_escaneado: 'BOB-PLA-000001'
}

Response:
{ success: true, valido: true }
```

#### 2.4 Realizar Corte
```html
<div class="corte-form">
  <h2>✂️ CORTE</h2>
  <p>Origem: BOB-PLA-000001</p>
  <p>Locação: 0015-A-0023</p>
  
  <div class="metragem-display">
    <h3>📏 METRAGEM A CORTAR</h3>
    <span class="metragem-value">15,30m</span>
  </div>
  
  <div class="foto-section">
    <h3>📸 FOTO DO MEDIDOR</h3>
    <img id="fotoPreview" src="">
    <button onclick="tirarFoto()">📷 TIRAR FOTO</button>
  </div>
  
  <button class="btn-primary" onclick="confirmarCorte()">
    ✅ CONFIRMAR CORTE
  </button>
</div>
```

```javascript
async function confirmarCorte() {
  const formData = new FormData();
  formData.append('pdc_id', 15);
  formData.append('item_id', 124);
  formData.append('origem_id', 1);
  formData.append('origem_tipo', 'bobina');
  formData.append('metragem_cortada', 15.30);
  formData.append('foto', fotoBlob);
  
  const result = await API.registrarCorte(formData);
  
  if (result.success) {
    mostrarSucesso(result.data.codigo_corte);
    aguardarImpressao();
  }
}
```

#### 2.5 Feedback de Sucesso
```
┌────────────────────────┐
│ ✅ SUCESSO!           │
├────────────────────────┤
│ ✂️ Corte Registrado   │
│ COR-2025-00125        │
│ 15,30m                │
│                        │
│ 🖨️ ETIQUETA ENVIADA   │
│    PARA IMPRESSÃO     │
│                        │
│ [⏱️ Aguardando...]    │
│                        │
│ [PRÓXIMO CORTE]       │
└────────────────────────┘
```

#### 2.6 Atualizar Locação
```
POST /api/mobile/pdcs/atualizar-locacao
{
  tipo: 'bobina',
  id: 1,
  nova_locacao: '0015-A-0023'
}
```

**Layout:**
```
┌────────────────────────┐
│ 📍 GUARDAR ORIGEM     │
├────────────────────────┤
│ ✅ Todos cortes       │
│    concluídos!        │
│                        │
│ 📦 BOB-PLA-000001     │
│ Sobra: 18,20m         │
│                        │
│ [SCANNER ATIVO]       │
│                        │
│ Escaneie a locação    │
│ onde guardou este item │
│                        │
│ 💡 Anterior:          │
│ 0015-A-0023          │
└────────────────────────┘
```

#### 2.7 Finalizar PDC
```
POST /api/mobile/pdcs/:id/finalizar
{
  locacoes: ['0025-A-0010', '0025-A-0011']
}
```

**Layout:**
```
┌────────────────────────┐
│ 🎉 PDC CONCLUÍDO!     │
│ PDC-PLA-015           │
├────────────────────────┤
│ ✅ 12/12 cortes       │
│                        │
│ 📦 ARMAZENAMENTO      │
│ Escaneie as locações   │
│                        │
│ [SCANNER ATIVO]       │
│                        │
│ 📍 ESCANEADAS (2)     │
│ ✅ 0025-A-0010        │
│ ✅ 0025-A-0011        │
│                        │
│ [+ ADICIONAR]         │
│                        │
│ [✅ FINALIZAR PDC]    │
└────────────────────────┘
```

---

## MÓDULO 3: CARREGAMENTO 📦

### Fluxo Completo

```
1. Lista PDCs finalizados
2. Operador escolhe PDC para carregar
3. Ver locações dos cortes
4. Ver lista de cortes (todos pendentes)
5. Escanear código de cada corte
6. Sistema valida se pertence ao PDC
7. Marcar como carregado
8. Repetir até todos validados
9. Botão "Finalizar Carregamento"
10. PDC arquivado → vai para histórico
```

### Telas

#### 3.1 Lista de PDCs Finalizados
```javascript
// GET /api/mobile/carregamento/disponiveis
{
  success: true,
  data: [
    {
      id: 15,
      codigo_plano: 'PDC-PLA-015',
      cliente: 'Granja São José',
      aviario: 'Aviário 3',
      total_cortes: 12,
      data_finalizacao: '2025-12-11',
      locacoes: ['0025-A-0010', '0025-A-0011']
    }
  ]
}
```

#### 3.2 Iniciar Carregamento
```javascript
// POST /api/mobile/carregamento/iniciar
{
  pdc_id: 15
}

Response:
{
  carregamento: {
    id: 45,
    codigo_carregamento: 'CAR-2025-00045',
    pdc_id: 15,
    status: 'em_andamento',
    total_cortes: 12,
    cortes_validados: 0
  }
}
```

#### 3.3 Scanner de Cortes
```javascript
// POST /api/mobile/carregamento/validar-corte
{
  carregamento_id: 45,
  codigo_corte: 'COR-2025-00123'
}

Response OK:
{
  success: true,
  valido: true,
  corte: { id: 123, codigo_corte: 'COR-2025-00123', metragem: 12.50 },
  progresso: { validados: 1, total: 12, percentual: 8 }
}

Response ERRO:
{
  success: false,
  valido: false,
  erro: 'Corte pertence a outro PDC',
  corte: {
    codigo_corte: 'COR-2025-00999',
    pdc_correto: 'PDC-CIA-008',
    cliente: 'Fazenda Boa Vista'
  }
}
```

**Layout:**
```
┌────────────────────────┐
│ 📷 ESCANEAR CORTE     │
├────────────────────────┤
│ [SCANNER ATIVO]       │
│                        │
│ 📊 Progresso:         │
│ 3/12 cortes           │
│ ████░░░░░░░░ 25%      │
│                        │
│ ✅ ÚLTIMOS:           │
│ ✅ COR-2025-00120     │
│ ✅ COR-2025-00121     │
│ ✅ COR-2025-00122     │
└────────────────────────┘
```

#### 3.4 Finalizar
```
POST /api/mobile/carregamento/:id/finalizar

Response:
{
  carregamento: {
    id: 45,
    status: 'concluido',
    data_conclusao: '2025-12-11 15:45:00',
    total_cortes: 12,
    cortes_validados: 12
  }
}
```

#### 3.5 Histórico
```
GET /api/mobile/carregamento/historico

Response:
{
  data: [
    {
      id: 45,
      codigo_carregamento: 'CAR-2025-00045',
      pdc: { codigo_plano: 'PDC-PLA-015', cliente: '...' },
      total_cortes: 12,
      data_conclusao: '2025-12-11 15:45:00'
    }
  ]
}
```

---

## COMPONENTES COMPARTILHADOS

### 1. Scanner Universal

```javascript
// js/scanner.js
class Scanner {
  constructor(callback) {
    this.callback = callback;
    this.scanner = null;
  }

  async init() {
    const { BarcodeScanner } = window;
    this.scanner = await BarcodeScanner.prepare();
  }

  async start() {
    try {
      const result = await this.scanner.scan();
      this.callback(result.code);
      navigator.vibrate(200); // Feedback tátil
    } catch (err) {
      console.error('Scan failed:', err);
    }
  }

  stop() {
    if (this.scanner) {
      this.scanner.stop();
    }
  }
}

// Uso:
const scanner = new Scanner((code) => {
  console.log('Código escaneado:', code);
  processarCodigo(code);
});
```

### 2. Câmera para Fotos

```javascript
// js/camera.js
class Camera {
  async tirarFoto() {
    const { Camera } = window;
    const photo = await Camera.getPhoto({
      quality: 85,
      width: 1280,
      height: 720,
      allowEditing: false,
      resultType: CameraResultType.Base64,
      source: CameraSource.Camera
    });
    
    return {
      base64: photo.base64String,
      format: photo.format
    };
  }

  async selecionarGaleria() {
    const { Camera } = window;
    const photo = await Camera.getPhoto({
      quality: 85,
      source: CameraSource.Photos,
      resultType: CameraResultType.Base64
    });
    
    return photo.base64String;
  }
}
```

### 3. API Layer

```javascript
// js/api.js
class API {
  static BASE_URL = 'https://controle-bobinas-20-production.up.railway.app/api';

  static async request(endpoint, options = {}) {
    const url = `${this.BASE_URL}${endpoint}`;
    
    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const response = await fetch(url, { ...defaultOptions, ...options });
    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Erro na requisição');
    }

    return data;
  }

  // CONSULTAS
  static async validateCode(code) {
    return this.request(`/mobile/validar-codigo/${code}`);
  }

  static async getBobinaDetails(id) {
    return this.request(`/bobinas/${id}`);
  }

  static async getRetalhoDetails(id) {
    return this.request(`/retalhos/${id}`);
  }

  static async getCorteDetails(id) {
    return this.request(`/cortes/${id}`);
  }

  static async getLocacaoItens(id) {
    return this.request(`/locacoes/${id}/itens`);
  }

  // PDC
  static async getPDCsProducao() {
    return this.request('/mobile/pdcs/producao');
  }

  static async getPDCOrigens(id) {
    return this.request(`/mobile/pdcs/${id}/origens`);
  }

  static async validarOrigem(data) {
    return this.request('/mobile/pdcs/validar-origem', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  static async registrarCorte(formData) {
    return this.request('/mobile/pdcs/registrar-corte', {
      method: 'POST',
      body: formData,
      headers: {} // FormData define Content-Type automaticamente
    });
  }

  static async atualizarLocacao(data) {
    return this.request('/mobile/pdcs/atualizar-locacao', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  static async finalizarPDC(id, locacoes) {
    return this.request(`/mobile/pdcs/${id}/finalizar`, {
      method: 'POST',
      body: JSON.stringify({ locacoes })
    });
  }

  // CARREGAMENTO
  static async getCarregamentosDisponiveis() {
    return this.request('/mobile/carregamento/disponiveis');
  }

  static async iniciarCarregamento(pdcId) {
    return this.request('/mobile/carregamento/iniciar', {
      method: 'POST',
      body: JSON.stringify({ pdc_id: pdcId })
    });
  }

  static async validarCorteCarregamento(carregamentoId, codigoCorte) {
    return this.request('/mobile/carregamento/validar-corte', {
      method: 'POST',
      body: JSON.stringify({
        carregamento_id: carregamentoId,
        codigo_corte: codigoCorte
      })
    });
  }

  static async finalizarCarregamento(id) {
    return this.request(`/mobile/carregamento/${id}/finalizar`, {
      method: 'POST'
    });
  }

  static async getHistoricoCarregamentos() {
    return this.request('/mobile/carregamento/historico');
  }
}
```

### 4. Utilidades

```javascript
// js/utils.js
const Utils = {
  formatarMetragem(metros) {
    return `${parseFloat(metros).toFixed(2)}m`;
  },

  formatarData(dataISO) {
    const data = new Date(dataISO);
    return data.toLocaleDateString('pt-BR');
  },

  formatarDataHora(dataISO) {
    const data = new Date(dataISO);
    return data.toLocaleString('pt-BR');
  },

  mostrarLoading() {
    document.getElementById('loading').style.display = 'flex';
  },

  esconderLoading() {
    document.getElementById('loading').style.display = 'none';
  },

  mostrarErro(mensagem) {
    alert(`❌ Erro: ${mensagem}`);
  },

  mostrarSucesso(mensagem) {
    alert(`✅ ${mensagem}`);
  },

  vibrar(duracao = 200) {
    if ('vibrate' in navigator) {
      navigator.vibrate(duracao);
    }
  }
};
```

---

## APIS

Ver documento completo em: `docs/API_MOBILE_V2.md`

**Resumo de endpoints necessários:**
- ✅ 11 endpoints já existem
- ❌ 11 endpoints precisam ser criados

**Alta prioridade:**
1. `/api/mobile/validar-codigo/:codigo`
2. `/api/mobile/pdcs/producao`
3. `/api/mobile/pdcs/:id/origens`
4. `/api/mobile/pdcs/registrar-corte`

---

## GUIA DE IMPLEMENTAÇÃO

### Fase 1: Setup (30 min)

```bash
# 1. Instalar dependências do Capacitor
npm install @capacitor/core @capacitor/cli
npm install @capacitor-mlkit/barcode-scanning
npm install @capacitor/camera

# 2. Sincronizar com Android
npx cap sync android

# 3. Abrir Android Studio para build
npx cap open android
```

### Fase 2: Menu Principal (30 min)

```html
<!-- public/mobile/index.html -->
<!DOCTYPE html>
<html>
<head>
  <title>Controle de Bobinas</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="css/mobile.css">
</head>
<body>
  <div class="menu-container">
    <header>
      <h1>🏭 Controle de Bobinas 2.0</h1>
      <p>Cortinave & BN</p>
    </header>

    <nav class="menu-buttons">
      <a href="consultas.html" class="menu-btn">
        <span class="icon">🔍</span>
        <span class="title">CONSULTAS</span>
        <span class="desc">Escanear QR e ver informações</span>
      </a>

      <a href="pdc.html" class="menu-btn">
        <span class="icon">✂️</span>
        <span class="title">PDC</span>
        <span class="desc">Planos de Corte em produção</span>
      </a>

      <a href="carregamento.html" class="menu-btn">
        <span class="icon">📦</span>
        <span class="title">CARREGAMENTO</span>
        <span class="desc">Validar cortes para envio</span>
      </a>
    </nav>

    <footer>
      <p>v2.0.0</p>
    </footer>
  </div>
</body>
</html>
```

### Fase 3: Módulos (2-3h cada)

1. **CONSULTAS** (mais simples)
2. **PDC** (mais complexo - fotos)
3. **CARREGAMENTO** (média complexidade)

### Fase 4: Testes (1-2h)

1. Testar scanner
2. Testar câmera
3. Testar fluxos completos
4. Testar offline/erros

### Fase 5: Build APK (30 min)

```bash
# Debug APK
cd android
./gradlew assembleDebug

# Release APK (requer keystore)
./gradlew assembleRelease
```

---

## CRONOGRAMA ESTIMADO

| Fase | Duração | Descrição |
|------|---------|-----------|
| 1 | 30 min | Setup Capacitor + plugins |
| 2 | 30 min | Menu principal |
| 3.1 | 2h | Módulo CONSULTAS |
| 3.2 | 3h | Módulo PDC |
| 3.3 | 2h | Módulo CARREGAMENTO |
| 4 | 2h | Testes |
| 5 | 30 min | Build APK |

**Total:** ~10-12 horas de desenvolvimento

---

## OBSERVAÇÕES IMPORTANTES

### Segurança
- ❌ Sem autenticação na v1.0
- ✅ Apenas dispositivo confiável
- ✅ Wi-Fi interno da empresa

### Performance
- ✅ Cache de dados em LocalStorage
- ✅ Compressão de fotos no servidor
- ✅ Loading states em todas ações

### UX
- ✅ Feedback visual imediato
- ✅ Vibração ao escanear
- ✅ Sons de sucesso/erro (opcional)
- ✅ Botões grandes (touch-friendly)

### Manutenção
- ✅ Código modular
- ✅ Comentários em português
- ✅ Console.log para debug
- ✅ Versionamento no footer

---

## PRÓXIMOS PASSOS

1. ✅ Criar estrutura de arquivos
2. ✅ Implementar Scanner universal
3. ✅ Implementar API layer
4. ✅ Criar módulo CONSULTAS
5. ✅ Criar módulo PDC
6. ✅ Criar módulo CARREGAMENTO
7. ✅ Testar tudo
8. ✅ Build APK
9. ✅ Deploy em produção

---

*Documento técnico completo - Pronto para implementação*  
*Atualizado em: 11/12/2025*
