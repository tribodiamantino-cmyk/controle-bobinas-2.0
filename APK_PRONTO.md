# 🎉 APK Gerado com Sucesso! - Próximos Passos

## ✅ Status Atual

**APK Compilado**: ✅ SUCESSO  
**Arquivo**: `app-debug.apk`  
**Tamanho**: 4.17 MB  
**Local**: `C:\controle bobinas 2.0\android\app\build\outputs\apk\debug\app-debug.apk`

## 📱 Como Instalar no Celular

### Método 1: Via WhatsApp/Drive (Mais Fácil)

1. **Copiar APK**:
   - Abra o Windows Explorer (já deve estar aberto na pasta do APK)
   - Clique direito em `app-debug.apk` → Enviar para → Compartilhar
   - Ou envie via WhatsApp Web, Google Drive, email, etc.

2. **No Celular**:
   - Baixe o arquivo `app-debug.apk`
   - Toque no arquivo para abrir
   - Se aparecer "Instalar apps desconhecidos bloqueado":
     - Vá em **Configurações → Segurança → Fontes desconhecidas**
     - Ou **Configurações → Apps → Acesso especial → Instalar apps desconhecidos**
     - Permita para o app que você está usando (Chrome, WhatsApp, Arquivos)
   - Toque em **Instalar**
   - Aguarde instalação (~10s)
   - Toque em **Abrir**

### Método 2: Via Cabo USB

1. Conecte celular ao PC via USB
2. Copie `app-debug.apk` para pasta Download do celular
3. No celular, abra **Arquivos** → **Download**
4. Toque em `app-debug.apk`
5. Siga passos de instalação acima

---

## 🖨️ Configurar Impressora M58-LL

### 1. Parear Bluetooth (Configurações do Android)

1. **Ligue a impressora M58-LL** (botão lateral)
2. No celular, abra **Configurações → Bluetooth**
3. Ative Bluetooth se estiver desligado
4. Toque em **Escanear** ou **Buscar dispositivos**
5. Aguarde aparecer **BlueTooth Printer** ou **M58-LL**
6. Toque no nome da impressora
7. Digite senha: **0000** (quatro zeros) ou **1234**
8. Aguarde **Conectado** ou **Pareado**

**Dica**: Se não parear, desligue e ligue a impressora novamente.

### 2. Configurar no App

1. **Abra o app** "Controle Bobinas"
2. No menu principal, toque em **⚙️ Configurar Impressora**
3. Toque no botão **🔍 Buscar Impressoras**
4. Aparecerá lista de dispositivos Bluetooth pareados
5. Toque em **BlueTooth Printer** (ou nome da sua M58-LL)
6. Toque no botão **🔌 Conectar**
7. Aguarde mensagem "✅ Conectado com sucesso!"
8. Toque em **🧪 Teste de Impressão**
9. Verifique se imprimiu:
   ```
   TESTE DE IMPRESSAO
   Controle Bobinas 2.0
   Impressora M58-LL
   [QR CODE TEST-12345]
   ```

**Resultado esperado**: Etiqueta de teste impressa com QR Code.

---

## ✂️ Testar Impressão de Etiqueta Real

### Teste com Bobina

1. No menu principal, toque em **🖨️ Imprimir Etiquetas**
2. Selecione **📦 Bobina**
3. Digite código: **BOB-0001** (ou escaneie QR Code se tiver)
4. Toque em **Buscar**
5. Veja preview da etiqueta
6. Toque em **🖨️ Imprimir via Bluetooth**
7. Aguarde impressão (~3-5s)

**Etiqueta deve conter**:
- QR Code (BOB-0001)
- Código do produto
- Cor e gramatura
- Metragem inicial
- Loja e fabricante

### Teste com Retalho

1. **🖨️ Imprimir Etiquetas** → **♻️ Retalho**
2. Digite: **RET-0001**
3. Imprimir via Bluetooth

### Teste com Corte

1. **🖨️ Imprimir Etiquetas** → **✂️ Corte**
2. Digite: **COR-2025-00001** (ou código do seu corte)
3. Imprimir via Bluetooth

---

## 🐛 Solução de Problemas

### Impressora não aparece na lista

**Possíveis causas**:
- Impressora não está pareada nas Configurações Bluetooth
- Impressora está desligada
- Bluetooth do celular está desativado

**Solução**:
1. Vá em Configurações → Bluetooth
2. Certifique-se que M58-LL está pareada (não apenas conectada)
3. Ligue a impressora se estiver desligada
4. Volte ao app e toque em "Buscar Impressoras" novamente

### Erro ao conectar

**Possíveis causas**:
- Outro app está usando a impressora
- Impressora muito longe (>10m)
- Bateria da impressora baixa

