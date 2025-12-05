const express = require('express');
const router = express.Router();
const db = require('../config/database');

// =====================================================
// SEED DE TESTE - Dados reais para testar fluxo completo
// =====================================================

router.post('/criar-cenario-teste', async (req, res) => {
    const connection = await db.getConnection();
    
    try {
        await connection.beginTransaction();
        
        console.log('🌱 Iniciando seed de teste...');
        const errors = [];
        
        // =====================================================
        // 1. CRIAR CORES (se não existirem)
        // =====================================================
        const cores = [
            { nome: 'Azul Royal', hex: '#4169E1' },
            { nome: 'Verde Escuro', hex: '#006400' },
            { nome: 'Preto', hex: '#000000' },
            { nome: 'Branco', hex: '#FFFFFF' },
            { nome: 'Cinza', hex: '#808080' }
        ];
        
        const coresIds = {};
        for (const cor of cores) {
            const [existing] = await connection.query(
                'SELECT id FROM configuracoes_cores WHERE nome_cor = ?', 
                [cor.nome]
            );
            if (existing.length > 0) {
                coresIds[cor.nome] = existing[0].id;
            } else {
                const [result] = await connection.query(
                    'INSERT INTO configuracoes_cores (nome_cor, codigo_hex) VALUES (?, ?)',
                    [cor.nome, cor.hex]
                );
                coresIds[cor.nome] = result.insertId;
            }
        }
        console.log('✅ Cores criadas/verificadas');
        
        // =====================================================
        // 2. CRIAR GRAMATURAS (se não existirem)
        // =====================================================
        const gramaturas = [150, 180, 200, 220];
        const gramaturasIds = {};
        
        for (const gram of gramaturas) {
            const [existing] = await connection.query(
                'SELECT id FROM configuracoes_gramaturas WHERE gramatura = ?',
                [gram]
            );
            if (existing.length > 0) {
                gramaturasIds[gram] = existing[0].id;
            } else {
                const [result] = await connection.query(
                    'INSERT INTO configuracoes_gramaturas (gramatura) VALUES (?)',
                    [gram]
                );
                gramaturasIds[gram] = result.insertId;
            }
        }
        console.log('✅ Gramaturas criadas/verificadas');
        
        // =====================================================
        // 3. CRIAR PRODUTOS
        // =====================================================
        const produtos = [
            { codigo: 'LONA-AZ-180-500', cor: 'Azul Royal', gramatura: 180, largura: 500, fabricante: 'Propex', loja: 'Cortinave', largura_sem_costura: 510, tipo_bainha: 'Cano/Cano' },
            { codigo: 'LONA-VD-200-600', cor: 'Verde Escuro', gramatura: 200, largura: 600, fabricante: 'Textiloeste', loja: 'Cortinave', largura_sem_costura: 615, tipo_bainha: 'Cano/Arame' },
            { codigo: 'LONA-PT-150-500', cor: 'Preto', gramatura: 150, largura: 500, fabricante: 'Propex', loja: 'BN', largura_sem_costura: 510, tipo_bainha: 'Arame/Arame' }
        ];
        
        const produtosIds = {};
        for (const prod of produtos) {
            try {
                const [existing] = await connection.query(
                    'SELECT id FROM produtos WHERE codigo = ? AND loja = ?',
                    [prod.codigo, prod.loja]
                );
                if (existing.length > 0) {
                    produtosIds[prod.codigo] = existing[0].id;
                    console.log(`  → Produto ${prod.codigo} já existe (ID ${existing[0].id})`);
                } else {
                    console.log(`  → Criando produto ${prod.codigo}...`);
                    const [result] = await connection.query(
                        `INSERT INTO produtos (loja, codigo, cor_id, gramatura_id, largura_final, largura_sem_costura, fabricante, tipo_bainha, tipo_tecido) 
                         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Normal')`,
                        [prod.loja, prod.codigo, coresIds[prod.cor], gramaturasIds[prod.gramatura], prod.largura, prod.largura_sem_costura, prod.fabricante, prod.tipo_bainha]
                    );
                    produtosIds[prod.codigo] = result.insertId;
                    console.log(`  ✓ Produto criado com ID ${result.insertId}`);
                }
            } catch (err) {
                console.error(`  ❌ Erro ao criar produto ${prod.codigo}:`, err.message);
                console.error(`  SQL State: ${err.sqlState}, Errno: ${err.errno}`);
                console.error(`  Valores:`, [prod.loja, prod.codigo, coresIds[prod.cor], gramaturasIds[prod.gramatura], prod.largura, prod.largura_sem_costura, prod.fabricante, prod.tipo_bainha]);
                throw err;
            }
        }
        console.log('✅ Produtos criados/verificados');
        
        // =====================================================
        // 4. CRIAR LOCAÇÕES
        // =====================================================
        const locacoes = [
            { codigo: '1-A-1', descricao: 'Corredor 1, Estante A, Nível 1' },
            { codigo: '1-A-2', descricao: 'Corredor 1, Estante A, Nível 2' },
            { codigo: '1-B-1', descricao: 'Corredor 1, Estante B, Nível 1' },
            { codigo: '2-A-1', descricao: 'Corredor 2, Estante A, Nível 1' },
            { codigo: '2-B-1', descricao: 'Corredor 2, Estante B, Nível 1' }
        ];
        
        const locacoesIds = {};
        for (const loc of locacoes) {
            const [existing] = await connection.query(
                'SELECT id FROM locacoes WHERE codigo = ?',
                [loc.codigo]
            );
            if (existing.length > 0) {
                locacoesIds[loc.codigo] = existing[0].id;
            } else {
                const [result] = await connection.query(
                    'INSERT INTO locacoes (codigo, descricao, ativa) VALUES (?, ?, 1)',
                    [loc.codigo, loc.descricao]
                );
                locacoesIds[loc.codigo] = result.insertId;
            }
        }
        console.log('✅ Locações criadas/verificadas');
        
        // =====================================================
        // 5. BUSCAR BOBINAS DISPONÍVEIS NO ESTOQUE
        // =====================================================
        console.log('🔍 Buscando bobinas disponíveis no estoque...');
        
        // Buscar bobinas disponíveis com metragem suficiente
        const [bobinasDisponiveis] = await connection.query(
            `SELECT b.id, b.codigo_interno, b.metragem_atual, b.metragem_reservada, 
                    b.localizacao_atual, p.codigo as produto_codigo,
                    c.nome_cor, g.gramatura
             FROM bobinas b
             JOIN produtos p ON b.produto_id = p.id
             JOIN configuracoes_cores c ON p.cor_id = c.id
             JOIN configuracoes_gramaturas g ON p.gramatura_id = g.id
             WHERE b.status = 'Disponível' 
             AND (b.metragem_atual - b.metragem_reservada) >= 30
             ORDER BY b.metragem_atual DESC
             LIMIT 10`
        );
        
        if (bobinasDisponiveis.length < 3) {
            throw new Error('Não há bobinas suficientes disponíveis no estoque. Cadastre pelo menos 3 bobinas com 30m+ disponíveis.');
        }
        
        // Selecionar as primeiras 4 bobinas (ou menos se não tiver)
        const bobinasInfo = bobinasDisponiveis.slice(0, Math.min(4, bobinasDisponiveis.length)).map(b => ({
            id: b.id,
            codigo: b.codigo_interno,
            produto: b.produto_codigo,
            metragem: parseFloat(b.metragem_atual) - parseFloat(b.metragem_reservada),
            localizacao: b.localizacao_atual,
            cor: b.nome_cor,
            gramatura: b.gramatura
        }));
        
        console.log('✅ Bobinas selecionadas para teste:');
        bobinasInfo.forEach(b => {
            console.log(`  → ${b.codigo}: ${b.cor} ${b.gramatura}g - ${b.metragem.toFixed(1)}m disponíveis`);
        });
        
        // =====================================================
        // 6. CRIAR PLANO DE CORTE
        // =====================================================
        const agora = new Date();
        const ano = agora.getFullYear();
        const codigoPlano = `PC-${ano}-${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}`;
        
        const [planoResult] = await connection.query(
            `INSERT INTO planos_corte 
             (codigo_plano, cliente, aviario, status) 
             VALUES (?, ?, ?, 'em_producao')`,
            [codigoPlano, 'Granja São José - TESTE', 'Aviário 3 - Frangos de Corte']
        );
        
        const planoId = planoResult.insertId;
        console.log('✅ Plano de corte criado:', codigoPlano);
        
        // =====================================================
        // 7. CRIAR ITENS DO PLANO BASEADO NAS BOBINAS REAIS
        // =====================================================
        console.log('📋 Criando itens do plano...');
        
        // Criar itens baseados nas bobinas disponíveis
        const itensPlano = [];
        bobinasInfo.forEach((bobina, idx) => {
            // Cada bobina terá 1-2 cortes
            const cortesNaBobina = idx === 0 ? 2 : 1;
            const metragemDisponivel = bobina.metragem;
            
            for (let i = 0; i < cortesNaBobina; i++) {
                const metragem = Math.min(
                    30 + Math.floor(Math.random() * 30), // Entre 30 e 60 metros
                    metragemDisponivel - (i * 40) // Garantir que tem metragem
                );
                
                if (metragem >= 30) {
                    itensPlano.push({
                        bobina_idx: idx,
                        metragem: metragem
                    });
                }
            }
        });
        
        console.log(`  → ${itensPlano.length} itens serão criados`);
        
        const itensInfo = [];
        
        for (let i = 0; i < itensPlano.length; i++) {
            const item = itensPlano[i];
            const bobina = bobinasInfo[item.bobina_idx];
            
            // Buscar produto_id da bobina
            const [bobinaProduto] = await connection.query(
                'SELECT produto_id FROM bobinas WHERE id = ?',
                [bobina.id]
            );
            
            // Criar item do plano
            const [itemResult] = await connection.query(
                `INSERT INTO itens_plano_corte 
                 (plano_id, produto_id, metragem_planejada, status) 
                 VALUES (?, ?, ?, 'pendente')`,
                [planoId, bobinaProduto[0].produto_id, item.metragem]
            );
            
            const itemId = itemResult.insertId;
            
            // Criar alocação
            const [alocResult] = await connection.query(
                `INSERT INTO alocacoes_corte 
                 (item_id, origem_tipo, origem_id, metragem_alocada, status) 
                 VALUES (?, 'bobina', ?, ?, 'pendente')`,
                [itemId, bobina.id, item.metragem]
            );
            
            // Atualizar metragem reservada da bobina
            await connection.query(
                `UPDATE bobinas SET metragem_reservada = metragem_reservada + ? WHERE id = ?`,
                [item.metragem, bobina.id]
            );
            
            itensInfo.push({
                item_id: itemId,
                alocacao_id: alocResult.insertId,
                bobina_id: bobina.id,
                bobina_codigo: bobina.codigo,
                metragem: item.metragem,
                localizacao: bobina.localizacao
            });
        }
        console.log('✅ Itens do plano criados:', itensInfo.length);
        
        await connection.commit();
        
        // =====================================================
        // RESUMO DO CENÁRIO CRIADO
        // =====================================================
        const resumo = {
            success: true,
            message: '🎉 Cenário de teste criado com sucesso!',
            plano: {
                id: planoId,
                codigo: codigoPlano,
                cliente: 'Granja São José',
                aviario: 'Aviário 3 - Frangos de Corte',
                status: 'em_producao'
            },
            bobinas: bobinasInfo.map(b => ({
                id: b.id,
                codigo: b.codigo,
                qr_code: `B-${b.id}`,
                produto: b.produto,
                metragem: b.metragem,
                localizacao: b.localizacao,
                qr_localizacao: b.localizacao
            })),
            itens: itensInfo.map((item, idx) => ({
                numero: idx + 1,
                item_id: item.item_id,
                alocacao_id: item.alocacao_id,
                bobina_codigo: item.bobina_codigo,
                bobina_qr: `B-${item.bobina_id}`,
                metragem_cortar: item.metragem,
                localizacao: item.localizacao
            })),
            locacoes_destino: Object.entries(locacoesIds).map(([codigo, id]) => ({
                id,
                codigo,
                qr_code: codigo
            })),
            instrucoes: {
                passo1: `Acesse o mobile: /mobile/`,
                passo2: `Selecione o plano "${codigoPlano}"`,
                passo3: `Para cada item, escaneie o QR code da bobina correspondente`,
                passo4: `Informe a metragem cortada e tire foto do medidor`,
                passo5: `Após todos os cortes, finalize com as locações de destino`,
                passo6: `Verifique o status na web em /ordens.html`
            }
        };
        
        console.log('\n📋 RESUMO DO CENÁRIO DE TESTE:');
        console.log('================================');
        console.log(`Plano: ${codigoPlano}`);
        console.log(`Bobinas: ${bobinasInfo.map(b => b.codigo).join(', ')}`);
        console.log(`Itens: ${itensInfo.length} cortes para fazer`);
        console.log('================================\n');
        
        return res.json(resumo);
        
    } catch (error) {
        await connection.rollback();
        console.error('❌ Erro ao criar cenário de teste:', error);
        console.error('❌ SQL Message:', error.sqlMessage);
        console.error('❌ SQL State:', error.sqlState);
        console.error('❌ Errno:', error.errno);
        console.error('❌ Stack:', error.stack);
        return res.status(500).json({ 
            success: false, 
            error: error.message,
            sqlMessage: error.sqlMessage,
            sqlState: error.sqlState,
            errno: error.errno
        });
    } finally {
        connection.release();
    }
});

