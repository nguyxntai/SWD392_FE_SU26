import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Loader2, Sparkles, AlertCircle } from "lucide-react";
import { chatWithAi } from "@/services/ragService";
import { RagCitation } from "@/types/rag";
import { getApiErrorMessage } from "@/services/apiError";
import { toast } from "sonner";
import { Navigation } from "@/components/Navigation";

interface ChatMessage {
  id: string;
  role: "user" | "ai";
  content: string;
  citations?: RagCitation[];
  isError?: boolean;
}

const QUICK_QUESTIONS = [
  "Sản phẩm nào gần hết hàng?",
  "Tôi có 7k nên mua gì?",
  "Milk và alo cái nào rẻ hơn?",
  "Tồn kho hiện tại thế nào?",
];

export function AiChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSend = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: text.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const result = await chatWithAi({ message: text.trim(), topK: 5 });
      
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "ai",
        content: result.answer,
        citations: result.citations,
      };
      
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to get response from AI"));
      
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "ai",
        content: "Sorry, I encountered an error while processing your request.",
        isError: true,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSend(input);
  };

  return (
    <div className="min-h-screen bg-muted/30 pt-20 flex flex-col">
      <Navigation />
      
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 md:p-6 flex flex-col h-[calc(100vh-5rem)]">
        <div className="bg-background rounded-2xl shadow-sm border border-border flex flex-col h-full overflow-hidden">
          
          {/* Header */}
          <div className="p-4 border-b border-border bg-muted/10 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Bot size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">AI Assistant</h1>
              <p className="text-sm text-muted-foreground">Ask questions about store data, inventory, and sales.</p>
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-6 animate-fade-in">
                <div className="w-20 h-20 bg-primary/5 rounded-full flex items-center justify-center text-primary mb-4">
                  <Sparkles size={40} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-2">How can I help you today?</h2>
                  <p className="text-muted-foreground max-w-md">
                    I can analyze your store's data, check inventory levels, and summarize sales reports.
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-2xl mt-8">
                  {QUICK_QUESTIONS.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => handleSend(q)}
                      className="p-4 border border-border rounded-xl text-left hover:bg-muted/50 hover:border-primary/50 transition-all group"
                    >
                      <p className="font-medium text-foreground group-hover:text-primary transition-colors">{q}</p>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-4 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"} animate-fade-in`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  }`}>
                    {msg.role === "user" ? <User size={16} /> : <Bot size={16} />}
                  </div>
                  
                  <div className={`max-w-[80%] space-y-2 ${msg.role === "user" ? "items-end" : "items-start"}`}>
                    <div className={`p-4 rounded-2xl ${
                      msg.role === "user" 
                        ? "bg-primary text-primary-foreground rounded-tr-sm" 
                        : msg.isError
                          ? "bg-destructive/10 text-destructive border border-destructive/20 rounded-tl-sm"
                          : "bg-muted/30 border border-border rounded-tl-sm"
                    }`}>
                      {msg.isError && <AlertCircle size={16} className="inline mr-2 mb-1" />}
                      <span className="whitespace-pre-wrap leading-relaxed">{msg.content}</span>
                    </div>

                    {/* Citations */}
                    {msg.citations && msg.citations.length > 0 && (
                      <div className="mt-2 space-y-2">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Nguồn dữ liệu:</p>
                        <div className="flex flex-wrap gap-2">
                          {msg.citations.map((cit, idx) => (
                            <div key={idx} className="group relative">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20 cursor-help">
                                [{idx + 1}] {cit.title}
                              </span>
                              <div className="absolute bottom-full left-0 mb-2 w-64 p-3 bg-popover border border-border rounded-xl shadow-xl text-sm text-popover-foreground opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                                <p className="font-semibold mb-1">{cit.title} <span className="text-muted-foreground text-xs font-normal">({cit.type})</span></p>
                                <p className="text-muted-foreground line-clamp-3">{cit.contentSnippet}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
            
            {isLoading && (
              <div className="flex gap-4 flex-row animate-pulse">
                <div className="w-8 h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center shrink-0">
                  <Bot size={16} />
                </div>
                <div className="bg-muted/30 border border-border p-4 rounded-2xl rounded-tl-sm flex items-center gap-2">
                  <Loader2 size={16} className="animate-spin text-primary" />
                  <span className="text-muted-foreground text-sm">Thinking...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-border bg-background">
            <form onSubmit={handleSubmit} className="relative flex items-end gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
                placeholder="Ask about inventory, sales, products..."
                className="w-full max-h-32 min-h-[56px] resize-none rounded-xl border border-border bg-muted/10 p-4 pr-14 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                rows={1}
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="absolute right-2 bottom-2 h-10 w-10 flex items-center justify-center rounded-lg bg-primary text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send size={18} className={input.trim() && !isLoading ? "translate-x-0.5 -translate-y-0.5 transition-transform" : ""} />
              </button>
            </form>
            <p className="text-xs text-center text-muted-foreground mt-3">
              AI can make mistakes. Verify important data.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
