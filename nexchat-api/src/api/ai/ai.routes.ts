import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';

import {
  badRequestResponseSchema,
  errorResponseSchema,
  sessionCookieSecurity,
} from '@/docs/common-schemas';
import { requireSession } from '@/middlewares/require-session';

import { streamAiChatHandler } from './ai.handlers';
import { aiChatParamsSchema, streamAiChatBodySchema } from './ai.schemas';

const app = new OpenAPIHono();

const streamAiChatRoute = createRoute({
  method: 'post',
  path: '/stream',
  tags: ['AI'],
  summary: 'Stream an AI assistant response',
  security: sessionCookieSecurity,
  middleware: [requireSession],
  request: {
    params: aiChatParamsSchema,
    body: {
      required: true,
      content: {
        'application/json': {
          schema: streamAiChatBodySchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Server-sent AI response stream',
      content: {
        'text/event-stream': {
          schema: z.string(),
        },
      },
    },
    400: {
      description: 'Invalid AI stream payload',
      content: {
        'application/json': {
          schema: badRequestResponseSchema,
        },
      },
    },
    401: {
      description: 'Unauthorized',
      content: {
        'application/json': {
          schema: errorResponseSchema,
        },
      },
    },
    403: {
      description: 'Forbidden',
      content: {
        'application/json': {
          schema: errorResponseSchema,
        },
      },
    },
    404: {
      description: 'Conversation not found',
      content: {
        'application/json': {
          schema: errorResponseSchema,
        },
      },
    },
  },
});

app.openapi(streamAiChatRoute, streamAiChatHandler);

export default app;
