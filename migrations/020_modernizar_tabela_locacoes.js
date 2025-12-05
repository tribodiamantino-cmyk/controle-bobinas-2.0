exports.up = async function(db) {
    console.log('🔄 Modernizando tabela locacoes...');
    
    // 1. Verificar se a tabela existe
    const [tables] = await db.query(`
        SHOW TABLES LIKE 'locacoes'
    `);
    
    if (tables.length === 0) {
        console.log('⚠️  Tabela locacoes não existe! Criando do zero...');
        
        // Criar tabela já modernizada
        await db.query(`
            CREATE TABLE IF NOT EXISTS locacoes (
                id INT AUTO_INCREMENT PRIMARY KEY,
                codigo VARCHAR(20) NOT NULL UNIQUE COMMENT 'Formato: 0000-X-0000',
                descricao VARCHAR(200) NULL,
                capacidade INT NULL COMMENT 'Capacidade de bobinas (opcional)',
                ativa BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_codigo (codigo)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        
        console.log('✓ Tabela locacoes criada (estrutura moderna)');
        
        // Pular para inserção de dados (pula a parte de migração)
        // Continue abaixo no código de inserção
    } else {
        // 2. Verificar se já está modernizada (idempotência)
        const [columns] = await db.query(`
            SHOW COLUMNS FROM locacoes LIKE 'codigo'
        `);
        
        if (columns.length > 0) {
            console.log('⏭️  Tabela locacoes já está modernizada, pulando...');
            return;
        }
        
        // 3. Tabela existe mas está no formato antigo - modernizar
        console.log('📋 Tabela locacoes existe (formato antigo), migrando...');
        
        // Remover FKs que possam existir
        try {
            const [fks] = await db.query(`
                SELECT CONSTRAINT_NAME 
                FROM information_schema.KEY_COLUMN_USAGE 
                WHERE TABLE_SCHEMA = DATABASE() 
                AND TABLE_NAME = 'locacoes' 
                AND REFERENCED_TABLE_NAME IS NOT NULL
            `);
            
            for (const fk of fks) {
                await db.query(`ALTER TABLE locacoes DROP FOREIGN KEY ${fk.CONSTRAINT_NAME}`);
            }
        } catch (error) {
            console.log('ℹ️  Nenhuma FK para remover');
        }
        
        // Limpar dados antigos
        await db.query('TRUNCATE TABLE locacoes');
        console.log('✓ Locações antigas removidas');
        
        // Remover colunas antigas
        await db.query(`
            ALTER TABLE locacoes
            DROP COLUMN IF EXISTS corredor,
            DROP COLUMN IF EXISTS prateleira,
            DROP COLUMN IF EXISTS posicao
        `);
        console.log('✓ Colunas antigas removidas');
        
        // Renomear e adicionar novas colunas
        await db.query(`
            ALTER TABLE locacoes
            CHANGE COLUMN codigo_locacao codigo VARCHAR(20) NOT NULL UNIQUE COMMENT 'Formato: 0000-X-0000',
            CHANGE COLUMN ativo ativa BOOLEAN DEFAULT TRUE,
            CHANGE COLUMN data_criacao created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            ADD COLUMN capacidade INT NULL COMMENT 'Capacidade de bobinas (opcional)'
        `);
        console.log('✓ Estrutura modernizada');
    }
    
    // INSERÇÃO DE DADOS (sempre roda, seja tabela nova ou migrada)
    console.log('📦 Inserindo locações iniciais...');
    
    // Verificar se já tem dados
    const [existingData] = await db.query('SELECT COUNT(*) as total FROM locacoes');
    if (existingData[0].total > 0) {
        console.log(`⏭️  Já existem ${existingData[0].total} locações, pulando inserção`);
        return;
    }
    
    // 6. Inserir locações iniciais no novo formato
    const locacoes = [
        // Corredor A - Prateleira 1 (00-09)
        ['0001-A-0001', 'Corredor A - Prateleira 1 - Posição 01', 50],
        ['0001-A-0002', 'Corredor A - Prateleira 1 - Posição 02', 50],
        ['0001-A-0003', 'Corredor A - Prateleira 1 - Posição 03', 50],
        ['0001-A-0004', 'Corredor A - Prateleira 1 - Posição 04', 50],
        ['0001-A-0005', 'Corredor A - Prateleira 1 - Posição 05', 50],
        
        // Corredor A - Prateleira 2 (10-19)
        ['0002-A-0001', 'Corredor A - Prateleira 2 - Posição 01', 50],
        ['0002-A-0002', 'Corredor A - Prateleira 2 - Posição 02', 50],
        ['0002-A-0003', 'Corredor A - Prateleira 2 - Posição 03', 50],
        ['0002-A-0004', 'Corredor A - Prateleira 2 - Posição 04', 50],
        
        // Corredor B - Prateleira 1 (20-29)
        ['0003-B-0001', 'Corredor B - Prateleira 1 - Posição 01', 50],
        ['0003-B-0002', 'Corredor B - Prateleira 1 - Posição 02', 50],
        ['0003-B-0003', 'Corredor B - Prateleira 1 - Posição 03', 50],
        ['0003-B-0004', 'Corredor B - Prateleira 1 - Posição 04', 50],
        
        // Corredor B - Prateleira 2 (30-39)
        ['0004-B-0001', 'Corredor B - Prateleira 2 - Posição 01', 50],
        ['0004-B-0002', 'Corredor B - Prateleira 2 - Posição 02', 50],
        ['0004-B-0003', 'Corredor B - Prateleira 2 - Posição 03', 50],
        
        // Corredor C - Prateleira 1 (40-49)
        ['0005-C-0001', 'Corredor C - Prateleira 1 - Posição 01', 50],
        ['0005-C-0002', 'Corredor C - Prateleira 1 - Posição 02', 50],
        ['0005-C-0003', 'Corredor C - Prateleira 1 - Posição 03', 50],
    ];
    
    for (const [codigo, descricao, capacidade] of locacoes) {
        await db.query(`
            INSERT INTO locacoes (codigo, descricao, capacidade, ativa)
            VALUES (?, ?, ?, TRUE)
        `, [codigo, descricao, capacidade]);
    }
    
    console.log(`✓ ${locacoes.length} locações inseridas no novo formato (0000-X-0000)`);
    console.log('✅ Tabela locacoes modernizada com sucesso!');
};

exports.down = async function(db) {
    console.log('⏪ Revertendo modernização da tabela locacoes...');
    
    // Limpar dados
    await db.query('TRUNCATE TABLE locacoes');
    
    // Reverter estrutura
    await db.query(`
        ALTER TABLE locacoes
        DROP COLUMN IF EXISTS capacidade,
        DROP COLUMN IF EXISTS updated_at,
        CHANGE COLUMN codigo codigo_locacao VARCHAR(20) NOT NULL UNIQUE COMMENT 'Ex: A1-B2-C3',
        CHANGE COLUMN ativa ativo BOOLEAN DEFAULT TRUE,
        CHANGE COLUMN created_at data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        ADD COLUMN corredor VARCHAR(10) NULL COMMENT 'Ex: A',
        ADD COLUMN prateleira VARCHAR(10) NULL COMMENT 'Ex: 1',
        ADD COLUMN posicao VARCHAR(10) NULL COMMENT 'Ex: B2-C3'
    `);
    
    console.log('✓ Estrutura revertida para formato antigo');
};
