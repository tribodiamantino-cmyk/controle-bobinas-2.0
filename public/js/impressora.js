// ===============================================
// SISTEMA DE IMPRESSÃO DE ETIQUETAS
// Elgin L42 PRO Full - 60mm x 30mm
// ===============================================

class ImpressoraEtiquetas {
    constructor() {
        this.impressora = null;
        this.larguraEtiqueta = 60; // mm
        this.alturaEtiqueta = 30; // mm
    }

    // Conectar com a impressora via USB/Bluetooth
    async conectar() {
        if (!navigator.usb) {
            throw new Error('Web USB não suportado neste navegador. Use Chrome/Edge.');
        }

        try {
            // Solicitar acesso à impressora USB
            const device = await navigator.usb.requestDevice({
                filters: [
                    { vendorId: 0x0483 } // Elgin vendor ID
                ]
            });

            await device.open();
            await device.selectConfiguration(1);
            await device.claimInterface(0);

            this.impressora = device;
            console.log('Impressora conectada com sucesso!');
            return true;

        } catch (error) {
            console.error('Erro ao conectar impressora:', error);
            throw new Error('Não foi possível conectar à impressora. Verifique se está ligada e conectada via USB.');
        }
    }

    // Gerar comandos ESC/POS para etiqueta de BOBINA
    gerarEtiquetaBobina(bobina) {
        const comandos = [];

        // Inicializar impressora
        comandos.push(0x1B, 0x40); // ESC @ - Inicializar

        // Configurar tamanho da etiqueta (60mm x 30mm)
        comandos.push(0x1B, 0x57, 0x3C, 0x00); // Largura 60mm

        // LINHA 1: ID da Bobina (GRANDE E NEGRITO)
        comandos.push(0x1B, 0x21, 0x30); // Fonte dupla altura e largura
        comandos.push(0x1B, 0x45, 0x01); // Negrito ON
        const idBobina = bobina.codigo || `BOB-${bobina.id}`;
        comandos.push(...this.stringParaBytes(idBobina));
        comandos.push(0x0A); // Line feed
        comandos.push(0x1B, 0x45, 0x00); // Negrito OFF
        comandos.push(0x1B, 0x21, 0x00); // Fonte normal

        // LINHA 2: Código do Produto • Cor
        comandos.push(0x1B, 0x21, 0x10); // Fonte média
        const linhaProduto = `${bobina.produto_codigo} • ${bobina.nome_cor || ''}`;
        comandos.push(...this.stringParaBytes(linhaProduto));
        comandos.push(0x0A);
        comandos.push(0x1B, 0x21, 0x00);

        // LINHA 3: Gramatura • Largura
        comandos.push(0x1B, 0x21, 0x10); // Fonte média
        const gramatura = bobina.gramatura || '';
        let largura = '';
        
        if (bobina.tipo_tecido === 'Bando Y' && bobina.largura_maior && bobina.largura_y) {
            // Formato: XX+YY+YY
            largura = `${bobina.largura_maior}+${bobina.largura_y}+${bobina.largura_y}cm`;
        } else if (bobina.largura_final) {
            largura = `L: ${bobina.largura_final}cm`;
        }
        
        const linhaGramatura = `${gramatura} • ${largura}`;
        comandos.push(...this.stringParaBytes(linhaGramatura));
        comandos.push(0x0A);
        comandos.push(0x1B, 0x21, 0x00);

        // LINHA 4: METRAGEM (GRANDE E NEGRITO)
        comandos.push(0x1B, 0x21, 0x20); // Fonte grande
        comandos.push(0x1B, 0x45, 0x01); // Negrito ON
        const metragem = parseFloat(bobina.metragem || 0).toFixed(2);
        const linhaMetragem = `METRAGEM: ${this.formatarNumero(metragem)}m`;
        comandos.push(...this.stringParaBytes(linhaMetragem));
        comandos.push(0x0A);
        comandos.push(0x1B, 0x45, 0x00); // Negrito OFF
        comandos.push(0x1B, 0x21, 0x00);

        // Espaço para QR Code futuro
        comandos.push(0x0A);

        // Cortar papel
        comandos.push(0x1D, 0x56, 0x42, 0x00); // Corte total

        return new Uint8Array(comandos);
    }

