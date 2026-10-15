import { useCallback, useRef, useState } from "react";

export type GenTool = "email" | "meeting" | "research" | "planner";

function demoOutput(tool: GenTool, prompt: string): string {
  const snippet = prompt.slice(0, 80);
  switch (tool) {
    case "email":
      return `Subject: Quick follow-up\n\nHello,\n\nI hope you're well. I'm writing regarding: ${snippet}.\n\nPlease let me know a convenient time to discuss next steps.\n\nKind regards,\n[Your name]`;
    case "meeting":
      return "## Summary\nDemo summary of your meeting notes.\n\n## Key Points\n- Point one\n- Point two\n\n## Decisions\n- Proceed with plan A\n\n## Action Items\n- **Owner** — follow up (due: not specified)\n\n## Deadlines\n- None mentioned";
    case "research":
      return `## Overview\nDemo overview for “${snippet}”.\n\n## Key Findings\n- Finding one\n- Finding two\n\n## References\n- Verify independently`;
    case "planner":
      return "## Top Priorities\n1. Highest-priority task\n\n## Schedule\n- 09:00–10:30 — Deep work\n- 10:30–10:45 — Break\n- 10:45–12:00 — Meetings & email\n\n## Tips\n- Batch small tasks together.";
  }
}

export function useGenerate(tool: GenTool) {
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [demo, setDemo] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const run = useCallback(
    async (prompt: string): Promise<boolean> => {
      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      setLoading(true);
      setError(null);
      setDemo(false);
      setOutput("");
      try {
        const res = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tool, prompt }),
          signal: ctrl.signal,
        });
        if (res.status === 503) {
          const j = await res.json().catch(() => ({}));
          if (j.demo) {
            setDemo(true);
            setOutput(demoOutput(tool, prompt));
            return true;
          }
        }
        if (!res.ok || !res.body) {
          const j = await res.json().catch(() => ({}));
          throw new Error(j.error || `Request failed (${res.status})`);
        }
        const reader = res.body.getReader();
        const dec = new TextDecoder();
        let text = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          text += dec.decode(value, { stream: true });
          const idx = text.indexOf("[[ERROR]]");
          if (idx >= 0) {
            setOutput(text.slice(0, idx).trim());
            throw new Error(text.slice(idx + 9));
          }
          setOutput(text);
        }
        if (!text.trim()) throw new Error("The AI returned an empty response. Please try again.");
        return true;
      } catch (e) {
        if ((e as Error).name === "AbortError") return false;
        setError((e as Error).message || "Something went wrong.");
        return false;
      } finally {
        setLoading(false);
      }
    },
    [tool],
  );

  return { output, setOutput, loading, error, demo, run };
}
