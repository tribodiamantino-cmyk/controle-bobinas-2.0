# Controle de Bobinas 2.0 - AI Agent Instructions

## System Overview

Fabric roll inventory management system for Cortinave & BN (poultry tarp manufacturers). Tracks **physical bobinas** (rolls) containing **logical produtos** (fabric specs), manages **planos de corte** (cut plans) with automatic allocation, and includes **native Android app** with Bluetooth thermal printing.

**Critical Distinction**: A `produto` is an abstract fabric specification (color, weight, width). A `bobina` is a physical roll containing that product with specific metragem (meters). One produto → many bobinas.

## Architecture

- **Backend**: Node.js + Express + MySQL, deployed on Railway (manual deploys only)
- **Pattern**: Traditional MVC with routes → controllers → direct DB queries (no ORM, no TypeScript)
- **Database**: Connection pool via `config/database.js` with Railway-specific env vars (`MYSQLHOST`, `MYSQLUSER`, etc.)
- **Frontend**: 
  - Desktop: Vanilla JS with server-side rendered HTML in `public/` (no build step)
  - Mobile: Capacitor v8 + Vanilla JS in `public/mobile/` → Android APK with native features
- **External Services**: Bluetooth thermal printer (M58-LL) via `cordova-plugin-bluetooth-serial`

## Database Schema & Business Logic

### Core Tables
```
produtos (specifications)
  ├─ bobinas (physical rolls with metragem_atual/reservada)
  └─ retalhos (remnants from cuts)

planos_corte (cut plans: planejamento → em_producao → finalizado)
  ├─ itens_plano_corte (items to cut)
  ├─ alocacoes_corte (which bobina/retalho provides material)
  └─ cortes_realizados (individual cuts with QR codes and photos)

locacoes (warehouse locations: A1-B1-C1, A2-B2-C2, etc.)
  └─ plano_locacoes (storage locations for finalized plans)

carregamentos (loading processes for shipping)
  └─ carregamentos_itens (audit trail of validated cuts)
```

### QR Code System (NEW in v2.2.0)
**Critical Features**: Individual cut tracking with photo contraprova, origin validation, and loading verification.

- **Codes Generated**:
  - `BOB-{id}` for bobinas (legacy)
  - `RET-{id}` for retalhos (legacy)
  - `COR-{YEAR}-{SEQ}` for cortes (e.g., COR-2025-00001) - NEW
  - `LOC-{id}` for locacoes - NEW
  - `CAR-{YEAR}-{SEQ}` for carregamentos - NEW

- **Controllers**: `qrcodesController.js`, `cortesController.js`, `locacoesController.js`
- **Routes**: `/api/qrcodes`, `/api/mobile/corte`, `/api/locacoes`, `/api/mobile/carregamento`
- **Photo Upload**: `middleware/uploadFotos.js` with multer + sharp compression (5MB limit, JPEG 80%, 1200px max)
- **See**: `SISTEMA_CORTES_QR.md` for complete documentation

**Key Flows**:
1. **Validation**: Mobile scans bobina QR → validates against expected origin → proceeds to cut
2. **Cut Registration**: Operator inputs metragem + uploads medidor photo → system generates unique COR code
3. **Finalization**: When all items cut → scan warehouse location QRs → mark plan as finalizado
4. **Loading**: Scan cut QRs to validate → green/red feedback → finalizes when 100% validated

### Reserved Metragem System
**Critical**: `metragem_reservada` in bobinas/retalhos MUST match active allocations in `alocacoes_corte` for plans with `status='em_producao'`. 