    // Gerar comandos ESC/POS para etiqueta de RETALHO
    gerarEtiquetaRetalho(retalho) {
        const comandos = [];

        // Inicializar impressora
        comandos.push(0x1B, 0x40); // ESC @ - Inicializar

        // LINHA 1: ID do Retalho (GRANDE E NEGRITO)
        comandos.push(0x1B, 0x21, 0x30); // Fonte dupla
        comandos.push(0x1B, 0x45, 0x01); // Negrito ON
        const idRetalho = retalho.codigo || `RET-${retalho.id}`;
        comandos.push(...this.stringParaBytes(idRetalho));
        comandos.push(0x0A);
        comandos.push(0x1B, 0x45, 0x00);
        comandos.push(0x1B, 0x21, 0x00);

        // LINHA 2: Código do Produto • Cor
        comandos.push(0x1B, 0x21, 0x10);
        const linhaProduto = `${retalho.produto_codigo} • ${retalho.nome_cor || ''}`;
        comandos.push(...this.stringParaBytes(linhaProduto));
        comandos.push(0x0A);
        comandos.push(0x1B, 0x21, 0x00);

        // LINHA 3: Gramatura • Largura
        comandos.push(0x1B, 0x21, 0x10);
        const gramatura = retalho.gramatura || '';
        let largura = '';
        
        if (retalho.tipo_tecido === 'Bando Y' && retalho.largura_maior && retalho.largura_y) {
            largura = `${retalho.largura_maior}+${retalho.largura_y}+${retalho.largura_y}cm`;
        } else if (retalho.largura_final) {
            largura = `L: ${retalho.largura_final}cm`;
        }
        
        const linhaGramatura = `${gramatura} • ${largura}`;
        comandos.push(...this.stringParaBytes(linhaGramatura));
        comandos.push(0x0A);
        comandos.push(0x1B, 0x21, 0x00);

        // LINHA 4: METRAGEM (GRANDE E NEGRITO)
        comandos.push(0x1B, 0x21, 0x20);
        comandos.push(0x1B, 0x45, 0x01);
        const metragem = parseFloat(retalho.metragem || 0).toFixed(2);
        const linhaMetragem = `METRAGEM: ${this.formatarNumero(metragem)}m`;
        comandos.push(...this.stringParaBytes(linhaMetragem));
        comandos.push(0x0A);
        comandos.push(0x1B, 0x45, 0x00);
        comandos.push(0x1B, 0x21, 0x00);

        // Espaço para QR Code futuro
        comandos.push(0x0A);

        // Cortar papel
        comandos.push(0x1D, 0x56, 0x42, 0x00);

        return new Uint8Array(comandos);
    }

    // Enviar dados para a impressora
    async imprimir(dados) {
        if (!this.impressora) {
            throw new Error('Impressora não conectada. Conecte primeiro.');
        }

        try {
            // Endpoint para transferência de dados (normalmente endpoint 1)
            await this.impressora.transferOut(1, dados);
            console.log('Etiqueta enviada para impressão!');
            return true;

        } catch (error) {
            console.error('Erro ao imprimir:', error);
            throw new Error('Erro ao enviar dados para a impressora.');
        }
    }

    // Utilitários
    stringParaBytes(str) {
        const encoder = new TextEncoder();
        return Array.from(encoder.encode(str));
    }

