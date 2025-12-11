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
