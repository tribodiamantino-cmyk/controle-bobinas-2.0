# 🎯 GUIA RÁPIDO - Deploy e Testes do Sistema PLACA

**LEIA ISTO PRIMEIRO quando voltar ao PC!**

---

## ✅ O QUE JÁ ESTÁ PRONTO

🟢 **Código**: 100% corrigido e testado  
🟢 **Commits**: Enviados para GitHub (commit `a3ed2e3`)  
🟢 **APK Mobile**: Reconstruído com PLACA  
🟢 **Documentação**: Completa e detalhada  
🟡 **Deploy**: AGUARDANDO sua ação manual  

---

## 🚀 PASSO 1: FAZER DEPLOY

### 1.1 Abrir Railway
```
https://railway.com/project/74bbdbc8-a159-44ad-9eb3-787581af1828
```

### 1.2 Iniciar Deploy
1. Clicar no serviço **`controle-bobinas-20-production`**
2. Ir na aba **"Deployments"**
3. Clicar no botão **"Deploy"** (ou "Redeploy")
4. **Aguardar 2-3 minutos**

### 1.3 Verificar Logs
Procurar por estas mensagens:
```
✓ Migration 027_add_placa_to_bobinas.js executada
Server running on port 3000
```

Se aparecer: **✅ Deploy OK! Prossiga para testes**  
Se NÃO aparecer: Verificar erro nos logs e me avisar

---

## 🧪 PASSO 2: TESTAR CADASTRO COM PLACA

### 2.1 Acessar Sistema
```
https://controle-bobinas-20-production.up.railway.app
```

### 2.2 Cadastrar Bobina
1. Ir em **"Estoque"** → **"Cadastrar Bobina"**
2. Buscar produto (qualquer)
3. Preencher:
   - NF: `12345`
   - Loja: `CTV`
   - Metragem: `100`
   - **PLACA: `ABC-123-XYZ`** ⭐
   - Observações: (opcional)
4. Clicar em **"Cadastrar"**

### 2.3 Verificar Resultado
**✅ SUCESSO se:**
- Modal aparece automaticamente
- Mostra código da bobina (ex: BOB-0001)
- PLACA aparece com **fundo amarelo**: `ABC-123-XYZ`
- Todos os dados estão corretos

**❌ ERRO se:**
- Erro 500 aparece novamente
- Modal não abre
- PLACA não aparece

---

## 🧪 PASSO 3: TESTAR PLACA DUPLICADA

### 3.1 Tentar Cadastrar com Mesma PLACA
1. Ir novamente em **"Cadastrar Bobina"**
2. Preencher normalmente
3. **PLACA: `ABC-123-XYZ`** (mesma do teste anterior)
4. Clicar "Cadastrar"

### 3.2 Verificar Resultado
**✅ SUCESSO se:**
- Aparece erro: **"PLACA já cadastrada na bobina BOB-0001"**
- Bobina NÃO é criada

**❌ ERRO se:**
- Bobina é criada com PLACA duplicada
- Nenhum erro aparece

---

## 🧪 PASSO 4: TESTAR CADASTRO SEM PLACA

### 4.1 Cadastrar Sem PLACA
1. Ir em "Cadastrar Bobina"
2. Preencher tudo normalmente
3. **Deixar campo PLACA vazio** ⭐
4. Clicar "Cadastrar"

### 4.2 Verificar Resultado
**✅ SUCESSO se:**
- Bobina é criada normalmente
- Modal aparece (sem linha da PLACA)
- Tudo funciona como antes

---

## 🧪 PASSO 5: TESTAR EXCLUSÃO FORÇADA

### 5.1 Criar Situação de Teste
1. Ir em estoque
2. Encontrar bobina que tem retalhos OU está em plano de corte
3. Clicar no botão **"Excluir"** (ícone de lixeira)

### 5.2 Verificar Dialog
**Deve aparecer 2 confirmações:**

**Primeira confirmação**:
```
⚠️ Tem certeza que deseja excluir esta bobina?
Esta ação é irreversível!
```
→ Clicar **OK**

