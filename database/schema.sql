-- ============================================
-- SISTEMA DE CONTROLE DE BOBINAS 2.0
-- Cortinave & BN - Lonas para Aviários
-- ============================================

-- Configurações: Cores
CREATE TABLE IF NOT EXISTS configuracoes_cores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome_cor VARCHAR(100) NOT NULL,
    codigo_hex VARCHAR(7) DEFAULT '#CCCCCC',
    ativo BOOLEAN DEFAULT TRUE,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_nome_cor (nome_cor)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Configurações: Gramaturas
CREATE TABLE IF NOT EXISTS configuracoes_gramaturas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    gramatura VARCHAR(50) NOT NULL,
    ativo BOOLEAN DEFAULT TRUE,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_gramatura (gramatura)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Produtos (Metro Linear do Tecido)
CREATE TABLE IF NOT EXISTS produtos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    loja ENUM('Cortinave', 'BN') NOT NULL,
    codigo_produto VARCHAR(100) NOT NULL,
    cor_id INT NOT NULL,
    gramatura_id INT NOT NULL,
    fabricante ENUM('Propex', 'Textiloeste') NOT NULL,
    largura_sem_costura DECIMAL(10,2) NOT NULL COMMENT 'em cm',
    tipo_bainha ENUM('Cano/Cano', 'Cano/Arame', 'Arame/Arame') NOT NULL,
    largura_final DECIMAL(10,2) NOT NULL COMMENT 'em cm, com bainha',
    ativo BOOLEAN DEFAULT TRUE,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ultima_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (cor_id) REFERENCES configuracoes_cores(id),
    FOREIGN KEY (gramatura_id) REFERENCES configuracoes_gramaturas(id),
    UNIQUE KEY unique_produto (loja, codigo_produto)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bobinas (Recipiente físico com o produto)
CREATE TABLE IF NOT EXISTS bobinas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    produto_id INT NOT NULL,
    id_interno VARCHAR(100) NOT NULL UNIQUE COMMENT 'Identificação única da bobina',
    metragem_inicial DECIMAL(10,2) NOT NULL COMMENT 'em metros',
    metragem_atual DECIMAL(10,2) NOT NULL COMMENT 'em metros',
    locacao VARCHAR(13) NOT NULL COMMENT 'Formato: 0000-XXXX-0000',
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

-- Ordens de Corte
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

-- Itens da Ordem de Corte
CREATE TABLE IF NOT EXISTS itens_ordem_corte (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ordem_corte_id INT NOT NULL,
    bobina_id INT NOT NULL,
    produto_id INT NOT NULL COMMENT 'Referência para consultas',
    metragem_cortada DECIMAL(10,2) NOT NULL COMMENT 'em metros',
    data_corte TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    observacoes TEXT,
    FOREIGN KEY (ordem_corte_id) REFERENCES ordens_corte(id) ON DELETE CASCADE,
    FOREIGN KEY (bobina_id) REFERENCES bobinas(id),
    FOREIGN KEY (produto_id) REFERENCES produtos(id),
    INDEX idx_ordem (ordem_corte_id),
    INDEX idx_bobina (bobina_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- DADOS INICIAIS PARA TESTE
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
-- VIEWS ÚTEIS
-- ============================================

-- View: Estoque agrupado por produto
CREATE OR REPLACE VIEW vw_estoque_produtos AS
SELECT 
    p.id AS produto_id,
    p.loja,
    p.codigo_produto,
    c.nome_cor AS cor,
    g.gramatura,
    p.fabricante,
    p.largura_sem_costura,
    p.tipo_bainha,
    p.largura_final,
    COUNT(b.id) AS total_bobinas,
    COUNT(CASE WHEN b.status = 'Disponível' THEN 1 END) AS bobinas_disponiveis,
    COALESCE(SUM(b.metragem_atual), 0) AS metragem_total,
    COALESCE(SUM(CASE WHEN b.status = 'Disponível' THEN b.metragem_atual ELSE 0 END), 0) AS metragem_disponivel
FROM produtos p
LEFT JOIN configuracoes_cores c ON p.cor_id = c.id
LEFT JOIN configuracoes_gramaturas g ON p.gramatura_id = g.id
LEFT JOIN bobinas b ON p.id = b.produto_id
WHERE p.ativo = TRUE
GROUP BY p.id, p.loja, p.codigo_produto, c.nome_cor, g.gramatura, 
         p.fabricante, p.largura_sem_costura, p.tipo_bainha, p.largura_final;

-- View: Detalhes completos de bobinas
CREATE OR REPLACE VIEW vw_bobinas_detalhadas AS
SELECT 
    b.id,
    b.id_interno,
    b.metragem_inicial,
    b.metragem_atual,
    b.locacao,
    b.status,
    b.data_entrada,
    b.observacoes,
    p.id AS produto_id,
    p.loja,
    p.codigo_produto,
    c.nome_cor AS cor,
    g.gramatura,
    p.fabricante,
    p.tipo_bainha,
    p.largura_final,
    ROUND((b.metragem_inicial - b.metragem_atual), 2) AS metragem_utilizada,
    ROUND((b.metragem_atual / b.metragem_inicial * 100), 2) AS percentual_restante
FROM bobinas b
INNER JOIN produtos p ON b.produto_id = p.id
LEFT JOIN configuracoes_cores c ON p.cor_id = c.id
LEFT JOIN configuracoes_gramaturas g ON p.gramatura_id = g.id;

-- ============================================
-- PROCEDURES ÚTEIS
-- ============================================

-- Procedure: Gerar próximo número de ordem
DELIMITER //
CREATE PROCEDURE IF NOT EXISTS sp_gerar_numero_ordem(OUT novo_numero VARCHAR(50))
BEGIN
    DECLARE ultimo_id INT;
    DECLARE ano_atual VARCHAR(4);
    
    SET ano_atual = YEAR(CURDATE());
    
    SELECT COALESCE(MAX(id), 0) + 1 INTO ultimo_id FROM ordens_corte;
    
    SET novo_numero = CONCAT('OC-', ano_atual, '-', LPAD(ultimo_id, 6, '0'));
END //
DELIMITER ;

-- ============================================
-- TRIGGERS
-- ============================================

-- Trigger: Atualizar status da bobina para 'Vazia' quando metragem chegar a zero
DELIMITER //
CREATE TRIGGER IF NOT EXISTS trg_bobina_vazia
BEFORE UPDATE ON bobinas
FOR EACH ROW
BEGIN
    IF NEW.metragem_atual <= 0 THEN
        SET NEW.status = 'Vazia';
        SET NEW.metragem_atual = 0;
    END IF;
END //
DELIMITER ;

-- ============================================
-- FIM DO SCRIPT
-- ============================================
