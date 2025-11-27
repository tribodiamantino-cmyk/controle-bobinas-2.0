# 🚀 FLUXO DE DEPLOY MANUAL - Railway

## ⚙️ Configuração Inicial (Fazer UMA vez)

### Passo 1: Desativar Deploy Automático

1. Acesse: https://railway.app/
2. Entre no projeto **"controle-bobinas-2.0"**
3. Clique no serviço **"controle-bobinas-20-production"**
4. Vá em **Settings** (⚙️ engrenagem no canto superior)
5. Desça até a seção **"Deploy"**
6. Encontre **"Auto Deploy"** ou **"Watch Paths"**
7. **DESMARQUE** a opção de deploy automático
8. Clique em **"Save Changes"**

✅ Pronto! Agora o Railway **NÃO** vai fazer deploy automaticamente quando você der `git push`

---

## 🔄 Fluxo de Trabalho Diário

### 1️⃣ Desenvolvimento Local

```bash
# Abrir terminal no VSCode
cd "c:\controle bobinas 2.0"

# Iniciar servidor local
npm start

# Ou se já tiver node rodando, pare primeiro:
# Ctrl+C (ou fechar terminal)
```

**Testar em**: http://localhost:3000

### 2️⃣ Checklist de Testes Local

Antes de commitar, testar **TUDO**:

- [ ] ✅ Página de **Produtos** carrega
  - [ ] Modal de novo produto abre
  - [ ] Formulário funciona
  - [ ] Salvar funciona
  
- [ ] ✅ Página de **Estoque** carrega
  - [ ] Botões "Entrada" funcionam
  - [ ] Campos aparecem
  - [ ] Salvar funciona
  
- [ ] ✅ Página de **Ordens** carrega
  - [ ] Nova ordem funciona
  - [ ] Seleção de produtos funciona
  - [ ] Cálculos estão corretos
  
- [ ] ✅ Página de **Templates** carrega
  
- [ ] ✅ Página de **Configurações** carrega

- [ ] ✅ Console (F12) **SEM ERROS** em JavaScript

### 3️⃣ Commitar e Enviar para GitHub

```bash
# Parar servidor local (Ctrl+C)

# Ver o que mudou
git status

# Adicionar mudanças
git add .

# Commitar com mensagem descritiva
git commit -m "feat: descrição clara da mudança"

# Enviar para GitHub
git push
```

⚠️ **IMPORTANTE**: Neste ponto, o Railway **NÃO** vai fazer deploy ainda!

### 4️⃣ Deploy Manual no Railway

1. **Acesse**: https://railway.app/project/seu-projeto
2. **Clique** no serviço **"controle-bobinas-20-production"**
3. **Vá na aba** "Deployments"
4. **Clique** no botão **"Deploy"** (canto superior direito)
   - OU clique em **"Redeploy"** no último deploy
5. **Aguarde** 2-3 minutos (você verá o progresso)
6. **Status** muda de BUILDING → DEPLOYING → ACTIVE ✅

### 5️⃣ Testar em Produção

Após deploy completo:

1. Acesse: https://controle-bobinas-20-production.up.railway.app
2. **Teste TUDO** novamente (mesmo checklist do passo 2)
3. Verifique o **carimbo de versão** (canto inferior direito)
4. Abra console (F12) e veja se tem erros

### 6️⃣ Se Algo Der Errado (Rollback)

Se após deploy em produção algo quebrar:

#### Opção A: Rollback pelo Railway (Rápido)

1. Railway Dashboard → Deployments
2. Encontre o deploy anterior que funcionava
3. Clique nos **3 pontinhos** (⋮)
4. Clique em **"Redeploy"**
5. Aguarde 2-3 minutos

#### Opção B: Rollback pelo Git (Completo)

```bash
# Ver últimos commits
git log --oneline -5

# Reverter último commit
git revert HEAD

# Enviar para GitHub
git push

# IR NO RAILWAY → Deploy manual do revert
```

---

## 📊 Comparação: Antes vs Depois

| Aspecto | Deploy Automático (ANTES) | Deploy Manual (AGORA) |
|---------|---------------------------|----------------------|
| **git push** | ⚠️ Deploy imediato | ✅ Só envia para GitHub |
| **Controle** | ❌ Nenhum | ✅ Total |
| **Teste antes** | ❌ Vai direto | ✅ Você decide quando |
| **Segurança** | ⚠️ Risco de quebrar | ✅ Testa local primeiro |
| **Rollback** | 😰 Urgente | 😌 Planejado |

---

## 🎯 Exemplo Prático Completo

### Cenário: Adicionar novo campo em Produtos

```bash
# 1. DESENVOLVIMENTO LOCAL
cd "c:\controle bobinas 2.0"
npm start
# Abrir http://localhost:3000
# Fazer mudanças no código
# Testar produtos, estoque, ordens
# Verificar console sem erros

# 2. COMMITAR
git add .
git commit -m "feat: adicionar campo 'observações' em produtos"
git push
# ⚠️ Neste ponto NÃO está em produção ainda!

# 3. TESTAR MAIS UM POUCO LOCAL (se quiser)
npm start
# Testar de novo para ter certeza

# 4. DEPLOY MANUAL
# IR NO RAILWAY DASHBOARD
# Clicar em "Deploy"
# Aguardar 2-3 minutos

# 5. TESTAR EM PRODUÇÃO
# Abrir https://controle-bobinas-20-production.up.railway.app
# Testar TUDO
# Verificar console (F12)

# 6. SE ESTIVER OK
# ✅ Parabéns! Deploy bem-sucedido!

# 7. SE QUEBRAR
# Railway → Deployments → Deploy anterior → Redeploy
# OU
git revert HEAD
git push
# Railway → Deploy manual
```

---

## 📝 Template de Mensagens de Commit

Use mensagens descritivas:

✅ **BOM**:
```bash
git commit -m "feat: adicionar campo observações em produtos"
git commit -m "fix: corrigir cálculo de metros em ordens"
git commit -m "perf: otimizar query de busca de bobinas"
git commit -m "docs: atualizar README com instruções de deploy"
```

❌ **RUIM**:
```bash
git commit -m "update"
git commit -m "fix"
git commit -m "teste"
git commit -m "mudanças"
```

---

## 🔧 Comandos Úteis

### Ver últimas mudanças
```bash
git log --oneline -10
```

### Ver o que mudou em um arquivo
```bash
git diff public/js/produtos.js
```

### Desfazer mudanças locais (antes de commit)
```bash
git checkout -- public/js/produtos.js
```

### Ver status do repositório
```bash
git status
```

### Limpar node_modules e reinstalar
```bash
Remove-Item -Recurse -Force node_modules
npm install
```

---

## 🎯 Próximos Passos

Agora você tem controle total! O fluxo é:

1. 💻 **Desenvolve local** → Testa tudo
2. 📦 **Commita** → `git add` + `git commit` + `git push`
3. ⏸️ **Pausa** → GitHub atualizado, produção ainda não
4. 🚀 **Deploy manual** → Você decide quando
5. ✅ **Testa produção** → Valida se está OK
6. 😌 **Dorme tranquilo** → Sem surpresas!

---

## ⚠️ IMPORTANTE: Primeiro Deploy Manual

Na primeira vez que você for fazer deploy manual após a configuração:

1. **Não precisa fazer nada** - O último `git push` já enviou a v2.0.1
2. **Vá no Railway** e clique em "Deploy"
3. **Você verá** o carimbo de versão aparecer em produção! 🏷️

Teste agora mesmo! 🚀
