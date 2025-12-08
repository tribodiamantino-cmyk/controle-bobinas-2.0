# Códigos QR Simplificados - Sistema Controle de Bobinas 2.0

**Data de Implementação**: 8 de dezembro de 2025  
**Versão**: 2.3.0  
**Status**: ✅ Implementado e em Produção

---

## 📋 Resumo Executivo

Refatoração completa do sistema de códigos QR para um padrão **unificado, simples e legível**. Todos os códigos agora seguem o formato `PREFIXO-SEQUENCIAL` de 4 dígitos, eliminando complexidade desnecessária e facilitando operação manual.

---

## 🔄 Mudanças de Formato

### ANTES (Formatos Antigos)
```
Bobinas:      {CTV|BN}-{YEAR}-{5digits}  →  CTV-2025-00123
Retalhos:     R-{id}                      →  R-456
Planos:       PC-{YEAR}-{5digits}         →  PC-2025-00045
Cortes:       COR-{YEAR}-{5digits}        →  COR-2025-00789
Locações:     LOC-{id}                    →  LOC-12
```

### AGORA (Formatos Novos)
```
Bobinas:      BOB-{4digits}               →  BOB-0123
Retalhos:     RET-{4digits}               →  RET-0456
Planos:       PLA-{4digits}               →  PLA-0045
Cortes:       COR-{4digits}-PLA-{4digits} →  COR-0789-PLA-0045
Locações:     {4digits}-{X}-{4digits}     →  0001-A-0012
```

---

## ✅ Benefícios

### 1. **Mais Simples**
- Códigos mais curtos e fáceis de ler
- Sem necessidade de ano (sequencial global)
- Menos caracteres = menos erro de digitação

### 2. **Mais Inteligentes**
- Cortes agora **vinculados ao plano de origem** (`COR-0001-PLA-0123`)
- Rastreabilidade completa: sabe-se qual plano originou cada corte
- Localizações mantém formato intuitivo `corredor-coluna-altura`

### 3. **Mais Eficientes**
- Geração sequencial simples (sem buscar por ano)
- Queries mais rápidas (busca direta pelo código)
- Padrão unificado facilita manutenção

### 4. **Retrocompatível**
- Sistema aceita QRs antigos (`B-123`, `R-456`, `COR-2025-00001`)
- Migração gradual sem quebrar etiquetas existentes
- Novos códigos seguem padrão simplificado

---

## 🔧 Arquivos Modificados

### Controllers (Geração de Códigos)
1. **`controllers/bobinasController.js`**
   - Função `gerarCodigoQR()`: busca último `BOB-` e incrementa
   - Remove lógica de prefixo CTV/BN e ano
   - Mantém `gerarCodigoInterno()` como wrapper legado

2. **`controllers/retalhosController.js`**
   - Função `gerarCodigoRetalho()`: gera `RET-0001` sequencial
   - Remove ano e padding de 5 dígitos
   - Remove UPDATE separado de `qr_code` (usa direto `codigo_retalho`)

3. **`controllers/ordensCorteController.js`**
   - Função `gerarCodigoPlano()`: gera `PLA-0001` sequencial
   - Remove prefixo `PC` e ano

### Routes (Backend)
4. **`routes/mobile.js`**
   - **POST `/validar-item`**: 
     * Busca `codigo_plano` do plano
     * Gera `COR-{seq}-{codigo_plano}` (ex: `COR-0001-PLA-0123`)
     * Vincula corte ao plano de origem
   
   - **POST `/imprimir/buscar-codigo`**:
     * Aceita `BOB-`, `RET-`, `PLA-`, `COR-` e padrão N-X-N
     * Busca por `codigo_interno/codigo_retalho/codigo_plano` (não mais por ID)
     * Adiciona suporte a planos de corte

### Frontend Mobile (Validações e UI)
5. **`public/mobile/impressao.html`**
   - Adicionado card "Plano de Corte" (5 tipos agora)
   - Atualizado placeholder: `BOB-0001, RET-0050, COR-0001-PLA-0123, PLA-0001 ou 0001-A-0001`
   - Descrições dos cards atualizadas

6. **`public/mobile/impressao.js`**
   - **Validações**:
     * `onScanSucesso()`: prefixos `BOB-`, `RET-`, `PLA-`, `COR-`
     * `buscarPorCodigoDigitado()`: detecta tipo por prefixo
     * Regex para localizações: `/^\d+-[A-Z]+-\d+$/`
   
   - **Previews**:
     * Adicionado `gerarPreviewPlano()`
     * Adicionado `gerarHTMLImpressaoPlano()`
   
   - **Mensagens de erro**: atualizadas com exemplos dos novos formatos

