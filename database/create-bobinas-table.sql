-- Criar tabela de bobinas
CREATE TABLE IF NOT EXISTS bobinas (
    id INT PRIMARY KEY AUTO_INCREMENT,
    codigo_interno VARCHAR(20) UNIQUE NOT NULL COMMENT 'Código único da bobina (ex: CTV-2024-00001)',
    nota_fiscal VARCHAR(50) NOT NULL COMMENT 'Número da nota fiscal',
    loja ENUM('Cortinave', 'BN') NOT NULL COMMENT 'Loja de destino',
    produto_id INT NOT NULL COMMENT 'Referência ao produto',
    metragem_inicial DECIMAL(10,2) NOT NULL COMMENT 'Metragem inicial da bobina em metros',
    metragem_atual DECIMAL(10,2) NOT NULL COMMENT 'Metragem atual após cortes',
    observacoes TEXT COMMENT 'Observações adicionais',
    status ENUM('Disponível', 'Em uso', 'Esgotada') DEFAULT 'Disponível' COMMENT 'Status da bobina',
    data_entrada DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT 'Data de entrada da bobina',
    FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE RESTRICT,
    INDEX idx_codigo_interno (codigo_interno),
    INDEX idx_loja (loja),
    INDEX idx_produto (produto_id),
    INDEX idx_status (status),
    INDEX idx_data_entrada (data_entrada)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tabela de bobinas de lonas';
