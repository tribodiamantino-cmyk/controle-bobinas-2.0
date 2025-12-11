# Controle de Bobinas 2.0 - AI Agent Instructions# Controle de Bobinas 2.0 - AI Agent Instructions# Controle de Bobinas 2.0 - AI Agent Instructions# Controle de Bobinas 2.0 - AI Agent Instructions# Controle de Bobinas 2.0 - AI Agent Instructions



## Visão Geral do Projeto

Sistema de gestão de estoque para lojas de tecidos, focado em controle de bobinas e retalhos com QR codes.

## Visão Geral do Projeto

## Stack Tecnológica

- **Backend**: Node.js + ExpressSistema de gestão de estoque para lojas de tecidos, focado em controle de bobinas e retalhos com QR codes.

- **Database**: MySQL (Railway)

- **Frontend**: HTML/CSS/JavaScript puro## ⚠️ DOCUMENTAÇÃO OBRIGATÓRIA

- **Mobile**: Capacitor (Android)

- **Deploy**: Railway## Stack Tecnológica



## Estrutura do Banco de Dados- **Backend**: Node.js + Express



### Tabela `produtos`- **Database**: MySQL (Railway)

- Cadastro base de produtos (tecidos)

- Campos: codigo_interno, descricao, **fabricante**, largura, gramatura, cor- **Frontend**: HTML/CSS/JavaScript puro**ANTES de escrever qualquer código, consulte os documentos em `/docs/`:**## ⚠️ DOCUMENTAÇÃO OBRIGATÓRIA## System Overview

- É a **única** tabela que contém `fabricante`

- **Mobile**: Capacitor (Android)

### Tabela `bobinas`

- Estoque de bobinas inteiras- **Deploy**: Railway

- FK: produto_id → produtos

- Campo `loja` é DENORMALIZADO (cópia de produtos.loja para performance)

- Campo `locacao`: VARCHAR, formato `0000-X-0000` (ex: 1-A-1, 12-B-34)

- **NÃO** tem campo `fabricante` - buscar via JOIN com produtos## Estrutura do Banco de Dados| Documento | Quando Consultar |



### Tabela `retalhos`

- Pedaços de bobinas cortadas

- FK: produto_id → produtos### Tabela `produtos`|-----------|-----------------|

- Campo `locacao`: VARCHAR, formato `0000-X-0000`

- **NÃO** tem campos `fabricante` ou `loja` - buscar via JOIN com produtos- Cadastro base de produtos (tecidos)



### Formato de Locação- Campos: codigo_interno, descricao, **fabricante**, largura, gramatura, cor| `docs/ARQUITETURA.md` | Padrões de código, banco, API, estrutura |**ANTES de escrever qualquer código, consulte os documentos em `/docs/`:**Fabric roll inventory management system for Cortinave & BN (poultry tarp manufacturers). Tracks **physical bobinas** (rolls) containing **logical produtos** (fabric specs), manages **planos de corte** (cut plans) with automatic allocation, and includes **native Android app** with Bluetooth thermal printing.

- Padrão: `CORREDOR-PRATELEIRA-POSICAO`

- Regex: `/^[1-9]\d{0,3}-[A-Z]-[1-9]\d{0,3}$/`- É a **única** tabela que contém `fabricante`

- Exemplos válidos: 1-A-1, 12-B-34, 9999-Z-9999

- Exemplos inválidos: 0-A-1, 1-a-1, 01-A-01| `docs/PADRONIZACAO_CODIGOS.md` | Criar/manipular códigos (BOB, RET, COR, PDC, etc) |



### Status de Items### Tabela `bobinas`

- Items com `metragem = 0` recebem `status = 'Esgotado'`

- Items esgotados são mantidos para histórico mas ocultos das listagens normais- Estoque de bobinas inteiras| `docs/ESPECIFICACAO_ETIQUETAS.md` | Gerar etiquetas, impressão |

- Filtrar com `WHERE status != 'Esgotado'` ou `WHERE metragem > 0`

- FK: produto_id → produtos

## Padrões de Código

- Campo `loja` é DENORMALIZADO (cópia de produtos.loja para performance)| `docs/SISTEMA_VALIDACAO_RESERVAS.md` | Mexer em alocações, metragem_reservada |

### Queries com fabricante

