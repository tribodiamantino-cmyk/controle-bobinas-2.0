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
            
            try {
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
            } catch (migrationError) {
                console.error(`❌ ERRO em ${file}:`, migrationError.message);
                console.error(`   SQL Error Code: ${migrationError.code}`);
                console.error(`   SQL State: ${migrationError.sqlState}`);
                // Continua para próxima migration
            }
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

// ============= SEGURANÇA =============

// Trust proxy - necessário para Railway/Heroku (atrás de proxy reverso)
app.set('trust proxy', 1);

// Helmet - Headers de segurança
app.use(helmet({
    contentSecurityPolicy: false, // Desabilitado para não quebrar inline scripts
    crossOriginEmbedderPolicy: false // Permite recursos externos
}));

// Rate Limiting - Proteção contra abuso
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 1000, // Limite generoso: 1000 requisições por 15min
    message: 'Muitas requisições. Tente novamente em alguns minutos.',
    standardHeaders: true,
    legacyHeaders: false,
});

app.use('/api/', limiter); // Aplica apenas nas rotas de API

// ============= MIDDLEWARE =============
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

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

// Endpoint de versão - usa config/version.js como fonte única
app.get('/api/version', (req, res) => {
    const versionInfo = require('./config/version');
    res.json({
        success: true,
        data: {
            version: versionInfo.version,
            buildDate: versionInfo.buildDate,
            summary: versionInfo.summary,
            changelog: versionInfo.changelog,
            currentPhase: versionInfo.currentPhase,
            status: versionInfo.status,
            environment: process.env.NODE_ENV || 'development'
        }
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
const mobileRoutes = require('./routes/mobile');
const qrcodesRoutes = require('./routes/qrcodes');
const locacoesRoutes = require('./routes/locacoes');
const seedTesteRoutes = require('./routes/seed-teste');
const adminRoutes = require('./routes/admin');
const impressaoRoutes = require('./routes/impressao');
const cortesRoutes = require('./routes/cortes');
const historicoRoutes = require('./routes/historico');

// Usar rotas
app.use('/api/cores', coresRoutes);
app.use('/api/gramaturas', gramaturasRoutes);
app.use('/api/produtos', produtosRoutes);
app.use('/api/bobinas', bobinasRoutes);
app.use('/api/retalhos', retalhosRoutes);
app.use('/api/localizacao', localizacaoRoutes);
app.use('/api/ordens-corte', ordensCorteRoutes);
app.use('/api/obras-padrao', obrasPadraoRoutes);
app.use('/api/database', setupRoutes);
app.use('/api/database', migrateRoutes);
app.use('/api/mobile', mobileRoutes);
app.use('/api/qrcodes', qrcodesRoutes);
app.use('/api/locacoes', locacoesRoutes);
app.use('/api/seed', seedTesteRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/impressao', impressaoRoutes);
app.use('/api/cortes', cortesRoutes);
app.use('/api/historico', historicoRoutes);

// Servir arquivos de upload (compatível com Railway Volume)
const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';
app.use('/uploads', express.static(UPLOAD_DIR));
console.log(`📁 Servindo uploads de: ${UPLOAD_DIR}`);

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
