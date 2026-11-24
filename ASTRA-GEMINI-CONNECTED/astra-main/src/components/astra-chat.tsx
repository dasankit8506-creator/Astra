import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { MessageCircle, Plus, Send, Trash2, Pencil, PanelLeftClose, PanelLeftOpen, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

type ChatMessage = { id: string; role: "user" | "assistant"; content: string; createdAt: number };
type Conversation = { id: string; title: string; updatedAt: number; messages: ChatMessage[] };
type StoredRecord = { key: string; value: Conversation[] };

const DB_NAME = "astra-local-data";
const STORE_NAME = "app";
const STORAGE_KEY = "chat-conversations";

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("This browser does not support local chat storage."));
      return;
    }
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) request.result.createObjectStore(STORE_NAME, { keyPath: "key" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Could not open local storage."));
  });
}

async function readConversations(): Promise<Conversation[]> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const request = db.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME).get(STORAGE_KEY);
    request.onsuccess = () => {
      const items = (request.result as StoredRecord | undefined)?.value ?? [];
      db.close();
      resolve(items);
    };
    request.onerror = () => {
      db.close();
      reject(request.error ?? new Error("Could not load chat history."));
    };
  });
}

async function writeConversations(value: Conversation[]): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).put({ key: STORAGE_KEY, value } satisfies StoredRecord);
    transaction.oncomplete = () => { db.close(); resolve(); };
    transaction.onerror = () => { db.close(); reject(transaction.error ?? new Error("Could not save chat history.")); };
    transaction.onabort = () => { db.close(); reject(transaction.error ?? new Error("Saving chat history was cancelled.")); };
  });
}