**Solução**:
1. Desligue e ligue a impressora
2. Aproxime celular da impressora (<2m)
3. Carregue a bateria se estiver baixa
4. Tente conectar novamente no app

### Não imprime nada / Papel em branco

**Possíveis causas**:
- Papel térmico instalado errado
- Papel térmico comum (não térmico)
- Tampa da impressora aberta
- Bateria muito fraca

**Solução**:
1. Verifique se papel térmico está correto (lado brilhante para cima)
2. Use apenas papel térmico de 58mm
3. Feche bem a tampa
4. Carregue bateria
5. Teste impressão via botão da impressora (teste de hardware)

### QR Code não escaneia

**Possíveis causas**:
- Tamanho do QR Code muito pequeno
- Impressão borrada
- Código muito longo

**Solução**:
- Ajuste tamanho no código (atualmente size=5)
- Verifique qualidade do papel térmico
- Limpe cabeça de impressão com álcool isopropílico

### App pede permissões constantemente

**No Android 12+**, é necessário conceder permissões:

1. Abra **Configurações do celular**
2. **Apps** → **Controle Bobinas**
3. **Permissões**
4. Conceda:
   - ✅ Bluetooth (Permitir)
   - ✅ Localização (Permitir) - *necessária para scan Bluetooth*
   - ✅ Câmera (Permitir) - *para QR Code scanner*

---

## 🔄 Atualizar App (Futuro)

Quando houver nova versão:

1. Compile novo APK: `npm run android:build`
2. Desinstale versão antiga no celular
3. Instale nova versão
4. **Ou** sobrescreva (se assinatura for igual)

---

## 🔐 Gerar APK Release (Produção)

Quando tudo estiver funcionando perfeitamente:

```powershell
# 1. Criar keystore (primeira vez)
keytool -genkey -v -keystore controle-bobinas.keystore -alias controle-bobinas -keyalg RSA -keysize 2048 -validity 10000

# 2. Build release
cd android
.\gradlew assembleRelease

# 3. APK assinado em:
# android/app/build/outputs/apk/release/app-release.apk
```

Veja `BUILD_APK.md` para instruções completas de assinatura.

---

## 📊 Correções Aplicadas

### Problema 1: Erro IllegalStateException EDT

**Erro**: `java.lang.IllegalStateException: This method is forbidden on EDT`

**Causa**: Bug do Android Studio com Gradle sync

**Solução**: Bypass - build via terminal com `gradlew assembleDebug`

### Problema 2: Plugin Bluetooth Desatualizado

**Erro**: 
```
capacitor-bluetooth-serial namespace not specified
cannot find symbol savedCall.error()
```

**Causa**: Plugin `capacitor-bluetooth-serial` incompatível com Capacitor 8

**Solução**: Substituído por `cordova-plugin-bluetooth-serial@0.4.7` (estável e compatível)

**Correções aplicadas**:
1. Remover `capacitor-bluetooth-serial`
2. Instalar `cordova-plugin-bluetooth-serial`
3. Recriar `bluetooth-printer.js` usando API Cordova (`window.bluetoothSerial`)
4. Sync assets: `npx cap sync android`
5. Build: `gradlew assembleDebug`

---

## 📁 Arquivos do Projeto

| Arquivo | Descrição |
|---------|-----------|
| `app-debug.apk` | APK instalável (4.17 MB) |
| `public/js/bluetooth-printer.js` | Módulo de impressão ESC/POS |
| `public/mobile/configurar-impressora.html` | Interface configuração |
| `public/mobile/impressao.js` | Lógica impressão (PWA + Nativo) |
| `capacitor.config.json` | Config Capacitor |
| `android/` | Projeto Android nativo |

---

## 🎯 Próxima Fase (Após Validação)

Quando validar que tudo funciona:

1. **Ajustes de layout** (se necessário)
   - Tamanho QR Code
   - Espaçamento linhas
   - Tamanho fonte

2. **Build Release**
   - Criar keystore
   - Assinar APK
   - Distribuir versão final

3. **Ícone Customizado**
   - Criar ícone 512x512px
   - Atualizar `android/app/src/main/res/mipmap-*`

4. **Splash Screen**
   - Design tela de abertura
   - Configurar em `capacitor.config.json`

5. **Google Play** (opcional)
   - Conta desenvolvedor (US$ 25)
   - Publicar app
   - Atualizações automáticas

---

**Versão**: 2.2.0  
**Data Build**: 09/12/2025  
**Status**: ✅ APK PRONTO PARA TESTE  
**Plugin Bluetooth**: cordova-plugin-bluetooth-serial@0.4.7