- **Orphaned reserves** = disaster (material appears unavailable but isn't actually allocated)
- **Prevention**: Database triggers in `database/migrations/006_add_triggers_reservas.js` automatically sync reserves on allocation delete/update
- **Validation**: `middleware/validarReservas.js` runs on startup to detect and fix inconsistencies
- **See**: `SISTEMA_VALIDACAO_RESERVAS.md` for complete multi-layer solution

When modifying allocation logic in `controllers/ordensCorteController.js`:
1. Never manually UPDATE metragem_reservada (triggers handle it)
2. If deleting alocacoes_corte, ensure plano status logic is correct
3. Test with validation middleware to verify reserves match allocations

## Migrations

Auto-run on server start via `server.js:runMigrations()`. Manual run: `npm run migrate`

**Pattern**: Each migration exports `up(db)` and optional `down(db)`. Tracked in `migrations` table (not duplicated in `/database/migrations/`).

```javascript
// migrations/007_example.js
exports.up = async function(db) {
    await db.query(`ALTER TABLE ...`);
    console.log('✓ Migration complete');
};
```

## Coding Conventions

### Routes & Controllers
- Routes pass through to controllers: `router.post('/', controller.criarBobina)`
- Controllers handle validation, business logic, and direct SQL queries
- **Always** use parameterized queries: `db.query(sql, [param1, param2])`
- Return format: `res.json({ success: true, data: result })` or `{ success: false, error: msg }`

### ID Generation
Bobinas get auto-generated `codigo_interno`: `{CTV|BN}-{YEAR}-{5-digit-sequential}`
- See `bobinasController.js:gerarCodigoInterno()` for pattern
- Query last code for year, increment sequence number

### Error Handling
- Log to console with emoji prefixes: `console.log('✅ Success')`, `console.error('❌ Error:')`
- Don't throw on startup failures (database unavailable, migration errors) - log and continue
- See `middleware/validarReservas.js` for graceful degradation pattern

## Railway Deployment

- **Production**: Manual deploys only (auto-deploy disabled per `CONFIGURAR_RAILWAY.md`)
- **Config**: `railway.json` + `nixpacks.json` (Nixpacks builder)
- **Env Vars**: Railway auto-provides `MYSQLHOST`, `MYSQLUSER`, etc. for MySQL service
- **Health Check**: `GET /api/health` returns `{ status: 'OK', timestamp }`

To deploy: Push to `main` branch, then manually trigger in Railway dashboard.

## Mobile PWA

Located in `public/mobile/` with:
- `service-worker.js`: Cache-first for assets, network-first for API calls
- `manifest.json`: PWA configuration for Android install
- Strategy: Offline-capable interface for shop floor with QR code scanning (see `PLANEJAMENTO_MOBILE.md`)

## Key Files

- `ROADMAP.md`: Full system requirements and phased development plan
- `SISTEMA_VALIDACAO_RESERVAS.md`: Critical reserved metragem architecture
- `SISTEMA_CORTES_QR.md`: Complete QR code system documentation (NEW v2.2.0)
- `ROADMAP_SISTEMA_CORTES_QR.md`: QR system implementation roadmap (NEW v2.2.0)
- `database/schema.sql`: Complete table definitions (for reference, migrations are source of truth)
- `server.js`: Entry point with middleware setup, migration runner, and route registration

## Common Tasks

**Add new route**: 
1. Create controller method in `controllers/{resource}Controller.js`
2. Add route in `routes/{resource}.js`
3. Register route in `server.js` (if new resource)

**Add migration**:
1. Create `migrations/0XX_description.js` with `exports.up`
2. Restart server or run `npm run migrate`
3. Verify in `migrations` table

**Debug reserve inconsistencies**:
1. Check `middleware/validarReservas.js` startup logs
2. Verify triggers exist: `SELECT * FROM information_schema.TRIGGERS`
3. Manually validate: Compare SUM(metragem_alocada) from alocacoes_corte to metragem_reservada in bobinas

**Build Android APK**:
```powershell
npm run android:sync    # Sync web assets to Capacitor
npm run android:build   # Build debug APK (in android/app/build/outputs/apk/debug/)
npm run android:release # Build release APK (requires keystore config)
```
- APK connects to server via `public/mobile/api-config.js` (hardcoded URL)
- Bluetooth printing: `public/mobile/bluetooth-printer.js` + `cordova-plugin-bluetooth-serial`
- Version in `capacitor.config.json` format: `2.2.5-YYYYMMDD-HHMM`

**Test workflows**:
- No automated tests (manual testing only)
- See `GUIA_TESTES_SISTEMA_COMPLETO.md` for comprehensive test checklist
- Use `teste-qrcodes.html` for QR code scanning simulation
- Debug logs: Emoji prefixes (✅ success, ❌ error, ⚠️ warning, 🔄 processing)

## Documentation Standards

Project uses extensive MD documentation - when adding features, update:
- `ROADMAP.md` if changing planned features
- `CHANGELOG.md` for user-facing changes
- Create `{FEATURE}_SISTEMA.md` for complex technical decisions (follow `SISTEMA_VALIDACAO_RESERVAS.md` pattern)

**Key docs by topic**:
- Database reserves: `SISTEMA_VALIDACAO_RESERVAS.md`
- QR system: `SISTEMA_CORTES_QR.md` + `ROADMAP_SISTEMA_CORTES_QR.md`
- Android setup: `SETUP_ANDROID_ENV.md` + `BUILD_APK.md`
- Railway deploy: `CONFIGURAR_RAILWAY.md` + `FLUXO_DEPLOY_MANUAL.md`
- Mobile PWA: `PLANEJAMENTO_MOBILE.md`
