// MOBILE V2.0 - CAMERA MODULE
// Plugin: @capacitor/camera

class Camera {
    constructor() {
        this.ultimaFoto = null;
    }

    async estaDisponivel() {
        try {
            if (typeof Capacitor === 'undefined' || !Capacitor.isNativePlatform()) {
                console.warn('Camera: Nao esta em ambiente nativo');
                return false;
            }
            if (!Capacitor.Plugins || !Capacitor.Plugins.Camera) {
                console.warn('Camera: Plugin nao encontrado');
                return false;
            }
            return true;
        } catch (error) {
            console.error('Camera: Erro:', error);
            return false;
        }
    }

    getPlugin() {
        if (typeof Capacitor !== 'undefined' && Capacitor.Plugins && Capacitor.Plugins.Camera) {
            return Capacitor.Plugins.Camera;
        }
        return null;
    }

    async solicitarPermissoes() {
        try {
            const plugin = this.getPlugin();
            if (!plugin) return false;

            const { camera } = await plugin.checkPermissions();
            if (camera === 'granted') return true;

            const result = await plugin.requestPermissions();
            return result.camera === 'granted';
        } catch (error) {
            console.error('Camera: Erro permissoes:', error);
            return false;
        }
    }

    async tirarFoto() {
        try {
            if (!await this.estaDisponivel()) {
                Utils.mostrarErro('Camera nao disponivel neste dispositivo');
                return null;
            }

            if (!await this.solicitarPermissoes()) {
                Utils.mostrarErro('Permissao de camera negada');
                return null;
            }

            console.log('Camera: Abrindo...');

            const plugin = this.getPlugin();
            
            const photo = await plugin.getPhoto({
                quality: 85,
                width: 1280,
                height: 720,
                allowEditing: false,
                resultType: 'base64',
                source: 'CAMERA',
                saveToGallery: false,
                correctOrientation: true
            });

            this.ultimaFoto = {
                base64: photo.base64String,
                format: photo.format || 'jpeg',
                dataUrl: 'data:image/' + (photo.format || 'jpeg') + ';base64,' + photo.base64String,
                timestamp: new Date().toISOString()
            };

            console.log('Camera: Foto capturada');
            return this.ultimaFoto;

        } catch (error) {
            console.error('Camera: Erro:', error);
            if (!error.message || !error.message.includes('cancel')) {
                Utils.mostrarErro('Erro ao capturar foto');
            }
            return null;
        }
    }

    async selecionarDaGaleria() {
        try {
            if (!await this.estaDisponivel()) {
                Utils.mostrarErro('Galeria nao disponivel');
                return null;
            }

            const plugin = this.getPlugin();
            
            const photo = await plugin.getPhoto({
                quality: 85,
                resultType: 'base64',
                source: 'PHOTOS'
            });

            this.ultimaFoto = {
                base64: photo.base64String,
                format: photo.format || 'jpeg',
                dataUrl: 'data:image/' + (photo.format || 'jpeg') + ';base64,' + photo.base64String,
                timestamp: new Date().toISOString()
            };

            return this.ultimaFoto;
        } catch (error) {
            console.error('Camera: Erro galeria:', error);
            return null;
        }
    }

    getUltimaFoto() {
        return this.ultimaFoto;
    }

    limparFoto() {
        this.ultimaFoto = null;
    }

    async converterParaBlob(base64) {
        try {
            const byteString = atob(base64);
            const arrayBuffer = new ArrayBuffer(byteString.length);
            const uint8Array = new Uint8Array(arrayBuffer);
            
            for (let i = 0; i < byteString.length; i++) {
                uint8Array[i] = byteString.charCodeAt(i);
            }
            
            return new Blob([arrayBuffer], { type: 'image/jpeg' });
        } catch (error) {
            console.error('Camera: Erro converter blob:', error);
            return null;
        }
    }
}

console.log('Camera Module v2.0 carregado');
