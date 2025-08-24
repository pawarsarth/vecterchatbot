import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Upload, Send, FileText, Sparkles, Bot, User, Zap, Star } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";


// ----------------------
// Types
// ----------------------
interface MessageType {
  role: "user" | "assistant";
  content: string;
}

export default function ChatPDFApp() {
  // States with proper typing
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfName, setPdfName] = useState<string>("");
  const [messages, setMessages] = useState<MessageType[]>([
    {
      role: "assistant",
      content: "👋 Welcome! Upload a PDF and I'll help you explore its contents with AI-powered insights.",
    },
  ]);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isAsking, setIsAsking] = useState<boolean>(false);
  const [question, setQuestion] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);

  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Auto-scroll to the latest message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isAsking]);

  // ----------------------
  // Drag and Drop Handlers
  // ----------------------
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0].type === "application/pdf") {
      setPdfFile(files[0]);
    }
  };

  // ----------------------
  // Upload PDF
  // ----------------------
  const handleUpload = async () => {
    if (!pdfFile) {
      setError("Please select a PDF file first.");
      return;
    }
    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
formData.append("pdf", pdfFile);

await axios.post(`${API_BASE}/upload`, formData, {
  headers: { "Content-Type": "multipart/form-data" },
});


      setPdfName(pdfFile.name);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `✅ Successfully indexed: **${pdfFile.name}**. I'm ready to answer your questions!`,
        },
      ]);
      setPdfFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err: any) {
      console.error(err);
      setError("Failed to upload PDF. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  // ----------------------
  // Ask Question
  // ----------------------
  const askQuestion = async () => {
    if (!question.trim()) return;

    const q = question.trim();
    setMessages((prev) => [...prev, { role: "user", content: q }]);
    setQuestion("");
    setIsAsking(true);

    try {
      const res = await axios.post(`${API_BASE}/ask`, { question: q });
      const answer = res.data?.answer || "⚠️ No response received.";
      setMessages((prev) => [...prev, { role: "assistant", content: answer }]);
    } catch (err: any) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "⚠️ Error fetching answer. Please try again.",
        },
      ]);
    } finally {
      setIsAsking(false);
    }
  };

  // ----------------------
  // Component JSX
  // ----------------------
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 animate-gradient"></div>
      
      {/* Floating Particles */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="particle animate-particle"></div>
        <div className="particle animate-particle"></div>
        <div className="particle animate-particle"></div>
        <div className="particle animate-particle"></div>
      </div>

      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-r from-emerald-500/20 to-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-blue-500/10 to-emerald-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '0.5s' }}></div>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 glass-dark shadow-2xl">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="relative animate-float">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-blue-500 rounded-2xl flex items-center justify-center animate-glow">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-3xl font-bold gradient-text">
                  PDF AI Assistant
                </h1>
                <p className="text-sm text-slate-400 flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  Powered by Advanced AI
                </p>
              </div>
            </div>
            <div className="glass rounded-full px-6 py-3 flex items-center gap-3 animate-fade-in-up">
              <FileText className="w-5 h-5 text-emerald-400" />
              <span className="text-white font-medium">
                {pdfName || "No PDF uploaded"}
              </span>
              {pdfName && <Star className="w-4 h-4 text-yellow-400" />}
            </div>
          </div>
        </div>
      </header>

      {/* Body */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-6 flex gap-8 relative z-10 min-h-[calc(100vh-100px)]">
        {/* Sidebar */}
        <aside className="w-80 space-y-6 animate-fade-in-up">
          {/* Upload Section */}
          <div className="glass rounded-3xl p-6 shadow-2xl hover:shadow-emerald-500/20 transition-all duration-500 transform hover:scale-105">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-blue-500 rounded-xl flex items-center justify-center">
                <Upload className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl font-bold text-white">Upload PDF</h2>
            </div>
            
            {/* Drag and Drop Area */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition-all duration-500 group ${
                isDragOver
                  ? "border-emerald-400 bg-emerald-400/10 scale-105 shadow-lg shadow-emerald-500/25"
                  : "border-slate-600 hover:border-emerald-500 hover:bg-emerald-500/5"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  if (e.target.files) setPdfFile(e.target.files[0]);
                }}
                className="hidden"
              />
              
              <div className="space-y-4">
                <div className={`mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 to-blue-500 flex items-center justify-center transition-all duration-500 group-hover:scale-110 ${
                  isDragOver ? "scale-125 animate-pulse" : ""
                }`}>
                  <FileText className="w-10 h-10 text-white" />
                </div>
                <div>
                  <p className="text-white font-semibold text-lg">
                    {pdfFile ? pdfFile.name : "Drop your PDF here"}
                  </p>
                  <p className="text-slate-400 text-sm mt-2">
                    or click to browse files
                  </p>
                </div>
              </div>
              
              {/* Shimmer effect */}
              <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                <div className="absolute inset-0 rounded-3xl animate-shimmer"></div>
              </div>
            </div>

            <button
              onClick={handleUpload}
              disabled={!pdfFile || isUploading}
              className="mt-6 w-full btn-primary py-4 rounded-2xl font-bold text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-emerald-500/50 focus-ring"
            >
              {isUploading ? (
                <div className="flex items-center justify-center gap-3">
                  <div className="w-5 h-5 spinner"></div>
                  <span>Processing...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-3">
                  <Sparkles className="w-5 h-5" />
                  <span>Upload & Index</span>
                </div>
              )}
            </button>

            {error && (
              <div className="mt-4 p-4 bg-red-500/20 border border-red-500/30 rounded-2xl animate-fade-in-up">
                <p className="text-red-300 text-sm font-medium">{error}</p>
              </div>
            )}
          </div>

          {/* Tips Section */}
          <div className="glass rounded-3xl p-6 shadow-2xl animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              AI Tips
            </h3>
            <div className="space-y-4 text-sm text-slate-300">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/30 hover:bg-slate-800/50 transition-colors duration-300">
                <div className="w-3 h-3 bg-emerald-400 rounded-full mt-1 flex-shrink-0 animate-pulse"></div>
                <p>Ask specific questions about the content</p>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/30 hover:bg-slate-800/50 transition-colors duration-300">
                <div className="w-3 h-3 bg-blue-400 rounded-full mt-1 flex-shrink-0 animate-pulse" style={{ animationDelay: '0.5s' }}></div>
                <p>Request summaries of sections or chapters</p>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/30 hover:bg-slate-800/50 transition-colors duration-300">
                <div className="w-3 h-3 bg-purple-400 rounded-full mt-1 flex-shrink-0 animate-pulse" style={{ animationDelay: '1s' }}></div>
                <p>Ask for explanations of complex topics</p>
              </div>
            </div>
          </div>
        </aside>

        {/* Chat Section */}
        <section className="flex-1 glass rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-custom">
            {messages.map((msg, idx) => (
              <Message key={idx} role={msg.role} content={msg.content} index={idx} />
            ))}
            {isAsking && <TypingLoader />}
            <div ref={chatEndRef} />
          </div>

          {/* Input Section */}
          <div className="p-6 border-t border-slate-700/50 glass-dark">
            <div className="flex gap-4 items-end">
              <div className="flex-1 relative">
                <textarea
                  rows={1}
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Ask me anything about your PDF..."
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      askQuestion();
                    }
                  }}
                  className="w-full resize-none rounded-2xl glass border border-slate-600/50 px-6 py-4 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 placeholder-slate-400 text-white transition-all duration-300 focus-ring"
                  style={{ minHeight: "56px" }}
                />
              </div>
              <button
                onClick={askQuestion}
                disabled={isAsking || !question.trim()}
                className="btn-primary p-4 rounded-2xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-110 active:scale-95 shadow-lg hover:shadow-emerald-500/50 focus-ring"
              >
                <Send className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

