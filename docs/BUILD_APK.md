# 📱 Build e Instalação do App Android - Controle Bobinas

## 🎯 Visão Geral

Este documento descreve como compilar e instalar o aplicativo Android nativo do Controle de Bobinas, com suporte a **impressão Bluetooth direta** na impressora M58-LL.

## 📋 Pré-requisitos

- **Node.js** instalado (já configurado)
- **Java JDK 11+** (Android Studio instala automaticamente)
- **Android Studio** (recomendado) ou **Android SDK Command Line Tools**
- Impressora M58-LL pareada via Bluetooth com o celular

## 🔧 Método 1: Build via Linha de Comando (Recomendado)

### 1. Sincronizar Assets

Sempre que modificar arquivos em `public/`, sincronize:

```bash
npm run android:sync
# ou
npx cap sync android
```

### 2. Build APK Debug

Para gerar APK de teste:

```bash
npm run android:build
# ou
cd android
./gradlew assembleDebug
```

**Saída**: `android/app/build/outputs/apk/debug/app-debug.apk`

### 3. Build APK Release (Produção)

Para distribuição final:

```bash
npm run android:release
# ou
cd android
./gradlew assembleRelease
```

**Saída**: `android/app/build/outputs/apk/release/app-release-unsigned.apk`

> ⚠️ Para assinar o APK release, você precisa de um keystore. Veja seção **Assinatura de APK** abaixo.

## 🔧 Método 2: Build via Android Studio (Alternativo)

1. Abra Android Studio
2. **File → Open** → Selecione pasta `android/`
3. Aguarde Gradle Sync
4. **Build → Build Bundle(s) / APK(s) → Build APK(s)**
5. APK gerado em `app/build/outputs/apk/`

## 📲 Instalação no Celular

### Via Cabo USB

1. Conecte celular ao PC via USB
2. Ative **Modo Desenvolvedor** no Android:
   - Vá em **Configurações → Sobre o telefone**
   - Toque 7x em **Número da compilação**
   - Volte e entre em **Opções do desenvolvedor**
   - Ative **Depuração USB**
3. Instale via ADB:

```bash
cd android
./gradlew installDebug
```

### Via Compartilhamento (Sem Cabo)

1. Copie `app-debug.apk` para o celular (WhatsApp, Drive, email, etc.)
2. No celular, abra o arquivo APK
3. Se solicitado, permita **Instalar apps desconhecidos**
4. Toque em **Instalar**

## 🖨️ Configuração da Impressora M58-LL

### 1. Parear Bluetooth (Configurações do Android)

1. Abra **Configurações → Bluetooth**
2. Ligue a impressora M58-LL
3. Escaneie e selecione **BlueTooth Printer**
4. Senha de pareamento: `0000` ou `1234`

### 2. Configurar no App

1. Abra o app **Controle Bobinas**
2. No menu principal, toque em **⚙️ Configurar Impressora**
3. Toque em **🔍 Buscar Impressoras**
4. Selecione **BlueTooth Printer** na lista
5. Toque em **🔌 Conectar**
6. Toque em **🧪 Teste de Impressão**
7. Verifique se imprimiu corretamente

## ✅ Teste Completo de Impressão

### Testar Etiqueta de Bobina

1. No menu principal, toque em **🖨️ Imprimir Etiquetas**
2. Selecione **📦 Bobina**
3. Digite ou escaneie código (ex: `BOB-0001`)
4. Veja preview da etiqueta
5. Toque em **🖨️ Imprimir via Bluetooth**
6. Aguarde impressão

**Resultado Esperado**:
- QR Code da bobina (BOB-0001)
- Código do produto
- Cor e gramatura
- Metragem inicial
- Loja e fabricante

## 🔐 Assinatura de APK (Release)

Para distribuir APK release assinado:

### 1. Criar Keystore

```bash
keytool -genkey -v -keystore controle-bobinas.keystore -alias controle-bobinas -keyalg RSA -keysize 2048 -validity 10000
```

