import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface LlmToolCall {
  id: string;
  name: string;
  arguments: Record<string, any>;
}

export interface LlmChatResult {
  content: string;
  toolCalls: LlmToolCall[];
}

export interface LlmToolDefinition {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: Record<string, any>;
  };
}

interface ChatCompletionResponse {
  choices?: {
    message?: {
      content?: string | null;
      tool_calls?: {
        id: string;
        type: string;
        function: { name: string; arguments: string };
      }[];
    };
    finish_reason?: string;
  }[];
}

@Injectable()
export class LlmService {
  private readonly logger = new Logger(LlmService.name);

  constructor(private readonly configService: ConfigService) {}

  get isConfigured(): boolean {
    return !!this.configService.get<string>('llmApiKey');
  }

  get model(): string {
    return this.configService.get<string>('llmModel') as string;
  }

  async chat(messages: any[], tools: LlmToolDefinition[] = []): Promise<LlmChatResult> {
    this.assertConfigured();

    const body: Record<string, any> = {
      model: this.model,
      messages,
      temperature: 0.3,
    };
    if (tools.length > 0) {
      body.tools = tools;
      body.tool_choice = 'auto';
    }

    const response = await this.request('/chat/completions', body);
    const message = response.choices?.[0]?.message;

    const toolCalls: LlmToolCall[] = (message?.tool_calls ?? []).map((call) => {
      let args: Record<string, any> = {};
      try {
        args = JSON.parse(call.function.arguments || '{}');
      } catch {
        this.logger.warn(`Failed to parse tool arguments for ${call.function.name}`);
      }
      return { id: call.id, name: call.function.name, arguments: args };
    });

    return { content: message?.content ?? '', toolCalls };
  }

  async chatStream(messages: any[], tools: LlmToolDefinition[], onChunk: (chunk: string) => void): Promise<LlmChatResult> {
    this.assertConfigured();

    const body: Record<string, any> = {
      model: this.model,
      messages,
      temperature: 0.3,
      stream: true,
    };
    if (tools.length > 0) {
      body.tools = tools;
      body.tool_choice = 'auto';
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 120_000);
    try {
      const res = await fetch(this.endpoint('/chat/completions'), {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) {
        throw new Error(await this.readError(res));
      }

      let content = '';
      const toolCalls = new Map<number, LlmToolCall>();

      const decoder = new TextDecoder();
      let buffer = '';
      for await (const value of res.body as any) {
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data:')) continue;
          const payload = trimmed.slice(5).trim();
          if (!payload || payload === '[DONE]') continue;

          try {
            const json = JSON.parse(payload);
            const delta = json.choices?.[0]?.delta;
            if (delta?.content) {
              content += delta.content;
              onChunk(delta.content);
            }
            for (const call of delta?.tool_calls ?? []) {
              const index = call.index ?? 0;
              const existing = toolCalls.get(index) ?? {
                id: call.id ?? '',
                name: '',
                arguments: {},
              };
              if (call.id) existing.id = call.id;
              if (call.function?.name) existing.name = call.function.name;
              if (call.function?.arguments) {
                existing.arguments = this.appendArguments(existing.arguments, call.function.arguments);
              }
              toolCalls.set(index, existing);
            }
          } catch {
            // ignore malformed keep-alive lines
          }
        }
      }

      return {
        content,
        toolCalls: [...toolCalls.values()].filter((call) => !!call.name),
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  private appendArguments(current: Record<string, any>, fragment: string): Record<string, any> {
    const raw = (current as any).__raw ?? '';
    const merged = raw + fragment;
    try {
      const parsed = JSON.parse(merged);
      return parsed;
    } catch {
      return { __raw: merged } as any;
    }
  }

  private async request(path: string, body: Record<string, any>): Promise<ChatCompletionResponse> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 120_000);
    try {
      const res = await fetch(this.endpoint(path), {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      if (!res.ok) {
        throw new Error(await this.readError(res));
      }
      return (await res.json()) as ChatCompletionResponse;
    } finally {
      clearTimeout(timeout);
    }
  }

  private async readError(res: Response): Promise<string> {
    const text = await res.text().catch(() => '');
    if (res.status === 401 || res.status === 403) {
      return `LLM authentication failed (${res.status}). Check LLM_API_KEY.`;
    }
    if (res.status === 429) {
      return 'LLM rate limit reached. Please retry in a few seconds.';
    }
    return `LLM request failed (${res.status}): ${text.slice(0, 300)}`;
  }

  private headers(): Record<string, string> {
    return {
      'content-type': 'application/json',
      authorization: `Bearer ${this.configService.get<string>('llmApiKey')}`,
    };
  }

  private endpoint(path: string): string {
    const base = this.configService.get<string>('llmBaseUrl') as string;
    return `${base.replace(/\/+$/, '')}${path}`;
  }

  private assertConfigured(): void {
    if (!this.isConfigured) {
      throw new Error('LLM is not configured. Set LLM_API_KEY in the backend .env file.');
    }
  }
}
