/**
 * Utilitários de Locação
 * 
 * Funções para normalização e validação de códigos de locação
 */

/**
 * Normaliza locação para formato padrão 0000-X-0000
 * Aceita qualquer formato válido e converte para padronizado
 * @param {string} locacao - Locação em qualquer formato (1-A-1, 0001-A-0001, etc)
 * @returns {string|null} - Locação normalizada ou null se inválido
 */
function normalizarLocacao(locacao) {
    if (!locacao) return null;
    
    // Remove espaços e converte para maiúsculo
    let codigo = locacao.trim().toUpperCase();
    
    // Remove prefixo LOC- se existir
    codigo = codigo.replace(/^LOC-?/, '');
    
    // Remove caracteres inválidos (mantém só números, letras e hífens)
    codigo = codigo.replace(/[^0-9A-Z-]/g, '');
    
    // Tenta extrair padrão: números + letra + números (com ou sem hífens)
    const match = codigo.match(/^(\d{1,4})-?([A-Z])-?(\d{1,4})$/);
    
    if (!match) return null;
    
    // Normaliza para 4 dígitos com zeros à esquerda
    const area = match[1].padStart(4, '0');
    const corredor = match[2];
    const posicao = match[3].padStart(4, '0');
    
    return `${area}-${corredor}-${posicao}`;
}

/**
 * Valida se uma locação está em formato válido (flexível)
 * Aceita formatos: 1-A-1, 01-A-01, 0001-A-0001, 1A1, etc
 * @param {string} locacao - Locação para validar
 * @returns {boolean} - True se válido
 */
function validarLocacao(locacao) {
    if (!locacao) return false;
    const codigo = locacao.trim().toUpperCase().replace(/^LOC-?/, '');
    return /^\d{1,4}-?[A-Z]-?\d{1,4}$/.test(codigo);
}

/**
 * Gera todas as variações possíveis de uma locação
 * Útil para buscas que precisam encontrar tanto 1-A-1 quanto 0001-A-0001
 * @param {string} locacao - Locação em qualquer formato
 * @returns {string[]} - Array com todas as variações possíveis
 */
function gerarVariacoesLocacao(locacao) {
    const normalizada = normalizarLocacao(locacao);
    if (!normalizada) return [];
    
    const match = normalizada.match(/^(\d{4})-([A-Z])-(\d{4})$/);
    if (!match) return [normalizada];
    
    const area = parseInt(match[1]);
    const corredor = match[2];
    const posicao = parseInt(match[3]);
    
    const variacoes = new Set();
    
    // Formato normalizado (0001-A-0001)
    variacoes.add(normalizada);
    
    // Formato compacto (1-A-1)
    variacoes.add(`${area}-${corredor}-${posicao}`);
    
    // Variações com diferentes zeros
    for (let i = 1; i <= 4; i++) {
        for (let j = 1; j <= 4; j++) {
            variacoes.add(`${area.toString().padStart(i, '0')}-${corredor}-${posicao.toString().padStart(j, '0')}`);
        }
    }
    
    return Array.from(variacoes);
}

module.exports = {
    normalizarLocacao,
    validarLocacao,
    gerarVariacoesLocacao
};
