const express = require('express');
const router = express.Router();
const db = require('../config/database');

router.get('/bobina/:id', async (req, res) => {
    try {
        const bobinaId = req.params.id;
        const [rows] = await db.query(
            'SELECT b.id, b.codigo_interno, b.metragem_inicial, b.metragem_atual, b.metragem_reservada, b.localizacao_atual, b.status, b.data_entrada, b.nota_fiscal, b.observacoes, b.produto_id, b.loja, p.codigo, p.fabricante, p.largura_final, c.nome_cor, g.gramatura FROM bobinas b JOIN produtos p ON b.produto_id = p.id LEFT JOIN configuracoes_cores c ON p.cor_id = c.id LEFT JOIN configuracoes_gramaturas g ON p.gramatura_id = g.id WHERE b.id = ?',
            [bobinaId]
        );
        if (!rows || rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Bobina nao encontrada' });
        }
        const bobina = rows[0];
        const total_cortado = Number(bobina.metragem_inicial || 0) - Number(bobina.metragem_atual || 0);
        bobina.total_cortado = Number(total_cortado.toFixed(2));
        const historico = [];
        historico.push({ tipo: 'ENTRADA', data_movimentacao: bobina.data_entrada, metragem: bobina.metragem_inicial, observacoes: bobina.nota_fiscal ? 'NF: ' + bobina.nota_fiscal : 'Entrada' });
        try {
            const [cortes] = await db.query('SELECT i.data_corte AS data_movimentacao, i.metragem_cortada AS metragem, i.observacoes, oc.numero_ordem FROM itens_ordem_corte i JOIN ordens_corte oc ON oc.id = i.ordem_corte_id WHERE i.bobina_id = ? ORDER BY i.data_corte DESC', [bobinaId]);
            cortes.forEach(c => { historico.push({ tipo: 'CORTE', data_movimentacao: c.data_movimentacao, metragem: c.metragem, observacoes: c.numero_ordem ? 'Ordem: ' + c.numero_ordem : (c.observacoes || '') }); });
        } catch (err) {}
        historico.sort((a, b) => new Date(b.data_movimentacao) - new Date(a.data_movimentacao));
        bobina.historico = historico;
        return res.json({ success: true, data: bobina });
    } catch (error) {
        console.error('Erro bobina:', error.message);
        return res.status(500).json({ success: false, message: 'Erro ao buscar bobina', error: error.message });
    }
});

