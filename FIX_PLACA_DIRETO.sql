-- EXECUTAR ESTE SQL DIRETO NO RAILWAY DATABASE
-- Dashboard Railway > MySQL > Data > Query

-- 1. Verificar se coluna já existe
SELECT COLUMN_NAME 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'bobinas' 
  AND COLUMN_NAME = 'placa';

-- 2. Se não existir, criar a coluna
ALTER TABLE bobinas 
ADD COLUMN placa VARCHAR(100) DEFAULT NULL 
COMMENT 'Código único do fabricante (vinculado à garantia)';

-- 3. Criar índice
CREATE INDEX idx_bobinas_placa ON bobinas(placa);

-- 4. Verificar se foi criada
DESCRIBE bobinas;

-- 5. Registrar migration como executada (para evitar conflitos)
INSERT INTO migrations (name) VALUES ('027_add_placa_to_bobinas.js');
INSERT INTO migrations (name) VALUES ('028_add_placa_fallback.js');
