import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IUser } from 'src/user/interfaces/user.interface';
import { LlmService } from './llm/llm.service';
import { AgentTools } from './tools/agent.tools';

export interface AgentEvent {
  type: 'chunk' | 'toolCall' | 'toolResult' | 'notice' | 'done' | 'error';
  data?: any;
}

export interface AgentRunResult {
  text: string;
  toolCalls: { name: string; arguments: Record<string, any> }[];
}

const SYSTEM_PROMPT = `تو «دستیار هوشمند» داخل یک اپلیکیشن چت هستی و به فارسی پاسخ می‌دهی.

قواعد:
- فقط با ابزارهای موجود به داده‌های کاربر دسترسی دار. هرگز داده از خودت نساز.
- اگر کاربر خلاصه، جستجو یا تحلیل خواست، ابتدا ابزار مربوطه را صدا بزن و بعد بر اساس نتیجه پاسخ بده.
- خلاصه‌ها را کوتاه، ساختاریافته و قابل مفهوم بنویس.
- اگر ابزاری برای درخواست کاربر نداری، صادقانه بگو چه کارهایی می‌توانی بکنی.
- هیچ اطلاعات حساس (کلید، رمز) را نپرس و ذخیره نکن.`;

const NOT_CONFIGURED_MESSAGE =
  'دستیار هوشمند هنوز تنظیم نشده است. برای فعال‌سازی، کلید LLM_API_KEY را در فایل .env بک‌اند قرار دهید (رایگان از Google AI Studio) و سرور را ری‌استارت کنید.';

@Injectable()
export class AgentService {
  private readonly logger = new Logger(AgentService.name);
  private readonly maxIterations: number;

  constructor(
    private readonly llmService: LlmService,
    private readonly agentTools: AgentTools,
    configService: ConfigService,
  ) {
    this.maxIterations = configService.get<number>('agentMaxIterations') ?? 6;
  }

  get isConfigured(): boolean {
    return this.llmService.isConfigured;
  }

  get model(): string {
    return this.llmService.model;
  }

  async run(user: IUser, userMessage: string, onEvent?: (event: AgentEvent) => void, options: { stream?: boolean } = {}): Promise<AgentRunResult> {
    if (!this.llmService.isConfigured) {
      onEvent?.({ type: 'notice', data: { message: NOT_CONFIGURED_MESSAGE } });
      onEvent?.({ type: 'done', data: {} });
      return { text: NOT_CONFIGURED_MESSAGE, toolCalls: [] };
    }

    const tools = this.agentTools.definitions;
    const messages: any[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userMessage },
    ];
    const toolCalls: { name: string; arguments: Record<string, any> }[] = [];

    try {
      for (let iteration = 0; iteration < this.maxIterations; iteration++) {
        let streamedText = '';
        const result = options.stream
          ? await this.llmService.chatStream(messages, tools, (chunk) => {
              streamedText += chunk;
              onEvent?.({ type: 'chunk', data: { chunk } });
            })
          : await this.llmService.chat(messages, tools);

        messages.push(this.assistantMessage(result));

        if (result.toolCalls.length === 0) {
          const text = result.content || streamedText;
          onEvent?.({ type: 'done', data: {} });
          return { text, toolCalls };
        }

        for (const call of result.toolCalls) {
          toolCalls.push({ name: call.name, arguments: call.arguments });
          onEvent?.({
            type: 'toolCall',
            data: { name: call.name, arguments: call.arguments },
          });

          const payload = await this.executeToolSafely(call.name, call.arguments, user);
          onEvent?.({
            type: 'toolResult',
            data: { name: call.name, result: payload },
          });
          messages.push({
            role: 'tool',
            tool_call_id: call.id,
            content: JSON.stringify(payload),
          });
        }
      }

      const fallback = 'برای این درخواست به سقف مجاز فراخوانی ابزار رسیدم. لطفاً درخواست را مشخص‌تر کنید.';
      onEvent?.({ type: 'done', data: {} });
      return { text: fallback, toolCalls };
    } catch (error) {
      const message = (error as Error).message;
      this.logger.error(`Agent run failed: ${message}`);
      onEvent?.({ type: 'error', data: { message } });
      return { text: message, toolCalls };
    }
  }

  private assistantMessage(result: { content: string; toolCalls: { id: string; name: string; arguments: Record<string, any> }[] }) {
    return {
      role: 'assistant',
      content: result.content || null,
      tool_calls: result.toolCalls.map((call) => ({
        id: call.id,
        type: 'function',
        function: {
          name: call.name,
          arguments: JSON.stringify(call.arguments),
        },
      })),
    };
  }

  private async executeToolSafely(name: string, args: Record<string, any>, user: IUser) {
    try {
      return await this.agentTools.execute(name, args, { user });
    } catch (error) {
      return { error: (error as Error).message };
    }
  }
}
