/**
 * Migration 028: Adiciona campos de origem nos cortes realizados
 * 
 * Permite rastrear de qual bobina/retalho veio cada corte (para garantia)
 * - bobina_origem_id: ID da bobina de origem (se cortou de bobina)
 * - retalho_origem_id: ID do retalho de origem (se cortou de retalho)
 * - placa_origem: Placa da bobina/retalho de origem
 * - codigo_origem: Código da bobina/retalho de origem (BOB-xxx ou RET-xxx)
 */

exports.up = async function(db) {
    console.log('🔄 Migration 028: Adicionando campos de origem em cortes_realizados...');
    
    // Verificar se coluna já existe
    const [columns] = await db.query(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'cortes_realizados' 
        AND COLUMN_NAME = 'bobina_origem_id'
    `);
    
    if (columns.length > 0) {
        console.log('⏭️  Campos de origem já existem em cortes_realizados');
        return;
    }
    
    // Adicionar colunas uma por uma para maior robustez
    const colunas = [
        { nome: 'bobina_origem_id', sql: 'ADD COLUMN bobina_origem_id INT NULL' },
        { nome: 'retalho_origem_id', sql: 'ADD COLUMN retalho_origem_id INT NULL' },
        { nome: 'placa_origem', sql: 'ADD COLUMN placa_origem VARCHAR(50) NULL' },
        { nome: 'codigo_origem', sql: 'ADD COLUMN codigo_origem VARCHAR(50) NULL' }
    ];
    
    for (const col of colunas) {
        try {
            await db.query(`ALTER TABLE cortes_realizados ${col.sql}`);
            console.log(`✅ Coluna ${col.nome} adicionada`);
        } catch (err) {
            if (err.code === 'ER_DUP_FIELDNAME') {
                console.log(`⏭️  Coluna ${col.nome} já existe`);
            } else {
                console.log(`⚠️  Erro em ${col.nome}:`, err.message);
            }
        }
    }
    
    // Criar índice para consultas de garantia
    try {
        await db.query(`CREATE INDEX idx_corte_placa_origem ON cortes_realizados(placa_origem)`);
        console.log('✅ Índice placa_origem criado');
    } catch (err) {
        if (err.code === 'ER_DUP_KEYNAME') {
            console.log('⏭️  Índice placa_origem já existe');
        } else {
            console.log('⚠️  Erro no índice:', err.message);
        }
    }
    
    console.log('✅ Migration 028 concluída');
};

exports.down = async function(db) {
    console.log('🔄 Revertendo migration 028...');
    
    // Remover foreign keys
    try {
        await db.query(`ALTER TABLE cortes_realizados DROP FOREIGN KEY fk_corte_bobina_origem`);
        await db.query(`ALTER TABLE cortes_realizados DROP FOREIGN KEY fk_corte_retalho_origem`);
    } catch (err) {
        console.log('⚠️ Erro ao remover FKs:', err.message);
    }
    
    // Remover índice
    try {
        await db.query(`DROP INDEX idx_corte_placa_origem ON cortes_realizados`);
    } catch (err) {
        console.log('⚠️ Erro ao remover índice:', err.message);
    }
    
    // Remover colunas
    await db.query(`
        ALTER TABLE cortes_realizados 
        DROP COLUMN IF EXISTS bobina_origem_id,
        DROP COLUMN IF EXISTS retalho_origem_id,
        DROP COLUMN IF EXISTS placa_origem,
        DROP COLUMN IF EXISTS codigo_origem
    `);
    
    console.log('✅ Migration 028 revertida');
};
