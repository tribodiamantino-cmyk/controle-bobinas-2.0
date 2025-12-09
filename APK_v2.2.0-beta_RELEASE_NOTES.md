# 📱 APK v2.2.0-beta - Release Notes

**Data de Build:** 09/12/2025 17:30  
**Versão:** 2.2.0-beta (Build 2)  
**Tamanho:** 4.18 MB  
**Status:** ✅ Pronto para testes  

---

## 🎯 Objetivo da Release

Versão de testes com implementação completa do campo **PLACA** (código de garantia do fabricante) integrado ao sistema de impressão Bluetooth e com ferramentas de debug visual para facilitar troubleshooting em produção.

---

## ✨ Novidades

### 1. Campo PLACA Implementado
- ✅ **Cadastro Web:** Campo PLACA opcional em bobinas
- ✅ **Validação:** Impede PLACA duplicada no banco
- ✅ **Impressão Bluetooth:** Exibe `--- PLACA ---` na etiqueta térmica
- ✅ **Modal de Sucesso:** Destaque amarelo para PLACA cadastrada

### 2. Indicador de Status da API
- 🟢 **Verde:** API conectada e respondendo
- 🟡 **Amarelo:** API com problemas ou latência alta
- 🔴 **Vermelho:** API offline ou inacessível
- 🔄 **Atualização:** Verifica status a cada 30 segundos automaticamente

### 3. Informações de Debug Visíveis
- **Header do App:** Mostra `v2.2.0-beta (Build 2) | API: 🟢`
- **Console de Debug:** Acessível em todas as páginas mobile
- **Logs Melhorados:** Mensagens claras para identificar erros

### 4. Service Worker Otimizado
- **Cache Inteligente:** Arquivos essenciais armazenados localmente
- **Limpeza Automática:** Remove caches antigos na atualização
- **Fallback Offline:** Continua funcionando sem internet (limitado)

---

## 🔧 Melhorias Técnicas

### Backend (Sistema Web)
- Try-catch em validação PLACA (evita erro 500 antes da migration)
- Fallback INSERT pattern (funciona antes e depois da coluna existir)
- Exclusão forçada com cascade delete (remove bobinas com dependências)
- Logs detalhados em todas as operações

### Frontend Mobile
- API health check automático
- Versionamento visível na interface
- Service Worker v2.2.0-beta com cache otimizado
- Bluetooth printer com suporte a PLACA

---

## 📋 Checklist de Testes

### Pré-Instalação
- [ ] **IMPORTANTE:** Desinstalar versão antiga do celular ANTES de instalar
- [ ] Permitir instalação de fontes desconhecidas nas configurações do Android
- [ ] Verificar espaço disponível (mínimo 10 MB livres)

### Teste 1: Status da API
1. Abrir o aplicativo
2. Verificar header superior
3. Confirmar exibição: `v2.2.0-beta (Build 2) | API: 🟢`
4. Aguardar 30 segundos e verificar se ícone atualiza

**Resultado Esperado:**
- 🟢 se conectado à internet e servidor acessível
- 🔴 se offline ou servidor indisponível

---

### Teste 2: Cadastro de Bobina COM PLACA (Web)
1. Acessar sistema web: https://controle-bobinas-20-production.up.railway.app
2. Ir em **Estoque** → **Cadastrar Bobina**
3. Preencher todos os campos obrigatórios
4. No campo **PLACA**, digitar: `ABC-123-XYZ`
5. Clicar em **Cadastrar**

**Resultado Esperado:**
- ✅ Modal de sucesso aparece
- ✅ PLACA destacada em amarelo no modal
- ✅ Bobina cadastrada com código `BOB-0001` (ou próximo número sequencial)

---

### Teste 3: PLACA Duplicada
1. Tentar cadastrar nova bobina
2. Usar a MESMA PLACA: `ABC-123-XYZ`
3. Clicar em Cadastrar

**Resultado Esperado:**
- ❌ Erro exibido: "PLACA já cadastrada na bobina BOB-0001"
- ❌ Cadastro bloqueado

---

### Teste 4: Impressão Bluetooth com PLACA
1. Parear impressora M58-LL via Bluetooth (senha: `0000`)
2. Abrir app mobile
3. Ir em **Configurar Impressora**
4. Conectar à M58-LL
5. Voltar ao menu principal
6. Ir em **Imprimir Etiquetas** → **Bobina**
7. Escanear QR code da bobina com PLACA cadastrada

**Resultado Esperado:**
- ✅ Etiqueta impressa contendo:
  ```
  [QR CODE]
  BOB-0001
  Produto: [nome]
  XXm
  --- PLACA ---
  ABC-123-XYZ
  Detalhes: [info]
  ```

---

### Teste 5: Cadastro SEM PLACA
1. Cadastrar nova bobina
2. Deixar campo PLACA vazio
3. Cadastrar normalmente

**Resultado Esperado:**
- ✅ Cadastro funciona normalmente
- ✅ Modal aparece sem PLACA
- ✅ Impressão funciona sem seção PLACA

---

### Teste 6: Exclusão Forçada
1. Tentar excluir bobina que possui retalhos ou está alocada
2. Sistema exibe erro
3. Dialog pergunta: "Deseja FORÇAR a exclusão?"
4. Clicar em OK

