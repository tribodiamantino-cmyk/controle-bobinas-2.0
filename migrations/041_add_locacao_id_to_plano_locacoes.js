/**
 * Migration para adicionar coluna locacao_id na tabela plano_locacoes
 */
exports.up = async function(db) {
    console.log('📍 Adicionando coluna locacao_id em plano_locacoes...');
    
    try {
        // Verifica se a coluna já existe
        const [columns] = await db.query(`
            SELECT COLUMN_NAME 
            FROM information_schema.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'plano_locacoes'
            AND COLUMN_NAME = 'locacao_id'
        `);
        
        if (columns.length === 0) {
            await db.query(`
                ALTER TABLE plano_locacoes 
                ADD COLUMN locacao_id INT NULL AFTER plano_corte_id
            `);
            console.log('✅ Coluna locacao_id adicionada!');
        } else {
            console.log('✓ Coluna locacao_id já existe');
        }
    } catch (error) {
        console.error('❌ Erro ao adicionar locacao_id:', error.message);
        // Não falha se der erro (tabela pode não existir ainda)
    }
};

exports.down = async function(db) {
    console.log('⚠️ Down: Coluna locacao_id não será removida');
};
