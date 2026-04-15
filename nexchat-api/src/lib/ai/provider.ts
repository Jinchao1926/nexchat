import { AI_MODEL, AI_PROVIDER, OLLAMA_BASE_URL } from '@/config';

import { createOllamaProvider } from './providers/ollama';

export type AiMessageRole = 'system' | 'user' | 'assistant';

export interface AiChatMessage {
  role: AiMessageRole;
  content: string;
}

export interface AiStreamChunk {
  content: string;
}

export interface AiStreamChatInput {
  model?: string;
  messages: AiChatMessage[];
}

export interface AiProvider {
  name: string;
  defaultModel: string;
  streamChat(input: AiStreamChatInput): AsyncIterable<AiStreamChunk>;
}

export function createAiProvider(): AiProvider {
  if (AI_PROVIDER === 'ollama') {
    return createOllamaProvider({
      baseUrl: OLLAMA_BASE_URL,
      defaultModel: AI_MODEL,
    });
  }

  throw new Error(`Unsupported AI provider: ${AI_PROVIDER}`);
}
