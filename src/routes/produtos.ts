import { FastifyInstance } from 'fastify';
import { validateApiKey } from '../middleware/auth.js';
import { query } from '../db/postgres.js';

export async function produtosRoutes(fastify: FastifyInstance) {
  fastify.post('/produtos', { preHandler: validateApiKey }, async (request, reply) => {
    const { data, timestamp, origin } = request.body as any;

    if (!data || !Array.isArray(data)) {
      return reply.status(400).send({ error: 'Invalid data format' });
    }

    fastify.log.info(`📥 Receiving ${data.length} products from ${origin}`);

    let inserted = 0;

    for (const produto of data) {
      try {
        await query(
          `INSERT INTO produtos (
            produto_id, descricao, preco, ativo, categoria,
            origem, synced_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          ON CONFLICT (produto_id) DO UPDATE SET
            descricao = EXCLUDED.descricao,
            preco = EXCLUDED.preco,
            ativo = EXCLUDED.ativo,
            synced_at = EXCLUDED.synced_at`,
          [
            produto.PRODUTO,
            produto.DESCRICAO,
            produto.PRECO,
            produto.CARDAPIO === 'S',
            produto.GRUPO,
            origin,
            timestamp
          ]
        );
        inserted++;
      } catch (err) {
        fastify.log.error({ err }, `Error inserting product ${produto.PRODUTO}`);
      }
    }

    return { success: true, count: inserted };
  });
}
