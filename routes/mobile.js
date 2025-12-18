const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { normalizarLocacao, gerarVariacoesLocacao, validarLocacao } = require('../utils/locacao');

/**
 * Normaliza código compacto para formato completo (com zeros à esquerda)
 * BOB-PLA-1 → BOB-PLA-000001
 * RET-CIA-42 → RET-CIA-000042
 * COR-PLA-1-1 → COR-PLA-001-01
 */
function normalizarCodigoBarras(codigo) {
    if (!codigo) return codigo;
    
    // BOB-PLA-1 → BOB-PLA-000001
    if (/^BOB-[A-Z]{3}-\d+$/i.test(codigo)) {
        const partes = codigo.split('-');
        const numero = partes[2].padStart(6, '0');
        return `${partes[0].toUpperCase()}-${partes[1].toUpperCase()}-${numero}`;
    }
    
    // RET-CIA-42 → RET-CIA-000042
    if (/^RET-[A-Z]{3}-\d+$/i.test(codigo)) {
        const partes = codigo.split('-');
        const numero = partes[2].padStart(6, '0');
        return `${partes[0].toUpperCase()}-${partes[1].toUpperCase()}-${numero}`;
    }
    
    // COR-PLA-1-1 → COR-PLA-001-01
    if (/^COR-[A-Z]{3}-\d+-\d+$/i.test(codigo)) {
        const partes = codigo.split('-');
        const plano = partes[2].padStart(3, '0');
        const seq = partes[3].padStart(2, '0');
        return `${partes[0].toUpperCase()}-${partes[1].toUpperCase()}-${plano}-${seq}`;
    }
    
    // PDC-PLA-1 → PDC-PLA-001
    if (/^PDC-[A-Z]{3}-\d+$/i.test(codigo)) {
        const partes = codigo.split('-');
        const numero = partes[2].padStart(3, '0');
        return `${partes[0].toUpperCase()}-${partes[1].toUpperCase()}-${numero}`;
    }
    
    return codigo.toUpperCase();
}

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

// ========================================
// MODO TESTE - Plano fictício para testar o fluxo
// ========================================
router.get('/teste/plano', (req, res) => {
    // Dados fictícios para teste do fluxo mobile
    const produtos = [
        { id: 1, codigo: 'AZUL-150-500', cor: 'Azul', gramatura: '150g', largura: '5.00m' },
        { id: 2, codigo: 'VERDE-180-600', cor: 'Verde', gramatura: '180g', largura: '6.00m' },
        { id: 3, codigo: 'AMAR-200-500', cor: 'Amarelo', gramatura: '200g', largura: '5.00m' }
    ];
    
    const bobinas = [
        { id: 101, codigo: 'BOB-TEST-001', produto: produtos[0], metragem: 250, localizacao: '1-A-1' },
        { id: 102, codigo: 'BOB-TEST-002', produto: produtos[1], metragem: 300, localizacao: '2-B-2' },
        { id: 103, codigo: 'BOB-TEST-003', produto: produtos[2], metragem: 200, localizacao: '3-C-3' }
    ];
    
    const planoTeste = {
        id: 9999,
        numero_ordem: 'TESTE-2025-001',
        codigo_plano: 'TESTE-2025-001',
        status: 'em_producao',
        cliente: 'TESTE MOBILE',
        aviario: 'Galpão de Testes',
        observacoes: 'Plano fictício para testar o fluxo do app mobile',
        data_criacao: new Date().toISOString(),
        fonte: 'teste',
        qtd_itens: 10,
        qtd_total: 10,
        itens: [
            { item_id: 1, alocacao_id: 1, bobina_id: 101, origem_id: 101, tipo: 'bobina', origem_codigo: 'BOB-TEST-001', metragem_alocada: 25, metragem_atual: 250, localizacao_atual: '1-A-1', produto_codigo: 'AZUL-150-500', nome_cor: 'Azul' },
            { item_id: 2, alocacao_id: 2, bobina_id: 102, origem_id: 102, tipo: 'bobina', origem_codigo: 'BOB-TEST-002', metragem_alocada: 30, metragem_atual: 300, localizacao_atual: '2-B-2', produto_codigo: 'VERDE-180-600', nome_cor: 'Verde' },
            { item_id: 3, alocacao_id: 3, bobina_id: 103, origem_id: 103, tipo: 'bobina', origem_codigo: 'BOB-TEST-003', metragem_alocada: 20, metragem_atual: 200, localizacao_atual: '3-C-3', produto_codigo: 'AMAR-200-500', nome_cor: 'Amarelo' },
            { item_id: 4, alocacao_id: 4, bobina_id: 101, origem_id: 101, tipo: 'bobina', origem_codigo: 'BOB-TEST-001', metragem_alocada: 35, metragem_atual: 250, localizacao_atual: '1-A-1', produto_codigo: 'AZUL-150-500', nome_cor: 'Azul' },
            { item_id: 5, alocacao_id: 5, bobina_id: 102, origem_id: 102, tipo: 'bobina', origem_codigo: 'BOB-TEST-002', metragem_alocada: 28, metragem_atual: 300, localizacao_atual: '2-B-2', produto_codigo: 'VERDE-180-600', nome_cor: 'Verde' },
            { item_id: 6, alocacao_id: 6, bobina_id: 103, origem_id: 103, tipo: 'bobina', origem_codigo: 'BOB-TEST-003', metragem_alocada: 22, metragem_atual: 200, localizacao_atual: '3-C-3', produto_codigo: 'AMAR-200-500', nome_cor: 'Amarelo' },
            { item_id: 7, alocacao_id: 7, bobina_id: 101, origem_id: 101, tipo: 'bobina', origem_codigo: 'BOB-TEST-001', metragem_alocada: 40, metragem_atual: 250, localizacao_atual: '1-A-1', produto_codigo: 'AZUL-150-500', nome_cor: 'Azul' },
            { item_id: 8, alocacao_id: 8, bobina_id: 102, origem_id: 102, tipo: 'bobina', origem_codigo: 'BOB-TEST-002', metragem_alocada: 32, metragem_atual: 300, localizacao_atual: '2-B-2', produto_codigo: 'VERDE-180-600', nome_cor: 'Verde' },
            { item_id: 9, alocacao_id: 9, bobina_id: 103, origem_id: 103, tipo: 'bobina', origem_codigo: 'BOB-TEST-003', metragem_alocada: 18, metragem_atual: 200, localizacao_atual: '3-C-3', produto_codigo: 'AMAR-200-500', nome_cor: 'Amarelo' },
            { item_id: 10, alocacao_id: 10, bobina_id: 101, origem_id: 101, tipo: 'bobina', origem_codigo: 'BOB-TEST-001', metragem_alocada: 30, metragem_atual: 250, localizacao_atual: '1-A-1', produto_codigo: 'AZUL-150-500', nome_cor: 'Azul' }
        ]
    };
    
    return res.json({ success: true, data: [planoTeste] });
});

// Validar item de TESTE (não altera banco real)
router.post('/teste/validar-item', (req, res) => {
    const { item_id, metragem_cortada } = req.body;
    
    // Simula validação bem-sucedida
    return res.json({ 
        success: true, 
        message: '✅ [TESTE] Corte validado com sucesso!', 
        data: { 
            item_id,
            metragem_cortada, 
            metragem_restante: '999.00',
            modo: 'teste'
        } 
    });
});

// Bobina de TESTE
router.get('/teste/bobina/:id', (req, res) => {
    const id = parseInt(req.params.id);
    
    const bobinas = {
        101: { id: 101, codigo_interno: 'BOB-TEST-001', metragem_atual: 250, localizacao_atual: '1-A-1', nome_cor: 'Azul', produto_codigo: 'AZUL-150-500' },
        102: { id: 102, codigo_interno: 'BOB-TEST-002', metragem_atual: 300, localizacao_atual: '2-B-2', nome_cor: 'Verde', produto_codigo: 'VERDE-180-600' },
        103: { id: 103, codigo_interno: 'BOB-TEST-003', metragem_atual: 200, localizacao_atual: '3-C-3', nome_cor: 'Amarelo', produto_codigo: 'AMAR-200-500' }
    };
    
    if (bobinas[id]) {
        return res.json({ success: true, data: bobinas[id] });
    }
    
    return res.status(404).json({ success: false, message: 'Bobina de teste não encontrada' });
});

// Plano de TESTE individual (para finalização)
router.get('/teste/plano/:id', (req, res) => {
    const planoTeste = {
        id: 9999,
        codigo_plano: 'TESTE-2025-001',
        cliente: 'TESTE MOBILE',
        aviario: 'Galpão de Testes',
        status: 'em_producao',
        itens: [
            { id: 1, produto_codigo: 'AZUL-150-500', metragem: 25 },
            { id: 2, produto_codigo: 'VERDE-180-600', metragem: 30 },
            { id: 3, produto_codigo: 'AMAR-200-500', metragem: 20 }
        ]
    };
    
    return res.json({ success: true, data: planoTeste });
});

// Locação de TESTE - busca pelo código no formato N-X-N
router.get('/teste/locacao/:codigo', (req, res) => {
    const codigo = req.params.codigo;
    
    const locacoes = {
        '1-A-1': { id: 201, codigo: '1-A-1', descricao: 'Corredor A - Prateleira 1', ativa: true },
        '2-B-2': { id: 202, codigo: '2-B-2', descricao: 'Corredor B - Prateleira 2', ativa: true },
        '3-C-3': { id: 203, codigo: '3-C-3', descricao: 'Corredor C - Prateleira 3', ativa: true }
    };
    
    if (locacoes[codigo]) {
        return res.json({ success: true, data: locacoes[codigo] });
    }
    
    return res.status(404).json({ success: false, message: 'Locação de teste não encontrada' });
});

