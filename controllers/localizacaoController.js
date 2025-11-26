const db = require('../config/database');

// Validar formato de localização: 0000-X-0000
function validarLocalizacao(localizacao) {
    if (!localizacao) return true; // Localização pode ser nula
    
    const regex = /^\d{1,4}-[A-Z]-\d{1,4}$/;
    return regex.test(localizacao);
}

// Atualizar localização de uma bobina
async function atualizarLocalizacao(req, res) {
    const { bobina_id } = req.params;
    const { localizacao } = req.body;
    
    try {
        // Validar formato
        if (localizacao && !validarLocalizacao(localizacao)) {
            return res.status(400).json({ 
                success: false, 
                error: 'Formato de localização inválido. Use: 0000-X-0000 (ex: 0150-B-0320)' 
            });
        }
        
        // Buscar localização atual
        const [bobinas] = await db.query(
            'SELECT localizacao_atual FROM bobinas WHERE id = ?',
            [bobina_id]
        );
        
        if (bobinas.length === 0) {
            return res.status(404).json({ 
                success: false, 
                error: 'Bobina não encontrada' 
            });
        }
        
        const localizacaoAnterior = bobinas[0].localizacao_atual;
        
        // Atualizar localização
        await db.query(
            'UPDATE bobinas SET localizacao_atual = ? WHERE id = ?',
            [localizacao || null, bobina_id]
        );
        
        // Registrar no histórico
        await db.query(
            `INSERT INTO historico_localizacao 
            (bobina_id, localizacao_anterior, localizacao_nova) 
            VALUES (?, ?, ?)`,
            [bobina_id, localizacaoAnterior, localizacao || null]
        );
        
        res.json({ 
            success: true, 
            message: 'Localização atualizada com sucesso!',
            data: {
                localizacao_anterior: localizacaoAnterior,
                localizacao_nova: localizacao || null
            }
        });
        
    } catch (error) {
        console.error('Erro ao atualizar localização:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
}

// Obter histórico de localizações de uma bobina
async function obterHistorico(req, res) {
    const { bobina_id } = req.params;
    
    try {
        const [historico] = await db.query(
            `SELECT 
                id,
                localizacao_anterior,
                localizacao_nova,
                data_movimentacao
            FROM historico_localizacao
            WHERE bobina_id = ?
            ORDER BY data_movimentacao DESC`,
            [bobina_id]
        );
        
        res.json({ 
            success: true, 
            data: historico 
        });
        
    } catch (error) {
        console.error('Erro ao buscar histórico:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
}

module.exports = {
    atualizarLocalizacao,
    obterHistorico,
    validarLocalizacao
};
