/**
 * Migration 035: Remove coluna metragem_confiavel da tabela produtos
 * 
 * Campo removido por não ser mais utilizado no sistema.
 * Anteriormente indicava se o produto tinha metragens precisas do fornecedor.
 */

exports.up = async function(db) {
    try {
        // Verificar se a coluna existe antes de tentar remover
        const [columns] = await db.query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'produtos' 
            AND COLUMN_NAME = 'metragem_confiavel'
        `);

        if (columns.length > 0) {
            await db.query(`
                ALTER TABLE produtos 
                DROP COLUMN metragem_confiavel
            `);
            console.log('✅ Migration 035: Coluna metragem_confiavel removida de produtos');
        } else {
            console.log('⚠️ Migration 035: Coluna metragem_confiavel já não existe');
        }
    } catch (error) {
        console.error('❌ Migration 035: Erro ao remover metragem_confiavel:', error.message);
        throw error;
    }
};

exports.down = async function(db) {
    try {
        // Recriar a coluna se necessário
        await db.query(`
            ALTER TABLE produtos 
            ADD COLUMN metragem_confiavel TINYINT(1) DEFAULT 0
        `);
        console.log('✅ Migration 035 DOWN: Coluna metragem_confiavel restaurada');
    } catch (error) {
        console.error('❌ Migration 035 DOWN: Erro:', error.message);
    }
};
