const db = require('../config/database');

// Validar formato de localização: 0000-X-0000
function validarLocalizacao(localizacao) {
    if (!localizacao) return true; // Localização pode ser nula
    
    // Formato: 0001-A-0001 até 9999-Z-9999
    const regex = /^\d{4}-[A-Z]-\d{4}$/;
    return regex.test(localizacao);
}

// Formatar localização para padrão com zeros
function formatarLocacao(valor) {
    if (!valor) return null;
    
    // Remove não alfanuméricos e converte para maiúscula
    const limpo = valor.replace(/[^0-9A-Za-z]/g, '').toUpperCase();
    
    // Extrai partes (números, letra, números)
    const match = limpo.match(/^(\d{1,4})([A-Z])(\d{1,4})$/);
    if (!match) return valor;
    
    const [, area, corredor, posicao] = match;
    return `${area.padStart(4, '0')}-${corredor}-${posicao.padStart(4, '0')}`;
}

// Atualizar localização de uma bobina
async function atualizarLocalizacao(req, res) {
    const { bobina_id } = req.params;
    let { localizacao } = req.body;
    
    try {
        // Formatar localização
        localizacao = formatarLocacao(localizacao);
        
        // Validar formato
        if (localizacao && !validarLocalizacao(localizacao)) {
            return res.status(400).json({ 
                success: false, 
                error: 'Formato de localização inválido. Use: 0000-X-0000 (ex: 0150-B-0320)' 
            });
        }
        
        // Buscar localização atual
        const [bobinas] = await db.query(
            'SELECT locacao FROM bobinas WHERE id = ?',
            [bobina_id]
        );
        
        if (bobinas.length === 0) {
            return res.status(404).json({ 
                success: false, 
                error: 'Bobina não encontrada' 
            });
        }
        
        const localizacaoAnterior = bobinas[0].locacao;
        
        // Atualizar localização
        await db.query(
            'UPDATE bobinas SET locacao = ? WHERE id = ?',
            [localizacao || null, bobina_id]
        );
        
        // Registrar no histórico (se tabela existir)
        try {
            await db.query(
                `INSERT INTO historico_localizacao 
                (bobina_id, localizacao_anterior, localizacao_nova) 
                VALUES (?, ?, ?)`,
                [bobina_id, localizacaoAnterior, localizacao || null]
            );
        } catch (e) {
            console.log('⚠️ Tabela historico_localizacao não existe');
        }
        
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
