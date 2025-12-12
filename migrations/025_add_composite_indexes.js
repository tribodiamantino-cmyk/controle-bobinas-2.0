exports.up = async function(db) {
    console.log('⚡ Adicionando índices compostos para performance...');
    
    // Bobinas: produto + status (query mais comum: buscar disponíveis de um produto)
    try {
        const [idx1] = await db.query(`
            SHOW INDEX FROM bobinas WHERE Key_name = 'idx_produto_status'
        `);
        if (idx1.length === 0) {
            await db.query(`
                ALTER TABLE bobinas 
                ADD INDEX idx_produto_status (produto_id, status)
            `);
            console.log('  ✓ Índice composto: bobinas(produto_id, status)');
        } else {
            console.log('  ⏭️  Índice já existe: bobinas(produto_id, status)');
        }
    } catch (err) {
        console.log('  ⚠️  Erro em bobinas:', err.message);
    }
    
    // Bobinas: status + metragem_atual (disponíveis com material)
    try {
        const [idx2] = await db.query(`
            SHOW INDEX FROM bobinas WHERE Key_name = 'idx_status_metragem'
        `);
        if (idx2.length === 0) {
            await db.query(`
                ALTER TABLE bobinas 
                ADD INDEX idx_status_metragem (status, metragem_atual)
            `);
            console.log('  ✓ Índice composto: bobinas(status, metragem_atual)');
        } else {
            console.log('  ⏭️  Índice já existe: bobinas(status, metragem_atual)');
        }
    } catch (err) {
        console.log('  ⚠️  Erro em bobinas status_metragem:', err.message);
    }
    
    // Retalhos: produto + status
    try {
        const [idx3] = await db.query(`
            SHOW INDEX FROM retalhos WHERE Key_name = 'idx_produto_status'
        `);
        if (idx3.length === 0) {
            await db.query(`
                ALTER TABLE retalhos 
                ADD INDEX idx_produto_status (produto_id, status)
            `);
            console.log('  ✓ Índice composto: retalhos(produto_id, status)');
        } else {
            console.log('  ⏭️  Índice já existe: retalhos(produto_id, status)');
        }
    } catch (err) {
        console.log('  ⚠️  Erro em retalhos:', err.message);
    }
    
    // Cortes: plano + status (listar cortes de um plano por status)
    try {
        const [idx4] = await db.query(`
            SHOW INDEX FROM cortes_realizados WHERE Key_name = 'idx_plano_status'
        `);
        if (idx4.length === 0) {
            await db.query(`
                ALTER TABLE cortes_realizados 
                ADD INDEX idx_plano_status (plano_corte_id, status)
            `);
            console.log('  ✓ Índice composto: cortes_realizados(plano_corte_id, status)');
        } else {
            console.log('  ⏭️  Índice já existe: cortes_realizados(plano_corte_id, status)');
        }
    } catch (err) {
        console.log('  ⚠️  Erro em cortes_realizados:', err.message);
    }
    
    // Alocações: item plano + status (se coluna status existir)
    try {
        // Verificar se a coluna status existe
        const [cols] = await db.query(`
            SHOW COLUMNS FROM alocacoes_corte LIKE 'status'
        `);
        if (cols.length > 0) {
            const [idx5] = await db.query(`
                SHOW INDEX FROM alocacoes_corte WHERE Key_name = 'idx_item_status'
            `);
            if (idx5.length === 0) {
                await db.query(`
                    ALTER TABLE alocacoes_corte 
                    ADD INDEX idx_item_status (item_plano_corte_id, status)
                `);
                console.log('  ✓ Índice composto: alocacoes_corte(item_plano_corte_id, status)');
            } else {
                console.log('  ⏭️  Índice já existe: alocacoes_corte(item_plano_corte_id, status)');
            }
        } else {
            console.log('  ⏭️  Coluna status não existe em alocacoes_corte');
        }
    } catch (err) {
        console.log('  ⚠️  Erro em alocacoes_corte:', err.message);
    }
    
    console.log('✅ Índices compostos verificados!');
};

exports.down = async function(db) {
    console.log('🗑️  Removendo índices compostos...');
    
    await db.query(`ALTER TABLE bobinas DROP INDEX IF EXISTS idx_produto_status`);
    await db.query(`ALTER TABLE bobinas DROP INDEX IF EXISTS idx_status_metragem`);
    await db.query(`ALTER TABLE retalhos DROP INDEX IF EXISTS idx_produto_status`);
    await db.query(`ALTER TABLE cortes_realizados DROP INDEX IF EXISTS idx_plano_status`);
    await db.query(`ALTER TABLE alocacoes_corte DROP INDEX IF EXISTS idx_item_confirmacao`);
    
    console.log('✓ Índices compostos removidos');
};
