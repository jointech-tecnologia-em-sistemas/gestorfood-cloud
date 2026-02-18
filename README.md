# Gestor Food Cloud API

Cloud API para receber dados sincronizados do Gestor Food local via Sync Agent.

## 🚀 Deploy no Railway

1. Conecte este repositório ao Railway
2. Adicione PostgreSQL ao projeto
3. Configure variáveis de ambiente:
   - `CLOUD_API_KEY`: Chave secreta para autenticação
   - `NODE_ENV`: production
4. Deploy automático!

## 📊 Endpoints

- `GET /health` - Health check
- `POST /api/vendas` - Receber vendas
- `POST /api/produtos` - Receber produtos
- `POST /api/clientes` - Receber clientes

## 🔐 Autenticação

Todas as rotas `/api/*` requerem header:
```
Authorization: Bearer YOUR_API_KEY
```

## 🗄️ Database Schema

Execute no PostgreSQL do Railway ou veja a documentação do projeto.
