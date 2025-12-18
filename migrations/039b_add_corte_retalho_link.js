/**
 * Migration 039: Adiciona campos para vincular cortes e retalhos
 * 
 * Quando um PDC volta para planejamento, cortes realizados viram retalhos.
 * Esta migration adiciona os campos para rastrear essa conversão.
 */

exports.up = async function(db) {
    console.log('🔗 Migration 039: Adicionando vínculo corte ↔ retalho...');
    
    // 1. Adicionar campo origem_corte_id em retalhos (retalho gerado a partir de um corte)
    try {
        const [cols] = await db.query(`
            SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'retalhos' 
            AND COLUMN_NAME = 'origem_corte_id'
        `);
        
        if (cols.length === 0) {
            await db.query(`
                ALTER TABLE retalhos 
                ADD COLUMN origem_corte_id INT NULL 
                COMMENT 'ID do corte que originou este retalho (quando PDC é revertido)'
            `);
            console.log('  ✅ Coluna retalhos.origem_corte_id adicionada');
        } else {
            console.log('  ⏭️  Coluna retalhos.origem_corte_id já existe');
        }
    } catch (err) {
        console.log('  ⚠️  Erro em retalhos.origem_corte_id:', err.message);
    }
    
    // 2. Adicionar campo retalho_gerado_id em cortes_realizados (quando corte vira retalho)
    try {
        const [cols] = await db.query(`
            SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'cortes_realizados' 
            AND COLUMN_NAME = 'retalho_gerado_id'
        `);
        
        if (cols.length === 0) {
            await db.query(`
                ALTER TABLE cortes_realizados 
                ADD COLUMN retalho_gerado_id INT NULL 
                COMMENT 'ID do retalho gerado quando PDC é revertido'
            `);
            console.log('  ✅ Coluna cortes_realizados.retalho_gerado_id adicionada');
        } else {
            console.log('  ⏭️  Coluna cortes_realizados.retalho_gerado_id já existe');
        }
    } catch (err) {
        console.log('  ⚠️  Erro em cortes_realizados.retalho_gerado_id:', err.message);
    }
    
    // 3. Adicionar novo status 'convertido_retalho' em cortes_realizados
    try {
        await db.query(`
            ALTER TABLE cortes_realizados 
            MODIFY COLUMN status ENUM('em_andamento', 'concluido', 'cancelado', 'convertido_retalho') 
            DEFAULT 'em_andamento'
        `);
        console.log('  ✅ Status convertido_retalho adicionado em cortes_realizados');
    } catch (err) {
        if (err.message.includes('Data truncated')) {
            console.log('  ⏭️  Status convertido_retalho já existe');
        } else {
            console.log('  ⚠️  Erro ao modificar status:', err.message);
        }
    }
    
    console.log('✅ Migration 039 concluída!');
};

exports.down = async function(db) {
    console.log('🔄 Migration 039 DOWN: Removendo vínculo corte ↔ retalho...');
    
    try {
        await db.query(`ALTER TABLE retalhos DROP COLUMN IF EXISTS origem_corte_id`);
        await db.query(`ALTER TABLE cortes_realizados DROP COLUMN IF EXISTS retalho_gerado_id`);
        await db.query(`
            ALTER TABLE cortes_realizados 
            MODIFY COLUMN status ENUM('em_andamento', 'concluido', 'cancelado') 
            DEFAULT 'em_andamento'
        `);
        console.log('  ✅ Colunas removidas');
    } catch (err) {
        console.log('  ⚠️  Erro no rollback:', err.message);
    }
};
