import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactElement } from 'react';
import '../styles/UI.css';
import type { Message, Thread } from '../types';
import { now, newId, seedThread } from '../utils';

// ---- Components ----
function Sidebar({
  threads,
  activeId,
  onCreate,
  onSelect,
}: {
  threads: Thread[];
  activeId?: string;
  onCreate: () => void;
  onSelect: (id: string) => void;
}): ReactElement {
  const [searchQuery, setSearchQuery] = useState("");
  
  const filteredThreads = threads.filter(t => 
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.messages.some(m => m.content.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <aside className="sidebar">
      <button
        onClick={onCreate}
        className="sidebar__new"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 4V20M4 12H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
        New chat
      </button>

      <div className="sidebar__search">
        <input
          type="text"
          placeholder="Search messages..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="sidebar__search-input"
        />
      </div>

      <div className="sidebar__group">Recent</div>
      <div className="sidebar__list">
        {filteredThreads.map((t) => (
          <div key={t.id}>
            <button
              onClick={() => onSelect(t.id)}
              className={
                "sidebar__item " +
                (t.id === activeId ? "sidebar__item--active" : "")
              }
            >
              <div className="sidebar__title">{t.title || "Untitled"}</div>
              <div className="sidebar__time">{new Date(t.updatedAt).toLocaleString()}</div>
            </button>
          </div>
        ))}
      </div>
    </aside>
  );
}

function Bubble({ message }: { message: Message }): ReactElement {
  const isUser = message.role === "user";

  return (
    <div className={`bubble ${isUser ? "bubble--user" : "bubble--assistant"}`}>
      <div className={`avatar ${isUser ? 'user' : 'assistant'}`}>
        {isUser ? 'U' : 'AI'}
      </div>
      <div className="bubble__content">
        {message.content}
        <div className="bubble__meta">{new Date(message.createdAt).toLocaleTimeString()}</div>
      </div>
    </div>
  );
}

function ChatInput({ onSend, disabled }: { onSend: (text: string) => void; disabled?: boolean }): ReactElement {
  const [text, setText] = useState("");

  const send = () => {
    const v = text.trim();
    if (!v || disabled) return;
    setText("");
    onSend(v);
  };

  return (
    <div className="composer">
      <div style={{ position: 'relative' }}>
        <textarea
          rows={1}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          placeholder="Message ChatGPT..."
          className="input"
          disabled={disabled}
        />
        <button
          onClick={send}
          disabled={disabled}
          className="btn"
          aria-label="Send message"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M2 12L20 12M20 12L14 6M20 12L14 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
      <div className="composer__hint">Press Enter to send • Shift+Enter for new line</div>
    </div>
  );
}

// ---- Main ----
export default function UI(): ReactElement {
  const [dark, setDark] = useState(true);
  const [threads, setThreads] = useState<Thread[]>([seedThread()]);
  const [activeId, setActiveId] = useState<string>(threads[0].id);
  const [typing, setTyping] = useState(false);
  
  // Apply dark mode class
  useEffect(() => {
    document.body.classList.toggle('app--dark', dark);
  }, [dark]);

  const activeThread = useMemo(() => threads.find((t) => t.id === activeId)!, [threads, activeId]);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [activeThread?.messages.length, typing]);

  function createThread() {
    const t = seedThread();
    setThreads((prev) => [t, ...prev]);
    setActiveId(t.id);
  }

  function send(text: string) {
    // Optimistic user message
    const userMsg: Message = { id: newId(), role: "user", content: text, createdAt: now() };
    setThreads((prev) =>
      prev.map((t) => (t.id === activeId ? { ...t, messages: [...t.messages, userMsg], updatedAt: now() } : t))
    );

    // Fake assistant reply (bạn thay đoạn này bằng gọi API real)
    setTyping(true);
    setTimeout(() => {
      const reply: Message = {
        id: newId(),
        role: "assistant",
        content: `Bạn vừa nói: "${text}"` ,
        createdAt: now(),
      };
      setThreads((prev) =>
        prev.map((t) => (t.id === activeId ? { ...t, messages: [...t.messages, reply], updatedAt: now() } : t))
      );
      setTyping(false);
    }, 600);
  }

  return (
    <div className="app">
      <Sidebar 
        threads={threads} 
        activeId={activeId} 
        onCreate={createThread} 
        onSelect={setActiveId} 
      />
      <div className="chat">
        <div className="chat__header">
          <div className="chat__title">ChatGPT</div>
          <div>
            <button
              onClick={() => setDark((d) => !d)}
              className="btn"
              style={{ 
                background: 'transparent', 
                border: '1px solid var(--border)',
                color: 'var(--text)',
                padding: '8px 16px',
                fontSize: '14px',
                position: 'static'
              }}
            >
              {dark ? "☀️" : "🌙"}
            </button>
          </div>
        </div>

        <div ref={listRef} className="chat__list">
          {activeThread.messages.map((m) => (
            <Bubble key={m.id} message={m} />
          ))}
          {typing && (
            <div style={{ 
              color: 'var(--muted)', 
              fontSize: '14px', 
              padding: '24px 20px',
              textAlign: 'center',
              maxWidth: '4000px',
              margin: '0 auto'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <div style={{ 
                  width: '20px', 
                  height: '20px', 
                  border: '2px solid var(--muted)', 
                  borderTop: '2px solid var(--accent)',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }}></div>
                AI is typing...
              </div>
            </div>
          )}
        </div>

        <ChatInput onSend={send} />
      </div>
    </div>
  );
}
