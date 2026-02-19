import { FastifyInstance } from 'fastify';
import { validateApiKey } from '../middleware/auth.js';
import { query } from '../db/postgres.js';

export async function vendasRoutes(fastify: FastifyInstance) {
  fastify.post('/vendas', { preHandler: validateApiKey }, async (request, reply) => {
    const { data, timestamp, origin } = request.body as any;

    if (!data || !Array.isArray(data)) {
      return reply.status(400).send({ error: 'Invalid data format' });
    }

    fastify.log.info(`📥 Receiving ${data.length} sales from ${origin}`);

    let inserted = 0;
    let updated = 0;
    let errors: any[] = [];

    for (const venda of data) {
      try {
        const result = await query(
          `INSERT INTO vendas (
            venda_id, cliente_id, emissao, hora_emissao, 
            total_bruto, total_liquido, status, tipo_entrega,
            origem, synced_at,
            itens_json, pagamento_json, endereco_json, observacao
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
          ON CONFLICT (venda_id) DO UPDATE SET
            status = EXCLUDED.status,
            total_liquido = EXCLUDED.total_liquido,
            synced_at = EXCLUDED.synced_at,
            itens_json = EXCLUDED.itens_json,
            pagamento_json = EXCLUDED.pagamento_json,
            endereco_json = EXCLUDED.endereco_json,
            observacao = EXCLUDED.observacao`,
          [
            venda.VENDA,
            venda.CLIENTE,
            venda.EMISSAO,
            venda.HORA_EMISSAO,
            venda.TOTAL_BRUTO,
            venda.TOTAL_LIQUIDO,
            venda.STATUS,
            venda.TIPO_ENTREGA,
            origin,
            timestamp, // Se vier null, salva null (Pendente)
            JSON.stringify(venda.itens_json || []),
            JSON.stringify(venda.pagamento_json || []),
            JSON.stringify(venda.endereco_json || {}),
            venda.observacao || ''
          ]
        );

        if (result.rowCount === 1) inserted++;
        else updated++;
      } catch (err: any) {
        fastify.log.error({ err }, `Error inserting sale ${venda.VENDA}`);
        errors.push({ venda: venda.VENDA, error: err.message });
      }
    }

    return {
      success: errors.length === 0,
      total: data.length,
      inserted,
      updated,
      errors
    };
  });

  // Get recent sales
  fastify.get('/vendas', { preHandler: validateApiKey }, async (request, reply) => {
    const { limit = 100 } = request.query as any;

    const result = await query(
      'SELECT * FROM vendas ORDER BY emissao DESC, id DESC LIMIT $1',
      [limit]
    );

    return { sales: result.rows };
  });
}
