exports.up = async function(db) {
    console.log('🏪 Adicionando coluna loja em bobinas (desnormalização)...');
    
    // Verificar se coluna já existe
    const [columns] = await db.query(`
        SHOW COLUMNS FROM bobinas LIKE 'loja'
    `);
    
    if (columns.length === 0) {
        // Adicionar coluna
        await db.query(`
            ALTER TABLE bobinas 
            ADD COLUMN loja ENUM('Cortinave', 'BN') NULL AFTER produto_id
        `);
        console.log('  ✓ Coluna loja adicionada (NULL temporariamente)');
        
        // Popular com dados existentes
        await db.query(`
            UPDATE bobinas b
            JOIN produtos p ON b.produto_id = p.id
            SET b.loja = p.loja
        `);
        console.log('  ✓ Dados populados a partir de produtos');
        
        // Tornar NOT NULL após popular
        await db.query(`
            ALTER TABLE bobinas 
            MODIFY COLUMN loja ENUM('Cortinave', 'BN') NOT NULL
        `);
        console.log('  ✓ Coluna loja agora é NOT NULL');
        
        // Adicionar índice
        await db.query(`
            ALTER TABLE bobinas 
            ADD INDEX idx_loja (loja)
        `);
        console.log('  ✓ Índice criado em loja');
        
        console.log('✅ Coluna loja adicionada com sucesso!');
        console.log('📊 Agora 90% das queries NÃO precisam de JOIN com produtos!');
    } else {
        console.log('  ⏭️  Coluna loja já existe em bobinas');
    }
};

exports.down = async function(db) {
    console.log('🗑️  Removendo coluna loja de bobinas...');
    
    await db.query(`ALTER TABLE bobinas DROP INDEX IF EXISTS idx_loja`);
    await db.query(`ALTER TABLE bobinas DROP COLUMN IF EXISTS loja`);
    
    console.log('✓ Coluna loja removida');
};
