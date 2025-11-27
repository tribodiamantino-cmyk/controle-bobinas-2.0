const express = require('express');
const router = express.Router();
const db = require('../config/database');

// ========== GET: Detalhes da Bobina com Histórico ==========
router.get('/bobina/:id', async (req, res) => {
    try {
        const bobinaId = req.params.id;

        // Query direta nas tabelas (não depende de view que pode não existir)
        const [rows] = await db.query(
            `SELECT 
                b.id,
                b.codigo_interno,
                b.metragem_inicial,
                b.metragem_atual,
                b.metragem_reservada,
                b.localizacao_atual,
                b.status,
                b.data_entrada,
                b.nota_fiscal,
                b.observacoes,
                b.produto_id,
                b.loja,
                p.codigo,
                p.fabricante,
                p.largura_final,
                c.nome_cor,
                g.gramatura
            FROM bobinas b
            JOIN produtos p ON b.produto_id = p.id
            LEFT JOIN configuracoes_cores c ON p.cor_id = c.id
            LEFT JOIN configuracoes_gramaturas g ON p.gramatura_id = g.id
            WHERE b.id = ?`,
            [bobinaId]
        );

        if (!rows || rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Bobina não encontrada' });
        }

        const bobina = rows[0];

        // Calcular total cortado
        const total_cortado = Number(bobina.metragem_inicial || 0) - Number(bobina.metragem_atual || 0);
        bobina.total_cortado = Number(total_cortado.toFixed(2));

        // Historico simplificado: Entrada + cortes
        const historico = [];

        historico.push({
            tipo: 'ENTRADA',
            data_movimentacao: bobina.data_entrada,
            metragem: bobina.metragem_inicial,
            observacoes: bobina.nota_fiscal ? `Entrada - NF: ${bobina.nota_fiscal}` : 'Entrada'
        });

        // Tentar buscar cortes (tabela itens_ordem_corte)
        try {
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
            console.warn('⚠️ Histórico de cortes não disponível:', err.message);
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
            error: error.message
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

// ========== GET: Ordens Em Produção ==========
// Retorna ordens com status 'Em Produção' para validação no chão de fábrica
router.get('/ordens-producao', async (req, res) => {
    try {
        // Buscar ordens em produção (status: Em Produção ou Em Andamento)
        const [ordens] = await db.query(
            `SELECT 
                oc.id,
                oc.numero_ordem,
                oc.status,
                oc.criado_por,
                oc.data_criacao,
                oc.observacoes
            FROM ordens_corte oc
            WHERE oc.status IN ('Em Produção', 'Em Andamento', 'Pendente')
            ORDER BY oc.data_criacao DESC
            LIMIT 20`
        );

        // Para cada ordem, buscar os itens pendentes
        for (let ordem of ordens) {
            const [itens] = await db.query(
                `SELECT 
                    i.id AS item_id,
                    i.bobina_id,
                    i.produto_id,
                    i.metragem_cortada AS metragem_solicitada,
                    i.status AS item_status,
                    i.observacoes AS item_obs,
                    b.codigo_interno AS bobina_codigo,
                    b.metragem_atual,
                    b.localizacao_atual,
                    p.codigo AS produto_codigo,
                    c.nome_cor
                FROM itens_ordem_corte i
                LEFT JOIN bobinas b ON i.bobina_id = b.id
                LEFT JOIN produtos p ON i.produto_id = p.id
                LEFT JOIN configuracoes_cores c ON p.cor_id = c.id
                WHERE i.ordem_corte_id = ?
                  AND (i.status IS NULL OR i.status != 'Concluído')
                ORDER BY i.id`,
                [ordem.id]
            );
            ordem.itens = itens;
            ordem.qtd_itens = itens.length;
        }

        // Filtrar ordens que têm itens pendentes
        const ordensComItens = ordens.filter(o => o.itens.length > 0);

        return res.json({
            success: true,
            data: ordensComItens
        });

    } catch (error) {
        console.error('❌ Erro ao buscar ordens em produção:', error);
        return res.status(500).json({
            success: false,
            message: 'Erro ao buscar ordens em produção',
            error: error.message
        });
    }
});

// ========== POST: Validar Item de Ordem (confirmar corte) ==========
router.post('/validar-item', async (req, res) => {
    try {
        const { item_id, bobina_id, metragem_cortada, observacoes } = req.body;

        if (!item_id || !bobina_id || !metragem_cortada) {
            return res.status(400).json({
                success: false,
                message: 'Item, bobina e metragem são obrigatórios'
            });
        }

        // Buscar item da ordem
        const [itens] = await db.query(
            `SELECT i.*, oc.numero_ordem, oc.status AS ordem_status
             FROM itens_ordem_corte i
             JOIN ordens_corte oc ON i.ordem_corte_id = oc.id
             WHERE i.id = ?`,
            [item_id]
        );

        if (itens.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Item não encontrado'
            });
        }

        const item = itens[0];

        // Verificar se bobina corresponde
        if (item.bobina_id != bobina_id) {
            return res.status(400).json({
                success: false,
                message: 'Bobina escaneada não corresponde ao item da ordem'
            });
        }

        // Buscar bobina
        const [bobinas] = await db.query(
            `SELECT id, metragem_atual, metragem_reservada FROM bobinas WHERE id = ?`,
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

        // Atualizar item como concluído
        await db.query(
            `UPDATE itens_ordem_corte 
             SET status = 'Concluído', 
                 metragem_cortada = ?,
                 data_corte = NOW(),
                 observacoes = CONCAT(IFNULL(observacoes, ''), ' [Mobile: ', IFNULL(?, ''), ']')
             WHERE id = ?`,
            [metragem_cortada, observacoes, item_id]
        );

        // Atualizar metragem da bobina
        const nova_metragem = metragem_disponivel - metragem_cortada;
        const nova_reserva = Math.max(0, Number(bobina.metragem_reservada || 0) - metragem_cortada);

        await db.query(
            `UPDATE bobinas 
             SET metragem_atual = ?,
                 metragem_reservada = ?
             WHERE id = ?`,
            [nova_metragem, nova_reserva, bobina_id]
        );

        // Verificar se todos itens da ordem foram concluídos
        const [pendentes] = await db.query(
            `SELECT COUNT(*) as cnt FROM itens_ordem_corte 
             WHERE ordem_corte_id = ? AND (status IS NULL OR status != 'Concluído')`,
            [item.ordem_corte_id]
        );

        if (pendentes[0].cnt === 0) {
            // Todos itens concluídos - atualizar status da ordem
            await db.query(
                `UPDATE ordens_corte 
                 SET status = 'Concluída', data_conclusao = NOW()
                 WHERE id = ?`,
                [item.ordem_corte_id]
            );
        }

        return res.json({
            success: true,
            message: 'Item validado com sucesso!',
            data: {
                ordem_numero: item.numero_ordem,
                metragem_cortada,
                metragem_restante: nova_metragem.toFixed(2),
                ordem_concluida: pendentes[0].cnt === 0
            }
        });

    } catch (error) {
        console.error('❌ Erro ao validar item:', error);
        return res.status(500).json({
            success: false,
            message: 'Erro ao validar item',
            error: error.message
        });
    }
});
