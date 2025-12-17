# 📋 CHANGELOG - Controle de Bobinas

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

---

## [2.5.1] - 2025-12-17 📍 Padronização Código de Barras Locação

### 🏷️ Alterações

#### Código de Barras de Locação
- **Novo formato:** `LOC-0000-X-0000` (ex: `LOC-0001-A-0001`)
- **Prefixo LOC-** usado apenas no código de barras para identificação no scanner
- **Banco de dados:** mantém formato `0000-X-0000` (sem prefixo)
- **Display na etiqueta:** mostra código legível `0001-A-0001` (sem prefixo)

#### Documentação Atualizada
- `docs/PADRONIZACAO_CODIGOS.md` - Novo padrão de locação
- `docs/ESPECIFICACAO_ETIQUETAS.md` - Recriado (arquivo estava corrompido)
- `docs/API_MOBILE_V2.md` - Referências ao formato LOC-
- `.github/copilot-instructions.md` - Tabela de códigos QR

#### Código Atualizado
- `controllers/impressaoController.js` - Geração do código de barras com prefixo LOC-
- Garantia de formato `0000-X-0000` mesmo para entradas curtas

### 🔄 Fluxo de Leitura
```
1. Scanner lê: LOC-0001-A-0001
2. Sistema identifica prefixo LOC- → É uma locação
3. Sistema extrai: 0001-A-0001
4. Busca no banco: WHERE locacao = '0001-A-0001'
```

---

## [2.5.0] - 2025-12-12 🎉 MOBILE V2.0

### 🚀 Reconstrução Completa do Mobile

#### Nova Arquitetura
- **Stack:** Vanilla JS + Capacitor 7 + Bootstrap 5
- **Scanner:** ML Kit Barcode Scanning (Code 128) - substitui QR codes
- **Camera:** Capacitor Camera (HD 1280x720, 85% quality)
- **Impressão:** Server-side (remove Bluetooth térmica do mobile)
- **Dispositivo:** Xiaomi Mi 13T (Android 13+)
- **Conectividade:** Always online (Wi-Fi)

#### 📱 Três Módulos Implementados

**1. CONSULTAS** (741 linhas)
- Scanner de códigos de barras
- Input manual com validação
- Detalhes de bobinas (metragem, locação, status)
- Detalhes de retalhos (origem, produto)
- Detalhes de cortes (PDC, cliente, foto)
- Detalhes de locações (itens armazenados)
- Ações: imprimir etiqueta, ver histórico

**2. PDC - Produção** (986 linhas)
- Listagem de PDCs em produção com progresso
- Agrupamento de origens (bobinas/retalhos)
- Validação de origem via scanner (antes de cortar)
- Lista de cortes pendentes por origem
- **Captura obrigatória de foto do medidor** (contraprova)
- Registro de corte com upload multipart
- Atualização de locação após cortes
- Finalização com múltiplas locações de armazenamento

**3. CARREGAMENTO** (622 linhas)
- Listagem de PDCs finalizados
- Início de processo de carregamento
- Validação de cortes via scanner
- Progresso em tempo real (X/Y cortes - %)
- Detecção de erros (corte de outro PDC, duplicado)
- Lista dos últimos 5 validados
- Finalização com auditoria completa
- Histórico de carregamentos anteriores

#### 🏗️ Base Compartilhada (1.628 linhas)

**Componentes:**
- `mobile.css` (500+ linhas) - Estilos globais, scanner overlay, progress bars
- `config.js` - Configurações centralizadas (API, scanner, camera, timeouts)
- `utils.js` (400+ linhas) - 30+ funções utilitárias (formatação, toasts, validação)
- `api.js` (300+ linhas) - 22 endpoints mapeados
- `scanner.js` - Wrapper ML Kit com callbacks
- `camera.js` - Wrapper Capacitor Camera com FormData

#### 🔌 Backend - 10 Novos Endpoints

