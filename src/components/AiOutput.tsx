import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import { AlertCircle, Bookmark, Check, Copy, Eye, Loader2, Pencil, RotateCcw, FlaskConical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Panel } from "./AppShell";

export async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
    return true;
  } catch {
    toast.error("Couldn't copy — please select and copy manually.");
    return false;
  }
}

interface Props {
  output: string;
  setOutput: (v: string) => void;
  loading: boolean;
  error: string | null;
  demo: boolean;
  onSave: () => void;
  onRetry?: () => void;
  markdown?: boolean;
  emptyText: string;
}

export function AiOutput({ output, setOutput, loading, error, demo, onSave, onRetry, markdown = true, emptyText }: Props) {
  const [editing, setEditing] = useState(!markdown);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const has = output.trim().length > 0;

  return (
    <Panel className="flex min-h-[420px] flex-col">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h2 className="font-semibold">AI Output</h2>
          {loading && (
            <span className="flex items-center gap-1 text-xs text-primary">
              <Loader2 className="size-3.5 animate-spin" /> Generating…
            </span>
          )}
          {demo && (
            <span className="flex items-center gap-1 rounded-full bg-warning/15 px-2 py-0.5 text-xs font-medium text-warning">
              <FlaskConical className="size-3" /> Demo output — AI unavailable
            </span>
          )}
        </div>
        {has && !loading && (
          <div className="flex flex-wrap gap-1.5">
            {markdown && (
              <Button size="sm" variant="ghost" onClick={() => setEditing((e) => !e)}>
                {editing ? <Eye /> : <Pencil />} {editing ? "Preview" : "Edit"}
              </Button>
            )}
            {onRetry && (
              <Button size="sm" variant="ghost" onClick={onRetry}>
                <RotateCcw /> Regenerate
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={async () => {
                if (await copyText(output)) {
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1500);
                }
              }}
            >
              {copied ? <Check /> : <Copy />} Copy
            </Button>
            <Button
              size="sm"
              onClick={() => {
                onSave();
                setSaved(true);
                toast.success("Saved to your results");
                setTimeout(() => setSaved(false), 1500);
              }}
            >
              {saved ? <Check /> : <Bookmark />} Save
            </Button>
          </div>
        )}
      </div>

      {error && (
        <div role="alert" className="mb-3 flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <div className="flex-1">{error}</div>
          {onRetry && (
            <Button size="sm" variant="outline" onClick={onRetry}>
              Try again
            </Button>
          )}
        </div>
      )}

      {!has && !loading && !error && (
        <div className="grid flex-1 place-items-center rounded-xl border border-dashed bg-muted/40 p-6 text-center text-sm text-muted-foreground">
          {emptyText}
        </div>
      )}
      {!has && loading && (
        <div className="flex-1 space-y-3 p-2">
          {[90, 75, 85, 60, 70].map((w, i) => (
            <div key={i} className="h-3 animate-pulse rounded bg-muted" style={{ width: `${w}%` }} />
          ))}
        </div>
      )}
      {has &&
        (editing || loading ? (
          <Textarea
            aria-label="Editable AI output"
            value={output}
            readOnly={loading}
            onChange={(e) => setOutput(e.target.value)}
            className="min-h-[360px] flex-1 resize-y font-mono text-sm leading-relaxed"
          />
        ) : (
          <div className="prose-output flex-1 overflow-auto rounded-xl bg-muted/30 p-4 text-sm">
            <ReactMarkdown>{output}</ReactMarkdown>
          </div>
        ))}
    </Panel>
  );
}
