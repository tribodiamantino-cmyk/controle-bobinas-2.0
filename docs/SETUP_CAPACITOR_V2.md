# Configuração Completa do Capacitor - Mobile v2.0

> **Guia definitivo para configurar e fazer build do APK**  
> Data: 12/12/2025 | Versão: 2.5.0

---

## 📋 Índice

1. [Pré-requisitos](#pré-requisitos)
2. [Instalação Concluída](#instalação-concluída)
3. [Configuração Android](#configuração-android)
4. [Sincronização](#sincronização)
5. [Build do APK](#build-do-apk)
6. [Troubleshooting](#troubleshooting)

---

## Pré-requisitos

### ✅ Verificações Necessárias

**1. Node.js e NPM**
```bash
node -v  # Deve ser >= 18.0.0
npm -v   # Deve ser >= 9.0.0
```

**2. Java Development Kit (JDK)**
```bash
java -version  # Deve ser JDK 17 ou 21
```

Se não tiver, instalar:
- Download: https://adoptium.net/
- Instalar JDK 17 (LTS recomendado)
- Configurar `JAVA_HOME`:
  ```bash
  # Windows (PowerShell Admin)
  [System.Environment]::SetEnvironmentVariable("JAVA_HOME", "C:\Program Files\Eclipse Adoptium\jdk-17.0.XX-hotspot", [System.EnvironmentVariableTarget]::Machine)
  ```

**3. Android Studio**
- Download: https://developer.android.com/studio
- Durante instalação, incluir:
  - [x] Android SDK
  - [x] Android SDK Platform
  - [x] Android Virtual Device (opcional)

**4. Configurar Android SDK**
```bash
# Windows - Adicionar ao PATH
ANDROID_HOME=C:\Users\SEU_USUARIO\AppData\Local\Android\Sdk
Path += %ANDROID_HOME%\platform-tools
Path += %ANDROID_HOME%\tools
Path += %ANDROID_HOME%\cmdline-tools\latest\bin
```

**5. Gradle**
- Já incluído no projeto (`android/gradlew`)
- Não precisa instalar separadamente

---

## Instalação Concluída ✅

### Plugins Instalados

```json
{
  "@capacitor/core": "^8.0.0",
  "@capacitor/cli": "^8.0.0",
  "@capacitor/android": "^8.0.0",
  "@capacitor-mlkit/barcode-scanning": "latest",
  "@capacitor/camera": "latest"
}
```

### Configuração Atual

**Arquivo:** `capacitor.config.json`

```json
{
  "appId": "com.cortinave.controlebobinas",
  "appName": "Controle Bobinas",
  "webDir": "public",
  "version": "2.5.0-20251212-mobile-v2",
  "server": {
    "androidScheme": "http",
    "cleartext": true,
    "hostname": "localhost",
    "url": "https://controle-bobinas-20-production.up.railway.app"
  },
  "plugins": {
    "Camera": {
      "quality": 85,
      "width": 1280,
      "height": 720,
      "allowEditing": false,
      "saveToGallery": false,
      "correctOrientation": true
    },
    "BarcodeScanning": {
      "formats": ["CODE_128"],
      "lensFacing": "back"
    }
  }
}
```

---

## Configuração Android

### 1. Verificar AndroidManifest.xml

**Arquivo:** `android/app/src/main/AndroidManifest.xml`

Deve conter as permissões:

```xml
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">

    <!-- Permissões necessárias -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.CAMERA" />
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" 
                     android:maxSdkVersion="32" />
    
    <!-- Feature câmera (obrigatório para Camera e Barcode Scanner) -->
    <uses-feature android:name="android.hardware.camera" android:required="false" />
    <uses-feature android:name="android.hardware.camera.autofocus" android:required="false" />

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/AppTheme"
        android:usesCleartextTraffic="true">

        <activity
            android:name=".MainActivity"
            android:configChanges="orientation|keyboardHidden|keyboard|screenSize|locale|smallestScreenSize|screenLayout|uiMode"
            android:exported="true"
            android:launchMode="singleTask"
            android:theme="@style/AppTheme.NoActionBarLaunch"
            android:windowSoftInputMode="adjustResize">

            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>

        </activity>

        <provider
            android:name="androidx.core.content.FileProvider"
            android:authorities="${applicationId}.fileprovider"
            android:exported="false"
            android:grantUriPermissions="true">
            <meta-data
                android:name="android.support.FILE_PROVIDER_PATHS"
                android:resource="@xml/file_paths" />
        </provider>
    </application>

</manifest>
```

### 2. Verificar build.gradle (app)

**Arquivo:** `android/app/build.gradle`

```gradle
android {
    namespace "com.cortinave.controlebobinas"
    compileSdk 34
    
    defaultConfig {
        applicationId "com.cortinave.controlebobinas"
        minSdk 23
        targetSdk 34
        versionCode 3
        versionName "2.5.0"
        testInstrumentationRunner "androidx.test.runner.AndroidJUnitRunner"
    }
    
    buildTypes {
        release {
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
}

dependencies {
    implementation 'androidx.core:core:1.12.0'
    implementation 'androidx.appcompat:appcompat:1.6.1'
    
    // Capacitor
    implementation project(':capacitor-android')
    implementation project(':capacitor-app')
    implementation project(':capacitor-camera')
    implementation project(':capacitor-haptics')
    implementation project(':capacitor-keyboard')
    implementation project(':capacitor-status-bar')
    
    // ML Kit Barcode Scanning
    implementation 'com.google.mlkit:barcode-scanning:17.2.0'
}
```

### 3. Verificar settings.gradle

**Arquivo:** `android/settings.gradle`

```gradle
include ':app'
include ':capacitor-android'
project(':capacitor-android').projectDir = new File('../node_modules/@capacitor/android/capacitor')

include ':capacitor-app'
project(':capacitor-app').projectDir = new File('../node_modules/@capacitor/app/android')

include ':capacitor-camera'
project(':capacitor-camera').projectDir = new File('../node_modules/@capacitor/camera/android')

include ':capacitor-haptics'
project(':capacitor-haptics').projectDir = new File('../node_modules/@capacitor/haptics/android')

include ':capacitor-keyboard'
project(':capacitor-keyboard').projectDir = new File('../node_modules/@capacitor/keyboard/android')

include ':capacitor-status-bar'
project(':capacitor-status-bar').projectDir = new File('../node_modules/@capacitor/status-bar/android')
```

---

## Sincronização

### 1. Sincronizar Assets Web → Android

```bash
cd "c:\controle bobinas 2.0"
npm run android:sync
```

**O que esse comando faz:**
- Copia arquivos de `public/` para `android/app/src/main/assets/public/`
- Atualiza configurações do Capacitor
- Registra plugins no projeto Android
- Atualiza AndroidManifest.xml

**Output esperado:**
```
✔ Copying web assets from public to android/app/src/main/assets/public in 245.32ms
✔ Creating capacitor.config.json in android/app/src/main/assets in 1.15ms
✔ copy android in 249.86ms
✔ Updating Android plugins in 8.24ms
✔ update android in 58.47ms
✔ Syncing Gradle in 524.31ms
```

### 2. Verificar Sync

```bash
# Arquivos devem existir
ls android/app/src/main/assets/public/mobile/
# Deve mostrar: index.html, consultas.html, pdc.html, carregamento.html, css/, js/
```

---

## Build do APK

### Opção 1: Debug APK (Recomendado para Testes)

```bash
cd "c:\controle bobinas 2.0"
npm run android:build
```

**Comando equivalente:**
```bash
cd android
.\gradlew assembleDebug
```

**Output esperado:**
```
BUILD SUCCESSFUL in 2m 15s
47 actionable tasks: 47 executed
```

**Localização do APK:**
```
android/app/build/outputs/apk/debug/app-debug.apk
```

**Tamanho aproximado:** 15-25 MB

---

### Opção 2: Release APK (Produção)

⚠️ **Requer keystore configurado**

**1. Criar Keystore (primeira vez)**

```bash
cd "c:\controle bobinas 2.0\android\app"
keytool -genkey -v -keystore controle-bobinas.keystore -alias controle-bobinas -keyalg RSA -keysize 2048 -validity 10000
```

**Perguntas:**
- **Senha:** `[definir senha segura]`
- **Nome/Sobrenome:** Cortinave
- **Unidade organizacional:** TI
- **Organização:** Cortinave
- **Cidade:** Palotina
- **Estado:** PR
- **País:** BR

**2. Configurar build.gradle**

```gradle
android {
    signingConfigs {
        release {
            storeFile file('controle-bobinas.keystore')
            storePassword 'SUA_SENHA'
            keyAlias 'controle-bobinas'
            keyPassword 'SUA_SENHA'
        }
    }
    
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            shrinkResources true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
}
```

**3. Build Release**

```bash
npm run android:release
```

**Localização:**
```
android/app/build/outputs/apk/release/app-release.apk
```

---

## Instalação no Dispositivo

### Via USB (Android Debug Bridge)

**1. Habilitar "Modo Desenvolvedor" no Xiaomi Mi 13T**
- Configurações → Sobre o telefone
- Toque 7x em "Número da versão"
- Volta → Sistema → Opções do desenvolvedor
- Ativar "Depuração USB"

**2. Conectar via USB**

```bash
# Verificar dispositivo conectado
adb devices
# Deve mostrar: XXXXXXX    device

# Instalar APK
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

**Output:**
```
Performing Streamed Install
Success
```

---

### Via Transferência de Arquivo

1. Copiar APK para pendrive/nuvem
2. No celular, abrir arquivo APK
3. Permitir "Instalar apps de fontes desconhecidas"
4. Confirmar instalação

---

## Testando o App

### 1. Abrir App

- Procurar ícone "Controle Bobinas" no menu
- Abrir app

### 2. Tela Inicial

Deve aparecer:
- Header: "CONTROLE DE BOBINAS"
- 3 botões grandes:
  - 🔍 CONSULTAS
  - 🏭 PDC
  - 📦 CARREGAMENTO

### 3. Testar Scanner

- Abrir PDC
- Abrir um plano
- Tentar validar origem
- **Scanner ML Kit deve abrir câmera nativa**
- Escanear código de barras Code 128

### 4. Testar Camera

- No PDC, iniciar um corte
- Clicar em "TIRAR FOTO"
- **Câmera nativa deve abrir**
- Tirar foto do medidor
- Foto deve aparecer no preview

---

## Troubleshooting

### Erro: "JAVA_HOME não configurado"

```bash
# Windows PowerShell (Admin)
[System.Environment]::SetEnvironmentVariable("JAVA_HOME", "C:\Program Files\Eclipse Adoptium\jdk-17.0.XX-hotspot", [System.EnvironmentVariableTarget]::Machine)

# Reiniciar PowerShell
java -version
```

---

### Erro: "Android SDK not found"

**Solução:**
```bash
# Abrir Android Studio
# Tools → SDK Manager
# Instalar:
- Android SDK Platform 34
- Android SDK Build-Tools 34.0.0
- Android Emulator (opcional)
```

---

### Erro: "Plugin 'XXX' not found"

**Solução:**
```bash
npm run android:sync  # Re-sincronizar
```

---

### Erro: "Permission denied" ao instalar APK

**Solução:**
- No celular: Configurações → Apps → Acesso especial
- "Instalar apps desconhecidos" → Chrome/Files → Permitir

---

### Erro: Camera/Scanner não abre

**Verificações:**
1. Permissões no AndroidManifest.xml
2. Plugin instalado: `npm ls @capacitor/camera`
3. Sync feito: `npm run android:sync`
4. Permissões concedidas no app (Configurações do app)

---

### APK muito grande (>50MB)

**Otimizações:**
1. Usar release build (minify + shrink)
2. Remover logs de debug
3. Otimizar imagens em `public/`

---

## Comandos Úteis

### Limpar Build

```bash
cd android
.\gradlew clean
```

### Rebuild Completo

```bash
npm run android:sync
cd android
.\gradlew clean assembleDebug
```

### Ver Logs do Dispositivo

```bash
adb logcat | Select-String "Capacitor"
```

### Desinstalar App

```bash
adb uninstall com.cortinave.controlebobinas
```

---

## Scripts NPM Disponíveis

```json
{
  "scripts": {
    "android:sync": "npx cap sync android",
    "android:build": "cd android && .\\gradlew assembleDebug",
    "android:release": "cd android && .\\gradlew assembleRelease"
  }
}
```

**Uso:**
```bash
npm run android:sync     # Sincronizar assets
npm run android:build    # Build debug APK
npm run android:release  # Build release APK
```

---

## Estrutura de Arquivos Android

```
android/
├── app/
│   ├── src/
│   │   └── main/
│   │       ├── assets/
│   │       │   └── public/         # Assets web (sincronizados)
│   │       ├── java/
│   │       │   └── com/cortinave/
│   │       │       └── MainActivity.java
│   │       ├── res/                # Recursos Android
│   │       └── AndroidManifest.xml
│   ├── build.gradle                # Configuração do app
│   └── controle-bobinas.keystore   # Keystore (release)
├── gradle/
├── build.gradle                    # Configuração raiz
├── settings.gradle                 # Módulos do projeto
└── gradlew                         # Gradle Wrapper (executável)
```

---

## Versão e Versionamento

### Atualizar Versão do App

**1. package.json**
```json
{
  "version": "2.5.0"
}
```

**2. capacitor.config.json**
```json
{
  "version": "2.5.0-20251212-mobile-v2"
}
```

**3. android/app/build.gradle**
```gradle
defaultConfig {
    versionCode 3          // Incrementar a cada release
    versionName "2.5.0"    // Versão semântica
}
```

---

## Próximos Passos

### Após Build Bem-Sucedido

1. ✅ Instalar APK no Xiaomi Mi 13T
2. ✅ Testar todos 3 módulos (CONSULTAS, PDC, CARREGAMENTO)
3. ✅ Validar scanner ML Kit
4. ✅ Validar câmera para fotos
5. ✅ Testar com dados reais
6. ✅ Coletar feedback do operador

### Melhorias Futuras

- [ ] Ícone personalizado do app
- [ ] Splash screen customizada
- [ ] Modo offline (cache)
- [ ] Notificações push
- [ ] Analytics
- [ ] Crash reporting

---

**Documento criado em:** 12/12/2025  
**Autor:** Setup Capacitor Mobile v2.0  
**Versão:** 1.0.0
