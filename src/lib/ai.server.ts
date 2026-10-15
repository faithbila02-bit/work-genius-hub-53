import { createOpenAI } from "@ai-sdk/openai";
import { streamText, type ModelMessage } from "ai";
import { createLovableAiGatewayRunIdFetch, getLovableAiGatewayRunId } from "./run-id";

export const MODEL = "openai/gpt-6-astra";
const BASE = "https://ai.gateway.lovable.dev/v1";

export function startAiStream(request: Request, messages: ModelMessage[], instructions: string) {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) return null;
  const runIdFetch = createLovableAiGatewayRunIdFetch(getLovableAiGatewayRunId(request));
  const provider = createOpenAI({
    baseURL: BASE,
    apiKey,
    headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    fetch: runIdFetch.fetch,
  });
  return streamText({
    model: provider.responses(MODEL),
    instructions,
    messages,
    abortSignal: request.signal,
    maxRetries: 0,
    providerOptions: {
      openai: {
        store: false,
        forceReasoning: true,
        reasoningEffort: "low",
        reasoningSummary: "auto",
        include: ["reasoning.encrypted_content"],
      },
    },
  });
}

export function friendlyError(error: unknown): string {
  const e = error as { statusCode?: number; message?: string };
  const code = e?.statusCode;
  if (code === 402) return "AI credits are used up for this workspace. Please add credits to continue.";
  if (code === 429) return "Too many requests right now. Please wait a moment and try again.";
  if (code === 401) return "The AI service isn't configured correctly.";
  if (code === 403) return "The AI service declined this request.";
  return e?.message ? `AI request failed: ${e.message}` : "Something went wrong with the AI request.";
}

export function demoUnavailable() {
  return new Response(JSON.stringify({ demo: true, error: "AI credentials unavailable" }), {
    status: 503,
    headers: { "Content-Type": "application/json" },
  });
}