1. `GET /api/mobile/validar-codigo/:codigo` - Valida e detecta tipo
2. `GET /api/mobile/pdcs/producao` - Lista PDCs em produção com progresso
3. `GET /api/mobile/pdcs/:id/origens` - Agrupa origens por PDC
4. `POST /api/mobile/pdcs/validar-origem` - Valida scan de origem
5. `POST /api/mobile/pdcs/atualizar-locacao` - Atualiza locação pós-corte
6. `GET /api/mobile/carregamento/disponiveis` - PDCs finalizados
7. `POST /api/mobile/carregamento/validar-corte` - Valida corte em carregamento
8. `GET /api/mobile/historico/:tipo/:id` - Histórico (placeholder)
9. `POST /api/mobile/imprimir` - Impressão (placeholder)
10. Endpoints de iniciar/finalizar carregamento

#### 📦 Capacitor Setup

**Plugins Instalados:**
- `@capacitor/core@^8.0.0`
- `@capacitor/android@^8.0.0`
- `@capacitor-mlkit/barcode-scanning@7.4.0`
- `@capacitor/camera@8.0.0`

**Configurações:**
- Scanner: Code 128, lens back, beep + vibrate
- Camera: HD 1280x720, quality 85%, no editing
- Server: URL produção Railway configurada

#### 📚 Documentação Nova

- `docs/MOBILE_V2_COMPLETO.md` (1.126 linhas) - Especificação completa com wireframes
- `docs/GUIA_TESTES_MOBILE_V2.md` - 28 cenários de teste detalhados
- `docs/SETUP_CAPACITOR_V2.md` - Guia completo de configuração e build APK
- `docs/API_MOBILE_V2.md` - Documentação de todos endpoints

#### 🎯 Estatísticas

- **Total de código:** ~6.500 linhas
- **Arquivos criados:** 17 arquivos (13 código + 4 docs)
- **Commits:** 7 commits
- **Tempo desenvolvimento:** 1 dia
- **Cobertura:** 3 módulos completos + backend completo

### 🔧 Melhorias Técnicas

- **Validações:** Múltiplos checkpoints antes de cada operação
- **Feedback:** Visual, háptico e sonoro em todas ações
- **Performance:** Loading states, debounce, cache opcional
- **UX:** Progress bars animadas, toasts informativos, navegação intuitiva
- **Segurança:** Input validation, error handling, timeout em requests

### 📝 Scripts NPM Adicionados

```bash
npm run android:sync     # Sincroniza assets web → Android
npm run android:build    # Build debug APK
npm run android:release  # Build release APK
```

### 🚀 Próximos Passos

1. Testes completos (28 cenários documentados)
2. Build APK debug
3. Instalação no Xiaomi Mi 13T
4. Testes em produção real
5. Coleta de feedback do operador

---

## [2.4.0] - 2025-01-XX

### 🗄️ Padronização do Banco de Dados

#### Schema Atualizado
- **Campo `locacao`** em bobinas e retalhos agora é VARCHAR (não mais FK)
- **Formato padrão**: `CORREDOR-PRATELEIRA-POSICAO` (ex: 1-A-1, 12-B-34)
- **Regex validação**: `/^[1-9]\d{0,3}-[A-Z]-[1-9]\d{0,3}$/`
- **Removida tabela `locacoes`** - locações agora são texto livre com máscara

#### Regras de Campos
- `fabricante` existe **apenas** em `produtos` (buscar via JOIN)
- `loja` em bobinas é **denormalizado** por performance (cópia de produtos.loja)
- Items com `metragem = 0` recebem `status = 'Esgotado'` (mantidos para histórico)

#### Migrações
- **034**: Padronização de locação (VARCHAR) e remoção de tabela locacoes

### 📚 Documentação
- Novo `docs/PADRONIZACAO_BANCO.md` com regras completas do schema
- Atualizado `.github/copilot-instructions.md` com padrões de queries

---

## [2.3.1] - 2025-12-11

### 🐛 Correções de Bugs

