-- ============================================-- ============================================

-- SISTEMA DE CONTROLE DE BOBINAS 2.0-- SISTEMA DE CONTROLE DE BOBINAS 2.0

-- Cortinave & BN - Lonas para Aviários-- Cortinave & BN - Lonas para Aviários

-- ============================================-- ============================================

-- 

-- ⚠️  ATENÇÃO: Este arquivo é apenas REFERÊNCIA!-- Configurações: Cores

-- CREATE TABLE IF NOT EXISTS configuracoes_cores (

-- A fonte de verdade do schema são as MIGRATIONS em /migrations/    id INT AUTO_INCREMENT PRIMARY KEY,

-- Este arquivo pode estar desatualizado.    nome_cor VARCHAR(100) NOT NULL,

--     codigo_hex VARCHAR(7) DEFAULT '#CCCCCC',

-- Para ver o schema atual do banco, consulte:    ativo BOOLEAN DEFAULT TRUE,

-- - docs/PADRONIZACAO_BANCO.md (documentação completa)    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

-- - migrations/*.js (alterações incrementais)    UNIQUE KEY unique_nome_cor (nome_cor)

--) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Última atualização manual: 18/12/2025 (v2.6.0)

-- ============================================-- Configurações: Gramaturas

CREATE TABLE IF NOT EXISTS configuracoes_gramaturas (

-- ============================================    id INT AUTO_INCREMENT PRIMARY KEY,

-- TABELAS DE CONFIGURAÇÃO    gramatura VARCHAR(50) NOT NULL,

-- ============================================    ativo BOOLEAN DEFAULT TRUE,

    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

CREATE TABLE IF NOT EXISTS configuracoes_cores (    UNIQUE KEY unique_gramatura (gramatura)

    id INT AUTO_INCREMENT PRIMARY KEY,) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

    nome_cor VARCHAR(100) NOT NULL,

    codigo_hex VARCHAR(7) DEFAULT '#CCCCCC',-- Produtos (Metro Linear do Tecido)

    ativo BOOLEAN DEFAULT TRUE,CREATE TABLE IF NOT EXISTS produtos (

    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,    id INT AUTO_INCREMENT PRIMARY KEY,

    UNIQUE KEY unique_nome_cor (nome_cor)    loja ENUM('Cortinave', 'BN') NOT NULL,

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;    codigo_produto VARCHAR(100) NOT NULL,

    cor_id INT NOT NULL,

CREATE TABLE IF NOT EXISTS configuracoes_gramaturas (    gramatura_id INT NOT NULL,

    id INT AUTO_INCREMENT PRIMARY KEY,    fabricante ENUM('Propex', 'Textiloeste') NOT NULL,

    gramatura VARCHAR(50) NOT NULL,    largura_sem_costura DECIMAL(10,2) NOT NULL COMMENT 'em cm',

    ativo BOOLEAN DEFAULT TRUE,    tipo_bainha ENUM('Cano/Cano', 'Cano/Arame', 'Arame/Arame') NOT NULL,

    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,    largura_final DECIMAL(10,2) NOT NULL COMMENT 'em cm, com bainha',

    UNIQUE KEY unique_gramatura (gramatura)    ativo BOOLEAN DEFAULT TRUE,

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    ultima_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

CREATE TABLE IF NOT EXISTS obras_padrao (    FOREIGN KEY (cor_id) REFERENCES configuracoes_cores(id),

    id INT AUTO_INCREMENT PRIMARY KEY,    FOREIGN KEY (gramatura_id) REFERENCES configuracoes_gramaturas(id),

    nome VARCHAR(200) NOT NULL,    UNIQUE KEY unique_produto (loja, codigo_produto)

    loja ENUM('Cortinave', 'BN') NOT NULL,) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

    ativo BOOLEAN DEFAULT TRUE,

    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,-- Bobinas (Recipiente físico com o produto)

    UNIQUE KEY unique_obra_loja (nome, loja)CREATE TABLE IF NOT EXISTS bobinas (

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;    id INT AUTO_INCREMENT PRIMARY KEY,

    produto_id INT NOT NULL,

-- ============================================    id_interno VARCHAR(100) NOT NULL UNIQUE COMMENT 'Identificação única da bobina',

-- TABELAS PRINCIPAIS    metragem_inicial DECIMAL(10,2) NOT NULL COMMENT 'em metros',

-- ============================================    metragem_atual DECIMAL(10,2) NOT NULL COMMENT 'em metros',

    locacao VARCHAR(13) NOT NULL COMMENT 'Formato: 0000-XXXX-0000',

-- Produtos (especificação abstrata do tecido)    status ENUM('Disponível', 'Em Uso', 'Vazia', 'Bloqueada') DEFAULT 'Disponível',

CREATE TABLE IF NOT EXISTS produtos (    data_entrada DATE NOT NULL,

    id INT AUTO_INCREMENT PRIMARY KEY,    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    loja ENUM('Cortinave', 'BN') NOT NULL,    ultima_movimentacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    codigo VARCHAR(20) NOT NULL COMMENT 'Formato: {LOJA}-{00000}',    observacoes TEXT,

    cor_id INT NOT NULL,    FOREIGN KEY (produto_id) REFERENCES produtos(id),

    gramatura_id INT NOT NULL,    INDEX idx_produto (produto_id),

    fabricante ENUM('Propex', 'Textiloeste') NOT NULL,    INDEX idx_status (status),

    largura_sem_costura DECIMAL(10,2) NOT NULL COMMENT 'em cm',    INDEX idx_locacao (locacao)

    tipo_bainha ENUM('Cano/Cano', 'Cano/Arame', 'Arame/Arame') NOT NULL,) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

    largura_final DECIMAL(10,2) NOT NULL COMMENT 'em cm, com bainha',

    ativo BOOLEAN DEFAULT TRUE,-- Ordens de Corte

    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,CREATE TABLE IF NOT EXISTS ordens_corte (

    ultima_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,    id INT AUTO_INCREMENT PRIMARY KEY,

    FOREIGN KEY (cor_id) REFERENCES configuracoes_cores(id),    numero_ordem VARCHAR(50) NOT NULL UNIQUE,

    FOREIGN KEY (gramatura_id) REFERENCES configuracoes_gramaturas(id),    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE KEY unique_codigo (codigo)    criado_por VARCHAR(100) DEFAULT 'Sistema',

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;    status ENUM('Pendente', 'Em Andamento', 'Concluída', 'Cancelada') DEFAULT 'Pendente',

    observacoes TEXT,

-- Bobinas (rolo físico com metragem)    data_conclusao TIMESTAMP NULL,

CREATE TABLE IF NOT EXISTS bobinas (    INDEX idx_numero_ordem (numero_ordem),

    id INT AUTO_INCREMENT PRIMARY KEY,    INDEX idx_status (status),

    produto_id INT NOT NULL,    INDEX idx_data_criacao (data_criacao)

    codigo_interno VARCHAR(20) NOT NULL UNIQUE COMMENT 'Formato: BOB-{LOJA}-{000000}',) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

    loja ENUM('Cortinave', 'BN') NOT NULL COMMENT 'Desnormalizado para performance',

    placa VARCHAR(100) DEFAULT NULL COMMENT 'Código do fabricante (garantia)',-- Itens da Ordem de Corte

    metragem_inicial DECIMAL(10,2) NOT NULL COMMENT 'em metros',CREATE TABLE IF NOT EXISTS itens_ordem_corte (

    metragem_atual DECIMAL(10,2) NOT NULL COMMENT 'em metros',    id INT AUTO_INCREMENT PRIMARY KEY,

    metragem_reservada DECIMAL(10,2) DEFAULT 0 COMMENT 'Reservada por planos em produção',    ordem_corte_id INT NOT NULL,

    locacao VARCHAR(12) DEFAULT NULL COMMENT 'Formato: 0000-X-0000',    bobina_id INT NOT NULL,

    status ENUM('Disponível', 'Em Uso', 'Bloqueada', 'Esgotado') DEFAULT 'Disponível',    produto_id INT NOT NULL COMMENT 'Referência para consultas',

    data_entrada DATE NOT NULL,    metragem_cortada DECIMAL(10,2) NOT NULL COMMENT 'em metros',

    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,    data_corte TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    ultima_movimentacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,    observacoes TEXT,

    observacoes TEXT,    FOREIGN KEY (ordem_corte_id) REFERENCES ordens_corte(id) ON DELETE CASCADE,

    FOREIGN KEY (produto_id) REFERENCES produtos(id),    FOREIGN KEY (bobina_id) REFERENCES bobinas(id),

    INDEX idx_produto (produto_id),    FOREIGN KEY (produto_id) REFERENCES produtos(id),

    INDEX idx_status (status),    INDEX idx_ordem (ordem_corte_id),

    INDEX idx_loja (loja),    INDEX idx_bobina (bobina_id)

    INDEX idx_codigo_interno (codigo_interno)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================

-- Retalhos (sobras de cortes)-- DADOS INICIAIS PARA TESTE

CREATE TABLE IF NOT EXISTS retalhos (-- ============================================

    id INT AUTO_INCREMENT PRIMARY KEY,

    produto_id INT NOT NULL,-- Cores Iniciais

    qr_code VARCHAR(20) NOT NULL UNIQUE COMMENT 'Formato: RET-{LOJA}-{000000}',INSERT INTO configuracoes_cores (nome_cor, codigo_hex) VALUES

    placa VARCHAR(100) DEFAULT NULL COMMENT 'Herdada da bobina origem',('Branco', '#FFFFFF'),

    metragem DECIMAL(10,2) NOT NULL COMMENT 'em metros',('Preto', '#000000'),

    metragem_reservada DECIMAL(10,2) DEFAULT 0,('Azul', '#0066CC'),

    locacao VARCHAR(12) DEFAULT NULL COMMENT 'Formato: 0000-X-0000',('Verde', '#00CC66'),

    status ENUM('Disponível', 'Reservado', 'Esgotado') DEFAULT 'Disponível',('Amarelo', '#FFCC00')

    bobina_origem_id INT DEFAULT NULL,ON DUPLICATE KEY UPDATE nome_cor=nome_cor;

    observacoes TEXT,

    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,-- Gramaturas Iniciais

    ultima_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,INSERT INTO configuracoes_gramaturas (gramatura) VALUES

    FOREIGN KEY (produto_id) REFERENCES produtos(id),('180 g/m²'),

    FOREIGN KEY (bobina_origem_id) REFERENCES bobinas(id),('200 g/m²'),

    INDEX idx_produto (produto_id),('220 g/m²'),

    INDEX idx_qr_code (qr_code)('250 g/m²')

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;ON DUPLICATE KEY UPDATE gramatura=gramatura;



-- Locações (posições no armazém)-- ============================================

CREATE TABLE IF NOT EXISTS locacoes (-- VIEWS ÚTEIS

    id INT AUTO_INCREMENT PRIMARY KEY,-- ============================================

    codigo VARCHAR(12) NOT NULL UNIQUE COMMENT 'Formato: 0000-X-0000',

    area VARCHAR(4) NOT NULL COMMENT 'Primeiro segmento: 0000',-- View: Estoque agrupado por produto

    corredor VARCHAR(1) NOT NULL COMMENT 'Segundo segmento: A-Z',CREATE OR REPLACE VIEW vw_estoque_produtos AS

    posicao VARCHAR(4) NOT NULL COMMENT 'Terceiro segmento: 0000',SELECT 

    loja ENUM('Cortinave', 'BN') NOT NULL,    p.id AS produto_id,

    descricao VARCHAR(200) DEFAULT NULL,    p.loja,

    ativo BOOLEAN DEFAULT TRUE,    p.codigo_produto,

    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,    c.nome_cor AS cor,

    INDEX idx_loja (loja),    g.gramatura,

    INDEX idx_codigo (codigo)    p.fabricante,

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;    p.largura_sem_costura,

    p.tipo_bainha,

-- ============================================    p.largura_final,

-- TABELAS DE PLANOS DE CORTE    COUNT(b.id) AS total_bobinas,

-- ============================================    COUNT(CASE WHEN b.status = 'Disponível' THEN 1 END) AS bobinas_disponiveis,

    COALESCE(SUM(b.metragem_atual), 0) AS metragem_total,

-- Planos de Corte (ordens de produção)    COALESCE(SUM(CASE WHEN b.status = 'Disponível' THEN b.metragem_atual ELSE 0 END), 0) AS metragem_disponivel

CREATE TABLE IF NOT EXISTS planos_corte (FROM produtos p

    id INT AUTO_INCREMENT PRIMARY KEY,LEFT JOIN configuracoes_cores c ON p.cor_id = c.id

    codigo VARCHAR(20) NOT NULL UNIQUE COMMENT 'Formato: PDC-{LOJA}-{000}',LEFT JOIN configuracoes_gramaturas g ON p.gramatura_id = g.id

    loja ENUM('Cortinave', 'BN') NOT NULL,LEFT JOIN bobinas b ON p.id = b.produto_id

    obra VARCHAR(200) DEFAULT NULL,WHERE p.ativo = TRUE

    observacoes TEXT,GROUP BY p.id, p.loja, p.codigo_produto, c.nome_cor, g.gramatura, 

    status ENUM('planejamento', 'em_producao', 'finalizado', 'entregue', 'arquivado', 'cancelado') DEFAULT 'planejamento',         p.fabricante, p.largura_sem_costura, p.tipo_bainha, p.largura_final;

    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,-- View: Detalhes completos de bobinas

    INDEX idx_status (status),CREATE OR REPLACE VIEW vw_bobinas_detalhadas AS

    INDEX idx_loja (loja)SELECT 

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;    b.id,

    b.id_interno,

-- Itens do Plano de Corte (o que cortar)    b.metragem_inicial,

CREATE TABLE IF NOT EXISTS itens_plano_corte (    b.metragem_atual,

    id INT AUTO_INCREMENT PRIMARY KEY,    b.locacao,

    plano_corte_id INT NOT NULL,    b.status,

    produto_id INT NOT NULL,    b.data_entrada,

    metragem DECIMAL(10,2) NOT NULL,    b.observacoes,

    observacoes TEXT,    p.id AS produto_id,

    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,    p.loja,

    FOREIGN KEY (plano_corte_id) REFERENCES planos_corte(id) ON DELETE CASCADE,    p.codigo_produto,

    FOREIGN KEY (produto_id) REFERENCES produtos(id),    c.nome_cor AS cor,

    INDEX idx_plano (plano_corte_id)    g.gramatura,

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;    p.fabricante,

    p.tipo_bainha,

-- Alocações de Corte (de onde cortar)    p.largura_final,

CREATE TABLE IF NOT EXISTS alocacoes_corte (    ROUND((b.metragem_inicial - b.metragem_atual), 2) AS metragem_utilizada,

    id INT AUTO_INCREMENT PRIMARY KEY,    ROUND((b.metragem_atual / b.metragem_inicial * 100), 2) AS percentual_restante

    item_plano_corte_id INT NOT NULL,FROM bobinas b

    tipo_origem ENUM('bobina', 'retalho') NOT NULL,INNER JOIN produtos p ON b.produto_id = p.id

    bobina_id INT DEFAULT NULL,LEFT JOIN configuracoes_cores c ON p.cor_id = c.id

    retalho_id INT DEFAULT NULL,LEFT JOIN configuracoes_gramaturas g ON p.gramatura_id = g.id;

    metragem_alocada DECIMAL(10,2) NOT NULL,

    status ENUM('pendente', 'cortado') DEFAULT 'pendente',-- ============================================

    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,-- PROCEDURES ÚTEIS

    FOREIGN KEY (item_plano_corte_id) REFERENCES itens_plano_corte(id) ON DELETE CASCADE,-- ============================================

    FOREIGN KEY (bobina_id) REFERENCES bobinas(id) ON DELETE CASCADE,

    FOREIGN KEY (retalho_id) REFERENCES retalhos(id) ON DELETE CASCADE,-- Procedure: Gerar próximo número de ordem

    INDEX idx_item (item_plano_corte_id)DELIMITER //

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;CREATE PROCEDURE IF NOT EXISTS sp_gerar_numero_ordem(OUT novo_numero VARCHAR(50))

BEGIN

-- Cortes Realizados (cortes feitos com QR e fotos)    DECLARE ultimo_id INT;

CREATE TABLE IF NOT EXISTS cortes_realizados (    DECLARE ano_atual VARCHAR(4);

    id INT AUTO_INCREMENT PRIMARY KEY,    

    codigo VARCHAR(20) NOT NULL UNIQUE COMMENT 'Formato: COR-{LOJA}-{PDC}-{00}',    SET ano_atual = YEAR(CURDATE());

    plano_corte_id INT NOT NULL,    

    item_plano_corte_id INT DEFAULT NULL,    SELECT COALESCE(MAX(id), 0) + 1 INTO ultimo_id FROM ordens_corte;

    alocacao_id INT DEFAULT NULL,    

    metragem_cortada DECIMAL(10,2) NOT NULL,    SET novo_numero = CONCAT('OC-', ano_atual, '-', LPAD(ultimo_id, 6, '0'));

    bobina_origem_id INT DEFAULT NULL,END //

    retalho_origem_id INT DEFAULT NULL,DELIMITER ;

    placa_origem VARCHAR(100) DEFAULT NULL,

    codigo_origem VARCHAR(50) DEFAULT NULL,-- ============================================

    foto_medidor_url VARCHAR(500) DEFAULT NULL,-- TRIGGERS

    data_corte TIMESTAMP DEFAULT CURRENT_TIMESTAMP,-- ============================================

    FOREIGN KEY (plano_corte_id) REFERENCES planos_corte(id) ON DELETE CASCADE,

    FOREIGN KEY (item_plano_corte_id) REFERENCES itens_plano_corte(id) ON DELETE SET NULL,-- Trigger: Atualizar status da bobina para 'Vazia' quando metragem chegar a zero

    FOREIGN KEY (alocacao_id) REFERENCES alocacoes_corte(id) ON DELETE SET NULL,DELIMITER //

    INDEX idx_plano (plano_corte_id),CREATE TRIGGER IF NOT EXISTS trg_bobina_vazia

    INDEX idx_codigo (codigo)BEFORE UPDATE ON bobinas

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;FOR EACH ROW

BEGIN

-- Locações de Plano (onde planos finalizados estão armazenados)    IF NEW.metragem_atual <= 0 THEN

CREATE TABLE IF NOT EXISTS plano_locacoes (        SET NEW.status = 'Vazia';

    id INT AUTO_INCREMENT PRIMARY KEY,        SET NEW.metragem_atual = 0;

    plano_corte_id INT NOT NULL,    END IF;

    locacao_id INT DEFAULT NULL,END //

    locacao_codigo VARCHAR(12) DEFAULT NULL COMMENT 'Código legível: 0000-X-0000',DELIMITER ;

    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (plano_corte_id) REFERENCES planos_corte(id) ON DELETE CASCADE,-- ============================================

    FOREIGN KEY (locacao_id) REFERENCES locacoes(id) ON DELETE SET NULL,-- FIM DO SCRIPT

    INDEX idx_plano (plano_corte_id)-- ============================================

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABELAS DE CARREGAMENTO
-- ============================================

-- Carregamentos (processos de envio)
CREATE TABLE IF NOT EXISTS carregamentos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    codigo VARCHAR(20) NOT NULL UNIQUE COMMENT 'Formato: CAR-{ANO}-{00000}',
    plano_corte_id INT NOT NULL,
    status ENUM('em_andamento', 'finalizado', 'cancelado') DEFAULT 'em_andamento',
    total_cortes INT DEFAULT 0,
    cortes_validados INT DEFAULT 0,
    data_inicio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_finalizacao TIMESTAMP NULL,
    FOREIGN KEY (plano_corte_id) REFERENCES planos_corte(id) ON DELETE CASCADE,
    INDEX idx_plano (plano_corte_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Itens de Carregamento (auditoria de cortes validados)
CREATE TABLE IF NOT EXISTS carregamentos_itens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    carregamento_id INT NOT NULL,
    corte_realizado_id INT NOT NULL,
    codigo_escaneado VARCHAR(50) NOT NULL,
    validado BOOLEAN DEFAULT FALSE,
    data_validacao TIMESTAMP NULL,
    FOREIGN KEY (carregamento_id) REFERENCES carregamentos(id) ON DELETE CASCADE,
    FOREIGN KEY (corte_realizado_id) REFERENCES cortes_realizados(id) ON DELETE CASCADE,
    INDEX idx_carregamento (carregamento_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABELAS AUXILIARES
-- ============================================

-- Histórico de Movimentações
CREATE TABLE IF NOT EXISTS historico_movimentacoes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tipo_item ENUM('bobina', 'retalho', 'plano', 'carregamento') NOT NULL,
    item_id INT NOT NULL,
    tipo_movimentacao VARCHAR(50) NOT NULL,
    quantidade DECIMAL(10,2) DEFAULT NULL,
    observacoes TEXT,
    data_movimentacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_tipo_item (tipo_item, item_id),
    INDEX idx_data (data_movimentacao)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Fila de Impressão
CREATE TABLE IF NOT EXISTS fila_impressao (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tipo ENUM('bobina', 'retalho', 'corte', 'locacao') NOT NULL,
    item_id INT NOT NULL,
    codigo VARCHAR(50) NOT NULL,
    status ENUM('pendente', 'impresso', 'erro') DEFAULT 'pendente',
    tentativas INT DEFAULT 0,
    erro_msg TEXT,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_impressao TIMESTAMP NULL,
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Migrations (controle de versão do schema)
CREATE TABLE IF NOT EXISTS migrations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TRIGGERS DE RESERVA (gerenciados por migration 006)
-- ============================================
-- 
-- after_alocacao_delete: Libera reserva ao deletar alocação
-- after_alocacao_update: Ajusta reserva ao atualizar alocação
--
-- Ver: database/migrations/add_triggers_reservas.sql
-- ============================================

-- ============================================
-- FIM DO SCRIPT
-- ============================================
