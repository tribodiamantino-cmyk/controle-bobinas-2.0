# 📱 PLANEJAMENTO - App Mobile de Corte (Android)

## 🎯 Objetivo

Criar interface mobile otimizada para operadores de corte validarem e confirmarem cada etapa do processo usando QR Code e localização.

---

## 📋 Fluxo Completo do Operador

### 1️⃣ **Tela Inicial - Lista de Cortes**

```
┌─────────────────────────────────┐
│  📋 Ordens de Corte - Hoje      │
├─────────────────────────────────┤
│                                 │
│  🟡 PC-2025-00123               │
│  Cliente: Granja ABC            │
│  Aviário: Galpão 1              │
│  ━━━━━━━━━━━━━━━ 3/10          │
│  [▶️ CONTINUAR]                  │
│                                 │
│  🟢 PC-2025-00124               │
│  Cliente: Fazenda XYZ           │
│  Aviário: Galpão 2              │
│  ━━━━━━━━━━━━━━━ 0/5           │
│  [▶️ INICIAR]                    │
│                                 │
└─────────────────────────────────┘
```

**Funcionalidades**:
- ✅ Mostra apenas ordens "Em Produção"
- ✅ Progresso visual (X/Y cortes feitos)
- ✅ Cor indica status (🟢 novo, 🟡 em andamento, ✅ completo)
- ✅ Filtro por data/cliente
- ✅ Atualização automática

---

### 2️⃣ **Tela - Detalhes da Ordem**

```
┌─────────────────────────────────┐
│  ⬅️  PC-2025-00123              │
│  Cliente: Granja ABC            │
│  Progresso: 3/10 cortes         │
├─────────────────────────────────┤
│                                 │
│  ✅ Item 1 - Lona Preta 200g    │
│     50m cortados ✓              │
│                                 │
│  ✅ Item 2 - Lona Azul 180g     │
│     30m cortados ✓              │
│                                 │
│  🔵 Item 3 - Lona Branca 200g   │
│     📍 Loc: A1-B2-C3            │
│     📏 100 metros               │
│     [▶️ INICIAR CORTE]          │
│                                 │
│  ⚪ Item 4 - Lona Verde 180g    │
│     📏 75 metros                │
│     [🔒 Bloqueado]              │
│                                 │
└─────────────────────────────────┘
```

**Funcionalidades**:
- ✅ Lista todos os itens da ordem
- ✅ Mostra status: ✅ feito, 🔵 em andamento, ⚪ aguardando
- ✅ Mostra localização da bobina origem
- ✅ Ordem sequencial (só libera próximo após concluir anterior)

---

### 3️⃣ **Tela - Iniciar Corte**

```
┌─────────────────────────────────┐
│  ⬅️  Item 3 - Lona Branca 200g  │
│  📏 Cortar: 100 metros          │
├─────────────────────────────────┤
│                                 │
│  📍 LOCALIZAR BOBINA            │
│                                 │
│  ┌───────────────────────────┐ │
│  │                           │ │
│  │   📦 Bobina está em:      │ │
│  │                           │ │
│  │   🏷️  A1-B2-C3            │ │
│  │                           │ │
│  │   Código: BOB-2024-00456  │ │
│  │                           │ │
│  └───────────────────────────┘ │
│                                 │
│  ┌───────────────────────────┐ │
│  │   📷 ESCANEAR QR CODE     │ │
│  │                           │ │
│  │   [📸 ABRIR CÂMERA]       │ │
│  │                           │ │
│  └───────────────────────────┘ │
│                                 │
└─────────────────────────────────┘
```

**Funcionalidades**:
- ✅ Mostra localização da bobina origem
- ✅ Mostra código da bobina esperada
- ✅ Botão grande para abrir câmera QR
- ✅ Validação em tempo real

---

### 4️⃣ **Tela - Validação QR Code**

