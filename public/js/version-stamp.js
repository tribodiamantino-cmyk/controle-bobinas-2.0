/**
 * Componente de Carimbo de Versão
 * Adiciona automaticamente um carimbo com versão e data no canto inferior direito
 */

(function() {
    // Configuração da versão (atualizar aqui quando fizer novos deploys)
    const VERSION = '2.2.0';
    const BUILD_DATE = '08/12/2025';
    const ENVIRONMENT = window.location.hostname === 'localhost' ? 'DEV' : 'PROD';
    
    // Criar elemento do carimbo
    function createVersionStamp() {
        const stamp = document.createElement('div');
        stamp.className = 'version-stamp';
        stamp.innerHTML = `
            <div class="version-number">v${VERSION} ${ENVIRONMENT === 'DEV' ? '🔧' : '✓'}</div>
            <div class="version-date">${BUILD_DATE}</div>
        `;
        
        // Adicionar título tooltip
        stamp.title = `Versão ${VERSION}\nAtualizado em: ${BUILD_DATE}\nAmbiente: ${ENVIRONMENT}`;
        
        return stamp;
    }
    
    // Adicionar ao DOM quando página carregar
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            document.body.appendChild(createVersionStamp());
        });
    } else {
        document.body.appendChild(createVersionStamp());
    }
})();
