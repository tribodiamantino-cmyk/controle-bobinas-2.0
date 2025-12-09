# APK v2.2.4 - Debug Visual Integrado 🐛

## O Que Mudou

Adicionei um **console de debug VISÍVEL NA TELA** para você ver exatamente o que está acontecendo sem precisar de cabo USB.

## Como Usar

### 1. Instalar APK
- **Desinstale** a versão anterior completamente
- **Instale** o novo APK (v2.2.4 - Debug)

### 2. Ativar Console de Debug
1. Abra o app
2. Vá em **Configurar Impressora**
3. No canto inferior direito, vai aparecer um botão: **🐛 Debug**
4. Clique nele - vai abrir um console preto na parte de baixo da tela

### 3. Reproduzir o Erro
1. Com o console de debug ABERTO
2. Clique em **"Buscar Impressoras"**
3. Observe os logs aparecendo em tempo real na tela preta

### 4. Capturar Informações
- **Tire print/screenshot** da tela com os logs visíveis
- Me envie o print
- Vou saber EXATAMENTE qual é o problema

---

## O Que os Logs Mostram

O console vai mostrar TUDO:

### ✅ Inicialização
```
[14:30:15] 🔧 [DEBUG] DOMContentLoaded iniciado
[14:30:15] 🔧 [DEBUG] window.Capacitor existe? true
[14:30:15] 🔧 [DEBUG] window.bluetoothSerial existe? false
[14:30:15] 📱 App Nativo detectado - Aguardando plugin...
[14:30:16] ⏳ Tentativa 1/50 - Aguardando bluetoothSerial...
[14:30:16] ⏳ Tentativa 2/50 - Aguardando bluetoothSerial...
[14:30:17] ✅ Plugin bluetoothSerial disponível!
```

### ✅ Buscar Impressoras
```
[14:30:25] 🔍 [DEBUG] buscarImpressoras() chamado
[14:30:25] 🔧 Verificando window.bluetoothSerial... true
[14:30:25] ✅ Plugin bluetoothSerial OK
[14:30:25] 🔧 Verificando se Bluetooth está habilitado...
[14:30:26] 🔧 Bluetooth habilitado? true
[14:30:26] 🔧 Chamando bluetoothPrinter.listDevices()...
[14:30:27] ✅ Dispositivos retornados: [...]
[14:30:27] 📊 Total de dispositivos: 2
```

### ❌ Se Der Erro
```
[14:30:25] ❌ window.bluetoothSerial é undefined/null
[14:30:25] 🔍 window disponível: ['Capacitor', 'cordova', ...]
[14:30:25] ❌ ERRO em buscarImpressoras: Error: Plugin não disponível
[14:30:25] 📋 Stack trace: Error: Plugin não disponível at ...
```

---

## Cores dos Logs

- **Azul** 🔵 = Informação normal
- **Verde** 🟢 = Sucesso
- **Amarelo** 🟡 = Aviso
- **Vermelho** 🔴 = Erro

---

## Alternativa: Debug via USB

Se preferir usar o método profissional (Chrome DevTools), veja: **DEBUG_VIA_USB.md**

Mas com este console visual, você não precisa de cabo USB! 🎉

---

## Próximos Passos

1. Instale o APK
2. Ative o console de debug (botão 🐛)
3. Teste "Buscar Impressoras"
4. Tire print dos logs
5. Me envie

Vou corrigir o problema com base nos logs reais! 🚀
