# 🔧 Troubleshooting - Guia de Problemas Comuns

## 📱 Problemas no Mobile

### ❌ Scanner não abre / Câmera não funciona

**Sintomas:**
- Tela preta quando deveria abrir scanner
- Erro "Permissão negada"
- Botão "Escanear" não faz nada

**Soluções:**
1. **Dar permissão de câmera**:
   - Android: Configurações → Apps → Chrome → Permissões → Câmera → Permitir
   - iOS: Ajustes → Safari → Câmera → Permitir

2. **Usar HTTPS**:
   - Navegador bloqueia câmera em HTTP
   - Verificar se está acessando `https://` (Railway já usa HTTPS)

3. **Testar em outro navegador**:
   - Chrome funciona melhor
   - Safari no iOS pode ter limitações

4. **Recarregar página**:
   - F5 ou puxar para atualizar
   - Limpar cache do navegador

---

### ❌ QR Code não é reconhecido

**Sintomas:**
- Scanner ativo mas não lê o QR
- Lê mas dá erro "QR inválido"

**Soluções:**
1. **Melhorar iluminação**:
   - QR codes precisam de boa luz
   - Evitar reflexos

2. **Verificar formato do QR**:
   - Bobinas: deve ser `B-123` (com hífen)
   - Cortes: deve ser `COR-2025-00001`
   - Localizações: `LOC-001` ou `1-A-1`

3. **Gerar QR novamente**:
   - Usar QRCode.js ou site online
   - Texto simples, sem caracteres especiais

4. **Testar com QR de teste**:
   ```
   Crie QR code com texto exato: B-101
   ```

---

### ❌ Foto não é capturada

**Sintomas:**
- Câmera abre mas não tira foto
- Foto não aparece no preview

**Soluções:**
1. **Verificar espaço no dispositivo**:
   - Pode estar sem espaço para salvar foto

2. **Tentar novamente**:
   - Fechar e reabrir tela de validação

3. **Usar outro dispositivo**:
   - Alguns smartphones têm bugs específicos

---

### ❌ Modal de impressão não aparece

**Sintomas:**
- Valida corte mas não oferece impressão
- Vai direto para próximo item

**Verificações:**
1. **Verificar console do navegador**:
   - Pressionar F12 → Console
   - Ver se tem erros JavaScript

2. **Testar biblioteca QRCode.js**:
   - Verificar se `https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js` carrega

3. **Backend retornou dados do corte?**:
   - Verificar response do `/validar-item`
   - Deve ter campo `data.corte`

**Fix temporário:**
- Usar central de impressão (menu principal)
- Escanear corte manualmente

---

## 🖥️ Problemas no Desktop

### ❌ Não consegue alocar bobinas

**Sintomas:**
- Botão "Alocar" não funciona
- Lista de bobinas vazia

**Soluções:**
1. **Verificar se há bobinas cadastradas**:
   - Menu Estoque → Bobinas
   - Deve ter pelo menos 1 bobina com metragem > 0

2. **Verificar produto compatível**:
   - Bobina deve ser do mesmo produto do item

3. **Verificar metragem disponível**:
   - `metragem_atual - metragem_reservada >= metragem_necessária`

---

### ❌ Plano não aparece no mobile

**Sintomas:**
- Criou plano no desktop
- Mobile não lista

**Verificações:**
1. **Status do plano**:
   - Deve estar "Em Produção" ou "Pendente"
   - Planos "Finalizados" não aparecem em Produção

2. **Itens alocados?**:
   - Mobile só mostra planos com itens alocados
   - Verificar se todos os itens têm bobinas

3. **Atualizar lista no mobile**:
   - Puxar para baixo (pull to refresh)
   - Ou sair e voltar

---

## 🚚 Problemas no Carregamento

### ❌ Plano não aparece em "Planos Finalizados"

**Sintomas:**
- Finalizou todos os cortes
- Alocou localizações
- Mas não aparece em Carregamento

**Verificações:**
1. **Status do plano no banco**:
   ```sql
   SELECT status FROM planos_corte WHERE id = X;
   ```
   - Deve ser `'finalizado'`

2. **Verificar se tem cortes realizados**:
   ```sql
   SELECT COUNT(*) FROM cortes_realizados WHERE plano_corte_id = X;
   ```
   - Deve ser > 0

3. **Atualizar lista**:
   - Botão "🔄 Atualizar Lista"

---

### ❌ Feedback colorido não funciona

**Sintomas:**
- Escaneia corte mas não mostra verde/vermelho
- Feedback não aparece

**Soluções:**
1. **Verificar CSS**:
   - Elemento `#feedback-scan` deve existir no HTML
   - Classes `.hidden` removidas corretamente

2. **Verificar JavaScript**:
   - Console: verificar erros
   - Função `processarScanCarregamento` está executando?

3. **Testar manualmente**:
   ```javascript
   // No console do navegador:
   document.getElementById('feedback-scan').style.background = '#10b981';
   document.getElementById('feedback-scan').classList.remove('hidden');
   ```

---

### ❌ Progresso não atualiza

**Sintomas:**
- Escaneia cortes
- Barra de progresso fica em 0%

**Verificações:**
1. **Backend está salvando?**:
   - Verificar tabela `carregamentos_itens`
   - Deve ter novos registros

2. **Contador no carregamento**:
   ```sql
   SELECT cortes_carregados FROM carregamentos WHERE id = X;
   ```
   - Deve incrementar

