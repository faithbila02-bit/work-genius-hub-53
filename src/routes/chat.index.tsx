import { createFileRoute } from "@tanstack/react-router";
import { MessagesSquare, Plus } from "lucide-react";
import { PageHeader, Panel } from "@/components/AppShell";
import { ChatThreads, useNewThread } from "@/components/ChatThreads";
import { Button } from "@/components/ui/button";
import { pageMeta } from "@/lib/meta";

export const Route = createFileRoute("/chat/")({
  head: () => pageMeta("AI Chatbot", "Chat with an AI assistant for everyday workplace tasks."),
  component: ChatHome,
});

function ChatHome() {
  const newThread = useNewThread();
  return (
    <>
      <PageHeader icon={MessagesSquare} title="AI Chatbot" description="Ask questions and get help with everyday work." />
      <div className="grid gap-5 md:grid-cols-[260px_1fr]">
        <Panel className="h-fit md:h-[600px]"><ChatThreads /></Panel>
        <Panel className="grid min-h-[400px] place-items-center text-center">
          <div>
            <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-primary-soft text-primary"><MessagesSquare className="size-7" /></div>
            <h2 className="mt-4 text-lg font-semibold">Start a conversation</h2>
            <p className="mt-1 text-sm text-muted-foreground">Pick a past chat or start a new one.</p>
            <Button className="mt-4" onClick={newThread}><Plus /> New chat</Button>
          </div>
        </Panel>
      </div>
    </>
  );
}
