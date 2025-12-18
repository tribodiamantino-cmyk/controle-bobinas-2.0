/**
 * Migration: Criar tabela fila_impressao_relatorios
 * 
 * Fila para impressão de relatórios A4 (romaneios, inventários, etc)
 */

exports.up = async function(db) {
    // Verificar se tabela já existe
    const [tables] = await db.query(`
        SELECT TABLE_NAME 
        FROM information_schema.TABLES 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'fila_impressao_relatorios'
    `);

    if (tables.length === 0) {
        await db.query(`
            CREATE TABLE fila_impressao_relatorios (
                id INT AUTO_INCREMENT PRIMARY KEY,
                tipo ENUM('carregamento', 'inventario', 'producao') NOT NULL,
                entidade_id INT NOT NULL,
                copias INT DEFAULT 2,
                loja ENUM('PLA', 'CIA') NOT NULL DEFAULT 'PLA',
                status ENUM('pendente', 'impresso', 'erro') DEFAULT 'pendente',
                tentativas INT DEFAULT 0,
                erro_msg TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                data_impressao TIMESTAMP NULL,
                
                INDEX idx_status (status),
                INDEX idx_loja (loja),
                INDEX idx_tipo_entidade (tipo, entidade_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('✅ Migration 046: Tabela fila_impressao_relatorios criada');
    } else {
        console.log('⏭️ Migration 046: Tabela fila_impressao_relatorios já existe');
    }
};

exports.down = async function(db) {
    await db.query('DROP TABLE IF EXISTS fila_impressao_relatorios');
    console.log('✅ Migration 046 revertida: Tabela fila_impressao_relatorios removida');
};
