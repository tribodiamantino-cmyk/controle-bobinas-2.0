const db = require('./config/database');

async function verificarEstrutura() {
    try {
        // Verificar estrutura da tabela produtos
        const [columns] = await db.query(`
            SHOW COLUMNS FROM produtos
        `);
        
        console.log('\n📋 ESTRUTURA DA TABELA PRODUTOS:');
        console.log('━'.repeat(80));
        columns.forEach(col => {
            console.log(`   ${col.Field} (${col.Type}) ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${col.Key ? `[${col.Key}]` : ''}`);
        });
        
        // Buscar um produto de exemplo
        const [produtos] = await db.query(`
            SELECT * FROM produtos LIMIT 1
        `);
        
        console.log('\n📦 EXEMPLO DE PRODUTO:');
        console.log(JSON.stringify(produtos[0], null, 2));
        
    } catch (error) {
        console.error('❌ Erro:', error);
    }
    
    process.exit(0);
}

verificarEstrutura();
