/**
 * Migration para garantir que a tabela plano_locacoes existe
 * Esta tabela armazena as locações onde os cortes finalizados são guardados
 */
exports.up = async function(db) {
    console.log('📍 Garantindo que tabela plano_locacoes existe...');
    
    try {
        // Verifica se a tabela existe
        const [tables] = await db.query(`
            SELECT TABLE_NAME 
            FROM information_schema.TABLES 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'plano_locacoes'
        `);
        
        if (tables.length === 0) {
            console.log('⚠️ Tabela plano_locacoes não existe, criando...');
            
            await db.query(`
                CREATE TABLE plano_locacoes (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    plano_corte_id INT NOT NULL,
                    codigo_locacao VARCHAR(20) NOT NULL,
                    validada_qr BOOLEAN DEFAULT FALSE,
                    data_scan TIMESTAMP NULL,
                    ordem_scan INT NULL COMMENT 'Em qual ordem escaneou (1, 2, 3...)',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    
                    INDEX idx_plano (plano_corte_id),
                    INDEX idx_locacao (codigo_locacao)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            `);
            
            console.log('✅ Tabela plano_locacoes criada com sucesso!');
        } else {
            console.log('✓ Tabela plano_locacoes já existe');
        }
    } catch (error) {
        console.error('❌ Erro ao criar plano_locacoes:', error.message);
        throw error;
    }
};

exports.down = async function(db) {
    // Não remove a tabela no down para evitar perda de dados
    console.log('⚠️ Down: Tabela plano_locacoes não será removida');
};
