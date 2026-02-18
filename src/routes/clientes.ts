import { FastifyInstance } from 'fastify';
import { validateApiKey } from '../middleware/auth.js';
import { query } from '../db/postgres.js';

export async function clientesRoutes(fastify: FastifyInstance) {
  fastify.post('/clientes', { preHandler: validateApiKey }, async (request, reply) => {
    const { data, timestamp, origin } = request.body as any;

    if (!data || !Array.isArray(data)) {
      return reply.status(400).send({ error: 'Invalid data format' });
    }

    fastify.log.info(`📥 Packet received. Body type: ${typeof request.body}`);
    fastify.log.info(`📥 Body keys: ${Object.keys(request.body as object)}`);

    if (data) {
      fastify.log.info(`📥 Data length: ${Array.isArray(data) ? data.length : 'Not an array'}`);
    } else {
      fastify.log.warn('📥 Data property is missing in body');
      // Log raw body for debugging (be careful with PII in prod, but needed now)
      fastify.log.info({ body: request.body }, 'Raw Body');
    }

    if (!data || !Array.isArray(data)) {
      return reply.status(400).send({ error: 'Invalid data format' });
    }

    fastify.log.info(`📥 Receiving ${data.length} clients from ${origin}`);

    let inserted = 0;

    for (const cliente of data) {
      try {
        await query(
          `INSERT INTO clientes (
            cliente_id, nome, telefone, email, pontos,
            origem, synced_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          ON CONFLICT (cliente_id) DO UPDATE SET
            nome = EXCLUDED.nome,
            telefone = EXCLUDED.telefone,
            email = EXCLUDED.email,
            pontos = EXCLUDED.pontos,
            synced_at = EXCLUDED.synced_at`,
          [
            cliente.CLIENTE,
            cliente.NOME,
            cliente.TELEFONE || cliente.CELULAR,
            cliente.EMAIL,
            Math.floor(Number(cliente.PONTOS || 0)),
            origin,
            timestamp
          ]
        );
        inserted++;
      } catch (err) {
        fastify.log.error({ err }, `Error inserting client ${cliente.CLIENTE}`);
      }
    }

    return { success: true, count: inserted };
  });
}