// Endpoint para limpar dados de teste (opcional)
router.delete('/limpar-teste/:planoId', async (req, res) => {
    const { planoId } = req.params;
    
    try {
        // Buscar bobinas alocadas no plano
        const [alocacoes] = await db.query(
            `SELECT DISTINCT a.origem_id, a.metragem_alocada 
             FROM alocacoes_corte a 
             JOIN itens_plano_corte i ON a.item_id = i.id 
             WHERE i.plano_id = ? AND a.origem_tipo = 'bobina'`,
            [planoId]
        );
        
        // Restaurar metragem reservada das bobinas
        for (const aloc of alocacoes) {
            await db.query(
                `UPDATE bobinas SET metragem_reservada = metragem_reservada - ? WHERE id = ?`,
                [aloc.metragem_alocada, aloc.origem_id]
            );
        }
        
        // Deletar alocações
        await db.query(
            `DELETE a FROM alocacoes_corte a 
             JOIN itens_plano_corte i ON a.item_id = i.id 
             WHERE i.plano_id = ?`,
            [planoId]
        );
        
        // Deletar itens
        await db.query('DELETE FROM itens_plano_corte WHERE plano_id = ?', [planoId]);
        
        // Deletar plano
        await db.query('DELETE FROM planos_corte WHERE id = ?', [planoId]);
        
        return res.json({ success: true, message: 'Dados de teste removidos' });
        
    } catch (error) {
        console.error('Erro ao limpar teste:', error);
        return res.status(500).json({ success: false, error: error.message });
    }
});

