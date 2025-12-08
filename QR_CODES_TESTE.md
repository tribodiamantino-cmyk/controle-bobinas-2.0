# 📱 QR Codes para Testes - Guia Rápido

## 🎯 Como Gerar QR Codes

### Opção 1: Site Online (Recomendado)
1. Acessar: https://www.qr-code-generator.com/
2. Selecionar "Text"
3. Colar o código (ex: `B-101`)
4. Download ou imprimir

### Opção 2: Google Chrome
1. Abrir página com o texto
2. Botão direito → "Create QR Code for this page"

### Opção 3: Terminal/Node.js
```bash
npm install -g qrcode
qrcode -o bobina101.png "B-101"
```

---

## 📦 QR Codes de BOBINAS

Gere QR codes com estes textos **exatos**:

```
B-101
B-102
B-103
B-104
B-105
```

**Formato**: `B-{número}`
**Uso**: Escanear antes de validar corte (identifica origem)

---

## 📍 QR Codes de LOCALIZAÇÕES

### Formato 1: LOC-XXX
```
LOC-001
LOC-002
LOC-003
LOC-004
LOC-005
```

### Formato 2: Corredor-Coluna-Altura
```
1-A-1
1-A-2
1-B-1
2-A-1
2-B-2
```

**Formato**: `LOC-{número}` OU `{corredor}-{coluna}-{altura}`
**Uso**: Alocar plano finalizado em localizações físicas

---

## ✂️ QR Codes de CORTES

**ATENÇÃO**: NÃO é preciso gerar manualmente!

O sistema gera automaticamente ao validar cada corte:
```
COR-2025-00001
COR-2025-00002
COR-2025-00003
...
```

**Como obter para testes**:
1. Validar alguns cortes no mobile
2. Ir em "🖨️ Imprimir Etiquetas"
3. Selecionar "✂️ Corte"
4. Escanear o QR gerado na validação
5. OU imprimir etiqueta após validar

---

## 🚚 QR Codes de CARREGAMENTOS

**ATENÇÃO**: Também gerado automaticamente!

Criado ao iniciar carregamento:
```
CAR-2025-00001
CAR-2025-00002
...
```

Não precisa de QR para teste normal.

---

## 🖨️ Template para Impressão

Se quiser imprimir vários de uma vez, use este template HTML:

```html
<!DOCTYPE html>
<html>
<head>
    <title>QR Codes para Teste</title>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>
    <style>
        .qr-item {
            display: inline-block;
            margin: 20px;
            text-align: center;
            page-break-inside: avoid;
        }
        .label {
            font-weight: bold;
            margin-top: 10px;
        }
    </style>
</head>
<body>
    <h1>QR Codes para Teste - Controle de Bobinas</h1>
    
    <h2>Bobinas</h2>
    <div class="qr-item">
        <div id="qr-b101"></div>
        <div class="label">B-101</div>
    </div>
    <div class="qr-item">
        <div id="qr-b102"></div>
        <div class="label">B-102</div>
    </div>
    <div class="qr-item">
        <div id="qr-b103"></div>
        <div class="label">B-103</div>
    </div>
    
    <h2>Localizações</h2>
    <div class="qr-item">
        <div id="qr-loc001"></div>
        <div class="label">LOC-001</div>
    </div>
    <div class="qr-item">
        <div id="qr-loc002"></div>
        <div class="label">LOC-002</div>
    </div>
    <div class="qr-item">
        <div id="qr-loc003"></div>
        <div class="label">LOC-003</div>
    </div>
    
    <script>
        // Bobinas
        new QRCode(document.getElementById("qr-b101"), {width: 200, height: 200, text: "B-101"});
        new QRCode(document.getElementById("qr-b102"), {width: 200, height: 200, text: "B-102"});
        new QRCode(document.getElementById("qr-b103"), {width: 200, height: 200, text: "B-103"});
        
        // Localizações
        new QRCode(document.getElementById("qr-loc001"), {width: 200, height: 200, text: "LOC-001"});
        new QRCode(document.getElementById("qr-loc002"), {width: 200, height: 200, text: "LOC-002"});
        new QRCode(document.getElementById("qr-loc003"), {width: 200, height: 200, text: "LOC-003"});
    </script>
</body>
</html>
```

