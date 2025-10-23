// ---- Types ----
export type Message = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: string;
  files?: File[];
};

export type Thread = {
  id: string;
  title: string;
  updatedAt: string;
  messages: Message[];
};
