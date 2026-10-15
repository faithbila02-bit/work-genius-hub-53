import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ListChecks, Plus, Trash2, Pencil, Loader2, CalendarClock, X, Check } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, Panel } from "@/components/AppShell";
import { AiOutput } from "@/components/AiOutput";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useGenerate } from "@/lib/generate";
import { logActivity, saveResult, tasksStore, uid, type Priority, type Task } from "@/lib/store";
import { pageMeta } from "@/lib/meta";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/tasks")({
  head: () => pageMeta("AI Task Planner", "Create, prioritize and track tasks, then let AI plan your day."),
  component: TasksPage,
});

const PRI_STYLE: Record<Priority, string> = {
  high: "bg-destructive/10 text-destructive",
  medium: "bg-warning/15 text-warning",
  low: "bg-primary-soft text-primary",
};
const PRI_ORDER: Record<Priority, number> = { high: 0, medium: 1, low: 2 };
const today = () => new Date().toISOString().slice(0, 10);

function TaskForm({ initial, onSubmit, onCancel, submitLabel }: { initial: Partial<Task>; onSubmit: (t: Pick<Task, "title" | "priority" | "due" | "notes">) => void; onCancel?: () => void; submitLabel: string }) {
  const [title, setTitle] = useState(initial.title ?? "");
  const [priority, setPriority] = useState<Priority>(initial.priority ?? "medium");
  const [due, setDue] = useState(initial.due ?? today());
  const [err, setErr] = useState("");
  return (
    <form
      className="flex flex-col gap-2 sm:flex-row sm:flex-wrap"
      onSubmit={(e) => {
        e.preventDefault();
        if (!title.trim()) return setErr("Task title is required.");
        setErr("");
        onSubmit({ title: title.trim(), priority, due, notes: initial.notes ?? "" });
        if (!initial.id) setTitle("");
      }}
    >
      <Input aria-label="Task title" className="sm:flex-1 sm:min-w-48" placeholder="What needs to be done?" value={title} onChange={(e) => setTitle(e.target.value)} />
      <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
        <SelectTrigger aria-label="Priority" className="sm:w-32"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="high">High</SelectItem>
          <SelectItem value="medium">Medium</SelectItem>
          <SelectItem value="low">Low</SelectItem>
        </SelectContent>
      </Select>
      <Input aria-label="Due date" type="date" className="sm:w-40" value={due} onChange={(e) => setDue(e.target.value)} />
      <div className="flex gap-2">
        <Button type="submit" className="flex-1">{initial.id ? <Check /> : <Plus />} {submitLabel}</Button>
        {onCancel && <Button type="button" variant="ghost" onClick={onCancel} aria-label="Cancel"><X /></Button>}
      </div>
      {err && <p className="w-full text-sm text-destructive">{err}</p>}
    </form>
  );
}

function TasksPage() {
  const tasks = tasksStore.use();
  const [filter, setFilter] = useState<"all" | "active" | "done">("all");
  const [editing, setEditing] = useState<string | null>(null);
  const g = useGenerate("planner");

  const shown = tasks
    .filter((t) => (filter === "all" ? true : filter === "done" ? t.done : !t.done))
    .sort((a, b) => Number(a.done) - Number(b.done) || PRI_ORDER[a.priority] - PRI_ORDER[b.priority] || a.due.localeCompare(b.due));
  const active = tasks.filter((t) => !t.done);

  const plan = async () => {
    if (active.length === 0) return toast.error("Add some open tasks first.");
    const list = active.map((t) => `- ${t.title} (priority: ${t.priority}, due: ${t.due})`).join("\n");
    const ok = await g.run(`Today is ${today()}. Working hours 08:30–17:00.\nOpen tasks:\n${list}`);
    if (ok) logActivity("planner", "Generated a daily schedule", 15);
  };

  return (
    <>
      <PageHeader icon={ListChecks} title="AI Task Planner" description="Organize your work and let AI build your daily schedule."
        actions={<Button onClick={plan} disabled={g.loading}>{g.loading ? <Loader2 className="animate-spin" /> : <CalendarClock />} Plan my day with AI</Button>} />
      <div className="grid gap-5 lg:grid-cols-5">
        <Panel className="lg:col-span-3">
          <TaskForm initial={{}} submitLabel="Add task" onSubmit={(t) => {
            tasksStore.set((s) => [{ id: uid(), done: false, createdAt: Date.now(), ...t }, ...s]);
            toast.success("Task added");
          }} />
          <div className="mt-5 flex gap-1 rounded-lg bg-muted p-1 text-sm">
            {(["all", "active", "done"] as const).map((f) => (
              <button key={f} onClick={() => setFilter(f)} className={cn("flex-1 rounded-md px-3 py-1.5 capitalize", filter === f ? "bg-card font-semibold shadow-sm" : "text-muted-foreground")}>
                {f} ({f === "all" ? tasks.length : f === "done" ? tasks.length - active.length : active.length})
              </button>
            ))}
          </div>
          <ul className="mt-3 divide-y">
            {shown.length === 0 && <li className="py-8 text-center text-sm text-muted-foreground">No tasks here.</li>}
            {shown.map((t) => (
              <li key={t.id} className="py-3">
                {editing === t.id ? (
                  <TaskForm initial={t} submitLabel="Save" onCancel={() => setEditing(null)} onSubmit={(u) => {
                    tasksStore.set((s) => s.map((x) => (x.id === t.id ? { ...x, ...u } : x)));
                    setEditing(null);
                    toast.success("Task updated");
                  }} />
                ) : (
                  <div className="flex items-center gap-3">
                    <Checkbox aria-label={`Complete ${t.title}`} checked={t.done} onCheckedChange={() => {
                      tasksStore.set((s) => s.map((x) => (x.id === t.id ? { ...x, done: !x.done } : x)));
                      if (!t.done) logActivity("task", `Completed “${t.title}”`);
                    }} />
                    <div className="min-w-0 flex-1">
                      <p className={cn("truncate text-sm font-medium", t.done && "text-muted-foreground line-through")}>{t.title}</p>
                      <p className={cn("text-xs", !t.done && t.due < today() ? "text-destructive" : "text-muted-foreground")}>
                        Due {t.due}{!t.done && t.due < today() ? " · Overdue" : ""}
                      </p>
                    </div>
                    <span className={cn("hidden rounded-full px-2 py-0.5 text-xs font-medium capitalize sm:inline", PRI_STYLE[t.priority])}>{t.priority}</span>
                    <Button size="icon" variant="ghost" aria-label="Edit task" onClick={() => setEditing(t.id)}><Pencil /></Button>
                    <Button size="icon" variant="ghost" aria-label="Delete task" onClick={() => {
                      tasksStore.set((s) => s.filter((x) => x.id !== t.id));
                      toast.success("Task deleted");
                    }}><Trash2 className="text-destructive" /></Button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </Panel>
        <div className="lg:col-span-2">
          <AiOutput {...g} onRetry={plan} emptyText="Click “Plan my day with AI” to get a prioritized schedule from your open tasks." onSave={() => saveResult("planner", `Daily plan — ${today()}`, g.output)} />
        </div>
      </div>
    </>
  );
}
