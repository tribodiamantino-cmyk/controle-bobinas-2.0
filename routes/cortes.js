/**
 * Rotas de Cortes Realizados
 * GET /api/cortes - Lista todos os cortes realizados
 */

const express = require('express');
const router = express.Router();
const db = require('../config/database');

/**
 * Listar todos os cortes realizados
 * GET /api/cortes
 * Query params: ?plano_id=123
 */
router.get('/', async (req, res) => {
    try {
        const { plano_id } = req.query;
        
        let sql = `
            SELECT 
                cr.id,
                cr.codigo_corte as codigo,
                cr.metragem_cortada as metragem,
                cr.foto_medidor_url,
                cr.data_corte,
                cr.operador_nome,
                cr.placa_origem,
                cr.codigo_origem,
                pc.id as plano_id,
                pc.codigo as plano_codigo,
                pc.cliente,
                p.descricao as produto_descricao,
                p.cor1,
                p.cor2,
                p.largura,
                p.gramatura
            FROM cortes_realizados cr
            LEFT JOIN alocacoes_corte ac ON ac.id = cr.alocacao_id
            LEFT JOIN itens_plano_corte ipc ON ipc.id = ac.item_plano_corte_id
            LEFT JOIN planos_corte pc ON pc.id = ipc.plano_corte_id
            LEFT JOIN produtos p ON p.id = ipc.produto_id
            WHERE 1=1
        `;
        
        const params = [];
        
        if (plano_id) {
            sql += ` AND pc.id = ?`;
            params.push(plano_id);
        }
        
        sql += ` ORDER BY cr.data_corte DESC`;
        
        const [cortes] = await db.query(sql, params);
        
        // Formatar dados
        const resultado = cortes.map(c => ({
            id: c.id,
            codigo: c.codigo || `COR-${String(c.id).padStart(6, '0')}`,
            metragem: c.metragem,
            data_corte: c.data_corte,
            operador: c.operador_nome,
            plano_id: c.plano_id,
            plano_codigo: c.plano_codigo,
            cliente: c.cliente,
            produto_descricao: c.produto_descricao || 
                [c.cor1, c.cor2, c.largura ? `${c.largura}cm` : '', c.gramatura ? `${c.gramatura}gr` : '']
                    .filter(Boolean).join(' '),
            origem: {
                placa: c.placa_origem,
                codigo: c.codigo_origem
            }
        }));
        
        console.log(`✅ Listados ${resultado.length} cortes`);
        
        res.json({
            success: true,
            data: resultado
        });
        
    } catch (error) {
        console.error('❌ Erro ao listar cortes:', error);
        res.json({
            success: false,
            error: error.message
        });
    }
});

/**
 * Buscar corte por ID
 * GET /api/cortes/:id
 */
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const [cortes] = await db.query(`
            SELECT 
                cr.*,
                pc.id as plano_id,
                pc.codigo as plano_codigo,
                pc.cliente,
                p.descricao as produto_descricao
            FROM cortes_realizados cr
            LEFT JOIN alocacoes_corte ac ON ac.id = cr.alocacao_id
            LEFT JOIN itens_plano_corte ipc ON ipc.id = ac.item_plano_corte_id
            LEFT JOIN planos_corte pc ON pc.id = ipc.plano_corte_id
            LEFT JOIN produtos p ON p.id = ipc.produto_id
            WHERE cr.id = ?
        `, [id]);
        
        if (cortes.length === 0) {
            return res.json({
                success: false,
                error: 'Corte não encontrado'
            });
        }
        
        res.json({
            success: true,
            data: cortes[0]
        });
        
    } catch (error) {
        console.error('❌ Erro ao buscar corte:', error);
        res.json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;