function makeId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function AstraChat() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [storageReady, setStorageReady] = useState(false);
  const [storageError, setStorageError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [search, setSearch] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [aiStatus, setAiStatus] = useState<"checking" | "missing" | "key-detected" | "connected" | "error">("checking");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let mounted = true;
    readConversations().then((items) => {
      if (!mounted) return;
      setConversations(items.sort((a, b) => b.updatedAt - a.updatedAt));
      setActiveId(items[0]?.id ?? null);
      setStorageReady(true);
    }).catch(() => {
      if (!mounted) return;
      setStorageError("Local chat storage is unavailable in this browser. Conversations may not persist after you leave.");
      setStorageReady(true);
    });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!storageReady || storageError) return;
    writeConversations(conversations).catch(() => setStorageError("ASTRA could not save this conversation. Check your browser storage settings."));
  }, [conversations, storageReady, storageError]);

  useEffect(() => {
    let mounted = true;
    fetch("/api/astra")
      .then(async (response) => {
        if (!response.ok) throw new Error("Could not check the AI server.");
        return (await response.json()) as { configured?: boolean };
      })
      .then((result) => {
        if (mounted) setAiStatus(result.configured ? "key-detected" : "missing");
      })
      .catch(() => {
        if (mounted) setAiStatus("error");
      });
    return () => { mounted = false; };
  }, []);

  const activeConversation = conversations.find((item) => item.id === activeId) ?? null;
  const visibleConversations = useMemo(() => conversations.filter((item) => item.title.toLowerCase().includes(search.toLowerCase())), [conversations, search]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [activeConversation?.messages.length]);

  function newChat() {
    const conversation: Conversation = { id: makeId(), title: "New conversation", updatedAt: Date.now(), messages: [] };
    setConversations((old) => [conversation, ...old]);
    setActiveId(conversation.id);
    setDraft("");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = draft.trim();
    if (!text || isSending) return;

    const conversation = activeConversation ?? {
      id: makeId(),
      title: "New conversation",
      updatedAt: Date.now(),
      messages: [],
    };
    const now = Date.now();
    const userMessage: ChatMessage = {
      id: makeId(),
      role: "user",
      content: text,
      createdAt: now,
    };
    const updated: Conversation = {
      ...conversation,
      title: conversation.messages.length === 0 ? text.slice(0, 42) : conversation.title,
      updatedAt: now,
      messages: [...conversation.messages, userMessage],
    };

    setConversations((old) => [updated, ...old.filter((item) => item.id !== updated.id)]);
    setActiveId(updated.id);
    setDraft("");
    setIsSending(true);

    try {
      const response = await fetch("/api/astra", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updated.messages.slice(-16).map((message) => ({
            role: message.role,
            content: message.content,
          })),
        }),
      });
      const result = (await response.json().catch(() => ({}))) as { reply?: string; error?: string };
      if (!response.ok || !result.reply) {
        throw new Error(result.error || `AI request failed (${response.status}).`);
      }

      setAiStatus("connected");
      const assistantMessage: ChatMessage = {
        id: makeId(),
        role: "assistant",
        content: result.reply,
        createdAt: Date.now(),
      };
      setConversations((old) => old.map((item) => item.id === conversation.id
        ? { ...item, updatedAt: Date.now(), messages: [...item.messages, assistantMessage] }
        : item));
    } catch (error) {
      setAiStatus("error");
      const assistantMessage: ChatMessage = {
        id: makeId(),
        role: "assistant",
        content: `I couldn't get a live AI response. ${error instanceof Error ? error.message : "Please try again."}`,
        createdAt: Date.now(),
      };
      setConversations((old) => old.map((item) => item.id === conversation.id
        ? { ...item, updatedAt: Date.now(), messages: [...item.messages, assistantMessage] }
        : item));
    } finally {
      setIsSending(false);
    }
  }

  function deleteConversation(id: string) {
    const remaining = conversations.filter((item) => item.id !== id);
    setConversations(remaining);
    if (activeId === id) setActiveId(remaining[0]?.id ?? null);
  }

  function saveRename(id: string) {
    const title = renameValue.trim();
    if (title) setConversations((old) => old.map((item) => item.id === id ? { ...item, title, updatedAt: Date.now() } : item));
    setEditingId(null);
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-brand-violet/35 bg-brand-surface shadow-2xl shadow-brand-violet/5">
      <div className="flex items-center gap-3 border-b border-border/70 p-4 sm:p-5">
        <AstraMark />
        <div className="min-w-0 flex-1"><p className="font-display font-semibold">ASTRA Learning Guide</p><p className="text-xs text-muted-foreground">Your astronomy and space-discovery companion · Local chat history</p><p className="mt-1 text-[10px] font-medium text-brand-cyan">Created by Ankit Das</p></div>
        <span className={`rounded-full border px-3 py-1 text-[10px] font-semibold tracking-wider ${aiStatus === "connected" ? "border-emerald-400/30 text-emerald-300" : aiStatus === "missing" || aiStatus === "error" ? "border-amber-400/30 text-amber-300" : "border-brand-violet/30 text-brand-violet"}`}>{aiStatus === "connected" ? "ASTRA ONLINE" : aiStatus === "key-detected" ? "API KEY DETECTED" : aiStatus === "checking" ? "CHECKING AI" : aiStatus === "missing" ? "API KEY MISSING" : "AI CONNECTION ERROR"}</span>
      </div>
      <div className="flex min-h-[440px]">
        {sidebarOpen && <aside className="flex w-[42%] max-w-[230px] shrink-0 flex-col border-r border-border/70 bg-background/35 p-3 sm:p-4">
          <Button type="button" size="sm" className="w-full justify-start rounded-lg" onClick={newChat}><Plus className="size-4" /> New Chat</Button>
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search chats" aria-label="Search chat history" className="mt-3 h-9 w-full rounded-lg border border-input bg-background px-3 text-xs outline-none focus:border-brand-cyan" />
          <p className="mb-2 mt-4 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Your conversations</p>
          <div className="min-h-0 flex-1 space-y-1 overflow-y-auto">
            {visibleConversations.map((item) => <div key={item.id} className={`group rounded-lg ${activeId === item.id ? "bg-brand-cyan/10" : "hover:bg-background/70"}`}>
              {editingId === item.id ? <form className="p-2" onSubmit={(event) => { event.preventDefault(); saveRename(item.id); }}><input autoFocus value={renameValue} onChange={(event) => setRenameValue(event.target.value)} className="h-8 w-full rounded border border-input bg-background px-2 text-xs" /><div className="mt-1 flex gap-2"><button className="text-[11px] text-brand-cyan" type="submit">Save</button><button className="text-[11px] text-muted-foreground" type="button" onClick={() => setEditingId(null)}>Cancel</button></div></form> : <div className="flex items-center gap-1 p-1"><button type="button" onClick={() => setActiveId(item.id)} className="flex min-w-0 flex-1 items-center gap-2 p-2 text-left text-xs"><MessageCircle className="size-3.5 shrink-0 text-muted-foreground" /><span className="truncate">{item.title}</span></button><button type="button" aria-label={`Rename ${item.title}`} title="Rename" onClick={() => { setEditingId(item.id); setRenameValue(item.title); }} className="rounded p-1 text-muted-foreground opacity-70 hover:bg-background hover:text-foreground"><Pencil className="size-3" /></button><button type="button" aria-label={`Delete ${item.title}`} title="Delete" onClick={() => deleteConversation(item.id)} className="rounded p-1 text-muted-foreground opacity-70 hover:bg-background hover:text-destructive"><Trash2 className="size-3" /></button></div>}
            </div>)}
            {visibleConversations.length === 0 && <p className="px-2 py-3 text-xs leading-5 text-muted-foreground">{search ? "No matching conversations." : "Your saved chats will appear here."}</p>}
          </div>
          <p className="mt-3 border-t border-border/70 pt-3 text-[10px] leading-4 text-muted-foreground">Saved on this device in this browser.</p>
        </aside>}
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
            <button type="button" onClick={() => setSidebarOpen((value) => !value)} aria-label={sidebarOpen ? "Hide chat history" : "Show chat history"} className="rounded-lg p-2 text-muted-foreground hover:bg-background hover:text-foreground">{sidebarOpen ? <PanelLeftClose className="size-4" /> : <PanelLeftOpen className="size-4" />}</button>
            <span className="truncate px-2 text-xs font-medium text-muted-foreground">{activeConversation?.title ?? "A new journey begins"}</span>
            <span className="flex items-center gap-1 text-[10px] text-brand-cyan"><Sparkles className="size-3" /> ASTRA INTELLIGENCE</span>
          </div>
          <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-5" aria-live="polite">
            {!activeConversation || activeConversation.messages.length === 0 ? <div className="flex min-h-[260px] flex-col items-center justify-center text-center">
              <span className="flex size-12 items-center justify-center rounded-full bg-brand-violet/10 text-brand-cyan"><Sparkles className="size-5" /></span>
              <h3 className="mt-4 font-display text-xl">What are you curious about?</h3>
              <p className="mt-2 max-w-sm text-xs leading-5 text-muted-foreground">Welcome to ASTRA. What would you like to explore today — the Solar System, stars, galaxies or a big question about the universe?</p><p className="mt-2 text-[10px] font-semibold tracking-wide text-brand-cyan">Created by Ankit Das</p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">{["What is the Sun?", "Tell me about Jupiter", "What is a black hole?"].map((prompt) => <button key={prompt} type="button" onClick={() => setDraft(prompt)} className="rounded-full border border-border bg-background px-3 py-2 text-[11px] text-muted-foreground hover:border-brand-cyan/50 hover:text-foreground">{prompt}</button>)}</div>
            </div> : activeConversation.messages.map((message) => <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}><div className={`max-w-[92%] rounded-2xl px-4 py-3 text-sm leading-6 ${message.role === "user" ? "rounded-br-sm bg-brand-cyan/15 text-foreground" : "rounded-bl-sm border border-border bg-background/75 text-foreground/90"}`}><p className="mb-1 text-[9px] font-semibold uppercase tracking-[0.15em] text-brand-cyan">{message.role === "user" ? "You" : "ASTRA"}</p><p className="whitespace-pre-wrap">{message.content}</p></div></div>)}
            {isSending && <div className="flex justify-start"><div className="rounded-2xl rounded-bl-sm border border-border bg-background/75 px-4 py-3 text-xs text-muted-foreground">ASTRA is thinking…</div></div>}
          </div>
          {storageError && <p className="mx-4 mb-2 rounded-lg border border-amber-500/30 bg-amber-500/5 p-2 text-[11px] text-amber-200">{storageError}</p>}
          <form onSubmit={submit} className="flex gap-2 border-t border-border/70 p-3 sm:p-4"><input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder={isSending ? "ASTRA is thinking…" : "Ask ASTRA about the universe..."} aria-label="Message ASTRA" disabled={isSending} className="h-11 min-w-0 flex-1 rounded-full border border-input bg-background px-4 text-sm outline-none focus:border-brand-cyan focus:ring-2 focus:ring-brand-cyan/20 disabled:opacity-60" /><Button type="submit" disabled={!draft.trim() || isSending} className="size-11 shrink-0 rounded-full px-0" aria-label="Send message"><Send className="size-4" /></Button></form>
          <p className="px-4 pb-3 text-center text-[10px] leading-4 text-muted-foreground">Gemini-powered astronomy conversations · Created by Ankit Das · Chat history stays in this browser.</p>
        </div>
      </div>
    </div>
  );
}

function AstraMark() {
  return <span className="flex size-9 items-center justify-center rounded-xl bg-brand-violet/10 text-brand-cyan"><Sparkles className="size-5" /></span>;
}