```sql- Campo `locacao`: VARCHAR, formato `0000-X-0000` (ex: 1-A-1, 12-B-34)

-- CORRETO: buscar fabricante via JOIN

SELECT b.*, p.fabricante, p.descricao - **NÃO** tem campo `fabricante` - buscar via JOIN com produtos| `docs/SISTEMA_CORTES_QR.md` | Sistema de cortes, QR codes || Documento | Quando Consultar |**Critical Distinction**: A `produto` is an abstract fabric specification (color, weight, width). A `bobina` is a physical roll containing that product with specific metragem (meters). One produto → many bobinas.

FROM bobinas b 

JOIN produtos p ON b.produto_id = p.id



-- ERRADO: tentar buscar de bobinas diretamente### Tabela `retalhos`| `docs/FUNCIONALIDADES.md` | Entender fluxos e regras de negócio |

SELECT b.fabricante FROM bobinas b  -- ERRO: coluna não existe!

```- Pedaços de bobinas cortadas



### Queries com locação- FK: produto_id → produtos|-----------|-----------------|

```sql

-- CORRETO: usar campo locacao- Campo `locacao`: VARCHAR, formato `0000-X-0000`

SELECT * FROM bobinas WHERE locacao = '1-A-1'

- **NÃO** tem campos `fabricante` ou `loja` - buscar via JOIN com produtos---

-- ERRADO: usar localizacao_atual ou locacao_id

SELECT * FROM bobinas WHERE localizacao_atual = '1-A-1'  -- Campo não existe!

```

### Formato de Locação| `docs/ARQUITETURA.md` | Padrões de código, banco, API, estrutura |## Architecture

## URLs de Produção

- API: https://controle-bobinas-20-production.up.railway.app- Padrão: `CORREDOR-PRATELEIRA-POSICAO`

- Health: /api/health

- Regex: `/^[1-9]\d{0,3}-[A-Z]-[1-9]\d{0,3}$/`## System Overview

## Convenções de Commit

- feat: nova funcionalidade- Exemplos válidos: 1-A-1, 12-B-34, 9999-Z-9999

- fix: correção de bug

- docs: documentação- Exemplos inválidos: 0-A-1, 1-a-1, 01-A-01| `docs/PADRONIZACAO_CODIGOS.md` | Criar/manipular códigos (BOB, RET, COR, PDC, etc) |

- refactor: refatoração

- chore: tarefas de manutenção



## Arquivos Importantes### Status de ItemsSistema de gestão de estoque de bobinas de lona para **Cortinave (Palotina/PLA)** e **BN (Cianorte/CIA)**.

- `server.js`: Entry point

- `config/database.js`: Conexão MySQL- Items com `metragem = 0` recebem `status = 'Esgotado'`

- `migrations/`: Scripts de migração

- `docs/PADRONIZACAO_BANCO.md`: Documentação completa do schema- Items esgotados são mantidos para histórico mas ocultos das listagens normais| `docs/ESPECIFICACAO_ETIQUETAS.md` | Gerar etiquetas, impressão |- **Backend**: Node.js + Express + MySQL, deployed on Railway (manual deploys only)



---- Filtrar com `WHERE status != 'Esgotado'` ou `WHERE metragem > 0`



## 📋 ROADMAP e Tarefas Futuras**Fluxo Principal:**



**⚠️ IMPORTANTE:** Quando o usuário sugerir algo e pedir para "deixar pra depois" ou "fazer no futuro":## Padrões de Código



1. **Adicionar no `ROADMAP.md`** na seção apropriada:```| `docs/SISTEMA_VALIDACAO_RESERVAS.md` | Mexer em alocações, metragem_reservada |- **Pattern**: Traditional MVC with routes → controllers → direct DB queries (no ORM, no TypeScript)

   - **Tech Debt** → Para melhorias técnicas/refatorações

   - **Backlog de Ideias** → Para novas funcionalidades### Queries com fabricante

2. Usar formato: `- [ ] **Título** - Descrição breve`

3. Quando concluir uma tarefa, marcar como `[x]````sqlProduto (spec) → Bobina (física) → Plano de Corte → Cortes → Carregamento



**Isso garante que nada seja esquecido entre sessões!**-- CORRETO: buscar fabricante via JOIN



