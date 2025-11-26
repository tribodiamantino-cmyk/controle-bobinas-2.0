-- Script para adicionar suporte a Bando Y na tabela produtos

-- Adicionar novas colunas se não existirem
ALTER TABLE produtos 
ADD COLUMN IF NOT EXISTS tipo_tecido ENUM('Normal', 'Bando Y') DEFAULT 'Normal' AFTER fabricante,
ADD COLUMN IF NOT EXISTS largura_maior DECIMAL(10,2) AFTER largura_final,
ADD COLUMN IF NOT EXISTS largura_y DECIMAL(10,2) AFTER largura_maior,
ADD COLUMN IF NOT EXISTS largura_total DECIMAL(10,2) AFTER largura_y;

-- Renomear coluna codigo_produto para codigo (se existir)
ALTER TABLE produtos CHANGE COLUMN codigo_produto codigo VARCHAR(100) NOT NULL;

-- Tornar os campos de tecido normal opcionais (nullable)
ALTER TABLE produtos 
MODIFY COLUMN largura_sem_costura DECIMAL(10,2) NULL,
MODIFY COLUMN tipo_bainha ENUM('Cano/Cano', 'Cano/Arame', 'Arame/Arame') NULL,
MODIFY COLUMN largura_final DECIMAL(10,2) NULL;

-- Atualizar a constraint unique (se necessário)
ALTER TABLE produtos DROP INDEX IF EXISTS unique_produto;
ALTER TABLE produtos ADD UNIQUE KEY unique_produto (loja, codigo);
