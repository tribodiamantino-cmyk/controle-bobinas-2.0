# Controle de Bobinas 2.0 - Developer Guide

> **Documento de referência para desenvolvedores e agentes de IA**  
> Versão: 2.4.0 | Última atualização: 11/12/2025

---

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Stack Tecnológico](#stack-tecnológico)
3. [Estrutura do Projeto](#estrutura-do-projeto)
4. [Banco de Dados](#banco-de-dados)
5. [Padrões de Código](#padrões-de-código)
6. [Sistema de QR Codes](#sistema-de-qr-codes)
7. [Mobile/Android](#mobileandroid)
8. [Deploy](#deploy)
9. [Versionamento](#versionamento)
10. [Documentação de Referência](#documentação-de-referência)
11. [Tarefas Comuns](#tarefas-comuns)

---

## Visão Geral

### O que é o Sistema?

Sistema de **gestão de estoque de bobinas de lona** para fabricação de cortinas de aviário. Desenvolvido para duas empresas:

| Empresa | Cidade | Prefixo de Código |
|---------|--------|-------------------|
| **Cortinave** | Palotina/PR | `PLA` |
| **BN** | Cianorte/PR | `CIA` |

### Conceito Central

```
PRODUTO (abstrato)  →  BOBINA (física)  →  PLANO DE CORTE  →  CORTES  →  CARREGAMENTO
       ↓                     ↓                                    ↓
  Especificação         Rolo no estoque                      RETALHO (sobra)
  do tecido             com metragem
```

**Distinção Crítica:**
- `produto` = especificação abstrata (cor, gramatura, largura, fabricante)
- `bobina` = rolo físico com metragem específica
- **Um produto → muitas bobinas**

### URLs de Produção

| Ambiente | URL |
|----------|-----|
| **API** | https://controle-bobinas-20-production.up.railway.app |
| **Health Check** | /api/health |

---

## Stack Tecnológico

| Camada | Tecnologia | Observações |
|--------|------------|-------------|
| **Backend** | Node.js + Express | Sem ORM, sem TypeScript |
| **Database** | MySQL 8.x | Hospedado no Railway |
| **Frontend Desktop** | HTML + CSS + JS Vanilla | Bootstrap 5, DataTables, SweetAlert2 |
| **Mobile** | Capacitor 7 + JS Vanilla | APK Android nativo |
| **Impressão** | Bluetooth térmica M58-LL | Via `cordova-plugin-bluetooth-serial` |
| **Deploy** | Railway | Deploy manual (sem auto-deploy) |

---

## Estrutura do Projeto

```
controle-bobinas-2.0/
├── .github/
│   └── copilot-instructions.md   # Este arquivo
├── android/                       # Projeto Android (Capacitor)
├── config/
│   ├── database.js               # Pool de conexão MySQL
│   └── version.js                # ⭐ VERSÃO DO SISTEMA (fonte única)
├── controllers/                   # Lógica de negócio
│   ├── bobinasController.js
│   ├── produtosController.js
│   ├── ordensCorteController.js
│   ├── cortesController.js
│   ├── qrcodesController.js
│   └── ...
├── database/
│   └── schema.sql                # Referência (migrations são a verdade)
├── docs/                          # 📚 Documentação técnica
├── middleware/
│   ├── validarReservas.js        # Validação automática de reservas
│   └── uploadFotos.js            # Upload com compressão (Sharp)
├── migrations/                    # Migrações de banco (execução automática)
├── public/
│   ├── css/, js/                 # Assets frontend
│   ├── mobile/                   # App mobile (Capacitor)
│   └── *.html                    # Páginas desktop
├── routes/                        # Rotas Express
├── uploads/                       # Arquivos enviados (fotos de contraprova)
├── server.js                      # Entry point
├── package.json
├── CHANGELOG.md                   # Histórico de versões
└── ROADMAP.md                     # Planejamento futuro
```

---

## Banco de Dados

### ⚠️ Regras Críticas

#### 1. Campo `fabricante`

```sql
-- ✅ CORRETO: buscar via JOIN com produtos
SELECT b.*, p.fabricante, p.descricao 
FROM bobinas b 
JOIN produtos p ON b.produto_id = p.id;

-- ❌ ERRADO: bobinas NÃO tem fabricante
SELECT b.fabricante FROM bobinas b;  -- ERRO: coluna não existe!
```

#### 2. Campo `loja` em bobinas

- É **desnormalizado** (cópia de `produtos.loja` para performance)
- Bobinas NÃO migram entre lojas
- Representa "snapshot" do momento da entrada

#### 3. Campo `locacao`

```
Formato: 0000-X-0000 (ÁREA-CORREDOR-POSIÇÃO)
Regex:   /^\d{4}-[A-Z]-\d{4}$/
Tipo:    VARCHAR(12)

Exemplos válidos:   0001-A-0001, 0150-B-0025
Exemplos inválidos: 1-A-1, 0000-A-0001, 0001-a-0001
```

#### 4. Campo `metragem_reservada`

```
⚠️ NUNCA fazer UPDATE manual em metragem_reservada!
   → Controlada por TRIGGERS do banco
   → Sincroniza automaticamente com alocacoes_corte
   → Ver: docs/SISTEMA_VALIDACAO_RESERVAS.md
```

#### 5. Items Esgotados

```sql
-- Items com metragem = 0 recebem status = 'Esgotado'
-- São mantidos para histórico mas ocultos das listagens

-- Query padrão para listagens:
SELECT * FROM bobinas WHERE status != 'Esgotado';
SELECT * FROM retalhos WHERE status != 'Esgotado';
```

### Tabelas Principais

```
produtos (especificações)
├── bobinas (rolos físicos com metragem_atual/reservada)
│   └── retalhos (sobras de cortes)
└── planos_corte (ordens de produção)
    ├── itens_plano_corte (o que cortar)
    ├── alocacoes_corte (de onde cortar)
    └── cortes_realizados (cortes com QR e fotos)

locacoes (posições no armazém)
└── plano_locacoes (onde planos finalizados estão guardados)

carregamentos (processos de envio)
└── carregamentos_itens (auditoria de cortes validados)
```

### Convenções de Nomenclatura

| Elemento | Convenção | Exemplo |
|----------|-----------|---------|
| Tabelas | snake_case, plural | `planos_corte` |
| Colunas | snake_case | `metragem_atual` |
| PKs | `id` (AUTO_INCREMENT) | `id` |
| FKs | `{tabela_singular}_id` | `produto_id` |
| Metragem | `DECIMAL(10,2)` | `150.00` |
| Status | `ENUM(...)` | `'Disponível'` |

### Migrações

```javascript
// migrations/0XX_descricao.js
exports.up = async function(db) {
    await db.query(`ALTER TABLE tabela ADD COLUMN novo_campo VARCHAR(50)`);
    console.log('✅ Migration 0XX: Descrição');
};

exports.down = async function(db) {
    await db.query(`ALTER TABLE tabela DROP COLUMN novo_campo`);
};
```

**Execução:** Automática no startup via `server.js:runMigrations()`

---

## Padrões de Código

### Controllers (Backend)

```javascript
// ✅ Padrão do projeto
const criar = async (req, res) => {
    try {
        const { campo } = req.body;
        
        // 1. Validação
        if (!campo) {
            return res.json({ success: false, error: 'Campo obrigatório' });
        }
        
        // 2. Query SEMPRE parametrizada
        const [result] = await db.query(
            'INSERT INTO tabela (campo) VALUES (?)',
            [campo]
        );
        
        // 3. Log com emoji
        console.log('✅ Registro criado:', result.insertId);
        
        // 4. Resposta padronizada
        res.json({ success: true, data: { id: result.insertId } });
        
    } catch (error) {
        console.error('❌ Erro:', error);
        res.json({ success: false, error: error.message });
    }
};
```

### Respostas de API

```javascript
// Sucesso
res.json({ success: true, data: resultado });

// Erro
res.json({ success: false, error: 'Mensagem de erro' });

// Lista
res.json({ success: true, data: items, total: items.length });
```

### Emojis de Log

| Emoji | Uso | Exemplo |
|-------|-----|---------|
| ✅ | Sucesso | `console.log('✅ Bobina criada')` |
| ❌ | Erro | `console.error('❌ Erro:', error)` |
| ⚠️ | Aviso | `console.warn('⚠️ Metragem baixa')` |
| 🔄 | Processando | `console.log('🔄 Sincronizando...')` |

### Rotas

```javascript
// routes/recurso.js
const express = require('express');
const router = express.Router();
const controller = require('../controllers/recursoController');

router.get('/', controller.listar);
router.get('/:id', controller.buscarPorId);
router.post('/', controller.criar);
router.put('/:id', controller.atualizar);
router.delete('/:id', controller.excluir);

module.exports = router;
```

---

## Sistema de QR Codes

### Códigos Gerados

| Entidade | Formato | Exemplo |
|----------|---------|---------|
| Produto | `{LOJA}-{00000}` | `PLA-00123` |
| Bobina | `BOB-{LOJA}-{000000}` | `BOB-PLA-000001` |
| Retalho | `RET-{LOJA}-{000000}` | `RET-CIA-000042` |
| Plano | `PDC-{LOJA}-{000}` | `PDC-PLA-001` |
| Corte | `COR-{ANO}-{00000}` | `COR-2025-00001` |
| Locação | `LOC-{id}` | `LOC-5` |
| Carregamento | `CAR-{ANO}-{00000}` | `CAR-2025-00001` |

### Fluxo de Cortes (Mobile)

```
1. Operador abre plano em produção
2. Escaneia QR da bobina/retalho → Validação de origem
3. Informa metragem cortada
4. Tira foto do medidor (contraprova)
5. Sistema gera código COR-XXXX-XXXXX
6. Imprime etiqueta do corte
7. Quando tudo cortado → Escaneia locações de armazenamento
8. Finaliza plano
```

### Endpoints Principais

```
GET  /api/qrcodes/bobina/:id      # QR de bobina
GET  /api/qrcodes/retalho/:id     # QR de retalho
GET  /api/qrcodes/corte/:codigo   # QR de corte
POST /api/mobile/corte/registrar  # Registra novo corte
POST /api/mobile/validar-qr       # Valida origem antes de cortar
```

**Documentação completa:** `docs/SISTEMA_CORTES_QR.md`

---

## MobileAndroid

### Estrutura

```
public/mobile/
├── index.html           # Menu principal
├── api-config.js        # URL da API (hardcoded)
├── bluetooth-printer.js # Impressão térmica
├── service-worker.js    # Cache offline (PWA)
└── manifest.json        # Config PWA
```

### Build APK

```powershell
# Sincronizar assets web para Capacitor
npm run android:sync

# Build debug APK
npm run android:build
# Output: android/app/build/outputs/apk/debug/app-debug.apk

# Build release APK (requer keystore)
npm run android:release
```

### Configuração da API

```javascript
// public/mobile/api-config.js
const API_BASE_URL = 'https://controle-bobinas-20-production.up.railway.app';
```

**Documentação:** `docs/BUILD_APK.md`, `docs/SETUP_ANDROID_ENV.md`

---

## Deploy

### Railway (Produção)

✅ **AUTO-DEPLOY ATIVADO** (Confirmado em 11/12/2025)

**Fluxo Automático:**
1. Fazer commit das alterações
2. Push para branch `main`
3. Railway detecta automaticamente e inicia deploy
4. Aguardar conclusão (2-5 minutos)
5. Verificar em produção: `/api/health`

**Deploy Manual (se necessário):**
1. Acessar Railway Dashboard
2. Aba "Deployments"
3. Clicar em "Deploy" ou "Redeploy"

### Variáveis de Ambiente (Railway)

```
MYSQLHOST     # Host do MySQL (auto-fornecido)
MYSQLUSER     # Usuário (auto-fornecido)
MYSQLPASSWORD # Senha (auto-fornecido)
MYSQLDATABASE # Nome do banco (auto-fornecido)
MYSQLPORT     # Porta (auto-fornecido)
PORT          # Porta da aplicação (auto-fornecido)
```

**Documentação:** `docs/CONFIGURAR_RAILWAY.md`

---

## Versionamento

### Formato SemVer

```
MAJOR.MINOR.PATCH (ex: 2.4.0)
```

| Posição | Quando Incrementar | Exemplo |
|---------|-------------------|---------|
| **MAJOR** | Quebra compatibilidade ou redesign | 2.0.0 → 3.0.0 |
| **MINOR** | Nova funcionalidade | 2.3.0 → 2.4.0 |
| **PATCH** | Correção de bug | 2.4.0 → 2.4.1 |

### Exemplos Práticos

- Fix de bug no fabricante → **PATCH** (2.4.0 → 2.4.1)
- Nova Central de Etiquetas → **MINOR** (2.3.0 → 2.4.0)
- Redesign total da UI → **MAJOR** (2.x.x → 3.0.0)
- Migração para TypeScript → **MAJOR** (2.x.x → 3.0.0)

### Processo de Release

1. **Atualizar `config/version.js`** (fonte única da versão)
2. **Atualizar carimbo de versão no frontend** (`public/js/version-stamp.js`)
3. **Atualizar `CHANGELOG.md`** (documentar mudanças)
4. **Atualizar cabeçalho do `copilot-instructions.md`** (se necessário)
5. Commit: `feat: descrição` ou `fix: descrição`
6. Push para `main`
7. Deploy manual no Railway
8. **Verificar carimbo** aparecendo no sistema em produção

### Arquivos que Precisam de Atualização

#### 1. Backend - Fonte da Verdade
```javascript
// config/version.js - FONTE ÚNICA DE VERDADE
module.exports = {
    version: '2.4.0',
    buildDate: '11/12/2025',
    summary: 'Padronização do Banco de Dados',
    status: 'stable'
};
```

#### 2. Frontend - Carimbo Visual
```javascript
// public/js/version-stamp.js
const VERSION_INFO = {
    version: '2.4.0',
    buildDate: '11/12/2025',
    summary: 'Padronização do Banco de Dados'
};
```

#### 3. Documentação
```markdown
<!-- .github/copilot-instructions.md (linha 4) -->
> Versão: 2.4.0 | Última atualização: 11/12/2025
```

**⚠️ CRÍTICO:** Os 3 arquivos DEVEM ter a mesma versão!

---

## Documentação de Referência

### Consultar ANTES de Implementar

| Documento | Quando Consultar |
|-----------|------------------|
| `docs/ARQUITETURA.md` | Padrões de código, banco, API |
| `docs/PADRONIZACAO_BANCO.md` | Schema completo e regras de campos |
| `docs/PADRONIZACAO_CODIGOS.md` | Formatos de códigos (BOB, RET, COR, PDC) |
| `docs/ESPECIFICACAO_ETIQUETAS.md` | Layout de etiquetas para impressão |
| `docs/SISTEMA_VALIDACAO_RESERVAS.md` | Metragem reservada e triggers |
| `docs/SISTEMA_CORTES_QR.md` | Fluxo completo de cortes com QR |
| `docs/FUNCIONALIDADES.md` | Regras de negócio e fluxos |

### Arquivos de Planejamento

| Arquivo | Conteúdo |
|---------|----------|
| `ROADMAP.md` | Planejamento e fases futuras |
| `CHANGELOG.md` | Histórico de todas as versões |

---

## Tarefas Comuns

### Criar Nova Rota

```
1. Criar controller: controllers/{recurso}Controller.js
2. Criar rota: routes/{recurso}.js
3. Registrar em server.js: app.use('/api/{recurso}', require('./routes/{recurso}'))
```

### Criar Nova Migration

```
1. Criar arquivo: migrations/0XX_descricao.js
2. Implementar exports.up() e opcional exports.down()
3. Reiniciar servidor (executa automático)
```

### Adicionar Campo no Banco

```javascript
// migrations/0XX_add_campo_tabela.js
exports.up = async function(db) {
    await db.query(`
        ALTER TABLE tabela 
        ADD COLUMN novo_campo VARCHAR(100) DEFAULT NULL
    `);
    console.log('✅ Migration 0XX: Campo adicionado');
};
```

### Debug de Reservas Inconsistentes

```
1. Ver logs de startup: middleware/validarReservas.js
2. Verificar triggers: SELECT * FROM information_schema.TRIGGERS
3. Comparar manualmente: SUM(metragem_alocada) vs metragem_reservada
4. Executar limpeza: POST /api/ordens-corte/admin/limpar-reservas
```

### Build e Teste Mobile

```powershell
npm run android:sync    # Sincroniza assets
npm run android:build   # Gera APK debug
# Instalar APK no dispositivo e testar
```

### Atualizar Versão do Sistema

```
1. Definir nova versão (MAJOR.MINOR.PATCH)
2. Atualizar config/version.js (backend)
3. Atualizar public/js/version-stamp.js (frontend)
4. Atualizar .github/copilot-instructions.md (linha 4)
5. Documentar em CHANGELOG.md
6. Commit: "chore: bump version to X.X.X"
7. Deploy e verificar carimbo em produção
```

---

## Convenções de Commit

```
feat:     Nova funcionalidade
fix:      Correção de bug
docs:     Alteração em documentação
refactor: Refatoração de código
chore:    Tarefas de manutenção
style:    Formatação (sem mudança de lógica)
test:     Adição/correção de testes
```

**Exemplos:**

```
feat: adiciona central de etiquetas unificada
fix: corrige busca de fabricante em impressão de bobina
docs: atualiza documentação de QR codes
refactor: extrai lógica de validação para middleware
```

---

## Lembretes Importantes

1. **Queries sempre parametrizadas** - Nunca concatenar strings SQL
2. **fabricante está em produtos** - Sempre fazer JOIN
3. **metragem_reservada é automática** - Nunca UPDATE manual
4. **Testar localmente antes do deploy** - Railway tem deploy manual
5. **Atualizar CHANGELOG.md** - Para mudanças visíveis ao usuário
6. **Consultar /docs/** - Antes de implementar features complexas

---

## Suporte

- **Testes manuais:** `docs/GUIA_TESTES_SISTEMA_COMPLETO.md`
- **Simulador QR:** `public/teste-qrcodes.html`
- **Health check:** `GET /api/health`

---

*Documento mantido pela equipe de desenvolvimento. Última revisão: Dezembro 2025*
