import type { AiProvider, AiStreamChatInput, AiStreamChunk } from '../provider';

type Fetch = typeof globalThis.fetch;
const DEFAULT_OLLAMA_MODEL = 'qwen2.5:3b';

interface OllamaProviderOptions {
  baseUrl: string;
  defaultModel?: string;
  fetch?: Fetch;
}

interface OllamaStreamLine {
  message?: {
    content?: string;
  };
  done?: boolean;
  error?: string;
}

function getErrorMessage(value: unknown) {
  return value instanceof Error ? value.message : String(value);
}

function parseOllamaLine(line: string): OllamaStreamLine | null {
  if (!line.trim()) {
    return null;
  }

  try {
    return JSON.parse(line) as OllamaStreamLine;
  } catch {
    return null;
  }
}

async function getOllamaHttpError(response: Response) {
  const fallback = `Ollama request failed: ${response.status}`;

  try {
    const text = await response.text();
    if (!text.trim()) {
      return fallback;
    }

    const parsed = JSON.parse(text) as { error?: string };
    if (parsed.error?.trim()) {
      return parsed.error;
    }

    return `${fallback} - ${text}`;
  } catch {
    return fallback;
  }
}

function getOllamaChunk(line: string): AiStreamChunk | null {
  const parsed = parseOllamaLine(line);

  if (!parsed || parsed.done) {
    return null;
  }

  if (parsed.error) {
    throw new Error(parsed.error);
  }

  const content = parsed.message?.content;
  return content ? { content } : null;
}

async function* streamOllamaResponse(
  body: ReadableStream<Uint8Array>
): AsyncIterable<AiStreamChunk> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  function* flushBuffer(flushTail = false): Generator<AiStreamChunk> {
    const lines = buffer.split('\n');
    buffer = flushTail ? '' : (lines.pop() ?? '');

    for (const line of lines) {
      const chunk = getOllamaChunk(line);
      if (chunk) {
        yield chunk;
      }
    }
  }

  while (true) {
    const { done, value } = await reader.read();

    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    yield* flushBuffer();
  }

  buffer += decoder.decode();
  yield* flushBuffer(true);
}

export function createOllamaProvider(
  options: OllamaProviderOptions
): AiProvider {
  const fetchImpl = options.fetch ?? globalThis.fetch;
  const defaultModel = options.defaultModel ?? DEFAULT_OLLAMA_MODEL;

  return {
    name: 'ollama',
    defaultModel,
    async *streamChat(input: AiStreamChatInput): AsyncIterable<AiStreamChunk> {
      const response = await fetchImpl(`${options.baseUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: input.model ?? defaultModel,
          messages: input.messages,
          temperature: 0.7,
          stream: true,
          think: false,
        }),
      });

      if (!response.ok) {
        throw new Error(await getOllamaHttpError(response));
      }

      if (!response.body) {
        throw new Error('Ollama response body is empty');
      }

      try {
        for await (const chunk of streamOllamaResponse(response.body)) {
          yield chunk;
        }
      } catch (error) {
        throw new Error(`Ollama stream failed: ${getErrorMessage(error)}`);
      }
    },
  };
}
