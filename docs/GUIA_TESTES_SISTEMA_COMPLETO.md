# 🧪 Guia de Testes - Sistema Completo v2.0

## 📋 Pré-requisitos

### 1. Ambiente Desktop (Navegador)
- [ ] Acesso ao sistema via Railway: `https://seu-app.railway.app`
- [ ] Login com usuário administrativo
- [ ] Navegador Chrome/Edge atualizado

### 2. Ambiente Mobile (PWA)
- [ ] Smartphone Android/iOS
- [ ] Acesso ao mobile: `https://seu-app.railway.app/mobile`
- [ ] Câmera funcionando
- [ ] **IMPORTANTE**: Ter QR codes impressos ou em tela secundária:
  - Bobinas (formato: B-123)
  - Localizações (formato: LOC-001 ou 1-A-1)

### 3. Materiais Necessários
- [ ] 3 QR codes de bobinas diferentes
- [ ] 3 QR codes de localizações
- [ ] Impressora térmica 57mm (opcional, para etiquetas)

---

## 🎯 TESTE 1: Criar Plano de Corte (DESKTOP)

### Objetivo
Criar um novo plano com cortes para validar no mobile

### Passos

1. **Acessar Sistema Desktop**
   ```
   https://seu-app.railway.app
   ```

2. **Criar Novo Plano**
   - [ ] Clicar em "Ordens de Corte" ou "Planos de Corte"
   - [ ] Botão "Novo Plano"
   - [ ] Preencher:
     * Cliente: `TESTE - Fazenda ABC`
     * Aviário: `Galpão 1`
     * Observações: `Teste sistema completo`

3. **Adicionar Produtos ao Plano**
   - [ ] Selecionar produto (ex: Lona Azul 150g 5.00m)
   - [ ] Quantidade de cortes: `3`
   - [ ] Metragem por corte: `10m`
   - [ ] Adicionar mais 2 produtos diferentes (total: 9 cortes)

4. **Alocar Bobinas/Retalhos**
   - [ ] Para cada item, clicar em "Alocar"
   - [ ] Selecionar bobina que tenha metragem suficiente
   - [ ] Confirmar alocação
   - [ ] **Verificar**: Status deve ficar "Alocado"

5. **Finalizar Criação**
   - [ ] Botão "Salvar Plano"
   - [ ] **Verificar**: Status = "Em Produção"
   - [ ] **Anotar**: Código do plano (ex: PLAN-2025-00001)

### ✅ Resultado Esperado
- Plano criado com status "Em Produção"
- 9 itens alocados com bobinas/retalhos
- Código do plano gerado

---

## 🎯 TESTE 2: Validar Cortes com QR (MOBILE)

### Objetivo
Escanear bobinas, validar cortes, tirar fotos e imprimir etiquetas

### Passos

1. **Acessar Mobile**
   ```
   https://seu-app.railway.app/mobile
   ```
   - [ ] Abrir no smartphone
   - [ ] Verificar menu principal aparece

2. **Iniciar Produção**
   - [ ] Clicar em "📦 Produção"
   - [ ] **Verificar**: Lista de planos em produção aparece
   - [ ] Localizar o plano PLAN-2025-00001
   - [ ] Clicar no plano

3. **Validar Primeiro Corte**
   - [ ] Tela mostra detalhes do plano
   - [ ] Clicar no primeiro item para cortar
   - [ ] **Scanner QR ativa automaticamente**
   - [ ] Escanear QR code da bobina alocada
   - [ ] **Verificar**: Tela de validação aparece

4. **Registrar Corte com Foto**
   - [ ] Confirmar metragem (ex: 10m)
   - [ ] Clicar em "📷 Tirar Foto do Medidor"
   - [ ] Câmera abre
   - [ ] Tirar foto do medidor/régua
   - [ ] **Verificar**: Preview da foto aparece
   - [ ] Botão "✅ Validar Corte"

5. **Sistema de Impressão (NOVO!)**
   - [ ] **Após validar**: Modal aparece "🖨️ Imprimir Etiqueta?"
   - [ ] **Verificar**: Preview do QR code COR-2025-00001
   - [ ] **Verificar**: Mostra metragem, produto, plano
   - [ ] **Opção A**: Clicar "🖨️ Imprimir" → janela de impressão abre
   - [ ] **Opção B**: Clicar "Agora Não" → pula para próximo corte

6. **Repetir para Mais 2 Cortes**
   - [ ] Validar 2º corte (total: 2/9)
   - [ ] Validar 3º corte (total: 3/9)
   - [ ] **Verificar**: Contador atualiza na tela

