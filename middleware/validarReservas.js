const db = require('../config/database');

/**
 * Middleware que valida e corrige automaticamente metragens reservadas
 * Roda ao iniciar o servidor e pode ser chamado periodicamente
 */
async function validarECorrigirReservas() {
    let connection;
    try {
        // Verificar se o banco está disponível
        connection = await db.promise();
        console.log('🔍 Verificando consistência de metragens reservadas...');
        
        // 1. Buscar todas as alocações ativas (planos em produção)
        const [alocacoesAtivas] = await connection.query(`
            SELECT ac.tipo_origem, ac.bobina_id, ac.retalho_id, ac.metragem_alocada
            FROM alocacoes_corte ac
            JOIN itens_plano_corte ipc ON ipc.id = ac.item_plano_corte_id
            JOIN planos_corte pc ON pc.id = ipc.plano_corte_id
            WHERE pc.status = 'em_producao'
        `);
        
        // 2. Calcular quanto DEVERIA estar reservado
        const reservasCorretas = {
            bobinas: {},
            retalhos: {}
        };
        
        alocacoesAtivas.forEach(alocacao => {
            if (alocacao.tipo_origem === 'bobina' && alocacao.bobina_id) {
                const id = alocacao.bobina_id;
                reservasCorretas.bobinas[id] = (reservasCorretas.bobinas[id] || 0) + parseFloat(alocacao.metragem_alocada);
            } else if (alocacao.tipo_origem === 'retalho' && alocacao.retalho_id) {
                const id = alocacao.retalho_id;
                reservasCorretas.retalhos[id] = (reservasCorretas.retalhos[id] || 0) + parseFloat(alocacao.metragem_alocada);
            }
        });
        
        // 3. Buscar valores ATUAIS do banco
        const [bobinasAtuais] = await connection.query(`
            SELECT id, metragem_reservada 
            FROM bobinas 
            WHERE metragem_reservada > 0
        `);
        
        const [retalhosAtuais] = await connection.query(`
            SELECT id, metragem_reservada 
            FROM retalhos 
            WHERE metragem_reservada > 0
        `);
        
        // 4. Identificar e corrigir inconsistências
        let correcoes = 0;
        
        // Resetar todas as reservas primeiro
        await connection.query(`UPDATE bobinas SET metragem_reservada = 0`);
        await connection.query(`UPDATE retalhos SET metragem_reservada = 0`);
        
        // Aplicar apenas as reservas corretas
        for (const [bobinaId, metragemCorreta] of Object.entries(reservasCorretas.bobinas)) {
            await connection.query(`
                UPDATE bobinas 
                SET metragem_reservada = ? 
                WHERE id = ?
            `, [metragemCorreta, bobinaId]);
            correcoes++;
        }
        
        for (const [retalhoId, metragemCorreta] of Object.entries(reservasCorretas.retalhos)) {
            await connection.query(`
                UPDATE retalhos 
                SET metragem_reservada = ? 
                WHERE id = ?
            `, [metragemCorreta, retalhoId]);
            correcoes++;
        }
        
        const totalBobinasOrfas = bobinasAtuais.filter(b => !reservasCorretas.bobinas[b.id] && b.metragem_reservada > 0).length;
        const totalRetalhosOrfaos = retalhosAtuais.filter(r => !reservasCorretas.retalhos[r.id] && r.metragem_reservada > 0).length;
        const totalOrfas = totalBobinasOrfas + totalRetalhosOrfaos;
        
        if (totalOrfas > 0) {
            console.log(`✅ Validação de reservas concluída: ${totalOrfas} reserva(s) órfã(s) removida(s), ${correcoes} reserva(s) ativa(s) recalculada(s)`);
        } else {
            console.log(`✅ Validação de reservas concluída: Sistema consistente (${correcoes} reserva(s) ativa(s))`);
        }
        
        return {
            success: true,
            alocacoesAtivas: alocacoesAtivas.length,
            reservasOrfasRemovidas: totalOrfas,
            reservasRecalculadas: correcoes
        };
        
    } catch (error) {
        // Se o erro for de conexão, apenas reportar silenciosamente
        if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
            console.log('⚠️  Banco de dados não disponível para validação (será tentado novamente)');
            return {
                success: false,
                error: 'Banco de dados não disponível'
            };
        }
        
        console.error('❌ Erro ao validar reservas:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Middleware Express que roda a validação em background
 */
function middlewareValidacao(req, res, next) {
    // Não bloquear a requisição, rodar em background
    validarECorrigirReservas().catch(err => {
        console.error('Erro em validação background:', err);
    });
    next();
}

/**
 * Iniciar validação periódica (a cada 1 hora)
 */
function iniciarValidacaoPeriodica() {
    const INTERVALO = 60 * 60 * 1000; // 1 hora
    
    console.log('🔄 Sistema de validação automática iniciado (intervalo: 1 hora)');
    
    // Aguardar 5 segundos antes da primeira validação para garantir que o banco está pronto
    setTimeout(() => {
        console.log('🔍 Executando primeira validação de metragens reservadas...');
        validarECorrigirReservas();
    }, 5000);
    
    // Executar periodicamente
    setInterval(() => {
        validarECorrigirReservas();
    }, INTERVALO);
}

module.exports = {
    validarECorrigirReservas,
    middlewareValidacao,
    iniciarValidacaoPeriodica
};