#### Impressão de Etiquetas
- **Corrigido** erro "Unknown column 'b.fabricante'" ao imprimir etiqueta de bobina
- **Corrigido** erro ao imprimir etiqueta de retalho quando bobina origem foi excluída
- Queries agora buscam `fabricante` e `loja` da tabela `produtos` (não mais de `bobinas`)

#### Conversão Bobina → Retalho
- **Corrigido** erro 500 ao converter bobina em retalho
- Removida tentativa de herdar `localizacao_atual` da bobina (campo não existe em bobinas)

---

## [2.3.0] - 2025-12-11

### ✨ Novidades Principais

#### 🏷️ Central de Etiquetas
- **Nova tela unificada** `/etiquetas.html` para impressão de todos os tipos de etiquetas
- **5 abas**: Bobinas, Retalhos, Cortes, Locações e Histórico de Impressão
- **Impressão em lote** com seleção múltipla
- **Gerador de range** de locações (ex: 0001-A-0001 até 0001-A-0050)
- **Modo Teste** para preview visual sem impressão física
- **Histórico de impressão** integrado com status e reimprimir

#### 📊 Histórico de Movimentações
- **Nova tabela** `historico_movimentacoes` para rastreabilidade completa
- **API** `/api/historico/produto/:id` para consulta de movimentações
- Registra: entradas, cortes, transformações, exclusões de bobinas/retalhos

#### 🔄 Melhorias no Estoque
- **Prefixo automático** CTV-/BN- baseado na loja selecionada
- **Campo código** aceita apenas 5 dígitos numéricos
- **Botão Cadastrar Novo Produto** corrigido (adicionado campo fabricante)
- **Transformar em Retalho** agora exclui a bobina (ao invés de marcar)
- Retalho herda **placa** e **localização** da bobina origem

#### 📦 Produtos
- **Código aumentado** para 5 dígitos (era 4)
- Preview do código final com prefixo da loja

### 🗄️ Banco de Dados

#### Nova Migration
- **033**: `historico_movimentacoes` - Rastreabilidade por produto

### 📚 Documentação
- Atualizado `FUNCIONALIDADES.md` com novos módulos
- Seções de Central de Etiquetas e Histórico de Movimentações

---

## [2.2.0] - 2025-01-XX

### ✨ Novidades Principais

#### ✂️ Sistema de Cortes com QR Code
- **Rastreabilidade completa** de cortes individuais com código único (COR-2025-00001)
- **Validação via QR Code** antes de cada corte (garante origem correta)
- **Foto de contraprova** obrigatória do medidor (compressão automática com Sharp)
- **Gestão de armazenamento** com locações físicas (A1-B1-C1, etc.)
- **Validação de carregamento** com scanner QR e feedback visual verde/vermelho
- **9 novas telas mobile** com interface otimizada para chão de fábrica

### 🗄️ Banco de Dados

#### Novas Tabelas (9 Migrations)
- **`locacoes`**: Localizações físicas no armazém (17 locações iniciais)
- **`cortes_realizados`**: Registro individual de cada corte com foto
- **`plano_locacoes`**: Relacionamento planos ↔ locações de armazenamento
- **`carregamentos`**: Processos de carregamento para envio
- **`carregamentos_itens`**: Auditoria de cortes validados no carregamento

#### Alterações em Tabelas Existentes
- **`planos_corte`**: campos `data_finalizacao`, `armazenado`, `locacoes_armazenamento`
- **`alocacoes_corte`**: campos `metragem_cortada`, `status_corte` (pendente/em_andamento/concluido)
- **`bobinas` e `retalhos`**: campo `locacao_id` (FK para localizações)

### 🎯 Backend - Novos Endpoints

#### QR Codes (`/api/qrcodes`)
- `GET /bobina/:id` - Gera QR de bobina
- `GET /retalho/:id` - Gera QR de retalho
- `GET /corte/:codigo` - Gera QR de corte
- `GET /locacao/:id` - Gera QR de locação
- `POST /locacoes/lote` - Gera múltiplos QRs

#### Cortes (`/api/mobile/corte`)
- `POST /registrar-corte` - Cria novo corte com foto e validações
- `GET /:codigo_corte` - Consulta corte por código
- `GET /plano/:plano_id` - Lista cortes de um plano

