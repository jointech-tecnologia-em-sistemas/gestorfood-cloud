import { FastifyInstance } from 'fastify';
import { query } from '../db/postgres.js';

export async function adminRoutes(fastify: FastifyInstance) {
  fastify.post('/admin/migrate', async (request, reply) => {
    const adminKey = process.env.ADMIN_KEY || 'admin123';
    const authHeader = request.headers['x-admin-key'];

    if (authHeader !== adminKey) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }

    try {
      await query(`
        ALTER TABLE vendas ADD COLUMN IF NOT EXISTS itens_json JSONB;
        ALTER TABLE vendas ADD COLUMN IF NOT EXISTS pagamento_json JSONB;
        ALTER TABLE vendas ADD COLUMN IF NOT EXISTS endereco_json JSONB;
        ALTER TABLE vendas ADD COLUMN IF NOT EXISTS observacao TEXT;
      `);

      return { success: true, message: 'Migration applied: JSON columns added.' };
    } catch (err: any) {
      fastify.log.error(err);
      return reply.status(500).send({ error: err.message });
    }
  });
}
