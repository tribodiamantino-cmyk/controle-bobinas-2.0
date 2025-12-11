# ⚙️ Configuração do Ambiente Android - Controle Bobinas

## ❌ Problema Atual

```
ERROR: JAVA_HOME is not set and no 'java' command could be found in your PATH.
```

O projeto Android precisa do **Java JDK 11+** para compilar o APK.

## ✅ Soluções (Escolha Uma)

### 🎯 Opção 1: Android Studio (RECOMENDADO)

A forma mais simples e completa de configurar tudo automaticamente.

#### Passo 1: Download

1. Acesse: https://developer.android.com/studio
2. Baixe **Android Studio** (versão estável)
3. Execute o instalador

#### Passo 2: Instalação

1. Siga o wizard de instalação
2. Escolha instalação **Standard**
3. Android Studio irá instalar automaticamente:
   - Java JDK
   - Android SDK
   - Android SDK Build-Tools
   - Android Emulator (opcional)

#### Passo 3: Abrir Projeto

1. Abra Android Studio
2. **File → Open**
3. Navegue até `C:\controle bobinas 2.0\android`
4. Clique **OK**
5. Aguarde Gradle Sync (primeira vez demora ~5-10min)

#### Passo 4: Build APK

1. **Build → Build Bundle(s) / APK(s) → Build APK(s)**
2. Aguarde compilação
3. APK gerado em: `android/app/build/outputs/apk/debug/app-debug.apk`
4. Clique na notificação **locate** para abrir pasta

---

### 🔧 Opção 2: Java JDK Manual (Linha de Comando)

Se preferir apenas linha de comando sem Android Studio.

#### Passo 1: Download Java JDK

**Escolha uma opção**:

**A) Oracle JDK 11** (Requer conta Oracle gratuita):
- https://www.oracle.com/java/technologies/javase/jdk11-archive-downloads.html
- Baixe: `jdk-11.0.x_windows-x64_bin.exe`

**B) Microsoft Build of OpenJDK 11** (Recomendado, sem conta):
- https://www.microsoft.com/openjdk
- Baixe: `Microsoft Build of OpenJDK 11` para Windows x64

**C) Adoptium Eclipse Temurin 11**:
- https://adoptium.net/
- Baixe: `OpenJDK 11 (LTS)` para Windows x64

#### Passo 2: Instalar JDK

1. Execute o instalador baixado
2. Escolha pasta de instalação (ex: `C:\Program Files\Java\jdk-11`)
3. Anote o caminho da instalação

#### Passo 3: Configurar JAVA_HOME

**Via PowerShell (Sessão Atual)**:

```powershell
$env:JAVA_HOME = "C:\Program Files\Java\jdk-11"
$env:PATH = "$env:JAVA_HOME\bin;$env:PATH"
```

**Via Variáveis de Ambiente (Permanente)**:

1. Abra: **Painel de Controle → Sistema → Configurações avançadas do sistema**
2. Clique em **Variáveis de Ambiente**
3. Em **Variáveis do sistema**, clique **Novo**:
   - Nome: `JAVA_HOME`
   - Valor: `C:\Program Files\Java\jdk-11` (seu caminho)
4. Edite variável **Path**, adicione: `%JAVA_HOME%\bin`
5. Clique **OK** em tudo
6. **Reinicie o terminal**

#### Passo 4: Verificar Instalação

```powershell
java -version
```

**Saída esperada**:
```
openjdk version "11.0.x"
OpenJDK Runtime Environment
```

#### Passo 5: Download Android SDK Command Line Tools

1. Acesse: https://developer.android.com/studio#command-line-tools-only
2. Baixe: **Command line tools only** para Windows
3. Extraia em: `C:\Android\cmdline-tools`
4. Renomeie pasta extraída para `latest` (resultado: `C:\Android\cmdline-tools\latest`)

#### Passo 6: Configurar ANDROID_HOME

**Via PowerShell (Sessão Atual)**:

```powershell
$env:ANDROID_HOME = "C:\Android"
$env:PATH = "$env:ANDROID_HOME\cmdline-tools\latest\bin;$env:ANDROID_HOME\platform-tools;$env:PATH"
```

**Via Variáveis de Ambiente (Permanente)**:

1. Adicione variável: `ANDROID_HOME` = `C:\Android`
2. Edite **Path**, adicione:
   - `%ANDROID_HOME%\cmdline-tools\latest\bin`
   - `%ANDROID_HOME%\platform-tools`

#### Passo 7: Instalar SDK Components

```powershell
sdkmanager --install "platform-tools" "platforms;android-33" "build-tools;33.0.0"
```

#### Passo 8: Build APK

```powershell
cd "C:\controle bobinas 2.0\android"
.\gradlew assembleDebug
```

---

## 🧪 Verificar Configuração Completa

Execute em PowerShell:

```powershell
# Java
java -version

# Gradle (via wrapper do projeto)
cd "C:\controle bobinas 2.0\android"
.\gradlew --version

# Android SDK (se método 2)
sdkmanager --version
```

Tudo funcionando? ✅ Você está pronto para build!

---

## 📱 Build do APK (Após Configuração)

### Via PowerShell

```powershell
cd "C:\controle bobinas 2.0"

# Sincronizar assets web → Android
npm run android:sync

# Build APK debug
npm run android:build
```

**APK gerado em**:
```
C:\controle bobinas 2.0\android\app\build\outputs\apk\debug\app-debug.apk
```

### Via Android Studio

1. Abra projeto em `android/`
2. **Build → Build Bundle(s) / APK(s) → Build APK(s)**
3. Aguarde notificação de sucesso
4. Clique **locate** para abrir pasta do APK

---

## 🚀 Próximos Passos

Após gerar o APK:

1. **Copiar para celular** (WhatsApp, Drive, cabo USB)
2. **Instalar** (permitir fontes desconhecidas se solicitado)
3. **Parear M58-LL** (Bluetooth settings do Android)
4. **Configurar impressora** no app (⚙️ Configurar Impressora)
5. **Testar impressão** (🖨️ Imprimir Etiquetas → BOB-0001)

---

## 🐛 Troubleshooting

### "gradlew: command not found"

Execute em PowerShell (não CMD):
```powershell
.\gradlew assembleDebug
```

### "SDK location not found"

Crie `android/local.properties`:
```properties
sdk.dir=C:\\Android
```

### "Gradle daemon disappeared unexpectedly"

RAM insuficiente. Edite `android/gradle.properties`:
```properties
org.gradle.jvmargs=-Xmx2048m -XX:MaxPermSize=512m
```

### Build muito lento (primeira vez)

Normal. Gradle baixa dependências (~500MB). Builds seguintes serão rápidos.

---

## 📚 Documentação Oficial

- **Android Studio**: https://developer.android.com/studio/intro
- **Capacitor Android**: https://capacitorjs.com/docs/android
- **Gradle**: https://docs.gradle.org/current/userguide/command_line_interface.html

---

**Recomendação Final**: Use **Android Studio** (Opção 1). É mais simples, completo, e inclui ferramentas visuais úteis para desenvolvimento futuro.
