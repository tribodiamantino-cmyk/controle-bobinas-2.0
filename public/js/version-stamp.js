/**
 * Componente de Carimbo de Versão
 * Busca versão da API e adiciona carimbo no canto inferior direito
 */

(function() {
    // Fallback caso API falhe
    let VERSION = '2.6.0';
    let BUILD_DATE = '18/12/2025';
    const ENVIRONMENT = window.location.hostname === 'localhost' ? 'DEV' : 'PROD';
    
    // Criar elemento do carimbo
    function createVersionStamp() {
        const stamp = document.createElement('div');
        stamp.className = 'version-stamp';
        stamp.id = 'version-stamp';
        stamp.innerHTML = `
            <div class="version-number">v${VERSION} ${ENVIRONMENT === 'DEV' ? '🔧' : '✓'}</div>
            <div class="version-date">${BUILD_DATE}</div>
        `;
        stamp.title = `Versão ${VERSION}\nAtualizado em: ${BUILD_DATE}\nAmbiente: ${ENVIRONMENT}`;
        return stamp;
    }
    
    // Atualizar carimbo com dados da API
    function updateFromAPI() {
        fetch('/api/version')
            .then(response => response.json())
            .then(data => {
                if (data.success && data.data) {
                    VERSION = data.data.version;
                    BUILD_DATE = data.data.buildDate;
                    
                    const stamp = document.getElementById('version-stamp');
                    if (stamp) {
                        const env = data.data.environment === 'production' ? '✓' : '🔧';
                        stamp.innerHTML = `
                            <div class="version-number">v${VERSION} ${env}</div>
                            <div class="version-date">${BUILD_DATE}</div>
                        `;
                        stamp.title = `Versão ${VERSION}\n${data.data.summary}\nAtualizado em: ${BUILD_DATE}\nAmbiente: ${data.data.environment}`;
                    }
                }
            })
            .catch(err => {
                console.log('⚠️ Usando versão fallback (API indisponível)');
            });
    }
    
    // Adicionar ao DOM quando página carregar
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            document.body.appendChild(createVersionStamp());
            updateFromAPI();
        });
    } else {
        document.body.appendChild(createVersionStamp());
        updateFromAPI();
    }
})();
