const express = require('express');
const router = express.Router();
const bobinasController = require('../controllers/bobinasController');
const historicoController = require('../controllers/historicoController');

// Listar todas as bobinas (para Central de Etiquetas)
router.get('/', bobinasController.listarTodas);

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

// Histórico de uma bobina específica
router.get('/:id/historico', historicoController.historicoBobina);

// Excluir bobina
router.delete('/:id', bobinasController.excluirBobina);

module.exports = router;
