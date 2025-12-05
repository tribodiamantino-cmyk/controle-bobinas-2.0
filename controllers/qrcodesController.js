const db = require('../config/database');
const QRCode = require('qrcode');

// Gerar QR Code para Bobina
exports.gerarQRBobina = async (req, res) => {
    try {
        const { id } = req.params;
        
        const [bobina] = await db.query(
            'SELECT codigo_interno FROM bobinas WHERE id = ?',
            [id]
        );
        
        if (!bobina || bobina.length === 0) {
            return res.status(404).json({ 
                success: false, 
                error: 'Bobina não encontrada' 
            });
        }
        
        const qrDataURL = await QRCode.toDataURL(bobina[0].codigo_interno, {
            errorCorrectionLevel: 'H',
            width: 300,
            margin: 2
        });
        
        res.json({ 
            success: true, 
            qrCodeDataURL: qrDataURL,
            codigo: bobina[0].codigo_interno
        });
        
    } catch (error) {
        console.error('Erro ao gerar QR da bobina:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
};

// Gerar QR Code para Retalho
exports.gerarQRRetalho = async (req, res) => {
    try {
        const { id } = req.params;
        
        const [retalho] = await db.query(
            'SELECT codigo_retalho FROM retalhos WHERE id = ?',
            [id]
        );
        
        if (!retalho || retalho.length === 0) {
            return res.status(404).json({ 
                success: false, 
                error: 'Retalho não encontrado' 
            });
        }
        
        const qrDataURL = await QRCode.toDataURL(retalho[0].codigo_retalho, {
            errorCorrectionLevel: 'H',
            width: 300,
            margin: 2
        });
        
        res.json({ 
            success: true, 
            qrCodeDataURL: qrDataURL,
            codigo: retalho[0].codigo_retalho
        });
        
    } catch (error) {
        console.error('Erro ao gerar QR do retalho:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
};

// Gerar QR Code para Corte
exports.gerarQRCorte = async (req, res) => {
    try {
        const { codigo_corte } = req.params;
        
        const qrDataURL = await QRCode.toDataURL(codigo_corte, {
            errorCorrectionLevel: 'H',
            width: 300,
            margin: 2
        });
        
        res.json({ 
            success: true, 
            qrCodeDataURL: qrDataURL,
            codigo: codigo_corte
        });
        
    } catch (error) {
        console.error('Erro ao gerar QR do corte:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
};

// Gerar QR Code para Locação
exports.gerarQRLocacao = async (req, res) => {
    try {
        const { codigo_locacao } = req.params;
        
        const qrDataURL = await QRCode.toDataURL(`LOC-${codigo_locacao}`, {
            errorCorrectionLevel: 'H',
            width: 300,
            margin: 2
        });
        
        res.json({ 
            success: true, 
            qrCodeDataURL: qrDataURL,
            codigo: codigo_locacao
        });
        
    } catch (error) {
        console.error('Erro ao gerar QR da locação:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
};

// Gerar múltiplos QR Codes de locações (para impressão em lote)
exports.gerarQRLocacoesLote = async (req, res) => {
    try {
        const { codigos } = req.body;
        
        if (!codigos || !Array.isArray(codigos)) {
            return res.status(400).json({ 
                success: false, 
                error: 'Array de códigos é obrigatório' 
            });
        }
        
        const qrCodes = [];
        
        for (const codigo of codigos) {
            const qrDataURL = await QRCode.toDataURL(`LOC-${codigo}`, {
                errorCorrectionLevel: 'H',
                width: 300,
                margin: 2
            });
            
            qrCodes.push({
                codigo: codigo,
                qrCodeDataURL: qrDataURL
            });
        }
        
        res.json({ 
            success: true, 
            qrCodes: qrCodes
        });
        
    } catch (error) {
        console.error('Erro ao gerar QR codes em lote:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
};