---SELECT b.*, p.fabricante, p.descricao                       ↓| `docs/SISTEMA_CORTES_QR.md` | Sistema de cortes, QR codes |- **Database**: Connection pool via `config/database.js` with Railway-specific env vars (`MYSQLHOST`, `MYSQLUSER`, etc.)



## Documentação de ReferênciaFROM bobinas b 

- `docs/PADRONIZACAO_BANCO.md` - Schema e regras de campos

- `docs/SISTEMA_VALIDACAO_RESERVAS.md` - Sistema de metragem reservadaJOIN produtos p ON b.produto_id = p.id                   Retalho (sobra)

- `docs/SISTEMA_CORTES_QR.md` - Sistema de QR codes

- `ROADMAP.md` - Planejamento e tarefas futuras

- `CHANGELOG.md` - Histórico de versões

-- ERRADO: tentar buscar de bobinas diretamente```- **Frontend**: 

SELECT b.fabricante FROM bobinas b  -- ERRO: coluna não existe!

```



### Queries com locação**Distinção Crítica:** ---  - Desktop: Vanilla JS with server-side rendered HTML in `public/` (no build step)

```sql

-- CORRETO: usar campo locacao- `produto` = especificação abstrata (cor, gramatura, largura)

SELECT * FROM bobinas WHERE locacao = '1-A-1'

- `bobina` = rolo físico com metragem específica  - Mobile: Capacitor v8 + Vanilla JS in `public/mobile/` → Android APK with native features

-- ERRADO: usar localizacao_atual ou locacao_id

SELECT * FROM bobinas WHERE localizacao_atual = '1-A-1'  -- Campo não existe!- Um produto → muitas bobinas

```

## System Overview- **External Services**: Bluetooth thermal printer (M58-LL) via `cordova-plugin-bluetooth-serial`

## URLs de Produção

- API: https://controle-bobinas-20-production.up.railway.app---

- Health: /api/health



## Convenções de Commit

- feat: nova funcionalidade## Stack Tecnológico

- fix: correção de bug

- docs: documentaçãoSistema de gestão de estoque de bobinas de lona para **Cortinave (Palotina/PLA)** e **BN (Cianorte/CIA)**.## Database Schema & Business Logic

- refactor: refatoração

- chore: tarefas de manutenção| Camada | Tecnologia |



## Arquivos Importantes|--------|------------|

- `server.js`: Entry point

- `config/database.js`: Conexão MySQL| **Backend** | Node.js + Express + MySQL (sem ORM, sem TypeScript) |

- `migrations/`: Scripts de migração

- `docs/PADRONIZACAO_BANCO.md`: Documentação completa do schema| **Frontend Desktop** | HTML + CSS + JS Vanilla + Bootstrap 5 |**Fluxo Principal:**### Core Tables


| **Mobile** | Capacitor 7 + JS Vanilla → APK Android |

| **Deploy** | Railway (manual) |``````

| **Impressão** | Elgin L42 Pro Full (USB) via servidor local |

Produto (spec) → Bobina (física) → Plano de Corte → Cortes → Carregamentoprodutos (specifications)

---

                      ↓  ├─ bobinas (physical rolls with metragem_atual/reservada)

## Estrutura de Pastas

                   Retalho (sobra)  └─ retalhos (remnants from cuts)

```

controle-bobinas-2.0/```

├── config/database.js        # Conexão MySQL

├── controllers/              # Lógica de negócioplanos_corte (cut plans: planejamento → em_producao → finalizado)

├── routes/                   # Rotas Express

├── middleware/               # Validações, uploads**Distinção Crítica:**   ├─ itens_plano_corte (items to cut)

├── migrations/               # Migrações de banco

├── public/                   # Frontend desktop- `produto` = especificação abstrata (cor, gramatura, largura)  ├─ alocacoes_corte (which bobina/retalho provides material)

│   └── mobile/              # App mobile (Capacitor)

├── docs/                     # 📚 DOCUMENTAÇÃO- `bobina` = rolo físico com metragem específica  └─ cortes_realizados (individual cuts with QR codes and photos)

├── server.js                 # Entry point

├── README.md                 # Intro- Um produto → muitas bobinas

├── CHANGELOG.md              # Versões

└── ROADMAP.md               # Planejamentolocacoes (warehouse locations: A1-B1-C1, A2-B2-C2, etc.)

