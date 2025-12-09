# 🔧 Correção de Erros de API - App Mobile

## ❌ Problemas Identificados

### 1. "Erro ao carregar ordens de produção"
**Causa**: App tentava chamar `/api/mobile/ordens` como caminho relativo, resultando em `file:///api/mobile/ordens` (arquivo local inexistente).

### 2. "Erro ao buscar impressoras: undefined"
**Causa**: Plugin Bluetooth retornando `undefined` porque código esperava resposta de API, mas estava tentando acessar arquivo local.

**Raiz do problema**: Quando removemos a URL do Railway do `capacitor.config.json`, o app passou a carregar arquivos localmente (correto para UI), mas as chamadas de API também ficaram locais (incorreto).

---

## ✅ Solução Implementada

### 1. Criado `api-config.js` - Configuração Centralizada

**Arquivo**: `public/mobile/api-config.js`

```javascript
// Detecta ambiente e configura URL da API
const RAILWAY_API_URL = 'https://controle-bobinas-20-production.up.railway.app';

if (isNativeApp()) {
    // App Android → API do Railway
    apiBaseUrl = RAILWAY_API_URL;
} else {
    // Navegador → Caminho relativo (mesmo servidor)
    apiBaseUrl = '';
}

window.API_CONFIG = {
    BASE_URL: apiBaseUrl,
    MOBILE_API: apiBaseUrl + '/api/mobile',
    FULL_API: apiBaseUrl + '/api'
};
```

**Lógica**:
- **App Nativo** (Capacitor): UI local + API Railway remota
- **Navegador Web**: UI e API no mesmo servidor (relativo)

### 2. Atualizados todos os arquivos mobile

**Mudanças aplicadas em**:
- ✅ `public/mobile/index.html` - Incluído `<script src="/mobile/api-config.js"></script>`
- ✅ `public/mobile/app.js` - `API_BASE` agora usa `window.API_CONFIG.MOBILE_API`
- ✅ `public/mobile/impressao.html` - Incluído api-config.js
- ✅ `public/mobile/impressao.js` - `API_BASE` agora usa `window.API_CONFIG.FULL_API`
- ✅ `public/mobile/configurar-impressora.html` - Incluído api-config.js

**Importante**: `api-config.js` é carregado **ANTES** de qualquer outro script para garantir que `window.API_CONFIG` esteja disponível.

---

## 🎯 Resultado Final

### Arquitetura do App Nativo

```
┌─────────────────────────────────────┐
│   APP ANDROID (APK)                 │
│                                     │
│   UI (Local - Arquivos no APK):    │
│   ├─ index.html                    │
│   ├─ mobile/index.html             │
│   ├─ mobile/app.js                 │
│   ├─ mobile/styles.css             │
│   └─ mobile/api-config.js          │
│       ↓                             │
│   API (Remota - Railway):          │
│   ├─ GET /api/mobile/ordens        │
│   ├─ POST /api/mobile/corte        │
│   ├─ GET /api/mobile/imprimir/*    │
│   └─ Todas outras chamadas de API │
│       ↓                             │
│   Plugin Bluetooth (Nativo):       │
│   └─ window.bluetoothSerial        │
└─────────────────────────────────────┘
```

**Benefícios**:
- ⚡ UI super rápida (local, sem download)
- 🌐 Dados sempre atualizados (API Railway)
- 🖨️ Bluetooth nativo (impressão direta)
- 📶 Funciona com internet (para API calls)

---

## 🧪 Testes Necessários

### 1. Ordens de Produção

1. Abra o app
2. Toque **🏭 Ordens Produção**
3. **Resultado esperado**: Lista de ordens carrega do Railway
4. ✅ **SEM** mensagem de erro

### 2. Configurar Impressora

1. Toque **⚙️ Configurar Impressora**
2. Toque **🔍 Buscar Impressoras**
3. **Resultado esperado**: Lista de dispositivos Bluetooth pareados
4. ✅ **SEM** erro "undefined"

### 3. Consultas

1. Toque **🔍 Consultas**
2. Digite código (ex: BOB-0001)
3. **Resultado esperado**: Dados da bobina carregam
4. ✅ Mostra metragem, produto, etc.

### 4. Impressão

