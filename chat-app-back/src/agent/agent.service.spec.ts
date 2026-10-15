import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AgentService } from './agent.service';
import { LlmService } from './llm/llm.service';
import { AgentTools } from './tools/agent.tools';

describe('AgentService', () => {
  const user: any = { _id: 'user-1', phoneNumber: '09120000001' };

  const buildModule = (llm: any, tools: any, maxIterations = 6) =>
    Test.createTestingModule({
      providers: [
        AgentService,
        { provide: LlmService, useValue: llm },
        { provide: AgentTools, useValue: tools },
        {
          provide: ConfigService,
          useValue: { get: (key: string) => (key === 'agentMaxIterations' ? maxIterations : null) },
        },
      ],
    }).compile();

  it('returns a setup notice when the LLM is not configured', async () => {
    const moduleRef = await buildModule({ isConfigured: false, chat: jest.fn(), chatStream: jest.fn() }, { definitions: [], execute: jest.fn() });
    const service = moduleRef.get(AgentService);
    const events: string[] = [];

    const result = await service.run(user, 'سلام', (event) => events.push(event.type));

    expect(result.text).toContain('LLM_API_KEY');
    expect(events).toEqual(['notice', 'done']);
  });

  it('answers directly when no tool is requested', async () => {
    const llm = {
      isConfigured: true,
      model: 'test-model',
      chat: jest.fn().mockResolvedValue({ content: 'سلام! چطور کمکت کنم؟', toolCalls: [] }),
      chatStream: jest.fn(),
    };
    const moduleRef = await buildModule(llm, { definitions: [], execute: jest.fn() });
    const service = moduleRef.get(AgentService);

    const result = await service.run(user, 'سلام');

    expect(result.text).toBe('سلام! چطور کمکت کنم؟');
    expect(result.toolCalls).toEqual([]);
  });

  it('executes tools and feeds results back until a final answer', async () => {
    const llm = {
      isConfigured: true,
      model: 'test-model',
      chat: jest
        .fn()
        .mockResolvedValueOnce({
          content: '',
          toolCalls: [{ id: 'call-1', name: 'get_chat_list', arguments: {} }],
        })
        .mockResolvedValueOnce({
          content: 'یک گفتگو با علی داری.',
          toolCalls: [],
        }),
      chatStream: jest.fn(),
    };
    const tools = {
      definitions: [{ type: 'function' }],
      execute: jest.fn().mockResolvedValue([{ name: 'ali', lastMessage: 'سلام' }]),
    };
    const moduleRef = await buildModule(llm, tools);
    const service = moduleRef.get(AgentService);
    const events: string[] = [];

    const result = await service.run(user, 'چت‌هایم را بگو', (event) => events.push(event.type));

    expect(tools.execute).toHaveBeenCalledWith('get_chat_list', {}, { user });
    expect(llm.chat).toHaveBeenCalledTimes(2);
    // jest keeps a reference to the messages array, so assert on the tool message by role
    const secondCallMessages = llm.chat.mock.calls[1][0];
    const toolMessage = secondCallMessages.find((m: any) => m.role === 'tool');
    expect(toolMessage).toEqual({
      role: 'tool',
      tool_call_id: 'call-1',
      content: JSON.stringify([{ name: 'ali', lastMessage: 'سلام' }]),
    });
    expect(result.text).toBe('یک گفتگو با علی داری.');
    expect(result.toolCalls).toEqual([{ name: 'get_chat_list', arguments: {} }]);
    expect(events).toEqual(['toolCall', 'toolResult', 'done']);
  });

  it('keeps tool failures inside the loop as tool results', async () => {
    const llm = {
      isConfigured: true,
      model: 'test-model',
      chat: jest
        .fn()
        .mockResolvedValueOnce({
          content: '',
          toolCalls: [{ id: 'c1', name: 'search_messages', arguments: { query: 'x' } }],
        })
        .mockResolvedValueOnce({ content: 'نتیجه‌ای نبود.', toolCalls: [] }),
      chatStream: jest.fn(),
    };
    const tools = {
      definitions: [],
      execute: jest.fn().mockRejectedValue(new Error('db down')),
    };
    const moduleRef = await buildModule(llm, tools);
    const service = moduleRef.get(AgentService);

    const result = await service.run(user, 'جستجو کن');

    expect(result.text).toBe('نتیجه‌ای نبود.');
    const toolMessage = llm.chat.mock.calls[1][0].find((m: any) => m.role === 'tool');
    expect(JSON.parse(toolMessage.content)).toEqual({ error: 'db down' });
  });

  it('stops after the configured iteration cap', async () => {
    const llm = {
      isConfigured: true,
      model: 'test-model',
      chat: jest.fn().mockResolvedValue({
        content: '',
        toolCalls: [{ id: 'x', name: 'get_chat_list', arguments: {} }],
      }),
      chatStream: jest.fn(),
    };
    const tools = { definitions: [], execute: jest.fn().mockResolvedValue([]) };
    const moduleRef = await buildModule(llm, tools, 3);
    const service = moduleRef.get(AgentService);

    const result = await service.run(user, 'loop');

    expect(llm.chat).toHaveBeenCalledTimes(3);
    expect(result.text).toContain('سقف مجاز');
  });

  it('reports LLM errors instead of throwing', async () => {
    const llm = {
      isConfigured: true,
      model: 'test-model',
      chat: jest.fn().mockRejectedValue(new Error('LLM rate limit reached.')),
      chatStream: jest.fn(),
    };
    const moduleRef = await buildModule(llm, { definitions: [], execute: jest.fn() });
    const service = moduleRef.get(AgentService);
    const events: string[] = [];

    const result = await service.run(user, 'سلام', (event) => events.push(event.type));

    expect(result.text).toBe('LLM rate limit reached.');
    expect(events).toEqual(['error']);
  });

  it('streams chunks when stream option is enabled', async () => {
    const llm = {
      isConfigured: true,
      model: 'test-model',
      chat: jest.fn(),
      chatStream: jest.fn(async (_messages, _tools, onChunk) => {
        onChunk('سla');
        onChunk('ام');
        return { content: 'سلام', toolCalls: [] };
      }),
    };
    const moduleRef = await buildModule(llm, { definitions: [], execute: jest.fn() });
    const service = moduleRef.get(AgentService);
    const chunks: string[] = [];

    const result = await service.run(
      user,
      'سلام',
      (event) => {
        if (event.type === 'chunk') chunks.push(event.data.chunk);
      },
      { stream: true },
    );

    expect(chunks).toEqual(['سla', 'ام']);
    expect(result.text).toBe('سلام');
  });
});
