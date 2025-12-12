/**
 * Migration 038: Correção de todos os problemas pendentes
 * 
 * Esta migration resolve:
 * 1. Cria tabela locacoes (se não existir)
 * 2. Adiciona colunas faltantes em cortes_realizados
 * 3. Adiciona colunas faltantes em carregamentos_itens
 * 4. Cria índices de performance que faltam
 */

exports.up = async function(db) {
    console.log('🔧 Migration 038: Corrigindo todos os problemas pendentes...');
    
    // =========================================================================
    // 1. CRIAR TABELA LOCACOES (se não existir)
    // =========================================================================
    try {
        await db.query(`
            CREATE TABLE IF NOT EXISTS locacoes (
                id INT AUTO_INCREMENT PRIMARY KEY,
                codigo_locacao VARCHAR(50) NOT NULL UNIQUE COMMENT 'Formato: 0000-X-0000',
                descricao VARCHAR(200) NULL,
                setor VARCHAR(10) NULL COMMENT 'Ex: 0001',
                corredor VARCHAR(10) NULL COMMENT 'Ex: A',
                posicao VARCHAR(10) NULL COMMENT 'Ex: 0001',
                capacidade INT DEFAULT NULL COMMENT 'Capacidade em bobinas',
                ocupacao INT DEFAULT 0 COMMENT 'Ocupação atual',
                ativo BOOLEAN DEFAULT TRUE,
                data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_codigo (codigo_locacao),
                INDEX idx_ativo (ativo)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('✅ Tabela locacoes criada/verificada');
    } catch (err) {
        if (err.code === 'ER_TABLE_EXISTS_ERROR') {
            console.log('⏭️  Tabela locacoes já existe');
        } else {
            console.log('⚠️  Erro ao criar locacoes:', err.message);
        }
    }
    
    // =========================================================================
    // 2. ADICIONAR COLUNAS EM cortes_realizados
    // =========================================================================
    const colunasCortes = [
        { nome: 'item_plano_id', sql: 'ADD COLUMN item_plano_id INT NULL AFTER alocacao_id' },
        { nome: 'bobina_origem_id', sql: 'ADD COLUMN bobina_origem_id INT NULL' },
        { nome: 'retalho_origem_id', sql: 'ADD COLUMN retalho_origem_id INT NULL' },
        { nome: 'placa_origem', sql: 'ADD COLUMN placa_origem VARCHAR(50) NULL' },
        { nome: 'codigo_origem', sql: 'ADD COLUMN codigo_origem VARCHAR(50) NULL' }
    ];
    
    for (const col of colunasCortes) {
        try {
            await db.query(`ALTER TABLE cortes_realizados ${col.sql}`);
            console.log(`✅ Coluna cortes_realizados.${col.nome} adicionada`);
        } catch (err) {
            if (err.code === 'ER_DUP_FIELDNAME') {
                console.log(`⏭️  Coluna cortes_realizados.${col.nome} já existe`);
            } else {
                console.log(`⚠️  Erro em cortes_realizados.${col.nome}:`, err.message);
            }
        }
    }
    
    // =========================================================================
    // 3. ADICIONAR COLUNAS EM carregamentos_itens (status_confirmacao)
    // =========================================================================
    try {
        await db.query(`
            ALTER TABLE carregamentos_itens 
            ADD COLUMN status_confirmacao ENUM('pendente', 'confirmado', 'rejeitado') DEFAULT 'pendente'
        `);
        console.log('✅ Coluna carregamentos_itens.status_confirmacao adicionada');
    } catch (err) {
        if (err.code === 'ER_DUP_FIELDNAME') {
            console.log('⏭️  Coluna carregamentos_itens.status_confirmacao já existe');
        } else if (err.code === 'ER_NO_SUCH_TABLE') {
            console.log('⏭️  Tabela carregamentos_itens não existe ainda');
        } else {
            console.log('⚠️  Erro em status_confirmacao:', err.message);
        }
    }
    
    // =========================================================================
    // 4. ADICIONAR ÍNDICES DE PERFORMANCE
    // =========================================================================
    const indices = [
        { tabela: 'produtos', coluna: 'loja', nome: 'idx_produtos_loja' },
        { tabela: 'bobinas', coluna: 'produto_id', nome: 'idx_bobinas_produto_id' },
        { tabela: 'bobinas', coluna: 'status', nome: 'idx_bobinas_status' },
        { tabela: 'bobinas', coluna: 'loja', nome: 'idx_bobinas_loja' },
        { tabela: 'retalhos', coluna: 'produto_id', nome: 'idx_retalhos_produto_id' },
        { tabela: 'retalhos', coluna: 'status', nome: 'idx_retalhos_status' },
        { tabela: 'planos_corte', coluna: 'status', nome: 'idx_planos_status' },
        { tabela: 'cortes_realizados', coluna: 'codigo_corte', nome: 'idx_cortes_codigo' },
        { tabela: 'locacoes', coluna: 'codigo_locacao', nome: 'idx_locacoes_codigo' }
    ];
    
    for (const idx of indices) {
        try {
            await db.query(`CREATE INDEX ${idx.nome} ON ${idx.tabela}(${idx.coluna})`);
            console.log(`✅ Índice ${idx.nome} criado`);
        } catch (err) {
            if (err.code === 'ER_DUP_KEYNAME') {
                console.log(`⏭️  Índice ${idx.nome} já existe`);
            } else if (err.code === 'ER_NO_SUCH_TABLE') {
                console.log(`⏭️  Tabela ${idx.tabela} não existe`);
            } else {
                console.log(`⚠️  Erro no índice ${idx.nome}:`, err.message);
            }
        }
    }
    
    // =========================================================================
    // 5. INSERIR LOCAÇÕES INICIAIS (se tabela estiver vazia)
    // =========================================================================
    try {
        const [count] = await db.query('SELECT COUNT(*) as total FROM locacoes');
        if (count[0].total === 0) {
            console.log('📦 Inserindo locações iniciais...');
            
            // Gerar locações: Setores 0001-0005, Corredores A-E, Posições 0001-0010
            const setores = ['0001', '0002', '0003', '0004', '0005'];
            const corredores = ['A', 'B', 'C', 'D', 'E'];
            
            for (const setor of setores) {
                for (const corredor of corredores) {
                    for (let pos = 1; pos <= 10; pos++) {
                        const posicao = pos.toString().padStart(4, '0');
                        const codigo = `${setor}-${corredor}-${posicao}`;
                        try {
                            await db.query(
                                `INSERT INTO locacoes (codigo_locacao, setor, corredor, posicao, descricao) 
                                 VALUES (?, ?, ?, ?, ?)`,
                                [codigo, setor, corredor, posicao, `Setor ${setor}, Corredor ${corredor}, Posição ${posicao}`]
                            );
                        } catch (e) {
                            // Ignorar duplicados
                        }
                    }
                }
            }
            console.log('✅ 250 locações iniciais inseridas');
        } else {
            console.log(`⏭️  Locações já existem (${count[0].total} registros)`);
        }
    } catch (err) {
        console.log('⚠️  Erro ao inserir locações:', err.message);
    }
    
    console.log('✅ Migration 038 concluída');
};

exports.down = async function(db) {
    // Não fazer rollback destrutivo
    console.log('⚠️  Migration 038 não possui rollback (dados seriam perdidos)');
};