// ----------------------
// Message Component
// ----------------------
interface MessageProps {
  role: "user" | "assistant";
  content: string;
  index: number;
}

function Message({ role, content, index }: MessageProps) {
  const isUser = role === "user";
  
  return (
    <div 
      className={`flex gap-4 animate-fade-in-up ${isUser ? "justify-end" : "justify-start"}`}
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      {!isUser && (
        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-blue-500 flex items-center justify-center shadow-lg animate-glow">
          <Bot className="w-6 h-6 text-white" />
        </div>
      )}
      
      <div
        className={`max-w-[80%] rounded-3xl px-6 py-4 shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105 ${
          isUser
            ? "message-user text-white ml-12"
            : "message-assistant text-slate-100"
        }`}
      >
        <ReactMarkdown
          components={{
            code({ inline, className, children, ...props }: any) {
              const match = /language-(\w+)/.exec(className || "");
              return !inline && match ? (
                <div className="my-4 rounded-xl overflow-hidden shadow-lg">
                  <SyntaxHighlighter
                    {...props}
                    style={vscDarkPlus}
                    language={match[1]}
                    PreTag="div"
                  >
                    {String(children).replace(/\n$/, "")}
                  </SyntaxHighlighter>
                </div>
              ) : (
                <code
                  className="bg-slate-700/50 px-2 py-1 rounded-lg text-emerald-300 font-mono text-sm"
                  {...props}
                >
                  {children}
                </code>
              );
            },
            p: ({ children }) => <p className="mb-3 last:mb-0 leading-relaxed">{children}</p>,
            strong: ({ children }) => <strong className="text-emerald-300 font-semibold">{children}</strong>,
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
      
      {isUser && (
        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg animate-glow">
          <User className="w-6 h-6 text-white" />
        </div>
      )}
    </div>
  );
}

// ----------------------
// Typing Loader
// ----------------------
function TypingLoader() {
  return (
    <div className="flex gap-4 animate-fade-in-up">
      <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-blue-500 flex items-center justify-center shadow-lg animate-glow">
        <Bot className="w-6 h-6 text-white" />
      </div>
      <div className="message-assistant rounded-3xl px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex gap-1">
            <span className="h-3 w-3 bg-emerald-400 rounded-full animate-bounce"></span>
            <span className="h-3 w-3 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></span>
            <span className="h-3 w-3 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
          </div>
          <span className="ml-2 text-slate-300 text-sm font-medium">AI is thinking...</span>
        </div>
      </div>
    </div>
  );
}