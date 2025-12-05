exports.up = async function(db) {
    console.log('✂️ Criando tabela cortes_realizados...');
    
    await db.query(`
        CREATE TABLE IF NOT EXISTS cortes_realizados (
            id INT AUTO_INCREMENT PRIMARY KEY,
            codigo_corte VARCHAR(30) NOT NULL UNIQUE COMMENT 'COR-2025-00001',
            
            -- Vinculação
            plano_corte_id INT NOT NULL,
            item_plano_corte_id INT NOT NULL,
            alocacao_corte_id INT NOT NULL,
            
            -- Origem do corte
            origem_tipo ENUM('bobina', 'retalho') NOT NULL,
            bobina_id INT NULL,
            retalho_id INT NULL,
            
            -- Dados do corte
            metragem_cortada DECIMAL(10,2) NOT NULL,
            produto_id INT NOT NULL,
            
            -- Validações (produção)
            bobina_validada_qr BOOLEAN DEFAULT FALSE COMMENT 'Escaneou QR da bobina origem',
            data_validacao_bobina TIMESTAMP NULL,
            
            foto_medidor_url VARCHAR(500) NULL COMMENT 'URL da foto do medidor',
            foto_medidor_timestamp TIMESTAMP NULL,
            
            -- Operador
            operador_nome VARCHAR(100) NULL,
            operador_id INT NULL COMMENT 'FK futura para tabela usuarios',
            
            -- Carregamento
            carregado BOOLEAN DEFAULT FALSE,
            carregado_por VARCHAR(100) NULL,
            data_carregamento TIMESTAMP NULL,
            carregamento_id INT NULL,
            
            -- Controle
            status ENUM('em_andamento', 'concluido', 'cancelado') DEFAULT 'em_andamento',
            data_corte TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            data_conclusao TIMESTAMP NULL,
            observacoes TEXT NULL,
            
            FOREIGN KEY (plano_corte_id) REFERENCES planos_corte(id),
            FOREIGN KEY (item_plano_corte_id) REFERENCES itens_plano_corte(id),
            FOREIGN KEY (alocacao_corte_id) REFERENCES alocacoes_corte(id),
            FOREIGN KEY (bobina_id) REFERENCES bobinas(id),
            FOREIGN KEY (retalho_id) REFERENCES retalhos(id),
            FOREIGN KEY (produto_id) REFERENCES produtos(id),
            
            INDEX idx_codigo (codigo_corte),
            INDEX idx_plano (plano_corte_id),
            INDEX idx_status (status),
            INDEX idx_carregado (carregado),
            INDEX idx_data (data_corte)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    console.log('✓ Tabela cortes_realizados criada com sucesso');
};

exports.down = async function(db) {
    await db.query('DROP TABLE IF EXISTS cortes_realizados');
    console.log('✓ Tabela cortes_realizados removida');
};
