// ---- Helpers ----
export const now = () => new Date().toISOString();
export const newId = () => Math.random().toString(36).slice(2);

// ---- Seed data ----
export const seedThread = (): Thread => ({
  id: newId(),
  title: "New chat",
  updatedAt: now(),
  messages: [
    { id: newId(), role: "assistant", content: "Xin chào 👋\nMình là AI Assistant. Hãy hỏi mình điều gì đó!", createdAt: now() },
  ],
});

import type { Thread } from '../types';
