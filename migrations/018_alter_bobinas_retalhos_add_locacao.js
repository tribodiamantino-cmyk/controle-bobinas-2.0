exports.up = async function(db) {
    console.log('🔗 Alterando tabelas bobinas e retalhos - adicionando FK para locacoes...');
    
    // Verificar se a coluna já existe em bobinas
    const [bobinasColumns] = await db.query(`
        SHOW COLUMNS FROM bobinas LIKE 'locacao_id'
    `);
    
    if (bobinasColumns.length === 0) {
        await db.query(`
            ALTER TABLE bobinas
            ADD COLUMN locacao_id INT NULL COMMENT 'FK para tabela locacoes',
            ADD FOREIGN KEY (locacao_id) REFERENCES locacoes(id)
        `);
        console.log('✓ Coluna locacao_id adicionada à tabela bobinas');
    } else {
        console.log('⏭️  Coluna locacao_id já existe em bobinas - pulando');
    }
    
    // Verificar se a coluna já existe em retalhos
    const [retalhosColumns] = await db.query(`
        SHOW COLUMNS FROM retalhos LIKE 'locacao_id'
    `);
    
    if (retalhosColumns.length === 0) {
        await db.query(`
            ALTER TABLE retalhos
            ADD COLUMN locacao_id INT NULL COMMENT 'FK para tabela locacoes',
            ADD FOREIGN KEY (locacao_id) REFERENCES locacoes(id)
        `);
        console.log('✓ Coluna locacao_id adicionada à tabela retalhos');
    } else {
        console.log('⏭️  Coluna locacao_id já existe em retalhos - pulando');
    }
};

exports.down = async function(db) {
    // Remover FKs primeiro, depois colunas
    await db.query(`
        ALTER TABLE bobinas
        DROP FOREIGN KEY IF EXISTS bobinas_ibfk_locacao,
        DROP COLUMN IF EXISTS locacao_id
    `);
    
    await db.query(`
        ALTER TABLE retalhos
        DROP FOREIGN KEY IF EXISTS retalhos_ibfk_locacao,
        DROP COLUMN IF EXISTS locacao_id
    `);
    
    console.log('✓ Colunas locacao_id removidas de bobinas e retalhos');
};
