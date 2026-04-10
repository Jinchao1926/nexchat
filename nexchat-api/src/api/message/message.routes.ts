import { createRoute, OpenAPIHono } from '@hono/zod-openapi';

import {
  badRequestResponseSchema,
  errorResponseSchema,
  okMessageResponseSchema,
  sessionCookieSecurity,
} from '@/docs/common-schemas';
import { requireSession } from '@/middlewares/require-session';

import {
  conversationIdParamsSchema,
  conversationMessageParamsSchema,
  createMessageBodySchema,
  updateMessageBodySchema,
} from './message.schemas';
import {
  messageSingleResponseSchema,
  messagesListResponseSchema,
} from './message.responses';
import {
  createMessageHandler,
  deleteMessageHandler,
  getMessageHandler,
  listMessagesHandler,
  updateMessageHandler,
} from './message.handlers';

const app = new OpenAPIHono();

const listMessagesRoute = createRoute({
  method: 'get',
  path: '/',
  tags: ['Messages'],
  summary: 'List messages',
  security: sessionCookieSecurity,
  middleware: [requireSession],
  request: {
    params: conversationIdParamsSchema,
  },
  responses: {
    200: {
      description: 'Messages in the conversation',
      content: {
        'application/json': {
          schema: messagesListResponseSchema,
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

const getMessageRoute = createRoute({
  method: 'get',
  path: '/{messageId}',
  tags: ['Messages'],
  summary: 'Get a message',
  security: sessionCookieSecurity,
  middleware: [requireSession],
  request: {
    params: conversationMessageParamsSchema,
  },
  responses: {
    200: {
      description: 'Message',
      content: {
        'application/json': {
          schema: messageSingleResponseSchema,
        },
      },
    },
    400: {
      description: 'Invalid message id',
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
      description: 'Conversation or message not found',
      content: {
        'application/json': {
          schema: errorResponseSchema,
        },
      },
    },
  },
});

const createMessageRoute = createRoute({
  method: 'post',
  path: '/',
  tags: ['Messages'],
  summary: 'Create a message',
  security: sessionCookieSecurity,
  middleware: [requireSession],
  request: {
    params: conversationIdParamsSchema,
    body: {
      required: true,
      content: {
        'application/json': {
          schema: createMessageBodySchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Created message',
      content: {
        'application/json': {
          schema: messageSingleResponseSchema,
        },
      },
    },
    400: {
      description: 'Invalid message payload',
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

const updateMessageRoute = createRoute({
  method: 'patch',
  path: '/{messageId}',
  tags: ['Messages'],
  summary: 'Update a message',
  security: sessionCookieSecurity,
  middleware: [requireSession],
  request: {
    params: conversationMessageParamsSchema,
    body: {
      required: true,
      content: {
        'application/json': {
          schema: updateMessageBodySchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Updated message',
      content: {
        'application/json': {
          schema: messageSingleResponseSchema,
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
      description: 'Conversation or message not found',
      content: {
        'application/json': {
          schema: errorResponseSchema,
        },
      },
    },
  },
});

const deleteMessageRoute = createRoute({
  method: 'delete',
  path: '/{messageId}',
  tags: ['Messages'],
  summary: 'Delete a message',
  security: sessionCookieSecurity,
  middleware: [requireSession],
  request: {
    params: conversationMessageParamsSchema,
  },
  responses: {
    200: {
      description: 'Deleted message',
      content: {
        'application/json': {
          schema: okMessageResponseSchema,
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
      description: 'Conversation or message not found',
      content: {
        'application/json': {
          schema: errorResponseSchema,
        },
      },
    },
  },
});

app.openapi(listMessagesRoute, listMessagesHandler);
app.openapi(getMessageRoute, getMessageHandler);
app.openapi(createMessageRoute, createMessageHandler);
app.openapi(updateMessageRoute, updateMessageHandler);
app.openapi(deleteMessageRoute, deleteMessageHandler);

export default app;
