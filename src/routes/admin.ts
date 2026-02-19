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
        CREATE TABLE IF NOT EXISTS vendas (
          venda_id INTEGER PRIMARY KEY
        );
        ALTER TABLE vendas ADD COLUMN IF NOT EXISTS cliente_id INTEGER;
        ALTER TABLE vendas ADD COLUMN IF NOT EXISTS emissao DATE;
        ALTER TABLE vendas ADD COLUMN IF NOT EXISTS total_bruto DECIMAL(10,2);
        ALTER TABLE vendas ADD COLUMN IF NOT EXISTS total_liquido DECIMAL(10,2);
        ALTER TABLE vendas ADD COLUMN IF NOT EXISTS status VARCHAR(20);
        ALTER TABLE vendas ADD COLUMN IF NOT EXISTS tipo_entrega VARCHAR(20);
        ALTER TABLE vendas ADD COLUMN IF NOT EXISTS origem VARCHAR(50);
        ALTER TABLE vendas ADD COLUMN IF NOT EXISTS synced_at TIMESTAMP;
        ALTER TABLE vendas ADD COLUMN IF NOT EXISTS itens_json JSONB;
        ALTER TABLE vendas ADD COLUMN IF NOT EXISTS pagamento_json JSONB;
        ALTER TABLE vendas ADD COLUMN IF NOT EXISTS endereco_json JSONB;
        ALTER TABLE vendas ADD COLUMN IF NOT EXISTS observacao TEXT;
      `);

      return { success: true, message: 'Migration applied: All columns verified.' };
    } catch (err: any) {
      fastify.log.error(err);
      return reply.status(500).send({ error: err.message });
    }
  });
}
