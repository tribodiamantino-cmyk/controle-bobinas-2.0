const express = require('express');
const router = express.Router();
const localizacaoController = require('../controllers/localizacaoController');

// Atualizar localização de uma bobina
router.put('/:bobina_id', localizacaoController.atualizarLocalizacao);

// Obter histórico de localizações de uma bobina
router.get('/historico/:bobina_id', localizacaoController.obterHistorico);

module.exports = router;
