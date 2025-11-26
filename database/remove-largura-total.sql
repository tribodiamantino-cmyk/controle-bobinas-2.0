-- Remover coluna largura_total da tabela produtos
ALTER TABLE produtos DROP COLUMN IF EXISTS largura_total;