### ✅ Resultado Esperado
- 3 cortes validados com fotos
- 3 códigos COR-2025-XXXXX gerados
- Opção de impressão oferecida após cada corte
- Progresso: 3/9 cortes

---

## 🎯 TESTE 3: Central de Impressão (MOBILE)

### Objetivo
Testar impressão centralizada de todos os tipos de QR

### Passos

1. **Acessar Central de Impressão**
   - [ ] Voltar ao menu principal (← Voltar)
   - [ ] Clicar em "🖨️ Imprimir Etiquetas"
   - [ ] **Verificar**: Tela com 4 cards aparece:
     * 📦 Bobina
     * 📏 Retalho
     * ✂️ Corte
     * 📍 Localização

2. **Teste: Imprimir Etiqueta de Bobina**
   - [ ] Clicar no card "📦 Bobina"
   - [ ] Scanner ativa
   - [ ] Escanear QR code B-123
   - [ ] **Verificar**: Preview da etiqueta aparece
   - [ ] **Verificar**: Mostra código, metragem, produto
   - [ ] Botão "🖨️ Imprimir"
   - [ ] **Verificar**: Janela de impressão abre (57mm)

3. **Teste: Imprimir Etiqueta de Corte**
   - [ ] Clicar "Escanear Outro"
   - [ ] Selecionar tipo "✂️ Corte"
   - [ ] Escanear COR-2025-00001
   - [ ] **Verificar**: Preview com QR, metragem, produto, plano
   - [ ] Testar impressão

4. **Teste: Imprimir Localização**
   - [ ] Selecionar "📍 Localização"
   - [ ] Escanear LOC-001
   - [ ] **Verificar**: Preview com corredor-coluna-altura
   - [ ] Testar impressão

### ✅ Resultado Esperado
- Scanner identifica tipo de QR automaticamente
- Preview correto para cada tipo
- Impressão formatada para 57mm

---

## 🎯 TESTE 4: Finalizar Plano e Alocar Localizações (MOBILE)

### Objetivo
Completar todos os cortes e guardar plano em múltiplas localizações

### Passos

1. **Completar Cortes Restantes**
   - [ ] Voltar para "📦 Produção"
   - [ ] Abrir plano PLAN-2025-00001
   - [ ] Validar cortes 4, 5, 6, 7, 8 (não precisa foto em todos, pode pular)
   - [ ] **Ao validar o 9º corte (último)**:

2. **Sistema Detecta Plano Completo (AUTOMÁTICO!)**
   - [ ] **Verificar**: Após último corte, NÃO volta para lista
   - [ ] **Verificar**: Tela especial aparece:
     ```
     🎉 Plano Finalizado!
     PLAN-2025-00001
     Todos os cortes foram realizados!
     
     📍 Escaneie as localizações de armazenamento
     Pode escanear múltiplas localizações se necessário
     ```

3. **Escanear Localizações**
   - [ ] Botão "📱 Escanear Localização"
   - [ ] Scanner ativa
   - [ ] Escanear QR LOC-001 (ou 1-A-1)
   - [ ] **Verificar**: "✅ Localização adicionada: LOC-001"
   - [ ] Volta para tela de alocação
   - [ ] **Verificar**: LOC-001 aparece na lista com botão ✕

4. **Adicionar Mais Localizações**
   - [ ] Clicar "📱 Escanear Localização" novamente
   - [ ] Escanear LOC-002
   - [ ] **Verificar**: Agora mostra 2 localizações
   - [ ] Escanear LOC-003
   - [ ] **Verificar**: 3 localizações na lista

5. **Testar Remoção (Opcional)**
   - [ ] Clicar no botão ✕ da LOC-003
   - [ ] **Verificar**: LOC-003 é removida
   - [ ] Ficar com LOC-001 e LOC-002

6. **Confirmar Alocação**
   - [ ] Botão "✅ Confirmar (2)" → habilitado
   - [ ] Clicar em Confirmar
   - [ ] **Verificar**: Toast "✅ Plano guardado em 2 localização(ões)!"
   - [ ] Volta para lista de ordens

### ✅ Resultado Esperado
- Sistema detecta automaticamente quando plano está completo
- Permite múltiplas localizações
- Pode adicionar/remover antes de confirmar
- Plano fica com status "Finalizado"

---

## 🎯 TESTE 5: Visualizar Localizações do Plano (MOBILE)

### Objetivo
Verificar que localizações aparecem nos detalhes

### Passos

1. **Ver Plano Finalizado**
   - [ ] Menu → "🔍 Consultas" → "Consultar Plano"
   - [ ] OU voltar para "📦 Produção" (pode não aparecer mais)
   - [ ] Se plano ainda aparecer, clicar nele

