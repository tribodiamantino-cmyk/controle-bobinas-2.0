const express = require('express');
const router = express.Router();
const { executarSchema, verificarTabelas } = require('../database/setup');
const db = require('../config/database');

// Rota de emergência para criar tabela locacoes
router.post('/criar-tabela-locacoes', async (req, res) => {
    try {
        console.log('🚨 SETUP DE EMERGÊNCIA: Criando tabela locacoes...');
        
        // 1. Verificar se já existe
        const [tables] = await db.query(`SHOW TABLES LIKE 'locacoes'`);
        
        if (tables.length > 0) {
            return res.json({
                success: true,
                message: 'Tabela locacoes já existe!',
                action: 'skipped'
            });
        }
        
        // 2. Criar tabela
        await db.query(`
            CREATE TABLE IF NOT EXISTS locacoes (
                id INT AUTO_INCREMENT PRIMARY KEY,
                codigo VARCHAR(20) NOT NULL UNIQUE COMMENT 'Formato: 0000-X-0000',
                descricao VARCHAR(200) NULL,
                capacidade INT NULL COMMENT 'Capacidade de bobinas (opcional)',
                ativa BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_codigo (codigo)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        
        console.log('✓ Tabela locacoes criada');
        
        // 3. Inserir dados iniciais
        const locacoes = [
            ['0001-A-0001', 'Corredor A - Prateleira 1 - Posição 01', 50],
            ['0001-A-0002', 'Corredor A - Prateleira 1 - Posição 02', 50],
            ['0001-A-0003', 'Corredor A - Prateleira 1 - Posição 03', 50],
            ['0001-A-0004', 'Corredor A - Prateleira 1 - Posição 04', 50],
            ['0001-A-0005', 'Corredor A - Prateleira 1 - Posição 05', 50],
            ['0002-A-0001', 'Corredor A - Prateleira 2 - Posição 01', 50],
            ['0002-A-0002', 'Corredor A - Prateleira 2 - Posição 02', 50],
            ['0002-A-0003', 'Corredor A - Prateleira 2 - Posição 03', 50],
            ['0002-A-0004', 'Corredor A - Prateleira 2 - Posição 04', 50],
            ['0003-B-0001', 'Corredor B - Prateleira 1 - Posição 01', 50],
            ['0003-B-0002', 'Corredor B - Prateleira 1 - Posição 02', 50],
            ['0003-B-0003', 'Corredor B - Prateleira 1 - Posição 03', 50],
            ['0003-B-0004', 'Corredor B - Prateleira 1 - Posição 04', 50],
            ['0004-B-0001', 'Corredor B - Prateleira 2 - Posição 01', 50],
            ['0004-B-0002', 'Corredor B - Prateleira 2 - Posição 02', 50],
            ['0004-B-0003', 'Corredor B - Prateleira 2 - Posição 03', 50],
            ['0005-C-0001', 'Corredor C - Prateleira 1 - Posição 01', 50],
            ['0005-C-0002', 'Corredor C - Prateleira 1 - Posição 02', 50],
            ['0005-C-0003', 'Corredor C - Prateleira 1 - Posição 03', 50],
        ];
        
        for (const [codigo, descricao, capacidade] of locacoes) {
            await db.query(`
                INSERT INTO locacoes (codigo, descricao, capacidade, ativa)
                VALUES (?, ?, ?, TRUE)
            `, [codigo, descricao, capacidade]);
        }
        
        console.log(`✓ ${locacoes.length} locações inseridas`);
        
        res.json({
            success: true,
            message: `Tabela locacoes criada com sucesso! ${locacoes.length} locações inseridas.`,
            action: 'created',
            count: locacoes.length
        });
        
    } catch (error) {
        console.error('❌ Erro ao criar tabela locacoes:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            stack: error.stack
        });
    }
});

// Rota para executar o setup do banco
router.get('/setup', async (req, res) => {
    try {
        await executarSchema();
        const tabelas = await verificarTabelas();
        
        res.json({
            success: true,
            message: 'Banco de dados configurado com sucesso!',
            tabelas: tabelas.map(t => Object.values(t)[0])
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Rota para verificar tabelas
router.get('/verificar', async (req, res) => {
    try {
        const tabelas = await verificarTabelas();
        res.json({
            success: true,
            tabelas: tabelas.map(t => Object.values(t)[0])
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;
