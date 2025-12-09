# 🐛 Resolver Erro Android Studio - IllegalStateException

## ❌ Erro Apresentado

```
java.lang.IllegalStateException: This method is forbidden on EDT because it does not pump the event queue.
```

Este é um **bug conhecido** do Android Studio/IntelliJ com Gradle sync. Não afeta o funcionamento do app, mas impede o sync correto.

## ✅ Soluções (Tente na Ordem)

### 🎯 Solução 1: Invalidate Caches (RECOMENDADO)

No Android Studio:

1. **File → Invalidate Caches...**
2. Marque todas as opções:
   - ✅ Clear file system cache and Local History
   - ✅ Clear VCS Log caches and indexes
   - ✅ Clear downloaded shared indexes
3. Clique **Invalidate and Restart**
4. Aguarde Android Studio reiniciar
5. Aguarde Gradle Sync automático

**Resultado esperado**: Erro some após restart.

---

### 🎯 Solução 2: Desabilitar Warning (Temporário)

Se o erro persistir, desabilite o listener problemático:

1. **Help → Edit Custom VM Options**
2. Adicione ao final:
   ```
   -Didea.disable.gradle.warning.listeners=true
   ```
3. Salve e reinicie Android Studio

---

### 🎯 Solução 3: Atualizar Android Studio

Se estiver em versão antiga:

1. **Help → Check for Updates**
2. Instale última versão estável
3. Reinicie

---

### 🎯 Solução 4: Build Via Terminal (BYPASS - Funciona Sempre)

Ignorar Android Studio e usar terminal direto:

#### Passo 1: Verificar Java

No PowerShell:

```powershell
java -version
```

Se aparecer versão Java → pule para Passo 2.

Se aparecer erro → **Android Studio JÁ TEM Java embutido!** Use ele:

```powershell
# Encontrar Java do Android Studio
$androidStudioJava = "C:\Program Files\Android\Android Studio\jbr\bin"

# Se instalou em outro lugar, procure em:
# C:\Program Files\Android\Android Studio\jre\bin
# ou
# C:\Users\SeuUsuario\AppData\Local\Android\Studio\jre\bin

# Adicionar ao PATH temporariamente
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
$env:PATH = "$env:JAVA_HOME\bin;$env:PATH"

# Verificar
java -version
```

**Saída esperada**:
```
openjdk version "17.0.x" ou "11.0.x"
```

#### Passo 2: Build APK via Terminal

```powershell
cd "C:\controle bobinas 2.0\android"
.\gradlew assembleDebug
```

**Primeira execução**: ~5-10min (baixa dependências)

**Saída esperada**:
```
BUILD SUCCESSFUL in XXs
XX actionable tasks: XX executed
```

**APK gerado em**:
```
C:\controle bobinas 2.0\android\app\build\outputs\apk\debug\app-debug.apk
```

#### Passo 3: Instalar no Celular

**Via Cabo USB**:
```powershell
.\gradlew installDebug
```

**Via Compartilhamento**:
1. Copie `app-debug.apk` do caminho acima
2. Envie para celular (WhatsApp, Drive, email)
3. Abra arquivo no celular
4. Permita fontes desconhecidas
5. Instale

---

### 🎯 Solução 5: Atualizar Gradle (Avançado)

Editar `android/gradle/wrapper/gradle-wrapper.properties`:

```properties
distributionUrl=https\://services.gradle.org/distributions/gradle-8.2.1-all.zip
```

Depois:
```powershell
cd android
.\gradlew wrapper --gradle-version=8.2.1
```

---

## 🚀 Atalho Rápido (Se Estiver com Pressa)

**Ignore o Android Studio completamente** e faça tudo via terminal:

```powershell
# 1. Configurar Java do Android Studio
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
$env:PATH = "$env:JAVA_HOME\bin;$env:PATH"

# 2. Verificar
java -version

# 3. Build APK
cd "C:\controle bobinas 2.0\android"
.\gradlew assembleDebug

# 4. Encontrar APK
explorer.exe app\build\outputs\apk\debug
```

Pronto! APK gerado sem usar interface do Android Studio.

---

## 🎯 Qual Solução Usar?

| Situação | Solução Recomendada |
|----------|---------------------|
| Android Studio aberto | Solução 1 (Invalidate Caches) |
| Erro persiste | Solução 2 (Desabilitar warning) |
| Quer evitar Android Studio | Solução 4 (Terminal) |
| Nada funciona | Solução 5 (Atualizar Gradle) |

---

## ✅ Verificar se APK Está OK

Após gerar, verifique:

```powershell
cd "C:\controle bobinas 2.0\android\app\build\outputs\apk\debug"
dir app-debug.apk
```

**Tamanho esperado**: ~5-15 MB

Se existir → **✅ APK pronto para instalar!**

---

## 📱 Próximos Passos (Após Build)

1. ✅ APK gerado
2. ⏩ Copiar para celular
3. ⏩ Instalar
4. ⏩ Parear M58-LL (Bluetooth)
5. ⏩ Configurar impressora no app
6. ⏩ Testar impressão BOB-0001

---

## 🐛 Contexto do Erro

O erro `IllegalStateException: forbidden on EDT` acontece porque:

- Android Studio tentou executar operação Gradle na thread UI (Event Dispatch Thread)
- Gradle precisa rodar em background thread
- Bug conhecido desde Android Studio Flamingo (2022)
- Não afeta build via terminal
- Corrigido em versões mais recentes (2024+)

**TL;DR**: É bug do Android Studio, não do seu projeto. Use terminal se persistir.

---

**Recomendação Final**: Use **Solução 4 (Terminal)** - mais rápido e confiável.
