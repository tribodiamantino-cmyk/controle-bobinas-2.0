const express = require('express');
const router = express.Router();
const db = require('../config/database');

// ========== GET: Detalhes da Bobina com Histórico ==========
router.get('/bobina/:id', async (req, res) => {
    try {
        const bobinaId = req.params.id;
        
        // Buscar dados completos da bobina
        const [bobinas] = await db.query(`
            SELECT 
                b.*,
                p.codigo,
                p.loja,
                p.fabricante,
                c.nome as nome_cor,
                p.gramatura,
                (b.metragem_inicial - COALESCE(SUM(oc.metragem_utilizada), 0)) as metragem_atual
            FROM bobinas b
            JOIN produtos p ON b.produto_id = p.id
            LEFT JOIN cores c ON p.cor_id = c.id
            LEFT JOIN ordens_corte oc ON b.id = oc.bobina_id
            WHERE b.id = ?
            GROUP BY b.id
        `, [bobinaId]);
        
        if (bobinas.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Bobina não encontrada'
            });
        }
        
        const bobina = bobinas[0];
        
        // Buscar histórico de movimentações
        const [movimentacoes] = await db.query(`
            SELECT 
                'ENTRADA' as tipo,
                b.data_entrada as data_movimentacao,
                b.metragem_inicial as metragem,
                CONCAT('Entrada - NF: ', b.nota_fiscal) as observacoes
            FROM bobinas b
            WHERE b.id = ?
            
            UNION ALL
            
            SELECT 
                'CORTE' as tipo,
                oc.data_criacao as data_movimentacao,
                oc.metragem_utilizada as metragem,
                oc.observacoes
            FROM ordens_corte oc
            WHERE oc.bobina_id = ?
            
            ORDER BY data_movimentacao DESC
        `, [bobinaId, bobinaId]);
        
        bobina.historico = movimentacoes;
        
        res.json({
            success: true,
            data: bobina
        });
        
    } catch (error) {
        console.error('Erro ao buscar bobina:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao buscar dados da bobina'
        });
    }
});

// ========== POST: Registrar Corte ==========
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
        
        // Verificar se bobina existe e tem metragem suficiente
        const [bobinas] = await db.query(`
            SELECT 
                b.id,
                b.codigo_interno,
                b.metragem_inicial,
                COALESCE(SUM(oc.metragem_utilizada), 0) as metragem_usada
            FROM bobinas b
            LEFT JOIN ordens_corte oc ON b.id = oc.bobina_id
            WHERE b.id = ?
            GROUP BY b.id
        `, [bobina_id]);
        
        if (bobinas.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Bobina não encontrada'
            });
        }
        
        const bobina = bobinas[0];
        const metragem_disponivel = bobina.metragem_inicial - bobina.metragem_usada;
        
        if (metragem_cortada > metragem_disponivel) {
            return res.status(400).json({
                success: false,
                message: `Metragem insuficiente. Disponível: ${metragem_disponivel.toFixed(2)}m`
            });
        }
        
        // Registrar ordem de corte
        const [result] = await db.query(`
            INSERT INTO ordens_corte (
                bobina_id,
                metragem_utilizada,
                observacoes,
                data_criacao
            ) VALUES (?, ?, ?, NOW())
        `, [bobina_id, metragem_cortada, observacoes]);
        
        res.json({
            success: true,
            message: 'Corte registrado com sucesso',
            data: {
                ordem_id: result.insertId,
                bobina_codigo: bobina.codigo_interno,
                metragem_cortada: metragem_cortada,
                metragem_restante: (metragem_disponivel - metragem_cortada).toFixed(2)
            }
        });
        
    } catch (error) {
        console.error('Erro ao registrar corte:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao registrar corte'
        });
    }
});

module.exports = router;
