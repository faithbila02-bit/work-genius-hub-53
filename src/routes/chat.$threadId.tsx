import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import ReactMarkdown from "react-markdown";
import { AlertCircle, ArrowUp, BriefcaseBusiness, Copy, Square, Bookmark, MessagesSquare } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, Panel } from "@/components/AppShell";
import { ChatThreads } from "@/components/ChatThreads";
import { copyText } from "@/components/AiOutput";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { logActivity, saveResult, threadsStore } from "@/lib/store";
import { pageMeta } from "@/lib/meta";

export const Route = createFileRoute("/chat/$threadId")({
  head: () => pageMeta("AI Chat", "A conversation with your AI workplace assistant."),
  component: ChatPage,
});

const SUGGESTIONS = ["How do I write a polite reminder to a colleague?", "Give me 5 tips to run shorter meetings", "Explain VLOOKUP in Excel simply", "Help me prepare for a performance review"];

function ChatPage() {
  const { threadId } = Route.useParams();
  const threads = threadsStore.use();
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  const thread = threads.find((t) => t.id === threadId);

  return (
    <>
      <PageHeader icon={MessagesSquare} title="AI Chatbot" description="Your assistant for everyday workplace tasks." />
      <div className="grid gap-5 md:grid-cols-[260px_1fr]">
        <Panel className="hidden md:block md:h-[640px]"><ChatThreads activeId={threadId} /></Panel>
        {!hydrated ? (
          <Panel className="h-[640px] animate-pulse" />
        ) : thread ? (
          <ChatWindow key={threadId} threadId={threadId} initial={thread.messages} />
        ) : (
          <Panel className="grid h-[400px] place-items-center text-center">
            <div>
              <p className="font-semibold">Conversation not found</p>
              <Link to="/chat" className="mt-2 inline-block text-sm text-primary">Back to chats</Link>
            </div>
          </Panel>
        )}
      </div>
      <div className="mt-4 md:hidden"><Panel><ChatThreads activeId={threadId} /></Panel></div>
    </>
  );
}

function textOf(m: UIMessage) {
  return m.parts.map((p) => (p.type === "text" ? p.text : "")).join("");
}

function ChatWindow({ threadId, initial }: { threadId: string; initial: UIMessage[] }) {
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const { messages, sendMessage, status, error, stop, clearError } = useChat({
    id: threadId,
    messages: initial,
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });
  const busy = status === "submitted" || status === "streaming";

  useEffect(() => {
    if (status !== "ready" && status !== "error") return;
    threadsStore.set((all) =>
      all.map((t) => {
        if (t.id !== threadId) return t;
        const first = messages.find((m) => m.role === "user");
        const title = t.title === "New chat" && first ? textOf(first).slice(0, 40) : t.title;
        return { ...t, messages, title, updatedAt: messages.length !== t.messages.length ? Date.now() : t.updatedAt };
      }),
    );
    inputRef.current?.focus();
  }, [messages, status, threadId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, status]);

  const send = (text: string) => {
    const t = text.trim();
    if (!t || busy) return;
    clearError();
    sendMessage({ text: t });
    setInput("");
    logActivity("chat", `Asked the chatbot: “${t.slice(0, 40)}”`, 5);
  };

  return (
    <Panel className="flex h-[640px] flex-col p-0">
      <div className="flex-1 space-y-5 overflow-auto p-4 sm:p-6">
        {messages.length === 0 && (
          <div className="grid h-full place-items-center text-center">
            <div>
              <div className="mx-auto grid size-12 place-items-center rounded-xl bg-primary text-primary-foreground"><BriefcaseBusiness className="size-6" /></div>
              <p className="mt-3 font-semibold">How can I help you today?</p>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {SUGGESTIONS.map((s) => (
                  <button key={s} onClick={() => send(s)} className="rounded-xl border p-3 text-left text-sm hover:border-primary/50 hover:bg-primary-soft">{s}</button>
                ))}
              </div>
            </div>
          </div>
        )}
        {messages.map((m) =>
          m.role === "user" ? (
            <div key={m.id} className="flex justify-end">
              <div className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-sm bg-primary px-4 py-2.5 text-sm text-primary-foreground">{textOf(m)}</div>
            </div>
          ) : (
            <div key={m.id} className="flex gap-3">
              <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary"><BriefcaseBusiness className="size-4" /></div>
              <div className="min-w-0 flex-1">
                <div className="prose-output text-sm"><ReactMarkdown>{textOf(m)}</ReactMarkdown></div>
                {textOf(m) && !(busy && m.id === messages[messages.length - 1]?.id) && (
                  <div className="mt-1 flex gap-1">
                    <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => copyText(textOf(m))}><Copy /> Copy</Button>
                    <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => { saveResult("chat", textOf(m).slice(0, 50), textOf(m)); toast.success("Saved to your results"); }}><Bookmark /> Save</Button>
                  </div>
                )}
              </div>
            </div>
          ),
        )}
        {status === "submitted" && (
          <div className="flex gap-3">
            <div className="grid size-8 place-items-center rounded-lg bg-primary-soft text-primary"><BriefcaseBusiness className="size-4" /></div>
            <div className="flex items-center gap-1 pt-2">
              {[0, 150, 300].map((d) => <span key={d} className="size-2 animate-bounce rounded-full bg-primary/60" style={{ animationDelay: `${d}ms` }} />)}
            </div>
          </div>
        )}
        {error && (
          <div role="alert" className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            <span>{error.message.includes("demo") ? "Demo mode: AI credentials are unavailable, so the chatbot can't reply right now." : error.message || "Something went wrong. Please try again."}</span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <form className="border-t p-3" onSubmit={(e) => { e.preventDefault(); send(input); }}>
        <div className="flex items-end gap-2 rounded-xl border bg-background p-2 focus-within:ring-2 focus-within:ring-ring/40">
          <Textarea
            ref={inputRef}
            autoFocus
            aria-label="Message"
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }}
            placeholder="Ask anything about your work…"
            className="max-h-40 min-h-10 resize-none border-0 bg-transparent shadow-none focus-visible:ring-0"
          />
          {busy ? (
            <Button type="button" size="icon" variant="outline" aria-label="Stop" onClick={() => stop()}><Square /></Button>
          ) : (
            <Button type="submit" size="icon" aria-label="Send" disabled={!input.trim()}><ArrowUp /></Button>
          )}
        </div>
      </form>
    </Panel>
  );
}
