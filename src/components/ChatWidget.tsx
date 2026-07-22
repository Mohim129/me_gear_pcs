"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { usePathname, useParams } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { useChatStore, Message } from "@/store/chat";
import { toast } from "sonner";
import {
  MessageSquare,
  X,
  Send,
  Sparkles,
  User,
  Bot,
  Loader2,
  Trash2
} from "lucide-react";

// Generate contextual follow-up prompts based on the last AI message
function getFollowUpPrompts(lastAssistantMsg: string, pageContext: string): string[] {
  const prompts: string[] = [];
  const lower = lastAssistantMsg.toLowerCase();

  // Context-aware prompts
  if (lower.includes("cpu") || lower.includes("processor")) {
    prompts.push("What cooler pairs best with this CPU?");
    prompts.push("Compare this with an Intel alternative");
  }
  if (lower.includes("gpu") || lower.includes("graphics")) {
    prompts.push("What PSU wattage do I need for this GPU?");
    prompts.push("Is this GPU good for 1440p gaming?");
  }
  if (lower.includes("motherboard") || lower.includes("mobo")) {
    prompts.push("What RAM is compatible with this board?");
    prompts.push("Does this motherboard support Wi-Fi?");
  }
  if (lower.includes("ram") || lower.includes("memory")) {
    prompts.push("How much RAM do I need for gaming?");
    prompts.push("DDR4 vs DDR5 — which should I pick?");
  }
  if (lower.includes("budget") || lower.includes("price") || lower.includes("bdt") || lower.includes("৳")) {
    prompts.push("Can you suggest a cheaper alternative?");
    prompts.push("What's the best value for money option?");
  }
  if (lower.includes("gaming")) {
    prompts.push("What FPS can I expect in AAA titles?");
    prompts.push("Suggest peripherals for a gaming setup");
  }
  if (lower.includes("build") || lower.includes("pc builder")) {
    prompts.push("Check compatibility of my build");
    prompts.push("Take me to the PC Builder");
  }

  // Generic fallbacks if nothing matched
  if (prompts.length === 0) {
    prompts.push("Tell me more about this");
    prompts.push("Suggest a component for my build");
    prompts.push("What are the best sellers?");
  }

  // Limit to 3 prompts
  return prompts.slice(0, 3);
}

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const pathname = usePathname();
  const params = useParams();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Enable mouse-wheel horizontal scrolling on suggestion containers
  const handleWheelScroll = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    if (container.scrollWidth > container.clientWidth) {
      e.preventDefault();
      container.scrollLeft += e.deltaY;
    }
  }, []);
  
  const { data: session } = useSession();
  const isLoggedIn = !!session;

  const {
    messages,
    sessionId,
    isLoading,
    isStreaming,
    initializeSession,
    addMessage,
    updateLastAssistantMessage,
    setIsStreaming,
    fetchHistory,
    clearHistory
  } = useChatStore();

  // Initialize guest session and load history once
  useEffect(() => {
    initializeSession();
  }, [initializeSession]);

  // Load history when panel opens or login status changes
  useEffect(() => {
    if (isOpen) {
      fetchHistory(isLoggedIn);
    }
  }, [isOpen, isLoggedIn, fetchHistory]);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isStreaming]);

  const getPageContext = () => {
    if (pathname.startsWith("/products/") && params.id) {
      return { page: "product", productId: params.id as string };
    }
    if (pathname === "/pc-builder") {
      return { page: "pc-builder" };
    }
    if (pathname === "/cart") {
      return { page: "cart" };
    }
    if (pathname === "/") {
      return { page: "home" };
    }
    return { page: "navigation", path: pathname };
  };

  const handleSend = async (textToSend: string) => {
    const trimmed = textToSend.trim();
    if (!trimmed || isStreaming) return;

    setInput("");

    // Append user message
    const userMsg: Message = { role: "user", content: trimmed };
    addMessage(userMsg);

    setIsStreaming(true);

    try {
      const context = getPageContext();
      
      // Get history (excluding the current user message)
      const chatHistory = [...messages];

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: trimmed,
          history: chatHistory,
          context,
          sessionId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to connect to assistant");
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("Response body is not readable");
      }

      const decoder = new TextDecoder();
      let done = false;
      let replyAccumulator = "";

      // Add placeholder assistant message
      addMessage({ role: "assistant", content: "" });

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        if (value) {
          const chunk = decoder.decode(value);
          replyAccumulator += chunk;
          updateLastAssistantMessage(replyAccumulator);
        }
      }
    } catch (error: any) {
      console.error("Chat error:", error);
      toast.error(error.message || "Failed to get AI recommendation.");
      addMessage({
        role: "assistant",
        content: "Sorry, I am experiencing service issues connecting with the AI engine. Please try again in a few moments."
      });
    } finally {
      setIsStreaming(false);
    }
  };

  const suggestions = [
    "Suggest a balanced gaming PC",
    "What motherboard fits AMD Ryzen 7 7800X3D?",
    "Explain difference between SSD and HDD",
    "Tell me about store support and warranty"
  ];

  return (
    <>
      {/* Floating Chat Bubble Icon */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-rust-copper text-white shadow-lg shadow-rust-copper/20 transition-all duration-300 hover:bg-rust-copper/90 hover:scale-105 active:scale-95 focus:outline-none cursor-pointer ${
          isOpen ? "scale-0 opacity-0 pointer-events-none" : "scale-100 opacity-100"
        }`}
        aria-label="Open chat assistant"
      >
        <MessageSquare className="h-6 w-6" />
        <span className="absolute -top-1 -right-1 flex h-4 w-4">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75"></span>
          <span className="relative inline-flex h-4 w-4 rounded-full bg-amber-500 text-[10px] font-bold text-slate-900 justify-center items-center">AI</span>
        </span>
      </button>

      {/* Slide-out Backdrop Overlay */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/20 backdrop-blur-xs transition-opacity duration-300"
        />
      )}

      {/* Chat Slide-out Panel */}
      <div
        className={`fixed top-0 right-0 z-50 h-screen w-full sm:w-[420px] bg-white dark:bg-zinc-900 shadow-2xl border-l border-gray-200 dark:border-zinc-800 flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200/80 dark:border-zinc-800 bg-slate-gray text-white">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-rust-copper animate-pulse" />
            <div>
              <h2 className="font-heading font-bold text-base leading-none">TechBuddy</h2>
              <span className="text-[10px] text-gray-300">MEG PCs AI Assistant</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                clearHistory();
                toast.info("Conversation history cleared locally");
              }}
              className="text-gray-300 hover:text-white p-1 transition-colors cursor-pointer"
              title="Clear Conversation"
            >
              <Trash2 className="h-4.5 w-4.5" />
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-300 hover:text-white p-1 transition-colors cursor-pointer"
              title="Close panel"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Message Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/50 dark:bg-zinc-950/20">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 px-4 py-8">
              <div className="h-14 w-14 rounded-full bg-rust-copper/10 flex items-center justify-center text-rust-copper">
                <Bot className="h-7 w-7" />
              </div>
              <div>
                <h3 className="font-heading font-semibold text-slate-900 dark:text-zinc-200">Welcome to MEG PCs Support!</h3>
                <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1 max-w-[280px]">
                  Hi, I'm TechBuddy. Ask me anything about components, custom build compatibilities, specs, or product comparisons!
                </p>
              </div>
            </div>
          ) : (
            messages.map((msg, index) => (
              <div
                key={index}
                className={`flex gap-3 max-w-[85%] ${
                  msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
                }`}
              >
                {/* Avatar Icon */}
                <div
                  className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 text-white ${
                    msg.role === "user" ? "bg-slate-gray" : "bg-rust-copper"
                  }`}
                >
                  {msg.role === "user" ? (
                    <User className="h-4 w-4" />
                  ) : (
                    <Bot className="h-4 w-4" />
                  )}
                </div>

                {/* Bubble Message */}
                <div className="space-y-1">
                  <div
                    className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-slate-gray text-white rounded-tr-none"
                        : "bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 border border-gray-200/80 dark:border-zinc-700/80 rounded-tl-none shadow-xs"
                    }`}
                  >
                    {msg.content ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap font-sans">
                        {msg.content}
                      </div>
                    ) : (
                      // Bouncing Typing dots (while streaming content is incoming)
                      <div className="flex items-center gap-1 py-1">
                        <span className="h-2 w-2 rounded-full bg-rust-copper animate-bounce" style={{ animationDelay: "0ms" }}></span>
                        <span className="h-2 w-2 rounded-full bg-rust-copper animate-bounce" style={{ animationDelay: "150ms" }}></span>
                        <span className="h-2 w-2 rounded-full bg-rust-copper animate-bounce" style={{ animationDelay: "300ms" }}></span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
          
          {/* Active Streaming Typing Indicator */}
          {isStreaming && messages[messages.length - 1]?.content !== "" && (
            <div className="flex gap-3 mr-auto max-w-[85%]">
              <div className="h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 text-white bg-rust-copper">
                <Bot className="h-4 w-4" />
              </div>
              <div className="px-4 py-2.5 bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 border border-gray-200/80 dark:border-zinc-700/80 rounded-2xl rounded-tl-none shadow-xs">
                <div className="flex items-center gap-1 py-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-rust-copper animate-bounce" style={{ animationDelay: "0ms" }}></span>
                  <span className="h-1.5 w-1.5 rounded-full bg-rust-copper animate-bounce" style={{ animationDelay: "150ms" }}></span>
                  <span className="h-1.5 w-1.5 rounded-full bg-rust-copper animate-bounce" style={{ animationDelay: "300ms" }}></span>
                </div>
              </div>
            </div>
          )}

          {/* Dynamic Follow-up Prompts (shown after the last AI response) */}
          {!isStreaming && messages.length > 0 && messages[messages.length - 1]?.role === "assistant" && messages[messages.length - 1]?.content && (
            <div className="flex flex-wrap gap-1.5 mt-1 ml-11">
              {getFollowUpPrompts(messages[messages.length - 1].content, pathname).map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(prompt)}
                  className="inline-flex items-center px-2.5 py-1 rounded-lg border border-rust-copper/30 bg-rust-copper/5 text-[11px] text-rust-copper font-medium hover:bg-rust-copper/15 hover:border-rust-copper/50 transition-all cursor-pointer"
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggestion Pills (static, always visible when not streaming) */}
        {!isStreaming && (
          <>
            <style>{`
              .chat-suggestions-scroll::-webkit-scrollbar { height: 4px; }
              .chat-suggestions-scroll::-webkit-scrollbar-track { background: transparent; border-radius: 999px; }
              .chat-suggestions-scroll::-webkit-scrollbar-thumb { background: #D35400; border-radius: 999px; }
              .chat-suggestions-scroll::-webkit-scrollbar-thumb:hover { background: #e05d0a; }
            `}</style>
            <div
              ref={suggestionsRef}
              onWheel={handleWheelScroll}
              className="chat-suggestions-scroll px-6 py-2 pb-3 bg-gray-50/50 dark:bg-zinc-950/20 border-t border-gray-100 dark:border-zinc-850 flex gap-2 overflow-x-auto"
              style={{ scrollbarWidth: "thin", scrollbarColor: "#D35400 transparent" }}
            >
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(s)}
                  className="inline-flex items-center px-3 py-1.5 rounded-full border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-slate-900 dark:text-zinc-300 font-medium hover:border-rust-copper/50 hover:text-rust-copper hover:bg-warm-cream/20 transition-all flex-shrink-0 cursor-pointer"
                >
                  {s}
                </button>
              ))}
            </div>
          </>
        )}

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend(input);
          }}
          className="p-4 border-t border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex gap-2 items-center"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isStreaming}
            placeholder={isStreaming ? "TechBuddy is thinking..." : "Ask TechBuddy a question..."}
            className="flex-1 rounded-xl border border-gray-350 dark:border-zinc-700 bg-white dark:bg-zinc-850 px-4 py-2.5 text-sm text-slate-900 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-rust-copper/50 focus:border-rust-copper transition-all disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || isStreaming}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-rust-copper text-white shadow-xs hover:bg-rust-copper/90 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex-shrink-0"
          >
            {isStreaming ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </button>
        </form>
      </div>
    </>
  );
}
