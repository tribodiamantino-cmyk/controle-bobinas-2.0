# 🔍 Monitoramento do Deploy - Fase 6

## 📊 Status Atual

**Commits enviados**: 3
- `c2c3e51` - Código principal da Fase 6
- `35a5307` - Documentação de testes
- `069a31d` - Resumo do deploy

**Railway**: Auto-deploy em andamento...

---

## 🔗 Links Úteis

### Railway Dashboard
```
https://railway.app/dashboard
```

### Logs em Tempo Real
No Railway → Seu Projeto → Deployments → View Logs

---

## ✅ Checklist de Deploy

Acompanhe no Railway:

### 1. Build Phase
- [ ] `Installing dependencies...`
- [ ] `npm install` completo
- [ ] Build finalizado

### 2. Migration Phase (IMPORTANTE!)
```bash
# Procure nos logs por:
🔄 Verificando migrations...
✓ Migration 021_add_qr_code_retalhos.js executada
✓ Coluna qr_code adicionada à tabela retalhos
✓ Gerados X códigos QR para retalhos existentes
```

- [ ] Migration 021 executada com sucesso
- [ ] Mensagem de sucesso apareceu

### 3. Server Start
```bash
# Procure nos logs por:
🚀 Servidor rodando na porta 3000
📍 Ambiente: production
```

- [ ] Servidor iniciou
- [ ] Porta 3000 ativa

---

## 🧪 Primeiros Testes Rápidos

### Teste 1: Health Check
```bash
# Abra no navegador:
https://[seu-app].railway.app/api/health

# Deve retornar:
{
  "status": "OK",
  "timestamp": "..."
}
```

### Teste 2: Página de Retalhos
```bash
# Abra no navegador:
https://[seu-app].railway.app/retalhos.html

# Deve carregar sem erros (F12 → Console)
```

### Teste 3: Endpoint de Histórico
```bash
# Escolha um ID de plano existente e teste:
https://[seu-app].railway.app/api/ordens-corte/1/historico

# Deve retornar JSON com eventos
```

---

## 🐛 Se Algo Der Errado

### Erro: Migration não rodou

**Sintoma**: Campo qr_code não existe

**Solução**:
1. Railway → Settings → Restart Service
2. Aguarde reinicialização
3. Verifique logs novamente

### Erro: Página 404

**Sintoma**: retalhos.html não encontrado

**Solução**:
1. Verifique se o deploy completou
2. Limpe cache do navegador (Ctrl+Shift+R)
3. Confirme que arquivo existe no GitHub

### Erro: "Cannot read property"

**Sintoma**: JavaScript quebrado

**Solução**:
1. Abra F12 → Console
2. Veja qual linha do erro
3. Verifique se API está retornando dados corretos

---

## 📝 Comandos Úteis

### Ver logs em tempo real (local)
```bash
# Se tiver Railway CLI instalado:
railway logs
```

### Forçar redeploy
```bash
# No Railway:
Settings → Restart Service
```

### Verificar migrations no banco
```sql
-- Se tiver acesso ao MySQL:
SELECT * FROM migrations ORDER BY id DESC LIMIT 5;

-- Verificar coluna qr_code
DESCRIBE retalhos;
```

---

## 🎯 Validação Final

Após deploy completo, confirme:

1. **Migration 021**:
   ```sql
   SELECT COUNT(*) FROM retalhos WHERE qr_code IS NOT NULL;
   -- Deve retornar quantidade > 0
   ```

2. **Página de Retalhos**:
   - URL carrega
   - Estatísticas aparecem
   - Filtros funcionam

3. **Finalização de Planos**:
   - Botão "Finalizar" visível
   - Modal abre
   - Retalhos são gerados

4. **Histórico**:
   - Tab aparece
   - Timeline renderiza
   - Eventos cronológicos

---

## 📊 Tempo Estimado

```
┌─────────────────────────┬──────────┐
│ Fase                    │ Tempo    │
├─────────────────────────┼──────────┤
│ Push para GitHub        │ 10s      │ ✅
│ Railway detecta push    │ 30s      │ ⏳
│ Build da aplicação      │ 60-90s   │ ⏳
│ Executar migrations     │ 5-10s    │ ⏳
│ Iniciar servidor        │ 5-10s    │ ⏳
│ Health check            │ 5s       │ ⏳
├─────────────────────────┼──────────┤
│ TOTAL                   │ 2-3min   │
└─────────────────────────┴──────────┘
```

**Horário de push**: Agora  
**Previsão de conclusão**: ~3 minutos

---

## 🔔 Notificações

### Sucesso ✅
Você verá no Railway:
```
✓ Deployment successful
✓ Service is healthy
```

### Falha ❌
Se algo falhar:
```
✗ Build failed
✗ Service crashed
```
→ Veja logs completos para detalhes

---

## 🎉 Próximos Passos Após Deploy

1. **Teste o Fluxo Completo** (`TESTE_FASE6_COMPLETA.md`)
2. **Reporte Bugs** (se houver)
3. **Decida**: Implementar filtros + relatórios OU parar aqui?

---

## 📞 Suporte

Se precisar de ajuda:

1. **Logs do Railway**: Copie e cole aqui
2. **Console do navegador**: F12 → Console → Screenshot
3. **Erro específico**: Copie mensagem completa

---

**Status Atual**: 🟡 Aguardando deploy...  
**Última atualização**: 08/12/2024 - 14:45  
**Próxima verificação**: Em 3 minutos
