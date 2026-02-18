import { FastifyInstance } from 'fastify';
import { validateApiKey } from '../middleware/auth.js';
import { query } from '../db/postgres.js';

export async function syncRoutes(fastify: FastifyInstance) {

  // Rota para baixar pedidos PENDENTES (Cloud -> Local)
  // O Agente local chama isso a cada X segundos
  fastify.get('/orders/pending', { preHandler: validateApiKey }, async (request, reply) => {
    try {
      // Pedidos que não foram sincronizados (synced_at IS NULL)
      // E que vieram da WEB (origem = 'WEB' ou 'CARDAPIO')
      // Limitamos a 50 para não sobrecarregar
      const result = await query(
        `SELECT * FROM vendas 
         WHERE synced_at IS NULL 
         ORDER BY emissao ASC, hora_emissao ASC 
         LIMIT 50`
      );

      return {
        success: true,
        count: result.rowCount,
        orders: result.rows
      };

    } catch (err: any) {
      request.log.error(err);
      return reply.status(500).send({ error: 'Erro ao buscar pedidos pendentes', details: err.message });
    }
  });

  // Rota para confirmar recebimento (ACK)
  // O Agente local chama isso após gravar com sucesso no Firebird
  fastify.post('/orders/:id/ack', { preHandler: validateApiKey }, async (request, reply) => {
    const { id } = request.params as { id: string };

    try {
      // Usamos venda_id (ID da Nuvem/Serial) ou o ID que veio na query?
      // A query anterior retorna 'id' (PK) e 'venda_id' (Serial).
      // Vamos assumir que o parametro :id é o ID (PK UUID/Serial Integer da Nuvem)
      const queryId = String(id);
      const result = await query(
        `UPDATE vendas SET synced_at = NOW() WHERE id = $1 RETURNING id`,
        [queryId]
      );

      if (result.rowCount === 0) {
        return reply.status(404).send({ error: 'Pedido não encontrado para ACK' });
      }

      return { success: true, message: 'Pedido marcado como sincronizado' };

    } catch (err: any) {
      request.log.error(err);
      // Log detalhado para debug
      console.error(`Erro ACK id=${id}:`, err);
      // Se deu erro, tenta converter pra INT se for o caso
      if (err.code === '22P02') { // Invalid text representation for integer
        return reply.status(400).send({ error: 'ID Inválido (deve ser Inteiro?)', details: err.message });
      }
      return reply.status(500).send({ error: 'Erro ao confirmar pedido', details: err.message });
    }
  });
}
