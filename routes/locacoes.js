const express = require('express');
const router = express.Router();
const locacoesController = require('../controllers/locacoesController');

// Listar todas as locações (ativas e inativas)
router.get('/', locacoesController.listarLocacoes);

// Buscar locação por ID
router.get('/:id', locacoesController.buscarLocacao);

// Criar nova locação
router.post('/', locacoesController.criarLocacao);

// Atualizar locação
router.put('/:id', locacoesController.atualizarLocacao);

// Desativar locação (soft delete)
router.delete('/:id', locacoesController.desativarLocacao);

// Reativar locação
router.patch('/:id/reativar', locacoesController.reativarLocacao);

module.exports = router;
