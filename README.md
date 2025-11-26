# 🎯 Controle de Bobinas 2.0

Sistema de gerenciamento e controle de bobinas desenvolvido com Node.js, Express e MySQL.

## 🚀 Tecnologias

- **Node.js** - Runtime JavaScript
- **Express** - Framework web
- **MySQL** - Banco de dados
- **Railway** - Deploy e hospedagem
- **dotenv** - Gerenciamento de variáveis de ambiente

## 📁 Estrutura do Projeto

```
controle-bobinas-2.0/
├── config/           # Configurações (banco de dados, etc)
├── controllers/      # Lógica de negócio
├── models/          # Modelos de dados
├── routes/          # Rotas da API
├── public/          # Arquivos estáticos (HTML, CSS, JS)
├── .env             # Variáveis de ambiente (não versionado)
├── .env.example     # Exemplo de variáveis de ambiente
├── .gitignore       # Arquivos ignorados pelo Git
├── server.js        # Arquivo principal do servidor
├── package.json     # Dependências do projeto
├── railway.json     # Configuração do Railway
└── README.md        # Este arquivo
```

## 🔧 Instalação

1. Clone o repositório ou baixe os arquivos

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
   - Copie o arquivo `.env.example` para `.env`
   - Ajuste as configurações do banco de dados

4. Crie o banco de dados MySQL:
```sql
CREATE DATABASE controle_bobinas;
```

## ▶️ Como Executar

### Desenvolvimento
```bash
npm run dev
```

### Produção
```bash
npm start
```

O servidor estará rodando em `http://localhost:3000`

## 🌐 Deploy no Railway

1. Crie uma conta no [Railway](https://railway.app)

2. Crie um novo projeto e adicione:
   - Um serviço Node.js (este projeto)
   - Um serviço MySQL

3. Configure as variáveis de ambiente no Railway:
   - `NODE_ENV=production`
   - As variáveis do MySQL serão configuradas automaticamente

4. Conecte seu repositório GitHub

5. O deploy será automático a cada push!

## 📡 API Endpoints

### Health Check
```
GET /api/health
```
Retorna o status do servidor

### Adicione suas rotas aqui
```
# Exemplo:
GET    /api/bobinas       # Listar todas as bobinas
POST   /api/bobinas       # Criar nova bobina
GET    /api/bobinas/:id   # Buscar bobina específica
PUT    /api/bobinas/:id   # Atualizar bobina
DELETE /api/bobinas/:id   # Deletar bobina
```

## 🗄️ Banco de Dados

### Configuração Local
- Host: localhost
- Usuário: root
- Senha: (vazio ou sua senha)
- Database: controle_bobinas

### Configuração Railway
As variáveis são configuradas automaticamente pelo serviço MySQL do Railway.

## 📝 Próximos Passos

- [ ] Criar tabelas no banco de dados
- [ ] Implementar CRUD de bobinas
- [ ] Adicionar autenticação
- [ ] Criar interface de usuário completa
- [ ] Adicionar validações
- [ ] Implementar testes

## 👨‍💻 Desenvolvimento

### Estrutura de Código

**Routes**: Definem os endpoints da API
**Controllers**: Contêm a lógica de negócio
**Models**: Representam as tabelas do banco de dados
**Config**: Configurações (banco de dados, etc)

### Padrão de Commits
```
feat: Nova funcionalidade
fix: Correção de bug
docs: Documentação
style: Formatação
refactor: Refatoração de código
test: Testes
```

## 📄 Licença

ISC

## 🤝 Contribuindo

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'feat: Adiciona nova feature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abra um Pull Request

---

Desenvolvido com ❤️ e ☕
