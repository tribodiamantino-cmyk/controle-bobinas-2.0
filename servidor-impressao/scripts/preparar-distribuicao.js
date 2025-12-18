/**
 * Script para preparar pasta de distribuição
 * Executa após o build do pkg
 */

const fs = require('fs');
const path = require('path');

const DIST_DIR = path.join(__dirname, '..', 'dist');
const SRC_DIR = path.join(__dirname, '..');

console.log('📦 Preparando pasta de distribuição...');

// Criar pasta dist se não existir
if (!fs.existsSync(DIST_DIR)) {
    fs.mkdirSync(DIST_DIR, { recursive: true });
}

// Copiar config.json de exemplo
const configExemplo = {
    "api": {
        "baseUrl": "https://controle-bobinas-20-production.up.railway.app",
        "pollingInterval": 5000,
        "loja": "PLA"
    },
    "impressoras": {
        "termica": {
            "nome": "",
            "tipo": "windows"
        },
        "a4": {
            "nome": "",
            "copias": 2
        }
    },
    "logs": {
        "nivel": "info",
        "arquivo": true
    }
};

fs.writeFileSync(
    path.join(DIST_DIR, 'config.json'),
    JSON.stringify(configExemplo, null, 4),
    'utf-8'
);
console.log('✅ config.json copiado');

// Copiar templates
const templatesDir = path.join(DIST_DIR, 'templates');
if (!fs.existsSync(templatesDir)) {
    fs.mkdirSync(templatesDir, { recursive: true });
}

const templateSrc = path.join(SRC_DIR, 'src', 'templates', 'romaneio.html');
if (fs.existsSync(templateSrc)) {
    fs.copyFileSync(templateSrc, path.join(templatesDir, 'romaneio.html'));
    console.log('✅ Template romaneio.html copiado');
}

// Criar pasta de logs
const logsDir = path.join(DIST_DIR, 'logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}
console.log('✅ Pasta logs criada');

// Criar LEIA-ME.txt
const leiaMe = `
╔══════════════════════════════════════════════════════════════╗
║     SERVIDOR DE IMPRESSÃO - CONTROLE DE BOBINAS 2.0          ║
╚══════════════════════════════════════════════════════════════╝

INSTALAÇÃO:
-----------
1. Execute "Instalar.bat" como Administrador
2. Siga as instruções na tela
3. Configure as impressoras no arquivo config.json

CONFIGURAÇÃO (config.json):
---------------------------
- api.loja: "PLA" para Cortinave ou "CIA" para BN
- impressoras.termica.nome: Nome da impressora de etiquetas no Windows
- impressoras.a4.nome: Nome da impressora A4 (deixe vazio para usar a padrão)

PARA DESCOBRIR O NOME DAS IMPRESSORAS:
--------------------------------------
1. Abra o Prompt de Comando (cmd)
2. Digite: wmic printer get name
3. Copie o nome exato da impressora para o config.json

EXECUTAR:
---------
- Clique duas vezes em "ServidorImpressao.exe"
- Ou execute "Iniciar.bat"

LOGS:
-----
Os logs ficam na pasta "logs" com arquivos por data.

SUPORTE:
--------
Em caso de problemas, verifique:
1. Se as impressoras estão instaladas e funcionando
2. Se o config.json está correto
3. Se há conexão com a internet

`;

fs.writeFileSync(path.join(DIST_DIR, 'LEIA-ME.txt'), leiaMe, 'utf-8');
console.log('✅ LEIA-ME.txt criado');

console.log('\n✅ Distribuição preparada em:', DIST_DIR);
console.log('\nArquivos:');
fs.readdirSync(DIST_DIR).forEach(file => {
    console.log(`  - ${file}`);
});
