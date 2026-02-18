import Fastify from 'fastify';
import cors from '@fastify/cors';
import { vendasRoutes } from './routes/vendas.js';
import { produtosRoutes } from './routes/produtos.js';
import { clientesRoutes } from './routes/clientes.js';
import { syncRoutes } from './routes/sync.js';

const fastify = Fastify({
  logger: {
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug'
  }
});

// CORS
await fastify.register(cors, {
  origin: true,
  credentials: true
});

// Health check
fastify.get('/health', async () => ({
  status: 'ok',
  timestamp: new Date(),
  env: process.env.NODE_ENV
}));

// Routes
await fastify.register(vendasRoutes, { prefix: '/api' });
await fastify.register(produtosRoutes, { prefix: '/api' });
await fastify.register(clientesRoutes, { prefix: '/api' });
await fastify.register(syncRoutes, { prefix: '/api' });

// Start server
const PORT = parseInt(process.env.PORT || '3000');
const HOST = process.env.HOST || '0.0.0.0';

try {
  await fastify.listen({ port: PORT, host: HOST });
  console.log(`🚀 Gestor Food Cloud API running on http://${HOST}:${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV}`);
} catch (err) {
  fastify.log.error(err);
  process.exit(1);
}
