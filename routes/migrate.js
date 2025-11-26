const express = require('express');
const router = express.Router();
const db = require('../config/database');
const fs = require('fs').promises;
const path = require('path');

// Endpoint para executar migração do Bando Y
router.post('/migrate-bando-y', async (req, res) => {
    try {
        const sqlPath = path.join(__dirname, '..', 'database', 'alter-produtos-bando-y.sql');
        const sql = await fs.readFile(sqlPath, 'utf8');
        
        // Dividir por ; e executar cada statement
        const statements = sql.split(';').filter(s => s.trim());
        
        for (const statement of statements) {
            if (statement.trim()) {
                try {
                    await db.query(statement);
                } catch (err) {
                    console.log('Statement error (pode ser ignorado se coluna já existe):', err.message);
                }
            }
        }
        
        res.json({ 
            success: true, 
            message: 'Migração executada com sucesso! Tabela produtos atualizada para suportar Bando Y' 
        });
    } catch (error) {
        console.error('Erro na migração:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Endpoint para remover coluna largura_total
router.post('/remove-largura-total', async (req, res) => {
    try {
        // Verificar se a coluna existe antes de tentar remover
        const [columns] = await db.query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'produtos' 
            AND COLUMN_NAME = 'largura_total'
        `);
        
        if (columns.length > 0) {
            await db.query('ALTER TABLE produtos DROP COLUMN largura_total');
            res.json({ 
                success: true, 
                message: 'Coluna largura_total removida com sucesso!' 
            });
        } else {
            res.json({ 
                success: true, 
                message: 'Coluna largura_total já não existe (migração já foi executada)' 
            });
        }
    } catch (error) {
        console.error('Erro ao remover coluna:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Endpoint para adicionar "Sem Bainha" ao ENUM tipo_bainha
router.post('/add-sem-bainha', async (req, res) => {
    try {
        await db.query(`
            ALTER TABLE produtos 
            MODIFY COLUMN tipo_bainha ENUM('Sem Bainha', 'Cano/Cano', 'Cano/Arame', 'Arame/Arame')
        `);
        
        res.json({ 
            success: true, 
            message: 'Opção "Sem Bainha" adicionada com sucesso!' 
        });
    } catch (error) {
        console.error('Erro ao atualizar ENUM:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Endpoint para verificar estrutura da tabela produtos
router.get('/check-produtos-table', async (req, res) => {
    try {
        const [columns] = await db.query(`
            SHOW COLUMNS FROM produtos
        `);
        
        res.json({ 
            success: true, 
            columns: columns 
        });
    } catch (error) {
        console.error('Erro ao verificar tabela:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

module.exports = router;