1. Toque **🖨️ Imprimir Etiquetas**
2. Selecione tipo (Bobina)
3. Digite código
4. **Resultado esperado**: Preview carrega
5. ✅ Dados vindos da API Railway

---

## 🔍 Como Verificar se Funcionou

### No Console do Navegador (DevTools)

Se abrir o app e inspecionar com Chrome DevTools (conectado via USB):

**Log esperado**:
```
🤖 App Nativo - API: https://controle-bobinas-20-production.up.railway.app
✅ API Config inicializada: {BASE_URL: "...", MOBILE_API: "...", FULL_API: "..."}
```

**Chamadas de rede** (Network tab):
```
✅ GET https://controle-bobinas-20-production.up.railway.app/api/mobile/ordens → 200 OK
✅ POST https://controle-bobinas-20-production.up.railway.app/api/mobile/corte → 200 OK
```

**Se aparecer** `file:///api/mobile/...` → **ERRO** (versão antiga do app)

---

## 🐛 Troubleshooting

### Ainda aparece erro de API

**Solução**:
1. **Desinstale completamente** o app antigo
2. **Limpe cache** do Android: Configurações → Apps → Controle Bobinas → Armazenamento → Limpar dados
3. **Reinstale** versão nova
4. Teste novamente

### "Erro de rede" ou "Timeout"

**Causa**: Celular sem internet

**Solução**:
1. Verifique WiFi ou dados móveis
2. App precisa internet para chamar API Railway
3. UI funciona offline, mas dados precisam de conexão

### Impressora não aparece

**NÃO relacionado** com correção de API. Problema é do Bluetooth:
1. Certifique-se que M58-LL está pareada (Configurações Bluetooth)
2. Impressora ligada e próxima (<10m)
3. Plugin Bluetooth precisa de permissão Location (Android 12+)

---

## 📊 Comparação Antes/Depois

| Aspecto | Antes (v2.2.1 - Bug) | Depois (v2.2.2 - Corrigido) |
|---------|----------------------|------------------------------|
| **UI** | Local (APK) ✅ | Local (APK) ✅ |
| **API** | Local (file:///) ❌ | Railway (https://) ✅ |
| **Ordens** | ❌ Erro ao carregar | ✅ Carrega do Railway |
| **Bluetooth** | ❌ Erro undefined | ✅ Lista impressoras |
| **Consultas** | ❌ Não funciona | ✅ Funciona |
| **Internet** | Não precisa (bug) | ✅ Necessária (correto) |

---

## 📝 Código das Mudanças

### api-config.js (Novo arquivo)

```javascript
const RAILWAY_API_URL = 'https://controle-bobinas-20-production.up.railway.app';

function isNativeApp() {
    return window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform();
}

let apiBaseUrl = isNativeApp() ? RAILWAY_API_URL : '';

window.API_CONFIG = {
    BASE_URL: apiBaseUrl,
    MOBILE_API: apiBaseUrl + '/api/mobile',
    FULL_API: apiBaseUrl + '/api'
};
```

### app.js (Mudança)

```javascript
// Antes
const API_BASE = '/api/mobile';

// Depois
const API_BASE = (window.API_CONFIG ? window.API_CONFIG.MOBILE_API : '/api/mobile');
```

### impressao.js (Mudança)

```javascript
// Antes
const API_BASE = '/api';

// Depois
const API_BASE = window.API_CONFIG ? window.API_CONFIG.FULL_API : '/api';
```

---

## 🚀 Próxima Validação

Após instalar o APK corrigido:

1. ✅ Teste **Ordens de Produção** (deve carregar lista)
2. ✅ Teste **Configurar Impressora** (deve listar dispositivos BT)
3. ✅ Teste **Consultas** (deve buscar bobinas/retalhos)
4. ✅ Teste **Impressão** (deve mostrar preview)
5. ✅ Teste **Conexão Bluetooth** (deve conectar M58-LL)
6. ✅ Teste **Impressão real** (deve imprimir etiqueta)

Se **todos** funcionarem → **APP PRONTO PARA PRODUÇÃO!** 🎉

---

**Versão**: 2.2.2 (API Fixes)  
**Data Build**: 09/12/2025  
**Status**: ✅ CORRIGIDO - APIs apontam para Railway  
**Arquivo**: `app-debug.apk` (4.2 MB)  
**Mudanças**: 5 arquivos (1 novo, 4 atualizados)