```
┌─────────────────────────────────┐
│  📷 Escaneando QR Code...       │
├─────────────────────────────────┤
│                                 │
│  ┌───────────────────────────┐ │
│  │  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  │ │
│  │  ▓▓░░░░░░░░░░░░░░░░░▓▓  │ │
│  │  ▓▓░░▓▓▓▓░░▓▓▓▓░░▓▓  │ │
│  │  ▓▓░░▓▓▓▓░░▓▓▓▓░░▓▓  │ │
│  │  ▓▓░░░░░░░░░░░░░░░░░▓▓  │ │
│  │  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  │ │
│  └───────────────────────────┘ │
│                                 │
│  Aponte a câmera para o         │
│  QR Code da etiqueta            │
│                                 │
└─────────────────────────────────┘
```

**Resultado SUCESSO**:
```
┌─────────────────────────────────┐
│  ✅ BOBINA VALIDADA!            │
├─────────────────────────────────┤
│                                 │
│  ✓ Código: BOB-2024-00456       │
│  ✓ Localização: A1-B2-C3        │
│  ✓ Metragem: 150m disponível    │
│                                 │
│  Você vai cortar: 100m          │
│                                 │
│  [➡️ PROSSEGUIR]                │
│                                 │
└─────────────────────────────────┘
```

**Resultado ERRO**:
```
┌─────────────────────────────────┐
│  ❌ BOBINA INCORRETA!           │
├─────────────────────────────────┤
│                                 │
│  Esperado: BOB-2024-00456       │
│  Encontrado: BOB-2024-00789     │
│                                 │
│  ⚠️ Esta não é a bobina certa!  │
│                                 │
│  [🔄 ESCANEAR NOVAMENTE]        │
│  [📍 VER LOCALIZAÇÃO CORRETA]   │
│                                 │
└─────────────────────────────────┘
```

---

### 5️⃣ **Tela - Confirmar Corte**

```
┌─────────────────────────────────┐
│  ✂️ REALIZAR CORTE              │
├─────────────────────────────────┤
│                                 │
│  Produto: Lona Branca 200g      │
│  Bobina: BOB-2024-00456         │
│  De: A1-B2-C3                   │
│                                 │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                 │
│  📏 Cortar: 100 metros          │
│                                 │
│  ⚠️ Após cortar, escaneie       │
│     novamente a etiqueta para   │
│     confirmar!                  │
│                                 │
│  [✅ JÁ CORTEI - CONFIRMAR]     │
│                                 │
└─────────────────────────────────┘
```

---

### 6️⃣ **Tela - Validação Pós-Corte**

```
┌─────────────────────────────────┐
│  📷 Confirmar corte realizado   │
├─────────────────────────────────┤
│                                 │
│  📸 Escaneie NOVAMENTE a        │
│     etiqueta da bobina para     │
│     confirmar o corte           │
│                                 │
│  [📸 ESCANEAR]                  │
│                                 │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                 │
│  OU digite o código:            │
│  [________________]             │
│  [✓ CONFIRMAR]                  │
│                                 │
└─────────────────────────────────┘
```

**Após confirmação**:
```
┌─────────────────────────────────┐
│  ✅ CORTE CONFIRMADO!           │
├─────────────────────────────────┤
│                                 │
│  ✓ 100m cortados                │
│  ✓ Bobina origem validada       │
│                                 │
│  📦 RETALHO GERADO              │
│  Código: RET-2025-00890         │
│  Metragem: 50m restantes        │
│                                 │
│  📍 Onde guardar o retalho?     │
│                                 │
│  [🏷️ INFORMAR LOCALIZAÇÃO]      │
│                                 │
└─────────────────────────────────┘
```

---

### 7️⃣ **Tela - Alocar Retalho**

