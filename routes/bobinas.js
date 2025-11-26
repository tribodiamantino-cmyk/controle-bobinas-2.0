const express = require('express');
const router = express.Router();
const bobinasController = require('../controllers/bobinasController');

// Criar nova bobina
router.post('/', bobinasController.criarBobina);

// Listar produtos com total de bobinas (para acordeão)
router.get('/produtos', bobinasController.listarProdutosComBobinas);

// Listar bobinas de um produto específico
router.get('/produto/:produto_id', bobinasController.listarBobinasPorProduto);

// Buscar bobina por código interno
router.get('/codigo/:codigo_interno', bobinasController.buscarBobinaPorCodigo);

// Buscar produto por loja + fabricante + código
router.get('/buscar-produto', bobinasController.buscarProduto);

// Excluir bobina
router.delete('/:id', bobinasController.excluirBobina);

module.exports = router;
