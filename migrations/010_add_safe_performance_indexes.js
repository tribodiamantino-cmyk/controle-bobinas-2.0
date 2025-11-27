// Migration: Adicionar índices de performance (SEGURO - não afeta código)
// Data: 2025-11-27
// Versão: 2.1.0

module.exports = {
    async up(queryInterface) {
        console.log('📊 Criando índices de performance...');

        try {
            // Índices para tabela produtos
            await queryInterface.sequelize.query(`
                CREATE INDEX IF NOT EXISTS idx_produtos_nome 
                ON produtos(nome)
            `);
            console.log('✅ Índice criado: produtos.nome');

            await queryInterface.sequelize.query(`
                CREATE INDEX IF NOT EXISTS idx_produtos_ativo 
                ON produtos(ativo)
            `);
            console.log('✅ Índice criado: produtos.ativo');

            // Índices para tabela bobinas
            await queryInterface.sequelize.query(`
                CREATE INDEX IF NOT EXISTS idx_bobinas_produto_id 
                ON bobinas(produto_id)
            `);
            console.log('✅ Índice criado: bobinas.produto_id');

            await queryInterface.sequelize.query(`
                CREATE INDEX IF NOT EXISTS idx_bobinas_metragem_disponivel 
                ON bobinas(metragem_disponivel)
            `);
            console.log('✅ Índice criado: bobinas.metragem_disponivel');

            await queryInterface.sequelize.query(`
                CREATE INDEX IF NOT EXISTS idx_bobinas_localizacao 
                ON bobinas(localizacao)
            `);
            console.log('✅ Índice criado: bobinas.localizacao');

            // Índices para tabela retalhos
            await queryInterface.sequelize.query(`
                CREATE INDEX IF NOT EXISTS idx_retalhos_produto_id 
                ON retalhos(produto_id)
            `);
            console.log('✅ Índice criado: retalhos.produto_id');

            await queryInterface.sequelize.query(`
                CREATE INDEX IF NOT EXISTS idx_retalhos_metragem_disponivel 
                ON retalhos(metragem_disponivel)
            `);
            console.log('✅ Índice criado: retalhos.metragem_disponivel');

            // Índices para tabela ordens_corte
            await queryInterface.sequelize.query(`
                CREATE INDEX IF NOT EXISTS idx_ordens_status 
                ON ordens_corte(status)
            `);
            console.log('✅ Índice criado: ordens_corte.status');

            await queryInterface.sequelize.query(`
                CREATE INDEX IF NOT EXISTS idx_ordens_data_criacao 
                ON ordens_corte(data_criacao)
            `);
            console.log('✅ Índice criado: ordens_corte.data_criacao');

            // Índices para tabela ordens_corte_itens
            await queryInterface.sequelize.query(`
                CREATE INDEX IF NOT EXISTS idx_ordens_itens_ordem_id 
                ON ordens_corte_itens(ordem_corte_id)
            `);
            console.log('✅ Índice criado: ordens_corte_itens.ordem_corte_id');

            await queryInterface.sequelize.query(`
                CREATE INDEX IF NOT EXISTS idx_ordens_itens_produto_id 
                ON ordens_corte_itens(produto_id)
            `);
            console.log('✅ Índice criado: ordens_corte_itens.produto_id');

            // Índices compostos para queries complexas
            await queryInterface.sequelize.query(`
                CREATE INDEX IF NOT EXISTS idx_bobinas_produto_disponivel 
                ON bobinas(produto_id, metragem_disponivel)
            `);
            console.log('✅ Índice composto criado: bobinas(produto_id, metragem_disponivel)');

            await queryInterface.sequelize.query(`
                CREATE INDEX IF NOT EXISTS idx_retalhos_produto_disponivel 
                ON retalhos(produto_id, metragem_disponivel)
            `);
            console.log('✅ Índice composto criado: retalhos(produto_id, metragem_disponivel)');

            console.log('✅ Todos os índices criados com sucesso!');
        } catch (error) {
            console.error('❌ Erro ao criar índices:', error.message);
            throw error;
        }
    },

    async down(queryInterface) {
        console.log('🗑️  Removendo índices de performance...');

        try {
            const indexes = [
                'idx_produtos_nome',
                'idx_produtos_ativo',
                'idx_bobinas_produto_id',
                'idx_bobinas_metragem_disponivel',
                'idx_bobinas_localizacao',
                'idx_retalhos_produto_id',
                'idx_retalhos_metragem_disponivel',
                'idx_ordens_status',
                'idx_ordens_data_criacao',
                'idx_ordens_itens_ordem_id',
                'idx_ordens_itens_produto_id',
                'idx_bobinas_produto_disponivel',
                'idx_retalhos_produto_disponivel'
            ];

            for (const index of indexes) {
                await queryInterface.sequelize.query(`DROP INDEX IF EXISTS ${index}`);
                console.log(`✅ Índice removido: ${index}`);
            }

            console.log('✅ Todos os índices removidos!');
        } catch (error) {
            console.error('❌ Erro ao remover índices:', error.message);
            throw error;
        }
    }
};
