-- ============================================
-- SETUP SIMPLES - CONTROLE DE BOBINAS 2.0
-- Execute este script no Railway Query Editor
-- ============================================

-- 1. Configurações: Cores
CREATE TABLE IF NOT EXISTS configuracoes_cores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome_cor VARCHAR(100) NOT NULL,
    codigo_hex VARCHAR(7) DEFAULT '#CCCCCC',
    ativo BOOLEAN DEFAULT TRUE,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_nome_cor (nome_cor)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Configurações: Gramaturas
CREATE TABLE IF NOT EXISTS configuracoes_gramaturas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    gramatura VARCHAR(50) NOT NULL,
    ativo BOOLEAN DEFAULT TRUE,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_gramatura (gramatura)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Produtos
CREATE TABLE IF NOT EXISTS produtos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    loja ENUM('Cortinave', 'BN') NOT NULL,
    codigo_produto VARCHAR(100) NOT NULL,
    cor_id INT NOT NULL,
    gramatura_id INT NOT NULL,
    fabricante ENUM('Propex', 'Textiloeste') NOT NULL,
    largura_sem_costura DECIMAL(10,2) NOT NULL,
    tipo_bainha ENUM('Cano/Cano', 'Cano/Arame', 'Arame/Arame') NOT NULL,
    largura_final DECIMAL(10,2) NOT NULL,
    ativo BOOLEAN DEFAULT TRUE,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ultima_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (cor_id) REFERENCES configuracoes_cores(id),
    FOREIGN KEY (gramatura_id) REFERENCES configuracoes_gramaturas(id),
    UNIQUE KEY unique_produto (loja, codigo_produto)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Bobinas
CREATE TABLE IF NOT EXISTS bobinas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    produto_id INT NOT NULL,
    id_interno VARCHAR(100) NOT NULL UNIQUE,
    metragem_inicial DECIMAL(10,2) NOT NULL,
    metragem_atual DECIMAL(10,2) NOT NULL,
    locacao VARCHAR(13) NOT NULL,
    status ENUM('Disponível', 'Em Uso', 'Vazia', 'Bloqueada') DEFAULT 'Disponível',
    data_entrada DATE NOT NULL,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ultima_movimentacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    observacoes TEXT,
    FOREIGN KEY (produto_id) REFERENCES produtos(id),
    INDEX idx_produto (produto_id),
    INDEX idx_status (status),
    INDEX idx_locacao (locacao)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Ordens de Corte
CREATE TABLE IF NOT EXISTS ordens_corte (
    id INT AUTO_INCREMENT PRIMARY KEY,
    numero_ordem VARCHAR(50) NOT NULL UNIQUE,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    criado_por VARCHAR(100) DEFAULT 'Sistema',
    status ENUM('Pendente', 'Em Andamento', 'Concluída', 'Cancelada') DEFAULT 'Pendente',
    observacoes TEXT,
    data_conclusao TIMESTAMP NULL,
    INDEX idx_numero_ordem (numero_ordem),
    INDEX idx_status (status),
    INDEX idx_data_criacao (data_criacao)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Itens da Ordem de Corte
CREATE TABLE IF NOT EXISTS itens_ordem_corte (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ordem_corte_id INT NOT NULL,
    bobina_id INT NOT NULL,
    produto_id INT NOT NULL,
    metragem_cortada DECIMAL(10,2) NOT NULL,
    data_corte TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    observacoes TEXT,
    FOREIGN KEY (ordem_corte_id) REFERENCES ordens_corte(id) ON DELETE CASCADE,
    FOREIGN KEY (bobina_id) REFERENCES bobinas(id),
    FOREIGN KEY (produto_id) REFERENCES produtos(id),
    INDEX idx_ordem (ordem_corte_id),
    INDEX idx_bobina (bobina_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- DADOS INICIAIS
-- ============================================

-- Cores Iniciais
INSERT INTO configuracoes_cores (nome_cor, codigo_hex) VALUES
('Branco', '#FFFFFF'),
('Preto', '#000000'),
('Azul', '#0066CC'),
('Verde', '#00CC66'),
('Amarelo', '#FFCC00')
ON DUPLICATE KEY UPDATE nome_cor=nome_cor;

-- Gramaturas Iniciais
INSERT INTO configuracoes_gramaturas (gramatura) VALUES
('180 g/m²'),
('200 g/m²'),
('220 g/m²'),
('250 g/m²')
ON DUPLICATE KEY UPDATE gramatura=gramatura;

-- ============================================
-- PRONTO! ✅
-- ============================================
