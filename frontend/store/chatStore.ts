import { create } from 'zustand';

interface Message {
  id: string;
  userId: string;
  username: string;
  color: string;
  content: string;
  type: 'text' | 'system';
  timestamp: string;
}

interface ChatStore {
  messages: Message[];
  typingUsers: Record<string, string>;
  addMessage: (msg: Message) => void;
  setTyping: (userId: string, username: string, isTyping: boolean) => void;
  clearMessages: () => void;
}

export const useChatStore = create<ChatStore>((set) => ({
  messages: [],
  typingUsers: {},
  addMessage: (msg) =>
    set((s) => ({ messages: [...s.messages.slice(-200), msg] })),
  setTyping: (userId, username, isTyping) =>
    set((s) => {
      if (isTyping) return { typingUsers: { ...s.typingUsers, [userId]: username } };
      const { [userId]: _, ...rest } = s.typingUsers;
      return { typingUsers: rest };
    }),
  clearMessages: () => set({ messages: [] }),
}));
