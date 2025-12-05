const express = require('express');
const router = express.Router();
const qrcodesController = require('../controllers/qrcodesController');

// Gerar QR Code para Bobina
router.get('/bobina/:id', qrcodesController.gerarQRBobina);

// Gerar QR Code para Retalho
router.get('/retalho/:id', qrcodesController.gerarQRRetalho);

// Gerar QR Code para Corte
router.get('/corte/:codigo_corte', qrcodesController.gerarQRCorte);

// Gerar QR Code para Locação
router.get('/locacao/:codigo_locacao', qrcodesController.gerarQRLocacao);

// Gerar múltiplos QR Codes de locações
router.post('/locacoes/lote', qrcodesController.gerarQRLocacoesLote);

module.exports = router;
