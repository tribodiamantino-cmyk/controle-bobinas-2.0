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
            const [existing] = await connection.query(
                'SELECT id FROM produtos WHERE codigo_produto = ? AND loja = ?',
                [prod.codigo, prod.loja]
            );
            if (existing.length > 0) {
                produtosIds[prod.codigo] = existing[0].id;
            } else {
                const [result] = await connection.query(
                    `INSERT INTO produtos (loja, codigo_produto, cor_id, gramatura_id, largura_final, largura_sem_costura, fabricante, tipo_bainha, tipo_tecido) 
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Normal')`,
                    [prod.loja, prod.codigo, coresIds[prod.cor], gramaturasIds[prod.gramatura], prod.largura, prod.largura_sem_costura, prod.fabricante, prod.tipo_bainha]
                );
                produtosIds[prod.codigo] = result.insertId;
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
        // 5. CRIAR BOBINAS COM METRAGEM
        // =====================================================
        const agora = new Date();
        const ano = agora.getFullYear();
        
        // Buscar último código interno do ano
        const [ultimoCodigo] = await connection.query(
            `SELECT codigo_interno FROM bobinas 
             WHERE codigo_interno LIKE 'CTV-${ano}-%' 
             ORDER BY id DESC LIMIT 1`
        );
        
        let sequencial = 1;
        if (ultimoCodigo.length > 0) {
            const partes = ultimoCodigo[0].codigo_interno.split('-');
            sequencial = parseInt(partes[2]) + 1;
        }
        
        const bobinas = [
            { produto: 'LONA-AZ-180-500', metragem: 250, localizacao: '1-A-1', loja: 'Cortinave' },
            { produto: 'LONA-AZ-180-500', metragem: 180, localizacao: '1-A-2', loja: 'Cortinave' },
            { produto: 'LONA-VD-200-600', metragem: 300, localizacao: '1-B-1', loja: 'Cortinave' },
            { produto: 'LONA-PT-150-500', metragem: 200, localizacao: '2-A-1', loja: 'BN' }
        ];
        
        const bobinasIds = [];
        const bobinasInfo = [];
        
        for (const bob of bobinas) {
            // Código interno usa CTV/BN como prefixo
            const prefixoCodigo = bob.loja === 'Cortinave' ? 'CTV' : 'BN';
            const codigoInterno = `${prefixoCodigo}-${ano}-${String(sequencial).padStart(5, '0')}`;
            sequencial++;
            
            const [result] = await connection.query(
                `INSERT INTO bobinas 
                 (produto_id, codigo_interno, metragem_inicial, metragem_atual, metragem_reservada, 
                  localizacao_atual, status, loja, data_entrada, nota_fiscal) 
                 VALUES (?, ?, ?, ?, 0, ?, 'Disponível', ?, NOW(), 'NF-TESTE-001')`,
                [produtosIds[bob.produto], codigoInterno, bob.metragem, bob.metragem, bob.localizacao, bob.loja]
            );
            
            bobinasIds.push(result.insertId);
            bobinasInfo.push({
                id: result.insertId,
                codigo: codigoInterno,
                produto: bob.produto,
                metragem: bob.metragem,
                localizacao: bob.localizacao
            });
        }
        console.log('✅ Bobinas criadas:', bobinasInfo.map(b => b.codigo).join(', '));
        
        // =====================================================
        // 6. CRIAR PLANO DE CORTE
        // =====================================================
        const codigoPlano = `PC-${ano}-${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}`;
        
        const [planoResult] = await connection.query(
            `INSERT INTO planos_corte 
             (codigo_plano, cliente, aviario, status, observacoes, created_at) 
             VALUES (?, ?, ?, 'em_producao', ?, NOW())`,
            [codigoPlano, 'Granja São José', 'Aviário 3 - Frangos de Corte', 'Plano de teste para validação do fluxo mobile']
        );
        
        const planoId = planoResult.insertId;
        console.log('✅ Plano de corte criado:', codigoPlano);
        
        // =====================================================
        // 7. CRIAR ITENS DO PLANO
        // =====================================================
        const itensPlano = [
            { bobina_idx: 0, metragem: 45 },  // Azul Royal - 45m
            { bobina_idx: 0, metragem: 38 },  // Azul Royal - 38m
            { bobina_idx: 1, metragem: 52 },  // Azul Royal (2ª bobina) - 52m
            { bobina_idx: 2, metragem: 65 },  // Verde Escuro - 65m
            { bobina_idx: 2, metragem: 48 },  // Verde Escuro - 48m
            { bobina_idx: 3, metragem: 35 },  // Preto - 35m
        ];
        
        const itensInfo = [];
        
        for (let i = 0; i < itensPlano.length; i++) {
            const item = itensPlano[i];
            const bobina = bobinasInfo[item.bobina_idx];
            
            // Criar item do plano
            const [itemResult] = await connection.query(
                `INSERT INTO itens_plano_corte 
                 (plano_id, produto_id, metragem_planejada, status) 
                 VALUES (?, ?, ?, 'pendente')`,
                [planoId, produtosIds[bobina.produto], item.metragem]
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
        return res.status(500).json({ 
            success: false, 
            error: error.message,
            stack: error.stack
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
