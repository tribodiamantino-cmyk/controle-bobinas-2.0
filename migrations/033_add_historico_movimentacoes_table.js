/**
 * Migration: Criar tabela de histórico de movimentações
 * 
 * Registra todo o ciclo de vida de bobinas e retalhos por produto:
 * - Entradas de bobinas
 * - Cortes realizados
 * - Transformação em retalhos
 * - Exclusões
 */

exports.up = async function(db) {
    console.log('🔄 Criando tabela historico_movimentacoes...');
    
    await db.query(`
        CREATE TABLE IF NOT EXISTS historico_movimentacoes (
            id INT AUTO_INCREMENT PRIMARY KEY,
            produto_id INT NOT NULL,
            tipo_evento ENUM(
                'bobina_entrada',
                'bobina_corte', 
                'bobina_transformada',
                'bobina_excluida',
                'retalho_criado',
                'retalho_corte',
                'retalho_excluido'
            ) NOT NULL,
            entidade_tipo ENUM('bobina', 'retalho') NOT NULL,
            entidade_id INT NULL,
            entidade_codigo VARCHAR(50) NOT NULL,
            metragem DECIMAL(10,2) NULL,
            metragem_antes DECIMAL(10,2) NULL,
            metragem_depois DECIMAL(10,2) NULL,
            destino_tipo VARCHAR(50) NULL COMMENT 'plano_corte, cliente, etc',
            destino_id INT NULL,
            destino_descricao VARCHAR(255) NULL,
            observacao TEXT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            
            INDEX idx_produto (produto_id),
            INDEX idx_entidade (entidade_tipo, entidade_id),
            INDEX idx_tipo_evento (tipo_evento),
            INDEX idx_created_at (created_at),
            
            FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    console.log('✅ Tabela historico_movimentacoes criada com sucesso');
};

exports.down = async function(db) {
    await db.query('DROP TABLE IF EXISTS historico_movimentacoes');
    console.log('✅ Tabela historico_movimentacoes removida');
};
