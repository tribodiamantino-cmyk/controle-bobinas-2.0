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

        // Historico: Entrada + cortes de alocacoes e itens_ordem_corte
        const historico = [];

        historico.push({
            tipo: 'ENTRADA',
            data_movimentacao: bobina.data_entrada,
            metragem: bobina.metragem_inicial,
            observacoes: bobina.nota_fiscal ? `Entrada - NF: ${bobina.nota_fiscal}` : 'Entrada'
        });

        // Buscar cortes de alocações (sistema desktop)
        try {
            const [alocacoes] = await db.query(
                `SELECT 
                    ac.data_alocacao AS data_movimentacao,
                    ac.metragem_alocada AS metragem,
                    pc.codigo_plano,
                    pc.cliente,
                    ac.confirmado
                 FROM alocacoes_corte ac
                 JOIN itens_plano_corte ipc ON ipc.id = ac.item_plano_corte_id
                 JOIN planos_corte pc ON pc.id = ipc.plano_corte_id
                 WHERE ac.bobina_id = ?
                 ORDER BY ac.data_alocacao DESC`,
                [bobinaId]
            );

            alocacoes.forEach(a => {
                historico.push({
                    tipo: a.confirmado ? 'CORTE' : 'RESERVA',
                    data_movimentacao: a.data_movimentacao,
                    metragem: a.metragem,
                    observacoes: `${a.codigo_plano} - ${a.cliente}${a.confirmado ? '' : ' (pendente)'}`
                });
            });
        } catch (err) {
            console.warn('⚠️ Histórico de alocações não disponível:', err.message);
        }

        // Buscar cortes mobile (tabela itens_ordem_corte)
        try {
            const [cortes] = await db.query(
                `SELECT 
                    i.data_corte AS data_movimentacao,
                    i.metragem_cortada AS metragem,
                    i.observacoes,
                    oc.numero_ordem
                 FROM itens_ordem_corte i
                 JOIN ordens_corte oc ON oc.id = i.ordem_corte_id
                 WHERE i.bobina_id = ?
                 ORDER BY i.data_corte DESC`,
                [bobinaId]
            );

            cortes.forEach(c => {
                historico.push({
                    tipo: 'CORTE',
                    data_movimentacao: c.data_movimentacao,
                    metragem: c.metragem,
                    observacoes: c.numero_ordem ? `Ordem: ${c.numero_ordem}` : (c.observacoes || '')
                });
            });
        } catch (err) {
            console.warn('⚠️ Histórico de cortes mobile não disponível:', err.message);
        }

        // Ordenar histórico por data (mais recentes primeiro)
        historico.sort((a, b) => new Date(b.data_movimentacao) - new Date(a.data_movimentacao));

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

