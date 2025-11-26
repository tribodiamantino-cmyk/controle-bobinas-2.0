const express = require('express');
const router = express.Router();
const { executarSchema, verificarTabelas } = require('../database/setup');

// Rota para executar o setup do banco
router.get('/setup', async (req, res) => {
    try {
        await executarSchema();
        const tabelas = await verificarTabelas();
        
        res.json({
            success: true,
            message: 'Banco de dados configurado com sucesso!',
            tabelas: tabelas.map(t => Object.values(t)[0])
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Rota para verificar tabelas
router.get('/verificar', async (req, res) => {
    try {
        const tabelas = await verificarTabelas();
        res.json({
            success: true,
            tabelas: tabelas.map(t => Object.values(t)[0])
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;
