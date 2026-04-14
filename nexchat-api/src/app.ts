import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import { apiReference } from '@scalar/hono-api-reference';
import { cors } from 'hono/cors';

import conversationRoutes from '@/api/conversation';
import {
  API_PREFIX,
  APP_BASE_URL,
  AUTH_PREFIX,
  WEB_APP_ORIGIN,
} from '@/config';
import { auth } from '@/lib/auth';

const app = new OpenAPIHono();

type AuthDocument = Awaited<ReturnType<typeof auth.api.generateOpenAPISchema>>;
type OpenApiTag = { name: string; description?: string };

const OPENAPI_INFO = {
  title: 'NexChat API',
  version: '1.0.0',
  description: 'HTTP API for NexChat auth, conversations, and messages.',
};

const OPENAPI_SERVERS = [
  {
    url: APP_BASE_URL,
    description: 'Local development server',
  },
];

const OPENAPI_TAGS: OpenApiTag[] = [
  { name: 'Health' },
  { name: 'Auth' },
  { name: 'Conversations' },
  { name: 'Messages' },
];

const OPENAPI_SECURITY_SCHEMES = {
  sessionCookie: {
    type: 'apiKey' as const,
    in: 'cookie' as const,
    name: 'better-auth.session_token',
    description: 'Better Auth session cookie.',
  },
};

const AUTH_CORS_CONFIG = {
  origin: WEB_APP_ORIGIN,
  allowMethods: ['GET', 'POST', 'OPTIONS'],
  allowHeaders: ['Content-Type'],
  credentials: true,
};

function normalizeAuthDocument(authDocument: AuthDocument): AuthDocument {
  const normalizedPaths = Object.fromEntries(
    Object.entries(authDocument.paths ?? {}).map(([path, pathItem]) => [
      path.startsWith(AUTH_PREFIX) ? path : `${AUTH_PREFIX}${path}`,
      Object.fromEntries(
        Object.entries(pathItem ?? {}).map(([method, operation]) => [
          method,
          operation && typeof operation === 'object'
            ? {
                ...operation,
                tags: ['Auth'],
              }
            : operation,
        ])
      ),
    ])
  );

  return {
    ...authDocument,
    tags: [{ name: 'Auth', description: 'Authentication endpoints.' }],
    paths: normalizedPaths,
  };
}

function dedupeTags(tags: OpenApiTag[]) {
  return Array.from(
    tags.reduce((map, tag) => {
      if (!map.has(tag.name)) {
        map.set(tag.name, tag);
      }

      return map;
    }, new Map<string, { name: string; description?: string }>())
  ).map(([, tag]) => tag);
}

function createBaseOpenApiDocument() {
  return app.getOpenAPI31Document({
    openapi: '3.1.0',
    info: OPENAPI_INFO,
    servers: OPENAPI_SERVERS,
    tags: OPENAPI_TAGS,
    components: {
      securitySchemes: OPENAPI_SECURITY_SCHEMES,
    },
  } as any);
}

function mergeOpenApiDocuments(
  appDocument: ReturnType<typeof createBaseOpenApiDocument>,
  authDocument: AuthDocument
) {
  return {
    ...appDocument,
    openapi: '3.1.0',
    info: {
      ...appDocument.info,
      description: OPENAPI_INFO.description,
    },
    tags: dedupeTags([
      ...(appDocument.tags ?? []),
      ...((authDocument.tags ?? []) as OpenApiTag[]),
    ]),
    paths: {
      ...(authDocument.paths ?? {}),
      ...(appDocument.paths ?? {}),
    },
    components: {
      ...(authDocument.components ?? {}),
      ...(appDocument.components ?? {}),
      schemas: {
        ...(authDocument.components?.schemas ?? {}),
        ...(appDocument.components?.schemas ?? {}),
      },
      securitySchemes: {
        ...(authDocument.components?.securitySchemes ?? {}),
        ...(appDocument.components?.securitySchemes ?? {}),
      },
    },
  };
}

const rootRoute = createRoute({
  method: 'get',
  path: '/',
  tags: ['Health'],
  summary: 'Health check',
  responses: {
    200: {
      description: 'Service greeting',
      content: {
        'text/plain': {
          schema: z.string(),
        },
      },
    },
  },
});

app.get('/openapi.json', async (c) => {
  const appDocument = createBaseOpenApiDocument();
  const authDocument = normalizeAuthDocument(
    await auth.api.generateOpenAPISchema()
  );

  return c.json(mergeOpenApiDocuments(appDocument, authDocument));
});

app.get(
  '/docs',
  apiReference({
    pageTitle: 'NexChat API Docs',
    url: '/openapi.json',
  })
);

app.use(`${API_PREFIX}/*`, cors(AUTH_CORS_CONFIG));

app.on(['POST', 'GET', 'OPTIONS'], `${AUTH_PREFIX}/*`, (c) =>
  auth.handler(c.req.raw)
);

app.route(`${API_PREFIX}/conversations`, conversationRoutes);

app.openapi(rootRoute, (c) => c.text('Hello from NexChat!', 200));

export default app;
