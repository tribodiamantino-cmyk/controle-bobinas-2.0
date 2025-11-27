const fs = require('fs');
const path = require('path');

/**
 * Migration para adicionar triggers de gerenciamento automático de reservas
 * 
 * Triggers criados:
 * - after_alocacao_delete: Libera reservas quando alocação é excluída
 * - after_alocacao_update: Gerencia troca de fonte (bobina/retalho) na alocação
 */
module.exports = {
    up: async (connection) => {
        console.log('⚙️  Aplicando migration: Triggers de Reservas');
        
        // Ler o arquivo SQL
        const sqlPath = path.join(__dirname, 'add_triggers_reservas.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');
        
        // Dividir em statements individuais (separados por DELIMITER)
        const statements = sql
            .split('DELIMITER $$')
            .filter(s => s.trim())
            .join('')
            .split('$$')
            .filter(s => s.trim() && !s.includes('DELIMITER'));
        
        // Executar cada statement
        for (const statement of statements) {
            const cleanStatement = statement.trim();
            if (cleanStatement && !cleanStatement.startsWith('--')) {
                await connection.query(cleanStatement);
            }
        }
        
        console.log('✅ Triggers criados com sucesso');
    },
    
    down: async (connection) => {
        console.log('⚙️  Revertendo migration: Triggers de Reservas');
        
        await connection.query('DROP TRIGGER IF EXISTS after_alocacao_delete');
        await connection.query('DROP TRIGGER IF EXISTS after_alocacao_update');
        
        console.log('✅ Triggers removidos com sucesso');
    }
};
