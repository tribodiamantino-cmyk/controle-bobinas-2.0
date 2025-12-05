const express = require('express');
const router = express.Router();
const locacoesController = require('../controllers/locacoesController');

// Listar todas as locações
router.get('/', locacoesController.listarLocacoes);

// Buscar locação por código
router.get('/:codigo_locacao', locacoesController.buscarLocacao);

// Criar nova locação
router.post('/', locacoesController.criarLocacao);

// Atualizar locação
router.put('/:id', locacoesController.atualizarLocacao);

// Desativar locação
router.delete('/:id', locacoesController.desativarLocacao);

module.exports = router;
