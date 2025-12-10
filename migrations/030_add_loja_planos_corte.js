// Migration 030: Adicionar campo loja aos planos de corte e obras_padrao
exports.up = async function(db) {
    console.log('🔄 Migration 030: Adicionando loja aos planos e templates...');
    
    // Adicionar loja ao planos_corte
    try {
        await db.query(`
            ALTER TABLE planos_corte 
            ADD COLUMN loja VARCHAR(50) DEFAULT 'Cortinave'
        `);
        console.log('✅ Coluna loja adicionada em planos_corte');
    } catch (err) {
        if (err.code === 'ER_DUP_FIELDNAME') {
            console.log('⚠️ Coluna loja já existe em planos_corte');
        } else {
            throw err;
        }
    }
    
    // Adicionar loja ao obras_padrao (templates)
    try {
        await db.query(`
            ALTER TABLE obras_padrao 
            ADD COLUMN loja VARCHAR(50) DEFAULT 'Cortinave'
        `);
        console.log('✅ Coluna loja adicionada em obras_padrao');
    } catch (err) {
        if (err.code === 'ER_DUP_FIELDNAME') {
            console.log('⚠️ Coluna loja já existe em obras_padrao');
        } else {
            throw err;
        }
    }
    
    console.log('✅ Migration 030 concluída');
};

exports.down = async function(db) {
    await db.query('ALTER TABLE planos_corte DROP COLUMN loja');
    await db.query('ALTER TABLE obras_padrao DROP COLUMN loja');
};