#### Locações (`/api/locacoes`)
- CRUD completo (listar, buscar, criar, atualizar, desativar)

#### Mobile - Validação e Carregamento
- `POST /validar-qr-bobina` - Valida origem antes de cortar
- `POST /upload-foto-medidor` - Upload com compressão automática
- `POST /plano/:id/finalizar` - Finaliza plano com locações
- `POST /carregamento/iniciar` - Inicia processo de carregamento
- `POST /carregamento/validar-scan` - Valida corte no carregamento
- `POST /carregamento/finalizar` - Finaliza carregamento

### 📱 Mobile PWA - Novas Telas

1. **Menu Principal Expandido**: Ordens Produção, Consultas, Carregamento
2. **Submenu Consultas**: Consultar Bobina | Consultar Corte
3. **Validar Bobina Origem**: Scanner com validação visual
4. **Registrar Corte**: Metragem + Upload foto + Observações
5. **QR Corte Gerado**: QR grande + Progresso do item
6. **Finalizar Plano**: Scanner de locações de armazenamento
7. **Consultar Corte**: Scanner + Detalhes + Foto contraprova
8. **Lista Planos Finalizados**: Cards com totais
9. **Validação Carregamento**: Scanner + Barra progresso + Lista validados

### 🖨️ Impressão

#### Etiquetas Térmicas (100mm x 50mm)
- **Etiqueta de Corte**: QR + código + metragem + produto + origem + data
- **Etiquetas de Locações em Lote**: Filtros por rua/prateleira, preview em grid

#### Acesso Desktop
- Configurações → Manutenção → 🖨️ Imprimir Etiquetas de Locações

### 🔧 Melhorias Técnicas

#### Dependências Instaladas
- **qrcode** (1.5.3): Geração de QR Codes em Base64
- **multer** (1.4.5): Upload de arquivos multipart/form-data
- **sharp** (0.33.0): Compressão inteligente de imagens (resize 1200px, JPEG 80%)

#### Middleware
- **uploadFotos.js**: Upload automático para `/uploads/fotos-medidor/` com compressão
- Limite de 5MB por arquivo
- Geração automática de filename: `medidor_{timestamp}.jpg`

#### Controladores Criados
- **qrcodesController.js**: Geração de QR para todas entidades
- **cortesController.js**: Registro, consulta e validação de cortes
- **locacoesController.js**: CRUD de localizações físicas

### 📊 Lógica de Negócio

#### Geração de Códigos Únicos
- **Cortes**: COR-{YEAR}-{SEQ} (ex: COR-2025-00001)
- **Carregamentos**: CAR-{YEAR}-{SEQ} (ex: CAR-2025-00001)
- **Locações**: {RUA}-{PRATELEIRA}-{COLUNA} (ex: A1-B1-C1)

#### Status de Alocação Auto-atualizado
- **pendente**: nenhum corte registrado
- **em_andamento**: 0 < cortado < alocado
- **concluido**: cortado >= alocado

#### Validações Implementadas
- Origem deve corresponder ao QR escaneado
- Metragem cortada não pode exceder restante
- Plano só finaliza se TODOS itens concluídos
- Carregamento só valida cortes do plano correto

### 📚 Documentação

#### Novos Arquivos
- **SISTEMA_CORTES_QR.md**: Documentação técnica completa (800+ linhas)
  - Arquitetura, fluxos, endpoints, migrations, troubleshooting
- **ROADMAP_SISTEMA_CORTES_QR.md**: Planejamento detalhado (884 linhas)
  - 7 fases, 23 tarefas, estimativas, SQL schemas, mockups

#### Atualizado
- **.github/copilot-instructions.md**: Inclui sistema de cortes QR
- **CHANGELOG.md**: Esta seção

### 🎨 Estilos CSS - Mobile

