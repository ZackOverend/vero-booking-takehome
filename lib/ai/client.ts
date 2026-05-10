import { createOpenAI } from "@ai-sdk/openai";

export function getOllamaClient() {
  const apiKey = process.env.OLLAMA_API_KEY;
  if (!apiKey) throw new Error("OLLAMA_API_KEY is not set");

  return createOpenAI({
    baseURL: "https://ollama.com/v1",
    apiKey,
  });
}

export const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? "gemma4:31b";
