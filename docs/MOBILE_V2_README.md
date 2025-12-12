# 📱 Mobile v2.0 - Guia Rápido

> **Sistema Mobile completo para gestão de bobinas em produção**  
> Versão: 2.5.0 | Data: 12/12/2025

---

## 🎯 Visão Geral

Aplicativo Android nativo desenvolvido com **Capacitor 7** para operações em chão de fábrica:

- 🔍 **CONSULTAS** - Verificar informações de bobinas, retalhos, cortes e locações
- 🏭 **PDC** - Controlar produção com validação de origens e fotos de contraprova
- 📦 **CARREGAMENTO** - Validar cortes para envio ao cliente

---

## 🏗️ Arquitetura

### Stack
```
Frontend:  Vanilla JavaScript + Bootstrap 5 + HTML5/CSS3
Mobile:    Capacitor 7 (wrapper nativo Android)
Scanner:   ML Kit Barcode Scanning (Code 128)
Camera:    Capacitor Camera (HD 1280x720)
Backend:   Node.js + Express + MySQL (Railway)
Device:    Xiaomi Mi 13T (Android 13+)
```

### Estrutura de Arquivos
```
public/mobile/
├── index.html                 # Menu principal (3 botões)
├── consultas.html             # Módulo CONSULTAS
├── pdc.html                   # Módulo PDC (5 telas)
├── carregamento.html          # Módulo CARREGAMENTO (4 telas)
├── css/
│   └── mobile.css             # Estilos globais (500+ linhas)
└── js/
    ├── config.js              # Configurações (API, scanner, camera)
    ├── utils.js               # 30+ funções utilitárias
    ├── api.js                 # 22 endpoints mapeados
    ├── scanner.js             # Wrapper ML Kit
    ├── camera.js              # Wrapper Capacitor Camera
    ├── consultas.js           # Lógica CONSULTAS
    ├── pdc.js                 # Lógica PDC
    └── carregamento.js        # Lógica CARREGAMENTO
```

---

## 🚀 Quick Start

### 1. Instalar Dependências

```bash
cd "c:\controle bobinas 2.0"
npm install
```

### 2. Sincronizar Assets Web → Android

```bash
npm run android:sync
```

### 3. Build APK Debug

```bash
npm run android:build
```

**Output:** `android/app/build/outputs/apk/debug/app-debug.apk`

### 4. Instalar no Dispositivo

```bash
# Via USB (com ADB)
adb install android/app/build/outputs/apk/debug/app-debug.apk

# Ou transferir APK manualmente
```

---

## 📚 Documentação Completa

| Documento | Descrição |
|-----------|-----------|
| **docs/MOBILE_V2_COMPLETO.md** | Especificação técnica completa (1.126 linhas) |
| **docs/GUIA_TESTES_MOBILE_V2.md** | 28 cenários de teste detalhados |
| **docs/SETUP_CAPACITOR_V2.md** | Configuração completa + build APK |
| **docs/API_MOBILE_V2.md** | Documentação dos 22 endpoints |

---

## 🔑 Features Principais

### Módulo CONSULTAS (741 linhas)
- ✅ Scanner de códigos Code 128
- ✅ Input manual com validação
- ✅ Detalhes de bobinas (metragem, locação, status)
- ✅ Detalhes de retalhos (origem, produto)
- ✅ Detalhes de cortes (PDC, cliente, foto)
- ✅ Detalhes de locações (itens armazenados)

### Módulo PDC (986 linhas)
- ✅ Lista PDCs em produção com progresso
- ✅ Agrupamento de origens (bobinas/retalhos)
- ✅ Validação de origem via scanner
- ✅ **Captura obrigatória de foto do medidor**
- ✅ Registro de corte com upload multipart
- ✅ Atualização de locação pós-corte
- ✅ Finalização com múltiplas locações

### Módulo CARREGAMENTO (622 linhas)
- ✅ Lista PDCs finalizados
- ✅ Validação de cortes via scanner
- ✅ Progresso em tempo real (barra + %)
- ✅ Detecção de erros (corte errado, duplicado)
- ✅ Finalização com auditoria
- ✅ Histórico de carregamentos

