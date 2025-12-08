exports.up = async function(db) {
    console.log('🔖 Adicionando campo qr_code à tabela retalhos...');
    
    // Verificar se a coluna já existe
    const [columns] = await db.query(`
        SHOW COLUMNS FROM retalhos LIKE 'qr_code'
    `);
    
    if (columns.length === 0) {
        await db.query(`
            ALTER TABLE retalhos
            ADD COLUMN qr_code VARCHAR(50) NULL UNIQUE COMMENT 'Código QR único do retalho (formato: R-{id})' AFTER codigo_retalho
        `);
        console.log('✓ Coluna qr_code adicionada à tabela retalhos');
        
        // Gerar QR codes para retalhos existentes
        const [retalhos] = await db.query('SELECT id FROM retalhos');
        
        for (const retalho of retalhos) {
            await db.query(
                'UPDATE retalhos SET qr_code = ? WHERE id = ?',
                [`R-${retalho.id}`, retalho.id]
            );
        }
        
        console.log(`✓ Gerados ${retalhos.length} códigos QR para retalhos existentes`);
    } else {
        console.log('⏭️  Coluna qr_code já existe em retalhos - pulando');
    }
};

exports.down = async function(db) {
    await db.query(`
        ALTER TABLE retalhos
        DROP COLUMN IF EXISTS qr_code
    `);
    console.log('✓ Coluna qr_code removida da tabela retalhos');
};
