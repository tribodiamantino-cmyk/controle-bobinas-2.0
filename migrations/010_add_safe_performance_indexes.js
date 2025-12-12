// Migration: Adicionar índices de performance (SEGURO - não afeta código)
// Data: 2025-11-27
// Versão: 2.1.0
// CORRIGIDO: Agora usa db.query ao invés de Sequelize

exports.up = async function(db) {
    console.log('📊 Criando índices de performance...');

    const indices = [
        // Índices básicos
        { sql: 'CREATE INDEX idx_produtos_loja ON produtos(loja)', nome: 'produtos.loja' },
        { sql: 'CREATE INDEX idx_bobinas_produto_id ON bobinas(produto_id)', nome: 'bobinas.produto_id' },
        { sql: 'CREATE INDEX idx_bobinas_status ON bobinas(status)', nome: 'bobinas.status' },
        { sql: 'CREATE INDEX idx_retalhos_produto_id ON retalhos(produto_id)', nome: 'retalhos.produto_id' },
        { sql: 'CREATE INDEX idx_retalhos_status ON retalhos(status)', nome: 'retalhos.status' },
        { sql: 'CREATE INDEX idx_planos_corte_status ON planos_corte(status)', nome: 'planos_corte.status' },
        
        // Índices compostos
        { sql: 'CREATE INDEX idx_bobinas_produto_status ON bobinas(produto_id, status)', nome: 'bobinas(produto_id, status)' },
        { sql: 'CREATE INDEX idx_retalhos_produto_status ON retalhos(produto_id, status)', nome: 'retalhos(produto_id, status)' }
    ];

    for (const idx of indices) {
        try {
            await db.query(idx.sql);
            console.log(`✅ Índice criado: ${idx.nome}`);
        } catch (error) {
            if (error.code === 'ER_DUP_KEYNAME') {
                console.log(`⏭️  Índice já existe: ${idx.nome}`);
            } else {
                console.log(`⚠️  Erro no índice ${idx.nome}:`, error.message);
            }
        }
    }

    console.log('✅ Índices de performance verificados');
};

exports.down = async function(db) {
    console.log('🗑️  Removendo índices de performance...');
    
    const indices = [
        'idx_produtos_loja',
        'idx_bobinas_produto_id',
        'idx_bobinas_status',
        'idx_retalhos_produto_id',
        'idx_retalhos_status',
        'idx_planos_corte_status',
        'idx_bobinas_produto_status',
        'idx_retalhos_produto_status'
    ];

    for (const nome of indices) {
        try {
            // Tentar dropar de todas as tabelas possíveis
            const tabela = nome.split('_')[1]; // Ex: idx_produtos_loja -> produtos
            await db.query(`DROP INDEX ${nome} ON ${tabela}`);
            console.log(`✅ Índice removido: ${nome}`);
        } catch (error) {
            console.log(`⏭️  Índice ${nome} não existe ou erro:`, error.message);
        }
    }
};