**Segunda confirmação** (se tiver dependências):
```
❌ ERRO AO EXCLUIR:
Não é possível excluir esta bobina pois existem 2 retalho(s) vinculado(s).

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️ EXCLUSÃO FORÇADA (AVANÇADO):

Você pode FORÇAR a exclusão, o que irá:
• Excluir TODOS os retalhos vinculados
• Remover TODAS as alocações em planos
• Excluir a bobina definitivamente

🚨 ATENÇÃO: Esta ação é IRREVERSÍVEL!

Deseja FORÇAR a exclusão?
```
→ Clicar **OK** para forçar

### 5.3 Verificar Resultado
**✅ SUCESSO se:**
- Mensagem: "Bobina e X dependência(s) excluídas com sucesso!"
- Bobina desaparece da lista
- Retalhos/alocações também foram removidos

---

## 🧪 PASSO 6: TESTAR IMPRESSÃO TÉRMICA (WEB)

### 6.1 Imprimir Etiqueta
1. Cadastrar bobina COM PLACA
2. No modal de sucesso, clicar **"Imprimir Etiqueta"**
3. Verificar pré-visualização

### 6.2 Verificar Conteúdo
**Deve conter:**
```
[QR Code]
BOB-0001
Produto - Cor XXXg
100.00m
Largura: XXcm
─────────────────
🏷️ PLACA: ABC-123-XYZ  ⭐ (com fundo destacado)
```

---

## 🧪 PASSO 7: TESTAR IMPRESSÃO BLUETOOTH (MOBILE)

### 7.1 Instalar APK Novo
1. Ir em: `C:\controle bobinas 2.0\android\app\build\outputs\apk\debug\app-debug.apk`
2. Copiar para celular (WhatsApp, Drive, etc.)
3. **Desinstalar app antigo**
4. **Instalar novo APK**

### 7.2 Configurar Impressora
1. Parear M58-LL via Bluetooth (senha: 0000)
2. Abrir app
3. Ir em "Configurar Impressora"
4. Selecionar M58-LL

### 7.3 Imprimir Bobina com PLACA
1. Ir em "Impressão de Etiquetas"
2. Selecionar "Bobina"
3. Digitar código da bobina que TEM PLACA (ex: `BOB-0001`)
4. Clicar "Buscar"
5. Clicar "Imprimir"

### 7.4 Verificar Etiqueta Física
**Deve conter:**
```
[QR Code]

BOB-0001

Produto - Cor XXXg

100.00m

--- PLACA ---     ⭐
ABC-123-XYZ       ⭐

Loja - Fabricante
```

---

## ✅ CHECKLIST FINAL

Marque conforme for testando:

- [ ] Deploy no Railway concluído
- [ ] Logs mostram migration executada
- [ ] Cadastro COM PLACA funciona
- [ ] Modal aparece com PLACA destacada
- [ ] PLACA duplicada é bloqueada
- [ ] Cadastro SEM PLACA funciona
- [ ] Exclusão forçada funciona
- [ ] Etiqueta térmica mostra PLACA
- [ ] APK instalado no Android
- [ ] Bluetooth configurado
- [ ] Etiqueta Bluetooth mostra PLACA

---

## 🆘 SE ALGO DER ERRADO

### Erro 500 ainda aparece
1. Abrir DevTools (F12) → Aba Console
2. Ver mensagem de erro completa
3. Verificar logs do Railway
4. Me avisar com print da mensagem

### Modal não aparece
1. F12 → Console
2. Ver se tem erro JavaScript
3. Procurar por `mostrarModalSucesso`
4. Me avisar

### PLACA não aparece na etiqueta
1. Verificar se bobina TEM placa (pode estar null)
2. Ver resposta da API no Network (F12)
3. Confirmar que migration rodou
4. Me avisar

---

## 📞 CONTATO

Se TODOS os testes passarem: **🎉 SISTEMA 100% FUNCIONANDO!**

Se algum teste FALHAR: Me avise com:
- ❌ Qual teste falhou
- 📸 Print da tela
- 🔍 Mensagem de erro (se houver)

---

## 📚 DOCUMENTAÇÃO ADICIONAL

Para mais detalhes técnicos, leia:
- **`RESUMO_EXECUTIVO_PLACA.md`** - Visão geral completa
- **`CORRECAO_ERRO_500_PLACA.md`** - Análise técnica profunda

---

**Boa sorte! O sistema está pronto! 🚀**
