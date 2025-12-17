# 📱 API Mobile v2.0 - Mapeamento Completo

> Documentação de todos os endpoints necessários para o app mobile
> Data: 11/12/2025

---

## 🔍 MÓDULO 1: CONSULTAS

### 1.1 Validar Código de Barras
```
GET /api/mobile/validar-codigo/:codigo
```

**Descrição:** Identifica o tipo de código e retorna informações básicas

**Parâmetros:**
- `codigo` - Código de barras escaneado (BOB-xxx, RET-xxx, COR-xxx, LOC-0000-X-0000)

**Resposta:**
```json
{
  "success": true,
  "tipo": "bobina|retalho|corte|locacao",
  "id": 123,
  "codigo": "BOB-PLA-000001"
}
```

**Status:** ❓ Verificar se existe

---

### 1.2 Detalhes de Bobina
```
GET /api/bobinas/:id
```

**Descrição:** Retorna dados completos da bobina

**Resposta:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "codigo_interno": "BOB-PLA-000001",
    "metragem_atual": 45.50,
    "metragem_reservada": 12.00,
    "metragem_disponivel": 33.50,
    "status": "Disponível",
    "locacao": "0015-A-0023",
    "data_entrada": "2025-12-10",
    "nota_fiscal": "123456",
    "produto": {
      "descricao": "Verde 200gr 6,20m",
      "fabricante": "Propex",
      "cor": "Verde",
      "gramatura": "200gr",
      "largura": 6.20
    }
  }
}
```

**Status:** ✅ Existe (verificar estrutura)

---

### 1.3 Detalhes de Retalho
```
GET /api/retalhos/:id
```

**Descrição:** Retorna dados completos do retalho

**Resposta:** Similar a bobina + origem

**Status:** ✅ Existe (verificar estrutura)

---

### 1.4 Detalhes de Corte
```
GET /api/cortes/:id
```

**Descrição:** Retorna dados completos do corte

**Resposta:**
```json
{
  "success": true,
  "data": {
    "id": 123,
    "codigo_corte": "COR-2025-00123",
    "metragem_cortada": 12.50,
    "data_corte": "2025-12-11 14:30:00",
    "status": "concluido",
    "carregado": false,
    "foto_medidor": "uploads/cortes/COR-2025-00123_1702308456.jpg",
    "origem": {
      "tipo": "bobina",
      "codigo": "BOB-PLA-000001"
    },
    "pdc": {
      "id": 15,
      "codigo_plano": "PDC-PLA-015",
      "cliente": "Granja São José",
      "aviario": "Aviário 3"
    },
    "produto": {
      "descricao": "Verde 200gr 6,20m",
      "fabricante": "Propex"
    }
  }
}
```

**Status:** ❓ Verificar endpoint de cortes

---

### 1.5 Detalhes de Locação
```
GET /api/locacoes/:id
GET /api/locacoes/:id/itens
```

**Descrição:** Retorna dados da locação e itens guardados nela

**Resposta:**
```json
{
  "success": true,
  "data": {
    "id": 15,
    "codigo": "LOC-0015-A-0023",
    "locacao": "0015-A-0023",
    "itens": [
      {
        "tipo": "bobina",
        "id": 1,
        "codigo": "BOB-PLA-000001",
        "metragem": 45.50,
        "produto": "Verde 200gr 6,20m"
      },
      {
        "tipo": "retalho",
        "id": 89,
        "codigo": "RET-PLA-000089",
        "metragem": 8.20,
        "produto": "Azul 180gr 5,80m"
      }
    ]
  }
}
```

**Status:** ❓ Criar endpoint

---

### 1.6 Imprimir Etiqueta (via Servidor)
```
POST /api/impressao/etiqueta
```

**Descrição:** Envia etiqueta para fila de impressão

**Body:**
```json
{
  "tipo": "bobina|retalho|corte",
  "id": 123
}
```

**Status:** ✅ Existe (verificar integração mobile)

---

### 1.7 Ver Histórico
```
GET /api/bobinas/:id/historico
GET /api/retalhos/:id/historico
GET /api/produtos/:id/historico
```

**Status:** ✅ Existe (criado hoje)

---

## ✂️ MÓDULO 2: PDC (PLANOS DE CORTE)

### 2.1 Listar PDCs em Produção
```
GET /api/mobile/pdcs/producao
```

**Descrição:** Lista apenas PDCs com status 'em_producao'

**Resposta:**
```json
{
  "success": true,
  "data": [
    {
      "id": 15,
      "codigo_plano": "PDC-PLA-015",
      "cliente": "Granja São José",
      "aviario": "Aviário 3",
      "total_cortes": 12,
      "cortes_concluidos": 5,
      "progresso": 42,
      "total_origens": 3,
      "data_criacao": "2025-12-10"
    }
  ]
}
```

**Status:** ❌ Criar

---

### 2.2 Detalhes do PDC com Origens Agrupadas
```
GET /api/mobile/pdcs/:id/origens
```

**Descrição:** Retorna PDC com cortes agrupados por origem

**Resposta:**
```json
{
  "success": true,
  "data": {
    "pdc": {
      "id": 15,
      "codigo_plano": "PDC-PLA-015",
      "cliente": "Granja São José",
      "aviario": "Aviário 3",
      "status": "em_producao"
    },
    "origens": [
      {
        "tipo": "bobina",
        "id": 1,
        "codigo": "BOB-PLA-000001",
        "locacao": "0015-A-0023",
        "produto": {
          "descricao": "Verde 200gr 6,20m",
          "fabricante": "Propex"
        },
        "metragem_disponivel": 33.50,
        "cortes": [
          {
            "id": 123,
            "codigo_corte": "COR-2025-00120",
            "metragem": 12.50,
            "status": "concluido"
          },
          {
            "id": 124,
            "codigo_corte": "COR-2025-00121",
            "metragem": 8.00,
            "status": "concluido"
          },
          {
            "id": 125,
            "metragem": 15.30,
            "status": "pendente"
          }
        ],
        "total_cortes": 4,
        "cortes_concluidos": 2
      }
    ]
  }
}
```

**Status:** ❌ Criar

---

### 2.3 Validar Origem (Scanner)
```
POST /api/mobile/pdcs/validar-origem
```

**Descrição:** Valida se código escaneado corresponde à origem esperada

**Body:**
```json
{
  "pdc_id": 15,
  "origem_esperada_id": 1,
  "origem_esperada_tipo": "bobina",
  "codigo_escaneado": "BOB-PLA-000001"
}
```

**Resposta:**
```json
{
  "success": true,
  "valido": true,
  "origem": {
    "id": 1,
    "codigo": "BOB-PLA-000001",
    "tipo": "bobina"
  }
}
```

**Status:** ❌ Criar

---

### 2.4 Registrar Corte
```
POST /api/mobile/pdcs/registrar-corte
```

**Descrição:** Registra novo corte com foto

**Body (multipart/form-data):**
```
pdc_id: 15
item_id: 123
origem_id: 1
origem_tipo: "bobina"
metragem_cortada: 15.30
foto: [arquivo]
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "corte_id": 125,
    "codigo_corte": "COR-2025-00125",
    "etiqueta_enviada": true,
    "foto_salva": "uploads/cortes/COR-2025-00125_1702308456.jpg"
  }
}
```

**Status:** ❌ Criar (adaptar endpoint existente)

---

### 2.5 Atualizar Locação da Origem
```
POST /api/mobile/pdcs/atualizar-locacao
```

**Descrição:** Atualiza locação após finalizar cortes de uma origem

**Body:**
```json
{
  "tipo": "bobina|retalho",
  "id": 1,
  "nova_locacao": "0015-A-0023"
}
```

**Status:** ❌ Criar

---

### 2.6 Finalizar PDC
```
POST /api/mobile/pdcs/:id/finalizar
```

**Descrição:** Finaliza PDC e registra locações de armazenamento

**Body:**
```json
{
  "locacoes": ["0025-A-0010", "0025-A-0011"]
}
```

**Resposta:**
```json
{
  "success": true,
  "pdc_id": 15,
  "status": "finalizado",
  "data_finalizacao": "2025-12-11 15:45:00"
}
```

**Status:** ❌ Criar

---

## 📦 MÓDULO 3: CARREGAMENTO

### 3.1 Listar PDCs Finalizados
```
GET /api/mobile/carregamento/disponiveis
```

**Descrição:** Lista PDCs finalizados prontos para carregar

**Resposta:**
```json
{
  "success": true,
  "data": [
    {
      "id": 15,
      "codigo_plano": "PDC-PLA-015",
      "cliente": "Granja São José",
      "aviario": "Aviário 3",
      "total_cortes": 12,
      "data_finalizacao": "2025-12-11",
      "locacoes": ["0025-A-0010", "0025-A-0011"]
    }
  ]
}
```

**Status:** ❌ Criar

---

### 3.2 Iniciar Carregamento
```
POST /api/mobile/carregamento/iniciar
```

**Descrição:** Inicia processo de carregamento de um PDC

**Body:**
```json
{
  "pdc_id": 15
}
```

**Resposta:**
```json
{
  "success": true,
  "carregamento": {
    "id": 45,
    "codigo_carregamento": "CAR-2025-00045",
    "pdc_id": 15,
    "status": "em_andamento",
    "total_cortes": 12,
    "cortes_validados": 0
  }
}
```

**Status:** ❌ Criar (adaptar sistema de carregamentos)

---

### 3.3 Validar Corte no Carregamento
```
POST /api/mobile/carregamento/validar-corte
```

**Descrição:** Valida corte escaneado

**Body:**
```json
{
  "carregamento_id": 45,
  "codigo_corte": "COR-2025-00123"
}
```

**Resposta:**
```json
{
  "success": true,
  "valido": true,
  "corte": {
    "id": 123,
    "codigo_corte": "COR-2025-00123",
    "metragem": 12.50
  },
  "progresso": {
    "validados": 1,
    "total": 12,
    "percentual": 8
  }
}
```

**Ou se inválido:**
```json
{
  "success": false,
  "valido": false,
  "erro": "Corte pertence a outro PDC",
  "corte": {
    "codigo_corte": "COR-2025-00999",
    "pdc_correto": "PDC-CIA-008",
    "cliente": "Fazenda Boa Vista"
  }
}
```

**Status:** ❌ Criar

---

### 3.4 Finalizar Carregamento
```
POST /api/mobile/carregamento/:id/finalizar
```

**Descrição:** Finaliza carregamento

**Resposta:**
```json
{
  "success": true,
  "carregamento": {
    "id": 45,
    "codigo_carregamento": "CAR-2025-00045",
    "status": "concluido",
    "data_conclusao": "2025-12-11 15:45:00",
    "total_cortes": 12,
    "cortes_validados": 12
  }
}
```

**Status:** ❌ Criar

---

### 3.5 Listar Carregamentos Concluídos
```
GET /api/mobile/carregamento/historico
```

**Descrição:** Histórico de carregamentos

**Resposta:**
```json
{
  "success": true,
  "data": [
    {
      "id": 45,
      "codigo_carregamento": "CAR-2025-00045",
      "pdc": {
        "codigo_plano": "PDC-PLA-015",
        "cliente": "Granja São José",
        "aviario": "Aviário 3"
      },
      "total_cortes": 12,
      "data_conclusao": "2025-12-11 15:45:00"
    }
  ]
}
```

**Status:** ❌ Criar

---

### 3.6 Detalhes de Carregamento Concluído
```
GET /api/mobile/carregamento/:id/detalhes
```

**Descrição:** Ver detalhes completos de um carregamento

**Resposta:**
```json
{
  "success": true,
  "data": {
    "id": 45,
    "codigo_carregamento": "CAR-2025-00045",
    "pdc": { ... },
    "cortes": [ ... ],
    "data_inicio": "2025-12-11 15:30:00",
    "data_conclusao": "2025-12-11 15:45:00",
    "duracao_minutos": 15
  }
}
```

**Status:** ❌ Criar

---

## 📊 RESUMO

### Status dos Endpoints

| Status | Quantidade | Descrição |
|--------|------------|-----------|
| ✅ Existe | 6 | Já implementados |
| ❓ Verificar | 4 | Podem existir, precisa confirmar |
| ❌ Criar | 12 | Precisam ser desenvolvidos |

**Total:** 22 endpoints necessários

---

## 🎯 PRIORIZAÇÃO

### Alta Prioridade (Bloqueia desenvolvimento)
1. ❌ `/api/mobile/validar-codigo/:codigo`
2. ❌ `/api/mobile/pdcs/producao`
3. ❌ `/api/mobile/pdcs/:id/origens`
4. ❌ `/api/mobile/pdcs/registrar-corte`

### Média Prioridade (Necessário para MVP)
5. ❌ `/api/mobile/pdcs/validar-origem`
6. ❌ `/api/mobile/pdcs/atualizar-locacao`
7. ❌ `/api/mobile/pdcs/:id/finalizar`
8. ❌ `/api/mobile/carregamento/disponiveis`
9. ❌ `/api/mobile/carregamento/iniciar`
10. ❌ `/api/mobile/carregamento/validar-corte`
11. ❌ `/api/mobile/carregamento/:id/finalizar`

### Baixa Prioridade (Nice to have)
12. ❌ `/api/locacoes/:id/itens`
13. ❌ `/api/mobile/carregamento/historico`
14. ❌ `/api/mobile/carregamento/:id/detalhes`

---

## 🚀 PRÓXIMOS PASSOS

1. **Verificar** endpoints marcados com ❓
2. **Criar** endpoints de alta prioridade
3. **Testar** cada endpoint criado
4. **Documentar** exemplos de uso

---

*Documento gerado automaticamente - Atualizar conforme implementação*
