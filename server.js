require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs').promises;
const db = require('./config/database');

const app = express();
const PORT = process.env.PORT || 3000;

// Importar middleware de validação de reservas
const { iniciarValidacaoPeriodica } = require('./middleware/validarReservas');

// SEGURANÇA: Helmet para headers HTTP seguros
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"], // Permite inline styles do Bootstrap
            scriptSrc: ["'self'", "'unsafe-inline'"], // Permite inline scripts
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'"],
            fontSrc: ["'self'", "data:"],
            objectSrc: ["'none'"],
            upgradeInsecureRequests: []
        }
    },
    crossOriginEmbedderPolicy: false // Para permitir recursos externos
}));

// SEGURANÇA: Rate Limiting para APIs
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // Máximo 100 requisições por IP
    message: 'Muitas requisições deste IP, tente novamente em 15 minutos.',
    standardHeaders: true,
    legacyHeaders: false,
});

// SEGURANÇA: Rate Limiting mais restritivo para operações críticas
const criticalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 50, // Máximo 50 requisições
    message: 'Limite de operações críticas excedido, tente novamente em 15 minutos.',
    standardHeaders: true,
    legacyHeaders: false,
});

// Função para executar migrations automaticamente
async function runMigrations() {
    try {
        console.log('🔄 Verificando migrations...');

        // Criar tabela de controle de migrations se não existir
        await db.query(`
            CREATE TABLE IF NOT EXISTS migrations (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL UNIQUE,
                executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Ler arquivos de migration
        const migrationsDir = path.join(__dirname, 'migrations');
        const files = await fs.readdir(migrationsDir);
        const migrationFiles = files.filter(f => f.endsWith('.js')).sort();

        let executedCount = 0;

        for (const file of migrationFiles) {
            // Verificar se já foi executada
            const [rows] = await db.query(
                'SELECT * FROM migrations WHERE name = ?',
                [file]
            );

            if (rows.length > 0) {
                continue;
            }

            console.log(`▶️  Executando ${file}...`);
            
            const migration = require(path.join(migrationsDir, file));
            
            // Executar migration
            await migration.up({ query: db.query.bind(db) });
            
            // Registrar como executada
            await db.query(
                'INSERT INTO migrations (name) VALUES (?)',
                [file]
            );
            
            executedCount++;
            console.log(`✅ ${file} - concluída`);
        }

        if (executedCount > 0) {
            console.log(`✨ ${executedCount} migration(s) executada(s) com sucesso!`);
        } else {
            console.log('✓ Todas as migrations já estão atualizadas');
        }

    } catch (error) {
        console.error('⚠️ Erro ao executar migrations:', error.message);
        // Não interrompe a aplicação se a migration falhar
    }
}

// Middleware
app.use(cors({
    origin: process.env.CORS_ORIGIN || '*', // Configurável via .env
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true
}));
app.use(express.json({ limit: '10mb' })); // Limite de payload
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static('public'));

// Aplicar rate limiting nas rotas de API
app.use('/api/', apiLimiter);

// Rotas
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Servidor rodando!',
        timestamp: new Date().toISOString()
    });
});

// Importar rotas
const coresRoutes = require('./routes/cores');
const gramaturasRoutes = require('./routes/gramaturas');
const produtosRoutes = require('./routes/produtos');
const bobinasRoutes = require('./routes/bobinas');
const retalhosRoutes = require('./routes/retalhos');
const localizacaoRoutes = require('./routes/localizacao');
const ordensCorteRoutes = require('./routes/ordensCorte');
const obrasPadraoRoutes = require('./routes/obrasPadrao');
const setupRoutes = require('./routes/setup');
const migrateRoutes = require('./routes/migrate');

// Usar rotas
app.use('/api/cores', coresRoutes);
app.use('/api/gramaturas', gramaturasRoutes);
app.use('/api/produtos', produtosRoutes);
app.use('/api/bobinas', bobinasRoutes);
app.use('/api/retalhos', retalhosRoutes);
app.use('/api/localizacao', localizacaoRoutes);
app.use('/api/ordens-corte', criticalLimiter, ordensCorteRoutes); // Rate limit mais restritivo
app.use('/api/obras-padrao', obrasPadraoRoutes);
app.use('/api/database', criticalLimiter, setupRoutes); // Rate limit mais restritivo
app.use('/api/database', criticalLimiter, migrateRoutes); // Rate limit mais restritivo

// Tratamento de erro 404
app.use((req, res) => {
    res.status(404).json({ error: 'Rota não encontrada' });
});

// Tratamento de erros global
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Erro interno do servidor' });
});

// Executar migrations e iniciar servidor
runMigrations().then(() => {
    app.listen(PORT, () => {
        console.log(`🚀 Servidor rodando na porta ${PORT}`);
        console.log(`📍 Ambiente: ${process.env.NODE_ENV || 'development'}`);
        
        // Iniciar validação automática de reservas
        iniciarValidacaoPeriodica();
    });
});
