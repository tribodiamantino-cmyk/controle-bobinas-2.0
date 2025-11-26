const db = require('../config/database');

/**
 * Executar arquivo SQL de schema
 */
async function executarSchema() {
    const fs = require('fs');
    const path = require('path');
    
    try {
        // Ler arquivo SQL
        const sqlPath = path.join(__dirname, 'setup-railway.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');
        
        // Dividir em statements individuais
        const statements = sql
            .replace(/--.*$/gm, '') // Remover comentários
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0);
        
        console.log(`📊 Executando ${statements.length} comandos SQL...`);
        
        // Executar cada statement
        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i];
            if (statement) {
                try {
                    await db.query(statement);
                    console.log(`✅ Comando ${i + 1}/${statements.length} executado`);
                } catch (err) {
                    // Ignorar erros de "já existe" 
                    if (!err.message.includes('already exists') && !err.code === 'ER_TABLE_EXISTS_ERROR') {
                        console.log(`⚠️ Aviso no comando ${i + 1}: ${err.message}`);
                    }
                }
            }
        }
        
        console.log('✅ Schema do banco de dados criado com sucesso!');
        console.log('✅ Dados iniciais inseridos!');
        
    } catch (error) {
        console.error('❌ Erro ao executar schema:', error.message);
        throw error;
    }
}

/**
 * Verificar se as tabelas existem
 */
async function verificarTabelas() {
    try {
        const [tabelas] = await db.query('SHOW TABLES');
        console.log('\n📋 Tabelas no banco de dados:');
        tabelas.forEach((tabela, index) => {
            const nomeTabela = Object.values(tabela)[0];
            console.log(`${index + 1}. ${nomeTabela}`);
        });
        return tabelas;
    } catch (error) {
        console.error('❌ Erro ao verificar tabelas:', error.message);
        throw error;
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    (async () => {
        try {
            await executarSchema();
            await verificarTabelas();
            process.exit(0);
        } catch (error) {
            console.error('❌ Erro fatal:', error);
            process.exit(1);
        }
    })();
}

module.exports = {
    executarSchema,
    verificarTabelas
};
