exports.up = async function(db) {
    console.log('🔄 Alterando tabela alocacoes_corte - adicionando controle de cortes...');
    
    // Verificar se as colunas já existem
    const [columns] = await db.query(`
        SHOW COLUMNS FROM alocacoes_corte LIKE 'cortes_realizados'
    `);
    
    if (columns.length === 0) {
        await db.query(`
            ALTER TABLE alocacoes_corte
            ADD COLUMN cortes_realizados INT DEFAULT 0 COMMENT 'Quantos cortes já foram feitos',
            ADD COLUMN metragem_cortada DECIMAL(10,2) DEFAULT 0 COMMENT 'Total já cortado',
            ADD COLUMN metragem_restante DECIMAL(10,2) NULL COMMENT 'Quanto falta cortar',
            ADD COLUMN status_corte ENUM('pendente', 'em_andamento', 'concluido') DEFAULT 'pendente'
        `);
        console.log('✓ Colunas adicionadas à tabela alocacoes_corte');
    } else {
        console.log('⏭️  Colunas já existem - pulando');
    }
};

exports.down = async function(db) {
    await db.query(`
        ALTER TABLE alocacoes_corte
        DROP COLUMN IF EXISTS cortes_realizados,
        DROP COLUMN IF EXISTS metragem_cortada,
        DROP COLUMN IF EXISTS metragem_restante,
        DROP COLUMN IF EXISTS status_corte
    `);
    console.log('✓ Colunas removidas da tabela alocacoes_corte');
};
