/**
 * Migration: Criar tabela fila_impressao
 * 
 * Sistema de fila de impressão de etiquetas
 * Permite emular impressão e preparar para servidor físico futuro
 */

exports.up = async function(db) {
    // Criar tabela fila_impressao
    await db.query(`
        CREATE TABLE IF NOT EXISTS fila_impressao (
            id INT AUTO_INCREMENT PRIMARY KEY,
            
            -- Tipo e referência da etiqueta
            tipo_etiqueta ENUM('bobina', 'retalho', 'corte', 'locacao') NOT NULL,
            entidade_id INT NOT NULL COMMENT 'ID da bobina, retalho, corte ou locação',
            
            -- Dados da etiqueta (JSON para flexibilidade)
            dados_etiqueta JSON NOT NULL COMMENT 'Dados renderizados da etiqueta',
            
            -- Código legível para exibição
            codigo_etiqueta VARCHAR(50) NOT NULL COMMENT 'Ex: BOB-PLA-000001, RET-CIA-000042',
            
            -- Status da impressão
            status ENUM('pendente', 'impressa', 'cancelada') DEFAULT 'pendente',
            
            -- Quantidade de cópias solicitadas
            quantidade INT DEFAULT 1,
            
            -- Controle de prioridade (menor = mais urgente)
            prioridade INT DEFAULT 5,
            
            -- Loja de origem
            loja ENUM('PLA', 'CIA') NOT NULL,
            
            -- Usuário que solicitou (para futuro)
            solicitado_por VARCHAR(100) DEFAULT NULL,
            
            -- Timestamps
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            impresso_em TIMESTAMP NULL DEFAULT NULL,
            
            -- Índices
            INDEX idx_status (status),
            INDEX idx_tipo_entidade (tipo_etiqueta, entidade_id),
            INDEX idx_loja_status (loja, status),
            INDEX idx_prioridade (prioridade, created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    console.log('✅ Tabela fila_impressao criada com sucesso');
};

exports.down = async function(db) {
    await db.query('DROP TABLE IF EXISTS fila_impressao');
    console.log('✅ Tabela fila_impressao removida');
};
