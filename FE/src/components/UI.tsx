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
        {message.files && message.files.length > 0 && (
          <div className="bubble__files">
            {message.files.map((file, index) => (
              <div key={index} className="bubble__file">
                <div className="bubble__file-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.89 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div className="bubble__file-info">
                  <div className="bubble__file-name">{file.name}</div>
                  <div className="bubble__file-size">{(file.size / 1024).toFixed(1)} KB</div>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="bubble__meta">{new Date(message.createdAt).toLocaleTimeString()}</div>
      </div>
    </div>
  );
}

function ChatInput({ onSend, disabled }: { onSend: (text: string, files?: File[]) => void; disabled?: boolean }): ReactElement {
  const [text, setText] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const send = () => {
    const v = text.trim();
    if ((!v && selectedFiles.length === 0) || disabled) return;
    const messageText = v || (selectedFiles.length > 0 ? `Đã gửi ${selectedFiles.length} tệp` : "");
    setText("");
    setSelectedFiles([]);
    onSend(messageText, selectedFiles);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setSelectedFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="composer">
      {selectedFiles.length > 0 && (
        <div className="composer__files">
          {selectedFiles.map((file, index) => (
            <div key={index} className="composer__file-item">
              <span className="composer__file-name">{file.name}</span>
              <button 
                onClick={() => removeFile(index)}
                className="composer__file-remove"
                aria-label="Remove file"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
      
      <div className="composer__input-container">
        <button
          onClick={openFileDialog}
          disabled={disabled}
          className="btn btn--file btn--file-left"
          aria-label="Add file"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.89 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M16 13H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M16 17H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M10 9H9H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        
        <div style={{ position: 'relative', flex: 1 }}>
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
      </div>
      
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileSelect}
        style={{ display: 'none' }}
        accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif"
      />
      
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

  function send(text: string, files?: File[]) {
    // Optimistic user message
    const userMsg: Message = { 
      id: newId(), 
      role: "user", 
      content: text, 
      createdAt: now(),
      files: files || []
    };
    setThreads((prev) =>
      prev.map((t) => (t.id === activeId ? { ...t, messages: [...t.messages, userMsg], updatedAt: now() } : t))
    );

    // Fake assistant reply (bạn thay đoạn này bằng gọi API real)
    setTyping(true);
    setTimeout(() => {
      const fileInfo = files && files.length > 0 ? ` và ${files.length} tệp đính kèm` : "";
      const reply: Message = {
        id: newId(),
        role: "assistant",
        content: `Bạn vừa nói: "${text}"${fileInfo}`,
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
