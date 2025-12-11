/**
 * Migration 037: Corrige ENUM de status em bobinas
 * 
 * Adiciona 'Vazia' ao ENUM se não existir
 * O banco Railway pode ter ENUM diferente do schema.sql
 */

exports.up = async function(db) {
    console.log('🔄 Migration 037: Verificando/corrigindo ENUM de status em bobinas...');
    
    try {
        // Verificar qual é o ENUM atual
        const [columns] = await db.query(`
            SELECT COLUMN_TYPE 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'bobinas' 
            AND COLUMN_NAME = 'status'
        `);
        
        if (columns.length > 0) {
            console.log('📋 ENUM atual:', columns[0].COLUMN_TYPE);
        }
        
        // Alterar para ter todos os valores necessários
        await db.query(`
            ALTER TABLE bobinas 
            MODIFY COLUMN status ENUM('Disponível', 'Em Uso', 'Vazia', 'Bloqueada', 'Esgotado') 
            DEFAULT 'Disponível'
        `);
        
        console.log('✅ ENUM atualizado para incluir Vazia e Esgotado');
        
        // Verificar novo ENUM
        const [newColumns] = await db.query(`
            SELECT COLUMN_TYPE 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'bobinas' 
            AND COLUMN_NAME = 'status'
        `);
        
        if (newColumns.length > 0) {
            console.log('✅ Novo ENUM:', newColumns[0].COLUMN_TYPE);
        }
        
    } catch (error) {
        console.error('❌ Erro ao corrigir ENUM:', error.message);
        throw error;
    }
    
    console.log('✅ Migration 037 concluída');
};

exports.down = async function(db) {
    // Não faz rollback para evitar perda de dados
    console.log('⚠️ Migration 037: Rollback não implementado');
};
