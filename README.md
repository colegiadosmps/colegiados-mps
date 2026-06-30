# Colegiados - MPS

Sistema web para consulta e administracao de colegiados do Ministerio da Previdencia Social, preparado desde o inicio para operar localmente e em producao com frontend em Netlify, backend em Render e banco SQLite em disco persistente.

## Tecnologias

- Frontend: React, Vite, JavaScript e CSS puro
- Backend: Node.js, Express, JavaScript, SQLite e importacao CSV
- Banco de dados: SQLite com caminho configuravel via variavel de ambiente

## Estrutura do projeto

```txt
colegiados-mps/
|-- backend/
|   |-- src/
|   |   |-- controllers/
|   |   |-- database/
|   |   |-- routes/
|   |   |-- services/
|   |   |-- utils/
|   |   `-- server.js
|   |-- uploads/
|   |-- .env.example
|   `-- package.json
|-- frontend/
|   |-- src/
|   |   |-- components/
|   |   |-- pages/
|   |   |-- services/
|   |   `-- styles/
|   |-- .env.example
|   |-- index.html
|   `-- package.json
`-- README.md
```

## Variaveis de ambiente

### Frontend

Crie `frontend/.env` com base em `frontend/.env.example`:

```env
VITE_API_URL=http://localhost:3333
```

Em producao no Netlify:

```env
VITE_API_URL=https://colegiados-mps-api.onrender.com
```

### Backend

Crie `backend/.env` com base em `backend/.env.example`:

```env
PORT=3333
DATABASE_PATH=./src/database/colegiados.sqlite
FRONTEND_URL=http://localhost:5173
GOOGLE_DRIVE_ROOT_FOLDER_ID=
GOOGLE_SERVICE_ACCOUNT_EMAIL=
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY=
GOOGLE_DRIVE_PUBLICATIONS_SUFFIX=_Publicacoes
```

Em producao no Render:

```env
PORT=3333
DATABASE_PATH=/data/colegiados.sqlite
FRONTEND_URL=https://colegiados-mps.netlify.app
GOOGLE_DRIVE_ROOT_FOLDER_ID=id-da-pasta-raiz
GOOGLE_SERVICE_ACCOUNT_EMAIL=seu-service-account@projeto.iam.gserviceaccount.com
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_DRIVE_PUBLICATIONS_SUFFIX=_Publicacoes
```

Se `DATABASE_PATH` nao for definido, o backend usa `./src/database/colegiados.sqlite`.

### Integracao com Google Drive

Para sincronizar automaticamente os CSVs e as pastas de publicacoes:

1. Crie uma `Service Account` no Google Cloud com acesso a `Google Drive API`.
2. Compartilhe a pasta raiz do Drive com o email da service account.
3. Defina `GOOGLE_DRIVE_ROOT_FOLDER_ID` com o ID da pasta raiz.
4. Defina `GOOGLE_SERVICE_ACCOUNT_EMAIL` e `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`.
5. Mantenha a estrutura:

```txt
Pasta raiz
|-- CNPS/
|   |-- CNPS_Membros_29_06_2026.csv
|   |-- CNPS_Reunioes_29_06_2026.csv
|   `-- CNPS_Publicacoes/
`-- CONAPREV/
```

O backend passa a expor:

```txt
GET  /api/importacoes/google-drive/status
POST /api/importacoes/google-drive/sync
```

Na sincronizacao, o sistema:

- percorre as subpastas da pasta raiz;
- importa o CSV mais recente de `Membros` e de `Reunioes` por colegiado;
- atualiza ou cria o registro da pasta `SIGLA_Publicacoes`.

## Rodar localmente

### Backend

```bash
cd backend
npm install
npm run dev
```

O backend inicia na porta `3333`, aplica o schema SQLite automaticamente e habilita CORS para `http://localhost:5173` e para a URL definida em `FRONTEND_URL`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

O frontend inicia via Vite e consome a URL configurada em `VITE_API_URL`.

## Padrao de importacao CSV

Os arquivos devem seguir o formato:

```txt
SIGLA_TIPO_DD_MM_AAAA.csv
```

Exemplos:

```txt
CNPS_Membros_29_06_2026.csv
CNPS_Reunioes_29_06_2026.csv
```

Regras implementadas:

- A data da base e extraida do nome do arquivo.
- O sistema aceita separador `;` ou `,`.
- Arquivos de reunioes vazios com cabecalho sao aceitos.
- Ao importar um novo arquivo de membros ou reunioes para o mesmo colegiado, os dados anteriores desse tipo sao substituidos.
- Toda importacao e registrada na tabela `importacoes`.

## Rotas principais da API

```txt
GET    /api/health
GET    /api/dashboard

GET    /api/colegiados
GET    /api/colegiados/:sigla
POST   /api/colegiados
PUT    /api/colegiados/:id
DELETE /api/colegiados/:id

GET    /api/membros
GET    /api/reunioes

GET    /api/publicacoes
POST   /api/publicacoes
PUT    /api/publicacoes/:id
DELETE /api/publicacoes/:id

GET    /api/importacoes
POST   /api/importacoes/upload
GET    /api/importacoes/google-drive/status
POST   /api/importacoes/google-drive/sync
```

## Publicar backend no Render

1. Crie um novo `Web Service` no Render.
2. Aponte para a pasta `backend`.
3. Configure o build command:

```bash
npm install
```

4. Configure o start command:

```bash
npm start
```

5. Configure as variaveis de ambiente:

```env
PORT=3333
DATABASE_PATH=/data/colegiados.sqlite
FRONTEND_URL=https://url-do-netlify.app
```

6. Adicione um `Persistent Disk` montado em:

```txt
/data
```

Isso garante que o arquivo SQLite nao seja perdido em reinicios ou redeploys.

## Publicar frontend no Netlify

1. Crie um novo site no Netlify.
2. Aponte para a pasta `frontend`.
3. Configure o build command:

```bash
npm run build
```

4. Configure o publish directory:

```txt
dist
```

5. Configure a variavel:

```env
VITE_API_URL=https://url-do-backend-no-render.com
```

## Observacoes de arquitetura

- O frontend React publicado no Netlify consome a API Express publicada no Render.
- O SQLite usa arquivo fisico com caminho configuravel para permitir persistencia real em producao.
- Nao ha tabelas separadas por colegiado. A separacao dos dados ocorre por `sigla_colegiado`.
- A tela de publicacoes trabalha com links de pastas cadastradas no banco, sem depender de CSV nesta primeira versao.

## Scripts

### Backend

```json
{
  "scripts": {
    "dev": "nodemon src/server.js",
    "start": "node src/server.js"
  }
}
```

### Frontend

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  }
}
```