```

---  └─ plano_locacoes (storage locations for finalized plans)

---



## Padrões de Código

## Stack Tecnológicocarregamentos (loading processes for shipping)

### Controllers (Backend)

  └─ carregamentos_itens (audit trail of validated cuts)

```javascript

// ✅ CORRETO| Camada | Tecnologia |```

const criar = async (req, res) => {

    try {|--------|------------|

        const { campo } = req.body;

        | **Backend** | Node.js + Express + MySQL (sem ORM, sem TypeScript) |### QR Code System (NEW in v2.2.0)

        // Validação

        if (!campo) {| **Frontend Desktop** | HTML + CSS + JS Vanilla + Bootstrap 5 |**Critical Features**: Individual cut tracking with photo contraprova, origin validation, and loading verification.

            return res.json({ success: false, error: 'Campo obrigatório' });

        }| **Mobile** | Capacitor 7 + JS Vanilla → APK Android |

        

        // Query SEMPRE parametrizada| **Deploy** | Railway (manual) |- **Codes Generated**:

        const [result] = await db.query(

            'INSERT INTO tabela (campo) VALUES (?)',| **Impressão** | Elgin L42 Pro Full (USB) via servidor local |  - `BOB-{id}` for bobinas (legacy)

            [campo]

        );  - `RET-{id}` for retalhos (legacy)

        

        console.log('✅ Registro criado:', result.insertId);---  - `COR-{YEAR}-{SEQ}` for cortes (e.g., COR-2025-00001) - NEW

        res.json({ success: true, data: { id: result.insertId } });

          - `LOC-{id}` for locacoes - NEW

    } catch (error) {

        console.error('❌ Erro:', error);## Estrutura de Pastas  - `CAR-{YEAR}-{SEQ}` for carregamentos - NEW

        res.json({ success: false, error: error.message });

    }

};

``````- **Controllers**: `qrcodesController.js`, `cortesController.js`, `locacoesController.js`



### Respostas de APIcontrole-bobinas-2.0/- **Routes**: `/api/qrcodes`, `/api/mobile/corte`, `/api/locacoes`, `/api/mobile/carregamento`



```javascript├── config/database.js        # Conexão MySQL- **Photo Upload**: `middleware/uploadFotos.js` with multer + sharp compression (5MB limit, JPEG 80%, 1200px max)

// Sucesso

res.json({ success: true, data: resultado });├── controllers/              # Lógica de negócio- **See**: `SISTEMA_CORTES_QR.md` for complete documentation



// Erro├── routes/                   # Rotas Express

res.json({ success: false, error: 'Mensagem' });

```├── middleware/               # Validações, uploads**Key Flows**:



### Emojis de Log├── migrations/               # Migrações de banco1. **Validation**: Mobile scans bobina QR → validates against expected origin → proceeds to cut



| Emoji | Uso |├── public/                   # Frontend desktop2. **Cut Registration**: Operator inputs metragem + uploads medidor photo → system generates unique COR code

|-------|-----|

| ✅ | Sucesso |│   └── mobile/              # App mobile (Capacitor)3. **Finalization**: When all items cut → scan warehouse location QRs → mark plan as finalizado

| ❌ | Erro |

| ⚠️ | Aviso |├── docs/                     # 📚 DOCUMENTAÇÃO4. **Loading**: Scan cut QRs to validate → green/red feedback → finalizes when 100% validated

| 🔄 | Processando |

├── server.js                 # Entry point

---

├── README.md                 # Intro### Reserved Metragem System

## Banco de Dados

├── CHANGELOG.md              # Versões**Critical**: `metragem_reservada` in bobinas/retalhos MUST match active allocations in `alocacoes_corte` for plans with `status='em_producao'`. 

### Convenções

└── ROADMAP.md               # Planejamento

| Elemento | Convenção | Exemplo |

|----------|-----------|---------|```- **Orphaned reserves** = disaster (material appears unavailable but isn't actually allocated)

| Tabelas | snake_case, plural | `planos_corte` |

| Colunas | snake_case | `metragem_atual` |- **Prevention**: Database triggers in `database/migrations/006_add_triggers_reservas.js` automatically sync reserves on allocation delete/update

| FKs | `{singular}_id` | `produto_id` |

| Metragem | `DECIMAL(10,2)` | 150.00 |---- **Validation**: `middleware/validarReservas.js` runs on startup to detect and fix inconsistencies



### Tabelas Principais- **See**: `SISTEMA_VALIDACAO_RESERVAS.md` for complete multi-layer solution



```## Padrões de Código

