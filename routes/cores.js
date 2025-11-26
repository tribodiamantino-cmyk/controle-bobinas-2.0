const express = require('express');
const router = express.Router();
const coresController = require('../controllers/coresController');

// Rotas de Cores
router.get('/', coresController.listarCores);
router.post('/', coresController.criarCor);
router.put('/:id', coresController.atualizarCor);
router.delete('/:id', coresController.desativarCor);

module.exports = router;
