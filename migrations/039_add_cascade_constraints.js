/**
 * Migration 039: Adiciona ON DELETE CASCADE nas constraints críticas
 * 
 * Problema: Foreign keys não têm CASCADE, causando erros ao excluir bobinas/retalhos
 * com dependências (alocacoes_corte, cortes_realizados)
 * 
 * Solução: Recriar constraints com ON DELETE CASCADE para exclusão automática em cascata
 */

exports.up = async function(db) {
    console.log('🔧 Migration 039: Adicionando CASCADE nas constraints...');
    
    try {
        // ====================================
        // 1. CORTES_REALIZADOS
        // ====================================
        
        // Verificar se constraint existe
        const [fkCortes] = await db.query(`
            SELECT CONSTRAINT_NAME 
            FROM information_schema.TABLE_CONSTRAINTS 
            WHERE TABLE_SCHEMA = DATABASE()
            AND TABLE_NAME = 'cortes_realizados'
            AND CONSTRAINT_NAME = 'cortes_realizados_ibfk_3'
        `);
        
        if (fkCortes.length > 0) {
            console.log('  📌 Removendo constraint antiga: cortes_realizados_ibfk_3');
            await db.query(`
                ALTER TABLE cortes_realizados 
                DROP FOREIGN KEY cortes_realizados_ibfk_3
            `);
        }
        
        // Adicionar nova constraint com CASCADE
        console.log('  ✅ Adicionando constraint com CASCADE: alocacao_corte_id');
        await db.query(`
            ALTER TABLE cortes_realizados
            ADD CONSTRAINT cortes_realizados_ibfk_3
            FOREIGN KEY (alocacao_corte_id) REFERENCES alocacoes_corte(id)
            ON DELETE CASCADE
            ON UPDATE CASCADE
        `);
        
        // ====================================
        // 2. ALOCACOES_CORTE → BOBINAS
        // ====================================
        
        const [fkAlocBobina] = await db.query(`
            SELECT CONSTRAINT_NAME 
            FROM information_schema.TABLE_CONSTRAINTS 
            WHERE TABLE_SCHEMA = DATABASE()
            AND TABLE_NAME = 'alocacoes_corte'
            AND CONSTRAINT_NAME = 'alocacoes_corte_ibfk_2'
        `);
        
        if (fkAlocBobina.length > 0) {
            console.log('  📌 Removendo constraint antiga: alocacoes_corte_ibfk_2 (bobina_id)');
            await db.query(`
                ALTER TABLE alocacoes_corte 
                DROP FOREIGN KEY alocacoes_corte_ibfk_2
            `);
        }
        
        console.log('  ✅ Adicionando constraint com CASCADE: bobina_id');
        await db.query(`
            ALTER TABLE alocacoes_corte
            ADD CONSTRAINT alocacoes_corte_ibfk_2
            FOREIGN KEY (bobina_id) REFERENCES bobinas(id)
            ON DELETE CASCADE
            ON UPDATE CASCADE
        `);
        
        // ====================================
        // 3. ALOCACOES_CORTE → RETALHOS
        // ====================================
        
        const [fkAlocRetalho] = await db.query(`
            SELECT CONSTRAINT_NAME 
            FROM information_schema.TABLE_CONSTRAINTS 
            WHERE TABLE_SCHEMA = DATABASE()
            AND TABLE_NAME = 'alocacoes_corte'
            AND CONSTRAINT_NAME = 'alocacoes_corte_ibfk_3'
        `);
        
        if (fkAlocRetalho.length > 0) {
            console.log('  📌 Removendo constraint antiga: alocacoes_corte_ibfk_3 (retalho_id)');
            await db.query(`
                ALTER TABLE alocacoes_corte 
                DROP FOREIGN KEY alocacoes_corte_ibfk_3
            `);
        }
        
        console.log('  ✅ Adicionando constraint com CASCADE: retalho_id');
        await db.query(`
            ALTER TABLE alocacoes_corte
            ADD CONSTRAINT alocacoes_corte_ibfk_3
            FOREIGN KEY (retalho_id) REFERENCES retalhos(id)
            ON DELETE CASCADE
            ON UPDATE CASCADE
        `);
        
        // ====================================
        // 4. RETALHOS → BOBINAS (origem)
        // ====================================
        
        const [fkRetalhosBobina] = await db.query(`
            SELECT CONSTRAINT_NAME 
            FROM information_schema.TABLE_CONSTRAINTS 
            WHERE TABLE_SCHEMA = DATABASE()
            AND TABLE_NAME = 'retalhos'
            AND CONSTRAINT_NAME = 'retalhos_ibfk_2'
        `);
        
        if (fkRetalhosBobina.length > 0) {
            console.log('  📌 Removendo constraint antiga: retalhos_ibfk_2 (bobina_origem_id)');
            await db.query(`
                ALTER TABLE retalhos 
                DROP FOREIGN KEY retalhos_ibfk_2
            `);
        }
        
        console.log('  ✅ Adicionando constraint com SET NULL: bobina_origem_id');
        await db.query(`
            ALTER TABLE retalhos
            ADD CONSTRAINT retalhos_ibfk_2
            FOREIGN KEY (bobina_origem_id) REFERENCES bobinas(id)
            ON DELETE SET NULL
            ON UPDATE CASCADE
        `);
        
        console.log('✅ Migration 039 concluída: Todas as constraints atualizadas com CASCADE');
        
    } catch (error) {
        console.error('❌ Erro na migration 039:', error);
        throw error;
    }
};

exports.down = async function(db) {
    console.log('⚠️  Migration 039: Rollback não recomendado (requer recriar todas as constraints)');
    
    // Não vamos implementar down pois exigiria saber exatamente
    // o estado anterior de cada constraint, e CASCADE é a melhor prática
};
