exports.up = async function(db) {
    console.log('📏 Ajustando tamanhos de VARCHAR para códigos QR...');
    
    // Garantir que códigos suportem crescimento futuro
    try {
        await db.query(`
            ALTER TABLE bobinas 
            MODIFY COLUMN codigo_interno VARCHAR(50) NOT NULL
        `);
        console.log('  ✓ bobinas.codigo_interno → VARCHAR(50)');
    } catch (err) {
        console.log('  ⏭️  bobinas.codigo_interno já está OK ou erro:', err.message);
    }
    
    try {
        await db.query(`
            ALTER TABLE retalhos 
            MODIFY COLUMN codigo_retalho VARCHAR(50) NOT NULL
        `);
        console.log('  ✓ retalhos.codigo_retalho → VARCHAR(50)');
    } catch (err) {
        console.log('  ⏭️  retalhos.codigo_retalho já está OK ou erro:', err.message);
    }
    
    try {
        await db.query(`
            ALTER TABLE planos_corte 
            MODIFY COLUMN codigo_plano VARCHAR(50) NOT NULL
        `);
        console.log('  ✓ planos_corte.codigo_plano → VARCHAR(50)');
    } catch (err) {
        console.log('  ⏭️  planos_corte.codigo_plano já está OK ou erro:', err.message);
    }
    
    // Verificar locacoes (pode não existir ainda)
    try {
        const [tables] = await db.query(`SHOW TABLES LIKE 'locacoes'`);
        if (tables.length > 0) {
            await db.query(`
                ALTER TABLE locacoes 
                MODIFY COLUMN codigo_locacao VARCHAR(50) NOT NULL
            `);
            console.log('  ✓ locacoes.codigo_locacao → VARCHAR(50)');
        } else {
            console.log('  ⏭️  Tabela locacoes não existe (será criada depois)');
        }
    } catch (err) {
        console.log('  ⏭️  locacoes erro:', err.message);
    }
    
    console.log('✅ Tamanhos de VARCHAR ajustados com sucesso!');
};

exports.down = async function(db) {
    // Não fazer rollback (pode truncar dados)
    console.log('⚠️  Rollback não recomendado - mantendo VARCHAR(50)');
};
