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
                p.gramatura
            FROM bobinas b
            JOIN produtos p ON b.produto_id = p.id
            LEFT JOIN cores c ON p.cor_id = c.id
            WHERE b.id = ?
        `, [bobinaId]);
        
        if (bobinas.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Bobina não encontrada'
            });
        }
        
        const bobina = bobinas[0];
        
        // Calcular metragem atual
        const [totalCortado] = await db.query(`
            SELECT COALESCE(SUM(metragem_utilizada), 0) as total_cortado
            FROM ordens_corte
            WHERE bobina_id = ?
        `, [bobinaId]);
        
        bobina.metragem_atual = bobina.metragem_inicial - totalCortado[0].total_cortado;
        
        // Buscar histórico de movimentações (simplificado para evitar erros)
        const historico = [];
        
        // Adicionar entrada
        historico.push({
            tipo: 'ENTRADA',
            data_movimentacao: bobina.data_entrada,
            metragem: bobina.metragem_inicial,
            observacoes: `Entrada - NF: ${bobina.nota_fiscal || 'S/N'}`
        });
        
        // Buscar cortes
        try {
            const [cortes] = await db.query(`
                SELECT 
                    data_criacao,
                    metragem_utilizada,
                    observacoes
                FROM ordens_corte
                WHERE bobina_id = ?
                ORDER BY data_criacao DESC
            `, [bobinaId]);
            
            cortes.forEach(corte => {
                historico.push({
                    tipo: 'CORTE',
                    data_movimentacao: corte.data_criacao,
                    metragem: corte.metragem_utilizada,
                    observacoes: corte.observacoes || ''
                });
            });
        } catch (err) {
            console.error('⚠️ Erro ao buscar cortes:', err.message);
            // Continua sem histórico de cortes
        }
        
        bobina.historico = historico;
        
        res.json({
            success: true,
            data: bobina
        });
        
    } catch (error) {
        console.error('❌ Erro ao buscar bobina ID:', req.params.id);
        console.error('❌ Detalhes do erro:', error.message);
        console.error('❌ Stack:', error.stack);
        res.status(500).json({
            success: false,
            message: 'Erro ao buscar dados da bobina',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
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
