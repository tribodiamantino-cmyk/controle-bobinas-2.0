exports.up = async function(db) {
    console.log('📦 Criando tabela locacoes...');
    
    await db.query(`
        CREATE TABLE IF NOT EXISTS locacoes (
            id INT AUTO_INCREMENT PRIMARY KEY,
            codigo_locacao VARCHAR(20) NOT NULL UNIQUE COMMENT 'Ex: A1-B2-C3',
            descricao VARCHAR(200) NULL,
            corredor VARCHAR(10) NULL COMMENT 'Ex: A',
            prateleira VARCHAR(10) NULL COMMENT 'Ex: 1',
            posicao VARCHAR(10) NULL COMMENT 'Ex: B2-C3',
            ativo BOOLEAN DEFAULT TRUE,
            data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_codigo (codigo_locacao)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    console.log('✓ Tabela locacoes criada com sucesso');
};

exports.down = async function(db) {
    await db.query('DROP TABLE IF EXISTS locacoes');
    console.log('✓ Tabela locacoes removida');
};
