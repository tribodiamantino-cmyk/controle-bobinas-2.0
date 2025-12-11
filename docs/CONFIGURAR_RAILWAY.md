# ✅ CONFIGURAÇÃO RAILWAY - Deploy Manual

## 🎯 Objetivo

Desativar deploy automático no Railway para ter controle total sobre quando colocar mudanças em produção.

---

## 📋 Passo a Passo (Fazer AGORA)

### 1️⃣ Acessar Railway Dashboard

1. Abra: https://railway.app/
2. Faça login (se necessário)
3. Localize o projeto **"controle-bobinas-2.0"**
4. Clique no serviço **"controle-bobinas-20-production"**

### 2️⃣ Acessar Settings

1. No topo da página, clique em **"Settings"** (ícone de engrenagem ⚙️)
2. Role a página para baixo até encontrar a seção **"Service"** ou **"Deploy"**

### 3️⃣ Desativar Auto Deploy

Procure por uma das seguintes opções (depende da versão do Railway):

#### Opção A: Chave "Auto Deploy"
- Encontre o toggle **"Auto Deploy"**
- **Desligue** (deve ficar cinza/desativado)
- Clique em **"Save"** ou as mudanças salvam automaticamente

#### Opção B: Chave "Watch Paths" 
- Encontre **"Watch Paths"**
- **Apague** todos os caminhos (deixe vazio)
- Clique em **"Save"**

#### Opção C: Trigger de Deploy
- Encontre **"Deploy Trigger"**
- Mude de **"Push to main"** para **"Manual"**
- Salve as alterações

### 4️⃣ Verificar Configuração

Após salvar:
- ✅ Deve aparecer uma mensagem tipo: "Settings updated"
- ✅ Na aba "Deployments", não deve ter novos deploys automáticos
- ✅ Você verá um botão **"Deploy"** ou **"Redeploy"** disponível

---

## 🧪 Testar Configuração

Para ter certeza que está funcionando:

### Teste 1: Commit sem Deploy

```bash
cd "c:\controle bobinas 2.0"

# Criar mudança trivial
echo "# Teste deploy manual" >> TESTE.md

# Commitar
git add TESTE.md
git commit -m "test: verificar deploy manual"
git push
```

**Resultado esperado**:
- ✅ Git push funciona normalmente
- ✅ GitHub recebe o commit
- ❌ Railway **NÃO** inicia deploy automático
- ✅ Na aba Deployments, nenhum novo deploy aparece

### Teste 2: Deploy Manual

1. Vá no Railway Dashboard
2. Clique em **"Deploy"** ou **"Redeploy"**
3. Aguarde 2-3 minutos

**Resultado esperado**:
- ✅ Deploy inicia apenas quando você clicou
- ✅ Build completa com sucesso
- ✅ Status: BUILDING → DEPLOYING → ACTIVE

### Teste 3: Limpeza

Se o teste funcionou:
```bash
# Remover arquivo de teste
git rm TESTE.md
git commit -m "test: remover arquivo de teste"
git push

# Não vai fazer deploy automático!
# Deploy manual quando quiser
```

---

## 🎯 Como Fazer Deploy Agora

Sempre que quiser fazer deploy:

### Método 1: Botão Deploy (Recomendado)

1. Railway Dashboard → Aba **"Deployments"**
2. Clique no botão **"Deploy"** (canto superior direito)
3. Aguarde conclusão

### Método 2: Redeploy de Commit Específico

1. Railway Dashboard → Aba **"Deployments"**
2. Veja a lista de deploys anteriores
3. Encontre o commit que quer deployar
4. Clique nos **3 pontinhos** (⋮)
5. Selecione **"Redeploy"**

### Método 3: Railway CLI (Opcional - Avançado)

```bash
# Instalar Railway CLI
npm install -g @railway/cli

# Login
railway login

# Deploy
railway up
```

---

## 📊 Exemplo de Fluxo Completo

```bash
# 1. Fazer mudança
cd "c:\controle bobinas 2.0"
# Editar arquivo...

# 2. Testar local
npm start
# Testar em http://localhost:3000

# 3. Commitar
git add .
git commit -m "feat: nova funcionalidade"
git push

# 4. Neste ponto:
# ✅ Código no GitHub
# ❌ Não está em produção
# ⏸️ Você decide quando fazer deploy

# 5. Quando quiser fazer deploy:
# Abrir Railway Dashboard
# Clicar "Deploy"
# Aguardar 2-3 min
# Testar em produção

# 6. Se estiver OK:
# ✅ Deploy concluído!

# 7. Se quebrar:
# Railway → Deploy anterior → Redeploy
```

---

## ⚠️ Importante: Primeiro Deploy

**A versão v2.0.1 já foi enviada para o GitHub**, mas:
- Se o auto deploy ainda estava ativo, já deve ter feito deploy
- Se você desativou antes, precisa fazer deploy manual

**Para verificar**:
1. Acesse: https://controle-bobinas-20-production.up.railway.app
2. Veja se o **carimbo de versão** aparece (canto inferior direito)
3. Se aparecer **v2.0.1** → ✅ Deploy já feito!
4. Se NÃO aparecer → Fazer deploy manual agora

---

## 🔍 Solução de Problemas

### Problema: Não encontro opção "Auto Deploy"

**Solução**: Pode estar em outro lugar:
- Tente em **"Settings"** → **"Service"** → **"Source"**
- Ou em **"Settings"** → **"Build & Deploy"**
- Ou procure por **"Deployment Trigger"**

### Problema: Deploy continua automático

**Solução**:
1. Verifique se salvou as configurações
2. Tente fazer um commit de teste (como o Teste 1 acima)
3. Se ainda fizer deploy automático:
   - Tire screenshot das Settings
   - Verifique se há outra opção relacionada a deploy

### Problema: Botão "Deploy" não aparece

**Solução**:
- Vá na aba **"Deployments"**
- Procure por **"New Deployment"** ou **"Redeploy"**
- Se não encontrar, clique em um deploy antigo → **3 pontinhos** → **Redeploy**

---

## 📞 Status Atual

Depois de configurar, o status será:

| Item | Status |
|------|--------|
| **Auto Deploy** | ❌ Desativado |
| **Deploy Manual** | ✅ Ativado |
| **Controle Total** | ✅ Você decide |
| **Segurança** | ✅ Testa antes |
| **Última versão** | v2.0.1 (com carimbo) |

---

## 🎉 Próximo Passo

1. **Configure agora** (5 minutos)
2. **Teste** com commit trivial
3. **Use o fluxo** descrito em `FLUXO_DEPLOY_MANUAL.md`
4. **Durma tranquilo** sabendo que nada vai para produção sem sua aprovação! 😌

---

## 📝 Checklist de Configuração

- [ ] Acessei Railway Dashboard
- [ ] Encontrei Settings
- [ ] Desativei Auto Deploy (ou limpei Watch Paths)
- [ ] Salvei as configurações
- [ ] Fiz teste de commit sem deploy
- [ ] Confirmei que deploy não foi automático
- [ ] Fiz deploy manual de teste
- [ ] Tudo funcionou! ✅

**Marque conforme for fazendo!** 🎯
