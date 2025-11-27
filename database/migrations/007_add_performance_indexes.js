/**
 * Migration: Adicionar índices para otimização de performance
 * 
 * Índices criados baseados em análise de queries mais frequentes:
 * - Busca de bobinas/retalhos disponíveis por produto
 * - Filtros de status em planos de corte
 * - Joins em alocações
 */

module.exports = {
    up: async (connection) => {
        console.log('⚙️  Aplicando migration: Índices de Performance');
        
        try {
            // BOBINAS - Índices para queries de busca de estoque disponível
            await connection.query(`
                CREATE INDEX IF NOT EXISTS idx_bobinas_produto_status 
                ON bobinas(produto_id, status, convertida_em_retalho)
            `);
            console.log('   ✅ Índice criado: bobinas (produto_id, status, convertida_em_retalho)');
            
            await connection.query(`
                CREATE INDEX IF NOT EXISTS idx_bobinas_status_metragem
                ON bobinas(status, metragem_atual)
            `);
            console.log('   ✅ Índice criado: bobinas (status, metragem_atual)');
            
            // RETALHOS - Índices para queries de busca de estoque disponível
            await connection.query(`
                CREATE INDEX IF NOT EXISTS idx_retalhos_produto_status
                ON retalhos(produto_id, status)
            `);
            console.log('   ✅ Índice criado: retalhos (produto_id, status)');
            
            await connection.query(`
                CREATE INDEX IF NOT EXISTS idx_retalhos_status_metragem
                ON retalhos(status, metragem)
            `);
            console.log('   ✅ Índice criado: retalhos (status, metragem)');
            
            // PLANOS DE CORTE - Índice para listagem por status
            await connection.query(`
                CREATE INDEX IF NOT EXISTS idx_planos_status_created
                ON planos_corte(status, created_at DESC)
            `);
            console.log('   ✅ Índice criado: planos_corte (status, created_at)');
            
            // ALOCAÇÕES - Índice para joins frequentes
            await connection.query(`
                CREATE INDEX IF NOT EXISTS idx_alocacoes_item_plano
                ON alocacoes_corte(item_plano_corte_id)
            `);
            console.log('   ✅ Índice criado: alocacoes_corte (item_plano_corte_id)');
            
            await connection.query(`
                CREATE INDEX IF NOT EXISTS idx_alocacoes_bobina
                ON alocacoes_corte(bobina_id)
            `);
            console.log('   ✅ Índice criado: alocacoes_corte (bobina_id)');
            
            await connection.query(`
                CREATE INDEX IF NOT EXISTS idx_alocacoes_retalho
                ON alocacoes_corte(retalho_id)
            `);
            console.log('   ✅ Índice criado: alocacoes_corte (retalho_id)');
            
            // ITENS PLANO CORTE - Índice para ordenação
            await connection.query(`
                CREATE INDEX IF NOT EXISTS idx_itens_plano_ordem
                ON itens_plano_corte(plano_corte_id, ordem)
            `);
            console.log('   ✅ Índice criado: itens_plano_corte (plano_corte_id, ordem)');
            
            // PRODUTOS - Índice para filtros
            await connection.query(`
                CREATE INDEX IF NOT EXISTS idx_produtos_cor_gramatura
                ON produtos(cor_id, gramatura_id)
            `);
            console.log('   ✅ Índice criado: produtos (cor_id, gramatura_id)');
            
            console.log('✅ Migration de índices concluída com sucesso!');
            
        } catch (error) {
            console.error('❌ Erro ao criar índices:', error.message);
            throw error;
        }
    },
    
    down: async (connection) => {
        console.log('⚙️  Revertendo migration: Índices de Performance');
        
        await connection.query('DROP INDEX IF EXISTS idx_bobinas_produto_status ON bobinas');
        await connection.query('DROP INDEX IF EXISTS idx_bobinas_status_metragem ON bobinas');
        await connection.query('DROP INDEX IF EXISTS idx_retalhos_produto_status ON retalhos');
        await connection.query('DROP INDEX IF EXISTS idx_retalhos_status_metragem ON retalhos');
        await connection.query('DROP INDEX IF EXISTS idx_planos_status_created ON planos_corte');
        await connection.query('DROP INDEX IF EXISTS idx_alocacoes_item_plano ON alocacoes_corte');
        await connection.query('DROP INDEX IF EXISTS idx_alocacoes_bobina ON alocacoes_corte');
        await connection.query('DROP INDEX IF EXISTS idx_alocacoes_retalho ON alocacoes_corte');
        await connection.query('DROP INDEX IF EXISTS idx_itens_plano_ordem ON itens_plano_corte');
        await connection.query('DROP INDEX IF EXISTS idx_produtos_cor_gramatura ON produtos');
        
        console.log('✅ Índices removidos com sucesso');
    }
};
