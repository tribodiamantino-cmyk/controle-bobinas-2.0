const express = require('express');
const router = express.Router();
const db = require('../config/database');

// ========== GET: Detalhes da Bobina com Histórico ==========
router.get('/bobina/:id', async (req, res) => {
    try {
        const bobinaId = req.params.id;

        // Tentar buscar dados completos via view consolidada
        // Compatível com o schema atual (codigo_produto, cor, gramatura, id_interno etc.)
        const [rows] = await db.query(
            `SELECT 
                v.id,
                v.id_interno AS codigo_interno,
                v.metragem_inicial,
                v.metragem_atual,
                v.locacao AS localizacao_atual,
                v.status,
                v.data_entrada,
                v.observacoes,
                v.produto_id,
                v.loja,
                v.codigo_produto AS codigo,
                v.cor AS nome_cor,
                v.gramatura,
                v.fabricante,
                v.largura_final
            FROM vw_bobinas_detalhadas v
            WHERE v.id = ?`,
            [bobinaId]
        );

        if (!rows || rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Bobina não encontrada' });
        }

        const bobina = rows[0];

        // Calcular total cortado com base em metragens (evita dependência de outra tabela)
        const total_cortado = Number(bobina.metragem_inicial) - Number(bobina.metragem_atual);
        bobina.total_cortado = Number(total_cortado.toFixed(2));

        // Historico simplificado: Entrada + cortes (se existir tabela itens_ordem_corte)
        const historico = [];

        historico.push({
            tipo: 'ENTRADA',
            data_movimentacao: bobina.data_entrada,
            metragem: bobina.metragem_inicial,
            observacoes: `Entrada${bobina.nota_fiscal ? ' - NF: ' + bobina.nota_fiscal : ''}`
        });

        try {
            // Tentar buscar cortes no schema atual (itens_ordem_corte)
            const [cortes] = await db.query(
                `SELECT 
                    i.data_corte AS data_movimentacao,
                    i.metragem_cortada AS metragem,
                    i.observacoes
                 FROM itens_ordem_corte i
                 WHERE i.bobina_id = ?
                 ORDER BY i.data_corte DESC`,
                [bobinaId]
            );

            cortes.forEach(c => {
                historico.push({
                    tipo: 'CORTE',
                    data_movimentacao: c.data_movimentacao,
                    metragem: c.metragem,
                    observacoes: c.observacoes || ''
                });
            });
        } catch (err) {
            console.warn('⚠️ Histórico de cortes não disponível no schema atual:', err.message);
        }

        bobina.historico = historico;

        return res.json({ success: true, data: bobina });
    } catch (error) {
        console.error('❌ Erro ao buscar bobina ID:', req.params.id);
        console.error('❌ Detalhes do erro:', error.message);
        console.error('❌ Stack:', error.stack);
        return res.status(500).json({
            success: false,
            message: 'Erro ao buscar dados da bobina',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// ========== POST: Registrar Corte (mobile) ==========
// Fluxo simplificado: cria ordem automática "MOBILE" e insere item de corte
router.post('/corte', async (req, res) => {
    try {
        const { bobina_id, metragem_cortada, observacoes } = req.body;

        // Validar dados
        if (!bobina_id || !metragem_cortada) {
            return res.status(400).json({
                success: false,
                message: 'Bobina e metragem são obrigatórios'
            });
        }

        if (metragem_cortada <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Metragem deve ser maior que zero'
            });
        }

        // Buscar bobina via view consolidada
        const [bobinas] = await db.query(
            `SELECT id, id_interno AS codigo_interno, metragem_atual, produto_id
             FROM bobinas WHERE id = ?`,
            [bobina_id]
        );

        if (bobinas.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Bobina não encontrada'
            });
        }

        const bobina = bobinas[0];
        const metragem_disponivel = Number(bobina.metragem_atual);

        if (metragem_cortada > metragem_disponivel) {
            return res.status(400).json({
                success: false,
                message: `Metragem insuficiente. Disponível: ${metragem_disponivel.toFixed(2)}m`
            });
        }

        // Gerar número de ordem automático para cortes mobile
        const dataHoje = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const [seqRows] = await db.query(
            `SELECT COUNT(*) AS cnt FROM ordens_corte WHERE numero_ordem LIKE ?`,
            [`MOB-${dataHoje}-%`]
        );
        const seq = (seqRows[0].cnt || 0) + 1;
        const numero_ordem = `MOB-${dataHoje}-${String(seq).padStart(4, '0')}`;

        // Criar ordem de corte mobile (status Concluída)
        const [ordemResult] = await db.query(
            `INSERT INTO ordens_corte (numero_ordem, status, criado_por, observacoes, data_conclusao)
             VALUES (?, 'Concluída', 'App Mobile', ?, NOW())`,
            [numero_ordem, observacoes || null]
        );
        const ordem_id = ordemResult.insertId;

        // Inserir item de corte
        await db.query(
            `INSERT INTO itens_ordem_corte (ordem_corte_id, bobina_id, produto_id, metragem_cortada, observacoes)
             VALUES (?, ?, ?, ?, ?)`,
            [ordem_id, bobina_id, bobina.produto_id, metragem_cortada, observacoes || null]
        );

        // Atualizar metragem_atual da bobina
        const nova_metragem = metragem_disponivel - metragem_cortada;
        await db.query(
            `UPDATE bobinas SET metragem_atual = ? WHERE id = ?`,
            [nova_metragem, bobina_id]
        );

        return res.json({
            success: true,
            message: 'Corte registrado com sucesso',
            data: {
                ordem_numero: numero_ordem,
                bobina_codigo: bobina.codigo_interno,
                metragem_cortada: metragem_cortada,
                metragem_restante: nova_metragem.toFixed(2)
            }
        });

    } catch (error) {
        console.error('❌ Erro ao registrar corte mobile:', error);
        return res.status(500).json({
            success: false,
            message: 'Erro ao registrar corte'
        });
    }
});

module.exports = router;
