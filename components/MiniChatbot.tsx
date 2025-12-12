
import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Sparkles, User, Loader2, Bot } from 'lucide-react';
import { chatWithMentor } from '../services/geminiService';
import { StudentProfile } from '../types';

interface MiniChatbotProps {
  planContext: string;
  profile: StudentProfile;
  taskSummary: string;
  theme: any;
}

interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
}

export const MiniChatbot: React.FC<MiniChatbotProps> = ({ planContext, profile, taskSummary, theme }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: 'welcome', role: 'model', content: 'Chào bạn! Mình là AI Mentor. Bạn có thắc mắc gì về kế hoạch mình vừa tạo không? 👇' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const history = messages.map(m => ({ role: m.role, content: m.content }));
      const response = await chatWithMentor(
        userMsg.content,
        { plan: planContext, profile, taskSummary },
        history
      );
      
      const botMsg: Message = { id: (Date.now() + 1).toString(), role: 'model', content: response };
      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      console.error("Chat failed", error);
      setMessages(prev => [...prev, { id: 'err', role: 'model', content: 'Xin lỗi, kết nối hơi chập chờn. Bạn thử lại nhé!' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end pointer-events-none">
      
      {/* Chat Window */}
      <div 
        className={`
          pointer-events-auto bg-white dark:bg-slate-900 w-80 sm:w-96 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden transition-all duration-300 origin-bottom-right mb-4 flex flex-col
          ${isOpen ? 'scale-100 opacity-100 translate-y-0 h-[500px]' : 'scale-90 opacity-0 translate-y-10 h-0 pointer-events-none'}
        `}
      >
        {/* Header */}
        <div 
          className="p-4 flex justify-between items-center text-white"
          style={{ background: `linear-gradient(to right, ${theme.palette[0]}, ${theme.palette[1]})` }}
        >
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur-md">
               <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
               <h3 className="font-bold text-sm">Mentor Chat</h3>
               <p className="text-[10px] opacity-90">Hỏi đáp về kế hoạch</p>
            </div>
          </div>
          <button 
            onClick={() => setIsOpen(false)}
            className="p-1 hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages Body */}
        <div className="flex-grow overflow-y-auto p-4 space-y-3 custom-scrollbar bg-slate-50 dark:bg-slate-950">
           {messages.map((msg) => (
             <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div 
                  className={`max-w-[85%] rounded-2xl p-3 text-sm leading-relaxed ${
                    msg.role === 'user' 
                    ? 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-white rounded-tr-none' 
                    : 'bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-tl-none shadow-sm'
                  }`}
                >
                   {msg.role === 'model' && (
                     <div className="flex items-center gap-1 mb-1 text-[10px] font-bold text-slate-400 uppercase">
                        <Sparkles className="w-3 h-3 text-indigo-500" /> AI Mentor
                     </div>
                   )}
                   {msg.content}
                </div>
             </div>
           ))}
           {isLoading && (
             <div className="flex justify-start">
               <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl rounded-tl-none border border-slate-100 dark:border-slate-700 shadow-sm flex items-center gap-2">
                 <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                 <span className="text-xs text-slate-400">Đang suy nghĩ...</span>
               </div>
             </div>
           )}
           <div ref={messagesEndRef} />
        </div>

        {/* Input Footer */}
        <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
           <form 
             onSubmit={(e) => { e.preventDefault(); handleSend(); }}
             className="flex items-center gap-2"
           >
             <input
               type="text"
               value={input}
               onChange={(e) => setInput(e.target.value)}
               placeholder="Hỏi về kế hoạch..."
               className="flex-grow bg-slate-100 dark:bg-slate-800 border-transparent rounded-xl px-4 py-2.5 text-sm focus:bg-white dark:focus:bg-slate-700 focus:ring-2 focus:ring-indigo-500/50 transition-all outline-none"
             />
             <button
               type="submit"
               disabled={!input.trim() || isLoading}
               className="p-2.5 rounded-xl bg-indigo-500 text-white hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md"
               style={{ backgroundColor: theme.palette[0] }}
             >
               <Send className="w-4 h-4" />
             </button>
           </form>
        </div>

      </div>

      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="pointer-events-auto p-4 rounded-full shadow-xl hover:shadow-2xl hover:scale-110 transition-all active:scale-95 group relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${theme.palette[0]}, ${theme.palette[1]})` }}
      >
        <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
        {isOpen ? (
           <X className="w-6 h-6 text-white relative z-10" />
        ) : (
           <MessageCircle className="w-6 h-6 text-white relative z-10" />
        )}
        
        {/* Unread indicator (fake) */}
        {!isOpen && messages.length > 0 && (
           <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-rose-500 rounded-full border-2 border-white dark:border-slate-900"></span>
        )}
      </button>
    </div>
  );
};
