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
                pc.id as plano_id,
                pc.codigo_plano as plano_codigo,
                pc.cliente,
                p.fabricante,
                p.largura_final,
                cc.nome_cor,
                cg.gramatura
            FROM cortes_realizados cr
            LEFT JOIN alocacoes_corte ac ON ac.id = cr.alocacao_id
            LEFT JOIN itens_plano_corte ipc ON ipc.id = ac.item_plano_corte_id
            LEFT JOIN planos_corte pc ON pc.id = ipc.plano_corte_id
            LEFT JOIN produtos p ON p.id = ipc.produto_id
            LEFT JOIN configuracoes_cores cc ON p.cor_id = cc.id
            LEFT JOIN configuracoes_gramaturas cg ON p.gramatura_id = cg.id
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
            produto_descricao: [c.nome_cor, c.gramatura ? `${c.gramatura}gr` : '', c.fabricante, c.largura_final ? `${c.largura_final}cm` : '']
                    .filter(Boolean).join(' ')
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
                pc.codigo_plano as plano_codigo,
                pc.cliente,
                p.fabricante,
                p.largura_final,
                cc.nome_cor,
                cg.gramatura
            FROM cortes_realizados cr
            LEFT JOIN alocacoes_corte ac ON ac.id = cr.alocacao_id
            LEFT JOIN itens_plano_corte ipc ON ipc.id = ac.item_plano_corte_id
            LEFT JOIN planos_corte pc ON pc.id = ipc.plano_corte_id
            LEFT JOIN produtos p ON p.id = ipc.produto_id
            LEFT JOIN configuracoes_cores cc ON p.cor_id = cc.id
            LEFT JOIN configuracoes_gramaturas cg ON p.gramatura_id = cg.id
            WHERE cr.id = ?
        `, [id]);
        
        if (cortes.length === 0) {
            return res.json({
                success: false,
                error: 'Corte não encontrado'
            });
        }
        
        // Adicionar produto_descricao formatado
        const corte = cortes[0];
        corte.produto_descricao = [corte.nome_cor, corte.gramatura ? `${corte.gramatura}gr` : '', corte.fabricante]
            .filter(Boolean).join(' ');
        
        res.json({
            success: true,
            data: corte
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
