import type { AiProvider, AiStreamChatInput, AiStreamChunk } from '../provider';

type Fetch = typeof globalThis.fetch;

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

export function createOllamaProvider(
  options: OllamaProviderOptions
): AiProvider {
  const fetchImpl = options.fetch ?? globalThis.fetch;

  return {
    name: 'ollama',
    defaultModel: options.defaultModel ?? 'qwen2.5:3b',
    async *streamChat(input: AiStreamChatInput): AsyncIterable<AiStreamChunk> {
      const response = await fetchImpl(`${options.baseUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: input.model ?? options.defaultModel ?? 'qwen2.5:3b',
          messages: input.messages,
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

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      try {
        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            break;
          }

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';

          for (const line of lines) {
            const parsed = parseOllamaLine(line);

            if (!parsed || parsed.done) {
              continue;
            }

            if (parsed.error) {
              throw new Error(parsed.error);
            }

            if (parsed.message?.content) {
              yield { content: parsed.message.content };
            }
          }
        }

        const tail = parseOllamaLine(buffer);
        if (tail?.error) {
          throw new Error(tail.error);
        }
        if (tail?.message?.content) {
          yield { content: tail.message.content };
        }
      } catch (error) {
        throw new Error(`Ollama stream failed: ${getErrorMessage(error)}`);
      }
    },
  };
}
