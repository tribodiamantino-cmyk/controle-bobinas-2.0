/**
 * Migration 022: Cria tabela de relação entre cortes e locações
 * 
 * Esta tabela permite rastrear onde cada corte está armazenado
 */

exports.up = async function(db) {
    console.log('📦 Criando tabela corte_locacoes...');
    
    try {
        await db.query(`
            CREATE TABLE IF NOT EXISTS corte_locacoes (
                id INT AUTO_INCREMENT PRIMARY KEY,
                corte_id INT NOT NULL COMMENT 'ID do corte realizado',
                locacao_id INT NOT NULL COMMENT 'ID da locação de armazenamento',
                data_armazenamento TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                data_retirada TIMESTAMP NULL,
                status ENUM('armazenado', 'retirado') DEFAULT 'armazenado',
                observacoes TEXT NULL,
                INDEX idx_corte (corte_id),
                INDEX idx_locacao (locacao_id),
                INDEX idx_status (status)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('✅ Tabela corte_locacoes criada');
    } catch (err) {
        if (err.code === 'ER_TABLE_EXISTS_ERROR') {
            console.log('⏭️  Tabela corte_locacoes já existe');
        } else {
            console.log('⚠️  Erro ao criar corte_locacoes:', err.message);
        }
    }
};

exports.down = async function(db) {
    await db.query('DROP TABLE IF EXISTS corte_locacoes');
    console.log('✅ Tabela corte_locacoes removida');
};
