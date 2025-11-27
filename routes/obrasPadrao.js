const express = require('express');
const router = express.Router();
const obrasPadraoController = require('../controllers/obrasPadraoController');

// Listar todas as obras padrão
router.get('/', obrasPadraoController.listarObrasPadrao);

// Buscar detalhes de uma obra padrão
router.get('/:id', obrasPadraoController.buscarObraPadrao);

// Criar obra padrão a partir de um plano existente
router.post('/criar-de-plano', obrasPadraoController.criarObraPadraoDePlano);

// Criar obra padrão manualmente (sem plano existente)
router.post('/criar-manual', obrasPadraoController.criarObraPadraoManual);

// Criar novo plano a partir de uma obra padrão
router.post('/criar-plano', obrasPadraoController.criarPlanoDeObraPadrao);

// Atualizar obra padrão
router.put('/:id', obrasPadraoController.atualizarObraPadrao);

// Excluir obra padrão
router.delete('/:id', obrasPadraoController.excluirObraPadrao);

module.exports = router;
