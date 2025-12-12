exports.up = async function(db) {
    console.log('🔍 Adicionando índices únicos em códigos QR...');
    
    // Verificar e adicionar índice em bobinas.codigo_interno
    try {
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
    } catch (err) {
        console.log('  ⚠️  Erro em bobinas.codigo_interno:', err.message);
    }
    
    // Verificar e adicionar índice em retalhos.codigo_retalho
    try {
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
    } catch (err) {
        console.log('  ⚠️  Erro em retalhos.codigo_retalho:', err.message);
    }
    
    // Verificar e adicionar índice em planos_corte.codigo_plano
    try {
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
    } catch (err) {
        console.log('  ⚠️  Erro em planos_corte.codigo_plano:', err.message);
    }
    
    // Verificar e adicionar índice em locacoes.codigo_locacao (se tabela existir)
    try {
        const [tables] = await db.query(`SHOW TABLES LIKE 'locacoes'`);
        if (tables.length > 0) {
            const [locacoesIndexes] = await db.query(`
                SHOW INDEX FROM locacoes WHERE Key_name = 'idx_codigo_locacao'
            `);
            
            if (locacoesIndexes.length === 0) {
                await db.query(`
                    ALTER TABLE locacoes 
                    ADD UNIQUE INDEX idx_codigo_locacao (codigo_locacao)
                `);
                console.log('  ✓ Índice único criado: locacoes.codigo_locacao');
            } else {
                console.log('  ⏭️  Índice já existe: locacoes.codigo_locacao');
            }
        } else {
            console.log('  ⏭️  Tabela locacoes não existe (será criada depois)');
        }
    } catch (err) {
        console.log('  ⚠️  Erro em locacoes:', err.message);
    }
    
    console.log('✅ Índices únicos em códigos QR verificados!');
};

exports.down = async function(db) {
    console.log('🗑️  Removendo índices de códigos QR...');
    
    await db.query(`ALTER TABLE bobinas DROP INDEX IF EXISTS idx_codigo_interno`);
    await db.query(`ALTER TABLE retalhos DROP INDEX IF EXISTS idx_codigo_retalho`);
    await db.query(`ALTER TABLE planos_corte DROP INDEX IF EXISTS idx_codigo_plano`);
    await db.query(`ALTER TABLE locacoes DROP INDEX IF EXISTS idx_codigo_localizacao`);
    
    console.log('✓ Índices removidos');
};
