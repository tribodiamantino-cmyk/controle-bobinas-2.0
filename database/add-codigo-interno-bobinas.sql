-- Adicionar coluna codigo_interno se não existir
ALTER TABLE bobinas 
ADD COLUMN IF NOT EXISTS codigo_interno VARCHAR(20) UNIQUE NOT NULL COMMENT 'Código único da bobina (ex: CTV-2024-00001)' AFTER id;

-- Adicionar índice se não existir
CREATE INDEX IF NOT EXISTS idx_codigo_interno ON bobinas(codigo_interno);
