import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Search, Loader2, Wand2, Info } from "lucide-react";
import { PageHeader, Panel } from "@/components/AppShell";
import { AiOutput } from "@/components/AiOutput";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useGenerate } from "@/lib/generate";
import { logActivity, saveResult } from "@/lib/store";
import { pageMeta } from "@/lib/meta";
import { Chips } from "./email";

export const Route = createFileRoute("/research")({
  head: () => pageMeta("AI Research Assistant", "Research topics, get clear summaries and references."),
  component: ResearchPage,
});

const IDEAS = ["Best practices for hybrid work", "How to run effective 1:1 meetings", "OKRs vs KPIs explained"];

function ResearchPage() {
  const [topic, setTopic] = useState("");
  const [focus, setFocus] = useState("");
  const [depth, setDepth] = useState("Standard");
  const [formError, setFormError] = useState("");
  const g = useGenerate("research");

  const submit = async (t = topic) => {
    if (!t.trim()) return setFormError("Please enter a topic to research.");
    setFormError("");
    const ok = await g.run(`Topic: ${t}\nFocus/questions: ${focus || "general overview"}\nDepth: ${depth}`);
    if (ok) logActivity("research", `Researched “${t.slice(0, 50)}”`, 30);
  };

  return (
    <>
      <PageHeader icon={Search} title="AI Research Assistant" description="Get a structured briefing with references where available." />
      <div className="grid gap-5 lg:grid-cols-2">
        <Panel>
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); submit(); }}>
            <div className="space-y-1.5"><Label htmlFor="tp">Topic *</Label><Input id="tp" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. Impact of AI on customer service" /></div>
            <div className="flex flex-wrap gap-2">
              {IDEAS.map((i) => <button type="button" key={i} onClick={() => setTopic(i)} className="rounded-full bg-primary-soft px-3 py-1 text-xs text-accent-foreground hover:bg-accent">{i}</button>)}
            </div>
            <div className="space-y-1.5"><Label htmlFor="f">Specific questions (optional)</Label><Textarea id="f" rows={4} value={focus} onChange={(e) => setFocus(e.target.value)} /></div>
            <Chips label="Depth" options={["Quick", "Standard", "In-depth"]} value={depth} onChange={setDepth} />
            {formError && <p className="text-sm text-destructive">{formError}</p>}
            <Button type="submit" className="w-full" disabled={g.loading}>
              {g.loading ? <Loader2 className="animate-spin" /> : <Wand2 />} {g.loading ? "Researching…" : "Research topic"}
            </Button>
            <p className="flex gap-2 text-xs text-muted-foreground"><Info className="size-4 shrink-0" /> AI may make mistakes. Always verify references and recent facts.</p>
          </form>
        </Panel>
        <AiOutput {...g} onRetry={() => submit()} emptyText="Your research briefing will appear here." onSave={() => saveResult("research", topic, g.output)} />
      </div>
    </>
  );
}
