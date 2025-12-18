/**
 * Migration 043: Adicionar status 'entregue' aos planos de corte
 * 
 * Fluxo: pendente → em_producao → finalizado → entregue → (arquivado futuro)
 * 
 * Quando um carregamento é finalizado, o PDC associado vai para 'entregue'
 */

exports.up = async function(db) {
    try {
        // Alterar ENUM para incluir 'entregue'
        await db.query(`
            ALTER TABLE planos_corte 
            MODIFY COLUMN status ENUM('rascunho', 'pendente', 'em_producao', 'finalizado', 'entregue', 'cancelado') 
            DEFAULT 'pendente'
        `);
        
        console.log('✅ Migration 043: Status "entregue" adicionado aos planos de corte');
    } catch (error) {
        // Se já existe, ignorar
        if (error.code === 'ER_DUPLICATED_VALUE_IN_TYPE') {
            console.log('⚠️ Migration 043: Status "entregue" já existe');
        } else {
            throw error;
        }
    }
};

exports.down = async function(db) {
    // Reverter status 'entregue' para 'finalizado' antes de remover
    await db.query(`
        UPDATE planos_corte SET status = 'finalizado' WHERE status = 'entregue'
    `);
    
    await db.query(`
        ALTER TABLE planos_corte 
        MODIFY COLUMN status ENUM('rascunho', 'pendente', 'em_producao', 'finalizado', 'cancelado') 
        DEFAULT 'pendente'
    `);
};
