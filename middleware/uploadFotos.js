const multer = require('multer');
const path = require('path');
const sharp = require('sharp');
const fs = require('fs').promises;

// Configuração do storage do multer
const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
        const uploadDir = './uploads/fotos-medidor/';
        try {
            await fs.mkdir(uploadDir, { recursive: true });
            cb(null, uploadDir);
        } catch (error) {
            cb(error);
        }
    },
    filename: (req, file, cb) => {
        const timestamp = Date.now();
        const ext = path.extname(file.originalname);
        cb(null, `medidor_${timestamp}${ext}`);
    }
});

// Filtro de arquivos (apenas imagens)
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Apenas imagens são permitidas'), false);
    }
};

// Configuração do multer
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB
    },
    fileFilter: fileFilter
});

// Função para comprimir imagem
async function comprimirImagem(filePath) {
    try {
        const compressedPath = filePath.replace(path.extname(filePath), '_compressed.jpg');
        
        await sharp(filePath)
            .resize(1200, null, {
                withoutEnlargement: true,
                fit: 'inside'
            })
            .jpeg({
                quality: 80,
                progressive: true
            })
            .toFile(compressedPath);
        
        // Deletar original
        await fs.unlink(filePath);
        
        // Renomear comprimido para o nome original
        await fs.rename(compressedPath, filePath);
        
        console.log(`✓ Imagem comprimida: ${filePath}`);
        return filePath;
        
    } catch (error) {
        console.error('Erro ao comprimir imagem:', error);
        throw error;
    }
}

module.exports = {
    upload,
    comprimirImagem
};
