import { Authenticated, Unauthenticated, useAction, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { SignInForm } from "./SignInForm";
import { SignOutButton } from "./SignOutButton";
import { Toaster, toast } from "sonner";
import { useState, useRef, useEffect } from "react";

export default function App() {
  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      <Authenticated>
        <ChatInterface />
      </Authenticated>
      <Unauthenticated>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center py-16 max-w-md mx-auto px-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <span className="text-white font-bold text-xl">N1</span>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Welcome to GPTNix</h2>
            <p className="text-gray-600 mb-8">
              Experience the power of Nix 1, an advanced language model designed to provide accurate, 
              insightful responses to your queries.
            </p>
            <div className="max-w-sm mx-auto">
              <SignInForm />
            </div>
          </div>
        </div>
      </Unauthenticated>
      <Toaster />
    </div>
  );
}

function ChatInterface() {
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversations, setConversations] = useState<Array<{query: string, response: string, timestamp: number}>>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const askNix = useAction(api.nix.askNix);
  const recentConversations = useQuery(api.nix.getRecentConversations);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (recentConversations) {
      setConversations(recentConversations);
    }
  }, [recentConversations]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversations, isLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isLoading) return;

    const currentQuery = query.trim();
    setQuery("");
    setIsLoading(true);

    // Add user query to conversations immediately
    const newConversation = {
      query: currentQuery,
      response: "",
      timestamp: Date.now(),
    };
    setConversations(prev => [...prev, newConversation]);

    try {
      const response = await askNix({ query: currentQuery });
      
      // Update the conversation with the response
      setConversations(prev => 
        prev.map((conv, index) => 
          index === prev.length - 1 ? { ...conv, response } : conv
        )
      );

    } catch (error) {
      toast.error("Failed to get response from Nix 1. Please try again.");
      // Remove the failed conversation
      setConversations(prev => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const startNewChat = () => {
    setConversations([]);
  };

  const clearChatHistory = () => {
    setConversations([]);
  };

  return (
    <div className="flex h-screen bg-white">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-0'} transition-all duration-300 bg-gray-900 text-white flex flex-col overflow-hidden`}>
        <div className="p-4 border-b border-gray-700 space-y-2">
          <button
            onClick={startNewChat}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>New chat</span>
          </button>
          {conversations.length > 0 && (
            <button
              onClick={clearChatHistory}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-red-800 hover:bg-red-700 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <span>Clear history</span>
            </button>
          )}
        </div>
        
        <div className="flex-1 overflow-y-auto p-2">
          <div className="space-y-1">
            {conversations.slice(-10).reverse().map((conv, index) => (
              <div key={index} className="p-3 rounded-lg hover:bg-gray-800 cursor-pointer transition-colors">
                <p className="text-sm text-gray-300 truncate">
                  {conv.query}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(conv.timestamp).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 border-t border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-xs">N1</span>
              </div>
              <span className="text-sm">GPTNix</span>
            </div>
            <SignOutButton />
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">N1</span>
              </div>
              <h1 className="text-xl font-semibold text-gray-900">Nix 1</h1>
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 && !isLoading ? (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center max-w-md">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <span className="text-white font-bold text-2xl">N1</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">How can I help you today?</h2>
                <p className="text-gray-600">
                  I'm Nix 1, ready to assist you with any questions or tasks. 
                  From complex analysis to creative solutions, just ask!
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6 p-4 pb-32">
              {conversations.map((conversation, index) => (
                <div key={index} className="space-y-4">
                  {/* User Message */}
                  <div className="flex justify-end">
                    <div className="max-w-3xl">
                      <div className="bg-blue-600 text-white rounded-2xl rounded-br-md px-4 py-3">
                        <p className="whitespace-pre-wrap">{conversation.query}</p>
                      </div>
                      <p className="text-xs text-gray-500 mt-1 text-right">
                        {new Date(conversation.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>

                  {/* AI Response */}
                  <div className="flex justify-start">
                    <div className="flex space-x-3 max-w-4xl">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                        <span className="text-white font-bold text-xs">N1</span>
                      </div>
                      <div className="flex-1">
                        {conversation.response ? (
                          <div className="bg-gray-100 rounded-2xl rounded-tl-md px-4 py-3">
                            <div className="prose prose-sm max-w-none text-gray-800">
                              {conversation.response.split('\n').map((paragraph, pIndex) => (
                                <p key={pIndex} className="mb-2 last:mb-0">
                                  {paragraph}
                                </p>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="bg-gray-100 rounded-2xl rounded-tl-md px-4 py-3">
                            <div className="flex items-center space-x-2 text-gray-600">
                              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                              <span>Thinking...</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Loading indicator for new message */}
              {isLoading && conversations.length > 0 && conversations[conversations.length - 1].response === "" && (
                <div className="flex justify-start">
                  <div className="flex space-x-3 max-w-4xl">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-bold text-xs">N1</span>
                    </div>
                    <div className="bg-gray-100 rounded-2xl rounded-tl-md px-4 py-3">
                      <div className="flex items-center space-x-2 text-gray-600">
                        <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        <span>Thinking...</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-200 p-4">
          <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
            <div className="relative flex items-end space-x-3">
              <div className="flex-1 relative">
                <textarea
                  ref={textareaRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Message Nix 1..."
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none resize-none transition-all duration-200 max-h-32 min-h-[48px]"
                  disabled={isLoading}
                  rows={1}
                  style={{ height: 'auto' }}
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = 'auto';
                    target.style.height = Math.min(target.scrollHeight, 128) + 'px';
                  }}
                />
                <button
                  type="submit"
                  disabled={!query.trim() || isLoading}
                  className="absolute right-2 bottom-2 p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">
              Press Enter to send, Shift+Enter for new line
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