produtos → bobinas → retalhos

              ↓When modifying allocation logic in `controllers/ordensCorteController.js`:

         planos_corte → itens_plano_corte

                     → alocacoes_corte### Controllers (Backend)1. Never manually UPDATE metragem_reservada (triggers handle it)

                     → cortes_realizados

```2. If deleting alocacoes_corte, ensure plano status logic is correct



### Migrações```javascript3. Test with validation middleware to verify reserves match allocations



```javascript// ✅ CORRETO

// migrations/0XX_descricao.js

exports.up = async function(db) {const criar = async (req, res) => {## Migrations

    await db.query(`ALTER TABLE ...`);

    console.log('✅ Migration aplicada');    try {

};

```        const { campo } = req.body;Auto-run on server start via `server.js:runMigrations()`. Manual run: `npm run migrate`



Executam automaticamente no startup.        



---        // Validação**Pattern**: Each migration exports `up(db)` and optional `down(db)`. Tracked in `migrations` table (not duplicated in `/database/migrations/`).



## Códigos do Sistema        if (!campo) {



**⚠️ SEMPRE consultar `docs/PADRONIZACAO_CODIGOS.md`**            return res.json({ success: false, error: 'Campo obrigatório' });```javascript



| Entidade | Formato | Exemplo |        }// migrations/007_example.js

|----------|---------|---------|

| Produto | `{LOJA}-{00000}` | `PLA-00123` |        exports.up = async function(db) {

| Bobina | `BOB-{LOJA}-{000000}` | `BOB-PLA-000001` |

| Retalho | `RET-{LOJA}-{000000}` | `RET-CIA-000042` |        // Query SEMPRE parametrizada    await db.query(`ALTER TABLE ...`);

| Plano | `PDC-{LOJA}-{000}` | `PDC-PLA-001` |

| Corte | `COR-{LOJA}-{PDC}-{00}` | `COR-PLA-001-01` |        const [result] = await db.query(    console.log('✓ Migration complete');

| Locação | `{0000}-{X}-{0000}` | `0001-A-0025` |

            'INSERT INTO tabela (campo) VALUES (?)',};

**Lojas:** `PLA` = Cortinave/Palotina, `CIA` = BN/Cianorte

            [campo]```

---

        );

## Medidas

        ## Coding Conventions

**⚠️ SEMPRE consultar `docs/PADRONIZACAO_CODIGOS.md`**

        console.log('✅ Registro criado:', result.insertId);

| Tipo | Unidade | Exemplo |

|------|---------|---------|        res.json({ success: true, data: { id: result.insertId } });### Routes & Controllers

| Largura | cm | `190cm` |

| Comprimento | m | `150,00m` |        - Routes pass through to controllers: `router.post('/', controller.criarBobina)`

| Bando Y | LMxLYxLYcm | `220x80x80cm` |

    } catch (error) {- Controllers handle validation, business logic, and direct SQL queries

---

        console.error('❌ Erro:', error);- **Always** use parameterized queries: `db.query(sql, [param1, param2])`

## Etiquetas

        res.json({ success: false, error: error.message });- Return format: `res.json({ success: true, data: result })` or `{ success: false, error: msg }`

**⚠️ SEMPRE consultar `docs/ESPECIFICACAO_ETIQUETAS.md`**

    }

- Tamanho: 60mm x 30mm

- Barcode: Code 128};### ID Generation

- Impressora: Elgin L42 Pro Full

```Bobinas get auto-generated `codigo_interno`: `{CTV|BN}-{YEAR}-{5-digit-sequential}`

---

- See `bobinasController.js:gerarCodigoInterno()` for pattern

## Sistema de Reservas

### Respostas de API- Query last code for year, increment sequence number

**⚠️ SEMPRE consultar `docs/SISTEMA_VALIDACAO_RESERVAS.md`**



- `metragem_reservada` é controlada por **triggers** do banco

- NUNCA fazer UPDATE manual em metragem_reservada```javascript### Error Handling

- Triggers sincronizam automaticamente com `alocacoes_corte`

// Sucesso- Log to console with emoji prefixes: `console.log('✅ Success')`, `console.error('❌ Error:')`

---

