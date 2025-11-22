# Sistema Motorista Particular BC

Sistema de gerenciamento de contatos para motorista particular.

## 🚀 Como Configurar

### 1. Configurar Banco de Dados Neon

1. Acesse https://neon.tech e crie uma conta
2. Crie um novo projeto PostgreSQL
3. Execute os scripts SQL do arquivo `database-structure.txt`
4. Copie a connection string do Neon

### 2. Configurar Variáveis de Ambiente

Edite o arquivo `.env` e adicione sua connection string do Neon:

```
DATABASE_URL=sua_connection_string_aqui
PORT=3000
```

### 3. Instalar Dependências

```bash
npm install
```

### 4. Iniciar o Servidor

```bash
npm start
```

Ou para desenvolvimento com auto-reload:

```bash
npm run dev
```

### 5. Acessar o Sistema

Abra o navegador em: http://localhost:3000

**Login padrão:**
- Usuário: 123
- Senha: 456

## 📁 Estrutura do Projeto

```
contact-app/
├── index.html              # Frontend da aplicação
├── img.jpg                 # Logo
├── server.js               # API Backend
├── package.json            # Dependências
├── .env                    # Configurações (não commitar)
├── database-structure.txt  # Estrutura do banco
└── README.md              # Este arquivo
```

## 🔧 API Endpoints

### Autenticação
- `POST /api/login` - Login

### Contatos Novos
- `GET /api/contatos/novos` - Listar todos
- `POST /api/contatos/novo` - Adicionar novo
- `DELETE /api/contatos/novo/:id` - Deletar

### Contatos Salvos
- `GET /api/contatos/salvos` - Listar todos
- `POST /api/contatos/salvar/:id` - Salvar (mover de novos)
- `DELETE /api/contatos/salvo/:id` - Deletar

### Histórico
- `POST /api/interacao` - Registrar interação