// Endpoint para ver status do plano
router.get('/status-plano/:planoId', async (req, res) => {
    try {
        const [plano] = await db.query(
            `SELECT p.*, 
                    COUNT(DISTINCT i.id) as total_itens,
                    SUM(CASE WHEN i.status = 'cortado' THEN 1 ELSE 0 END) as itens_cortados
             FROM planos_corte p
             LEFT JOIN itens_plano_corte i ON i.plano_id = p.id
             WHERE p.id = ?
             GROUP BY p.id`,
            [req.params.planoId]
        );
        
        if (plano.length === 0) {
            return res.status(404).json({ success: false, error: 'Plano não encontrado' });
        }
        
        const [itens] = await db.query(
            `SELECT i.id, i.metragem_planejada, i.status as item_status,
                    a.id as alocacao_id, a.origem_tipo, a.origem_id, a.metragem_alocada, a.status as alocacao_status,
                    b.codigo_interno as bobina_codigo, b.metragem_atual, b.localizacao_atual,
                    pr.codigo as produto_codigo, c.nome_cor
             FROM itens_plano_corte i
             LEFT JOIN alocacoes_corte a ON a.item_id = i.id
             LEFT JOIN bobinas b ON a.origem_id = b.id AND a.origem_tipo = 'bobina'
             LEFT JOIN produtos pr ON i.produto_id = pr.id
             LEFT JOIN configuracoes_cores c ON pr.cor_id = c.id
             WHERE i.plano_id = ?`,
            [req.params.planoId]
        );
        
        return res.json({
            success: true,
            plano: plano[0],
            itens: itens
        });
        
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