// ========== GET: Ordens Em Produção ==========
// Retorna planos de corte com status 'Em Andamento' para validação no chão de fábrica
router.get('/ordens-producao', async (req, res) => {
    try {
        // Buscar planos de corte em produção (sistema desktop usa planos_corte)
        const [planos] = await db.query(
            `SELECT 
                pc.id,
                pc.codigo_plano AS numero_ordem,
                pc.status,
                pc.cliente,
                pc.aviario,
                pc.data_criacao,
                pc.data_conclusao
            FROM planos_corte pc
            WHERE pc.status IN ('Em Andamento', 'Pendente')
            ORDER BY pc.data_criacao DESC
            LIMIT 20`
        );

        console.log('📋 Planos encontrados:', planos.length);

        // Para cada plano, buscar os itens com alocações pendentes
        for (let plano of planos) {
            const [itens] = await db.query(
                `SELECT 
                    ipc.id AS item_id,
                    ipc.produto_id,
                    ipc.metragem AS metragem_solicitada,
                    ipc.observacoes AS item_obs,
                    ac.id AS alocacao_id,
                    ac.bobina_id,
                    ac.retalho_id,
                    ac.tipo_origem,
                    ac.metragem_alocada,
                    ac.confirmado,
                    b.codigo_interno AS bobina_codigo,
                    b.metragem_atual,
                    b.localizacao_atual,
                    p.codigo AS produto_codigo,
                    c.nome_cor
                FROM itens_plano_corte ipc
                LEFT JOIN alocacoes_corte ac ON ac.item_plano_corte_id = ipc.id
                LEFT JOIN bobinas b ON ac.bobina_id = b.id
                LEFT JOIN produtos p ON ipc.produto_id = p.id
                LEFT JOIN configuracoes_cores c ON p.cor_id = c.id
                WHERE ipc.plano_corte_id = ?
                  AND (ac.confirmado IS NULL OR ac.confirmado = FALSE)
                ORDER BY ipc.ordem`,
                [plano.id]
            );
            
            // Agrupar por item
            plano.itens = itens.filter(i => i.alocacao_id !== null);
            plano.qtd_itens = plano.itens.length;
            plano.qtd_total = itens.length;
            
            // Adicionar info de cliente/aviário ao observações
            plano.observacoes = `${plano.cliente || ''} ${plano.aviario ? '- ' + plano.aviario : ''}`.trim();
        }

        // Ordenar para que as com itens pendentes venham primeiro
        planos.sort((a, b) => b.qtd_itens - a.qtd_itens);

        return res.json({
            success: true,
            data: planos
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

// ========== POST: Validar Item de Ordem (confirmar corte de alocação) ==========
router.post('/validar-item', async (req, res) => {
    try {
        const { item_id, bobina_id, metragem_cortada, observacoes } = req.body;

        // item_id aqui é na verdade alocacao_id ou item_plano_corte_id
        // Vamos aceitar alocacao_id diretamente
        if (!item_id || !bobina_id || !metragem_cortada) {
            return res.status(400).json({
                success: false,
                message: 'Item, bobina e metragem são obrigatórios'
            });
        }

        // Buscar alocação
        const [alocacoes] = await db.query(
            `SELECT ac.*, pc.codigo_plano, pc.status AS plano_status, pc.id AS plano_id
             FROM alocacoes_corte ac
             JOIN itens_plano_corte ipc ON ipc.id = ac.item_plano_corte_id
             JOIN planos_corte pc ON pc.id = ipc.plano_corte_id
             WHERE ac.id = ?`,
            [item_id]
        );

        if (alocacoes.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Alocação não encontrada'
            });
        }

        const alocacao = alocacoes[0];

        // Verificar se bobina corresponde
        if (alocacao.bobina_id != bobina_id) {
            return res.status(400).json({
                success: false,
                message: 'Bobina escaneada não corresponde à alocação'
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

        // Marcar alocação como confirmada
        await db.query(
            `UPDATE alocacoes_corte SET confirmado = TRUE WHERE id = ?`,
            [item_id]
        );

        // Atualizar metragem da bobina (descontar o corte e a reserva)
        const nova_metragem = metragem_disponivel - metragem_cortada;
        const nova_reserva = Math.max(0, Number(bobina.metragem_reservada || 0) - metragem_cortada);

        await db.query(
            `UPDATE bobinas 
             SET metragem_atual = ?,
                 metragem_reservada = ?
             WHERE id = ?`,
            [nova_metragem, nova_reserva, bobina_id]
        );

        // Verificar se todas alocações do plano foram confirmadas
        const [pendentes] = await db.query(
            `SELECT COUNT(*) as cnt 
             FROM alocacoes_corte ac
             JOIN itens_plano_corte ipc ON ipc.id = ac.item_plano_corte_id
             WHERE ipc.plano_corte_id = ? AND ac.confirmado = FALSE`,
            [alocacao.plano_id]
        );

        if (pendentes[0].cnt === 0) {
            // Todas alocações confirmadas - atualizar status do plano
            await db.query(
                `UPDATE planos_corte 
                 SET status = 'Concluída', data_conclusao = NOW()
                 WHERE id = ?`,
                [alocacao.plano_id]
            );
        }

        return res.json({
            success: true,
            message: 'Corte validado com sucesso!',
            data: {
                ordem_numero: alocacao.codigo_plano,
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

// ========== GET: Detalhes do Retalho ==========
router.get('/retalho/:id', async (req, res) => {
    try {
        const retalhoId = req.params.id;

        const [rows] = await db.query(
            `SELECT 
                r.id,
                r.codigo_retalho,
                r.metragem,
                r.localizacao_atual,
                r.status,
                r.data_entrada,
                r.observacoes,
                r.bobina_origem_id,
                r.produto_id,
                b.codigo_interno AS bobina_codigo,
                p.codigo AS produto_codigo,
                p.fabricante,
                c.nome_cor,
                g.gramatura
            FROM retalhos r
            LEFT JOIN produtos p ON r.produto_id = p.id
            LEFT JOIN bobinas b ON r.bobina_origem_id = b.id
            LEFT JOIN configuracoes_cores c ON p.cor_id = c.id
            LEFT JOIN configuracoes_gramaturas g ON p.gramatura_id = g.id
            WHERE r.id = ?`,
            [retalhoId]
        );

        if (!rows || rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Retalho não encontrado' });
        }

        const retalho = rows[0];

        return res.json({ success: true, data: retalho });
    } catch (error) {
        console.error('❌ Erro ao buscar retalho ID:', req.params.id);
        console.error('❌ Detalhes do erro:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Erro ao buscar dados do retalho',
            error: error.message
        });
    }
});

module.exports = router;