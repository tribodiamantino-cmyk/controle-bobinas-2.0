exports.up = async function(db) {
    console.log('🔍 Adicionando índices únicos em códigos QR...');
    
    // Verificar e adicionar índice em bobinas.codigo_interno
    const [bobinasIndexes] = await db.query(`
        SHOW INDEX FROM bobinas WHERE Key_name = 'idx_codigo_interno'
    `);
    
    if (bobinasIndexes.length === 0) {
        await db.query(`
            ALTER TABLE bobinas 
            ADD UNIQUE INDEX idx_codigo_interno (codigo_interno)
        `);
        console.log('  ✓ Índice único criado: bobinas.codigo_interno');
    } else {
        console.log('  ⏭️  Índice já existe: bobinas.codigo_interno');
    }
    
    // Verificar e adicionar índice em retalhos.codigo_retalho
    const [retalhosIndexes] = await db.query(`
        SHOW INDEX FROM retalhos WHERE Key_name = 'idx_codigo_retalho'
    `);
    
    if (retalhosIndexes.length === 0) {
        await db.query(`
            ALTER TABLE retalhos 
            ADD UNIQUE INDEX idx_codigo_retalho (codigo_retalho)
        `);
        console.log('  ✓ Índice único criado: retalhos.codigo_retalho');
    } else {
        console.log('  ⏭️  Índice já existe: retalhos.codigo_retalho');
    }
    
    // Verificar e adicionar índice em planos_corte.codigo_plano
    const [planosIndexes] = await db.query(`
        SHOW INDEX FROM planos_corte WHERE Key_name = 'idx_codigo_plano'
    `);
    
    if (planosIndexes.length === 0) {
        await db.query(`
            ALTER TABLE planos_corte 
            ADD UNIQUE INDEX idx_codigo_plano (codigo_plano)
        `);
        console.log('  ✓ Índice único criado: planos_corte.codigo_plano');
    } else {
        console.log('  ⏭️  Índice já existe: planos_corte.codigo_plano');
    }
    
    // Verificar e adicionar índice em locacoes.codigo_localizacao
    const [locacoesIndexes] = await db.query(`
        SHOW INDEX FROM locacoes WHERE Key_name = 'idx_codigo_localizacao'
    `);
    
    if (locacoesIndexes.length === 0) {
        await db.query(`
            ALTER TABLE locacoes 
            ADD UNIQUE INDEX idx_codigo_localizacao (codigo_localizacao)
        `);
        console.log('  ✓ Índice único criado: locacoes.codigo_localizacao');
    } else {
        console.log('  ⏭️  Índice já existe: locacoes.codigo_localizacao');
    }
    
    console.log('✅ Índices únicos em códigos QR criados!');
    console.log('📊 Buscas por código QR agora são O(1) - instantâneas!');
};

exports.down = async function(db) {
    console.log('🗑️  Removendo índices de códigos QR...');
    
    await db.query(`ALTER TABLE bobinas DROP INDEX IF EXISTS idx_codigo_interno`);
    await db.query(`ALTER TABLE retalhos DROP INDEX IF EXISTS idx_codigo_retalho`);
    await db.query(`ALTER TABLE planos_corte DROP INDEX IF EXISTS idx_codigo_plano`);
    await db.query(`ALTER TABLE locacoes DROP INDEX IF EXISTS idx_codigo_localizacao`);
    
    console.log('✓ Índices removidos');
};