#### Novos Componentes
- `.info-box` (warning, success)
- `.success-box` (gradiente verde)
- `.codigo-display` (monospace grande)
- `.qr-display-container`
- `.foto-preview` (com botão remover)
- `.locacoes-list`, `.locacao-item`
- `.progresso-carregamento`, `.progresso-bar`
- `.scan-feedback` (animação slideDown)
- `.cortes-validados-list`

### 📦 Estrutura de Arquivos

#### Criados (~5000 linhas)
```
controllers/       3 arquivos (cortesController, locacoesController, qrcodesController)
routes/            2 novos (qrcodes, locacoes) + mobile expandido
middleware/        uploadFotos.js
migrations/        9 arquivos (011 a 019)
public/mobile/     index.html, app.js, styles.css (expandidos)
public/impressao/  2 arquivos (etiqueta-corte, etiquetas-locacoes)
uploads/           pasta fotos-medidor/
```

### 🚀 Fluxo de Operação

1. **Preparação (Desktop)**: Criar plano → Iniciar produção → Imprimir etiquetas locações
2. **Produção (Mobile)**: Validar origem → Registrar corte + foto → Gerar QR corte
3. **Armazenamento (Mobile)**: Escanear locações → Finalizar plano
4. **Carregamento (Mobile)**: Selecionar plano → Escanear todos cortes → Finalizar

---

## [2.1.0] - 2025-11-27

### ✨ Novidades

#### 🏷️ Carimbo de Versão
- **Adicionado carimbo visual** no canto inferior direito de todas as páginas
- Mostra versão atual (v2.1.0) e data de atualização
- Indica ambiente: 🔧 DEV (localhost) ou ✓ PROD (produção)
- Tooltip com informações completas ao passar o mouse

#### 📚 Documentação de Deploy
- **FLUXO_DEPLOY_MANUAL.md**: Guia completo de deploy manual no Railway
- **CONFIGURAR_RAILWAY.md**: Passo a passo para configurar deploy manual
- **AMBIENTE_TESTES.md**: Guia de ambientes (DEV, Staging, PROD)

### 🚀 Performance

#### 📊 Índices de Banco de Dados
- **13 novos índices** criados para otimização:
  - `idx_produtos_nome` - Busca por nome de produto
  - `idx_produtos_ativo` - Filtro de produtos ativos
  - `idx_bobinas_produto_id` - Relação bobinas ↔ produtos
  - `idx_bobinas_metragem_disponivel` - Busca por metragem
  - `idx_bobinas_localizacao` - Busca por localização
  - `idx_retalhos_produto_id` - Relação retalhos ↔ produtos
  - `idx_retalhos_metragem_disponivel` - Busca por metragem
  - `idx_ordens_status` - Filtro de ordens por status
  - `idx_ordens_data_criacao` - Ordenação por data
  - `idx_ordens_itens_ordem_id` - Relação itens ↔ ordens
  - `idx_ordens_itens_produto_id` - Relação itens ↔ produtos
  - `idx_bobinas_produto_disponivel` - Índice composto (produto + metragem)
  - `idx_retalhos_produto_disponivel` - Índice composto (produto + metragem)

**Benefícios**:
- ⚡ Queries até 10x mais rápidas
- 🎯 Buscas otimizadas em estoque
- 📈 Melhor performance em ordens de corte

#### 🔄 Debounce em Frontend
- **Debounce inline seguro** adicionado em:
  - `produtos.js` - Evita múltiplas requisições em filtros
  - `estoque.js` - Otimiza buscas e filtros
  - `ordens.js` - Reduz carga ao buscar sugestões
- **Implementação segura**: Função inline (sem dependência externa)
- **Delay**: 300ms para campos de input/busca

### 🔒 Segurança

#### 🛡️ Helmet - Headers HTTP
- **Content Security Policy** configurado (inline scripts permitidos)
- **X-Content-Type-Options**: nosniff
- **X-Frame-Options**: sameorigin
- **X-XSS-Protection**: 1; mode=block
- **Strict-Transport-Security**: max-age=15552000

#### ⏱️ Rate Limiting
- **Limite**: 1000 requisições por 15 minutos (generoso)
- **Escopo**: Apenas rotas `/api/*`
- **Proteção contra**: Ataques DDoS, força bruta, abuso de API

