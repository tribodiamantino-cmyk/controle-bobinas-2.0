const express = require('express');
const router = express.Router();
const ordensController = require('../controllers/ordensCorteController');

// Criar novo plano de corte
router.post('/', ordensController.criarPlano);

// Listar planos (com filtro opcional por status)
router.get('/', ordensController.listarPlanos);

// Buscar plano por ID (com itens e alocações)
router.get('/:id', ordensController.buscarPlanoPorId);

// Sugerir alocações automáticas para todos os itens
router.get('/:id/sugestoes', ordensController.sugerirAlocacoes);

// Alocar origem para um item
router.post('/alocar', ordensController.alocarOrigem);

// Enviar plano para produção (reserva metragens)
router.post('/:id/enviar-producao', ordensController.enviarParaProducao);

// Finalizar plano (dar baixa definitiva)
router.post('/:id/finalizar', ordensController.finalizarPlano);

// Excluir plano (apenas planejamento)
router.delete('/:id', ordensController.excluirPlano);

// Listar origens disponíveis para um corte
router.get('/origens/disponiveis', ordensController.listarOrigensDisponiveis);

// Adicionar itens a um plano existente (edição)
router.post('/:id/itens', ordensController.adicionarItensPlano);

// Remover um item do plano (edição)
router.delete('/item/:itemId', ordensController.removerItemPlano);

module.exports = router;