```
┌─────────────────────────────────┐
│  📍 Guardar Retalho             │
├─────────────────────────────────┤
│                                 │
│  RET-2025-00890                 │
│  50 metros restantes            │
│                                 │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                 │
│  Digite a localização:          │
│                                 │
│  [A] [1] - [B] [2] - [C] [3]    │
│   ▲   ▲    ▲   ▲    ▲   ▲      │
│  Pré-preenchido com sugestão    │
│                                 │
│  OU escaneie QR da prateleira:  │
│  [📸 ESCANEAR LOCAL]            │
│                                 │
│  [✅ CONFIRMAR LOCALIZAÇÃO]     │
│                                 │
└─────────────────────────────────┘
```

---

### 8️⃣ **Tela - Corte Concluído**

```
┌─────────────────────────────────┐
│  ✅ ITEM CONCLUÍDO!             │
├─────────────────────────────────┤
│                                 │
│  Item 3 - Lona Branca 200g      │
│                                 │
│  ✓ Bobina localizada            │
│  ✓ QR validado                  │
│  ✓ Corte realizado (100m)       │
│  ✓ Retalho guardado em A1-B2-C3 │
│                                 │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                 │
│  Progresso: 4/10 cortes         │
│                                 │
│  [➡️ PRÓXIMO ITEM]              │
│  [⬅️ VOLTAR À LISTA]            │
│                                 │
└─────────────────────────────────┘
```

---

## 🏗️ Arquitetura Técnica

### **Frontend Mobile**

```
public/
├── mobile/
│   ├── index.html              # PWA principal
│   ├── manifest.json           # Config PWA
│   ├── service-worker.js       # Cache offline
│   ├── css/
│   │   └── mobile.css          # Estilos mobile-first
│   └── js/
│       ├── mobile-app.js       # App principal
│       ├── qr-scanner.js       # Leitor QR (jsQR ou html5-qrcode)
│       ├── ordem-corte.js      # Lógica de corte
│       └── localizacao.js      # Máscara localização
```

### **Backend - Novas APIs**

```javascript
// routes/mobile.js

GET  /api/mobile/ordens-ativas
// Lista ordens "Em Produção" para hoje

GET  /api/mobile/ordem/:id
// Detalhes completos da ordem com itens

POST /api/mobile/validar-qr
// Body: { qr_code, item_id }
// Valida se QR bate com bobina esperada

POST /api/mobile/confirmar-corte
// Body: { item_id, bobina_id, qr_code }
// Confirma que corte foi feito

POST /api/mobile/alocar-retalho
// Body: { retalho_id, localizacao }
// Salva localização do retalho gerado

POST /api/mobile/concluir-item
// Body: { item_id }
// Marca item como cortado
```

### **Banco de Dados - Alterações**

```sql
-- Adicionar coluna status em itens_plano_corte
ALTER TABLE itens_plano_corte 
ADD COLUMN status_corte ENUM(
    'aguardando',      -- Ainda não começou
    'em_corte',        -- Operador iniciou
    'cortado',         -- Corte confirmado
    'finalizado'       -- Retalho alocado
) DEFAULT 'aguardando';

-- Adicionar timestamps de rastreamento
ALTER TABLE itens_plano_corte
ADD COLUMN iniciado_em TIMESTAMP NULL,
ADD COLUMN cortado_em TIMESTAMP NULL,
ADD COLUMN finalizado_em TIMESTAMP NULL,
ADD COLUMN operador VARCHAR(100) NULL;

-- Log de validações QR
CREATE TABLE validacoes_qr (
    id INT PRIMARY KEY AUTO_INCREMENT,
    item_plano_corte_id INT,
    bobina_id INT,
    qr_code VARCHAR(255),
    tipo_validacao ENUM('pre_corte', 'pos_corte'),
    sucesso BOOLEAN,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (item_plano_corte_id) REFERENCES itens_plano_corte(id),
    FOREIGN KEY (bobina_id) REFERENCES bobinas(id)
);
```

---

## 📱 Tecnologia - PWA (Progressive Web App)

### **Por que PWA?**

