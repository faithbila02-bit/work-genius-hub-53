import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2, Clock, Sparkle, ListChecks, Mail, FileText, Search, MessagesSquare, Bookmark, Activity as ActivityIcon } from "lucide-react";
import { Panel } from "@/components/AppShell";
import { activityStore, savedStore, statsStore, tasksStore, timeAgo } from "@/lib/store";
import { pageMeta } from "@/lib/meta";
import { Progress } from "@/components/ui/progress";

export const Route = createFileRoute("/")({
  head: () => pageMeta("Dashboard", "Your AI workplace productivity dashboard: stats, recent activity, tasks and saved results."),
  component: Dashboard,
});

const TOOLS = [
  { to: "/email", label: "Smart Email Generator", desc: "Formal, friendly or persuasive emails in seconds.", icon: Mail },
  { to: "/meetings", label: "Meeting Summarizer", desc: "Key points, decisions and action items.", icon: FileText },
  { to: "/tasks", label: "AI Task Planner", desc: "Organize tasks and plan your day.", icon: ListChecks },
  { to: "/research", label: "Research Assistant", desc: "Summaries with references.", icon: Search },
  { to: "/chat", label: "AI Chatbot", desc: "Ask anything about your work.", icon: MessagesSquare },
] as const;

export const KIND_ICON = { email: Mail, meeting: FileText, research: Search, planner: ListChecks, chat: MessagesSquare, task: CheckCircle2 };

function Dashboard() {
  const tasks = tasksStore.use();
  const saved = savedStore.use();
  const activity = activityStore.use();
  const stats = statsStore.use();
  const done = tasks.filter((t) => t.done).length;
  const pct = tasks.length ? Math.round((done / tasks.length) * 100) : 0;
  const upcoming = tasks.filter((t) => !t.done).sort((a, b) => a.due.localeCompare(b.due)).slice(0, 4);

  const STATS = [
    { label: "Hours saved", value: (stats.minutesSaved / 60).toFixed(1), icon: Clock },
    { label: "AI generations", value: stats.generations, icon: Sparkle },
    { label: "Tasks completed", value: `${done}/${tasks.length}`, icon: CheckCircle2 },
    { label: "Saved results", value: saved.length, icon: Bookmark },
  ];

  return (
    <div className="space-y-6">
      <section className="bg-hero relative overflow-hidden rounded-2xl p-6 text-primary-foreground sm:p-8">
        <p className="text-sm font-medium opacity-80">Welcome back</p>
        <h1 className="mt-1 max-w-xl text-2xl font-extrabold sm:text-4xl">Get more done with your AI workplace assistant.</h1>
        <p className="mt-2 max-w-lg text-sm opacity-85">Write emails, summarize meetings, plan tasks and research topics — all in one place.</p>
        <Link to="/chat" className="mt-5 inline-flex items-center gap-2 rounded-lg bg-card px-4 py-2 text-sm font-semibold text-primary">
          Ask the assistant <ArrowRight className="size-4" />
        </Link>
      </section>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {STATS.map(({ label, value, icon: Icon }) => (
          <Panel key={label} className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground sm:text-sm">{label}</p>
              <Icon className="size-4 text-primary" />
            </div>
            <p className="mt-2 font-display text-2xl font-bold sm:text-3xl">{value}</p>
          </Panel>
        ))}
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {TOOLS.map(({ to, label, desc, icon: Icon }) => (
          <Link key={to} to={to} className="group rounded-2xl border bg-card p-4 shadow-[var(--shadow-card)] transition hover:-translate-y-0.5 hover:border-primary/40">
            <div className="grid size-10 place-items-center rounded-lg bg-primary-soft text-primary transition group-hover:bg-primary group-hover:text-primary-foreground">
              <Icon className="size-5" />
            </div>
            <p className="mt-3 text-sm font-semibold">{label}</p>
            <p className="mt-1 text-xs text-muted-foreground">{desc}</p>
          </Link>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <Panel className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">Upcoming tasks</h2>
            <Link to="/tasks" className="text-sm font-medium text-primary">View all</Link>
          </div>
          <div className="mb-4">
            <div className="mb-1 flex justify-between text-xs text-muted-foreground"><span>Completion</span><span>{pct}%</span></div>
            <Progress value={pct} />
          </div>
          <ul className="divide-y">
            {upcoming.length === 0 && <li className="py-3 text-sm text-muted-foreground">All caught up! 🎉</li>}
            {upcoming.map((t) => (
              <li key={t.id} className="flex items-center justify-between gap-3 py-3">
                <span className="truncate text-sm">{t.title}</span>
                <span className="shrink-0 text-xs text-muted-foreground">Due {t.due}</span>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel>
          <h2 className="mb-4 flex items-center gap-2 font-semibold"><ActivityIcon className="size-4 text-primary" /> Recent activity</h2>
          <ul className="space-y-3">
            {activity.slice(0, 6).map((a) => {
              const Icon = KIND_ICON[a.kind];
              return (
                <li key={a.id} className="flex gap-3">
                  <div className="grid size-8 shrink-0 place-items-center rounded-full bg-primary-soft text-primary"><Icon className="size-4" /></div>
                  <div className="min-w-0">
                    <p className="text-sm">{a.text}</p>
                    <p className="text-xs text-muted-foreground">{timeAgo(a.at)}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </Panel>
      </section>

      <Panel>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold">Saved results</h2>
          <Link to="/saved" className="text-sm font-medium text-primary">Open library</Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {saved.length === 0 && <p className="text-sm text-muted-foreground">Nothing saved yet.</p>}
          {saved.slice(0, 3).map((s) => (
            <div key={s.id} className="rounded-xl border bg-muted/30 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-primary">{s.kind}</p>
              <p className="mt-1 truncate text-sm font-semibold">{s.title}</p>
              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{s.content}</p>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
