exports.up = async function(db) {
    console.log('📦 Criando tabela carregamentos...');
    
    await db.query(`
        CREATE TABLE IF NOT EXISTS carregamentos (
            id INT AUTO_INCREMENT PRIMARY KEY,
            codigo_carregamento VARCHAR(30) NOT NULL UNIQUE COMMENT 'CAR-2025-00001',
            plano_corte_id INT NOT NULL,
            
            -- Status
            status ENUM('em_andamento', 'concluido', 'cancelado') DEFAULT 'em_andamento',
            
            -- Totais
            total_cortes INT NOT NULL COMMENT 'Total de cortes do plano',
            cortes_carregados INT DEFAULT 0,
            
            -- Operador
            operador_nome VARCHAR(100) NULL,
            operador_id INT NULL,
            
            -- Datas
            data_inicio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            data_conclusao TIMESTAMP NULL,
            
            -- Observações
            observacoes TEXT NULL,
            
            FOREIGN KEY (plano_corte_id) REFERENCES planos_corte(id),
            INDEX idx_plano (plano_corte_id),
            INDEX idx_status (status),
            INDEX idx_data (data_inicio)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    console.log('✓ Tabela carregamentos criada com sucesso');
};

exports.down = async function(db) {
    await db.query('DROP TABLE IF EXISTS carregamentos');
    console.log('✓ Tabela carregamentos removida');
};
