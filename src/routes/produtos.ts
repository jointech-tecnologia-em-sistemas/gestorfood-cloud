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
    if (data.length > 0) {
      fastify.log.info({ firstProduct: data[0] }, '🔍 First Product Payload');
    }

    let inserted = 0;
    let errors = 0;

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
            categoria = EXCLUDED.categoria,
            synced_at = EXCLUDED.synced_at`,
          [
            Number(produto.PRODUTO), // Garantir que é número
            produto.DESCRICAO,
            Number(produto.PRECO_VENDA || produto.PRECO || 0), // Tentar PRECO_VENDA ou PRECO
            produto.CARDAPIO === 'S',
            produto.GRUPO_PRODUTO || produto.GRUPO || null, // Failover para nome da coluna
            origin,
            timestamp
          ]
        );
        inserted++;
      } catch (err: any) {
        errors++;
        if (errors <= 5) { // Logar apenas os primeiros 5 erros para não floodar
          fastify.log.error({ err, produtoId: produto.PRODUTO }, `❌ Error inserting product`);
        }
      }
    }

    fastify.log.info(`✅ Processed: ${inserted} inserted, ${errors} errors.`);
    return { success: true, count: inserted, errors };
  });
}