// Debug: ver todas as ordens no banco
router.get('/debug-ordens', async (req, res) => {
    try {
        let result = {};
        
        // Tentar ordens_corte
        try {
            const [ordens] = await db.query('SELECT id, numero_ordem, status, data_criacao FROM ordens_corte ORDER BY id DESC LIMIT 10');
            result.ordens_corte = ordens;
        } catch (e) { result.ordens_corte_erro = e.message; }
        
        // Tentar planos_corte
        try {
            const [planos] = await db.query('SELECT id, codigo_plano, status, cliente FROM planos_corte ORDER BY id DESC LIMIT 10');
            result.planos_corte = planos;
        } catch (e) { result.planos_corte_erro = e.message; }
        
        // Contar bobinas
        try {
            const [count] = await db.query('SELECT COUNT(*) as total FROM bobinas');
            result.total_bobinas = count[0].total;
        } catch (e) { result.bobinas_erro = e.message; }
        
        // Listar tabelas
        try {
            const [tables] = await db.query('SHOW TABLES');
            result.tabelas = tables;
        } catch (e) { result.tabelas_erro = e.message; }
        
        return res.json({ success: true, ...result });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
});

router.get('/ordens-producao', async (req, res) => {
    try {
        let ordens = [];
        try {
            const [planos] = await db.query('SELECT pc.id, pc.codigo_plano AS numero_ordem, pc.status, pc.cliente, pc.aviario, pc.data_criacao FROM planos_corte pc WHERE pc.status IN (\'Em Andamento\', \'Pendente\') ORDER BY pc.data_criacao DESC LIMIT 20');
            for (let plano of planos) {
                const [itens] = await db.query('SELECT ipc.id AS item_id, ac.id AS alocacao_id, ac.bobina_id, ac.metragem_alocada, b.codigo_interno AS bobina_codigo, b.metragem_atual, b.localizacao_atual, p.codigo AS produto_codigo, c.nome_cor FROM itens_plano_corte ipc LEFT JOIN alocacoes_corte ac ON ac.item_plano_corte_id = ipc.id LEFT JOIN bobinas b ON ac.bobina_id = b.id LEFT JOIN produtos p ON ipc.produto_id = p.id LEFT JOIN configuracoes_cores c ON p.cor_id = c.id WHERE ipc.plano_corte_id = ? AND (ac.confirmado IS NULL OR ac.confirmado = FALSE) ORDER BY ipc.ordem', [plano.id]);
                plano.itens = itens.filter(i => i.alocacao_id !== null);
                plano.qtd_itens = plano.itens.length;
                plano.qtd_total = itens.length;
                plano.observacoes = (plano.cliente || '') + (plano.aviario ? ' - ' + plano.aviario : '');
                plano.fonte = 'planos';
            }
            ordens = planos;
        } catch (err) { console.log('planos_corte nao disponivel:', err.message); }
        if (ordens.length === 0) {
            try {
                // Buscar ordens que NAO estao Concluidas ou Canceladas
                const [ordensCorte] = await db.query('SELECT oc.id, oc.numero_ordem, oc.status, oc.criado_por, oc.data_criacao, oc.observacoes FROM ordens_corte oc WHERE oc.status NOT IN (\'Concluída\', \'Cancelada\') ORDER BY oc.data_criacao DESC LIMIT 20');
                for (let ordem of ordensCorte) {
                    const [itens] = await db.query('SELECT i.id AS item_id, i.id AS alocacao_id, i.bobina_id, i.metragem_cortada AS metragem_alocada, b.codigo_interno AS bobina_codigo, b.metragem_atual, b.localizacao_atual, p.codigo AS produto_codigo, c.nome_cor FROM itens_ordem_corte i LEFT JOIN bobinas b ON i.bobina_id = b.id LEFT JOIN produtos p ON i.produto_id = p.id LEFT JOIN configuracoes_cores c ON p.cor_id = c.id WHERE i.ordem_corte_id = ? ORDER BY i.id', [ordem.id]);
                    ordem.itens = itens;
                    ordem.qtd_itens = itens.length;
                    ordem.qtd_total = itens.length;
                    ordem.fonte = 'ordens';
                }
                ordens = ordensCorte;
            } catch (err2) { console.error('Erro ordens_corte:', err2.message); }
        }
        ordens.sort((a, b) => b.qtd_itens - a.qtd_itens);
        return res.json({ success: true, data: ordens });
    } catch (error) {
        console.error('Erro ordens:', error);
        return res.status(500).json({ success: false, message: 'Erro ao buscar ordens', error: error.message });
    }
});

router.post('/validar-item', async (req, res) => {
    try {
        const { item_id, bobina_id, metragem_cortada } = req.body;
        if (!item_id || !bobina_id || !metragem_cortada) {
            return res.status(400).json({ success: false, message: 'Item, bobina e metragem obrigatorios' });
        }
        const [bobinas] = await db.query('SELECT id, metragem_atual, metragem_reservada FROM bobinas WHERE id = ?', [bobina_id]);
        if (bobinas.length === 0) {
            return res.status(404).json({ success: false, message: 'Bobina nao encontrada' });
        }
        const bobina = bobinas[0];
        const metragem_disponivel = Number(bobina.metragem_atual);
        if (metragem_cortada > metragem_disponivel) {
            return res.status(400).json({ success: false, message: 'Metragem insuficiente. Disponivel: ' + metragem_disponivel.toFixed(2) + 'm' });
        }
        const nova_metragem = metragem_disponivel - metragem_cortada;
        const nova_reserva = Math.max(0, Number(bobina.metragem_reservada || 0) - metragem_cortada);
        await db.query('UPDATE bobinas SET metragem_atual = ?, metragem_reservada = ? WHERE id = ?', [nova_metragem, nova_reserva, bobina_id]);
        return res.json({ success: true, message: 'Corte validado!', data: { metragem_cortada, metragem_restante: nova_metragem.toFixed(2) } });
    } catch (error) {
        console.error('Erro validar:', error);
        return res.status(500).json({ success: false, message: 'Erro ao validar item', error: error.message });
    }
});

router.get('/retalho/:id', async (req, res) => {
    try {
        const retalhoId = req.params.id;
        const [rows] = await db.query('SELECT r.id, r.codigo_retalho, r.metragem, r.localizacao_atual, r.status, r.data_entrada, r.observacoes, r.bobina_origem_id, r.produto_id, b.codigo_interno AS bobina_codigo, p.codigo AS produto_codigo, p.fabricante, c.nome_cor, g.gramatura FROM retalhos r LEFT JOIN produtos p ON r.produto_id = p.id LEFT JOIN bobinas b ON r.bobina_origem_id = b.id LEFT JOIN configuracoes_cores c ON p.cor_id = c.id LEFT JOIN configuracoes_gramaturas g ON p.gramatura_id = g.id WHERE r.id = ?', [retalhoId]);
        if (!rows || rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Retalho nao encontrado' });
        }
        return res.json({ success: true, data: rows[0] });
    } catch (error) {
        console.error('Erro retalho:', error.message);
        return res.status(500).json({ success: false, message: 'Erro ao buscar retalho', error: error.message });
    }
});

module.exports = router;