3. **JavaScript atualizando DOM**:
   - Verificar se `atualizarProgressoCarregamento()` é chamada
   - Elementos `#progresso-texto` e `#progresso-fill` existem?

---

## 🗄️ Problemas de Banco de Dados

### ❌ Migrations não rodaram

**Sintomas:**
- Erro "Table doesn't exist"
- Recursos novos não funcionam

**Soluções:**
1. **Rodar migrations manualmente**:
   ```bash
   npm run migrate
   ```

2. **Verificar tabelas criadas**:
   ```sql
   SHOW TABLES;
   ```
   - Deve ter: `cortes_realizados`, `plano_locacoes`, `carregamentos`, `carregamentos_itens`

3. **Verificar log do Railway**:
   - Deploy → Logs
   - Procurar por "Migration"

---

### ❌ Códigos sequenciais duplicados

**Sintomas:**
- Erro "Duplicate entry COR-2025-00001"
- Códigos repetidos

**Causa:**
- Múltiplos requests simultâneos
- Race condition na geração

**Fix no código** (já implementado):
- Usa `UNIQUE` constraint
- Tenta novamente com próximo número

**Fix no banco**:
```sql
-- Verificar último código
SELECT MAX(codigo_corte) FROM cortes_realizados;

-- Se necessário, limpar duplicatas
DELETE FROM cortes_realizados 
WHERE id NOT IN (
    SELECT MIN(id) FROM cortes_realizados GROUP BY codigo_corte
);
```

---

## 📡 Problemas de Rede

### ❌ Timeout / Erro 500

**Sintomas:**
- Loading infinito
- "Erro ao carregar"
- Status 500 no network

**Soluções:**
1. **Verificar Railway**:
   - App está rodando?
   - Verificar logs de erro

2. **Testar endpoint diretamente**:
   ```bash
   curl https://seu-app.railway.app/api/mobile/planos-finalizados
   ```

3. **Limpar cache**:
   - Ctrl+Shift+R (hard reload)

---

### ❌ CORS Error

**Sintomas:**
- "Access-Control-Allow-Origin"
- Funciona no desktop, falha no mobile

**Verificações:**
- Railway deve permitir qualquer origem
- Backend já tem CORS configurado no Express

**Fix se necessário**:
```javascript
// server.js
app.use(cors({ origin: '*' }));
```

---

## 🎨 Problemas de Interface

### ❌ Tela branca / Não carrega

**Soluções:**
1. **Limpar cache do service worker**:
   - F12 → Application → Service Workers → Unregister
   - Recarregar página

2. **Verificar erros de JavaScript**:
   - F12 → Console
   - Procurar erros vermelhos

3. **Testar em anônimo**:
   - Ctrl+Shift+N (Chrome)
   - Se funcionar, é problema de cache

---

### ❌ Botões não funcionam

**Verificações:**
1. **Função existe?**:
   - Procurar no `app.js` se função está definida
   - Ex: `onclick="finalizarCarregamento()"`

2. **Erros no console**:
   - F12 → Console
   - Ver se tem erros ao clicar

3. **Elementos carregados**:
   - Usar `getElementById()` no console
   - Verificar se retorna null

---

## 🔍 Como Debugar

### Desktop (Chrome DevTools)

1. **Abrir DevTools**: F12
2. **Console**: Ver erros JavaScript
3. **Network**: Ver requests falhando
4. **Application**: 
   - Service Workers
   - Local Storage
   - Cache

### Mobile (Remote Debugging)

**Android + Chrome:**
1. Conectar celular no PC via USB
2. Ativar depuração USB no celular
3. Chrome PC → `chrome://inspect`
4. Ver dispositivo conectado
5. Inspecionar página

**iOS + Safari:**
1. Conectar iPhone no Mac via USB
2. Safari Mac → Develop → iPhone → Página
3. Inspector abre

### Logs do Backend

**Railway:**
1. Dashboard → Seu app
2. Aba "Deployments"
3. Ver logs em tempo real
4. Procurar por ❌ ou errors

---

## 📞 Quando Reportar Bug

**Informações necessárias:**
1. **Dispositivo**: Android 12 / iPhone 13 / Desktop Chrome
2. **Tela**: Em qual tela estava
3. **Ação**: O que clicou/escaneou
4. **Esperado**: O que deveria acontecer
5. **Obtido**: O que aconteceu
6. **Erros**: Screenshot do console (F12)
7. **Request**: Network tab → Copiar response

**Exemplo de bom report:**
```
DISPOSITIVO: Android 12, Chrome 120
TELA: Carregamento - Validação
AÇÃO: Escaneei QR COR-2025-00001
ESPERADO: Feedback verde
OBTIDO: Nada aconteceu
ERRO CONSOLE: "Cannot read property 'corte' of undefined"
NETWORK: POST /validar-corte retornou 500
```

---

## ✅ Checklist de Troubleshooting

Antes de reportar bug, verificar:

- [ ] Recarreguei a página (F5)
- [ ] Limpei cache (Ctrl+Shift+R)
- [ ] Testei em anônimo
- [ ] Verifiquei console (F12)
- [ ] Verifiquei network tab
- [ ] Testei em outro dispositivo
- [ ] Railway app está online
- [ ] Tenho internet estável
- [ ] Permissões de câmera OK
- [ ] QR code está correto

Se tudo isso foi feito e ainda não funciona → REPORTAR BUG!

---

**Atualizado em**: 8 de dezembro de 2025
**Versão**: 2.0
