import { createFileRoute } from "@tanstack/react-router";
import { demoUnavailable, friendlyError, startAiStream } from "@/lib/ai.server";

const INSTRUCTIONS: Record<string, string> = {
  email:
    "You are an expert business writer. Write a complete, ready-to-send email in the requested tone. Start with 'Subject: ...' on the first line, then a blank line, then the email body with greeting and sign-off. Use plain text, no markdown headings.",
  meeting:
    "You summarize meeting notes for busy professionals. Respond in markdown with these sections: ## Summary (2-4 sentences), ## Key Points (bullets), ## Decisions (bullets), ## Action Items (bullets formatted '**Owner** — task (due: date or 'not specified')'), ## Deadlines (bullets). Only include facts in the notes; write 'None mentioned' for empty sections.",
  research:
    "You are a careful research assistant. Respond in markdown: ## Overview, ## Key Findings (bullets), ## Details, ## Practical Takeaways, ## References. In References list only well-known, real sources (organizations, publications, official sites) with URLs when you are confident they exist. Never invent citations; if unsure, say 'Verify independently'. Note that information may not reflect the latest developments.",
  planner:
    "You are a productivity coach. Given a task list, produce a realistic prioritized daily schedule in markdown: ## Top Priorities (max 3), ## Schedule (time blocks like '09:00–10:00 — task'), ## Tips. Include short breaks. Respect deadlines and priorities.",
};

export const Route = createFileRoute("/api/generate")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: { tool?: string; prompt?: string };
        try {
          body = await request.json();
        } catch {
          return Response.json({ error: "Invalid request." }, { status: 400 });
        }
        const instructions = body.tool ? INSTRUCTIONS[body.tool] : undefined;
        const prompt = body.prompt?.trim();
        if (!instructions || !prompt) return Response.json({ error: "Please provide some input." }, { status: 400 });
        if (prompt.length > 30000) return Response.json({ error: "Input is too long (max 30,000 characters)." }, { status: 400 });

        const result = startAiStream(request, [{ role: "user", content: prompt }], instructions);
        if (!result) return demoUnavailable();

        const encoder = new TextEncoder();
        const stream = new ReadableStream({
          async start(controller) {
            try {
              for await (const part of result.fullStream) {
                if (part.type === "text-delta") controller.enqueue(encoder.encode(part.text));
                else if (part.type === "error") {
                  controller.enqueue(encoder.encode(`\n[[ERROR]]${friendlyError(part.error)}`));
                }
              }
            } catch (err) {
              controller.enqueue(encoder.encode(`\n[[ERROR]]${friendlyError(err)}`));
            }
            controller.close();
          },
        });
        return new Response(stream, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-cache" } });
      },
    },
  },
});
