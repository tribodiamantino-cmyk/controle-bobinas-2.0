/**
 * Migration 044: Corrigir ENUM de status dos planos de corte
 * 
 * Corrige o ENUM para incluir 'entregue' mantendo todos os valores existentes
 */

exports.up = async function(db) {
    try {
        // Primeiro, verificar o ENUM atual
        const [columns] = await db.query(`
            SELECT COLUMN_TYPE 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'planos_corte' 
            AND COLUMN_NAME = 'status'
        `);
        
        console.log('📋 ENUM atual:', columns[0]?.COLUMN_TYPE);
        
        // Alterar ENUM para incluir 'entregue' (mantendo todos os valores existentes)
        await db.query(`
            ALTER TABLE planos_corte 
            MODIFY COLUMN status ENUM('planejamento', 'em_producao', 'finalizado', 'entregue', 'arquivado', 'cancelado') 
            DEFAULT 'planejamento'
        `);
        
        console.log('✅ Migration 044: ENUM de status corrigido com "entregue"');
        
        // Verificar novo ENUM
        const [newColumns] = await db.query(`
            SELECT COLUMN_TYPE 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'planos_corte' 
            AND COLUMN_NAME = 'status'
        `);
        
        console.log('📋 ENUM novo:', newColumns[0]?.COLUMN_TYPE);
        
    } catch (error) {
        console.error('❌ Erro na migration 044:', error.message);
        throw error;
    }
};

exports.down = async function(db) {
    // Reverter status 'entregue' para 'finalizado' antes de remover
    await db.query(`
        UPDATE planos_corte SET status = 'finalizado' WHERE status = 'entregue'
    `);
    
    await db.query(`
        ALTER TABLE planos_corte 
        MODIFY COLUMN status ENUM('planejamento', 'em_producao', 'finalizado', 'arquivado', 'cancelado') 
        DEFAULT 'planejamento'
    `);
};
