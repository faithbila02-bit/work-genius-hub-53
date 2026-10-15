import { CheckCircle2, FileText, ListChecks, Mail, MessagesSquare, Search } from "lucide-react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export const KIND_ICON = { email: Mail, meeting: FileText, research: Search, planner: ListChecks, chat: MessagesSquare, task: CheckCircle2 };

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
