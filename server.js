require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
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

// Importar rotas
const coresRoutes = require('./routes/cores');
const gramaturasRoutes = require('./routes/gramaturas');
const produtosRoutes = require('./routes/produtos');
const bobinasRoutes = require('./routes/bobinas');
const localizacaoRoutes = require('./routes/localizacao');
const setupRoutes = require('./routes/setup');
const migrateRoutes = require('./routes/migrate');

// Usar rotas
app.use('/api/cores', coresRoutes);
app.use('/api/gramaturas', gramaturasRoutes);
app.use('/api/produtos', produtosRoutes);
app.use('/api/bobinas', bobinasRoutes);
app.use('/api/localizacao', localizacaoRoutes);
app.use('/api/database', setupRoutes);
app.use('/api/database', migrateRoutes);

// Tratamento de erro 404
app.use((req, res) => {
    res.status(404).json({ error: 'Rota não encontrada' });
});

// Tratamento de erros global
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Erro interno do servidor' });
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
    console.log(`📍 Ambiente: ${process.env.NODE_ENV || 'development'}`);
});