7. **`public/mobile/app.js`**
   - **Função `onQRCodeSuccess()`**:
     * Aceita `BOB-` e `RET-` como primário
     * Mantém `B-` e `R-` como legado (compatibilidade)
     * Log diferenciado para formatos antigos
   
   - **Alocação de planos**: validação de localizações OK (regex mantido)

---

## 📊 Exemplos de Uso

### Criar Bobina
```javascript
// Código gerado automaticamente
const codigo = await gerarCodigoQR(); // → "BOB-0001"

// Inserir no banco
INSERT INTO bobinas (codigo_interno, ...) VALUES ('BOB-0001', ...)
```

### Criar Plano
```javascript
// Plano criado
const codigoPlano = await gerarCodigoPlano(); // → "PLA-0045"
```

### Validar Corte
```javascript
// Ao validar corte, busca código do plano
const [plano] = await db.query('SELECT codigo_plano FROM planos_corte WHERE id = ?', [planoId]);
// plano.codigo_plano = "PLA-0045"

// Gera código do corte vinculado
const codigoCorte = `COR-0001-${plano.codigo_plano}`; // → "COR-0001-PLA-0045"
```

### Imprimir Etiqueta
```javascript
// Usuário digita: "BOB-0123"
// Sistema detecta tipo: 'bobina'
// Busca no banco: WHERE codigo_interno = 'BOB-0123'
// Gera preview e imprime
```

---

## 🔍 Queries Exemplos

### Buscar Bobina
```sql
-- ANTES: WHERE id = 123
-- AGORA:
SELECT * FROM bobinas WHERE codigo_interno = 'BOB-0123';
```

### Buscar Cortes de um Plano
```sql
-- Agora é trivial! Código do plano está no código do corte
SELECT * FROM cortes_realizados 
WHERE codigo_corte LIKE '%-PLA-0045'; 
-- Retorna: COR-0001-PLA-0045, COR-0002-PLA-0045, etc
```

### Buscar Localização
```sql
-- Formato mantido
SELECT * FROM locacoes WHERE codigo_localizacao = '0001-A-0012';
```

---

## 🧪 Testes

### ✅ Criar Nova Bobina
```
1. Desktop: Criar bobina
2. Verificar: codigo_interno = "BOB-0001" (ou próximo sequencial)
3. Imprimir QR
4. Mobile: Escanear → deve reconhecer
```

### ✅ Criar Plano e Cortes
```
1. Desktop: Criar plano de corte
2. Verificar: codigo_plano = "PLA-0001"
3. Mobile: Validar corte
4. Verificar: codigo_corte = "COR-0001-PLA-0001"
5. Imprimir etiqueta do corte → QR deve incluir código do plano
```

### ✅ Imprimir por Digitação
```
1. Mobile: Impressão → Selecionar tipo
2. Digitar: "BOB-0123" (sem escanear)
3. Sistema deve buscar e gerar preview
4. Imprimir normalmente
```

### ✅ Compatibilidade Legada
```
1. Escanear QR antigo: "B-456"
2. Sistema deve reconhecer como bobina
3. Log deve mostrar "Formato legado B-"
4. Funcionalidade mantida
```

---

## 📝 Notas Importantes

### Migração de Dados Existentes (OPCIONAL)
Se houver dados em produção com formato antigo, criar migration:
```sql
-- Exemplo: converter bobinas antigas
UPDATE bobinas 
SET codigo_interno = CONCAT('BOB-', LPAD(id, 4, '0'))
WHERE codigo_interno LIKE 'CTV-%' OR codigo_interno LIKE 'BN-%';
```

**ATENÇÃO**: Não necessário se iniciar sistema do zero!

### QR Codes Físicos Antigos
- Sistema mantém compatibilidade
- QRs impressos com `B-123` continuam funcionando
- Novos QRs seguem padrão `BOB-0123`
- Recomendação: reimprimir gradualmente

### Sequencial Global
- Não reinicia a cada ano
- BOB-0001, BOB-0002, BOB-0003... BOB-9999
- Se chegar em 9999 → BOB-10000 (5 dígitos, ainda funciona)

---

## 🚀 Deploy

### Status
✅ **Implementado em 8/12/2025**  
✅ **Push para Railway concluído** (commit `871cf1b`)  
✅ **Sistema em produção com novo padrão**

### Rollback (se necessário)
```bash
git revert 871cf1b
git push origin main
```

---

## 📚 Documentação Relacionada

- **ROADMAP.md**: Planejamento de features
- **CHANGELOG.md**: Histórico de mudanças
- **GUIA_TESTES_SISTEMA_COMPLETO.md**: Testes end-to-end
- **QR_CODES_TESTE.md**: Como gerar QR codes para teste

---

## 👥 Equipe

**Desenvolvido por**: GitHub Copilot + tribodiamantino-cmyk  
**Sistema**: Controle de Bobinas 2.0 - Cortinave & BN  
**Tecnologia**: Node.js + Express + MySQL + PWA
