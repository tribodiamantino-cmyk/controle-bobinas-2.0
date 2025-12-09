# Force Deploy - Executar Migration 027

**Data:** 09/12/2025 17:54

**Motivo:** Forçar Railway a executar migration 027_add_placa_to_bobinas.js

**Migration 027:**
- Adiciona coluna `placa` VARCHAR(100) à tabela `bobinas`
- Cria índice `idx_bobinas_placa`

**Necessário porque:**
O código foi atualizado (commit 6eff58d) mas a migration não executou automaticamente no último deploy. Este commit força um novo deploy que executará a migration pendente.

**Após este deploy:**
- Campo `placa` estará disponível no banco
- API `/mobile/imprimir/buscar-codigo` funcionará corretamente
- Etiquetas mobile exibirão PLACA, Largura e Bainha