2. **Verificar Badge de Localizações**
   - [ ] **Verificar**: Box azul claro aparece:
     ```
     📍 Armazenado em:
     [LOC-001] [LOC-002]
     ```
   - [ ] Badges com fundo branco, borda azul
   - [ ] Todas as localizações escaneadas visíveis

### ✅ Resultado Esperado
- Localizações aparecem em destaque
- Fácil identificar onde o plano está guardado

---

## 🎯 TESTE 6: Sistema de Carregamento (MOBILE)

### Objetivo
Validar carregamento completo com scanner de cortes

### Passos

1. **Acessar Carregamento**
   - [ ] Menu principal
   - [ ] Clicar em "🚚 Carregamento"
   - [ ] **Verificar**: Lista de planos finalizados carrega

2. **Verificar Lista de Planos**
   - [ ] **Verificar**: PLAN-2025-00001 aparece
   - [ ] **Verificar**: Mostra:
     * Status: "Finalizado"
     * "📦 9 cortes realizados"
     * "📍 LOC-001, LOC-002"
   - [ ] **Verificar**: Se ainda não carregado, card é clicável

3. **Iniciar Carregamento**
   - [ ] Clicar no plano PLAN-2025-00001
   - [ ] **Verificar**: Carregamento CAR-2025-00001 é criado
   - [ ] **Verificar**: Tela de validação aparece com:
     * Código do carregamento
     * Total de cortes: 9
     * Barra de progresso: 0 / 9 (0%)
     * Scanner QR ativo

4. **Validar Cortes - Feedback VERDE ✅**
   - [ ] Escanear QR COR-2025-00001 (primeiro corte validado)
   - [ ] **VERIFICAR FEEDBACK**:
     * Fundo VERDE
     * ✅ COR-2025-00001
     * Metragem e produto
     * "Corte 1 | 11% completo"
   - [ ] Feedback desaparece após 2 segundos
   - [ ] **Verificar**: Barra de progresso atualiza para 1/9
   - [ ] **Verificar**: Corte aparece na lista validados

5. **Validar Mais Cortes**
   - [ ] Escanear COR-2025-00002
   - [ ] Escanear COR-2025-00003
   - [ ] **Verificar**: Progresso 3/9 (33%)
   - [ ] **Verificar**: Lista mostra 3 cortes validados

