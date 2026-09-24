Guia de Desenvolvimento e Deploy
Instruções para configuração local, gerenciamento via Docker e deploy manual no servidor.

🛠️ Ambiente Local
Primeira Execução
Instale as dependências do projeto:

Bash
npm install
Rodar em Desenvolvimento
Inicie a aplicação localmente:

Bash
npm run dev
Atualizar Repositório
Puxe as alterações mais recentes da branch remota:

Bash
git pull
🐳 Gerenciamento via Docker
Subir Containers
Reconstrói as imagens (web e api) e inicia os serviços em segundo plano:

Bash
sudo docker compose up -d --build
Parar Containers
Para e remove os containers (api, web, db) mantendo o volume do banco (pgdata) intacto:

Bash
sudo docker compose down
Migrations e Banco de Dados
Aplica as migrations pendentes do Prisma:

Bash
sudo docker compose exec api npx prisma migrate deploy
Executa os seeds para popular ou atualizar permissões e dados iniciais:

Bash
sudo docker compose exec api npm run db:seed
🚀 Deploy em Produção (Sem Git)
1. Sincronizar Arquivos com o Servidor
Copia a base de código ignorando dependências, repositório local e artefatos de build:

Bash
rsync -avz \
  --exclude 'node_modules' \
  --exclude '.git' \
  --exclude 'build' \
  --exclude 'dist' \
  --exclude 'apps/api/uploads/*' \
  ./ validasic@192.168.0.52:~/sistema-garagem
2. Acessar o Servidor Remoto
Conecte via SSH e navegue até a pasta do projeto:

Bash
ssh validasic@192.168.0.52
cd ~/sistema-garagem


----- Ativar o PWA nas configuracoes do chrome ------

chrome://flags/#unsafely-treat-insecure-origin-as-secure


http://192.168.0.52:5173