// Finalizar plano de TESTE
router.post('/teste/plano/:id/finalizar', (req, res) => {
    const { locacoes_ids } = req.body;
    
    console.log('🧪 [TESTE] Finalizando plano com locações:', locacoes_ids);
    
    return res.json({ 
        success: true, 
        message: '✅ [TESTE] Plano finalizado com sucesso!',
        data: {
            plano_id: req.params.id,
            locacoes_ids,
            status: 'finalizado',
            modo: 'teste'
        }
    });
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
            console.log('📱 Buscando ordens de produção...');
            const [planos] = await db.query(`
                SELECT pc.id, pc.codigo_plano AS numero_ordem, pc.status, pc.cliente, pc.aviario, pc.data_criacao 
                FROM planos_corte pc 
                WHERE pc.status = 'em_producao'
                ORDER BY pc.data_criacao DESC 
                LIMIT 20
            `);
            console.log(`📱 Encontrados ${planos.length} planos em produção`);
            for (let plano of planos) {
                // Buscar itens com alocações (bobina OU retalho)
                const [itens] = await db.query(`
                    SELECT 
                        ipc.id AS item_id,
                        ac.id AS alocacao_id,
                        ac.tipo_origem,
                        ac.bobina_id,
                        ac.retalho_id,
                        ac.metragem_alocada,
                        COALESCE(b.codigo_interno, r.codigo_retalho) AS origem_codigo,
                        COALESCE(b.metragem_atual, r.metragem) AS metragem_atual,
                        COALESCE(b.localizacao_atual, r.localizacao_atual) AS localizacao_atual,
                        p.codigo AS produto_codigo,
                        c.nome_cor
                    FROM itens_plano_corte ipc
                    LEFT JOIN alocacoes_corte ac ON ac.item_plano_corte_id = ipc.id
                    LEFT JOIN bobinas b ON ac.bobina_id = b.id
                    LEFT JOIN retalhos r ON ac.retalho_id = r.id
                    LEFT JOIN produtos p ON ipc.produto_id = p.id
                    LEFT JOIN configuracoes_cores c ON p.cor_id = c.id
                    WHERE ipc.plano_corte_id = ?
                      AND (ac.confirmado IS NULL OR ac.confirmado = FALSE)
                    ORDER BY ipc.ordem
                `, [plano.id]);
                
                // Buscar cortes já realizados para este plano
                let cortesRealizados = [];
                try {
                    // Tentar com campos novos (após migration 028)
                    const [cortes] = await db.query(`
                        SELECT 
                            cr.id AS corte_id,
                            cr.codigo_corte,
                            cr.item_plano_corte_id,
                            cr.metragem_cortada,
                            cr.placa_origem,
                            cr.codigo_origem,
                            cr.data_corte,
                            cr.operador_nome,
                            p.codigo AS produto_codigo,
                            c.nome_cor,
                            g.gramatura
                        FROM cortes_realizados cr
                        LEFT JOIN produtos p ON cr.produto_id = p.id
                        LEFT JOIN configuracoes_cores c ON p.cor_id = c.id
                        LEFT JOIN configuracoes_gramaturas g ON p.gramatura_id = g.id
                        WHERE cr.plano_corte_id = ?
                        ORDER BY cr.data_corte DESC
                    `, [plano.id]);
                    cortesRealizados = cortes;
                } catch (errCortes) {
                    // Fallback sem campos novos
                    console.log('⚠️ Usando query de cortes sem campos novos');
                    const [cortes] = await db.query(`
                        SELECT 
                            cr.id AS corte_id,
                            cr.codigo_corte,
                            cr.item_plano_corte_id,
                            cr.metragem_cortada,
                            cr.data_corte,
                            cr.operador_nome,
                            p.codigo AS produto_codigo,
                            c.nome_cor,
                            g.gramatura
                        FROM cortes_realizados cr
                        LEFT JOIN produtos p ON cr.produto_id = p.id
                        LEFT JOIN configuracoes_cores c ON p.cor_id = c.id
                        LEFT JOIN configuracoes_gramaturas g ON p.gramatura_id = g.id
                        WHERE cr.plano_corte_id = ?
                        ORDER BY cr.data_corte DESC
                    `, [plano.id]);
                    cortesRealizados = cortes;
                }
                
                // Mapear itens pendentes para incluir info de tipo
                plano.itens = itens.filter(i => i.alocacao_id !== null).map(i => ({
                    ...i,
                    origem_id: i.bobina_id || i.retalho_id,
                    tipo: i.tipo_origem || (i.bobina_id ? 'bobina' : 'retalho'),
                    cortado: false
                }));
                
                // Mapear cortes realizados (aparecem no final)
                plano.cortesRealizados = cortesRealizados.map(cr => ({
                    corte_id: cr.corte_id,
                    codigo_corte: cr.codigo_corte,
                    item_plano_corte_id: cr.item_plano_corte_id,
                    metragem_cortada: cr.metragem_cortada,
                    placa_origem: cr.placa_origem,
                    codigo_origem: cr.codigo_origem,
                    produto_codigo: cr.produto_codigo,
                    nome_cor: cr.nome_cor,
                    gramatura: cr.gramatura,
                    data_corte: cr.data_corte,
                    operador_nome: cr.operador_nome,
                    cortado: true
                }));
                
                plano.qtd_itens = plano.itens.length;
                plano.qtd_cortados = cortesRealizados.length;
                plano.qtd_total = itens.length + cortesRealizados.length;
                plano.observacoes = (plano.cliente || '') + (plano.aviario ? ' - ' + plano.aviario : '');
                plano.fonte = 'planos';
                
                // Buscar localizações onde o plano está armazenado
                try {
                    const [localizacoes] = await db.query(`
                        SELECT pl.codigo_locacao, l.corredor, l.coluna, l.altura
                        FROM plano_locacoes pl
                        LEFT JOIN locacoes l ON pl.locacao_id = l.id
                        WHERE pl.plano_corte_id = ?
                        ORDER BY pl.ordem_scan
                    `, [plano.id]);
                    plano.localizacoes = localizacoes;
                } catch (err) {
                    plano.localizacoes = [];
                }
            }
            ordens = planos;
        } catch (err) { console.log('planos_corte nao disponivel:', err.message); }
        if (ordens.length === 0) {
            try {
                // Buscar ordens que NAO estao Concluidas ou Canceladas
                const [ordensCorte] = await db.query('SELECT oc.id, oc.numero_ordem, oc.status, oc.criado_por, oc.data_criacao, oc.observacoes FROM ordens_corte oc WHERE oc.status NOT IN (\'Concluída\', \'Cancelada\') ORDER BY oc.data_criacao DESC LIMIT 20');
                for (let ordem of ordensCorte) {
                    const [itens] = await db.query('SELECT i.id AS item_id, i.id AS alocacao_id, i.bobina_id, i.metragem_cortada AS metragem_alocada, b.codigo_interno AS origem_codigo, b.metragem_atual, b.localizacao_atual, p.codigo AS produto_codigo, c.nome_cor FROM itens_ordem_corte i LEFT JOIN bobinas b ON i.bobina_id = b.id LEFT JOIN produtos p ON i.produto_id = p.id LEFT JOIN configuracoes_cores c ON p.cor_id = c.id WHERE i.ordem_corte_id = ? ORDER BY i.id', [ordem.id]);
                    ordem.itens = itens.map(i => ({ ...i, origem_id: i.bobina_id, tipo: 'bobina' }));
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
    const connection = await db.getConnection();
    
    try {
        const { item_id, origem_id, tipo_origem, metragem_cortada } = req.body;
        // Compatibilidade com versão antiga
        const origemId = origem_id || req.body.bobina_id;
        const tipoOrigem = tipo_origem || 'bobina';
        
        if (!item_id || !origemId || !metragem_cortada) {
            return res.status(400).json({ success: false, message: 'Item, origem e metragem obrigatorios' });
        }
        
        // Iniciar transação
        await connection.beginTransaction();
        console.log('🔄 Transação iniciada para corte item_id:', item_id);
        
        let metragem_disponivel = 0;
        let metragem_reservada = 0;
        let produtoId = null;
        let planoCorteId = null;
        let itemPlanoCorteId = null;
        
        // Buscar dados da alocação
        const [alocacoes] = await connection.query(`
            SELECT 
                ac.id as alocacao_id,
                ac.item_plano_corte_id,
                ipc.plano_corte_id,
                ipc.produto_id,
                ac.tipo_origem,
                ac.bobina_id,
                ac.retalho_id
            FROM alocacoes_corte ac
            JOIN itens_plano_corte ipc ON ac.item_plano_corte_id = ipc.id
            WHERE ac.id = ?
        `, [item_id]);
        
        if (alocacoes.length === 0) {
            await connection.rollback();
            return res.status(404).json({ success: false, message: 'Alocação não encontrada' });
        }
        
        const alocacao = alocacoes[0];
        produtoId = alocacao.produto_id;
        planoCorteId = alocacao.plano_corte_id;
        itemPlanoCorteId = alocacao.item_plano_corte_id;
        
        if (tipoOrigem === 'retalho') {
            const [retalhos] = await connection.query('SELECT id, metragem, metragem_reservada FROM retalhos WHERE id = ?', [origemId]);
            if (retalhos.length === 0) {
                await connection.rollback();
                return res.status(404).json({ success: false, message: 'Retalho nao encontrado' });
            }
            metragem_disponivel = Number(retalhos[0].metragem);
            metragem_reservada = Number(retalhos[0].metragem_reservada || 0);
        } else {
            const [bobinas] = await connection.query('SELECT id, metragem_atual, metragem_reservada FROM bobinas WHERE id = ?', [origemId]);
            if (bobinas.length === 0) {
                await connection.rollback();
                return res.status(404).json({ success: false, message: 'Bobina nao encontrada' });
            }
            metragem_disponivel = Number(bobinas[0].metragem_atual);
            metragem_reservada = Number(bobinas[0].metragem_reservada || 0);
        }
        
        if (metragem_cortada > metragem_disponivel) {
            await connection.rollback();
            return res.status(400).json({ success: false, message: 'Metragem insuficiente. Disponivel: ' + metragem_disponivel.toFixed(2) + 'm' });
        }
        
        const nova_metragem = metragem_disponivel - metragem_cortada;
        const nova_reserva = Math.max(0, metragem_reservada - metragem_cortada);
        
        // Atualizar metragem da origem
        if (tipoOrigem === 'retalho') {
            await connection.query('UPDATE retalhos SET metragem = ?, metragem_reservada = ? WHERE id = ?', [nova_metragem, nova_reserva, origemId]);
        } else {
            await connection.query('UPDATE bobinas SET metragem_atual = ?, metragem_reservada = ? WHERE id = ?', [nova_metragem, nova_reserva, origemId]);
        }
        
        // Marcar alocacao como confirmada
        await connection.query(`
            UPDATE alocacoes_corte 
            SET confirmado = 1
            WHERE id = ?
        `, [item_id]);
        
        // Gerar código sequencial simples para o corte (COR-000001)
        const [ultimoCodigo] = await connection.query(`
            SELECT codigo_corte FROM cortes_realizados 
            WHERE codigo_corte LIKE 'COR-%' 
            ORDER BY id DESC LIMIT 1
        `);
        
        let sequencial = 1;
        if (ultimoCodigo.length > 0) {
            // Extrair número do formato COR-000001
            const match = ultimoCodigo[0].codigo_corte.match(/COR-(\d+)/);
            if (match) {
                sequencial = parseInt(match[1]) + 1;
            }
        }
        
        const codigoCorte = `COR-${String(sequencial).padStart(6, '0')}`;
        
        // Criar registro em cortes_realizados
        const [corteResult] = await connection.query(`
            INSERT INTO cortes_realizados 
            (codigo_corte, plano_corte_id, item_plano_corte_id, alocacao_corte_id,
             origem_tipo, bobina_id, retalho_id, metragem_cortada, produto_id,
             status, data_conclusao)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'concluido', NOW())
        `, [
            codigoCorte,
            planoCorteId,
            itemPlanoCorteId,
            item_id,
            tipoOrigem,
            tipoOrigem === 'bobina' ? origemId : null,
            tipoOrigem === 'retalho' ? origemId : null,
            metragem_cortada,
            produtoId
        ]);
        
        console.log(`✅ Corte criado: ${codigoCorte} - ${metragem_cortada}m do produto ${produtoId}`);
        
        // Verificar se TODOS os cortes desta BOBINA foram concluídos
        let bobinaConcluida = false;
        try {
            const campo = tipoOrigem === 'retalho' ? 'retalho_id' : 'bobina_id';
            const [statsOrigem] = await connection.query(`
                SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN confirmado = 1 THEN 1 ELSE 0 END) as confirmadas
                FROM alocacoes_corte
                WHERE ${campo} = ?
            `, [origemId]);
            
            if (statsOrigem && statsOrigem.length > 0) {
                bobinaConcluida = statsOrigem[0].total === statsOrigem[0].confirmadas;
                console.log(`📦 ${tipoOrigem} ${origemId}: ${statsOrigem[0].confirmadas}/${statsOrigem[0].total} cortes confirmados. Concluída: ${bobinaConcluida}`);
            }
        } catch (e) {
            console.error('Erro ao verificar se bobina está concluída:', e);
        }
        
        // Verificar se TODOS os itens do plano foram cortados
        let planoCompleto = false;
        try {
            const [stats] = await connection.query(`
                SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN confirmado = 1 THEN 1 ELSE 0 END) as confirmadas
                FROM alocacoes_corte ac
                JOIN itens_plano_corte ipc ON ac.item_plano_corte_id = ipc.id
                WHERE ipc.plano_corte_id = ?
            `, [planoCorteId]);
            
            if (stats && stats.length > 0) {
                planoCompleto = stats[0].total === stats[0].confirmadas;
                console.log(`📊 Plano ${planoCorteId}: ${stats[0].confirmadas}/${stats[0].total} itens confirmados. Completo: ${planoCompleto}`);
            }
        } catch (e) {
            console.error('Erro ao verificar se plano está completo:', e);
        }
        
        // Buscar dados do corte para retornar
        const [corteCompleto] = await connection.query(`
            SELECT 
                cr.id,
                cr.codigo_corte,
                cr.metragem_cortada,
                p.codigo as produto_codigo,
                c.nome_cor,
                g.gramatura,
                pc.codigo_plano
            FROM cortes_realizados cr
            JOIN produtos p ON cr.produto_id = p.id
            JOIN planos_corte pc ON cr.plano_corte_id = pc.id
            LEFT JOIN configuracoes_cores c ON p.cor_id = c.id
            LEFT JOIN configuracoes_gramaturas g ON p.gramatura_id = g.id
            WHERE cr.id = ?
        `, [corteResult.insertId]);
        
        // COMMIT: Tudo deu certo, confirmar transação
        await connection.commit();
        console.log('✅ Transação confirmada - Corte salvo com sucesso');
        
        // Liberar conexão
        connection.release();
        
        return res.json({ 
            success: true, 
            message: 'Corte validado!', 
            data: { 
                metragem_cortada, 
                metragem_restante: nova_metragem.toFixed(2),
                bobina_concluida: bobinaConcluida,
                plano_completo: planoCompleto,
                // NOVO: Dados do corte para impressão
                corte: corteCompleto[0]
            } 
        });
    } catch (error) {
        // ROLLBACK: Erro detectado, desfazer todas as alterações
        if (connection) {
            try {
                await connection.rollback();
                console.error('⚠️ ROLLBACK executado - Nenhuma alteração foi salva');
            } catch (rollbackError) {
                console.error('❌ Erro ao executar rollback:', rollbackError);
            } finally {
                connection.release();
            }
        }
        
        console.error('❌ Erro ao validar corte:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Erro ao validar item - nenhuma alteração foi salva', 
            error: error.message 
        });
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

// ==================== NOVAS ROTAS - SISTEMA DE CORTES ==================== //

const { upload, comprimirImagem } = require('../middleware/uploadFotos');
const cortesController = require('../controllers/cortesController');

// Validar QR da bobina antes de cortar
router.post('/validar-qr-bobina', async (req, res) => {
    try {
        const { alocacao_id, qr_escaneado } = req.body;
        
        // Normaliza código escaneado (compacto → completo)
        const codigoNormalizado = normalizarCodigoBarras(qr_escaneado);
        console.log('🔍 Validando QR:', qr_escaneado, '→', codigoNormalizado);
        
        const [alocacao] = await db.query(`
            SELECT ac.*, 
                COALESCE(b.codigo_interno, r.codigo_retalho) as origem_codigo_esperado
            FROM alocacoes_corte ac
            LEFT JOIN bobinas b ON ac.bobina_id = b.id
            LEFT JOIN retalhos r ON ac.retalho_id = r.id
            WHERE ac.id = ?
        `, [alocacao_id]);
        
        if (!alocacao || alocacao.length === 0) {
            return res.json({ success: false, validado: false, erro: 'Alocação não encontrada' });
        }
        
        // Compara código normalizado com o esperado
        const validado = alocacao[0].origem_codigo_esperado === codigoNormalizado;
        
        res.json({ 
            success: true, 
            validado,
            bobina: validado ? alocacao[0] : null,
            erro: validado ? null : `Código QR não corresponde. Esperado: ${alocacao[0].origem_codigo_esperado}, Lido: ${codigoNormalizado}`
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Upload de foto do medidor
router.post('/upload-foto-medidor', upload.single('foto'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, error: 'Nenhuma foto foi enviada' });
        }
        
        // Comprimir imagem
        await comprimirImagem(req.file.path);
        
        const foto_url = `/uploads/fotos-medidor/${req.file.filename}`;
        
        res.json({ 
            success: true,
            data: {
                filePath: foto_url,
                filename: req.file.filename
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Erro no upload:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Registrar corte - versão para o app mobile
// Aceita: pdc_id, item_id, origem_id, origem_tipo, metragem_cortada, foto
router.post('/registrar-corte', upload.single('foto'), async (req, res) => {
    try {
        console.log('📝 Registrando corte. Body:', req.body);
        console.log('📝 Arquivo:', req.file ? req.file.filename : 'Nenhum');
        
        const { pdc_id, item_id, origem_id, origem_tipo, metragem_cortada } = req.body;
        
        if (!pdc_id || !item_id || !origem_id || !origem_tipo || !metragem_cortada) {
            return res.status(400).json({
                success: false,
                error: `Campos obrigatórios faltando. Recebido: pdc_id=${pdc_id}, item_id=${item_id}, origem_id=${origem_id}, origem_tipo=${origem_tipo}, metragem=${metragem_cortada}`
            });
        }
        
        // Busca a alocação correspondente
        const whereOrigem = origem_tipo === 'bobina' ? 'ac.bobina_id = ?' : 'ac.retalho_id = ?';
        const [alocacoes] = await db.query(`
            SELECT ac.id as alocacao_id, ac.*, ipc.plano_corte_id, ipc.produto_id
            FROM alocacoes_corte ac
            JOIN itens_plano_corte ipc ON ipc.id = ac.item_plano_corte_id
            WHERE ipc.id = ? AND ${whereOrigem}
        `, [item_id, origem_id]);
        
        if (!alocacoes || alocacoes.length === 0) {
            console.error('❌ Alocação não encontrada para item_id:', item_id, 'origem:', origem_tipo, origem_id);
            return res.status(404).json({
                success: false,
                error: 'Alocação não encontrada para este item e origem'
            });
        }
        
        const aloc = alocacoes[0];
        console.log('✅ Alocação encontrada:', aloc.alocacao_id);
        
        // Busca dados da origem (bobina ou retalho)
        let placa_origem = null;
        let codigo_origem = null;
        
        if (origem_tipo === 'bobina') {
            const [bobina] = await db.query(
                'SELECT placa, codigo_interno FROM bobinas WHERE id = ?',
                [origem_id]
            );
            if (bobina.length > 0) {
                placa_origem = bobina[0].placa;
                codigo_origem = bobina[0].codigo_interno;
            }
        } else {
            const [retalho] = await db.query(
                'SELECT placa, codigo_retalho FROM retalhos WHERE id = ?',
                [origem_id]
            );
            if (retalho.length > 0) {
                placa_origem = retalho[0].placa;
                codigo_origem = retalho[0].codigo_retalho;
            }
        }
        
        // Gera código do corte
        // Busca loja do PDC
        const [pdcInfo] = await db.query('SELECT loja FROM planos_corte WHERE id = ?', [pdc_id]);
        const loja = pdcInfo.length > 0 ? pdcInfo[0].loja : 'PLA';
        
        // Busca último corte para gerar sequencial
        const [ultimoCorte] = await db.query(
            `SELECT codigo_corte FROM cortes_realizados 
             WHERE codigo_corte LIKE 'COR-${loja}-%' 
             ORDER BY id DESC LIMIT 1`
        );
        
        let numeroCorte = 1;
        if (ultimoCorte.length > 0) {
            // Extrai número do código: COR-PLA-001-05 -> 005
            const partes = ultimoCorte[0].codigo_corte.split('-');
            if (partes.length >= 3) {
                const planoNum = parseInt(partes[2]) || 0;
                const seqNum = partes.length > 3 ? parseInt(partes[3]) || 0 : 0;
                numeroCorte = planoNum * 100 + seqNum + 1;
            }
        }
        
        // Formato: COR-LOJA-PLANO-SEQ
        const planoNum = String(Math.floor(numeroCorte / 100) || pdc_id).padStart(3, '0');
        const seqNum = String((numeroCorte % 100) || 1).padStart(2, '0');
        const codigo_corte = `COR-${loja}-${planoNum}-${seqNum}`;
        
        // URL da foto
        let foto_url = null;
        if (req.file) {
            // Comprimir imagem
            await comprimirImagem(req.file.path);
            foto_url = `/uploads/fotos-medidor/${req.file.filename}`;
        }
        
        // Insere o corte
        const [result] = await db.query(`
            INSERT INTO cortes_realizados (
                codigo_corte,
                plano_corte_id,
                item_plano_corte_id,
                alocacao_corte_id,
                origem_tipo,
                bobina_id,
                retalho_id,
                placa_origem,
                codigo_origem,
                metragem_cortada,
                produto_id,
                foto_medidor_url,
                foto_medidor_timestamp,
                status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), 'concluido')
        `, [
            codigo_corte,
            pdc_id,
            item_id,
            aloc.alocacao_id,
            origem_tipo,
            origem_tipo === 'bobina' ? origem_id : null,
            origem_tipo === 'retalho' ? origem_id : null,
            placa_origem,
            codigo_origem,
            metragem_cortada,
            aloc.produto_id,
            foto_url
        ]);
        
        console.log('✅ Corte inserido com ID:', result.insertId, 'Código:', codigo_corte);
        
        // Atualiza metragem da origem (deduz metragem_atual E metragem_reservada)
        const metragemFloat = parseFloat(metragem_cortada);
        if (origem_tipo === 'bobina') {
            await db.query(
                `UPDATE bobinas 
                 SET metragem_atual = metragem_atual - ?,
                     metragem_reservada = GREATEST(0, metragem_reservada - ?)
                 WHERE id = ?`,
                [metragemFloat, metragemFloat, origem_id]
            );
            console.log(`📦 Bobina ${origem_id}: -${metragemFloat}m (atual e reservada)`);
        } else {
            await db.query(
                `UPDATE retalhos 
                 SET metragem = metragem - ?,
                     metragem_reservada = GREATEST(0, metragem_reservada - ?)
                 WHERE id = ?`,
                [metragemFloat, metragemFloat, origem_id]
            );
            console.log(`♻️ Retalho ${origem_id}: -${metragemFloat}m (atual e reservada)`);
        }
        
        // Busca metragem restante da origem para retornar ao frontend
        let metragemRestante = 0;
        if (origem_tipo === 'bobina') {
            const [bobina] = await db.query('SELECT metragem_atual FROM bobinas WHERE id = ?', [origem_id]);
            metragemRestante = bobina.length > 0 ? parseFloat(bobina[0].metragem_atual) : 0;
        } else {
            const [retalho] = await db.query('SELECT metragem FROM retalhos WHERE id = ?', [origem_id]);
            metragemRestante = retalho.length > 0 ? parseFloat(retalho[0].metragem) : 0;
        }
        
        // Retorna sucesso com metragem restante
        res.json({
            success: true,
            data: {
                id: result.insertId,
                codigo_corte,
                metragem_cortada: metragemFloat,
                metragem_restante: metragemRestante,
                foto_url
            }
        });
        
    } catch (error) {
        console.error('❌ Erro ao registrar corte:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Erro interno ao registrar corte'
        });
    }
});

// ==================== PDC: ATUALIZAR LOCAÇÃO DA ORIGEM ==================== //

/**
 * Atualiza locação de uma bobina ou retalho após cortes
 * POST /api/mobile/pdcs/atualizar-locacao-origem
 */
router.post('/pdcs/atualizar-locacao-origem', async (req, res) => {
    try {
        const { tipo, origem_id, codigo_locacao } = req.body;
        
        console.log('📍 Atualizando locação da origem:', tipo, origem_id, codigo_locacao);
        
        if (!tipo || !origem_id || !codigo_locacao) {
            return res.status(400).json({
                success: false,
                error: 'Tipo, origem_id e codigo_locacao são obrigatórios'
            });
        }
        
        // Normaliza código da locação (LOC-1-A-1 -> 0001-A-0001)
        let locacaoNormalizada = codigo_locacao;
        if (codigo_locacao.startsWith('LOC-')) {
            // LOC-1-A-1 -> 1-A-1 -> 0001-A-0001
            const semPrefixo = codigo_locacao.replace('LOC-', '');
            const partes = semPrefixo.split('-');
            if (partes.length === 3) {
                locacaoNormalizada = `${partes[0].padStart(4, '0')}-${partes[1]}-${partes[2].padStart(4, '0')}`;
            }
        }
        
        // Atualiza no banco
        if (tipo === 'bobina') {
            await db.query(
                'UPDATE bobinas SET locacao = ? WHERE id = ?',
                [locacaoNormalizada, origem_id]
            );
        } else if (tipo === 'retalho') {
            await db.query(
                'UPDATE retalhos SET locacao = ? WHERE id = ?',
                [locacaoNormalizada, origem_id]
            );
        } else {
            return res.status(400).json({
                success: false,
                error: 'Tipo deve ser "bobina" ou "retalho"'
            });
        }
        
        console.log('✅ Locação atualizada:', locacaoNormalizada);
        
        res.json({
            success: true,
            locacao: locacaoNormalizada
        });
        
    } catch (error) {
        console.error('❌ Erro ao atualizar locação da origem:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ==================== PDC: FINALIZAR ==================== //

/**
 * Finaliza um PDC após todos os cortes serem concluídos
 * POST /api/mobile/pdcs/:id/finalizar
 */
router.post('/pdcs/:id/finalizar', async (req, res) => {
    try {
        const pdcId = req.params.id;
        const { locacoes } = req.body;
        
        console.log('🏁 Finalizando PDC:', pdcId, 'Locações:', locacoes);
        
        // Verifica se PDC existe
        const [pdcs] = await db.query('SELECT * FROM planos_corte WHERE id = ?', [pdcId]);
        if (pdcs.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'PDC não encontrado'
            });
        }
        
        // Verifica se tem locações
        if (!locacoes || locacoes.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Informe pelo menos uma locação para armazenamento'
            });
        }
        
        // Salva locações na tabela plano_locacoes
        for (let i = 0; i < locacoes.length; i++) {
            let codigoLocacao = locacoes[i];
            
            // Normaliza código
            if (codigoLocacao.startsWith('LOC-')) {
                const semPrefixo = codigoLocacao.replace('LOC-', '');
                const partes = semPrefixo.split('-');
                if (partes.length === 3) {
                    codigoLocacao = `${partes[0].padStart(4, '0')}-${partes[1]}-${partes[2].padStart(4, '0')}`;
                }
            }
            
            // Busca ID da locação (se existir)
            const [locacao] = await db.query(
                'SELECT id FROM locacoes WHERE codigo_locacao = ?',
                [codigoLocacao]
            );
            
            const locacaoId = locacao.length > 0 ? locacao[0].id : null;
            
            // Insere na plano_locacoes
            await db.query(`
                INSERT INTO plano_locacoes (plano_corte_id, locacao_id, codigo_locacao, validada_qr, data_scan, ordem_scan)
                VALUES (?, ?, ?, TRUE, NOW(), ?)
                ON DUPLICATE KEY UPDATE codigo_locacao = VALUES(codigo_locacao), data_scan = NOW()
            `, [pdcId, locacaoId, codigoLocacao, i + 1]);
        }
        
        // Atualiza status do PDC para Finalizado
        await db.query(`
            UPDATE planos_corte 
            SET status = 'Finalizado',
                locacoes_validadas = TRUE,
                data_finalizacao = NOW(),
                data_armazenamento = NOW()
            WHERE id = ?
        `, [pdcId]);
        
        console.log('✅ PDC finalizado com sucesso');
        
        res.json({
            success: true,
            message: 'PDC finalizado com sucesso',
            locacoes_registradas: locacoes.length
        });
        
    } catch (error) {
        console.error('❌ Erro ao finalizar PDC:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Consultar corte por código
router.get('/corte/:codigo_corte', cortesController.consultarCorte);

// Listar cortes de um plano
router.get('/plano/:plano_id/cortes', cortesController.listarCortesPorPlano);

// Adicionar locação ao plano
router.post('/plano/:plano_id/adicionar-locacao', async (req, res) => {
    try {
        const { plano_id } = req.params;
        const { codigo_locacao } = req.body;
        
        // Buscar ID da locação
        const [locacao] = await db.query('SELECT id FROM locacoes WHERE codigo_locacao = ?', [codigo_locacao]);
        
        if (!locacao || locacao.length === 0) {
            return res.status(404).json({ success: false, error: 'Locação não encontrada' });
        }
        
        // Verificar ordem de scan
        const [count] = await db.query('SELECT COUNT(*) as total FROM plano_locacoes WHERE plano_corte_id = ?', [plano_id]);
        const ordem_scan = count[0].total + 1;
        
        // Inserir
        await db.query(`
            INSERT INTO plano_locacoes (plano_corte_id, locacao_id, codigo_locacao, validada_qr, data_scan, ordem_scan)
            VALUES (?, ?, ?, TRUE, NOW(), ?)
        `, [plano_id, locacao[0].id, codigo_locacao, ordem_scan]);
        
        // Buscar todas as locações do plano
        const [locacoes] = await db.query(`
            SELECT * FROM plano_locacoes WHERE plano_corte_id = ? ORDER BY ordem_scan
        `, [plano_id]);
        
        res.json({ 
            success: true, 
            locacao_validada: true,
            locacoes_totais: locacoes.length,
            locacoes
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Finalizar plano (após todos cortes feitos + locações escaneadas)
router.post('/plano/:plano_id/finalizar', async (req, res) => {
    try {
        const { plano_id } = req.params;
        const { operador_nome } = req.body;
        
        // Verificar se tem locações
        const [locacoes] = await db.query('SELECT * FROM plano_locacoes WHERE plano_corte_id = ?', [plano_id]);
        
        if (!locacoes || locacoes.length === 0) {
            return res.status(400).json({ success: false, error: 'Plano precisa ter pelo menos 1 locação' });
        }
        
        // Atualizar plano
        await db.query(`
            UPDATE planos_corte
            SET status = 'finalizado',
                locacoes_validadas = TRUE,
                data_finalizacao = NOW(),
                data_armazenamento = NOW(),
                armazenado_por = ?
            WHERE id = ?
        `, [operador_nome, plano_id]);
        
        // Buscar plano atualizado
        const [plano] = await db.query('SELECT * FROM planos_corte WHERE id = ?', [plano_id]);
        
        res.json({ 
            success: true, 
            plano_finalizado: true,
            data: plano[0]
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ==================== CARREGAMENTO ==================== //

// Listar planos finalizados (prontos para carregar)
router.get('/carregamento/planos-finalizados', async (req, res) => {
    try {
        // Query simplificada - sem cortes detalhados
        const [planos] = await db.query(`
            SELECT 
                pc.id as plano_id,
                pc.codigo_plano,
                pc.cliente,
                pc.aviario,
                pc.status,
                pc.data_finalizacao,
                (SELECT COUNT(*) FROM cortes_realizados WHERE plano_corte_id = pc.id) as total_cortes,
                (SELECT COUNT(*) FROM cortes_realizados WHERE plano_corte_id = pc.id AND carregado = TRUE) as cortes_carregados,
                (SELECT GROUP_CONCAT(codigo_locacao ORDER BY ordem_scan SEPARATOR ', ') FROM plano_locacoes WHERE plano_corte_id = pc.id) as locacoes,
                (SELECT id FROM carregamentos WHERE plano_corte_id = pc.id AND status != 'cancelado' LIMIT 1) as carregamento_id,
                (SELECT status FROM carregamentos WHERE plano_corte_id = pc.id AND status != 'cancelado' LIMIT 1) as status_carregamento
            FROM planos_corte pc
            WHERE pc.status = 'finalizado'
            ORDER BY pc.data_finalizacao DESC
        `);
        
        // Filtrar apenas os que têm cortes
        const planosComCortes = planos.filter(p => p.total_cortes > 0);
        
        // Formatar resposta
        const planosFormatados = planosComCortes.map(p => ({
            ...p,
            percentual: p.total_cortes > 0 ? Math.round((p.cortes_carregados / p.total_cortes) * 100) : 0,
            status_carregamento: p.status_carregamento || 'pendente',
            cortes: [] // Vazio por enquanto - será carregado sob demanda
        }));
        
        res.json({ success: true, data: planosFormatados });
    } catch (error) {
        console.error('❌ Erro planos-finalizados:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Iniciar carregamento
router.post('/carregamento/iniciar', async (req, res) => {
    try {
        const { plano_id, operador_nome } = req.body;
        
        // Gerar código de carregamento
        const ano = new Date().getFullYear();
        const [ultimo] = await db.query(`
            SELECT codigo_carregamento FROM carregamentos 
            WHERE codigo_carregamento LIKE 'CAR-${ano}-%' 
            ORDER BY id DESC LIMIT 1
        `);
        
        let numero = 1;
        if (ultimo.length > 0) {
            numero = parseInt(ultimo[0].codigo_carregamento.split('-')[2]) + 1;
        }
        const codigo_carregamento = `CAR-${ano}-${String(numero).padStart(5, '0')}`;
        
        // Buscar total de cortes
        const [cortes] = await db.query(`
            SELECT cr.*, p.codigo as produto_codigo, c.nome_cor
            FROM cortes_realizados cr
            JOIN produtos p ON p.id = cr.produto_id
            LEFT JOIN configuracoes_cores c ON p.cor_id = c.id
            WHERE cr.plano_corte_id = ?
            ORDER BY cr.data_corte
        `, [plano_id]);
        
        // Criar carregamento
        const [result] = await db.query(`
            INSERT INTO carregamentos (codigo_carregamento, plano_corte_id, total_cortes, operador_nome)
            VALUES (?, ?, ?, ?)
        `, [codigo_carregamento, plano_id, cortes.length, operador_nome]);
        
        res.json({ 
            success: true,
            carregamento: {
                id: result.insertId,
                codigo_carregamento,
                total_cortes: cortes.length
            },
            cortes
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Validar scan de corte no carregamento
router.post('/carregamento/validar-scan', async (req, res) => {
    try {
        const { carregamento_id, codigo_corte } = req.body;
        
        // Buscar carregamento
        const [carr] = await db.query('SELECT * FROM carregamentos WHERE id = ?', [carregamento_id]);
        
        if (!carr || carr.length === 0) {
            return res.json({ success: false, valido: false, erro: 'Carregamento não encontrado' });
        }
        
        // Buscar corte
        const [corte] = await db.query(`
            SELECT * FROM cortes_realizados 
            WHERE codigo_corte = ? AND plano_corte_id = ?
        `, [codigo_corte, carr[0].plano_corte_id]);
        
        if (!corte || corte.length === 0) {
            return res.json({ success: false, valido: false, erro: 'Corte não pertence a este plano' });
        }
        
        if (corte[0].carregado) {
            return res.json({ success: false, valido: false, erro: 'Corte já foi carregado anteriormente' });
        }
        
        // Marcar como carregado
        await db.query(`
            UPDATE cortes_realizados
            SET carregado = TRUE,
                carregado_por = (SELECT operador_nome FROM carregamentos WHERE id = ?),
                data_carregamento = NOW(),
                carregamento_id = ?
            WHERE id = ?
        `, [carregamento_id, carregamento_id, corte[0].id]);
        
        // Registrar item do carregamento
        const [countItems] = await db.query('SELECT COUNT(*) as total FROM carregamentos_itens WHERE carregamento_id = ?', [carregamento_id]);
        await db.query(`
            INSERT INTO carregamentos_itens (carregamento_id, corte_id, ordem_scan)
            VALUES (?, ?, ?)
        `, [carregamento_id, corte[0].id, countItems[0].total + 1]);
        
        // Atualizar contador do carregamento
        await db.query(`
            UPDATE carregamentos
            SET cortes_carregados = cortes_carregados + 1
            WHERE id = ?
        `, [carregamento_id]);
        
        // Buscar progresso atualizado
        const [progresso] = await db.query('SELECT cortes_carregados, total_cortes FROM carregamentos WHERE id = ?', [carregamento_id]);
        
        res.json({ 
            success: true, 
            valido: true,
            corte: corte[0],
            progresso: {
                carregados: progresso[0].cortes_carregados,
                total: progresso[0].total_cortes,
                percentual: Math.round((progresso[0].cortes_carregados / progresso[0].total_cortes) * 100)
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Finalizar carregamento
router.post('/carregamento/finalizar', async (req, res) => {
    try {
        const { carregamento_id } = req.body;
        
        await db.query(`
            UPDATE carregamentos
            SET status = 'concluido',
                data_conclusao = NOW()
            WHERE id = ?
        `, [carregamento_id]);
        
        const [carregamento] = await db.query('SELECT * FROM carregamentos WHERE id = ?', [carregamento_id]);
        
        res.json({ 
            success: true, 
            carregamento: carregamento[0]
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Buscar cortes de um plano (para carregamento)
router.get('/carregamento/cortes-plano/:planoId', async (req, res) => {
    try {
        const { planoId } = req.params;
        
        const [cortes] = await db.query(`
            SELECT 
                cr.id,
                cr.codigo_corte,
                cr.metragem_cortada,
                cr.carregado,
                cr.data_carregamento,
                p.codigo as produto_codigo,
                p.descricao as produto_descricao,
                c.nome_cor
            FROM cortes_realizados cr
            JOIN produtos p ON p.id = cr.produto_id
            LEFT JOIN configuracoes_cores c ON p.cor_id = c.id
            WHERE cr.plano_corte_id = ?
            ORDER BY cr.codigo_corte
        `, [planoId]);
        
        res.json({ success: true, cortes });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Buscar cortes de um carregamento existente
router.get('/carregamento/:id/cortes', async (req, res) => {
    try {
        const { id } = req.params;
        
        // Buscar carregamento para pegar plano_corte_id
        const [carr] = await db.query('SELECT * FROM carregamentos WHERE id = ?', [id]);
        if (!carr.length) {
            return res.json({ success: false, error: 'Carregamento não encontrado' });
        }
        
        const [cortes] = await db.query(`
            SELECT 
                cr.id,
                cr.codigo_corte,
                cr.metragem_cortada,
                cr.carregado,
                cr.data_carregamento,
                p.codigo as produto_codigo,
                p.descricao as produto_descricao,
                c.nome_cor
            FROM cortes_realizados cr
            JOIN produtos p ON p.id = cr.produto_id
            LEFT JOIN configuracoes_cores c ON p.cor_id = c.id
            WHERE cr.plano_corte_id = ?
            ORDER BY cr.codigo_corte
        `, [carr[0].plano_corte_id]);
        
        res.json({ 
            success: true, 
            cortes,
            carregamento: carr[0]
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Atualizar localização de bobina após corte
router.post('/atualizar-localizacao-bobina', async (req, res) => {
    try {
        const { id, localizacao } = req.body;
        
        if (!id || !localizacao) {
            return res.status(400).json({ success: false, message: 'ID e localização são obrigatórios' });
        }
        
        // Validar formato da localização (N-X-N)
        if (!/^\d+-[A-Z]-\d+$/.test(localizacao)) {
            return res.status(400).json({ success: false, message: 'Formato de localização inválido. Use: 1-A-1' });
        }
        
        await db.query(
            'UPDATE bobinas SET localizacao_atual = ? WHERE id = ?',
            [localizacao, id]
        );
        
        res.json({ success: true, message: 'Localização atualizada com sucesso' });
    } catch (error) {
        console.error('Erro ao atualizar localização:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Atualizar localização de retalho após corte
router.post('/atualizar-localizacao-retalho', async (req, res) => {
    try {
        const { id, localizacao } = req.body;
        
        if (!id || !localizacao) {
            return res.status(400).json({ success: false, message: 'ID e localização são obrigatórios' });
        }
        
        // Validar formato da localização (N-X-N)
        if (!/^\d+-[A-Z]-\d+$/.test(localizacao)) {
            return res.status(400).json({ success: false, message: 'Formato de localização inválido. Use: 1-A-1' });
        }
        
        await db.query(
            'UPDATE retalhos SET localizacao_atual = ? WHERE id = ?',
            [localizacao, id]
        );
        
        res.json({ success: true, message: 'Localização atualizada com sucesso' });
    } catch (error) {
        console.error('Erro ao atualizar localização:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Finalizar plano de corte
router.post('/finalizar-plano/:planoId', async (req, res) => {
    const connection = await db.getConnection();
    
    try {
        await connection.beginTransaction();
        
        const { planoId } = req.params;
        
        // Verificar se plano existe e está em produção
        const [plano] = await connection.query(
            'SELECT * FROM planos_corte WHERE id = ?',
            [planoId]
        );
        
        if (!plano || plano.length === 0) {
            await connection.rollback();
            return res.status(404).json({ success: false, message: 'Plano não encontrado' });
        }
        
        if (plano[0].status === 'finalizado') {
            await connection.rollback();
            return res.status(400).json({ success: false, message: 'Plano já está finalizado' });
        }
        
        // Verificar se todos os itens foram confirmados
        const [stats] = await connection.query(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN confirmado = TRUE THEN 1 ELSE 0 END) as confirmadas
            FROM alocacoes_corte ac
            JOIN itens_plano_corte ipc ON ac.item_plano_corte_id = ipc.id
            WHERE ipc.plano_corte_id = ?
        `, [planoId]);
        
        if (stats[0].total !== stats[0].confirmadas) {
            await connection.rollback();
            return res.status(400).json({ 
                success: false, 
                message: `Ainda há ${stats[0].total - stats[0].confirmadas} item(ns) pendente(s)` 
            });
        }
        
        // Atualizar status do plano
        await connection.query(
            `UPDATE planos_corte 
             SET status = 'finalizado', data_finalizacao = NOW() 
             WHERE id = ?`,
            [planoId]
        );
        
        // Buscar bobinas/retalhos utilizados com sobras
        const [origens] = await connection.query(`
            SELECT DISTINCT
                ac.bobina_id,
                ac.retalho_id,
                ac.tipo_origem,
                b.metragem_atual as bobina_metragem,
                b.metragem_reservada as bobina_reservada,
                b.codigo_interno as bobina_codigo,
                b.produto_id as bobina_produto_id,
                b.localizacao_atual as bobina_localizacao,
                r.metragem as retalho_metragem,
                r.metragem_reservada as retalho_reservada,
                r.codigo_retalho as retalho_codigo
            FROM alocacoes_corte ac
            JOIN itens_plano_corte ipc ON ac.item_plano_corte_id = ipc.id
            LEFT JOIN bobinas b ON ac.bobina_id = b.id
            LEFT JOIN retalhos r ON ac.retalho_id = r.id
            WHERE ipc.plano_corte_id = ? AND ac.confirmado = TRUE
        `, [planoId]);
        
        const retalhosCriados = [];
        const METRAGEM_MINIMA_RETALHO = 10; // Configurável
        
        // Criar retalhos das sobras
        for (const origem of origens) {
            if (origem.tipo_origem === 'bobina' && origem.bobina_id) {
                const sobra = parseFloat(origem.bobina_metragem) - parseFloat(origem.bobina_reservada || 0);
                
                if (sobra >= METRAGEM_MINIMA_RETALHO) {
                    // Gerar código do retalho
                    const ano = new Date().getFullYear();
                    const [ultimoRetalho] = await connection.query(
                        `SELECT codigo_retalho FROM retalhos 
                         WHERE codigo_retalho LIKE 'RET-${ano}-%' 
                         ORDER BY id DESC LIMIT 1`
                    );
                    
                    let sequencial = 1;
                    if (ultimoRetalho.length > 0) {
                        const partes = ultimoRetalho[0].codigo_retalho.split('-');
                        sequencial = parseInt(partes[2]) + 1;
                    }
                    
                    const codigoRetalho = `RET-${ano}-${String(sequencial).padStart(5, '0')}`;
                    
                    // Criar retalho
                    const [retalhoResult] = await connection.query(
                        `INSERT INTO retalhos 
                         (codigo_retalho, produto_id, bobina_origem_id, metragem, metragem_reservada,
                          localizacao_atual, status, data_entrada, observacoes)
                         VALUES (?, ?, ?, ?, 0, ?, 'disponivel', NOW(), ?)`,
                        [
                            codigoRetalho,
                            origem.bobina_produto_id,
                            origem.bobina_id,
                            sobra,
                            origem.bobina_localizacao,
                            `Gerado automaticamente do plano ${plano[0].codigo_plano} - Sobra da bobina ${origem.bobina_codigo}`
                        ]
                    );
                    
                    retalhosCriados.push({
                        id: retalhoResult.insertId,
                        codigo: codigoRetalho,
                        metragem: sobra,
                        origem: origem.bobina_codigo
                    });
                    
                    console.log(`✅ Retalho criado: ${codigoRetalho} (QR: ${qrCode}) - ${sobra}m da bobina ${origem.bobina_codigo}`);

                }
            }
        }
        
        // Liberar reservas restantes (não deveria ter, mas por segurança)
        await connection.query(`
            UPDATE bobinas b
            JOIN alocacoes_corte ac ON ac.bobina_id = b.id
            JOIN itens_plano_corte ipc ON ac.item_plano_corte_id = ipc.id
            SET b.metragem_reservada = 0
            WHERE ipc.plano_corte_id = ? AND b.metragem_reservada > 0
        `, [planoId]);
        
        await connection.query(`
            UPDATE retalhos r
            JOIN alocacoes_corte ac ON ac.retalho_id = r.id
            JOIN itens_plano_corte ipc ON ac.item_plano_corte_id = ipc.id
            SET r.metragem_reservada = 0
            WHERE ipc.plano_corte_id = ? AND r.metragem_reservada > 0
        `, [planoId]);
        
        await connection.commit();
        
        res.json({ 
            success: true, 
            message: 'Plano finalizado com sucesso!',
            data: {
                retalhos_criados: retalhosCriados.length,
                retalhos: retalhosCriados
            }
        });
    } catch (error) {
        await connection.rollback();
        console.error('Erro ao finalizar plano:', error);
        res.status(500).json({ success: false, message: error.message });
    } finally {
        connection.release();
    }
});

// ==================== CENTRAL DE IMPRESSÃO ==================== //

// DEBUG: Listar todas as bobinas (temporário)
router.get('/imprimir/debug-bobinas', async (req, res) => {
    try {
        const [bobinas] = await db.query(`
            SELECT 
                b.id,
                b.codigo_interno,
                b.metragem_inicial,
                b.metragem_atual,
                b.metragem_reservada,
                b.status,
                p.codigo as produto_codigo
            FROM bobinas b
            LEFT JOIN produtos p ON b.produto_id = p.id
            ORDER BY b.id DESC
            LIMIT 10
        `);
        
        res.json({
            success: true,
            total: bobinas.length,
            bobinas: bobinas
        });
    } catch (error) {
        console.error('Erro ao listar bobinas:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Buscar dados de qualquer código QR para impressão
router.post('/imprimir/buscar-codigo', async (req, res) => {
    try {
        const { codigo } = req.body;
        
        if (!codigo) {
            return res.status(400).json({ success: false, error: 'Código é obrigatório' });
        }
        
        console.log('🔍 Buscando código para impressão:', codigo);
        
        let resultado = null;
        let tipo = null;
        
        // Identificar tipo do código
        if (codigo.startsWith('BOB-')) {
            // Bobina: BOB-0001
            tipo = 'bobina';
            const [bobinas] = await db.query(`
                SELECT 
                    b.id,
                    b.codigo_interno,
                    b.metragem_inicial,
                    b.metragem_atual,
                    b.metragem_reservada,
                    b.localizacao_atual,
                    b.loja,
                    b.nota_fiscal,
                    b.data_entrada,
                    b.status,
                    b.placa,
                    p.codigo as produto_codigo,
                    p.fabricante,
                    p.tipo_tecido,
                    p.largura_sem_costura,
                    p.largura_final,
                    p.largura_maior,
                    p.largura_y,
                    p.tipo_bainha,
                    c.nome_cor,
                    g.gramatura
                FROM bobinas b
                JOIN produtos p ON b.produto_id = p.id
                LEFT JOIN configuracoes_cores c ON p.cor_id = c.id
                LEFT JOIN configuracoes_gramaturas g ON p.gramatura_id = g.id
                WHERE b.codigo_interno = ?
            `, [codigo]);
            
            if (bobinas.length > 0) {
                resultado = bobinas[0];
                console.log('📦 Bobina encontrada:', {
                    codigo: resultado.codigo_interno,
                    metragem_inicial: resultado.metragem_inicial,
                    metragem_atual: resultado.metragem_atual,
                    metragem_reservada: resultado.metragem_reservada,
                    produto: resultado.produto_codigo,
                    placa: resultado.placa,
                    cor: resultado.nome_cor,
                    gramatura: resultado.gramatura
                });
            }
            
        } else if (codigo.startsWith('RET-')) {
            // Retalho: RET-0001
            tipo = 'retalho';
            const [retalhos] = await db.query(`
                SELECT 
                    r.id,
                    r.codigo_retalho,
                    r.metragem,
                    r.localizacao_atual,
                    p.codigo as produto_codigo,
                    p.loja,
                    c.nome_cor,
                    g.gramatura,
                    p.tipo_tecido,
                    b.codigo_interno as bobina_origem
                FROM retalhos r
                JOIN produtos p ON r.produto_id = p.id
                LEFT JOIN bobinas b ON r.bobina_origem_id = b.id
                LEFT JOIN configuracoes_cores c ON p.cor_id = c.id
                LEFT JOIN configuracoes_gramaturas g ON p.gramatura_id = g.id
                WHERE r.codigo_retalho = ?
            `, [codigo]);
            
            if (retalhos.length > 0) {
                resultado = retalhos[0];
            }
            
        } else if (codigo.startsWith('COR-')) {
            // Corte: COR-0001-PLA-0123
            tipo = 'corte';
            const [cortes] = await db.query(`
                SELECT 
                    cr.id,
                    cr.codigo_corte,
                    cr.metragem_cortada,
                    cr.data_corte,
                    p.codigo as produto_codigo,
                    p.loja,
                    c.nome_cor,
                    g.gramatura,
                    p.tipo_tecido,
                    pc.codigo_plano,
                    pc.cliente,
                    pc.aviario,
                    COALESCE(b.codigo_interno, ret.codigo_retalho) as origem_codigo
                FROM cortes_realizados cr
                JOIN produtos p ON cr.produto_id = p.id
                JOIN planos_corte pc ON cr.plano_corte_id = pc.id
                LEFT JOIN bobinas b ON cr.bobina_id = b.id
                LEFT JOIN retalhos ret ON cr.retalho_id = ret.id
                LEFT JOIN configuracoes_cores c ON p.cor_id = c.id
                LEFT JOIN configuracoes_gramaturas g ON p.gramatura_id = g.id
                WHERE cr.codigo_corte = ?
            `, [codigo]);
            
            if (cortes.length > 0) {
                resultado = cortes[0];
            }
            
        } else if (codigo.startsWith('PLA-')) {
            // Plano de Corte: PLA-0001
            tipo = 'plano';
            const [planos] = await db.query(`
                SELECT 
                    pc.id,
                    pc.codigo_plano,
                    pc.cliente,
                    pc.aviario,
                    pc.status,
                    pc.data_criacao,
                    COUNT(DISTINCT ipc.id) as total_itens,
                    SUM(ipc.metragem) as metragem_total
                FROM planos_corte pc
                LEFT JOIN itens_plano_corte ipc ON pc.id = ipc.plano_corte_id
                WHERE pc.codigo_plano = ?
                GROUP BY pc.id
            `, [codigo]);
            
            if (planos.length > 0) {
                resultado = planos[0];
            }
            
        } else if (codigo.match(/^\d+-[A-Z]+-\d+$/)) {
            // Localização: 0001-A-0001
            tipo = 'localizacao';
            const [locacoes] = await db.query(`
                SELECT 
                    id,
                    codigo as codigo_localizacao,
                    descricao,
                    capacidade,
                    ativa,
                    created_at,
                    updated_at
                FROM locacoes
                WHERE codigo = ?
            `, [codigo]);
            
            if (locacoes.length > 0) {
                resultado = locacoes[0];
            }
        }
        
        if (!resultado) {
            return res.status(404).json({ 
                success: false, 
                error: 'Código não encontrado' 
            });
        }
        
        res.json({ 
            success: true, 
            data: {
                tipo,
                ...resultado
            }
        });
        
    } catch (error) {
        console.error('Erro ao buscar código:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// ========================================
// SALVAR LOCALIZAÇÕES DO PLANO (SIMPLIFICADO)
// Salva diretamente o código da locação sem precisar existir no banco
// ========================================
router.post('/plano/salvar-localizacoes', async (req, res) => {
    try {
        const { plano_id, localizacoes } = req.body;
        
        console.log('📍 Salvando localizações para plano:', plano_id);
        console.log('📍 Localizações recebidas:', localizacoes);
        
        if (!plano_id) {
            return res.status(400).json({
                success: false,
                error: 'plano_id é obrigatório'
            });
        }
        
        if (!localizacoes || !Array.isArray(localizacoes) || localizacoes.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Pelo menos uma localização deve ser fornecida'
            });
        }
        
        // Verificar se plano existe
        const [plano] = await db.query(
            'SELECT id, codigo_plano, status FROM planos_corte WHERE id = ?',
            [plano_id]
        );
        
        if (!plano || plano.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Plano não encontrado'
            });
        }
        
        // Limpar localizações anteriores (se houver)
        await db.query('DELETE FROM plano_locacoes WHERE plano_corte_id = ?', [plano_id]);
        
        // Inserir novas localizações
        const locacoesInseridas = [];
        
        for (let i = 0; i < localizacoes.length; i++) {
            const codigoLocacao = localizacoes[i];
            
            // Inserir diretamente com código (locacao_id pode ser NULL)
            await db.query(
                `INSERT INTO plano_locacoes 
                (plano_corte_id, locacao_id, codigo_locacao, validada_qr, data_scan, ordem_scan)
                VALUES (?, NULL, ?, TRUE, NOW(), ?)`,
                [plano_id, codigoLocacao, i + 1]
            );
            
            locacoesInseridas.push({
                codigo: codigoLocacao,
                ordem: i + 1
            });
            
            console.log(`✅ Localização ${codigoLocacao} salva para plano ${plano[0].codigo_plano}`);
        }
        
        // Atualizar status do plano para finalizado
        await db.query(`
            UPDATE planos_corte
            SET status = 'finalizado',
                data_finalizacao = NOW()
            WHERE id = ?
        `, [plano_id]);
        
        console.log(`✅ Plano ${plano[0].codigo_plano} finalizado com ${locacoesInseridas.length} localização(ões)`);
        
        res.json({
            success: true,
            message: `Plano finalizado e armazenado em ${locacoesInseridas.length} localização(ões)`,
            data: {
                plano_id,
                codigo_plano: plano[0].codigo_plano,
                localizacoes: locacoesInseridas
            }
        });
        
    } catch (error) {
        console.error('❌ Erro ao salvar localizações:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ========================================
// ALOCAR LOCALIZAÇÕES PARA PLANO FINALIZADO
// ========================================
router.post('/plano/alocar-localizacoes', async (req, res) => {
    try {
        const { plano_id, localizacoes } = req.body;
        
        if (!plano_id) {
            return res.status(400).json({
                success: false,
                error: 'plano_id é obrigatório'
            });
        }
        
        if (!localizacoes || !Array.isArray(localizacoes) || localizacoes.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Pelo menos uma localização deve ser fornecida'
            });
        }
        
        console.log(`📍 Alocando ${localizacoes.length} localização(ões) para plano ${plano_id}...`);
        
        // Verificar se plano existe e está finalizado
        const [plano] = await db.query(
            'SELECT id, codigo_plano, status FROM planos_corte WHERE id = ?',
            [plano_id]
        );
        
        if (!plano || plano.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Plano não encontrado'
            });
        }
        
        if (plano[0].status !== 'finalizado') {
            return res.status(400).json({
                success: false,
                error: 'Apenas planos finalizados podem ser alocados em localizações'
            });
        }
        
        // Inserir localizações
        const locacoesInseridas = [];
        
        for (let i = 0; i < localizacoes.length; i++) {
            const loc = localizacoes[i];
            
            // Buscar localização no banco (pode ser por ID ou código)
            let locacao;
            
            if (loc.id) {
                // Busca por ID
                const [result] = await db.query(
                    'SELECT id, codigo FROM locacoes WHERE id = ?',
                    [loc.id]
                );
                locacao = result[0];
            } else if (loc.codigo) {
                // Busca por código (LOC-123 ou formato N-X-N)
                const [result] = await db.query(
                    'SELECT id, codigo FROM locacoes WHERE codigo = ?',
                    [loc.codigo]
                );
                locacao = result[0];
            }
            
            if (!locacao) {
                console.warn(`⚠️ Localização não encontrada:`, loc);
                continue; // Pula essa localização
            }
            
            // Verificar se já não foi inserida (evitar duplicatas)
            const [existente] = await db.query(
                'SELECT id FROM plano_locacoes WHERE plano_corte_id = ? AND locacao_id = ?',
                [plano_id, locacao.id]
            );
            
            if (existente && existente.length > 0) {
                console.log(`ℹ️ Localização ${locacao.codigo} já está vinculada ao plano`);
                continue;
            }
            
            // Inserir vínculo
            await db.query(
                `INSERT INTO plano_locacoes 
                (plano_corte_id, locacao_id, codigo_locacao, validada_qr, data_scan, ordem_scan)
                VALUES (?, ?, ?, TRUE, NOW(), ?)`,
                [plano_id, locacao.id, locacao.codigo, i + 1]
            );
            
            locacoesInseridas.push({
                id: locacao.id,
                codigo: locacao.codigo,
                ordem: i + 1
            });
            
            console.log(`✅ Localização ${locacao.codigo} vinculada ao plano ${plano[0].codigo_plano}`);
        }
        
        res.json({
            success: true,
            message: `${locacoesInseridas.length} localização(ões) vinculada(s) ao plano`,
            data: {
                plano_id,
                codigo_plano: plano[0].codigo_plano,
                localizacoes: locacoesInseridas
            }
        });
        
    } catch (error) {
        console.error('❌ Erro ao alocar localizações:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ========================================
// BUSCAR LOCALIZAÇÕES DE UM PLANO
// ========================================
router.get('/plano/:id/localizacoes', async (req, res) => {
    try {
        const planoId = req.params.id;
        
        const [localizacoes] = await db.query(
            `SELECT 
                pl.id,
                pl.codigo_locacao,
                pl.validada_qr,
                pl.data_scan,
                pl.ordem_scan,
                l.corredor,
                l.coluna,
                l.altura,
                l.tipo_localizacao
            FROM plano_locacoes pl
            JOIN locacoes l ON pl.locacao_id = l.id
            WHERE pl.plano_corte_id = ?
            ORDER BY pl.ordem_scan ASC`,
            [planoId]
        );
        
        res.json({
            success: true,
            data: localizacoes
        });
        
    } catch (error) {
        console.error('❌ Erro ao buscar localizações do plano:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ========================================
// LISTAR PLANOS FINALIZADOS PARA CARREGAMENTO
// ========================================
router.get('/planos-finalizados', async (req, res) => {
    try {
        const [planos] = await db.query(`
            SELECT 
                pc.id,
                pc.codigo_plano,
                pc.cliente,
                pc.aviario,
                pc.observacoes,
                pc.data_criacao,
                pc.data_finalizacao,
                COUNT(DISTINCT cr.id) as total_cortes
            FROM planos_corte pc
            LEFT JOIN cortes_realizados cr ON cr.plano_corte_id = pc.id
            WHERE pc.status = 'finalizado'
            GROUP BY pc.id
            ORDER BY pc.data_finalizacao DESC
            LIMIT 50
        `);
        
        // Para cada plano, buscar localizações e carregamentos
        for (let plano of planos) {
            // Buscar localizações
            const [localizacoes] = await db.query(`
                SELECT pl.codigo_locacao, l.corredor, l.coluna, l.altura
                FROM plano_locacoes pl
                LEFT JOIN locacoes l ON pl.locacao_id = l.id
                WHERE pl.plano_corte_id = ?
                ORDER BY pl.ordem_scan
            `, [plano.id]);
            plano.localizacoes = localizacoes;
            
            // Verificar se já tem carregamento
            const [carregamento] = await db.query(`
                SELECT id, codigo_carregamento, status, total_cortes, cortes_carregados
                FROM carregamentos
                WHERE plano_corte_id = ?
                ORDER BY data_inicio DESC
                LIMIT 1
            `, [plano.id]);
            plano.carregamento = carregamento[0] || null;
        }
        
        res.json({
            success: true,
            data: planos
        });
        
    } catch (error) {
        console.error('❌ Erro ao buscar planos finalizados:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ========================================
// CARREGAMENTO: INICIAR
// ========================================
router.post('/carregamento/iniciar', async (req, res) => {
    try {
        const { plano_id, operador_nome } = req.body;
        
        if (!plano_id) {
            return res.status(400).json({
                success: false,
                error: 'plano_id é obrigatório'
            });
        }
        
        // Verificar se plano existe e está finalizado
        const [plano] = await db.query(
            'SELECT id, codigo_plano, status FROM planos_corte WHERE id = ?',
            [plano_id]
        );
        
        if (!plano || plano.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Plano não encontrado'
            });
        }
        
        if (plano[0].status !== 'finalizado') {
            return res.status(400).json({
                success: false,
                error: 'Apenas planos finalizados podem ser carregados'
            });
        }
        
        // Verificar se já existe carregamento em andamento
        const [carregamentoExistente] = await db.query(
            'SELECT id FROM carregamentos WHERE plano_corte_id = ? AND status = ?',
            [plano_id, 'em_andamento']
        );
        
        if (carregamentoExistente && carregamentoExistente.length > 0) {
            return res.status(400).json({
                success: false,
                error: 'Já existe um carregamento em andamento para este plano',
                carregamento_id: carregamentoExistente[0].id
            });
        }
        
        // Contar total de cortes do plano
        const [totalCortes] = await db.query(
            'SELECT COUNT(*) as total FROM cortes_realizados WHERE plano_corte_id = ?',
            [plano_id]
        );
        
        const total = totalCortes[0].total;
        
        if (total === 0) {
            return res.status(400).json({
                success: false,
                error: 'Plano não possui cortes realizados'
            });
        }
        
        // Gerar código sequencial (CAR-2025-00001)
        const ano = new Date().getFullYear();
        const [ultimoCodigo] = await db.query(
            `SELECT codigo_carregamento 
             FROM carregamentos 
             WHERE codigo_carregamento LIKE ? 
             ORDER BY id DESC 
             LIMIT 1`,
            [`CAR-${ano}-%`]
        );
        
        let novoNumero = 1;
        if (ultimoCodigo && ultimoCodigo.length > 0) {
            const match = ultimoCodigo[0].codigo_carregamento.match(/CAR-\d+-(\d+)/);
            if (match) {
                novoNumero = parseInt(match[1]) + 1;
            }
        }
        
        const codigoCarregamento = `CAR-${ano}-${String(novoNumero).padStart(5, '0')}`;
        
        // Criar carregamento
        const [result] = await db.query(
            `INSERT INTO carregamentos 
            (codigo_carregamento, plano_corte_id, status, total_cortes, cortes_carregados, operador_nome)
            VALUES (?, ?, 'em_andamento', ?, 0, ?)`,
            [codigoCarregamento, plano_id, total, operador_nome || null]
        );
        
        console.log(`✅ Carregamento ${codigoCarregamento} iniciado para plano ${plano[0].codigo_plano}`);
        
        res.json({
            success: true,
            message: 'Carregamento iniciado',
            data: {
                id: result.insertId,
                codigo_carregamento: codigoCarregamento,
                plano_id,
                codigo_plano: plano[0].codigo_plano,
                total_cortes: total,
                cortes_carregados: 0
            }
        });
        
    } catch (error) {
        console.error('❌ Erro ao iniciar carregamento:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ========================================
// CARREGAMENTO: VALIDAR CORTE
// ========================================
router.post('/carregamento/validar-corte', async (req, res) => {
    try {
        const { carregamento_id, codigo_corte } = req.body;
        
        if (!carregamento_id || !codigo_corte) {
            return res.status(400).json({
                success: false,
                error: 'carregamento_id e codigo_corte são obrigatórios'
            });
        }
        
        // Buscar carregamento
        const [carregamento] = await db.query(
            'SELECT id, plano_corte_id, status, total_cortes, cortes_carregados FROM carregamentos WHERE id = ?',
            [carregamento_id]
        );
        
        if (!carregamento || carregamento.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Carregamento não encontrado'
            });
        }
        
        if (carregamento[0].status !== 'em_andamento') {
            return res.status(400).json({
                success: false,
                error: 'Carregamento não está em andamento'
            });
        }
        
        // Buscar corte pelo código
        const [corte] = await db.query(`
            SELECT 
                cr.id,
                cr.codigo_corte,
                cr.plano_corte_id,
                cr.metragem_cortada,
                p.codigo as produto_codigo,
                c.nome_cor,
                g.gramatura
            FROM cortes_realizados cr
            JOIN produtos p ON cr.produto_id = p.id
            LEFT JOIN configuracoes_cores c ON p.cor_id = c.id
            LEFT JOIN configuracoes_gramaturas g ON p.gramatura_id = g.id
            WHERE cr.codigo_corte = ?
        `, [codigo_corte]);
        
        if (!corte || corte.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Corte não encontrado',
                validacao: 'invalido'
            });
        }
        
        // Verificar se corte pertence ao plano do carregamento
        if (corte[0].plano_corte_id !== carregamento[0].plano_corte_id) {
            return res.status(400).json({
                success: false,
                error: 'Este corte não pertence ao plano deste carregamento',
                validacao: 'plano_errado',
                corte: corte[0]
            });
        }
        
        // Verificar se já foi escaneado neste carregamento
        const [jaEscaneado] = await db.query(
            'SELECT id FROM carregamentos_itens WHERE carregamento_id = ? AND corte_id = ?',
            [carregamento_id, corte[0].id]
        );
        
        if (jaEscaneado && jaEscaneado.length > 0) {
            return res.status(400).json({
                success: false,
                error: 'Este corte já foi escaneado neste carregamento',
                validacao: 'duplicado',
                corte: corte[0]
            });
        }
        
        // Adicionar corte ao carregamento
        const ordemScan = carregamento[0].cortes_carregados + 1;
        
        await db.query(
            `INSERT INTO carregamentos_itens (carregamento_id, corte_id, ordem_scan)
             VALUES (?, ?, ?)`,
            [carregamento_id, corte[0].id, ordemScan]
        );
        
        // Atualizar contador
        await db.query(
            'UPDATE carregamentos SET cortes_carregados = cortes_carregados + 1 WHERE id = ?',
            [carregamento_id]
        );
        
        const novosCarregados = carregamento[0].cortes_carregados + 1;
        const completo = novosCarregados >= carregamento[0].total_cortes;
        
        console.log(`✅ Corte ${codigo_corte} validado no carregamento (${novosCarregados}/${carregamento[0].total_cortes})`);
        
        res.json({
            success: true,
            message: 'Corte validado',
            validacao: 'valido',
            data: {
                corte: corte[0],
                ordem_scan: ordemScan,
                progresso: {
                    carregados: novosCarregados,
                    total: carregamento[0].total_cortes,
                    percentual: Math.round((novosCarregados / carregamento[0].total_cortes) * 100)
                },
                completo
            }
        });
        
    } catch (error) {
        console.error('❌ Erro ao validar corte:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ========================================
// CARREGAMENTO: FINALIZAR
// ========================================
router.post('/carregamento/finalizar', async (req, res) => {
    try {
        const { carregamento_id } = req.body;
        
        if (!carregamento_id) {
            return res.status(400).json({
                success: false,
                error: 'carregamento_id é obrigatório'
            });
        }
        
        // Buscar carregamento
        const [carregamento] = await db.query(
            'SELECT id, codigo_carregamento, total_cortes, cortes_carregados FROM carregamentos WHERE id = ?',
            [carregamento_id]
        );
        
        if (!carregamento || carregamento.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Carregamento não encontrado'
            });
        }
        
        // Verificar se todos os cortes foram carregados
        if (carregamento[0].cortes_carregados < carregamento[0].total_cortes) {
            return res.status(400).json({
                success: false,
                error: `Apenas ${carregamento[0].cortes_carregados} de ${carregamento[0].total_cortes} cortes foram carregados`,
                pode_finalizar_parcial: true
            });
        }
        
        // Finalizar carregamento
        await db.query(
            'UPDATE carregamentos SET status = ?, data_conclusao = NOW() WHERE id = ?',
            ['concluido', carregamento_id]
        );
        
        console.log(`✅ Carregamento ${carregamento[0].codigo_carregamento} finalizado`);
        
        res.json({
            success: true,
            message: 'Carregamento finalizado com sucesso',
            data: {
                codigo_carregamento: carregamento[0].codigo_carregamento,
                total_cortes: carregamento[0].total_cortes
            }
        });
        
    } catch (error) {
        console.error('❌ Erro ao finalizar carregamento:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ========== ADMIN: Reverter plano para em_producao ==========
router.post('/plano/reverter/:id', async (req, res) => {
    try {
        const planoId = req.params.id;
        
        // Verificar se plano existe
        const [plano] = await db.query(
            'SELECT id, codigo_plano, status FROM planos_corte WHERE id = ?',
            [planoId]
        );
        
        if (!plano || plano.length === 0) {
            return res.status(404).json({ success: false, error: 'Plano não encontrado' });
        }
        
        // Limpar localizações
        await db.query('DELETE FROM plano_locacoes WHERE plano_corte_id = ?', [planoId]);
        
        // Reverter status
        await db.query(`
            UPDATE planos_corte 
            SET status = 'em_producao', 
                data_finalizacao = NULL 
            WHERE id = ?
        `, [planoId]);
        
        console.log(`✅ Plano ${plano[0].codigo_plano} revertido para em_producao`);
        
        res.json({
            success: true,
            message: `Plano ${plano[0].codigo_plano} revertido para em_producao`,
            data: { plano_id: planoId, status: 'em_producao' }
        });
        
    } catch (error) {
        console.error('❌ Erro ao reverter plano:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ========================================
// MOBILE V2.0 - NOVOS ENDPOINTS
// ========================================

/**
 * Valida código de barras e retorna tipo + ID
 * GET /api/mobile/validar-codigo/:codigo
 * Suporta códigos compactos (sem zeros) e completos (com zeros)
 */
router.get('/validar-codigo/:codigo', async (req, res) => {
    try {
        const codigoOriginal = req.params.codigo.toUpperCase();
        // Normaliza código compacto para formato completo
        const codigo = normalizarCodigoBarras(codigoOriginal);
        console.log('🔍 Validando código:', codigoOriginal, '→', codigo);

        let tipo = null;
        let id = null;
        let dados = null;

        // Detecta tipo pelo prefixo
        if (codigo.startsWith('BOB-')) {
            tipo = 'bobina';
            // Busca bobina pelo código
            const [bobinas] = await db.query(
                'SELECT id, codigo_interno as codigo FROM bobinas WHERE codigo_interno = ?',
                [codigo]
            );
            if (bobinas.length > 0) {
                id = bobinas[0].id;
                dados = bobinas[0];
            }

        } else if (codigo.startsWith('RET-')) {
            tipo = 'retalho';
            // Busca retalho pelo código com mais informações para debug
            const [retalhos] = await db.query(
                'SELECT id, codigo_retalho as codigo, metragem, status FROM retalhos WHERE codigo_retalho = ?',
                [codigo]
            );
            console.log(`🔍 Busca retalho ${codigo}:`, retalhos.length > 0 ? `Encontrado ID ${retalhos[0].id}` : 'NÃO ENCONTRADO');
            if (retalhos.length > 0) {
                id = retalhos[0].id;
                dados = retalhos[0];
            }

        } else if (codigo.startsWith('COR-')) {
            tipo = 'corte';
            // Busca corte pelo código
            const [cortes] = await db.query(
                'SELECT id, codigo_corte as codigo FROM cortes_realizados WHERE codigo_corte = ?',
                [codigo]
            );
            if (cortes.length > 0) {
                id = cortes[0].id;
                dados = cortes[0];
            }

        } else if (codigo.startsWith('PDC-')) {
            tipo = 'pdc';
            // Busca plano pelo código
            const [planos] = await db.query(
                'SELECT id, codigo_plano as codigo FROM planos_corte WHERE codigo_plano = ?',
                [codigo]
            );
            if (planos.length > 0) {
                id = planos[0].id;
                dados = planos[0];
            }

        } else if (codigo.startsWith('LOC-')) {
            tipo = 'locacao';
            // Remove prefixo LOC- para obter código real
            // LOC-1-A-1 → 1-A-1
            // LOC-0001-A-0001 → 0001-A-0001
            const codigoLocacao = codigo.substring(4);
            console.log('🔍 Buscando itens na locação:', codigoLocacao);
            
            // Gera todas as variações para encontrar itens
            const variacoes = gerarVariacoesLocacao(codigoLocacao);
            console.log('🔍 Variações de busca:', variacoes);
            
            // Busca itens (bobinas/retalhos) que estão nessa locação
            // Locação não precisa estar cadastrada, é referência livre
            const [bobinas] = await db.query(
                'SELECT COUNT(*) as total FROM bobinas WHERE locacao IN (?) AND status != "Esgotado"',
                [variacoes]
            );
            const [retalhos] = await db.query(
                'SELECT COUNT(*) as total FROM retalhos WHERE locacao IN (?) AND status != "Esgotado"',
                [variacoes]
            );
            
            const totalItens = (bobinas[0]?.total || 0) + (retalhos[0]?.total || 0);
            
            // Normaliza código para exibição
            const codigoNormalizado = normalizarLocacao(codigoLocacao) || codigoLocacao;
            
            // Se encontrou itens OU locação é válida (formato correto), aceita
            if (totalItens > 0 || validarLocacao(codigoLocacao)) {
                id = codigoNormalizado; // ID é o código normalizado
                dados = { 
                    codigo: codigoNormalizado, 
                    total_itens: totalItens,
                    vazia: totalItens === 0
                };
                console.log(`✅ Locação ${codigoNormalizado}: ${totalItens} item(ns)`);
            } else {
                console.log(`❌ Formato inválido: ${codigoLocacao}`);
            }

        } else if (/^\d{1,4}-?[A-Z]-?\d{1,4}$/i.test(codigo)) {
            // Formato N-X-N sem prefixo (backward compatible)
            // Aceita: 1-A-1, 12-B-34, 123-C-456, 0001-A-0001, 1a1, etc
            tipo = 'locacao';
            console.log('🔍 Buscando itens na locação (sem prefixo):', codigo);
            
            // Gera todas as variações para encontrar itens
            const variacoes = gerarVariacoesLocacao(codigo);
            console.log('🔍 Variações de busca:', variacoes);
            
            // Busca itens (bobinas/retalhos) que estão nessa locação
            const [bobinas] = await db.query(
                'SELECT COUNT(*) as total FROM bobinas WHERE locacao IN (?) AND status != "Esgotado"',
                [variacoes]
            );
            const [retalhos] = await db.query(
                'SELECT COUNT(*) as total FROM retalhos WHERE locacao IN (?) AND status != "Esgotado"',
                [variacoes]
            );
            
            const totalItens = (bobinas[0]?.total || 0) + (retalhos[0]?.total || 0);
            
            // Normaliza código para exibição
            const codigoNormalizado = normalizarLocacao(codigo) || codigo;
            
            id = codigoNormalizado; // ID é o código normalizado
            dados = { 
                codigo: codigoNormalizado, 
                total_itens: totalItens,
                vazia: totalItens === 0
            };
            console.log(`✅ Locação ${codigoNormalizado}: ${totalItens} item(ns)`);

        } else {
            return res.json({
                success: false,
                error: 'Código não reconhecido. Use BOB, RET, COR, PDC ou LOC.'
            });
        }

        if (!id || !dados) {
            console.log(`❌ ${tipo?.toUpperCase() || 'ITEM'} não encontrado no banco:`, codigo);
            
            // Mensagens de ajuda específicas por tipo
            let dica = 'Verifique se o código está correto ou se o item existe no sistema';
            let endpoint_debug = null;
            
            if (tipo === 'retalho') {
                dica = '💡 Use o endpoint de debug para ver códigos disponíveis: GET /api/mobile/debug/retalho/' + codigo;
                endpoint_debug = `/api/mobile/debug/retalho/${codigo}`;
            } else if (tipo === 'bobina') {
                dica = '💡 Verifique se a bobina foi cadastrada e não está esgotada';
            }
            
            return res.json({
                success: false,
                error: `${tipo?.toUpperCase() || 'ITEM'} não encontrado: ${codigo}`,
                details: {
                    codigo,
                    tipo,
                    message: dica,
                    endpoint_debug
                }
            });
        }

        console.log('✅ Código validado:', tipo, id, '- Dados:', dados);

        res.json({
            success: true,
            data: {
                tipo,
                id,
                codigo,
                ...dados
            }
        });

    } catch (error) {
        console.error('❌ Erro ao validar código:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * Lista PDCs em produção (status = 'em_producao')
 * GET /api/mobile/pdcs/producao
 */
router.get('/pdcs/producao', async (req, res) => {
    try {
        const loja = req.query.loja; // Filtro opcional por loja
        console.log('📋 Buscando PDCs em produção', loja ? `(loja: ${loja})` : '');

        let query = `
            SELECT 
                pc.id,
                pc.codigo_plano,
                pc.cliente,
                pc.aviario,
                pc.status,
                pc.data_criacao,
                COUNT(DISTINCT ipc.id) as total_cortes,
                COUNT(DISTINCT cr.id) as cortes_concluidos
            FROM planos_corte pc
            LEFT JOIN itens_plano_corte ipc ON ipc.plano_corte_id = pc.id
            LEFT JOIN cortes_realizados cr ON cr.item_plano_corte_id = ipc.id
            WHERE pc.status = 'em_producao'
        `;

        const params = [];
        if (loja) {
            query += ' AND pc.loja = ?';
            params.push(loja);
        }

        query += `
            GROUP BY pc.id
            ORDER BY pc.data_criacao DESC
        `;

        const [pdcs] = await db.query(query, params);

        // Calcula progresso para cada PDC
        const pdcsComProgresso = pdcs.map(pdc => ({
            ...pdc,
            progresso: pdc.total_cortes > 0 
                ? Math.round((pdc.cortes_concluidos / pdc.total_cortes) * 100)
                : 0
        }));

        console.log(`✅ ${pdcs.length} PDCs encontrados em produção`);

        res.json({
            success: true,
            data: pdcsComProgresso,
            total: pdcs.length
        });

    } catch (error) {
        console.error('❌ Erro ao buscar PDCs em produção:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * Busca origens (bobinas/retalhos) de um PDC com cortes agrupados
 * GET /api/mobile/pdcs/:id/origens
 */
router.get('/pdcs/:id/origens', async (req, res) => {
    try {
        const pdcId = req.params.id;
        console.log('🎯 Buscando origens do PDC:', pdcId);

        // Busca informações do PDC
        const [pdcs] = await db.query(
            'SELECT * FROM planos_corte WHERE id = ?',
            [pdcId]
        );

        if (pdcs.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'PDC não encontrado'
            });
        }

        const pdc = pdcs[0];

        // Busca alocações (origens) agrupadas
        const [alocacoes] = await db.query(`
            SELECT 
                ac.tipo_origem as origem_tipo,
                ac.bobina_id,
                ac.retalho_id,
                COALESCE(ac.bobina_id, ac.retalho_id) as origem_id,
                MAX(CASE 
                    WHEN ac.tipo_origem = 'bobina' THEN b.codigo_interno
                    WHEN ac.tipo_origem = 'retalho' THEN r.codigo_retalho
                END) as codigo,
                MAX(CASE 
                    WHEN ac.tipo_origem = 'bobina' THEN b.locacao
                    WHEN ac.tipo_origem = 'retalho' THEN r.locacao
                END) as locacao,
                MAX(CONCAT(p.codigo, ' - ', COALESCE(c.nome_cor, ''), ' ', COALESCE(g.gramatura, ''), 'g/m²')) as produto,
                COUNT(DISTINCT ipc.id) as total_cortes,
                COUNT(DISTINCT cr.id) as cortes_concluidos
            FROM alocacoes_corte ac
            JOIN itens_plano_corte ipc ON ipc.id = ac.item_plano_corte_id
            LEFT JOIN bobinas b ON ac.tipo_origem = 'bobina' AND ac.bobina_id = b.id
            LEFT JOIN retalhos r ON ac.tipo_origem = 'retalho' AND ac.retalho_id = r.id
            LEFT JOIN produtos p ON (b.produto_id = p.id OR r.produto_id = p.id)
            LEFT JOIN configuracoes_cores c ON c.id = p.cor_id
            LEFT JOIN configuracoes_gramaturas g ON g.id = p.gramatura_id
            LEFT JOIN cortes_realizados cr ON cr.item_plano_corte_id = ipc.id 
                AND cr.origem_tipo = ac.tipo_origem 
                AND ((cr.bobina_id = ac.bobina_id AND ac.tipo_origem = 'bobina')
                     OR (cr.retalho_id = ac.retalho_id AND ac.tipo_origem = 'retalho'))
            WHERE ipc.plano_corte_id = ?
            GROUP BY ac.tipo_origem, ac.bobina_id, ac.retalho_id
            ORDER BY ac.tipo_origem, codigo
        `, [pdcId]);

        // Para cada origem, busca seus cortes
        const origensComCortes = await Promise.all(alocacoes.map(async (origem) => {
            const whereConditions = origem.origem_tipo === 'bobina' 
                ? 'AND ac.bobina_id = ?' 
                : 'AND ac.retalho_id = ?';
            
            const [cortes] = await db.query(`
                SELECT 
                    ipc.id as item_id,
                    ipc.metragem,
                    cr.id as corte_id,
                    cr.codigo_corte,
                    cr.status
                FROM itens_plano_corte ipc
                JOIN alocacoes_corte ac ON ac.item_plano_corte_id = ipc.id
                LEFT JOIN cortes_realizados cr ON cr.item_plano_corte_id = ipc.id
                    AND cr.origem_tipo = ac.tipo_origem
                    AND ((cr.bobina_id = ac.bobina_id AND ac.tipo_origem = 'bobina')
                         OR (cr.retalho_id = ac.retalho_id AND ac.tipo_origem = 'retalho'))
                WHERE ipc.plano_corte_id = ?
                    AND ac.tipo_origem = ?
                    ${whereConditions}
                ORDER BY ipc.id
            `, [pdcId, origem.origem_tipo, origem.origem_id]);

            return {
                tipo: origem.origem_tipo,
                id: origem.origem_id,
                codigo: origem.codigo,
                locacao: origem.locacao,
                produto: origem.produto,
                total_cortes: origem.total_cortes,
                cortes_concluidos: origem.cortes_concluidos,
                cortes: cortes.map(c => ({
                    id: c.item_id,
                    codigo_corte: c.codigo_corte,
                    metragem: parseFloat(c.metragem),
                    status: c.status || 'pendente'
                }))
            };
        }));

        console.log(`✅ ${origensComCortes.length} origens encontradas`);

        res.json({
            success: true,
            pdc: {
                id: pdc.id,
                codigo_plano: pdc.codigo_plano,
                cliente: pdc.cliente,
                aviario: pdc.aviario,
                status: pdc.status
            },
            origens: origensComCortes
        });

    } catch (error) {
        console.error('❌ Erro ao buscar origens:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * Valida se código escaneado é a origem esperada
 * POST /api/mobile/pdcs/validar-origem
 */
router.post('/pdcs/validar-origem', async (req, res) => {
    try {
        const {
            pdc_id,
            origem_esperada_id,
            origem_esperada_tipo,
            codigo_escaneado
        } = req.body;

        console.log('🔍 Validando origem escaneada:', codigo_escaneado);

        // Busca o item pelo código (codigo_interno para bobinas, codigo_retalho para retalhos)
        const validacao = await db.query(
            origem_esperada_tipo === 'bobina'
                ? 'SELECT id, codigo_interno as codigo FROM bobinas WHERE codigo_interno = ?'
                : 'SELECT id, codigo_retalho as codigo FROM retalhos WHERE codigo_retalho = ?',
            [codigo_escaneado]
        );

        const [itens] = validacao;

        if (itens.length === 0) {
            return res.json({
                success: false,
                valido: false,
                erro: 'Código não encontrado no sistema'
            });
        }

        const item = itens[0];

        // Verifica se é a origem esperada
        const valido = (item.id === origem_esperada_id);

        if (!valido) {
            return res.json({
                success: false,
                valido: false,
                erro: `Código incorreto. Esperado: ${origem_esperada_tipo.toUpperCase()} ID ${origem_esperada_id}`
            });
        }

        console.log('✅ Origem validada com sucesso');

        res.json({
            success: true,
            valido: true,
            origem: {
                tipo: origem_esperada_tipo,
                id: item.id,
                codigo: item.codigo
            }
        });

    } catch (error) {
        console.error('❌ Erro ao validar origem:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * Atualiza locação de bobina ou retalho após cortes
 * POST /api/mobile/pdcs/atualizar-locacao
 */
router.post('/pdcs/atualizar-locacao', async (req, res) => {
    try {
        const { tipo, id, nova_locacao } = req.body;

        console.log(`📍 Atualizando locação ${tipo} ID ${id}:`, nova_locacao);

        const tabela = tipo === 'bobina' ? 'bobinas' : 'retalhos';

        await db.query(
            `UPDATE ${tabela} SET locacao = ? WHERE id = ?`,
            [nova_locacao, id]
        );

        console.log('✅ Locação atualizada');

        res.json({
            success: true,
            message: 'Locação atualizada com sucesso',
            data: { tipo, id, nova_locacao }
        });

    } catch (error) {
        console.error('❌ Erro ao atualizar locação:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * Lista PDCs finalizados disponíveis para carregamento
 * GET /api/mobile/carregamento/disponiveis
 */
router.get('/carregamento/disponiveis', async (req, res) => {
    try {
        const loja = req.query.loja;
        console.log('📦 Buscando PDCs disponíveis para carregamento');

        let query = `
            SELECT 
                pc.id,
                pc.codigo_plano,
                pc.cliente,
                pc.aviario,
                pc.data_finalizacao,
                pc.loja,
                COUNT(DISTINCT cr.id) as total_cortes,
                GROUP_CONCAT(DISTINCT pl.locacao_id) as locacoes_ids
            FROM planos_corte pc
            LEFT JOIN cortes_realizados cr ON cr.plano_id = pc.id
            LEFT JOIN plano_locacoes pl ON pl.plano_id = pc.id
            WHERE pc.status = 'finalizado'
            AND pc.id NOT IN (
                SELECT DISTINCT plano_id 
                FROM carregamentos 
                WHERE status = 'concluido'
            )
        `;

        const params = [];
        if (loja) {
            query += ' AND pc.loja = ?';
            params.push(loja);
        }

        query += `
            GROUP BY pc.id
            ORDER BY pc.data_finalizacao DESC
        `;

        const [pdcs] = await db.query(query, params);

        // Busca locações para cada PDC
        const pdcsComLocacoes = await Promise.all(pdcs.map(async (pdc) => {
            const [locacoes] = await db.query(`
                SELECT l.id, l.locacao
                FROM plano_locacoes pl
                JOIN locacoes l ON l.id = pl.locacao_id
                WHERE pl.plano_id = ?
            `, [pdc.id]);

            return {
                ...pdc,
                locacoes: locacoes.map(l => l.locacao)
            };
        }));

        console.log(`✅ ${pdcs.length} PDCs disponíveis`);

        res.json({
            success: true,
            data: pdcsComLocacoes,
            total: pdcs.length
        });

    } catch (error) {
        console.error('❌ Erro ao buscar PDCs disponíveis:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * Valida corte escaneado durante carregamento
 * POST /api/mobile/carregamento/validar-corte
 */
router.post('/carregamento/validar-corte', async (req, res) => {
    try {
        const { carregamento_id, codigo_corte } = req.body;

        console.log('🔍 Validando corte:', codigo_corte);

        // Busca o carregamento
        const [carregamentos] = await db.query(
            'SELECT * FROM carregamentos WHERE id = ?',
            [carregamento_id]
        );

        if (carregamentos.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Carregamento não encontrado'
            });
        }

        const carregamento = carregamentos[0];

        // Busca o corte
        const [cortes] = await db.query(
            'SELECT * FROM cortes_realizados WHERE codigo_corte = ?',
            [codigo_corte]
        );

        if (cortes.length === 0) {
            return res.json({
                success: false,
                valido: false,
                erro: 'Corte não encontrado'
            });
        }

        const corte = cortes[0];

        // Verifica se o corte pertence ao plano correto
        if (corte.plano_id !== carregamento.plano_id) {
            // Busca o PDC correto do corte
            const [pdcCorreto] = await db.query(
                'SELECT codigo_plano, cliente FROM planos_corte WHERE id = ?',
                [corte.plano_id]
            );

            return res.json({
                success: false,
                valido: false,
                erro: 'Corte pertence a outro PDC',
                corte: {
                    codigo_corte: corte.codigo_corte,
                    pdc_correto: pdcCorreto[0]?.codigo_plano,
                    cliente: pdcCorreto[0]?.cliente
                }
            });
        }

        // Verifica se já foi carregado
        const [jaCarregado] = await db.query(
            'SELECT * FROM carregamentos_itens WHERE carregamento_id = ? AND corte_id = ?',
            [carregamento_id, corte.id]
        );

        if (jaCarregado.length > 0) {
            return res.json({
                success: false,
                valido: false,
                erro: 'Corte já validado anteriormente'
            });
        }

        // Registra validação
        await db.query(`
            INSERT INTO carregamentos_itens (carregamento_id, corte_id, data_validacao)
            VALUES (?, ?, NOW())
        `, [carregamento_id, corte.id]);

        // Atualiza progresso
        const [progresso] = await db.query(`
            SELECT 
                COUNT(DISTINCT ci.corte_id) as validados,
                (SELECT COUNT(*) FROM cortes_realizados WHERE plano_id = ?) as total
            FROM carregamentos_itens ci
            WHERE ci.carregamento_id = ?
        `, [carregamento.plano_id, carregamento_id]);

        const { validados, total } = progresso[0];
        const percentual = Math.round((validados / total) * 100);

        console.log(`✅ Corte validado (${validados}/${total})`);

        res.json({
            success: true,
            valido: true,
            corte: {
                id: corte.id,
                codigo_corte: corte.codigo_corte,
                metragem: parseFloat(corte.metragem_cortada)
            },
            progresso: {
                validados,
                total,
                percentual
            }
        });

    } catch (error) {
        console.error('❌ Erro ao validar corte:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * Busca histórico de movimentações (placeholder)
 * GET /api/mobile/historico/:tipo/:id
 */
router.get('/historico/:tipo/:id', async (req, res) => {
    try {
        const { tipo, id } = req.params;

        console.log(`📜 Buscando histórico: ${tipo} ID ${id}`);

        // TODO: Implementar busca de histórico completo
        // Por enquanto retorna vazio

        res.json({
            success: true,
            data: [],
            message: 'Funcionalidade em desenvolvimento'
        });

    } catch (error) {
        console.error('❌ Erro ao buscar histórico:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * Solicita impressão de etiqueta (placeholder)
 * POST /api/mobile/imprimir
 */
router.post('/imprimir', async (req, res) => {
    try {
        const { tipo, id } = req.body;

        console.log(`🖨️ Solicitando impressão: ${tipo} ID ${id}`);

        // TODO: Integrar com sistema de impressão existente
        // Por enquanto apenas simula sucesso

        res.json({
            success: true,
            message: 'Etiqueta enviada para impressão',
            data: { tipo, id }
        });

    } catch (error) {
        console.error('❌ Erro ao imprimir:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * DEBUG: Endpoint para verificar existência de retalho
 * GET /api/mobile/debug/retalho/:codigo
 * 
 * Retorna informações detalhadas sobre um retalho específico
 * Se não encontrado, sugere códigos válidos da mesma loja
 */
router.get('/debug/retalho/:codigo', async (req, res) => {
    try {
        const codigo = req.params.codigo.toUpperCase();
        
        console.log('🔍 DEBUG: Verificando retalho:', codigo);
        
        // Busca completa
        const [retalhos] = await db.query(`
            SELECT 
                r.*,
                p.codigo as produto_codigo,
                p.loja,
                p.fabricante,
                CONCAT(c.nome_cor, ' ', g.gramatura, 'g/m² ', p.largura_final, 'm') as produto_descricao
            FROM retalhos r
            LEFT JOIN produtos p ON r.produto_id = p.id
            LEFT JOIN configuracoes_cores c ON c.id = p.cor_id
            LEFT JOIN configuracoes_gramaturas g ON g.id = p.gramatura_id
            WHERE r.codigo_retalho = ?
        `, [codigo]);
        
        if (retalhos.length === 0) {
            // Extrai loja do código (ex: RET-CIA-000013 → CIA)
            const partesCodeigo = codigo.split('-');
            const loja = partesCodeigo.length >= 2 ? partesCodeigo[1] : null;
            
            console.log(`⚠️ Retalho ${codigo} não encontrado. Buscando sugestões...`);
            
            // Busca códigos similares da mesma loja
            const [similares] = await db.query(`
                SELECT 
                    r.codigo_retalho, 
                    r.id, 
                    r.status, 
                    r.metragem,
                    p.loja,
                    CONCAT(c.nome_cor, ' ', g.gramatura, 'g/m² ', p.largura_final, 'm') as produto_descricao
                FROM retalhos r
                LEFT JOIN produtos p ON r.produto_id = p.id
                LEFT JOIN configuracoes_cores c ON c.id = p.cor_id
                LEFT JOIN configuracoes_gramaturas g ON g.id = p.gramatura_id
                WHERE r.codigo_retalho LIKE ?
                ORDER BY r.id DESC
                LIMIT 10
            `, [loja ? `RET-${loja}-%` : 'RET-%']);
            
            // Lista todos os retalhos disponíveis (não esgotados)
            const [disponiveis] = await db.query(`
                SELECT 
                    r.codigo_retalho,
                    r.status,
                    r.metragem,
                    p.loja,
                    CONCAT(c.nome_cor, ' ', g.gramatura, 'g/m² ', p.largura_final, 'm') as produto_descricao
                FROM retalhos r
                LEFT JOIN produtos p ON r.produto_id = p.id
                LEFT JOIN configuracoes_cores c ON c.id = p.cor_id
                LEFT JOIN configuracoes_gramaturas g ON g.id = p.gramatura_id
                WHERE r.status != 'Esgotado'
                ORDER BY r.id DESC
                LIMIT 20
            `);
            
            const [[{ total }]] = await db.query('SELECT COUNT(*) as total FROM retalhos');
            const [[{ disponiveis_count }]] = await db.query(
                "SELECT COUNT(*) as disponiveis_count FROM retalhos WHERE status != 'Esgotado'"
            );
            
            return res.json({
                success: false,
                encontrado: false,
                codigo_buscado: codigo,
                loja_extraida: loja,
                similares,
                retalhos_disponiveis: disponiveis,
                estatisticas: {
                    total_retalhos: total,
                    disponiveis: disponiveis_count,
                    esgotados: total - disponiveis_count
                },
                dica: `💡 Use um dos códigos listados em 'retalhos_disponiveis' para testar o scanner`
            });
        }
        
        console.log(`✅ Retalho ${codigo} encontrado:`, retalhos[0].id);
        
        res.json({
            success: true,
            encontrado: true,
            retalho: retalhos[0]
        });
        
    } catch (error) {
        console.error('❌ Erro no debug:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * DIAGNÓSTICO COMPLETO: Investigar dados reais de retalhos
 * GET /api/mobile/debug/todos-retalhos
 */
router.get('/debug/todos-retalhos', async (req, res) => {
    try {
        console.log('🔍 DIAGNÓSTICO COMPLETO: Listando todos os retalhos');
        
        // 1. Todos os retalhos com detalhes
        const [todos] = await db.query(`
            SELECT 
                r.id,
                r.codigo_retalho,
                r.metragem,
                r.status,
                r.produto_id,
                r.locacao,
                p.codigo as produto_codigo,
                p.loja,
                p.fabricante,
                CONCAT(c.nome_cor, ' ', g.gramatura, 'g/m² ', p.largura_final, 'm') as produto_descricao,
                CHAR_LENGTH(r.codigo_retalho) as tamanho_codigo
            FROM retalhos r
            LEFT JOIN produtos p ON r.produto_id = p.id
            LEFT JOIN configuracoes_cores c ON c.id = p.cor_id
            LEFT JOIN configuracoes_gramaturas g ON g.id = p.gramatura_id
            ORDER BY r.id DESC
            LIMIT 50
        `);
        
        // 2. Buscar especificamente RET-CIA-000013
        const [retalho13_exato] = await db.query(
            'SELECT * FROM retalhos WHERE codigo_retalho = ?',
            ['RET-CIA-000013']
        );
        
        // 3. Buscar com LIKE
        const [retalho13_like] = await db.query(
            "SELECT * FROM retalhos WHERE codigo_retalho LIKE '%000013%'"
        );
        
        // 4. Buscar por ID = 13
        const [retalho_id13] = await db.query(
            'SELECT * FROM retalhos WHERE id = 13'
        );
        
        // 5. Estatísticas
        const [[stats]] = await db.query(`
            SELECT 
                COUNT(*) as total,
                COUNT(CASE WHEN status = 'Disponível' THEN 1 END) as disponiveis,
                COUNT(CASE WHEN status = 'Esgotado' THEN 1 END) as esgotados,
                COUNT(CASE WHEN codigo_retalho LIKE 'RET-CIA-%' THEN 1 END) as loja_cia,
                COUNT(CASE WHEN codigo_retalho LIKE 'RET-PLA-%' THEN 1 END) as loja_pla,
                COUNT(CASE WHEN codigo_retalho IS NULL OR codigo_retalho = '' THEN 1 END) as sem_codigo
            FROM retalhos
        `);
        
        res.json({
            success: true,
            diagnostico: {
                busca_ret_cia_000013_exato: {
                    encontrado: retalho13_exato.length > 0,
                    quantidade: retalho13_exato.length,
                    dados: retalho13_exato[0] || null
                },
                busca_ret_cia_000013_like: {
                    encontrado: retalho13_like.length > 0,
                    quantidade: retalho13_like.length,
                    dados: retalho13_like[0] || null
                },
                busca_id_13: {
                    encontrado: retalho_id13.length > 0,
                    dados: retalho_id13[0] || null
                },
                estatisticas: stats,
                todos_retalhos: todos.map(r => ({
                    id: r.id,
                    codigo_retalho: r.codigo_retalho,
                    tamanho_codigo: r.tamanho_codigo,
                    codigo_hex: Buffer.from(r.codigo_retalho || '').toString('hex'),
                    metragem: r.metragem,
                    status: r.status,
                    loja: r.loja,
                    produto: r.produto_descricao
                }))
            }
        });
        
    } catch (error) {
        console.error('❌ Erro no diagnóstico completo:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

console.log('✅ Mobile v2.0 routes carregadas');

module.exports = router;
