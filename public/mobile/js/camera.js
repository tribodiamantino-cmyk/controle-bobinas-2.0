/**
 * MOBILE V2.0 - CAMERA MODULE
 * 
 * Módulo de câmera para fotos de contraprova
 * Usa Capacitor Camera Plugin
 */

class Camera {
    constructor() {
        this.ultimaFoto = null;
    }

    /**
     * Verifica se a câmera está disponível
     */
    async estaDisponivel() {
        try {
            if (typeof window.Camera === 'undefined') {
                console.warn('Plugin Camera não encontrado');
                return false;
            }
            return true;
        } catch (error) {
            console.error('Erro ao verificar câmera:', error);
            return false;
        }
    }

    /**
     * Tira uma foto
     */
    async tirarFoto() {
        try {
            if (!await this.estaDisponivel()) {
                Utils.mostrarErro('Câmera não disponível neste dispositivo');
                return null;
            }

            debugLog('Abrindo câmera...');

            const { Camera, CameraResultType, CameraSource } = window;

            const options = {
                quality: CONFIG.CAMERA.quality,
                width: CONFIG.CAMERA.width,
                height: CONFIG.CAMERA.height,
                allowEditing: CONFIG.CAMERA.allowEditing,
                resultType: CameraResultType.Base64,
                source: CameraSource.Camera,
                saveToGallery: false,
                correctOrientation: true
            };

            const photo = await Camera.getPhoto(options);

            this.ultimaFoto = {
                base64: photo.base64String,
                format: photo.format,
                dataUrl: `data:image/${photo.format};base64,${photo.base64String}`,
                timestamp: new Date().toISOString()
            };

            debugLog('Foto capturada:', {
                format: photo.format,
                size: photo.base64String.length
            });

            return this.ultimaFoto;

        } catch (error) {
            console.error('Erro ao tirar foto:', error);
            
            if (error.message !== 'User cancelled photos app') {
                Utils.mostrarErro('Erro ao capturar foto: ' + error.message);
            }
            
            return null;
        }
    }

    /**
     * Seleciona foto da galeria
     */
    async selecionarDaGaleria() {
        try {
            if (!await this.estaDisponivel()) {
                Utils.mostrarErro('Galeria não disponível neste dispositivo');
                return null;
            }

            debugLog('Abrindo galeria...');

            const { Camera, CameraResultType, CameraSource } = window;

            const photo = await Camera.getPhoto({
                quality: CONFIG.CAMERA.quality,
                resultType: CameraResultType.Base64,
                source: CameraSource.Photos
            });

            this.ultimaFoto = {
                base64: photo.base64String,
                format: photo.format,
                dataUrl: `data:image/${photo.format};base64,${photo.base64String}`,
                timestamp: new Date().toISOString()
            };

            debugLog('Foto selecionada da galeria');

            return this.ultimaFoto;

        } catch (error) {
            console.error('Erro ao selecionar foto:', error);
            
            if (error.message !== 'User cancelled photos app') {
                Utils.mostrarErro('Erro ao selecionar foto: ' + error.message);
            }
            
            return null;
        }
    }

    /**
     * Converte foto para Blob para upload
     */
    async converterParaBlob(foto = null) {
        try {
            const fotoParaConverter = foto || this.ultimaFoto;
            
            if (!fotoParaConverter) {
                throw new Error('Nenhuma foto disponível');
            }

            const blob = Utils.base64ParaBlob(
                fotoParaConverter.dataUrl,
                `image/${fotoParaConverter.format}`
            );

            debugLog('Foto convertida para Blob:', {
                size: blob.size,
                type: blob.type
            });

            return blob;

        } catch (error) {
            console.error('Erro ao converter foto:', error);
            throw error;
        }
    }

    /**
     * Cria FormData com a foto para upload
     */
    async criarFormData(foto = null, campoNome = 'foto', dadosAdicionais = {}) {
        try {
            const blob = await this.converterParaBlob(foto);
            const formData = new FormData();

            // Adiciona foto
            const timestamp = Date.now();
            const fileName = `foto_${timestamp}.jpg`;
            formData.append(campoNome, blob, fileName);

            // Adiciona dados adicionais
            Object.keys(dadosAdicionais).forEach(chave => {
                formData.append(chave, dadosAdicionais[chave]);
            });

            debugLog('FormData criado:', {
                foto: fileName,
                campos: Object.keys(dadosAdicionais)
            });

            return formData;

        } catch (error) {
            console.error('Erro ao criar FormData:', error);
            throw error;
        }
    }

    /**
     * Limpa última foto
     */
    limparUltimaFoto() {
        this.ultimaFoto = null;
        debugLog('Última foto limpa');
    }

    /**
     * Retorna última foto
     */
    getUltimaFoto() {
        return this.ultimaFoto;
    }

    /**
     * Verifica se tem foto
     */
    temFoto() {
        return this.ultimaFoto !== null;
    }
}

// Log de inicialização
debugLog('Camera Module carregado com sucesso');