6. **Teste: Duplicata - Feedback AMARELO ⚠️**
   - [ ] Escanear novamente COR-2025-00001
   - [ ] **VERIFICAR FEEDBACK**:
     * Fundo AMARELO (#f59e0b)
     * ⚠️ Este corte já foi escaneado
   - [ ] **Verificar**: Contador NÃO aumenta

7. **Teste: Corte de Outro Plano - Feedback LARANJA 🚫**
   - [ ] Criar outro plano com 1 corte (se possível)
   - [ ] Escanear QR desse outro corte
   - [ ] **VERIFICAR FEEDBACK**:
     * Fundo LARANJA (#f97316)
     * ❌ Corte de outro plano!

8. **Teste: QR Inválido - Feedback VERMELHO ❌**
   - [ ] Escanear QR de bobina B-123 (não é corte)
   - [ ] **VERIFICAR FEEDBACK**:
     * Fundo VERMELHO (#ef4444)
     * ❌ Corte não encontrado

9. **Completar Carregamento**
   - [ ] Escanear os 6 cortes restantes
   - [ ] **Verificar**: Progresso chega a 9/9 (100%)
   - [ ] **VERIFICAR**: Pergunta automática aparece:
     ```
     ✅ Todos os cortes foram validados!
     Finalizar carregamento?
     ```

10. **Finalizar**
    - [ ] Clicar "OK" no confirm
    - [ ] **Verificar**: Toast "✅ CAR-2025-00001 finalizado!"
    - [ ] Volta para lista de planos
    - [ ] **Verificar**: Plano agora mostra:
      ```
      ✅ Carregado
      ✅ CAR-2025-00001 - 9 cortes
      ```

### ✅ Resultado Esperado
- Código CAR-2025-00001 gerado
- Feedback colorido para cada situação:
  * 🟢 Verde = válido
  * 🟡 Amarelo = duplicado
  * 🟠 Laranja = plano errado
  * 🔴 Vermelho = inválido
- Progresso em tempo real
- Lista de validados atualiza
- Auto-detecção de 100%
- Carregamento finalizado

---

## 🎯 TESTE 7: Ciclo Completo (Ponta a Ponta)

### Objetivo
Validar fluxo completo do início ao fim

### Checklist do Fluxo

```
✅ DESKTOP
[1] Criar plano → PLAN-2025-00002
[2] Adicionar 5 produtos diferentes
[3] Alocar bobinas para todos

✅ MOBILE - PRODUÇÃO
[4] Abrir plano PLAN-2025-00002
[5] Validar 5 cortes com fotos
[6] Imprimir 2 etiquetas de corte
[7] Sistema detecta plano completo

✅ MOBILE - LOCALIZAÇÃO
[8] Escanear 2 localizações
[9] Confirmar alocação
[10] Verificar badges aparecem

✅ MOBILE - CARREGAMENTO
[11] Listar planos finalizados
[12] Iniciar carregamento CAR-2025-00002
[13] Validar todos os 5 cortes
[14] Sistema auto-detecta 100%
[15] Finalizar carregamento
[16] Verificar status "Carregado"
```

---

## 📊 Matriz de Testes

| Feature | Status | Observações |
|---------|--------|-------------|
| Criar plano (desktop) | ⬜ | |
| Alocar bobinas | ⬜ | |
| Scanner QR bobinas | ⬜ | |
| Validar corte com foto | ⬜ | |
| Impressão pós-corte | ⬜ | |
| Central de impressão | ⬜ | |
| Imprimir bobina | ⬜ | |
| Imprimir corte | ⬜ | |
| Imprimir localização | ⬜ | |
| Detecção plano completo | ⬜ | |
| Alocar múltiplas localizações | ⬜ | |
| Visualizar localizações | ⬜ | |
| Listar planos finalizados | ⬜ | |
| Iniciar carregamento | ⬜ | |
| Código CAR sequencial | ⬜ | |
| Feedback verde (válido) | ⬜ | |
| Feedback amarelo (duplicado) | ⬜ | |
| Feedback laranja (plano errado) | ⬜ | |
| Feedback vermelho (inválido) | ⬜ | |
| Progresso em tempo real | ⬜ | |
| Auto-detecção 100% | ⬜ | |
| Finalizar carregamento | ⬜ | |

---

## 🐛 Relatório de Bugs

Use esta seção para anotar problemas encontrados:

### Bug #1
- **Tela**: 
- **Ação**: 
- **Esperado**: 
- **Obtido**: 
- **Screenshot**: 

### Bug #2
- **Tela**: 
- **Ação**: 
- **Esperado**: 
- **Obtido**: 
- **Screenshot**: 

---

## 📱 QR Codes para Teste

### Bobinas (Exemplos)
```
B-101
B-102
B-103
```

### Localizações (Exemplos)
```
LOC-001
LOC-002
LOC-003

Ou formato alternativo:
1-A-1
2-B-2
3-C-3
```

### Cortes (Gerados automaticamente)
```
COR-2025-00001
COR-2025-00002
COR-2025-00003
...
```

### Carregamentos (Gerados automaticamente)
```
CAR-2025-00001
CAR-2025-00002
```

---

## ✅ Critérios de Aceitação

### Mínimo para Aprovar
- [ ] Criar plano no desktop funciona
- [ ] Validar corte com foto funciona
- [ ] Modal de impressão aparece após corte
- [ ] Sistema detecta plano completo
- [ ] Permite adicionar múltiplas localizações
- [ ] Localizações aparecem no plano
- [ ] Carregamento lista planos finalizados
- [ ] Scanner valida cortes com feedback colorido
- [ ] Progresso atualiza em tempo real
- [ ] Finaliza quando 100%

### Ideal
- [ ] Todos os feedbacks coloridos funcionam
- [ ] Impressão térmica 57mm funciona
- [ ] Pode remover localizações antes de confirmar
- [ ] Não permite duplicatas em carregamento
- [ ] Rejeita cortes de outros planos
- [ ] Interface responsiva no mobile
- [ ] Sem erros de console

---

## 🚀 Próximos Passos Após Testes

1. **Se tudo funcionar**:
   - [ ] Documentar workflows finais
   - [ ] Treinar usuários
   - [ ] Colocar em produção

2. **Se encontrar bugs**:
   - [ ] Listar bugs encontrados acima
   - [ ] Priorizar correções
   - [ ] Novo ciclo de testes

3. **Melhorias futuras**:
   - [ ] Relatórios de carregamento
   - [ ] Histórico de movimentações
   - [ ] Dashboard de produtividade
   - [ ] Notificações push

---

## 📞 Suporte

- **Desenvolvedor**: GitHub Copilot
- **Repositório**: controle-bobinas-2.0
- **Deploy**: Railway
- **Data do Guia**: 8 de dezembro de 2025

**Boa sorte nos testes! 🎉**