Preencha os dados solicitados e **guarde a senha com segurança**.

### 2. Configurar Gradle

Edite `android/app/build.gradle`:

```gradle
android {
    ...
    signingConfigs {
        release {
            storeFile file('../../controle-bobinas.keystore')
            storePassword 'SUA_SENHA_KEYSTORE'
            keyAlias 'controle-bobinas'
            keyPassword 'SUA_SENHA_KEY'
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}
```

### 3. Build Release Assinado

```bash
cd android
./gradlew assembleRelease
```

**Saída**: `android/app/build/outputs/apk/release/app-release.apk` (assinado)

## 🐛 Troubleshooting

### Erro: "BLUETOOTH_CONNECT permission denied"

**Solução**: No Android 12+, vá em **Configurações do App → Permissões** e conceda:
- Bluetooth
- Localização (necessária para Bluetooth scan)
- Câmera (para QR Code scanner)

### Impressora não aparece na lista

**Verificar**:
1. Impressora está ligada?
2. Bluetooth do celular está ativo?
3. Impressora está pareada em **Configurações → Bluetooth**?
4. Distância < 10m da impressora?

### Impressão não sai nada

**Verificar**:
1. Papel térmico está instalado corretamente?
2. Tampa da impressora está fechada?
3. Bateria da impressora está carregada?
4. Teste de impressão funciona? (botão na impressora)

### App não instala (erro de assinatura)

**Solução**: Desinstale versão anterior primeiro, depois reinstale.

### QR Code não escaneia

**Verificar**:
1. Permissão de câmera foi concedida?
2. Código QR está legível e não está borrado?
3. Iluminação adequada?

## 📦 Arquivos Importantes

- `android/app/build.gradle` - Configuração de build
- `android/app/src/main/AndroidManifest.xml` - Permissões e configurações
- `capacitor.config.json` - Configuração do Capacitor
- `public/js/bluetooth-printer.js` - Módulo de impressão ESC/POS
- `public/mobile/configurar-impressora.html` - Interface de configuração
- `public/mobile/impressao.js` - Lógica de impressão (modo nativo + PWA)

## 🚀 Distribuição

### Opção 1: APK Direto (Atual)

Compartilhe `app-release.apk` via WhatsApp, Drive, ou email. Usuários instalam manualmente.

**Vantagens**:
- Sem burocracia
- Distribuição rápida
- Sem taxas

**Desvantagens**:
- Usuários precisam permitir fontes desconhecidas
- Sem atualizações automáticas

### Opção 2: Google Play Store (Futuro)

Cadastrar conta Google Play Developer (US$ 25 única vez) e publicar.

**Vantagens**:
- Atualizações automáticas
- Mais confiável (Google Play Protect)
- Estatísticas de uso

**Desvantagens**:
- Taxa de US$ 25
- Processo de revisão (1-3 dias)
- Requer conformidade com políticas

## 📝 Notas de Desenvolvimento

- **Modo PWA**: Usa `window.print()` (impressão do navegador)
- **Modo App Nativo**: Usa Bluetooth ESC/POS direto
- **Detecção automática**: `Capacitor.isNativePlatform()`
- **Comandos ESC/POS**: Otimizados para M58-LL (58mm)
- **QR Code**: Gerado via ESC/POS nativo (comando `\x1D\x6B\x51`)

## 🔄 Workflow de Desenvolvimento

1. Modificar arquivos em `public/`
2. `npm run android:sync` para copiar assets
3. `npm run android:build` para gerar APK
4. Instalar e testar no celular
5. Ajustar se necessário
6. Repetir até estável
7. `npm run android:release` para versão final

## 📞 Suporte

Para problemas específicos da impressora M58-LL:
- Manual: Busque "M58-LL ESC/POS commands"
- Firmware: Verifique versão em Configurações da impressora
- Reset: Desligue e ligue novamente

---

**Versão**: 2.2.0  
**Data**: Janeiro 2025  
**Status**: ✅ Pronto para build e teste
