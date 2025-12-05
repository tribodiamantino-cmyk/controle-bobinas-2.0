exports.up = async function(db) {
    console.log('📍 Criando tabela plano_locacoes...');
    
    await db.query(`
        CREATE TABLE IF NOT EXISTS plano_locacoes (
            id INT AUTO_INCREMENT PRIMARY KEY,
            plano_corte_id INT NOT NULL,
            locacao_id INT NOT NULL,
            codigo_locacao VARCHAR(20) NOT NULL,
            
            -- Validação
            validada_qr BOOLEAN DEFAULT FALSE,
            data_scan TIMESTAMP NULL,
            ordem_scan INT NULL COMMENT 'Em qual ordem escaneou (1, 2, 3...)',
            
            FOREIGN KEY (plano_corte_id) REFERENCES planos_corte(id),
            FOREIGN KEY (locacao_id) REFERENCES locacoes(id),
            INDEX idx_plano (plano_corte_id),
            INDEX idx_locacao (locacao_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    console.log('✓ Tabela plano_locacoes criada com sucesso');
};

exports.down = async function(db) {
    await db.query('DROP TABLE IF EXISTS plano_locacoes');
    console.log('✓ Tabela plano_locacoes removida');
};