**Como usar**:
1. Salvar como `qrcodes-teste.html`
2. Abrir no navegador
3. Ctrl+P → Imprimir
4. Ou screenshot cada QR

---

## 📋 Checklist para Preparar Testes

### Antes de começar os testes:

- [ ] **3 QR codes de bobinas** gerados (B-101, B-102, B-103)
- [ ] **3 QR codes de localizações** gerados (LOC-001, LOC-002, LOC-003)
- [ ] QR codes **impressos** OU
- [ ] QR codes em **tela secundária** (tablet/outro celular)
- [ ] Smartphone com **câmera funcionando**
- [ ] Acesso ao sistema Railway
- [ ] Este guia aberto para consulta

### Durante os testes:

- [ ] **Anotar** códigos de corte gerados (COR-2025-00001...)
- [ ] **Screenshot** de cada etapa funcionando
- [ ] **Anotar bugs** encontrados no guia principal
- [ ] **Testar** cada feedback colorido (verde/amarelo/laranja/vermelho)

---

## 🎨 Referência Visual dos QR Codes

### Como devem ficar:

```
┌─────────────────┐
│  ▀▄▀▄▀▄▀▄▀▄▀▄   │  
│  ▄▀▄▀▄▀▄▀▄▀▄▀   │
│  ▀▄▀▄▀▄▀▄▀▄▀▄   │  ← QR Code
│  ▄▀▄▀▄▀▄▀▄▀▄▀   │
│  ▀▄▀▄▀▄▀▄▀▄▀▄   │
│                 │
│     B-101       │  ← Label
└─────────────────┘
```

### Tamanho recomendado:
- **Mínimo**: 3cm x 3cm
- **Ideal**: 5cm x 5cm
- **Para impressora térmica 57mm**: usar largura máxima

---

## 🔍 Validar QR Codes

Antes de usar nos testes, validar que QR foi gerado corretamente:

1. **Usar app leitor de QR**:
   - Google Lens (Android)
   - Câmera nativa (iPhone)
   - Qualquer app leitor

2. **Verificar texto exato**:
   - ✅ Correto: `B-101`
   - ❌ Errado: `b-101` (minúsculo)
   - ❌ Errado: `B -101` (espaço extra)
   - ❌ Errado: `B101` (sem hífen)

3. **Não adicionar**:
   - URLs
   - Prefixos extras
   - Caracteres especiais

O QR deve conter **apenas o código**, nada mais!

---

## 📊 Quantidade Mínima vs Ideal

### Para teste básico (mínimo):
- 2 bobinas (B-101, B-102)
- 2 localizações (LOC-001, LOC-002)

### Para teste completo (ideal):
- 5 bobinas (B-101 até B-105)
- 5 localizações (LOC-001 até LOC-005)
- Teste com formato alternativo (1-A-1, 2-B-2)

### Para teste de produção (completo):
- 10+ bobinas
- 10+ localizações
- Imprimir etiquetas de cortes
- Testar carregamento com 20+ cortes

---

## 💡 Dicas Finais

1. **Cole QR codes em papelão**:
   - Mais fácil de manusear
   - Simula etiquetas reais

2. **Use tela de outro dispositivo**:
   - Abra HTML de QR codes em tablet
   - Scaneie do celular de teste

3. **Mantenha backup digital**:
   - Salve PNG de cada QR
   - Se perder, basta imprimir novamente

4. **Organize por tipo**:
   - Envelope/pasta "Bobinas"
   - Envelope/pasta "Localizações"
   - Fácil encontrar durante teste

5. **Label visível**:
   - Além do QR, escrever B-101 em baixo
   - Ajuda a debugar qual foi escaneado

---

**Pronto para começar? Vá para `GUIA_TESTES_SISTEMA_COMPLETO.md`!**