res.json({ success: true, data: resultado });- Don't throw on startup failures (database unavailable, migration errors) - log and continue

## Deploy

- See `middleware/validarReservas.js` for graceful degradation pattern

1. Commitar alterações

2. Push para `main`// Erro

3. Railway Dashboard → Deploy manual

res.json({ success: false, error: 'Mensagem' });## Railway Deployment

**Ver:** `docs/CONFIGURAR_RAILWAY.md`

```

---

- **Production**: Manual deploys only (auto-deploy disabled per `CONFIGURAR_RAILWAY.md`)

## Mobile/Android

### Emojis de Log- **Config**: `railway.json` + `nixpacks.json` (Nixpacks builder)

- Código em `public/mobile/`

- API config em `api-config.js`- **Env Vars**: Railway auto-provides `MYSQLHOST`, `MYSQLUSER`, etc. for MySQL service

- Build: `npm run android:build`

| Emoji | Uso |- **Health Check**: `GET /api/health` returns `{ status: 'OK', timestamp }`

**Ver:** `docs/BUILD_APK.md`, `docs/SETUP_ANDROID_ENV.md`

|-------|-----|

---

| ✅ | Sucesso |To deploy: Push to `main` branch, then manually trigger in Railway dashboard.

## Tarefas Comuns

| ❌ | Erro |

### Nova Rota

1. Controller em `controllers/{recurso}Controller.js`| ⚠️ | Aviso |## Mobile PWA

2. Rota em `routes/{recurso}.js`

3. Registrar em `server.js`| 🔄 | Processando |



### Nova MigrationLocated in `public/mobile/` with:

1. Criar `migrations/0XX_descricao.js`

2. Reiniciar servidor (executa automático)---- `service-worker.js`: Cache-first for assets, network-first for API calls



### Build APK- `manifest.json`: PWA configuration for Android install

```powershell

npm run android:sync## Banco de Dados- Strategy: Offline-capable interface for shop floor with QR code scanning (see `PLANEJAMENTO_MOBILE.md`)

npm run android:build

```



---### Convenções## Key Files



## Documentação



Ao implementar features:| Elemento | Convenção | Exemplo |- `ROADMAP.md`: Full system requirements and phased development plan

- Atualizar `CHANGELOG.md` para mudanças visíveis

- Atualizar `ROADMAP.md` se mudar planejamento|----------|-----------|---------|- `SISTEMA_VALIDACAO_RESERVAS.md`: Critical reserved metragem architecture

- Criar doc em `/docs/` para decisões técnicas complexas

| Tabelas | snake_case, plural | `planos_corte` |- `SISTEMA_CORTES_QR.md`: Complete QR code system documentation (NEW v2.2.0)

| Colunas | snake_case | `metragem_atual` |- `ROADMAP_SISTEMA_CORTES_QR.md`: QR system implementation roadmap (NEW v2.2.0)

| FKs | `{singular}_id` | `produto_id` |- `database/schema.sql`: Complete table definitions (for reference, migrations are source of truth)

| Metragem | `DECIMAL(10,2)` | 150.00 |- `server.js`: Entry point with middleware setup, migration runner, and route registration



### Tabelas Principais## Common Tasks



```**Add new route**: 

produtos → bobinas → retalhos1. Create controller method in `controllers/{resource}Controller.js`

              ↓2. Add route in `routes/{resource}.js`

         planos_corte → itens_plano_corte3. Register route in `server.js` (if new resource)

                     → alocacoes_corte

                     → cortes_realizados**Add migration**:

```1. Create `migrations/0XX_description.js` with `exports.up`

2. Restart server or run `npm run migrate`

### Migrações3. Verify in `migrations` table



```javascript**Debug reserve inconsistencies**:

// migrations/0XX_descricao.js1. Check `middleware/validarReservas.js` startup logs

exports.up = async function(db) {2. Verify triggers exist: `SELECT * FROM information_schema.TRIGGERS`

    await db.query(`ALTER TABLE ...`);3. Manually validate: Compare SUM(metragem_alocada) from alocacoes_corte to metragem_reservada in bobinas

    console.log('✅ Migration aplicada');

};**Build Android APK**:

``````powershell

npm run android:sync    # Sync web assets to Capacitor

Executam automaticamente no startup.npm run android:build   # Build debug APK (in android/app/build/outputs/apk/debug/)

