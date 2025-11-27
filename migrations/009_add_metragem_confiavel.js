exports.up = async function(db) {
    // Adicionar flag de metragem confiável nos produtos
    await db.query(`
        ALTER TABLE produtos 
        ADD COLUMN metragem_confiavel BOOLEAN DEFAULT FALSE 
        COMMENT 'Indica se as medidas deste produto são precisas (fornecedor confiável)'
    `);

    console.log('✅ Migration 009: Campo metragem_confiavel adicionado aos produtos');
};

exports.down = async function(db) {
    await db.query(`ALTER TABLE produtos DROP COLUMN metragem_confiavel`);
    
    console.log('⏪ Migration 009: Campo metragem_confiavel removido');
};
