/**
 * Migration FALLBACK: Adicionar campo PLACA (com proteção IF NOT EXISTS)
 * 
 * Esta migration é uma versão mais robusta da 027, com tratamento de erros
 * para o caso da coluna já existir ou falhar silenciosamente.
 */

exports.up = async function(db) {
    console.log('🔧 [FALLBACK] Verificando e adicionando campo PLACA...');
    
    try {
        // Verificar se a coluna já existe
        const [columns] = await db.query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'bobinas' 
            AND COLUMN_NAME = 'placa'
        `);
        
        if (columns.length > 0) {
            console.log('⏭️  Campo PLACA já existe, pulando...');
            return;
        }
        
        // Adicionar coluna placa
        await db.query(`
            ALTER TABLE bobinas 
            ADD COLUMN placa VARCHAR(100) DEFAULT NULL 
            COMMENT 'Código único do fabricante (vinculado à garantia)'
        `);
        
        console.log('✅ Campo PLACA adicionado com sucesso!');
        
        // Verificar se índice já existe
        const [indexes] = await db.query(`
            SELECT INDEX_NAME 
            FROM INFORMATION_SCHEMA.STATISTICS 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'bobinas' 
            AND INDEX_NAME = 'idx_bobinas_placa'
        `);
        
        if (indexes.length > 0) {
            console.log('⏭️  Índice idx_bobinas_placa já existe, pulando...');
            return;
        }
        
        // Adicionar índice para busca rápida por placa
        await db.query(`
            CREATE INDEX idx_bobinas_placa ON bobinas(placa)
        `);
        
        console.log('✅ Índice para PLACA criado!');
        
    } catch (error) {
        // Se der erro 1060 (coluna duplicada), ignorar
        if (error.code === 'ER_DUP_FIELDNAME') {
            console.log('⚠️  Campo PLACA já existe (erro ignorado)');
            return;
        }
        
        // Qualquer outro erro, logar mas não bloquear
        console.error('❌ Erro ao adicionar PLACA:', error.message);
        console.error('⚠️  Servidor continuará rodando mesmo com erro de migration');
    }
};

exports.down = async function(db) {
    console.log('🔧 Removendo campo PLACA...');
    
    try {
        await db.query(`
            DROP INDEX idx_bobinas_placa ON bobinas
        `);
        
        await db.query(`
            ALTER TABLE bobinas 
            DROP COLUMN placa
        `);
        
        console.log('✅ Campo PLACA removido!');
        
    } catch (error) {
        console.error('❌ Erro ao remover PLACA:', error.message);
    }
};
