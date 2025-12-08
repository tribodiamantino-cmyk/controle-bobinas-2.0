const express = require('express');
const router = express.Router();
const db = require('../config/database');

/**
 * ROTA ADMINISTRATIVA - LIMPEZA DE DADOS
 * 
 * ⚠️ ATENÇÃO: Use apenas em desenvolvimento ou para resetar dados de teste!
 * 
 * POST /api/admin/limpar-dados
 * 
 * Apaga TODOS os dados inseridos no sistema.
 * Mantém: cores, gramaturas, estrutura do banco
 */

router.post('/limpar-dados', async (req, res) => {
    try {
        console.log('🗑️  Iniciando limpeza de dados via API...');
        
        // Desabilitar FK checks
        await db.query('SET FOREIGN_KEY_CHECKS = 0');
        
        const tabelasParaLimpar = [
            'carregamentos_itens',
            'carregamentos',
            'cortes_realizados',
            'plano_locacoes',
            'alocacoes_corte',
            'itens_plano_corte',
            'planos_corte',
            'retalhos',
            'bobinas',
            'produtos',
            'obras_padrao',
            'locacoes'
        ];
        
        const relatorio = [];
        let totalApagado = 0;
        
        for (const tabela of tabelasParaLimpar) {
            try {
                // Contar registros
                const [count] = await db.query(`SELECT COUNT(*) as total FROM ${tabela}`);
                const registros = count[0].total;
                
                if (registros > 0) {
                    // Deletar
                    await db.query(`DELETE FROM ${tabela}`);
                    await db.query(`ALTER TABLE ${tabela} AUTO_INCREMENT = 1`);
                    
                    relatorio.push({ tabela, registros, status: 'apagado' });
                    totalApagado += registros;
                    console.log(`  ✅ ${tabela}: ${registros} registro(s) apagado(s)`);
                } else {
                    relatorio.push({ tabela, registros: 0, status: 'vazia' });
                }
            } catch (error) {
                if (error.code === 'ER_NO_SUCH_TABLE') {
                    relatorio.push({ tabela, registros: 0, status: 'não existe' });
                } else {
                    throw error;
                }
            }
        }
        
        // Reabilitar FK checks
        await db.query('SET FOREIGN_KEY_CHECKS = 1');
        
        // Contar o que sobrou
        const [cores] = await db.query('SELECT COUNT(*) as total FROM configuracoes_cores');
        const [gramaturas] = await db.query('SELECT COUNT(*) as total FROM configuracoes_gramaturas');
        
        console.log('✅ Limpeza concluída!');
        
        res.json({
            success: true,
            message: 'Dados limpos com sucesso',
            totalApagado,
            relatorio,
            mantido: {
                cores: cores[0].total,
                gramaturas: gramaturas[0].total
            }
        });
        
    } catch (error) {
        console.error('❌ Erro ao limpar dados:', error);
        
        // Tentar reabilitar FK checks mesmo em caso de erro
        try {
            await db.query('SET FOREIGN_KEY_CHECKS = 1');
        } catch (e) {
            console.error('Erro ao reabilitar FK checks:', e);
        }
        
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;