    formatarNumero(numero) {
        return parseFloat(numero).toLocaleString('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }

    // Desconectar impressora
    async desconectar() {
        if (this.impressora) {
            await this.impressora.close();
            this.impressora = null;
            console.log('Impressora desconectada');
        }
    }
}

// Instância global
const impressora = new ImpressoraEtiquetas();

// Funções auxiliares para uso no sistema
async function imprimirEtiquetaBobina(bobina) {
    try {
        // Verificar se já está conectado
        if (!impressora.impressora) {
            await impressora.conectar();
        }

        const dados = impressora.gerarEtiquetaBobina(bobina);
        await impressora.imprimir(dados);
        
        mostrarNotificacao('🖨️ Etiqueta impressa com sucesso!', 'success');
        return true;

    } catch (error) {
        console.error('Erro ao imprimir etiqueta:', error);
        mostrarNotificacao('Erro ao imprimir: ' + error.message, 'error');
        return false;
    }
}

async function imprimirEtiquetaRetalho(retalho) {
    try {
        // Verificar se já está conectado
        if (!impressora.impressora) {
            await impressora.conectar();
        }

        const dados = impressora.gerarEtiquetaRetalho(retalho);
        await impressora.imprimir(dados);
        
        mostrarNotificacao('🖨️ Etiqueta impressa com sucesso!', 'success');
        return true;

    } catch (error) {
        console.error('Erro ao imprimir etiqueta:', error);
        mostrarNotificacao('Erro ao imprimir: ' + error.message, 'error');
        return false;
    }
}

// Preview da etiqueta (mostra como vai ficar)
function mostrarPreviewEtiqueta(tipo, dados) {
    let html = '<div style="font-family: monospace; border: 2px dashed #ccc; padding: 10px; background: white; max-width: 300px;">';
    
    if (tipo === 'bobina') {
        const idBobina = dados.codigo || `BOB-${dados.id}`;
        const linhaProduto = `${dados.produto_codigo} • ${dados.nome_cor || ''}`;
        const gramatura = dados.gramatura || '';
        
        let largura = '';
        if (dados.tipo_tecido === 'Bando Y' && dados.largura_maior && dados.largura_y) {
            largura = `${dados.largura_maior}+${dados.largura_y}+${dados.largura_y}cm`;
        } else if (dados.largura_final) {
            largura = `L: ${dados.largura_final}cm`;
        }
        
        const metragem = parseFloat(dados.metragem || 0).toFixed(2);
        
        html += `
            <div style="font-size: 18px; font-weight: bold; margin-bottom: 5px;">${idBobina}</div>
            <div style="font-size: 14px; margin-bottom: 3px;">${linhaProduto}</div>
            <div style="font-size: 14px; margin-bottom: 3px;">${gramatura} • ${largura}</div>
            <div style="font-size: 16px; font-weight: bold;">METRAGEM: ${metragem}m</div>
        `;
        
    } else if (tipo === 'retalho') {
        const idRetalho = dados.codigo || `RET-${dados.id}`;
        const linhaProduto = `${dados.produto_codigo} • ${dados.nome_cor || ''}`;
        const gramatura = dados.gramatura || '';
        
        let largura = '';
        if (dados.tipo_tecido === 'Bando Y' && dados.largura_maior && dados.largura_y) {
            largura = `${dados.largura_maior}+${dados.largura_y}+${dados.largura_y}cm`;
        } else if (dados.largura_final) {
            largura = `L: ${dados.largura_final}cm`;
        }
        
        const metragem = parseFloat(dados.metragem || 0).toFixed(2);
        
        html += `
            <div style="font-size: 18px; font-weight: bold; margin-bottom: 5px;">${idRetalho}</div>
            <div style="font-size: 14px; margin-bottom: 3px;">${linhaProduto}</div>
            <div style="font-size: 14px; margin-bottom: 3px;">${gramatura} • ${largura}</div>
            <div style="font-size: 16px; font-weight: bold;">METRAGEM: ${metragem}m</div>
        `;
    }
    
    html += '</div>';
    return html;
}
