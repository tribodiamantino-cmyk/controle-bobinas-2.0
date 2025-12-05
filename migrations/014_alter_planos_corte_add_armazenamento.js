exports.up = async function(db) {
    console.log('📋 Alterando tabela planos_corte - adicionando campos de armazenamento...');
    
    // Verificar se as colunas já existem antes de adicionar
    const [columns] = await db.query(`
        SHOW COLUMNS FROM planos_corte LIKE 'locacoes_validadas'
    `);
    
    if (columns.length === 0) {
        await db.query(`
            ALTER TABLE planos_corte
            ADD COLUMN locacoes_validadas BOOLEAN DEFAULT FALSE COMMENT 'Se operador escaneou QR das locações',
            ADD COLUMN data_armazenamento TIMESTAMP NULL COMMENT 'Quando foi guardado',
            ADD COLUMN armazenado_por VARCHAR(100) NULL COMMENT 'Quem guardou',
            ADD COLUMN data_finalizacao TIMESTAMP NULL COMMENT 'Quando plano foi finalizado'
        `);
        console.log('✓ Colunas adicionadas à tabela planos_corte');
    } else {
        console.log('⏭️  Colunas já existem - pulando');
    }
};

exports.down = async function(db) {
    await db.query(`
        ALTER TABLE planos_corte
        DROP COLUMN IF EXISTS locacoes_validadas,
        DROP COLUMN IF EXISTS data_armazenamento,
        DROP COLUMN IF EXISTS armazenado_por,
        DROP COLUMN IF EXISTS data_finalizacao
    `);
    console.log('✓ Colunas removidas da tabela planos_corte');
};
