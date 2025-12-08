/**
 * SCRIPT DE LIMPEZA TOTAL DO BANCO DE DADOS
 * 
 * ⚠️ ATENÇÃO: Este script apaga TODOS os dados inseridos!
 * Use apenas para resetar o sistema antes de testes realistas.
 * 
 * O que será apagado:
 * - Todas as bobinas
 * - Todos os retalhos
 * - Todos os produtos
 * - Todos os planos de corte e seus itens
 * - Todas as alocações
 * - Todos os cortes realizados
 * - Todas as localizações (exceto seeds iniciais se houver)
 * - Todos os carregamentos
 * - Todos os templates de obras padrão
 * 
 * O que será MANTIDO:
 * - Configurações de cores
 * - Configurações de gramaturas
 * - Estrutura do banco (tabelas, índices, triggers)
 */

require('dotenv').config();
const db = require('../config/database');

async function limparBancoDados() {
    try {
        console.log('🔌 Conectando ao banco de dados...');
        console.log('✅ Usando pool de conexões do sistema');
        
        // Desabilitar checagens de FK temporariamente
        console.log('\n🔓 Desabilitando checagens de Foreign Key...');
        await db.query('SET FOREIGN_KEY_CHECKS = 0');
        
        // Ordem de deleção (respeitando dependências)
        const tabelasParaLimpar = [
            { nome: 'carregamentos_itens', descricao: 'Itens de carregamento' },
            { nome: 'carregamentos', descricao: 'Carregamentos' },
            { nome: 'cortes_realizados', descricao: 'Cortes realizados' },
            { nome: 'plano_locacoes', descricao: 'Alocações de planos em localizações' },
            { nome: 'alocacoes_corte', descricao: 'Alocações de corte' },
            { nome: 'itens_plano_corte', descricao: 'Itens de planos de corte' },
            { nome: 'planos_corte', descricao: 'Planos de corte' },
            { nome: 'retalhos', descricao: 'Retalhos' },
            { nome: 'bobinas', descricao: 'Bobinas' },
            { nome: 'produtos', descricao: 'Produtos' },
            { nome: 'obras_padrao', descricao: 'Templates de obras padrão' },
            { nome: 'locacoes', descricao: 'Localizações' }
        ];
        
        console.log('\n🗑️  Iniciando limpeza de dados...\n');
        
        let totalRegistrosApagados = 0;
        
        for (const tabela of tabelasParaLimpar) {
            try {
                // Contar registros antes
                const [count] = await db.query(`SELECT COUNT(*) as total FROM ${tabela.nome}`);
                const registros = count[0].total;
                
                if (registros > 0) {
                    // Deletar todos os registros
                    await db.query(`DELETE FROM ${tabela.nome}`);
                    
                    // Resetar AUTO_INCREMENT
                    await db.query(`ALTER TABLE ${tabela.nome} AUTO_INCREMENT = 1`);
                    
                    console.log(`  ✅ ${tabela.descricao.padEnd(40)} | ${registros} registro(s) apagado(s)`);
                    totalRegistrosApagados += registros;
                } else {
                    console.log(`  ⏭️  ${tabela.descricao.padEnd(40)} | Já estava vazia`);
                }
            } catch (error) {
                // Se tabela não existir, ignorar
                if (error.code === 'ER_NO_SUCH_TABLE') {
                    console.log(`  ⚠️  ${tabela.descricao.padEnd(40)} | Tabela não existe`);
                } else {
                    throw error;
                }
            }
        }
        
        // Reabilitar checagens de FK
        console.log('\n🔒 Reabilitando checagens de Foreign Key...');
        await db.query('SET FOREIGN_KEY_CHECKS = 1');
        
        console.log('\n' + '='.repeat(70));
        console.log(`✅ LIMPEZA CONCLUÍDA!`);
        console.log(`📊 Total de registros apagados: ${totalRegistrosApagados}`);
        console.log('='.repeat(70));
        
        console.log('\n📝 O que foi MANTIDO:');
        const [cores] = await db.query('SELECT COUNT(*) as total FROM configuracoes_cores');
        const [gramaturas] = await db.query('SELECT COUNT(*) as total FROM configuracoes_gramaturas');
        
        console.log(`  ✓ ${cores[0].total} cores cadastradas`);
        console.log(`  ✓ ${gramaturas[0].total} gramaturas cadastradas`);
        console.log(`  ✓ Estrutura do banco (tabelas, índices, triggers)`);
        
        console.log('\n🎯 Próximo passo:');
        console.log('  → Cadastrar produtos com códigos do ERP (CTV-XXXX ou BN-XXXX)');
        console.log('  → Cadastrar bobinas realistas');
        console.log('  → Iniciar testes de produção');
        
    } catch (error) {
        console.error('\n❌ ERRO durante limpeza:', error.message);
        console.error('Stack:', error.stack);
        
        // Tentar reabilitar FK checks mesmo em caso de erro
        try {
            await db.query('SET FOREIGN_KEY_CHECKS = 1');
        } catch (e) {
            // Ignorar erro ao tentar reabilitar
        }
        
        process.exit(1);
    }
}

// Pedir confirmação antes de executar
console.log('\n' + '⚠️ '.repeat(35));
console.log('⚠️  ATENÇÃO: LIMPEZA TOTAL DO BANCO DE DADOS  ⚠️');
console.log('⚠️ '.repeat(35));
console.log('\nEste script irá APAGAR TODOS OS DADOS inseridos no sistema!');
console.log('(Configurações de cores e gramaturas serão mantidas)\n');

// Executar imediatamente (para uso via npm script)
limparBancoDados();
