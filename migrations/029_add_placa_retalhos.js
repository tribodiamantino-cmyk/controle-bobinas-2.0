/**
 * Migration 029: Adiciona campo placa na tabela retalhos
 * 
 * Permite rastrear a placa de origem quando:
 * - Retalho é criado de uma bobina (herda placa da bobina)
 * - Corte é convertido em retalho (herda placa do corte)
 */

exports.up = async function(db) {
    console.log('🔄 Migration 029: Adicionando campo placa em retalhos...');
    
    // Verificar se coluna já existe
    const [columns] = await db.query(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'retalhos' 
        AND COLUMN_NAME = 'placa'
    `);
    
    if (columns.length > 0) {
        console.log('⚠️ Campo placa já existe em retalhos');
    } else {
        // Adicionar coluna placa (AFTER observacoes com S)
        await db.query(`
            ALTER TABLE retalhos 
            ADD COLUMN placa VARCHAR(50) NULL AFTER observacoes
        `);
        console.log('✅ Coluna placa adicionada');
    }
    
    // Verificar se coluna corte_origem_id existe
    const [columns2] = await db.query(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'retalhos' 
        AND COLUMN_NAME = 'corte_origem_id'
    `);
    
    if (columns2.length > 0) {
        console.log('⚠️ Campo corte_origem_id já existe em retalhos');
    } else {
        // Adicionar coluna para rastrear se retalho veio de corte convertido
        await db.query(`
            ALTER TABLE retalhos 
            ADD COLUMN corte_origem_id INT NULL AFTER placa
        `);
        console.log('✅ Coluna corte_origem_id adicionada');
    }
    
    // Criar índice para busca por placa
    try {
        await db.query(`CREATE INDEX idx_retalho_placa ON retalhos(placa)`);
        console.log('✅ Índice placa criado');
    } catch (err) {
        console.log('⚠️ Índice já existe:', err.message);
    }
    
    // Atualizar retalhos existentes com placa da bobina de origem (se tiver)
    const [updated] = await db.query(`
        UPDATE retalhos r
        INNER JOIN bobinas b ON r.bobina_origem_id = b.id
        SET r.placa = b.placa
        WHERE r.placa IS NULL AND b.placa IS NOT NULL
    `);
    
    if (updated.affectedRows > 0) {
        console.log(`✅ ${updated.affectedRows} retalhos atualizados com placa da bobina de origem`);
    }
    
    console.log('✅ Migration 029 concluída: campo placa em retalhos');
};

exports.down = async function(db) {
    console.log('🔄 Revertendo migration 029...');
    
    // Remover índice
    try {
        await db.query(`DROP INDEX idx_retalho_placa ON retalhos`);
    } catch (err) {
        console.log('⚠️ Erro ao remover índice:', err.message);
    }
    
    // Remover colunas
    await db.query(`
        ALTER TABLE retalhos 
        DROP COLUMN IF EXISTS placa,
        DROP COLUMN IF EXISTS corte_origem_id
    `);
    
    console.log('✅ Migration 029 revertida');
};
