/**
 * Migration: Adicionar campo PLACA às bobinas
 * 
 * Campo PLACA armazena o código único do fabricante vinculado à garantia.
 * Características:
 * - Imutável após criação
 * - Exibido nas etiquetas de identificação
 * - Rastreável para garantia
 */

exports.up = async function(db) {
    console.log('🔧 Adicionando campo PLACA à tabela bobinas...');
    
    try {
        // Adicionar coluna placa (opcional inicialmente para bobinas existentes)
        await db.query(`
            ALTER TABLE bobinas 
            ADD COLUMN placa VARCHAR(100) DEFAULT NULL COMMENT 'Código único do fabricante (vinculado à garantia)'
        `);
        
        console.log('✅ Campo PLACA adicionado com sucesso!');
        
        // Adicionar índice para busca rápida por placa
        await db.query(`
            CREATE INDEX idx_bobinas_placa ON bobinas(placa)
        `);
        
        console.log('✅ Índice para PLACA criado!');
        
    } catch (error) {
        console.error('❌ Erro ao adicionar campo PLACA:', error.message);
        throw error;
    }
};

exports.down = async function(db) {
    console.log('🔧 Revertendo adição do campo PLACA...');
    
    try {
        // Remover índice
        await db.query(`DROP INDEX idx_bobinas_placa ON bobinas`);
        
        // Remover coluna
        await db.query(`ALTER TABLE bobinas DROP COLUMN placa`);
        
        console.log('✅ Campo PLACA removido com sucesso!');
    } catch (error) {
        console.error('❌ Erro ao remover campo PLACA:', error.message);
        throw error;
    }
};
