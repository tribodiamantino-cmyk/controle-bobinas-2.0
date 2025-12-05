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
            const [planos] = await db.query('SELECT pc.id, pc.codigo_plano AS numero_ordem, pc.status, pc.cliente, pc.aviario, pc.data_criacao FROM planos_corte pc WHERE pc.status IN (\'em_producao\', \'pendente\', \'Em Andamento\', \'Pendente\') ORDER BY pc.data_criacao DESC LIMIT 20');
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
                
                // Mapear itens para incluir info de tipo
                plano.itens = itens.filter(i => i.alocacao_id !== null).map(i => ({
                    ...i,
                    origem_id: i.bobina_id || i.retalho_id,
                    tipo: i.tipo_origem || (i.bobina_id ? 'bobina' : 'retalho')
                }));
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
    try {
        const { item_id, origem_id, tipo_origem, metragem_cortada } = req.body;
        // Compatibilidade com versão antiga
        const origemId = origem_id || req.body.bobina_id;
        const tipoOrigem = tipo_origem || 'bobina';
        
        if (!item_id || !origemId || !metragem_cortada) {
            return res.status(400).json({ success: false, message: 'Item, origem e metragem obrigatorios' });
        }
        
        let metragem_disponivel = 0;
        let metragem_reservada = 0;
        
        if (tipoOrigem === 'retalho') {
            const [retalhos] = await db.query('SELECT id, metragem, metragem_reservada FROM retalhos WHERE id = ?', [origemId]);
            if (retalhos.length === 0) {
                return res.status(404).json({ success: false, message: 'Retalho nao encontrado' });
            }
            metragem_disponivel = Number(retalhos[0].metragem);
            metragem_reservada = Number(retalhos[0].metragem_reservada || 0);
        } else {
            const [bobinas] = await db.query('SELECT id, metragem_atual, metragem_reservada FROM bobinas WHERE id = ?', [origemId]);
            if (bobinas.length === 0) {
                return res.status(404).json({ success: false, message: 'Bobina nao encontrada' });
            }
            metragem_disponivel = Number(bobinas[0].metragem_atual);
            metragem_reservada = Number(bobinas[0].metragem_reservada || 0);
        }
        
        if (metragem_cortada > metragem_disponivel) {
            return res.status(400).json({ success: false, message: 'Metragem insuficiente. Disponivel: ' + metragem_disponivel.toFixed(2) + 'm' });
        }
        
        const nova_metragem = metragem_disponivel - metragem_cortada;
        const nova_reserva = Math.max(0, metragem_reservada - metragem_cortada);
        
        // Atualizar metragem da origem
        if (tipoOrigem === 'retalho') {
            await db.query('UPDATE retalhos SET metragem = ?, metragem_reservada = ? WHERE id = ?', [nova_metragem, nova_reserva, origemId]);
        } else {
            await db.query('UPDATE bobinas SET metragem_atual = ?, metragem_reservada = ? WHERE id = ?', [nova_metragem, nova_reserva, origemId]);
        }
        
        // Marcar alocacao como confirmada
        try {
            await db.query('UPDATE alocacoes_corte SET confirmado = TRUE WHERE id = ?', [item_id]);
        } catch (e) { /* pode nao existir */ }
        
        // Verificar se TODOS os cortes desta BOBINA foram concluídos
        let bobinaConcluida = false;
        try {
            // Contar total de alocações desta bobina/retalho e quantas estão confirmadas
            const campo = tipoOrigem === 'retalho' ? 'retalho_id' : 'bobina_id';
            const [statsOrigem] = await db.query(`
                SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN confirmado = TRUE THEN 1 ELSE 0 END) as confirmadas
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
            // Buscar o plano_corte_id a partir do item
            const [itemPlano] = await db.query(`
                SELECT ipc.plano_corte_id 
                FROM alocacoes_corte ac
                JOIN itens_plano_corte ipc ON ac.item_plano_corte_id = ipc.id
                WHERE ac.id = ?
            `, [item_id]);
            
            if (itemPlano && itemPlano.length > 0) {
                const planoId = itemPlano[0].plano_corte_id;
                
                // Contar total de alocações e quantas estão confirmadas
                const [stats] = await db.query(`
                    SELECT 
                        COUNT(*) as total,
                        SUM(CASE WHEN confirmado = TRUE THEN 1 ELSE 0 END) as confirmadas
                    FROM alocacoes_corte ac
                    JOIN itens_plano_corte ipc ON ac.item_plano_corte_id = ipc.id
                    WHERE ipc.plano_corte_id = ?
                `, [planoId]);
                
                if (stats && stats.length > 0) {
                    planoCompleto = stats[0].total === stats[0].confirmadas;
                    console.log(`📊 Plano ${planoId}: ${stats[0].confirmadas}/${stats[0].total} itens confirmados. Completo: ${planoCompleto}`);
                }
            }
        } catch (e) {
            console.error('Erro ao verificar se plano está completo:', e);
        }
        
        return res.json({ 
            success: true, 
            message: 'Corte validado!', 
            data: { 
                metragem_cortada, 
                metragem_restante: nova_metragem.toFixed(2),
                bobina_concluida: bobinaConcluida,
                plano_completo: planoCompleto
            } 
        });
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

// ==================== NOVAS ROTAS - SISTEMA DE CORTES ==================== //

const { upload, comprimirImagem } = require('../middleware/uploadFotos');
const cortesController = require('../controllers/cortesController');

// Validar QR da bobina antes de cortar
router.post('/validar-qr-bobina', async (req, res) => {
    try {
        const { alocacao_id, qr_escaneado } = req.body;
        
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
        
        const validado = alocacao[0].origem_codigo_esperado === qr_escaneado;
        
        res.json({ 
            success: true, 
            validado,
            bobina: validado ? alocacao[0] : null,
            erro: validado ? null : 'Código QR não corresponde à origem esperada'
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

// Registrar corte
router.post('/registrar-corte', cortesController.registrarCorte);

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
        const [planos] = await db.query(`
            SELECT 
                pc.id as plano_id,
                pc.codigo_plano,
                pc.cliente,
                pc.aviario,
                pc.status,
                COUNT(DISTINCT cr.id) as total_cortes,
                COUNT(DISTINCT CASE WHEN cr.carregado = TRUE THEN cr.id END) as cortes_carregados,
                GROUP_CONCAT(DISTINCT pl.codigo_locacao ORDER BY pl.ordem_scan SEPARATOR ', ') as locacoes,
                c.id as carregamento_id,
                c.status as status_carregamento
            FROM planos_corte pc
            LEFT JOIN cortes_realizados cr ON cr.plano_corte_id = pc.id
            LEFT JOIN plano_locacoes pl ON pl.plano_corte_id = pc.id
            LEFT JOIN carregamentos c ON c.plano_corte_id = pc.id AND c.status != 'cancelado'
            WHERE pc.status = 'finalizado'
            GROUP BY pc.id
            HAVING total_cortes > 0
            ORDER BY pc.data_finalizacao DESC
        `);
        
        const planosFormatados = planos.map(p => ({
            ...p,
            percentual: p.total_cortes > 0 ? Math.round((p.cortes_carregados / p.total_cortes) * 100) : 0,
            status_carregamento: p.status_carregamento || 'pendente'
        }));
        
        res.json({ success: true, data: planosFormatados });
    } catch (error) {
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

module.exports = router;
