const express = require('express');
const router = express.Router();
const gramaturasController = require('../controllers/gramaturasController');

// Rotas de Gramaturas
router.get('/', gramaturasController.listarGramaturas);
router.post('/', gramaturasController.criarGramatura);
router.put('/:id', gramaturasController.atualizarGramatura);
router.delete('/:id', gramaturasController.desativarGramatura);

module.exports = router;
