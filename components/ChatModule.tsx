
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Chat } from "@google/genai";
import { BookRecord } from '../types';
import SearchModule from './SearchModule';
import { getChatHistory, saveChatHistory, clearChatHistory, ChatMessage } from '../services/storage';
import { 
  Send, 
  Bot, 
  User, 
  Loader2, 
  MessageSquare, 
  Search as SearchIcon, 
  ArrowRight, 
  BookOpen,
  Trash2,
  RefreshCw,
  ToggleLeft,
  ToggleRight,
  Sparkles
} from 'lucide-react';

interface Props {
  books: BookRecord[];
  onViewDetail: (book: BookRecord) => void;
  systemPrompt: string;
}

const ChatModule: React.FC<Props> = ({ books, onViewDetail, systemPrompt }) => {
  const [activeTab, setActiveTab] = useState<'chat' | 'search'>('chat');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(true); // Toggle state for linked books
  const scrollRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<Chat | null>(null);

  // Initialize history and Gemini Chat instance
  useEffect(() => {
    const history = getChatHistory();
    if (history.length === 0) {
      const initialMessage: ChatMessage = {
        role: 'model',
        text: 'Xin chào! Tôi là trợ lý Thư viện thông minh Lê Quý Đôn. Tôi có thể giúp bạn tìm sách, gợi ý các tựa sách hay, hoặc cung cấp thông tin mượn sách. Bạn đang quan tâm đến chủ đề gì?',
        timestamp: new Date().toISOString()
      };
      setMessages([initialMessage]);
      saveChatHistory([initialMessage]);
    } else {
      setMessages(history);
    }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const catalogSnippet = books.map(b => `- [ID: ${b.id}] ${b.title} của ${b.author}`).join('\n');
    
    chatRef.current = ai.chats.create({
      model: 'gemini-3-flash-preview',
      config: {
        systemInstruction: `${systemPrompt}\n\nKhi nhắc đến một cuốn sách cụ thể, hãy LUÔN LUÔN kèm theo [ID: mã-sách] của nó để tôi có thể hiển thị thông tin chi tiết cho người dùng.\n\nDanh mục sách hiện có:\n${catalogSnippet}`,
      },
      // Pass stored history to maintain context on refresh
      history: history.map(m => ({ role: m.role, parts: [{ text: m.text }] }))
    });
  }, [books, systemPrompt]);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading, activeTab]);

  const handleSend = async () => {
    if (!input.trim() || isLoading || !chatRef.current) return;

    const userMessage: ChatMessage = { 
      role: 'user', 
      text: input, 
      timestamp: new Date().toISOString() 
    };
    
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    saveChatHistory(updatedMessages);
    setInput('');
    setIsLoading(true);

    try {
      const result = await chatRef.current.sendMessage({ message: input });
      const botMessage: ChatMessage = {
        role: 'model',
        text: result.text || 'Lỗi xử lý.',
        timestamp: new Date().toISOString()
      };
      
      const finalMessages = [...updatedMessages, botMessage];
      setMessages(finalMessages);
      saveChatHistory(finalMessages);
    } catch (error) {
      const errorMessage: ChatMessage = { 
        role: 'model', 
        text: 'Lỗi kết nối AI. Vui lòng kiểm tra lại mạng hoặc mã API.', 
        timestamp: new Date().toISOString() 
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = () => {
    if (confirm("Bạn có chắc chắn muốn xóa toàn bộ lịch sử trò chuyện?")) {
      clearChatHistory();
      const resetMsg: ChatMessage = {
        role: 'model',
        text: 'Lịch sử đã được xóa. Tôi có thể giúp gì thêm cho bạn?',
        timestamp: new Date().toISOString()
      };
      setMessages([resetMsg]);
      saveChatHistory([resetMsg]);
    }
  };

  // Helper function to find books mentioned in a message
  const getLinkedBooks = (text: string) => {
    if (!showResults) return []; // Skip if toggle is off
    
    const foundBooks: BookRecord[] = [];
    const seenIds = new Set<string>();

    books.forEach(book => {
      const escapedId = book.id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(\\[ID:\\s*${escapedId}\\]|\\b${escapedId}\\b)`, 'gi');
      
      if (regex.test(text) && !seenIds.has(book.id)) {
        foundBooks.push(book);
        seenIds.add(book.id);
      }
    });

    return foundBooks;
  };

  return (
    <div className="max-w-6xl mx-auto h-[calc(100vh-12rem)] flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white rounded-[40px] shadow-2xl shadow-indigo-100/30 border border-gray-100 flex flex-col h-full overflow-hidden">
        {/* Module Tab Header */}
        <div className="p-4 border-b border-gray-50 flex items-center justify-between bg-indigo-50/20">
          <div className="flex bg-white p-1 rounded-2xl border border-gray-100 shadow-sm">
            <button 
              onClick={() => setActiveTab('chat')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'chat' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <MessageSquare className="w-4 h-4" /> Hỏi đáp AI
            </button>
            <button 
              onClick={() => setActiveTab('search')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'search' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <SearchIcon className="w-4 h-4" /> Tra cứu Nâng cao
            </button>
          </div>
          
          <div className="flex items-center gap-4 pr-4">
             {activeTab === 'chat' && (
               <>
                 {/* Smart Toggle Button */}
                 <button 
                    onClick={() => setShowResults(!showResults)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all border ${showResults ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-gray-50 border-gray-100 text-gray-400'}`}
                 >
                   <span className="text-[10px] font-black uppercase tracking-widest">Hiển thị thẻ sách</span>
                   {showResults ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                 </button>

                 <button 
                  onClick={handleClearHistory}
                  className="flex items-center gap-2 px-4 py-2 text-[10px] font-black text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all uppercase tracking-widest"
                 >
                   <Trash2 className="w-4 h-4" /> Xóa lịch sử
                 </button>
               </>
             )}
             <div className="hidden md:flex items-center gap-3">
               <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></div>
               <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">AI Online</span>
             </div>
          </div>
        </div>

        {activeTab === 'chat' ? (
          <>
            {/* Chat Body */}
            <div ref={scrollRef} className="flex-grow overflow-y-auto p-8 space-y-8 bg-white">
              {messages.map((msg, idx) => {
                const linkedBooks = msg.role === 'model' ? getLinkedBooks(msg.text) : [];
                
                return (
                  <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2`}>
                    <div className={`flex gap-4 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                      <div className={`w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center shadow-sm ${msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
                        {msg.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                      </div>
                      <div className="space-y-4">
                        <div className={`p-4 rounded-3xl text-sm leading-relaxed shadow-sm ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-gray-50 text-gray-800 rounded-tl-none border border-gray-100'}`}>
                          {msg.text.split('\n').map((t, i) => <p key={i} className={i > 0 ? 'mt-2' : ''}>{t}</p>)}
                        </div>
                        
                        {/* Interactive Book Result Cards - Only show if showResults is TRUE */}
                        {showResults && linkedBooks.length > 0 && (
                          <div className="grid grid-cols-1 gap-3 mt-4 animate-in fade-in slide-in-from-left-2 duration-300">
                            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                               <Sparkles className="w-3 h-3" /> Kết quả phù hợp:
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {linkedBooks.map(book => (
                                <div 
                                  key={book.id} 
                                  onClick={() => onViewDetail(book)}
                                  className="flex gap-4 p-3 bg-white hover:bg-indigo-50/50 rounded-2xl border border-gray-100 hover:border-indigo-200 transition-all cursor-pointer group shadow-sm"
                                >
                                  <div className="w-14 h-20 bg-gray-50 rounded-lg overflow-hidden shadow-sm flex-shrink-0 border border-gray-100">
                                    {book.coverImageUrl ? (
                                      <img src={book.coverImageUrl} className="w-full h-full object-cover" alt="Cover" />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center text-gray-300">
                                        <BookOpen className="w-5 h-5" />
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex-grow flex flex-col justify-center min-w-0">
                                    <h4 className="font-bold text-gray-900 text-[11px] line-clamp-1 group-hover:text-indigo-600 transition-colors">{book.title}</h4>
                                    <p className="text-[10px] text-gray-500 font-medium truncate mt-0.5">{book.author}</p>
                                    <div className="flex items-center justify-between mt-2">
                                      <span className="text-[9px] font-black text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">{book.id}</span>
                                      <ArrowRight className="w-3 h-3 text-gray-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              {isLoading && (
                <div className="flex justify-start">
                   <div className="flex gap-4">
                     <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400 animate-pulse"><Bot className="w-5 h-5" /></div>
                     <div className="bg-gray-50 p-4 rounded-3xl rounded-tl-none border border-gray-100 flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                        <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest animate-pulse">AI đang phân tích...</span>
                     </div>
                   </div>
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="p-6 bg-gray-50 border-t border-gray-100">
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="Hỏi AI về sách bạn đang tìm..."
                  className="flex-grow px-6 py-4 bg-white border border-gray-200 rounded-3xl outline-none focus:ring-4 focus:ring-indigo-100 font-medium shadow-inner"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                />
                <button 
                  onClick={handleSend} 
                  disabled={isLoading || !input.trim()} 
                  className="px-8 bg-indigo-600 text-white rounded-3xl hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-xl shadow-indigo-100 active:scale-95 flex items-center justify-center"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-grow overflow-y-auto p-8 bg-gray-50/30">
            <SearchModule books={books} onViewDetail={onViewDetail} />
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatModule;