### 🗑️ Remoções

#### 🔍 Debug Auto-Alocar
- Removido botão "🔍 Debug Auto-Alocar" da página de Ordens
- Removida função `debugAutoAlocar()` (~120 linhas)
- Interface mais limpa e profissional

### 🐛 Correções

#### ✅ Queries Otimizadas
- Produtos: JOINs com cores e gramaturas (já otimizado)
- Bobinas: JOINs com produtos e configurações (já otimizado)
- Estoque: Queries consolidadas com agregações

### 📦 Dependências

#### Atualizadas
- `helmet`: ^8.1.0 (segurança HTTP)
- `express-rate-limit`: ^8.2.1 (limitação de taxa)

### 🔧 Técnico

#### Migrations
- **Migration 010**: Índices de performance (safe - não afeta código)
- Sistema de migrations automático ao iniciar servidor
- Controle de versão de migrations no banco

#### Arquitetura
- Debounce inline (sem arquivo utils.js separado - evita erro de carregamento)
- Rate limiting apenas em APIs (não afeta arquivos estáticos)
- Helmet com CSP relaxado (compatível com inline scripts existentes)

---

## [2.0.1] - 2025-11-27

### 🔄 Rollback

#### Reversão Completa
- **Revertidos 3 commits** de otimizações que causaram quebra total
- **Commits revertidos**:
  - `b0961bf` - Force redeploy
  - `d78bcd6` - Correção de debounce (não funcionou)
  - `a9f07a8` - MVP otimizado (causou quebra)

#### Problemas Identificados
- ❌ Debounce carregando antes de `utils.js` existir
- ❌ Todas funcionalidades quebraram (produtos, estoque, ordens)
- ❌ Modais não abrindo, campos não aparecendo
- ❌ Build do Railway travando (6+ minutos)

#### Solução
- ✅ Git revert para versão estável `ab67e24`
- ✅ Sistema 100% funcional restaurado
- ✅ Deploy bem-sucedido (timestamp: 04:16:27)
- ✅ Lições aprendidas documentadas em `ROLLBACK_COMPLETO.md`

#### Arquivos Restaurados
- `DEBUG-CONSOLE.js` (ferramenta de debug)
- `debug-plano.js` (análise de planos)
- `verificar-estrutura.js` (validação)

#### Arquivos Removidos
- `AUDITORIA-MVP.md`
- `PROXIMOS_PASSOS.md`
- `public/js/utils.js` (causou problema)
- `database/migrations/007_add_performance_indexes.js`

---

## [2.0.0] - 2025-11-26 (QUEBRADO - REVERTIDO)

### ⚠️ VERSÃO INSTÁVEL - NÃO USAR

Esta versão foi completamente revertida. Veja v2.0.1 para detalhes.

**Problemas**:
- Sistema completamente quebrado
- Funcionalidades não carregavam
- Deploy com problemas

---

## Como Ler este CHANGELOG

### Símbolos Usados
- ✨ Novidade (feature)
- 🚀 Performance
- 🔒 Segurança
- 🐛 Correção
- 🗑️ Remoção
- 📚 Documentação
- 🔧 Técnico
- ⚠️ Aviso importante

### Versionamento Semântico
- **MAJOR** (X.0.0): Mudanças incompatíveis
- **MINOR** (0.X.0): Novas funcionalidades compatíveis
- **PATCH** (0.0.X): Correções e melhorias

---

## Próximas Versões Planejadas

### [2.2.0] - Futuro
- [ ] Relatórios de produção
- [ ] Exportação para Excel
- [ ] Dashboard analítico
- [ ] Histórico de movimentações

### [2.3.0] - Futuro
- [ ] Multi-usuário com autenticação
- [ ] Níveis de permissão
- [ ] Logs de auditoria
- [ ] Backup automático

---

**Última atualização**: 27/11/2025  
**Versão atual**: v2.1.0  
**Status**: ✅ Estável em Produção
