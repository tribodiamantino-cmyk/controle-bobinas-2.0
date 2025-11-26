const express = require('express');
const router = express.Router();
const retalhosController = require('../controllers/retalhosController');

// Criar retalho manualmente
router.post('/', retalhosController.criarRetalho);

// Converter bobina em retalho
router.post('/converter-bobina/:bobina_id', retalhosController.converterBobinaEmRetalho);

// Listar retalhos de um produto
router.get('/produto/:produto_id', retalhosController.listarRetalhosPorProduto);

// Buscar retalho por código
router.get('/codigo/:codigo_retalho', retalhosController.buscarRetalhoPorCodigo);

// Excluir retalho
router.delete('/:id', retalhosController.excluirRetalho);

module.exports = router;
