exports.up = async function(db) {
    console.log('📦 Criando tabela corte_locacoes...');
    
    await db.query(`
        CREATE TABLE IF NOT EXISTS corte_locacoes (
            id INT AUTO_INCREMENT PRIMARY KEY,
            corte_realizado_id INT NOT NULL,
            locacao_id INT NOT NULL,
            codigo_locacao VARCHAR(20) NOT NULL,
            
            -- Quantidade de cortes nesta localização
            quantidade_cortes INT DEFAULT 1 COMMENT 'Permite agrupar múltiplos cortes na mesma localização',
            
            -- Validação
            validada_qr BOOLEAN DEFAULT FALSE,
            data_scan TIMESTAMP NULL,
            
            -- Controle
            data_alocacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            usuario_alocacao VARCHAR(100) NULL,
            
            -- Permite remover alocação se necessário
            ativa BOOLEAN DEFAULT TRUE,
            data_remocao TIMESTAMP NULL,
            
            FOREIGN KEY (corte_realizado_id) REFERENCES cortes_realizados(id) ON DELETE CASCADE,
            FOREIGN KEY (locacao_id) REFERENCES locacoes(id),
            
            INDEX idx_corte (corte_realizado_id),
            INDEX idx_locacao (locacao_id),
            INDEX idx_ativa (ativa),
            
            UNIQUE KEY uk_corte_locacao_ativa (corte_realizado_id, locacao_id, ativa)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    console.log('✓ Tabela corte_locacoes criada com sucesso');
    console.log('ℹ️  Permite múltiplas localizações por corte para distribuição de estoque');
};

exports.down = async function(db) {
    await db.query('DROP TABLE IF EXISTS corte_locacoes');
    console.log('✓ Tabela corte_locacoes removida');
};
