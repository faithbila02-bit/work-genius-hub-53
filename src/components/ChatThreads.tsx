import { Link, useNavigate } from "@tanstack/react-router";
import { Plus, Trash2, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { threadsStore, uid } from "@/lib/store";
import { cn } from "@/lib/utils";

export function useNewThread() {
  const navigate = useNavigate();
  return () => {
    const id = uid();
    threadsStore.set((t) => [{ id, title: "New chat", updatedAt: Date.now(), messages: [] }, ...t]);
    navigate({ to: "/chat/$threadId", params: { threadId: id } });
  };
}

export function ChatThreads({ activeId }: { activeId?: string }) {
  const threads = threadsStore.use();
  const newThread = useNewThread();
  const navigate = useNavigate();
  const sorted = [...threads].sort((a, b) => b.updatedAt - a.updatedAt);
  return (
    <div className="flex h-full flex-col">
      <Button onClick={newThread} className="w-full"><Plus /> New chat</Button>
      <ul className="mt-3 flex-1 space-y-1 overflow-auto">
        {sorted.length === 0 && <li className="px-2 py-4 text-center text-xs text-muted-foreground">No conversations yet.</li>}
        {sorted.map((t) => (
          <li key={t.id} className={cn("group flex items-center rounded-lg", t.id === activeId ? "bg-primary-soft" : "hover:bg-muted")}>
            <Link to="/chat/$threadId" params={{ threadId: t.id }} className={cn("flex min-w-0 flex-1 items-center gap-2 px-3 py-2 text-sm", t.id === activeId && "font-semibold text-primary")}>
              <MessageSquare className="size-4 shrink-0" />
              <span className="truncate">{t.title}</span>
            </Link>
            <button aria-label={`Delete ${t.title}`} className="mr-1 rounded p-1.5 text-muted-foreground opacity-60 hover:text-destructive group-hover:opacity-100"
              onClick={() => {
                threadsStore.set((all) => all.filter((x) => x.id !== t.id));
                if (t.id === activeId) navigate({ to: "/chat" });
              }}>
              <Trash2 className="size-3.5" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
