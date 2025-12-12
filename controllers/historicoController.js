/**
 * Controller: Histórico de Movimentações
 * 
 * Gerencia o registro e consulta do histórico de movimentações por produto.
 * Registra entradas, cortes, transformações e exclusões de bobinas/retalhos.
 */

const db = require('../config/database');

/**
 * Registrar uma movimentação no histórico
 * @param {Object} movimentacao - Dados da movimentação
 */
exports.registrar = async (movimentacao) => {
    try {
        const {
            produto_id,
            tipo_evento,
            entidade_tipo,
            entidade_id,
            entidade_codigo,
            metragem,
            metragem_antes,
            metragem_depois,
            destino_tipo,
            destino_id,
            destino_descricao,
            observacao
        } = movimentacao;
        
        await db.query(
            `INSERT INTO historico_movimentacoes 
            (produto_id, tipo_evento, entidade_tipo, entidade_id, entidade_codigo, 
             metragem, metragem_antes, metragem_depois, 
             destino_tipo, destino_id, destino_descricao, observacao)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                produto_id,
                tipo_evento,
                entidade_tipo,
                entidade_id,
                entidade_codigo,
                metragem || null,
                metragem_antes || null,
                metragem_depois || null,
                destino_tipo || null,
                destino_id || null,
                destino_descricao || null,
                observacao || null
            ]
        );
        
        console.log(`📝 Histórico registrado: ${tipo_evento} - ${entidade_codigo}`);
        return true;
        
    } catch (error) {
        console.error('❌ Erro ao registrar histórico:', error);
        // Não propagar erro - histórico não deve bloquear operação principal
        return false;
    }
};

/**
 * Listar histórico de um produto
 */
exports.listarPorProduto = async (req, res) => {
    try {
        const { produto_id } = req.params;
        const { limite = 100, offset = 0 } = req.query;
        
        const [movimentacoes] = await db.query(
            `SELECT 
                h.*,
                DATE_FORMAT(h.created_at, '%d/%m/%Y %H:%i') as data_formatada
            FROM historico_movimentacoes h
            WHERE h.produto_id = ?
            ORDER BY h.created_at DESC
            LIMIT ? OFFSET ?`,
            [produto_id, parseInt(limite), parseInt(offset)]
        );
        
        // Contar total
        const [countResult] = await db.query(
            `SELECT COUNT(*) as total FROM historico_movimentacoes WHERE produto_id = ?`,
            [produto_id]
        );
        
        // Calcular totais
        const [totais] = await db.query(
            `SELECT 
                SUM(CASE WHEN tipo_evento = 'bobina_entrada' THEN metragem ELSE 0 END) as total_entrada,
                SUM(CASE WHEN tipo_evento IN ('bobina_corte', 'retalho_corte') THEN metragem ELSE 0 END) as total_cortado,
                COUNT(CASE WHEN tipo_evento = 'bobina_entrada' THEN 1 END) as qtd_bobinas_entrada,
                COUNT(CASE WHEN tipo_evento = 'bobina_corte' THEN 1 END) as qtd_cortes
            FROM historico_movimentacoes
            WHERE produto_id = ?`,
            [produto_id]
        );
        
        res.json({
            success: true,
            data: movimentacoes,
            total: countResult[0].total,
            totais: totais[0]
        });
        
    } catch (error) {
        console.error('❌ Erro ao listar histórico:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

/**
 * Obter resumo de movimentações de um produto
 */
exports.resumoPorProduto = async (req, res) => {
    try {
        const { produto_id } = req.params;
        
        // Bobinas com seus cortes
        const [bobinas] = await db.query(
            `SELECT 
                entidade_codigo as codigo,
                MIN(created_at) as data_entrada,
                MAX(CASE WHEN tipo_evento = 'bobina_entrada' THEN metragem END) as metragem_entrada,
                GROUP_CONCAT(
                    CASE WHEN tipo_evento = 'bobina_corte' 
                    THEN CONCAT(destino_descricao, ' (', metragem, 'm)') 
                    END 
                    ORDER BY created_at SEPARATOR ', '
                ) as cortes
            FROM historico_movimentacoes
            WHERE produto_id = ? AND entidade_tipo = 'bobina'
            GROUP BY entidade_codigo
            ORDER BY data_entrada DESC`,
            [produto_id]
        );
        
        // Retalhos
        const [retalhos] = await db.query(
            `SELECT 
                entidade_codigo as codigo,
                MIN(created_at) as data_criacao,
                MAX(CASE WHEN tipo_evento = 'retalho_criado' THEN metragem END) as metragem_inicial,
                observacao as origem
            FROM historico_movimentacoes
            WHERE produto_id = ? AND entidade_tipo = 'retalho' AND tipo_evento = 'retalho_criado'
            GROUP BY entidade_codigo, observacao
            ORDER BY data_criacao DESC`,
            [produto_id]
        );
        
        res.json({
            success: true,
            data: {
                bobinas,
                retalhos
            }
        });
        
    } catch (error) {
        console.error('❌ Erro ao obter resumo:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Exportar função de registro para uso em outros controllers
module.exports.registrarMovimentacao = exports.registrar;

/**
 * Histórico de uma Bobina específica (gerado dinamicamente)
 * GET /api/bobinas/:id/historico
 */
exports.historicoBobina = async (req, res) => {
    try {
        const { id } = req.params;
        const { data_inicio, data_fim } = req.query;

        // 1. Dados da bobina
        const [bobinas] = await db.query(`
            SELECT 
                b.id,
                b.codigo_interno,
                b.metragem_inicial,
                b.metragem_atual,
                b.status,
                b.data_entrada,
                b.nota_fiscal,
                b.loja,
                p.fabricante,
                cc.nome_cor as cor,
                cg.gramatura,
                p.largura_final
            FROM bobinas b
            LEFT JOIN produtos p ON b.produto_id = p.id
            LEFT JOIN configuracoes_cores cc ON p.cor_id = cc.id
            LEFT JOIN configuracoes_gramaturas cg ON p.gramatura_id = cg.id
            WHERE b.id = ?
        `, [id]);

        if (bobinas.length === 0) {
            return res.json({ success: false, error: 'Bobina não encontrada' });
        }

        const bobina = bobinas[0];

        // 2. Cortes realizados desta bobina (com filtro de data opcional)
        let sqlCortes = `
            SELECT 
                cr.id,
                cr.codigo_corte,
                cr.metragem_cortada,
                cr.data_corte,
                cr.operador_nome,
                cr.status as corte_status,
                pc.id as plano_id,
                pc.codigo_plano,
                pc.cliente,
                pc.obra
            FROM cortes_realizados cr
            LEFT JOIN planos_corte pc ON cr.plano_corte_id = pc.id
            WHERE cr.origem_tipo = 'bobina' AND cr.bobina_id = ?
        `;
        const paramsCortes = [id];
        
        if (data_inicio) {
            sqlCortes += ` AND cr.data_corte >= ?`;
            paramsCortes.push(data_inicio);
        }
        if (data_fim) {
            sqlCortes += ` AND cr.data_corte <= ?`;
            paramsCortes.push(data_fim + ' 23:59:59');
        }
        sqlCortes += ` ORDER BY cr.data_corte DESC`;
        
        const [cortes] = await db.query(sqlCortes, paramsCortes);

        // 3. Retalhos gerados desta bobina
        const [retalhos] = await db.query(`
            SELECT 
                r.id,
                r.codigo_retalho,
                r.metragem,
                r.status,
                r.data_entrada as data_criacao
            FROM retalhos r
            WHERE r.bobina_origem_id = ?
            ORDER BY r.data_entrada DESC
        `, [id]);

        // 4. Montar timeline de eventos
        const eventos = [];

        // Evento de entrada
        eventos.push({
            tipo: 'entrada',
            icone: '📥',
            data: bobina.data_entrada,
            descricao: `Bobina cadastrada com ${formatarMetragem(bobina.metragem_inicial)}`,
            detalhes: {
                metragem: bobina.metragem_inicial,
                nota_fiscal: bobina.nota_fiscal
            }
        });

        // Eventos de cortes
        cortes.forEach(c => {
            eventos.push({
                tipo: 'corte',
                icone: '✂️',
                data: c.data_corte,
                descricao: `Corte de ${formatarMetragem(c.metragem_cortada)} para PDC ${c.codigo_plano || c.plano_id}`,
                detalhes: {
                    corte_id: c.id,
                    codigo_corte: c.codigo_corte,
                    metragem: c.metragem_cortada,
                    plano_id: c.plano_id,
                    plano_codigo: c.codigo_plano,
                    cliente: c.cliente,
                    obra: c.obra,
                    operador: c.operador_nome,
                    status: c.corte_status
                }
            });
        });

        // Eventos de retalhos gerados
        retalhos.forEach(r => {
            eventos.push({
                tipo: 'retalho_gerado',
                icone: '🧵',
                data: r.data_criacao,
                descricao: `Retalho ${r.codigo_retalho || `RET-${r.id}`} gerado com ${formatarMetragem(r.metragem)}`,
                detalhes: {
                    retalho_id: r.id,
                    codigo: r.codigo_retalho,
                    metragem: r.metragem,
                    status: r.status
                }
            });
        });

        // Ordenar por data (mais recente primeiro)
        eventos.sort((a, b) => new Date(b.data) - new Date(a.data));

        // 5. Resumo
        const totalCortado = cortes.reduce((sum, c) => sum + parseFloat(c.metragem_cortada || 0), 0);

        const resumo = {
            metragem_inicial: parseFloat(bobina.metragem_inicial),
            metragem_atual: parseFloat(bobina.metragem_atual),
            total_cortado: totalCortado,
            qtd_cortes: cortes.length,
            qtd_retalhos: retalhos.length,
            status: bobina.status
        };

        console.log(`✅ Histórico bobina #${id}: ${eventos.length} eventos`);

        res.json({
            success: true,
            data: {
                bobina: {
                    id: bobina.id,
                    codigo: bobina.codigo_interno,
                    fabricante: bobina.fabricante,
                    cor: bobina.cor,
                    gramatura: bobina.gramatura,
                    largura: bobina.largura_final,
                    loja: bobina.loja
                },
                resumo,
                eventos,
                cortes,
                retalhos
            }
        });

    } catch (error) {
        console.error('❌ Erro ao buscar histórico da bobina:', error);
        res.json({ success: false, error: error.message });
    }
};

/**
 * Histórico de um Retalho específico (gerado dinamicamente)
 * GET /api/retalhos/:id/historico
 */
exports.historicoRetalho = async (req, res) => {
    try {
        const { id } = req.params;
        const { data_inicio, data_fim } = req.query;

        // 1. Dados do retalho
        const [retalhos] = await db.query(`
            SELECT 
                r.id,
                r.codigo_retalho,
                r.metragem,
                r.metragem_original,
                r.status,
                r.data_entrada as data_criacao,
                r.bobina_origem_id,
                b.codigo_interno as bobina_codigo,
                p.fabricante,
                cc.nome_cor as cor,
                cg.gramatura,
                p.largura_final,
                p.loja
            FROM retalhos r
            LEFT JOIN bobinas b ON r.bobina_origem_id = b.id
            LEFT JOIN produtos p ON r.produto_id = p.id
            LEFT JOIN configuracoes_cores cc ON p.cor_id = cc.id
            LEFT JOIN configuracoes_gramaturas cg ON p.gramatura_id = cg.id
            WHERE r.id = ?
        `, [id]);

        if (retalhos.length === 0) {
            return res.json({ success: false, error: 'Retalho não encontrado' });
        }

        const retalho = retalhos[0];

        // 2. Cortes realizados deste retalho (com filtro de data opcional)
        let sqlCortes = `
            SELECT 
                cr.id,
                cr.codigo_corte,
                cr.metragem_cortada,
                cr.data_corte,
                cr.operador_nome,
                cr.status as corte_status,
                pc.id as plano_id,
                pc.codigo_plano,
                pc.cliente,
                pc.obra
            FROM cortes_realizados cr
            LEFT JOIN planos_corte pc ON cr.plano_corte_id = pc.id
            WHERE cr.origem_tipo = 'retalho' AND cr.retalho_id = ?
        `;
        const paramsCortes = [id];
        
        if (data_inicio) {
            sqlCortes += ` AND cr.data_corte >= ?`;
            paramsCortes.push(data_inicio);
        }
        if (data_fim) {
            sqlCortes += ` AND cr.data_corte <= ?`;
            paramsCortes.push(data_fim + ' 23:59:59');
        }
        sqlCortes += ` ORDER BY cr.data_corte DESC`;
        
        const [cortes] = await db.query(sqlCortes, paramsCortes);

        // 3. Montar timeline
        const eventos = [];

        // Evento de origem
        eventos.push({
            tipo: 'origem',
            icone: '🧵',
            data: retalho.data_criacao,
            descricao: retalho.bobina_codigo 
                ? `Retalho gerado da bobina ${retalho.bobina_codigo}`
                : 'Retalho cadastrado manualmente',
            detalhes: {
                metragem_original: retalho.metragem_original || retalho.metragem,
                bobina_origem_id: retalho.bobina_origem_id,
                bobina_codigo: retalho.bobina_codigo
            }
        });

        // Eventos de cortes
        cortes.forEach(c => {
            eventos.push({
                tipo: 'corte',
                icone: '✂️',
                data: c.data_corte,
                descricao: `Corte de ${formatarMetragem(c.metragem_cortada)} para PDC ${c.codigo_plano || c.plano_id}`,
                detalhes: {
                    corte_id: c.id,
                    codigo_corte: c.codigo_corte,
                    metragem: c.metragem_cortada,
                    plano_id: c.plano_id,
                    plano_codigo: c.codigo_plano,
                    cliente: c.cliente,
                    obra: c.obra,
                    operador: c.operador_nome,
                    status: c.corte_status
                }
            });
        });

        // Ordenar por data
        eventos.sort((a, b) => new Date(b.data) - new Date(a.data));

        // 4. Resumo
        const totalCortado = cortes.reduce((sum, c) => sum + parseFloat(c.metragem_cortada || 0), 0);

        const resumo = {
            metragem_original: parseFloat(retalho.metragem_original || retalho.metragem) + totalCortado,
            metragem_atual: parseFloat(retalho.metragem),
            total_cortado: totalCortado,
            qtd_cortes: cortes.length,
            status: retalho.status
        };

        console.log(`✅ Histórico retalho #${id}: ${eventos.length} eventos`);

        res.json({
            success: true,
            data: {
                retalho: {
                    id: retalho.id,
                    codigo: retalho.codigo_retalho,
                    fabricante: retalho.fabricante,
                    cor: retalho.cor,
                    gramatura: retalho.gramatura,
                    largura: retalho.largura_final,
                    loja: retalho.loja
                },
                bobina_origem: retalho.bobina_origem_id ? {
                    id: retalho.bobina_origem_id,
                    codigo: retalho.bobina_codigo
                } : null,
                resumo,
                eventos,
                cortes
            }
        });

    } catch (error) {
        console.error('❌ Erro ao buscar histórico do retalho:', error);
        res.json({ success: false, error: error.message });
    }
};

/**
 * Histórico consolidado de um Produto (gerado dinamicamente)
 * GET /api/produtos/:id/historico
 */
exports.historicoProduto = async (req, res) => {
    try {
        const { id } = req.params;
        const { data_inicio, data_fim } = req.query;

        // 1. Dados do produto
        const [produtos] = await db.query(`
            SELECT 
                p.id,
                p.codigo,
                p.fabricante,
                p.loja,
                p.largura_final,
                cc.nome_cor as cor,
                cg.gramatura
            FROM produtos p
            LEFT JOIN configuracoes_cores cc ON p.cor_id = cc.id
            LEFT JOIN configuracoes_gramaturas cg ON p.gramatura_id = cg.id
            WHERE p.id = ?
        `, [id]);

        if (produtos.length === 0) {
            return res.json({ success: false, error: 'Produto não encontrado' });
        }

        const produto = produtos[0];

        // 2. Todas as bobinas deste produto
        const [bobinas] = await db.query(`
            SELECT 
                b.id,
                b.codigo_interno,
                b.metragem_inicial,
                b.metragem_atual,
                b.status,
                b.data_entrada,
                b.nota_fiscal
            FROM bobinas b
            WHERE b.produto_id = ?
            ORDER BY b.data_entrada DESC
        `, [id]);

        // 3. Todos os retalhos deste produto
        const [retalhos] = await db.query(`
            SELECT 
                r.id,
                r.codigo_retalho,
                r.metragem,
                r.status,
                r.data_entrada as data_criacao,
                r.bobina_origem_id
            FROM retalhos r
            WHERE r.produto_id = ?
            ORDER BY r.data_entrada DESC
        `, [id]);

        // 4. Todos os cortes (bobinas e retalhos) com filtro de data opcional
        let sqlCortes = `
            SELECT 
                cr.id,
                cr.codigo_corte,
                cr.metragem_cortada,
                cr.data_corte,
                cr.operador_nome,
                cr.origem_tipo,
                cr.bobina_id,
                cr.retalho_id,
                COALESCE(b.codigo_interno, r.codigo_retalho) as origem_codigo,
                pc.id as plano_id,
                pc.codigo_plano,
                pc.cliente,
                pc.obra
            FROM cortes_realizados cr
            LEFT JOIN bobinas b ON cr.bobina_id = b.id
            LEFT JOIN retalhos r ON cr.retalho_id = r.id
            LEFT JOIN planos_corte pc ON cr.plano_corte_id = pc.id
            WHERE ((cr.origem_tipo = 'bobina' AND b.produto_id = ?)
               OR (cr.origem_tipo = 'retalho' AND r.produto_id = ?))
        `;
        const paramsCortes = [id, id];
        
        if (data_inicio) {
            sqlCortes += ` AND cr.data_corte >= ?`;
            paramsCortes.push(data_inicio);
        }
        if (data_fim) {
            sqlCortes += ` AND cr.data_corte <= ?`;
            paramsCortes.push(data_fim + ' 23:59:59');
        }
        sqlCortes += ` ORDER BY cr.data_corte DESC`;
        
        const [todosCortes] = await db.query(sqlCortes, paramsCortes);

        // 5. Montar timeline consolidada
        const eventos = [];

        // Entradas de bobinas
        bobinas.forEach(b => {
            eventos.push({
                tipo: 'entrada_bobina',
                icone: '📥',
                data: b.data_entrada,
                descricao: `Bobina ${b.codigo_interno || `BOB-${b.id}`} entrada com ${formatarMetragem(b.metragem_inicial)}`,
                detalhes: {
                    bobina_id: b.id,
                    codigo: b.codigo_interno,
                    metragem: b.metragem_inicial,
                    nota_fiscal: b.nota_fiscal,
                    status: b.status
                }
            });
        });

        // Cortes
        todosCortes.forEach(c => {
            const tipoOrigem = c.origem_tipo === 'bobina' ? 'bobina' : 'retalho';
            eventos.push({
                tipo: `corte_${tipoOrigem}`,
                icone: '✂️',
                data: c.data_corte,
                descricao: `Corte de ${formatarMetragem(c.metragem_cortada)} da ${tipoOrigem} ${c.origem_codigo || c[`${tipoOrigem}_id`]} → PDC ${c.codigo_plano || c.plano_id}`,
                detalhes: {
                    corte_id: c.id,
                    codigo_corte: c.codigo_corte,
                    metragem: c.metragem_cortada,
                    origem_tipo: c.origem_tipo,
                    origem_id: c.origem_tipo === 'bobina' ? c.bobina_id : c.retalho_id,
                    origem_codigo: c.origem_codigo,
                    plano_id: c.plano_id,
                    plano_codigo: c.codigo_plano,
                    cliente: c.cliente,
                    obra: c.obra
                }
            });
        });

        // Retalhos gerados
        retalhos.forEach(r => {
            eventos.push({
                tipo: 'retalho_gerado',
                icone: '🧵',
                data: r.data_criacao,
                descricao: `Retalho ${r.codigo_retalho || `RET-${r.id}`} gerado com ${formatarMetragem(r.metragem)}`,
                detalhes: {
                    retalho_id: r.id,
                    codigo: r.codigo_retalho,
                    metragem: r.metragem,
                    bobina_origem_id: r.bobina_origem_id,
                    status: r.status
                }
            });
        });

        // Ordenar por data (mais recente primeiro)
        eventos.sort((a, b) => new Date(b.data) - new Date(a.data));

        // 6. Resumo consolidado
        const totalEntrada = bobinas.reduce((sum, b) => sum + parseFloat(b.metragem_inicial || 0), 0);
        const estoqueAtualBobinas = bobinas.filter(b => b.status !== 'Esgotado').reduce((sum, b) => sum + parseFloat(b.metragem_atual || 0), 0);
        const estoqueAtualRetalhos = retalhos.filter(r => r.status !== 'Esgotado').reduce((sum, r) => sum + parseFloat(r.metragem || 0), 0);
        const totalCortado = todosCortes.reduce((sum, c) => sum + parseFloat(c.metragem_cortada || 0), 0);

        const resumo = {
            total_entrada: totalEntrada,
            estoque_atual_bobinas: estoqueAtualBobinas,
            estoque_atual_retalhos: estoqueAtualRetalhos,
            estoque_total: estoqueAtualBobinas + estoqueAtualRetalhos,
            total_cortado: totalCortado,
            qtd_bobinas: bobinas.length,
            qtd_retalhos: retalhos.length,
            qtd_cortes: todosCortes.length
        };

        console.log(`✅ Histórico produto #${id}: ${eventos.length} eventos`);

        res.json({
            success: true,
            data: {
                produto: {
                    id: produto.id,
                    codigo: produto.codigo,
                    fabricante: produto.fabricante,
                    cor: produto.cor,
                    gramatura: produto.gramatura,
                    largura: produto.largura_final,
                    loja: produto.loja
                },
                resumo,
                eventos,
                bobinas,
                retalhos
            }
        });

    } catch (error) {
        console.error('❌ Erro ao buscar histórico do produto:', error);
        res.json({ success: false, error: error.message });
    }
};

/**
 * Formata metragem para exibição
 */
function formatarMetragem(valor) {
    if (!valor && valor !== 0) return '0,00m';
    const num = parseFloat(valor);
    return num.toFixed(2).replace('.', ',') + 'm';
}