✅ **Funciona em qualquer Android** (não precisa Play Store)  
✅ **Instala como app nativo** (ícone na tela inicial)  
✅ **Acessa câmera** facilmente  
✅ **Funciona offline** (cache local)  
✅ **Atualiza automaticamente**  

### **Bibliotecas Necessárias**

```html
<!-- QR Code Scanner -->
<script src="https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js"></script>

<!-- OU jsQR (mais leve) -->
<script src="https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js"></script>

<!-- Vibration API (feedback tátil) -->
<!-- Nativo do navegador -->
```

---

## 🎨 Design Mobile-First

### **Princípios**

1. **Botões GRANDES** (mínimo 48x48px)
2. **Texto GRANDE** (mínimo 16px)
3. **Cores contrastantes** (fácil ver ao sol)
4. **Uma ação por tela** (não confundir)
5. **Feedback visual claro** (✅ ❌ 🔄)
6. **Vibração em eventos** (escaneou, erro, sucesso)

### **Paleta de Cores**

```css
:root {
    --verde-sucesso: #4CAF50;
    --azul-ativo: #2196F3;
    --laranja-alerta: #FF9800;
    --vermelho-erro: #F44336;
    --cinza-aguardando: #9E9E9E;
}
```

---

## 🔐 Segurança

### **Validações**

1. ✅ QR Code deve bater EXATAMENTE com bobina esperada
2. ✅ Não permite pular etapas (deve seguir ordem)
3. ✅ Log completo de todas ações (auditoria)
4. ✅ Timestamp de cada validação
5. ✅ Não permite cortar sem validar QR antes
6. ✅ Não permite finalizar sem validar QR depois

---

## 📊 Benefícios

| Antes | Depois (com app) |
|-------|------------------|
| ❌ Pega bobina errada | ✅ QR valida bobina certa |
| ❌ Esquece de anotar | ✅ Sistema registra tudo |
| ❌ Retalho some | ✅ Localização confirmada |
| ❌ Sem rastreabilidade | ✅ Log completo |
| ⏱️ Lento (papel + caneta) | ⚡ Rápido (scan + tap) |
| 📝 Erros de anotação | ✅ Dados corretos |

---

## 🚀 Fases de Implementação

### **Fase 1 - MVP (1-2 semanas)**
- [ ] PWA básico com lista de ordens
- [ ] Scanner QR básico
- [ ] Validação pré-corte
- [ ] Confirmação pós-corte
- [ ] Alocação de retalho

### **Fase 2 - Melhorias (1 semana)**
- [ ] Offline mode (cache)
- [ ] Sincronização automática
- [ ] Vibração em eventos
- [ ] Som de feedback
- [ ] Dark mode

### **Fase 3 - Avançado (futuro)**
- [ ] Login de operador
- [ ] Estatísticas por operador
- [ ] Múltiplos operadores simultâneos
- [ ] Dashboard de produtividade
- [ ] Impressão de etiquetas do app

---

## 💡 Extras Interessantes

### **QR Code nas Prateleiras**
Colocar QR Code em cada prateleira:
- Escaneia prateleira → preenche localização automaticamente
- Evita erro de digitação
- Mais rápido

### **Modo "Corte Rápido"**
Para operadores experientes:
- Pula confirmações visuais
- Só valida QR
- Mais ágil

### **Alertas Sonoros**
- 🔔 "Beep" → QR correto
- 🚨 "Buzzer" → QR errado
- 🎵 "Ding" → Item concluído

---

## 🎯 Próximo Passo

**O que você quer fazer primeiro?**

**A)** Criar o PWA básico (interface mobile + QR scanner)  
**B)** Criar as APIs backend primeiro (rotas mobile)  
**C)** Criar migration do banco (novos campos)  
**D)** Fazer tudo junto (implementação completa)

**Minha recomendação**: Opção **D** - fazer tudo junto de forma incremental, testando cada parte! 🚀

Quer que eu comece a implementar? 😊
