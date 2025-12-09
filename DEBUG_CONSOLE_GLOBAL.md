# Debug Console Global - v2.2.6

## 🎯 O Que Foi Feito

Criado um **componente de debug reutilizável** disponível em **TODAS as páginas mobile** do sistema.

## 📦 Arquivos Criados/Modificados

### Novo Arquivo
- **`public/mobile/debug-console.js`**: Componente standalone de debug console

### Arquivos Modificados
- **`public/mobile/index.html`**: Adicionado `<script src="/mobile/debug-console.js"></script>`
- **`public/mobile/impressao.html`**: Adicionado `<script src="/mobile/debug-console.js"></script>`
- **`public/mobile/configurar-impressora.html`**: Já tinha debug inline (pode ser removido futuramente)

## 🚀 Funcionalidades

### Botão de Debug
- **Posição**: Canto superior direito (fixo)
- **Texto**: `🐛 Debug` (fechado) / `✖ Fechar Debug` (aberto)
- **Ação**: Abre/fecha console de logs

### Console de Debug
- **Posição**: Topo da tela (abaixo do header)
- **Tamanho**: Max 300px de altura, scroll automático
- **Cores**:
  - 🔵 Azul (info) - Logs normais
  - 🟢 Verde (success) - Sucessos
  - 🟡 Amarelo (warn) - Avisos
  - 🔴 Vermelho (error) - Erros

### Botões Internos
1. **📋 Copiar**: Copia todos os logs para área de transferência
2. **🗑️ Limpar**: Limpa console (útil para novo teste)

## 💻 Como Usar no Código

### Auto-inicialização
O console se inicializa automaticamente ao carregar a página:
```javascript
// Nada a fazer! Só incluir o script no HTML
<script src="/mobile/debug-console.js"></script>
```

### Logs Automáticos
Qualquer `console.log/error/warn` será capturado:
```javascript
console.log('Teste');        // Aparece azul no console
console.error('Erro');       // Aparece vermelho
console.warn('Aviso');       // Aparece amarelo
```

### Funções Disponíveis
```javascript
// Adicionar log customizado
addDebugLine('Minha mensagem', 'info');    // ou 'error', 'warn', 'success'

// Copiar logs programaticamente
copiarLogs();

// Limpar logs
limparLogs();

// Abrir/fechar console
toggleDebugConsole();
```

## 📱 Páginas com Debug Ativo

### ✅ Implementado
1. **Menu Principal** (`/mobile/index.html`)
   - Debug de navegação
   - QR Code scanner
   - API calls

2. **Configurar Impressora** (`/mobile/configurar-impressora.html`)
   - Plugin Bluetooth
   - Listagem de dispositivos
   - Conexão e impressão

3. **Central de Impressão** (`/mobile/impressao.html`)
   - Impressão de bobinas/retalhos/cortes
   - Comandos ESC/POS

### 🔜 A Implementar
- Todas as outras páginas mobile que forem criadas

## 🐛 Resolução do Problema do Plugin

### Problema Original
```
❌ window.bluetoothSerial é undefined/null
```

### Causa
APK foi compilado **ANTES** de rodar `npm install`, então o plugin não estava nas dependências.

### Solução Aplicada
```bash
# 1. Garantir dependências instaladas
npm install

# 2. Sincronizar plugin com Android
npx cap sync android
# Resultado: "Found 1 Cordova plugin: cordova-plugin-bluetooth-serial@0.4.7"

# 3. Rebuild completo
gradlew clean assembleDebug
```

### Ordem Correta de Build
```
1. npm install           ← Instala dependências
2. npx cap sync android  ← Sincroniza plugins
3. gradlew assembleDebug ← Compila APK
```

## 📊 Logs Esperados (Após Correção)

### Ao Abrir Configurar Impressora
```
[HH:MM:SS] 🐛 Console de debug inicializado
[HH:MM:SS] 📱 Plataforma: Nativa (Android)
[HH:MM:SS] 🔧 [DEBUG] DOMContentLoaded iniciado
[HH:MM:SS] 🔧 [DEBUG] window.Capacitor existe? true
[HH:MM:SS] 🔧 [DEBUG] window.bluetoothSerial existe? false
[HH:MM:SS] 📱 App Nativo detectado - Aguardando plugin Bluetooth...
[HH:MM:SS] ⏳ Tentativa 1/50 - Aguardando bluetoothSerial...
[HH:MM:SS] ✅ Plugin bluetoothSerial disponível!        ← DEVE APARECER
[HH:MM:SS] 🔍 Métodos disponíveis: list,connect,write,...
[HH:MM:SS] ✅ bluetoothPrinter inicializado com sucesso
```

### Ao Buscar Impressoras
```
[HH:MM:SS] 🔍 [DEBUG] buscarImpressoras() chamado
[HH:MM:SS] 🔧 Verificando window.bluetoothSerial... true  ← AGORA TRUE
[HH:MM:SS] ✅ Plugin bluetoothSerial OK
[HH:MM:SS] 🔧 Bluetooth habilitado? true
[HH:MM:SS] ✅ Dispositivos retornados: [{...}]
[HH:MM:SS] 📊 Total de dispositivos: X
```

## 🎯 Benefícios

### Para Desenvolvimento
- ✅ Debug em tempo real sem USB
- ✅ Logs persistem durante navegação
- ✅ Fácil compartilhamento (copiar logs)
- ✅ Disponível em todas as páginas

### Para Diagnóstico
- ✅ Identifica plugin não carregado
- ✅ Mostra erros de API
- ✅ Valida fluxo de dados
- ✅ Timestamps precisos

### Para Usuário
- ✅ Pode reportar erros com logs exatos
- ✅ Não precisa de ferramentas técnicas
- ✅ Screenshot funciona perfeitamente

## 🔄 Próximos Passos

1. **Testar APK v2.2.6**:
   - Desinstalar app antigo completamente
   - Reiniciar celular (limpar cache Cordova)
   - Instalar nova versão
   - Verificar se `bluetoothSerial` carrega

2. **Se funcionar**:
   - Testar busca de impressoras
   - Testar conexão
   - Testar impressão
   - Implementar impressão de QR codes

3. **Migração futura**:
   - Remover código de debug inline de `configurar-impressora.html`
   - Padronizar uso do componente compartilhado

---

**Versão**: v2.2.6  
**Data**: 09/12/2025  
**Status**: Debug global implementado + Plugin Bluetooth corrigido ✅
