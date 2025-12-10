/**
 * Migration: Tornar locacao_id opcional na tabela plano_locacoes
 * 
 * Permite inserir localizações apenas com código (digitado manualmente)
 * sem necessidade de ter um registro na tabela locacoes
 */
exports.up = async function(db) {
    console.log('📍 Tornando locacao_id opcional em plano_locacoes...');
    
    try {
        // Primeiro, remover a foreign key existente
        await db.query(`
            ALTER TABLE plano_locacoes 
            DROP FOREIGN KEY plano_locacoes_ibfk_2
        `);
        console.log('✓ Foreign key removida');
    } catch (err) {
        // FK pode não existir ou ter outro nome
        console.log('⚠️ Foreign key não encontrada (pode já ter sido removida):', err.message);
    }
    
    try {
        // Tornar locacao_id nullable
        await db.query(`
            ALTER TABLE plano_locacoes 
            MODIFY locacao_id INT NULL
        `);
        console.log('✓ locacao_id agora é opcional (nullable)');
    } catch (err) {
        console.log('⚠️ Erro ao modificar coluna:', err.message);
    }
    
    console.log('✓ Migration 031 concluída - plano_locacoes.locacao_id agora é opcional');
};

exports.down = async function(db) {
    // Reverter para NOT NULL (cuidado: pode falhar se houver NULLs)
    await db.query(`
        ALTER TABLE plano_locacoes 
        MODIFY locacao_id INT NOT NULL
    `);
    
    await db.query(`
        ALTER TABLE plano_locacoes 
        ADD CONSTRAINT plano_locacoes_ibfk_2 
        FOREIGN KEY (locacao_id) REFERENCES locacoes(id)
    `);
    
    console.log('✓ Revertido: locacao_id voltou a ser obrigatório');
};
