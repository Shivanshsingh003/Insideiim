import { ChatOpenAI } from '@langchain/openai';

export function getModel() {
  const apiKey = process.env.OPENAI_API_KEY;
  const modelName = process.env.OPENAI_MODEL_NAME || 'gpt-4o-mini';
  
  if (!apiKey) {
    console.warn("WARNING: OPENAI_API_KEY is not defined. LLM execution will fail unless mocked or configured otherwise.");
  }
  
  return new ChatOpenAI({
    openAIApiKey: apiKey,
    modelName: modelName,
    temperature: 0.2, // low temperature for analytical consistency
    configuration: {
      baseURL: process.env.OPENAI_API_BASE,
    },
  });
}
