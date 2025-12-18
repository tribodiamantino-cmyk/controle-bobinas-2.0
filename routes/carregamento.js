/**
 * Rotas: Carregamento
 * 
 * Endpoints específicos para carregamento
 * (As rotas de carregamento do mobile ficam em routes/mobile.js)
 */

const express = require('express');
const router = express.Router();
const impressaoController = require('../controllers/impressaoController');

// Buscar dados completos para relatório de carregamento
// GET /api/carregamento/:id/relatorio
router.get('/:id/relatorio', impressaoController.getDadosRelatorioCarregamento);

module.exports = router;
