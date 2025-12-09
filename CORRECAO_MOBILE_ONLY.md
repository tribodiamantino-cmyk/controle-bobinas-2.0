# 📱 App Mobile-Only - Correção Aplicada

## ❌ Problema Original

O app Android estava abrindo **todo o sistema web** (dashboard, produtos, estoque, etc.) em vez de mostrar apenas a **interface mobile** (impressão de etiquetas, configuração de impressora).

**Causa**: `capacitor.config.json` tinha configuração:
```json
"server": {
  "url": "https://controle-bobinas-20-production.up.railway.app"
}
```

Isso fazia o app carregar a URL do Railway (sistema completo web) em vez dos arquivos locais mobile.

---

## ✅ Solução Aplicada

### 1. Removida URL do servidor em `capacitor.config.json`

**Antes**:
```json
{
  "server": {
    "url": "https://controle-bobinas-20-production.up.railway.app",
    "cleartext": true,
    "androidScheme": "https"
  }
}
```

**Depois**:
```json
{
  "server": {
    "androidScheme": "https"
  }
}
```

Agora o app carrega arquivos **locais** (do próprio APK), não do servidor Railway.

### 2. Criado redirecionamento inteligente em `public/index.html`

**Novo arquivo `index.html`**:
```html
<script>
  function isNativeApp() {
    return window.Capacitor && 
           window.Capacitor.isNativePlatform && 
           window.Capacitor.isNativePlatform();
  }

  if (isNativeApp()) {
    // App Android → Interface Mobile
    window.location.href = '/mobile/index.html';
  } else {
    // Navegador → Interface Web Completa
    window.location.href = '/index-web.html';
  }
</script>
```

**Lógica**:
- Se `Capacitor` está presente → App nativo → Redireciona para `/mobile/index.html`
- Se `Capacitor` NÃO está presente → Navegador web → Redireciona para `/index-web.html`

### 3. Interface web preservada

**Arquivo renomeado**:
- `public/index.html` (antigo) → `public/index-web.html`

O sistema web continua funcionando normalmente quando acessado via navegador.

---

## 📱 Resultado Final

### No App Android (APK)

Ao abrir o app:

1. **Carrega**: `index.html` local (dentro do APK)
2. **Detecta**: Está em app nativo (Capacitor presente)
3. **Redireciona**: Para `/mobile/index.html`
4. **Mostra**: Menu mobile com 5 opções:
   - 🏭 Ordens Produção
   - 🔍 Consultas
   - 🚚 Carregamento
   - 🖨️ Imprimir Etiquetas
   - ⚙️ Configurar Impressora

**✅ SEM sistema web completo**  
**✅ SEM dashboard**  
**✅ SEM produtos/estoque/ordens**  
**✅ APENAS interface mobile otimizada**

### No Navegador Web

Ao acessar `https://controle-bobinas-20-production.up.railway.app`:

1. **Carrega**: `index.html` do servidor
2. **Detecta**: NÃO está em app nativo (Capacitor ausente)
3. **Redireciona**: Para `/index-web.html`
4. **Mostra**: Sistema web completo (dashboard, navbar, etc.)

**✅ Sistema web funciona normalmente**  
**✅ Nada mudou para usuários web**

---

## 🔄 Como Atualizar App no Celular

### 1. Desinstalar versão antiga

1. No celular, vá em **Configurações → Apps**
2. Encontre **Controle Bobinas**
3. Toque em **Desinstalar**
4. Confirme

### 2. Instalar nova versão

1. Copie `app-debug.apk` para o celular (WhatsApp, Drive, etc.)
2. Abra o arquivo APK
3. Permita fontes desconhecidas se solicitado
4. Toque em **Instalar**
5. Aguarde instalação
6. Toque em **Abrir**

### 3. Verificar resultado

Ao abrir o app, você deve ver **APENAS**:

```
📦 Bobinas App
Operações de Corte

[Menu com 5 cards]:
🏭 Ordens Produção
🔍 Consultas
🚚 Carregamento
🖨️ Imprimir Etiquetas
⚙️ Configurar Impressora
```

