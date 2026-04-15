import assert from 'node:assert/strict';
import test from 'node:test';

import { createOllamaProvider } from './ollama';

test('Ollama provider yields streamed content chunks', async () => {
  const body = [
    JSON.stringify({ message: { content: '你' }, done: false }),
    JSON.stringify({ message: { content: '好' }, done: false }),
    JSON.stringify({ done: true }),
  ].join('\n');

  const provider = createOllamaProvider({
    baseUrl: 'http://ollama.test',
    fetch: async () =>
      new Response(body, {
        status: 200,
        headers: { 'content-type': 'application/x-ndjson' },
      }),
  });

  const chunks: string[] = [];
  for await (const chunk of provider.streamChat({
    model: 'qwen2.5:3b',
    messages: [{ role: 'user', content: '你好' }],
  })) {
    chunks.push(chunk.content);
  }

  assert.deepEqual(chunks, ['你', '好']);
});

test('Ollama provider surfaces upstream model-not-found errors', async () => {
  const provider = createOllamaProvider({
    baseUrl: 'http://ollama.test',
    fetch: async () =>
      new Response(JSON.stringify({ error: "model 'qwen2.5:3b' not found" }), {
        status: 404,
        headers: { 'content-type': 'application/json' },
      }),
  });

  await assert.rejects(
    async () => {
      for await (const _chunk of provider.streamChat({
        model: 'qwen2.5:3b',
        messages: [{ role: 'user', content: '你好' }],
      })) {
      }
    },
    /model 'qwen2\.5:3b' not found/
  );
});

test('Ollama provider disables thinking by default', async () => {
  let requestBody = '';

  const provider = createOllamaProvider({
    baseUrl: 'http://ollama.test',
    fetch: async (_input, init) => {
      requestBody = String(init?.body ?? '');

      return new Response(JSON.stringify({ done: true }), {
        status: 200,
        headers: { 'content-type': 'application/x-ndjson' },
      });
    },
  });

  for await (const _chunk of provider.streamChat({
    model: 'qwen3.5:latest',
    messages: [{ role: 'user', content: '你好' }],
  })) {
  }

  assert.equal(JSON.parse(requestBody).think, false);
});
