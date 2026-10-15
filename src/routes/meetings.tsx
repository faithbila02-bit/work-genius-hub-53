import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { FileText, Loader2, Wand2 } from "lucide-react";
import { PageHeader, Panel } from "@/components/AppShell";
import { AiOutput } from "@/components/AiOutput";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useGenerate } from "@/lib/generate";
import { logActivity, saveResult } from "@/lib/store";
import { pageMeta } from "@/lib/meta";

export const Route = createFileRoute("/meetings")({
  head: () => pageMeta("Meeting Notes Summarizer", "Summarize meeting notes into key points, decisions, action items and deadlines."),
  component: MeetingsPage,
});

const SAMPLE = `Product sync – Oct 14
Attendees: Naledi (PM), Thabo (Eng), Lerato (Design), James (Marketing)
- Naledi: beta launch slipping, aiming for Nov 3 instead of Oct 27.
- Thabo said payments integration is 80% done, needs QA. He'll finish testing by Oct 22.
- Lerato showed new onboarding screens, team liked option B. Decided to go with option B.
- James wants launch blog post + email campaign. Needs final screenshots from Lerato by Oct 25.
- Discussed pricing: agreed to keep the free tier but cap at 3 projects.
- Next sync Oct 21.`;

function MeetingsPage() {
  const [title, setTitle] = useState("Product sync");
  const [notes, setNotes] = useState(SAMPLE);
  const [formError, setFormError] = useState("");
  const g = useGenerate("meeting");

  const submit = async () => {
    if (notes.trim().length < 30) return setFormError("Please paste more meeting notes (at least a few sentences).");
    setFormError("");
    const ok = await g.run(`Meeting: ${title}\n\nNotes:\n${notes}`);
    if (ok) logActivity("meeting", `Summarized “${title || "meeting"}” notes`, 15);
  };

  return (
    <>
      <PageHeader icon={FileText} title="Meeting Notes Summarizer" description="Paste raw notes or a transcript to extract what matters." />
      <div className="grid gap-5 lg:grid-cols-2">
        <Panel>
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); submit(); }}>
            <div className="space-y-1.5"><Label htmlFor="t">Meeting title</Label><Input id="t" value={title} onChange={(e) => setTitle(e.target.value)} /></div>
            <div className="space-y-1.5">
              <div className="flex justify-between"><Label htmlFor="n">Notes *</Label><span className="text-xs text-muted-foreground">{notes.length.toLocaleString()} chars</span></div>
              <Textarea id="n" rows={14} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Paste your meeting notes here…" />
            </div>
            {formError && <p className="text-sm text-destructive">{formError}</p>}
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setNotes("")}>Clear</Button>
              <Button type="submit" className="flex-1" disabled={g.loading}>
                {g.loading ? <Loader2 className="animate-spin" /> : <Wand2 />} {g.loading ? "Summarizing…" : "Summarize notes"}
              </Button>
            </div>
          </form>
        </Panel>
        <AiOutput {...g} onRetry={submit} emptyText="Summary, decisions, action items and deadlines will appear here." onSave={() => saveResult("meeting", `${title} — summary`, g.output)} />
      </div>
    </>
  );
}
