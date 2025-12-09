# Debug do App Android via Chrome DevTools (USB)

## 🎯 Objetivo
Ver console.log, erros JavaScript, network requests e tudo que acontece no app Android em tempo real.

## 📋 Pré-requisitos
- ✅ Cabo USB (conectar celular ao PC)
- ✅ Google Chrome no PC
- ✅ App instalado no celular
- ⏳ Ativar "Depuração USB" no Android

---

## 🔧 PASSO 1: Habilitar Depuração USB no Android

### No seu celular:

1. **Abra Configurações** do Android
2. Vá em **"Sobre o telefone"** ou **"Sobre o dispositivo"**
3. Encontre **"Número da versão"** ou **"Versão do MIUI/One UI"**
4. **Toque 7 vezes** no número da versão
   - Vai aparecer: "Você agora é um desenvolvedor!"
5. Volte para Configurações
6. Procure por **"Opções do desenvolvedor"** ou **"Developer Options"**
   - Pode estar em: Configurações > Sistema > Avançado
7. Dentro de "Opções do desenvolvedor":
   - Ative **"Depuração USB"**
   - Ative **"Instalação via USB"** (se tiver)

---

## 🔌 PASSO 2: Conectar Celular ao PC

1. Conecte o celular ao PC via **cabo USB**
2. No celular vai aparecer popup:
   - **"Permitir depuração USB?"**
   - Marque **"Sempre permitir neste computador"**
   - Clique **"OK"** ou **"Permitir"**

3. Se não aparecer popup:
   - Puxe a barra de notificações
   - Toque na notificação "USB"
   - Mude de "Carregar apenas" para **"Transferência de arquivos"** ou **"PTP"**

---

## 🌐 PASSO 3: Abrir Chrome DevTools

1. No **PC**, abra o Google Chrome
2. Digite na barra de endereço:
   ```
   chrome://inspect
   ```
3. Vai abrir página "Devices"
4. Certifique-se que **"Discover USB devices"** está MARCADO ✅

---

## 📱 PASSO 4: Inspecionar o App

1. No celular, **abra o app** (Controle de Bobinas)
2. No Chrome do PC (página chrome://inspect):
   - Em poucos segundos vai aparecer seu celular
   - Abaixo dele, vai listar aplicativos abertos
   - Procure por: **"com.cortinave.controlebobinas"**

3. Clique em **"inspect"** ao lado do app
4. Vai abrir **DevTools** com:
   - **Console**: Vê todos os console.log e erros ❌
   - **Network**: Vê requisições para Railway API 🌐
   - **Elements**: Vê o HTML renderizado 🔍
   - **Sources**: Vê código JavaScript executado 📄

---

## 🐛 PASSO 5: Reproduzir o Erro

Com o DevTools aberto:

1. No celular, navegue até **"Configurar Impressora"**
2. Clique em **"Buscar Impressoras"**
3. **NO PC**, no DevTools Console, você verá:
   - ✅ Logs do sistema (se tiver)
   - ❌ Erro EXATO que está acontecendo
   - 📊 Stack trace completo

---

## 📸 O Que Fazer Quando Ver o Erro

1. **Tire print do Console** (no PC)
2. **Copie a mensagem de erro completa**
3. Se tiver erro tipo:
   ```
   Uncaught ReferenceError: bluetoothSerial is not defined
   ```
   ou
   ```
   Cannot read property 'list' of undefined
   ```
4. Me envie! Assim eu sei EXATAMENTE o que corrigir

---

## 🔍 Comandos Úteis no Console

Você pode digitar comandos no Console do DevTools para testar:

```javascript
// Ver se Capacitor carregou
window.Capacitor

// Ver se plugin Bluetooth existe
window.bluetoothSerial

// Ver se bluetoothPrinter foi criado
window.bluetoothPrinter

// Testar listar dispositivos manualmente
window.bluetoothSerial.list(
  devices => console.log('Dispositivos:', devices),
  error => console.log('Erro:', error)
)
```

---

## ❓ Problemas Comuns

### "Nenhum dispositivo aparece no chrome://inspect"
- Certifique-se que "Depuração USB" está ATIVA
- Desconecte e reconecte o cabo USB
- No celular, puxe notificações e mude modo USB
- Reinicie o Chrome no PC

### "Dispositivo aparece mas app não lista"
- Certifique-se que o app está ABERTO no celular
- Aguarde 10-20 segundos
- Recarregue a página chrome://inspect

### "Unauthorized" ou "Offline"
- No celular, revogue autorizações: Opções Desenvolvedor > Revogar autorizações USB
- Desconecte cabo
- Reconecte e aceite popup novamente

---

## 🎯 Próximos Passos

Depois de configurar e ver os erros:
1. Me envie os prints/mensagens de erro
2. Vou corrigir o problema exato
3. Gero novo APK
4. Você testa de novo (mas agora com debug ativo para confirmar correção)

---

## 📚 Referências
- [Chrome Remote Debugging](https://developer.chrome.com/docs/devtools/remote-debugging/)
- [Android Debug Bridge (ADB)](https://developer.android.com/studio/command-line/adb)
