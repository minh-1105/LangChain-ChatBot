// API service để kết nối với backend
const API_BASE_URL = 'http://127.0.0.1:8000';

export interface Thread {
  id: string;
  title: string;
  updatedAt: string;
  messages: Message[];
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: string;
  files?: File[];
}

// API functions
export const api = {
  // Health check
  async health(): Promise<{ ok: boolean }> {
    const response = await fetch(`${API_BASE_URL}/health`);
    return response.json();
  },

  // Tạo thread mới
  async createThread(title: string): Promise<{ id: string }> {
    console.log('Creating thread:', title);
    const response = await fetch(`${API_BASE_URL}/threads`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title }),
    });
    const result = await response.json();
    console.log('Thread created:', result);
    return result;
  },

  // Thêm message
  async addMessage(threadId: string, role: string, content: string): Promise<{ ok: boolean }> {
    console.log('Adding message:', { threadId, role, content });
    const response = await fetch(`${API_BASE_URL}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ threadId, role, content }),
    });
    const result = await response.json();
    console.log('Message added:', result);
    return result;
  },

  // Lấy messages của thread
  async getMessages(threadId: string, beforeId?: string, limit: number = 50): Promise<Message[]> {
    let url = `${API_BASE_URL}/threads/${threadId}/messages?limit=${limit}`;
    if (beforeId) {
      url += `&before_id=${beforeId}`;
    }
    const response = await fetch(url);
    return response.json();
  },

  // Cập nhật tên thread
  async updateThreadTitle(threadId: string, title: string): Promise<{ ok: boolean }> {
    console.log('Updating thread title:', { threadId, title });
    const response = await fetch(`${API_BASE_URL}/threads/${threadId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title }),
    });
    const result = await response.json();
    console.log('Thread title updated:', result);
    return result;
  },

  // Lấy tất cả threads từ database
  async getAllThreads(): Promise<Thread[]> {
    try {
      console.log('Loading threads from database...');
      
      // Lấy danh sách threads từ API
      const response = await fetch(`${API_BASE_URL}/threads`);
      const threads = await response.json();
      console.log('Threads loaded:', threads);
      
      // Load messages cho mỗi thread
      const threadsWithMessages = await Promise.all(
        threads.map(async (thread: any) => {
          const messages = await this.getMessages(thread.id);
          return {
            id: thread.id,
            title: thread.title,
            updatedAt: thread.updatedAt,
            messages: messages
          };
        })
      );
      
      return threadsWithMessages;
    } catch (error) {
      console.error('Error loading threads:', error);
      return [];
    }
  }
};
