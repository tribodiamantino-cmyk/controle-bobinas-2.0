# 🧪 AMBIENTE DE TESTES - Configuração

## 📋 Estrutura de Ambientes

Este projeto agora suporta 3 ambientes isolados:

### 1️⃣ **Desenvolvimento (LOCAL)**
- **Onde**: Sua máquina local
- **URL**: http://localhost:3000
- **Banco**: MySQL local
- **Uso**: Desenvolvimento diário, testes rápidos

### 2️⃣ **Staging/Testes (RAILWAY - NOVO)**
- **Onde**: Railway (ambiente separado)
- **URL**: https://controle-bobinas-staging.up.railway.app (será criado)
- **Banco**: MySQL Railway (separado do produção)
- **Uso**: Testes antes de aprovar para produção

### 3️⃣ **Produção (RAILWAY)**
- **Onde**: Railway
- **URL**: https://controle-bobinas-20-production.up.railway.app
- **Banco**: MySQL Railway (produção)
- **Uso**: Sistema em uso pelos usuários

---

## 🚀 Como Configurar Ambiente de Testes

### Opção A: Usar Railway (Recomendado)

#### Passo 1: Criar Novo Serviço no Railway

1. Acesse: https://railway.app/
2. Entre no projeto "controle-bobinas-2.0"
3. Clique em **"+ New"** > **"GitHub Repo"**
4. Selecione o mesmo repositório: `tribodiamantino-cmyk/controle-bobinas-2.0`
5. Configure:
   - **Nome**: `controle-bobinas-staging`
   - **Branch**: `staging` (vamos criar)

#### Passo 2: Adicionar MySQL para Staging

1. No novo serviço, clique em **"+ New"**
2. Selecione **"Database"** > **"Add MySQL"**
3. O Railway cria automaticamente um banco separado

#### Passo 3: Configurar Variáveis de Ambiente

No serviço staging, adicionar:
```
NODE_ENV=staging
PORT=3000
DB_HOST=${{MYSQL_HOST}}
DB_USER=${{MYSQL_USER}}
DB_PASSWORD=${{MYSQL_PASSWORD}}
DB_NAME=${{MYSQL_DATABASE}}
```

### Opção B: Usar Branch + Manual Deploy

#### Passo 1: Criar Branch de Staging

```bash
cd "c:\controle bobinas 2.0"
git checkout -b staging
git push -u origin staging
```

#### Passo 2: Configurar Railway para Deploy Manual

No Railway Dashboard:
1. Settings > Deploys
2. Mudar de "Auto Deploy" para "Manual Deploy"
3. Selecionar branch: `staging`

---

## 🔄 Fluxo de Trabalho Recomendado

### 📝 Desenvolvimento
```bash
# Trabalhar localmente
git checkout main
# fazer mudanças
git add .
git commit -m "feat: nova funcionalidade"
```

### 🧪 Testes (Staging)
```bash
# Enviar para staging
git checkout staging
git merge main
git push origin staging

# Aguardar deploy automático no Railway (staging)
# Testar em: https://controle-bobinas-staging.up.railway.app
```

### ✅ Aprovação
```bash
# Se testes OK, promover para produção
git checkout main
git merge staging
git push origin main

# OU via Railway Dashboard: Promote staging to production
```

### ❌ Rollback
```bash
# Se testes falharem no staging
git checkout staging
git reset --hard origin/staging  # voltar para última versão
```

---

## 🎯 Configuração Simplificada (Sem Railway Staging)

Se não quiser criar ambiente separado no Railway, pode:

### Usar Railway com Deploy Manual

1. **Railway Dashboard** > **Settings** > **Deploys**
2. Desmarcar **"Auto Deploy"**
3. Deploy manual apenas quando você aprovar

**Fluxo**:
```bash
# 1. Desenvolver e testar local
npm start  # http://localhost:3000

# 2. Quando aprovar, commitar
git add .
git commit -m "feat: nova funcionalidade aprovada"
git push

# 3. IR NO RAILWAY DASHBOARD
# Clicar em "Deploy" manualmente

# 4. Aguardar deploy
# 5. Testar em produção
```

---

## 📊 Comparação de Opções

| Aspecto | Local Only | Railway Manual | Railway Staging + Prod |
|---------|-----------|----------------|------------------------|
| **Ambientes** | 1 (local) | 2 (local + prod) | 3 (local + staging + prod) |
| **Custo** | Grátis | Grátis | ~$5-10/mês (staging) |
| **Isolamento** | ⚠️ Não | ⚠️ Parcial | ✅ Total |
| **Teste Real** | ❌ | ✅ | ✅✅ |
| **Complexidade** | Baixa | Média | Alta |
| **Recomendado para** | Projetos pequenos | MVP | Produção séria |

---

## 🛠️ Implementação Sugerida

### Para Você (MVP)

Recomendo **Railway com Deploy Manual**:

1. ✅ Simples de configurar
2. ✅ Testa localmente antes
3. ✅ Deploy só quando aprovar
4. ✅ Sem custos extras
5. ✅ Rollback fácil se der problema

### Como Fazer

```bash
# 1. Configurar deploy manual no Railway
# Railway Dashboard > Settings > Deploys > Manual Deploy ON

# 2. Fluxo de trabalho
cd "c:\controle bobinas 2.0"

# Testar local
npm start
# Abrir http://localhost:3000
# Testar TUDO

# Se aprovar
git add .
git commit -m "feat: funcionalidade testada e aprovada"
git push

# IR NO RAILWAY DASHBOARD
# Clicar em "Deploy" manualmente
# Aguardar 2-3 minutos
# Testar em https://controle-bobinas-20-production.up.railway.app
```

---

## 📝 Checklist Antes de Deploy

Antes de clicar "Deploy" no Railway:

- [ ] ✅ Testei localmente (http://localhost:3000)
- [ ] ✅ Todas funcionalidades funcionam
- [ ] ✅ Console (F12) sem erros JavaScript
- [ ] ✅ Testei fluxo completo (produtos → estoque → ordens)
- [ ] ✅ Commit tem mensagem descritiva
- [ ] ✅ Versão atualizada em `version-stamp.js`

Se TODOS os itens estiverem OK → Deploy!

---

## 🎯 Próximo Passo

**Escolha uma opção**:

### A) Deploy Manual (Recomendado para você)
```
Vou configurar Railway para deploy manual.
Você testa local, aprova, e clica "Deploy" quando quiser.
```

### B) Staging Completo (Mais robusto)
```
Vou criar branch staging + ambiente Railway separado.
Teste em staging, aprova, e promove para produção.
```

**Qual você prefere?** Recomendo a opção **A** para começar! 🎯
