export default () => ({
  llmBaseUrl: process.env.LLM_BASE_URL || 'https://generativelanguage.googleapis.com/v1beta/openai/',
  llmApiKey: process.env.LLM_API_KEY || '',
  llmModel: process.env.LLM_MODEL || 'gemini-2.5-flash',
  agentEnabled: process.env.AGENT_ENABLED !== 'false',
  agentMaxIterations: Number(process.env.AGENT_MAX_ITERATIONS ?? 6),
  agentBotPhoneNumber: process.env.AGENT_BOT_PHONE_NUMBER || '09000000000',
});
