exports.up = async function(db) {
    console.log('📋 Criando tabela carregamentos_itens...');
    
    await db.query(`
        CREATE TABLE IF NOT EXISTS carregamentos_itens (
            id INT AUTO_INCREMENT PRIMARY KEY,
            carregamento_id INT NOT NULL,
            corte_id INT NOT NULL COMMENT 'FK para cortes_realizados',
            
            ordem_scan INT NOT NULL COMMENT 'Em qual ordem foi escaneado',
            data_scan TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            
            FOREIGN KEY (carregamento_id) REFERENCES carregamentos(id),
            FOREIGN KEY (corte_id) REFERENCES cortes_realizados(id),
            INDEX idx_carregamento (carregamento_id),
            INDEX idx_corte (corte_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    console.log('✓ Tabela carregamentos_itens criada com sucesso');
};

exports.down = async function(db) {
    await db.query('DROP TABLE IF EXISTS carregamentos_itens');
    console.log('✓ Tabela carregamentos_itens removida');
};
