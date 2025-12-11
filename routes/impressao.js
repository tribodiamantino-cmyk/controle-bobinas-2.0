/**
 * Rotas: Fila de Impressão de Etiquetas
 * 
 * Endpoints para gerenciar a fila de impressão
 */

const express = require('express');
const router = express.Router();
const impressaoController = require('../controllers/impressaoController');

// === ROTAS ESPECÍFICAS (devem vir antes das rotas com :id) ===

// Adicionar etiqueta à fila
// POST /api/impressao/adicionar
router.post('/adicionar', impressaoController.adicionar);

// Listar etiquetas pendentes
// GET /api/impressao/pendentes?loja=PLA
router.get('/pendentes', impressaoController.listarPendentes);

// Histórico de impressões
// GET /api/impressao/historico?loja=PLA&status=impressa
router.get('/historico', impressaoController.historico);

// Estatísticas da fila
// GET /api/impressao/stats
router.get('/stats', impressaoController.estatisticas);

// Marcar múltiplas etiquetas como impressas
// PUT /api/impressao/impressas
router.put('/impressas', impressaoController.marcarMultiplasImpressas);

// Preview de etiqueta (sem adicionar à fila)
// GET /api/impressao/preview/:tipo/:id
router.get('/preview/:tipo/:id', impressaoController.preview);

// === ROTAS COM PARÂMETRO :id (devem vir por último) ===

// Marcar etiqueta como impressa
// PUT /api/impressao/:id/impressa
router.put('/:id/impressa', impressaoController.marcarImpressa);

// Cancelar etiqueta da fila
// PUT /api/impressao/:id/cancelar
router.put('/:id/cancelar', impressaoController.cancelar);

// Obter dados de uma etiqueta específica
// GET /api/impressao/:id
router.get('/:id', impressaoController.obterEtiqueta);

module.exports = router;
