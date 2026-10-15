import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, type UIMessage } from "ai";
import { demoUnavailable, friendlyError, startAiStream } from "@/lib/ai.server";
import { withLovableAiGatewayRunIdHeader } from "@/lib/run-id";

const SYSTEM =
  "You are WorkWise, a friendly, concise workplace productivity assistant. Help with emails, planning, writing, meetings, spreadsheets, communication, and everyday work questions. Use markdown with short paragraphs and bullets when helpful.";

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { messages } = (await request.json()) as { messages: UIMessage[] };
        if (!Array.isArray(messages)) return Response.json({ error: "Invalid request." }, { status: 400 });
        const modelMessages = await convertToModelMessages(messages);
        const result = startAiStream(request, modelMessages, SYSTEM);
        if (!result) return demoUnavailable();
        return result.toUIMessageStreamResponse({
          originalMessages: messages,
          sendReasoning: false,
          onError: friendlyError,
        });
      },
    },
  },
});

void withLovableAiGatewayRunIdHeader;
