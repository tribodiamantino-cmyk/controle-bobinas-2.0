exports.up = async function(db) {
    console.log('📏 Ajustando tamanhos de VARCHAR para códigos QR...');
    
    // Garantir que códigos suportem crescimento futuro
    await db.query(`
        ALTER TABLE bobinas 
        MODIFY COLUMN codigo_interno VARCHAR(50) NOT NULL
    `);
    console.log('  ✓ bobinas.codigo_interno → VARCHAR(50)');
    
    await db.query(`
        ALTER TABLE retalhos 
        MODIFY COLUMN codigo_retalho VARCHAR(50) NOT NULL
    `);
    console.log('  ✓ retalhos.codigo_retalho → VARCHAR(50)');
    
    await db.query(`
        ALTER TABLE planos_corte 
        MODIFY COLUMN codigo_plano VARCHAR(50) NOT NULL
    `);
    console.log('  ✓ planos_corte.codigo_plano → VARCHAR(50)');
    
    // Verificar locacoes
    await db.query(`
        ALTER TABLE locacoes 
        MODIFY COLUMN codigo_localizacao VARCHAR(50) NOT NULL
    `);
    console.log('  ✓ locacoes.codigo_localizacao → VARCHAR(50)');
    
    console.log('✅ Tamanhos de VARCHAR ajustados com sucesso!');
};

exports.down = async function(db) {
    // Não fazer rollback (pode truncar dados)
    console.log('⚠️  Rollback não recomendado - mantendo VARCHAR(50)');
};