**Resultado Esperado:**
- ✅ Bobina excluída
- ✅ Retalhos filhos excluídos (cascade)
- ✅ Alocações removidas (cascade)

---

### Teste 7: Operação Offline (Mobile)
1. Desativar Wi-Fi e dados móveis
2. Abrir app mobile
3. Verificar indicador de API no header

**Resultado Esperado:**
- 🔴 Ícone muda para vermelho
- ⚠️ Funcionalidades que dependem da API ficam indisponíveis
- ✅ Interface permanece navegável

---

## 🐛 Troubleshooting

### App não instala
**Problema:** "Aplicativo não instalado"  
**Solução:**
1. Desinstalar versão antiga completamente
2. Ativar "Fontes desconhecidas" nas configurações
3. Tentar novamente

---

### API sempre em vermelho 🔴
**Problema:** Indicador não muda para verde  
**Solução:**
1. Verificar conexão com internet
2. Testar URL no navegador: https://controle-bobinas-20-production.up.railway.app/api/health
3. Se retornar `{"status":"OK"}`, problema é no app
4. Verificar logs no Console de Debug (menu mobile)

---

### Impressora não conecta
**Problema:** Erro ao conectar Bluetooth  
**Solução:**
1. Verificar se impressora está pareada no Android (Configurações > Bluetooth)
2. Senha padrão M58-LL: `0000`
3. Desligar e religar impressora
4. Tentar novamente no app

---

### PLACA não aparece na impressão
**Problema:** Etiqueta não mostra PLACA  
**Solução:**
1. Verificar se bobina realmente tem PLACA cadastrada (consultar no web)
2. Confirmar que está usando APK v2.2.0-beta ou superior (ver header)
3. Reimprimir etiqueta
4. Se persistir, verificar logs do Bluetooth no Console de Debug

---

### Modal de sucesso não aparece
**Problema:** Após cadastrar, modal não exibe  
**Solução:**
1. Abrir F12 (DevTools) no navegador
2. Verificar Console por erros JavaScript
3. Confirmar que deploy foi bem-sucedido no Railway
4. Hard refresh: `Ctrl+Shift+R`

---

## 📦 Arquivos da Release

### APK Compilado
```
📍 Localização: android/app/build/outputs/apk/debug/app-debug.apk
📊 Tamanho: 4.18 MB
🏷️ Versão: 2.2.0-beta (Build 2)
📅 Build: 09/12/2025 17:30:03
```

### Arquivos Modificados (79 files)
- `android/app/build.gradle` - Versionamento atualizado
- `public/mobile/index.html` - Header com versão e status API
- `public/mobile/app.js` - Health check automático
- `public/mobile/service-worker.js` - Cache v2.2.0-beta
- `public/js/bluetooth-printer.js` - Suporte a PLACA (já existente)

---

## 🚀 Deploy e Distribuição

### Como Instalar no Celular

#### Método 1: WhatsApp
1. Enviar APK para si mesmo via WhatsApp
2. Baixar no celular
3. Instalar

#### Método 2: Google Drive
1. Upload para Drive
2. Compartilhar link
3. Baixar no celular
4. Instalar

#### Método 3: USB
1. Conectar celular ao PC via USB
2. Copiar APK para pasta Download
3. Desconectar e instalar

---

## 📊 Comparação com Versão Anterior

| Feature | v1.0 (antiga) | v2.2.0-beta (atual) |
|---------|---------------|---------------------|
| Campo PLACA | ❌ Não | ✅ Sim (Bluetooth + Web) |
| Status API Visual | ❌ Não | ✅ Sim (🟢/🟡/🔴) |
| Versão Visível | ❌ Não | ✅ Sim (header) |
| Service Worker | ⚠️ Básico | ✅ Otimizado v2.2.0 |
| Exclusão Forçada | ❌ Não | ✅ Sim (cascade) |
| Logs de Debug | ⚠️ Básico | ✅ Detalhados |
| Tamanho | ~4 MB | 4.18 MB |

---

## 📞 Suporte

### Problemas Conhecidos
- ⚠️ Service Worker pode precisar de hard refresh no navegador após update
- ⚠️ Bluetooth printer requer Android 6.0+ (API 23+)
- ⚠️ QR Scanner requer permissão de câmera

### Reportar Bugs
Se encontrar problemas:
1. Anotar passos exatos para reproduzir
2. Tirar screenshot do erro
3. Verificar logs no Console de Debug
4. Reportar com todas as informações

---

## ✅ Aprovação para Produção

### Critérios de Aprovação
- [ ] Todos os 7 testes executados com sucesso
- [ ] PLACA aparece corretamente na impressão Bluetooth
- [ ] Modal de sucesso exibe PLACA em amarelo
- [ ] Validação de PLACA duplicada funciona
- [ ] Indicador de API atualiza corretamente
- [ ] Exclusão forçada funciona sem travar
- [ ] App funciona offline (funcionalidades limitadas)

### Próximos Passos
Após aprovação desta versão beta:
1. Testar em produção por 1-2 semanas
2. Coletar feedback dos usuários
3. Corrigir bugs identificados
4. Preparar release v2.2.0 (final/estável)
5. Publicar na Play Store (opcional)

---

**🎉 APK v2.2.0-beta pronto para testes!**

*Última atualização: 09/12/2025 17:30*
