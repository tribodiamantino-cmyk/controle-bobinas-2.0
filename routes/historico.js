/**
 * Rotas: Histórico de Movimentações
 */

const express = require('express');
const router = express.Router();
const historicoController = require('../controllers/historicoController');

// GET /api/historico/produto/:produto_id - Listar histórico de um produto
router.get('/produto/:produto_id', historicoController.listarPorProduto);

// GET /api/historico/produto/:produto_id/resumo - Resumo de movimentações
router.get('/produto/:produto_id/resumo', historicoController.resumoPorProduto);

module.exports = router;
