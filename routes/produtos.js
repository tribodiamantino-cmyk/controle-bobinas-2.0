const express = require('express');
const router = express.Router();
const produtosController = require('../controllers/produtosController');
const historicoController = require('../controllers/historicoController');

router.get('/', produtosController.listarProdutos);
router.get('/:id', produtosController.buscarProdutoPorId);
router.get('/:id/historico', historicoController.historicoProduto);
router.post('/', produtosController.criarProduto);
router.put('/:id', produtosController.atualizarProduto);
router.delete('/:id', produtosController.desativarProduto);

module.exports = router;
