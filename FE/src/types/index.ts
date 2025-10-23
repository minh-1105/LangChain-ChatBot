// ---- Types ----
export type Message = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: string;
};

export type Thread = {
  id: string;
  title: string;
  updatedAt: string;
  messages: Message[];
};
