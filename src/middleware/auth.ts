import { FastifyRequest, FastifyReply } from 'fastify';

export async function validateApiKey(request: FastifyRequest, reply: FastifyReply) {
  const apiKey = request.headers.authorization?.replace('Bearer ', '');

  if (!apiKey || apiKey !== process.env.CLOUD_API_KEY) {
    return reply.status(401).send({
      error: 'Unauthorized',
      message: 'Invalid or missing API key'
    });
  }
}