---

## 🔌 Plugins Capacitor

```json
{
  "@capacitor/core": "^8.0.0",
  "@capacitor/android": "^8.0.0",
  "@capacitor-mlkit/barcode-scanning": "7.4.0",
  "@capacitor/camera": "8.0.0"
}
```

### Configurações

**Scanner:**
- Formato: Code 128 (único)
- Lens: Back camera
- Feedback: Beep + vibração

**Camera:**
- Resolução: 1280x720 (HD)
- Qualidade: 85%
- Orientação: Corrigida automaticamente
- Salvar galeria: Não

---

## 🧪 Testes

### No Navegador (Desktop)

```bash
# Iniciar servidor
npm run dev

# Acessar mobile
http://localhost:3000/mobile/index.html

# Simular scanner no console (F12)
consultas.processarCodigo('BOB-PLA-000001');
pdc.processarScan('BOB-PLA-000001');
carregamento.processarScan('COR-2025-00001');
```

### No Dispositivo Android

1. Instalar APK no Xiaomi Mi 13T
2. Abrir app "Controle Bobinas"
3. Executar 28 cenários de teste (ver `docs/GUIA_TESTES_MOBILE_V2.md`)

---

## 🛠️ Scripts Disponíveis

```bash
# Backend
npm start              # Produção
npm run dev            # Desenvolvimento (nodemon)

# Mobile
npm run android:sync   # Sincronizar assets web → Android
npm run android:build  # Build debug APK
npm run android:release # Build release APK (requer keystore)
```

---

## 🔧 Configuração da API

**Arquivo:** `public/mobile/js/config.js`

```javascript
const CONFIG = {
  API_BASE_URL: 'https://controle-bobinas-20-production.up.railway.app/api',
  SCANNER: {
    formats: ['CODE_128'],
    enableBeep: true,
    enableVibrate: true
  },
  CAMERA: {
    quality: 85,
    width: 1280,
    height: 720
  }
};
```

---

## 📊 Estatísticas do Projeto

```
Frontend:         3.500+ linhas (13 arquivos)
Backend:          617 linhas (10 novos endpoints)
Documentação:     3.000+ linhas (4 docs)
Total:            ~7.000 linhas de código
Commits:          8 commits
Tempo dev:        1 dia
```

---

## ⚠️ Requisitos

### Desenvolvimento
- Node.js >= 18.0.0
- NPM >= 9.0.0
- JDK 17 (para build Android)
- Android Studio (opcional, mas recomendado)

### Produção
- Xiaomi Mi 13T (ou similar Android 13+)
- Conexão Wi-Fi estável
- Permissões: Câmera, Armazenamento

---

## 🐛 Troubleshooting

### Scanner não abre
- Verificar permissão de câmera no app
- Re-sincronizar: `npm run android:sync`

### Câmera não funciona
- Verificar AndroidManifest.xml (permissões)
- Verificar plugin instalado: `npm ls @capacitor/camera`

### API não responde
- Verificar URL em `config.js`
- Verificar servidor: `GET /api/health`

### Build falha
- Limpar: `cd android && .\gradlew clean`
- Re-sync: `npm run android:sync`
- Rebuild: `npm run android:build`

---

## 📞 Suporte

**Documentação Completa:**
- `docs/MOBILE_V2_COMPLETO.md` - Especificações técnicas
- `docs/GUIA_TESTES_MOBILE_V2.md` - Cenários de teste
- `docs/SETUP_CAPACITOR_V2.md` - Setup e build

**Health Check:**
```
GET https://controle-bobinas-20-production.up.railway.app/api/health
```

---

## 📝 Changelog

### v2.5.0 (12/12/2025)
- ✅ Reconstrução completa do mobile
- ✅ 3 módulos implementados (CONSULTAS, PDC, CARREGAMENTO)
- ✅ Scanner ML Kit Code 128
- ✅ Camera HD para contraprova
- ✅ 10 novos endpoints backend
- ✅ Capacitor 7 configurado
- ✅ Documentação completa

---

**Desenvolvido para:** Cortinave & BN  
**Versão:** 2.5.0  
**Data:** 12/12/2025
