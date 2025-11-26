exports.up = async function(db) {
    // Adicionar 'arquivado' ao ENUM de status
    await db.query(`
        ALTER TABLE planos_corte 
        MODIFY COLUMN status ENUM('planejamento', 'em_producao', 'finalizado', 'arquivado') 
        DEFAULT 'planejamento'
    `);
    
    console.log('✓ Status "arquivado" adicionado ao ENUM de planos_corte');
};

exports.down = async function(db) {
    // Remover 'arquivado' do ENUM
    await db.query(`
        ALTER TABLE planos_corte 
        MODIFY COLUMN status ENUM('planejamento', 'em_producao', 'finalizado') 
        DEFAULT 'planejamento'
    `);
    
    console.log('✓ Status "arquivado" removido do ENUM de planos_corte');
};