**Se ainda aparecer** o sistema web completo (navbar com Produtos, Estoque, etc.):
- Force close do app (feche completamente)
- Limpe cache: Configurações → Apps → Controle Bobinas → Armazenamento → Limpar cache
- Abra novamente

---

## 🧪 Testar Funcionalidades

### 1. Configurar Impressora M58-LL

1. Toque **⚙️ Configurar Impressora**
2. **🔍 Buscar Impressoras**
3. Selecione **BlueTooth Printer**
4. **🔌 Conectar**
5. **🧪 Teste de Impressão**
6. Verifique se imprimiu

### 2. Imprimir Etiqueta

1. Toque **🖨️ Imprimir Etiquetas**
2. Selecione **📦 Bobina**
3. Digite: `BOB-0001`
4. Buscar
5. Ver preview
6. **🖨️ Imprimir via Bluetooth**
7. Verifique impressão

---

## 🌐 Servidor Railway Continua Funcionando

O servidor Railway **NÃO foi alterado**. Ele continua:
- ✅ Servindo API para o app (`/api/*`)
- ✅ Servindo sistema web completo (navegador)
- ✅ Processando requisições normalmente

**Mudança**: App Android agora usa arquivos locais para UI, mas continua chamando API do Railway para dados.

**Benefícios**:
- ⚡ App mais rápido (UI local, sem download de HTML/CSS/JS)
- 📶 Funciona offline (UI sempre disponível)
- 🔌 Apenas precisa internet para API calls (buscar dados, salvar, etc.)

---

## 📁 Arquivos Modificados

| Arquivo | Modificação |
|---------|-------------|
| `capacitor.config.json` | Removido `server.url` (Railway) |
| `public/index.html` | **Novo**: Redirecionamento inteligente |
| `public/index-web.html` | **Renomeado** de `index.html` (preservado) |

**Total de mudanças**: 3 arquivos  
**Código modificado**: ~30 linhas  
**Complexidade**: Baixa  
**Risco**: Mínimo (sistema web não afetado)

---

## 🐛 Troubleshooting

### App ainda mostra sistema web

**Solução**:
1. Desinstale completamente
2. Reinstale versão nova
3. Limpe cache se persistir

### Erro "Não foi possível conectar ao servidor"

**Causa**: App agora precisa internet apenas para API calls (dados), não UI.

**Solução**:
- UI mobile funciona offline
- Para buscar bobinas/retalhos, precisa internet (chamadas API)
- Verifique conexão WiFi/dados móveis

### Impressão não funciona

**Não relacionado** com esta mudança. Veja `APK_PRONTO.md` seção "Solução de Problemas".

---

## 📊 Comparação Antes/Depois

| Aspecto | Antes (v1) | Depois (v2) |
|---------|------------|-------------|
| URL aberta | Railway web completo | Local `/mobile/index.html` |
| UI mostrada | Dashboard, navbar, produtos | Menu mobile (5 cards) |
| Tamanho APK | 4.17 MB | 4.17 MB (igual) |
| Velocidade | Depende de internet | Instantâneo (local) |
| Offline | ❌ Não funciona | ✅ UI funciona (API precisa internet) |
| Experiência | 🖥️ Desktop em mobile | 📱 Mobile nativo |

---

## 🚀 Próximos Passos (Opcional)

### Se quiser app 100% offline

Implementar **cache de dados**:
1. Salvar bobinas/retalhos no localStorage
2. Sincronizar quando online
3. App funciona totalmente offline

**Complexidade**: Média  
**Tempo estimado**: 2-3 horas  
**Benefício**: App funciona sem internet

### Se quiser melhorar performance

1. **Minificar** JS/CSS (reduzir tamanho)
2. **Comprimir** imagens
3. **Lazy loading** de componentes

**Benefício**: App abre ainda mais rápido

---

**Versão**: 2.2.1 (Mobile-Only)  
**Data Build**: 09/12/2025  
**Status**: ✅ CORRIGIDO - Apenas interface mobile no app  
**Sistema Web**: ✅ Funcionando normalmente via navegador
