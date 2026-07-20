import { create } from "zustand";

export interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ChatState {
  messages: Message[];
  sessionId: string;
  isLoading: boolean;
  isStreaming: boolean;
  setSessionId: (id: string) => void;
  initializeSession: () => void;
  addMessage: (message: Message) => void;
  updateLastAssistantMessage: (text: string) => void;
  setIsStreaming: (streaming: boolean) => void;
  fetchHistory: (isLoggedIn: boolean) => Promise<void>;
  clearHistory: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  sessionId: "",
  isLoading: false,
  isStreaming: false,

  setSessionId: (id) => set({ sessionId: id }),

  initializeSession: () => {
    if (typeof window !== "undefined") {
      let id = localStorage.getItem("chat_session_id");
      if (!id) {
        id = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        localStorage.setItem("chat_session_id", id);
      }
      set({ sessionId: id });
    }
  },

  addMessage: (msg) => {
    set((state) => ({ messages: [...state.messages, msg] }));
  },

  updateLastAssistantMessage: (text) => {
    set((state) => {
      const history = [...state.messages];
      if (history.length > 0 && history[history.length - 1].role === "assistant") {
        const updated = [...history];
        updated[updated.length - 1] = {
          ...updated[updated.length - 1],
          content: text
        };
        return { messages: updated };
      } else {
        return { messages: [...history, { role: "assistant", content: text }] };
      }
    });
  },

  setIsStreaming: (streaming) => set({ isStreaming: streaming }),

  fetchHistory: async (isLoggedIn) => {
    let currentSessionId = get().sessionId;
    
    // Ensure sessionId is initialized if we are a guest
    if (!currentSessionId && !isLoggedIn && typeof window !== "undefined") {
      let id = localStorage.getItem("chat_session_id");
      if (!id) {
        id = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        localStorage.setItem("chat_session_id", id);
      }
      currentSessionId = id;
      set({ sessionId: id });
    }

    set({ isLoading: true });
    try {
      const url = isLoggedIn 
        ? "/api/conversations" 
        : `/api/conversations?sessionId=${currentSessionId}`;
      
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.messages)) {
          set({ messages: data.messages.map((m: any) => ({ role: m.role, content: m.content })) });
        }
      }
    } catch (e) {
      console.error("Failed to fetch chat history:", e);
    } finally {
      set({ isLoading: false });
    }
  },

  clearHistory: () => set({ messages: [] }),
}));