npm run android:release # Build release APK (requires keystore config)

---```

- APK connects to server via `public/mobile/api-config.js` (hardcoded URL)

## Códigos do Sistema- Bluetooth printing: `public/mobile/bluetooth-printer.js` + `cordova-plugin-bluetooth-serial`

- Version in `capacitor.config.json` format: `2.2.5-YYYYMMDD-HHMM`

**⚠️ SEMPRE consultar `docs/PADRONIZACAO_CODIGOS.md`**

**Test workflows**:

| Entidade | Formato | Exemplo |- No automated tests (manual testing only)

|----------|---------|---------|- See `GUIA_TESTES_SISTEMA_COMPLETO.md` for comprehensive test checklist

| Produto | `{LOJA}-{00000}` | `PLA-00123` |- Use `teste-qrcodes.html` for QR code scanning simulation

| Bobina | `BOB-{LOJA}-{000000}` | `BOB-PLA-000001` |- Debug logs: Emoji prefixes (✅ success, ❌ error, ⚠️ warning, 🔄 processing)

| Retalho | `RET-{LOJA}-{000000}` | `RET-CIA-000042` |

| Plano | `PDC-{LOJA}-{000}` | `PDC-PLA-001` |## Documentation Standards

| Corte | `COR-{LOJA}-{PDC}-{00}` | `COR-PLA-001-01` |

| Locação | `{0000}-{X}-{0000}` | `0001-A-0025` |Project uses extensive MD documentation - when adding features, update:

- `ROADMAP.md` if changing planned features

**Lojas:** `PLA` = Cortinave/Palotina, `CIA` = BN/Cianorte- `CHANGELOG.md` for user-facing changes

- Create `{FEATURE}_SISTEMA.md` for complex technical decisions (follow `SISTEMA_VALIDACAO_RESERVAS.md` pattern)

---

**Key docs by topic**:

## Medidas- Database reserves: `SISTEMA_VALIDACAO_RESERVAS.md`

- QR system: `SISTEMA_CORTES_QR.md` + `ROADMAP_SISTEMA_CORTES_QR.md`

**⚠️ SEMPRE consultar `docs/PADRONIZACAO_CODIGOS.md`**- Android setup: `SETUP_ANDROID_ENV.md` + `BUILD_APK.md`

- Railway deploy: `CONFIGURAR_RAILWAY.md` + `FLUXO_DEPLOY_MANUAL.md`

| Tipo | Unidade | Exemplo |- Mobile PWA: `PLANEJAMENTO_MOBILE.md`

|------|---------|---------|
| Largura | cm | `190cm` |
| Comprimento | m | `150,00m` |
| Bando Y | LMxLYxLYcm | `220x80x80cm` |

---

## Etiquetas

**⚠️ SEMPRE consultar `docs/ESPECIFICACAO_ETIQUETAS.md`**

- Tamanho: 60mm x 30mm
- Barcode: Code 128
- Impressora: Elgin L42 Pro Full

---

## Sistema de Reservas

**⚠️ SEMPRE consultar `docs/SISTEMA_VALIDACAO_RESERVAS.md`**

- `metragem_reservada` é controlada por **triggers** do banco
- NUNCA fazer UPDATE manual em metragem_reservada
- Triggers sincronizam automaticamente com `alocacoes_corte`

---

## Deploy

1. Commitar alterações
2. Push para `main`
3. Railway Dashboard → Deploy manual

**Ver:** `docs/CONFIGURAR_RAILWAY.md`

---

## Mobile/Android

- Código em `public/mobile/`
- API config em `api-config.js`
- Build: `npm run android:build`

**Ver:** `docs/BUILD_APK.md`, `docs/SETUP_ANDROID_ENV.md`

---

## Tarefas Comuns

### Nova Rota
1. Controller em `controllers/{recurso}Controller.js`
2. Rota em `routes/{recurso}.js`
3. Registrar em `server.js`

### Nova Migration
1. Criar `migrations/0XX_descricao.js`
2. Reiniciar servidor (executa automático)

### Build APK
```powershell
npm run android:sync
npm run android:build
```

---

## Documentação

Ao implementar features:
- Atualizar `CHANGELOG.md` para mudanças visíveis
- Atualizar `ROADMAP.md` se mudar planejamento
- Criar doc em `/docs/` para decisões técnicas complexas
