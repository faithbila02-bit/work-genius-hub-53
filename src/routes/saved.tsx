import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { Bookmark, Copy, Trash2, Search, Pencil, Check } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, Panel } from "@/components/AppShell";
import { copyText } from "@/components/AiOutput";
import { KIND_ICON } from "@/components/Chips";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { savedStore, timeAgo, type ToolKind } from "@/lib/store";
import { pageMeta } from "@/lib/meta";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/saved")({
  head: () => pageMeta("Saved Results", "Search, copy, edit and delete your saved AI results."),
  component: SavedPage,
});

const KINDS: (ToolKind | "all")[] = ["all", "email", "meeting", "planner", "research", "chat"];

function SavedPage() {
  const saved = savedStore.use();
  const [q, setQ] = useState("");
  const [kind, setKind] = useState<ToolKind | "all">("all");
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  const ql = q.toLowerCase();
  const shown = saved.filter((s) => (kind === "all" || s.kind === kind) && (s.title.toLowerCase().includes(ql) || s.content.toLowerCase().includes(ql)));

  return (
    <>
      <PageHeader icon={Bookmark} title="Saved Results" description={`${saved.length} saved item${saved.length === 1 ? "" : "s"} in this browser.`} />
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input aria-label="Search saved results" className="pl-9" placeholder="Search saved results…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {KINDS.map((k) => (
            <button key={k} onClick={() => setKind(k)} className={cn("rounded-full border px-3 py-1.5 text-xs capitalize", kind === k ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-primary-soft")}>{k}</button>
          ))}
        </div>
      </div>
      {shown.length === 0 && <Panel className="py-12 text-center text-sm text-muted-foreground">{saved.length ? "No results match your search." : "Nothing saved yet. Use the Save button on any AI output."}</Panel>}
      <div className="grid gap-4 md:grid-cols-2">
        {shown.map((s) => {
          const Icon = KIND_ICON[s.kind];
          return (
            <Panel key={s.id} className="flex flex-col">
              <div className="flex items-start gap-3">
                <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary"><Icon className="size-4" /></div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{s.title}</p>
                  <p className="text-xs capitalize text-muted-foreground">{s.kind} · {timeAgo(s.createdAt)}</p>
                </div>
              </div>
              {editing === s.id ? (
                <Textarea aria-label="Edit saved result" className="mt-3 min-h-48 font-mono text-sm" value={draft} onChange={(e) => setDraft(e.target.value)} />
              ) : (
                <div className="prose-output mt-3 max-h-56 overflow-auto rounded-lg bg-muted/40 p-3 text-sm"><ReactMarkdown>{s.content}</ReactMarkdown></div>
              )}
              <div className="mt-3 flex justify-end gap-1.5">
                {editing === s.id ? (
                  <Button size="sm" onClick={() => { savedStore.set((all) => all.map((x) => (x.id === s.id ? { ...x, content: draft } : x))); setEditing(null); toast.success("Updated"); }}><Check /> Save</Button>
                ) : (
                  <Button size="sm" variant="ghost" onClick={() => { setEditing(s.id); setDraft(s.content); }}><Pencil /> Edit</Button>
                )}
                <Button size="sm" variant="outline" onClick={() => copyText(s.content)}><Copy /> Copy</Button>
                <Button size="sm" variant="ghost" aria-label="Delete" onClick={() => { if (confirm("Delete this saved result?")) { savedStore.set((all) => all.filter((x) => x.id !== s.id)); toast.success("Deleted"); } }}><Trash2 className="text-destructive" /></Button>
              </div>
            </Panel>
          );
        })}
      </div>
    </>
  );
}
