import { OpenAPIHono, createRoute } from '@hono/zod-openapi';

import messageRoutes from '@/api/message';
import {
  badRequestResponseSchema,
  errorResponseSchema,
  okMessageResponseSchema,
  sessionCookieSecurity,
} from '@/docs/common-schemas';
import { requireSession } from '@/middlewares/require-session';

import {
  createConversationHandler,
  deleteConversationHandler,
  getConversationHandler,
  listConversationsHandler,
  updateConversationHandler,
} from './conversation.handlers';
import {
  conversationSingleResponseSchema,
  conversationsListResponseSchema,
} from './conversation.responses';
import {
  conversationIdParamsSchema,
  createConversationBodySchema,
  updateConversationBodySchema,
} from './conversation.schemas';

const app = new OpenAPIHono();

const listConversationsRoute = createRoute({
  method: 'get',
  path: '/',
  tags: ['Conversations'],
  summary: 'List conversations',
  security: sessionCookieSecurity,
  middleware: [requireSession],
  responses: {
    200: {
      description: 'Conversations for the signed-in user',
      content: {
        'application/json': {
          schema: conversationsListResponseSchema,
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
  },
});

const getConversationRoute = createRoute({
  method: 'get',
  path: '/{id}',
  tags: ['Conversations'],
  summary: 'Get a conversation',
  security: sessionCookieSecurity,
  middleware: [requireSession],
  request: {
    params: conversationIdParamsSchema,
  },
  responses: {
    200: {
      description: 'Conversation',
      content: {
        'application/json': {
          schema: conversationSingleResponseSchema,
        },
      },
    },
    400: {
      description: 'Invalid conversation id',
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

const createConversationRoute = createRoute({
  method: 'post',
  path: '/',
  tags: ['Conversations'],
  summary: 'Create a conversation',
  security: sessionCookieSecurity,
  middleware: [requireSession],
  request: {
    body: {
      required: true,
      content: {
        'application/json': {
          schema: createConversationBodySchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Created conversation',
      content: {
        'application/json': {
          schema: conversationSingleResponseSchema,
        },
      },
    },
    400: {
      description: 'Invalid conversation payload',
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
  },
});

const updateConversationRoute = createRoute({
  method: 'patch',
  path: '/{id}',
  tags: ['Conversations'],
  summary: 'Update a conversation',
  security: sessionCookieSecurity,
  middleware: [requireSession],
  request: {
    params: conversationIdParamsSchema,
    body: {
      required: true,
      content: {
        'application/json': {
          schema: updateConversationBodySchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Updated conversation',
      content: {
        'application/json': {
          schema: conversationSingleResponseSchema,
        },
      },
    },
    400: {
      description: 'Invalid request',
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

const deleteConversationRoute = createRoute({
  method: 'delete',
  path: '/{id}',
  tags: ['Conversations'],
  summary: 'Delete a conversation',
  security: sessionCookieSecurity,
  middleware: [requireSession],
  request: {
    params: conversationIdParamsSchema,
  },
  responses: {
    200: {
      description: 'Deleted conversation',
      content: {
        'application/json': {
          schema: okMessageResponseSchema,
        },
      },
    },
    400: {
      description: 'Invalid conversation id',
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

app.route('/:id/messages', messageRoutes);
app.openapi(listConversationsRoute, listConversationsHandler);
app.openapi(getConversationRoute, getConversationHandler);
app.openapi(createConversationRoute, createConversationHandler);
app.openapi(updateConversationRoute, updateConversationHandler);
app.openapi(deleteConversationRoute, deleteConversationHandler);

export default app;
