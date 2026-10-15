import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Mail, Loader2, Wand2 } from "lucide-react";
import { PageHeader, Panel } from "@/components/AppShell";
import { AiOutput } from "@/components/AiOutput";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useGenerate } from "@/lib/generate";
import { logActivity, saveResult } from "@/lib/store";
import { pageMeta } from "@/lib/meta";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/email")({
  head: () => pageMeta("Smart Email Generator", "Generate professional emails in formal, friendly or persuasive tones."),
  component: EmailPage,
});

const TONES = ["Formal", "Friendly", "Persuasive", "Apologetic", "Concise"];
const LENGTHS = ["Short", "Medium", "Detailed"];

function EmailPage() {
  const [recipient, setRecipient] = useState("Hiring manager at Acme Corp");
  const [purpose, setPurpose] = useState("Follow up after a job interview");
  const [details, setDetails] = useState("Interview was on Tuesday for the Operations Analyst role. Thank them and reaffirm interest.");
  const [tone, setTone] = useState("Formal");
  const [length, setLength] = useState("Medium");
  const [formError, setFormError] = useState("");
  const g = useGenerate("email");

  const submit = async () => {
    if (!purpose.trim()) return setFormError("Please describe the purpose of the email.");
    setFormError("");
    const ok = await g.run(`Recipient: ${recipient || "unspecified"}\nPurpose: ${purpose}\nTone: ${tone}\nLength: ${length}\nKey details: ${details || "none"}`);
    if (ok) logActivity("email", `Generated a ${tone.toLowerCase()} email: “${purpose.slice(0, 40)}”`, 10);
  };

  return (
    <>
      <PageHeader icon={Mail} title="Smart Email Generator" description="Describe what you need and pick a tone." />
      <div className="grid gap-5 lg:grid-cols-2">
        <Panel>
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); submit(); }}>
            <div className="space-y-1.5"><Label htmlFor="rec">Recipient</Label><Input id="rec" value={recipient} onChange={(e) => setRecipient(e.target.value)} placeholder="e.g. My manager, a client…" /></div>
            <div className="space-y-1.5"><Label htmlFor="pur">Purpose *</Label><Input id="pur" value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder="e.g. Request a deadline extension" /></div>
            <div className="space-y-1.5"><Label htmlFor="det">Key details</Label><Textarea id="det" rows={5} value={details} onChange={(e) => setDetails(e.target.value)} /></div>
            <Chips label="Tone" options={TONES} value={tone} onChange={setTone} />
            <Chips label="Length" options={LENGTHS} value={length} onChange={setLength} />
            {formError && <p className="text-sm text-destructive">{formError}</p>}
            <Button type="submit" className="w-full" disabled={g.loading}>
              {g.loading ? <Loader2 className="animate-spin" /> : <Wand2 />} {g.loading ? "Writing…" : "Generate email"}
            </Button>
          </form>
        </Panel>
        <AiOutput {...g} markdown={false} onRetry={submit} emptyText="Your email will appear here — fully editable." onSave={() => saveResult("email", purpose, g.output)} />
      </div>
    </>
  );
}

export function Chips({ label, options, value, onChange }: { label: string; options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button type="button" key={o} onClick={() => onChange(o)} aria-pressed={value === o}
            className={cn("rounded-full border px-3 py-1.5 text-sm transition", value === o ? "border-primary bg-primary text-primary-foreground" : "hover:border-primary/50 hover:bg-primary-soft")}>
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}
