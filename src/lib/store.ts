import { useSyncExternalStore } from "react";
import type { UIMessage } from "ai";

function createStore<T>(key: string, initial: T) {
  let state: T | null = null;
  const listeners = new Set<() => void>();
  const get = (): T => {
    if (state === null) {
      try {
        const raw = localStorage.getItem(key);
        state = raw ? (JSON.parse(raw) as T) : initial;
      } catch {
        state = initial;
      }
    }
    return state;
  };
  const set = (fn: (s: T) => T) => {
    state = fn(get());
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch {
      /* storage full */
    }
    listeners.forEach((l) => l());
  };
  const subscribe = (l: () => void) => {
    listeners.add(l);
    return () => listeners.delete(l);
  };
  const use = () => useSyncExternalStore(subscribe, get, () => initial);
  return { get, set, use };
}

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

export type Priority = "high" | "medium" | "low";
export interface Task {
  id: string;
  title: string;
  notes: string;
  priority: Priority;
  due: string; // yyyy-mm-dd
  done: boolean;
  createdAt: number;
}
export type ToolKind = "email" | "meeting" | "research" | "planner" | "chat";
export interface SavedResult {
  id: string;
  kind: ToolKind;
  title: string;
  content: string;
  createdAt: number;
}
export interface Activity {
  id: string;
  kind: ToolKind | "task";
  text: string;
  at: number;
}
export interface Thread {
  id: string;
  title: string;
  updatedAt: number;
  messages: UIMessage[];
}

const day = (offset: number) => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
};
const now = Date.now();
const H = 3600_000;

export const tasksStore = createStore<Task[]>("wp.tasks", [
  { id: "t1", title: "Prepare Q4 budget review slides", notes: "Include marketing spend breakdown", priority: "high", due: day(1), done: false, createdAt: now - 30 * H },
  { id: "t2", title: "Reply to vendor contract questions", notes: "", priority: "medium", due: day(0), done: false, createdAt: now - 20 * H },
  { id: "t3", title: "1:1 with Thabo — career goals", notes: "Bring feedback notes", priority: "medium", due: day(2), done: false, createdAt: now - 10 * H },
  { id: "t4", title: "Update onboarding checklist", notes: "", priority: "low", due: day(5), done: false, createdAt: now - 8 * H },
  { id: "t5", title: "Send weekly status report", notes: "", priority: "high", due: day(-1), done: true, createdAt: now - 50 * H },
  { id: "t6", title: "Book team offsite venue", notes: "", priority: "low", due: day(-2), done: true, createdAt: now - 70 * H },
]);

export const savedStore = createStore<SavedResult[]>("wp.saved", [
  {
    id: "s1",
    kind: "email",
    title: "Follow-up on project proposal",
    content:
      "Subject: Following up on our project proposal\n\nHi Sarah,\n\nThank you for taking the time to meet last week. I wanted to follow up on the proposal we discussed and see whether you had any questions.\n\nI'm happy to set up a short call to walk through the timeline.\n\nBest regards,\nFaith",
    createdAt: now - 26 * H,
  },
  {
    id: "s2",
    kind: "meeting",
    title: "Marketing sync — summary",
    content:
      "## Summary\nThe team reviewed campaign performance and agreed to shift budget to social.\n\n## Action Items\n- **Lerato** — draft new ad copy (due: Friday)\n- **James** — update analytics dashboard (due: not specified)",
    createdAt: now - 5 * H,
  },
]);

export const activityStore = createStore<Activity[]>("wp.activity", [
  { id: "a1", kind: "meeting", text: "Summarized “Marketing sync” notes", at: now - 5 * H },
  { id: "a2", kind: "task", text: "Completed “Send weekly status report”", at: now - 9 * H },
  { id: "a3", kind: "email", text: "Generated a formal follow-up email", at: now - 26 * H },
  { id: "a4", kind: "research", text: "Researched “hybrid work best practices”", at: now - 30 * H },
]);

export const statsStore = createStore<{ generations: number; minutesSaved: number }>("wp.stats", { generations: 14, minutesSaved: 185 });

export const threadsStore = createStore<Thread[]>("wp.threads", []);

export function logActivity(kind: Activity["kind"], text: string, minutes = 0) {
  activityStore.set((a) => [{ id: uid(), kind, text, at: Date.now() }, ...a].slice(0, 30));
  if (kind !== "task") statsStore.set((s) => ({ generations: s.generations + 1, minutesSaved: s.minutesSaved + minutes }));
}

export function saveResult(kind: ToolKind, title: string, content: string) {
  savedStore.set((s) => [{ id: uid(), kind, title: title.slice(0, 80) || "Untitled", content, createdAt: Date.now() }, ...s]);
}

export function timeAgo(ts: number) {
  const m = Math.round((Date.now() - ts) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}
