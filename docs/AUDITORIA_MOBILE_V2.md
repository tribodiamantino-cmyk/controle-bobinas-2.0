# 🔍 AUDITORIA COMPLETA - MOBILE V2.0

**Data:** 12/12/2025  
**Objetivo:** Garantir consistência total entre frontend e backend após correções de códigos

---

## ✅ PADRÕES ESTABELECIDOS

### Campos Corretos no Banco:
| Entidade | Campo do Código | Formato |
|----------|----------------|---------|
| Bobina | `codigo_interno` | `BOB-XXX-XXXXXX` |
| Retalho | `codigo_retalho` | `RET-XXX-XXXXXX` |
| Corte | `codigo_corte` | `COR-YYYY-XXXXX` |
| PDC | `codigo_plano` | `PDC-XXX-XXX` |
| Locação | `codigo` | `XXXX-X-XXXX` |

### ❌ CAMPOS OBSOLETOS (NÃO USAR):
- `qr_code` - Removido completamente
- `codigo_bobina` - Não existe (usar `codigo_interno`)
- `codigo_qr` - Obsoleto (usar `codigo_corte`)

---

## 📋 STATUS POR MÓDULO

### ✅ 1. CONSULTAS (`public/mobile/js/consultas.js`)
**Status:** OK - Usando API corretamente
- Usa `API.validarCodigo()` para obter ID
- Usa `API.getBobinaDetails(id)` e `API.getRetalhoDetails(id)`
- Usa `API.getCorteDetailsByCodigo(codigo)`
- **Nenhuma correção necessária**

---

### 🔍 2. PDC - PRODUÇÃO (`public/mobile/js/pdc.js`)
**Status:** PRECISA AUDITORIA

**Endpoints usados:**
- `/api/mobile/pdcs/producao` - Lista PDCs
- `/api/mobile/pdcs/:id/origens` - Lista origens
- `/api/mobile/pdcs/validar-origem` - Valida código escaneado
- `/api/mobile/pdcs/registrar-corte` - Registra corte com foto

**Verificar:**
- [ ] Validação de origem usa campos corretos
- [ ] Exibição de códigos de bobinas/retalhos
- [ ] Registro de corte usa código correto

---

### 🔍 3. CARREGAMENTO (`public/mobile/js/carregamento.js`)
**Status:** PRECISA AUDITORIA

**Endpoints usados:**
- `/api/mobile/carregamento/pdcs-finalizados` - Lista PDCs prontos
- `/api/mobile/carregamento/iniciar` - Inicia carregamento
- `/api/mobile/carregamento/validar-corte` - Valida corte escaneado
- `/api/mobile/carregamento/:id/finalizar` - Finaliza

**Verificar:**
- [ ] Validação de cortes usa `codigo_corte`
- [ ] Exibição de códigos corretos

---

### 🔍 4. BACKEND - ROTAS MOBILE (`routes/mobile.js`)
**Status:** PARCIALMENTE CORRIGIDO

**Rotas já corrigidas:**
- ✅ `/validar-codigo/:codigo` - Usa `codigo_interno` e `codigo_retalho`
- ✅ `/debug/retalho/:codigo` - Usa `codigo_retalho`
- ✅ `/debug/todos-retalhos` - Diagnóstico completo

**Rotas a verificar:**
- [ ] `/pdcs/:id/origens` - Ver se usa campos corretos
- [ ] `/pdcs/validar-origem` - Verificar query
- [ ] `/pdcs/registrar-corte` - Verificar inserção
- [ ] `/carregamento/validar-corte` - Verificar query

---

## 🎯 PLANO DE CORREÇÃO

### Fase 1: Auditoria Detalhada
1. ✅ Consultas (OK)
2. 🔄 PDC - verificar arquivo `pdc.js`
3. 🔄 Carregamento - verificar arquivo `carregamento.js`
4. 🔄 Rotas backend - verificar queries SQL

### Fase 2: Correções
- Substituir referências a `qr_code`
- Substituir referências a `codigo_bobina`
- Garantir uso de `codigo_interno`, `codigo_retalho`, `codigo_corte`

### Fase 3: Testes
- Testar cada módulo após correção
- Validar fluxo end-to-end completo

---

## 📝 CHECKLIST DE VERIFICAÇÃO

Para cada arquivo JavaScript:
- [ ] Não usa `qr_code`
- [ ] Não usa `codigo_bobina`
- [ ] Usa `codigo_interno` para bobinas
- [ ] Usa `codigo_retalho` para retalhos
- [ ] Usa `codigo_corte` para cortes
- [ ] Queries SQL estão corretas
- [ ] Display de códigos correto

---

**Próximos passos:**
1. Auditar `pdc.js`
2. Auditar `carregamento.js`
3. Auditar rotas backend pendentes
4. Fazer correções necessárias
5. Testar cada módulo
