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

// Endpoint para adicionar colunas faltantes para Bando Y
router.post('/fix-produtos-columns', async (req, res) => {
    try {
        const operations = [];
        
        // Verificar e adicionar tipo_tecido
        const [tipoTecidoExists] = await db.query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'produtos' 
            AND COLUMN_NAME = 'tipo_tecido'
        `);
        
        if (tipoTecidoExists.length === 0) {
            await db.query(`
                ALTER TABLE produtos 
                ADD COLUMN tipo_tecido ENUM('Normal', 'Bando Y') DEFAULT 'Normal' AFTER fabricante
            `);
            operations.push('Adicionada coluna tipo_tecido');
        }
        
        // Verificar e adicionar largura_maior
        const [larguraMaiorExists] = await db.query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'produtos' 
            AND COLUMN_NAME = 'largura_maior'
        `);
        
        if (larguraMaiorExists.length === 0) {
            await db.query(`
                ALTER TABLE produtos 
                ADD COLUMN largura_maior DECIMAL(10,2) NULL AFTER largura_final
            `);
            operations.push('Adicionada coluna largura_maior');
        }
        
        // Verificar e adicionar largura_y
        const [larguraYExists] = await db.query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'produtos' 
            AND COLUMN_NAME = 'largura_y'
        `);
        
        if (larguraYExists.length === 0) {
            await db.query(`
                ALTER TABLE produtos 
                ADD COLUMN largura_y DECIMAL(10,2) NULL AFTER largura_maior
            `);
            operations.push('Adicionada coluna largura_y');
        }
        
        if (operations.length > 0) {
            res.json({ 
                success: true, 
                message: 'Colunas adicionadas com sucesso!',
                operations: operations
            });
        } else {
            res.json({ 
                success: true, 
                message: 'Todas as colunas já existem (migração já foi executada)'
            });
        }
    } catch (error) {
        console.error('Erro ao adicionar colunas:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Endpoint para criar tabela de bobinas
router.post('/create-bobinas-table', async (req, res) => {
    try {
        const sqlPath = path.join(__dirname, '..', 'database', 'create-bobinas-table.sql');
        const sql = await fs.readFile(sqlPath, 'utf8');
        
        await db.query(sql);
        
        res.json({ 
            success: true, 
            message: 'Tabela bobinas criada com sucesso!' 
        });
    } catch (error) {
        console.error('Erro ao criar tabela bobinas:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Endpoint para adicionar coluna codigo_interno em bobinas
router.post('/fix-bobinas-codigo-interno', async (req, res) => {
    try {
        // Verificar se a coluna existe
        const [columns] = await db.query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'bobinas' 
            AND COLUMN_NAME = 'codigo_interno'
        `);
        
        if (columns.length === 0) {
            // Adicionar coluna
            await db.query(`
                ALTER TABLE bobinas 
                ADD COLUMN codigo_interno VARCHAR(20) UNIQUE NOT NULL AFTER id
            `);
            
            res.json({ 
                success: true, 
                message: 'Coluna codigo_interno adicionada com sucesso!' 
            });
        } else {
            res.json({ 
                success: true, 
                message: 'Coluna codigo_interno já existe' 
            });
        }
    } catch (error) {
        console.error('Erro ao adicionar coluna:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Endpoint para verificar estrutura da tabela bobinas
router.get('/check-bobinas-table', async (req, res) => {
    try {
        const [columns] = await db.query(`
            SHOW COLUMNS FROM bobinas
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

// Endpoint para adicionar colunas faltantes em bobinas
router.post('/fix-bobinas-complete', async (req, res) => {
    try {
        const operations = [];
        
        // Verificar e adicionar nota_fiscal
        const [notaFiscalExists] = await db.query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'bobinas' 
            AND COLUMN_NAME = 'nota_fiscal'
        `);
        
        if (notaFiscalExists.length === 0) {
            await db.query(`
                ALTER TABLE bobinas 
                ADD COLUMN nota_fiscal VARCHAR(50) NOT NULL AFTER codigo_interno
            `);
            operations.push('Adicionada coluna nota_fiscal');
        }
        
        // Verificar e adicionar loja
        const [lojaExists] = await db.query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'bobinas' 
            AND COLUMN_NAME = 'loja'
        `);
        
        if (lojaExists.length === 0) {
            await db.query(`
                ALTER TABLE bobinas 
                ADD COLUMN loja ENUM('Cortinave', 'BN') NOT NULL AFTER nota_fiscal
            `);
            operations.push('Adicionada coluna loja');
        }
        
        if (operations.length > 0) {
            res.json({ 
                success: true, 
                message: 'Colunas adicionadas com sucesso!',
                operations: operations
            });
        } else {
            res.json({ 
                success: true, 
                message: 'Todas as colunas já existem'
            });
        }
    } catch (error) {
        console.error('Erro ao adicionar colunas:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

module.exports = router;
