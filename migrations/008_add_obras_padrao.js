exports.up = async function(db) {
    // Tabela de obras padrão (templates de planos de corte)
    await db.query(`
        CREATE TABLE IF NOT EXISTS obras_padrao (
            id INT AUTO_INCREMENT PRIMARY KEY,
            nome VARCHAR(255) NOT NULL,
            descricao TEXT,
            data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP,
            ultima_utilizacao DATETIME NULL,
            vezes_utilizada INT DEFAULT 0,
            criado_de_plano_id INT NULL,
            INDEX idx_nome (nome),
            FOREIGN KEY (criado_de_plano_id) REFERENCES planos_corte(id) ON DELETE SET NULL
        )
    `);

    // Tabela de itens das obras padrão
    await db.query(`
        CREATE TABLE IF NOT EXISTS obra_padrao_itens (
            id INT AUTO_INCREMENT PRIMARY KEY,
            obra_padrao_id INT NOT NULL,
            produto_id INT NOT NULL,
            metragem DECIMAL(10,2) NOT NULL,
            observacoes TEXT,
            ordem INT DEFAULT 0,
            FOREIGN KEY (obra_padrao_id) REFERENCES obras_padrao(id) ON DELETE CASCADE,
            FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE CASCADE,
            INDEX idx_obra_padrao (obra_padrao_id),
            INDEX idx_ordem (ordem)
        )
    `);

    // Adicionar campo opcional para vincular planos a obras padrão
    await db.query(`
        ALTER TABLE planos_corte 
        ADD COLUMN obra_padrao_id INT NULL,
        ADD FOREIGN KEY (obra_padrao_id) REFERENCES obras_padrao(id) ON DELETE SET NULL
    `);

    console.log('✅ Migration 008: Tabelas de obras padrão criadas com sucesso');
};

exports.down = async function(db) {
    await db.query(`ALTER TABLE planos_corte DROP FOREIGN KEY planos_corte_ibfk_1`);
    await db.query(`ALTER TABLE planos_corte DROP COLUMN obra_padrao_id`);
    await db.query(`DROP TABLE IF EXISTS obra_padrao_itens`);
    await db.query(`DROP TABLE IF EXISTS obras_padrao`);
    
    console.log('⏪ Migration 008: Tabelas de obras padrão removidas');
};
