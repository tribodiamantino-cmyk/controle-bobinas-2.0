# Deploy Forçado - Migration 027 (Tentativa 2)

**Data**: 09/12/2025 18:05  
**Motivo**: Migration 027 não executou no primeiro deploy (commit a9b0bd7)

## Erro Reportado
```
[18:05:31] ❌ Erro ao buscar código: Error: Unknown column 'b.placa' in 'field list'
```

## Ação
Forçar novo deploy para garantir execução da migration 027:
- Adiciona coluna `placa VARCHAR(100)` em bobinas
- Cria índice `idx_bobinas_placa`

## Verificação Necessária
Após deploy, checar logs do Railway para confirmar:
```
✅ Migration 027_add_placa_to_bobinas.js executada
```

---
**Commit**: Forçar redeploy v2
