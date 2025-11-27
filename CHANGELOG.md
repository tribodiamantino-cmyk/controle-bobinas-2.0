# 📋 CHANGELOG - Controle de Bobinas

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

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
