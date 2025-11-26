const mysql = require('mysql2/promise');
require('dotenv').config();
const fs = require('fs').promises;
const path = require('path');

async function runMigrations() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: true } : undefined
    });

    try {
        console.log('🔄 Iniciando migrations...\n');

        // Criar tabela de controle de migrations se não existir
        await connection.query(`
            CREATE TABLE IF NOT EXISTS migrations (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL UNIQUE,
                executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Ler arquivos de migration
        const migrationsDir = path.join(__dirname, '..', 'migrations');
        const files = await fs.readdir(migrationsDir);
        const migrationFiles = files.filter(f => f.endsWith('.js')).sort();

        for (const file of migrationFiles) {
            // Verificar se já foi executada
            const [rows] = await connection.query(
                'SELECT * FROM migrations WHERE name = ?',
                [file]
            );

            if (rows.length > 0) {
                console.log(`⏭️  ${file} - já executada`);
                continue;
            }

            console.log(`▶️  Executando ${file}...`);
            
            const migration = require(path.join(migrationsDir, file));
            
            // Executar migration
            await migration.up({ query: connection.query.bind(connection) });
            
            // Registrar como executada
            await connection.query(
                'INSERT INTO migrations (name) VALUES (?)',
                [file]
            );
            
            console.log(`✅ ${file} - concluída\n`);
        }

        console.log('✨ Todas as migrations foram executadas com sucesso!');

    } catch (error) {
        console.error('❌ Erro ao executar migrations:', error);
        process.exit(1);
    } finally {
        await connection.end();
    }
}

runMigrations();
