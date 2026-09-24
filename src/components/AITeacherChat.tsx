import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Sparkles } from 'lucide-react';

export default function AITeacherChat({ student }: { student: any }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{sender: 'user' | 'ai', text: string}[]>([
    { sender: 'ai', text: `Hello ${student.fullName}! I'm Teacher Yuva's AI Assistant. How can I help you with your English learning today?` }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input.trim();
    setMessages(prev => [...prev, { sender: 'user', text: userMessage }]);
    setInput('');
    setIsTyping(true);

    try {
      const response = await fetch('/api/evaluate-sentence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sentence: userMessage, targetWord: { word: 'chat', meaning: 'general chat' }, isChat: true })
      });
      const data = await response.json();
      setMessages(prev => [...prev, { sender: 'ai', text: data.feedback || "I'm here to help you learn English!" }]);
    } catch (error) {
      setMessages(prev => [...prev, { sender: 'ai', text: "Hmm, I am having trouble connecting to the magic forest right now. Try again later!" }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-20 right-6 w-16 h-16 bg-gradient-to-tr from-emerald-500 to-teal-400 rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-50 border-4 border-white"
        >
          <Sparkles className="w-8 h-8 text-white animate-pulse" />
        </button>
      )}

      {isOpen && (
        <div className="fixed bottom-20 right-6 w-80 md:w-96 h-[500px] max-h-[80vh] bg-white rounded-3xl shadow-2xl z-50 flex flex-col border-4 border-emerald-100 overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-4 flex justify-between items-center text-white">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              <h3 className="font-display font-bold text-lg">AI Teacher Yuva</h3>
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-1 rounded-full transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-emerald-50/50">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-3 rounded-2xl text-sm font-medium ${msg.sender === 'user' ? 'bg-emerald-500 text-white rounded-br-sm' : 'bg-white border-2 border-emerald-100 text-emerald-900 rounded-bl-sm shadow-sm'}`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="max-w-[80%] p-3 rounded-2xl bg-white border-2 border-emerald-100 text-emerald-900 rounded-bl-sm shadow-sm flex items-center gap-2">
                  <div className="w-2 h-2 bg-emerald-300 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce delay-75" />
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce delay-150" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSend} className="p-3 bg-white border-t border-emerald-100 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me anything..."
              className="flex-1 bg-gray-100 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <button type="submit" disabled={!input.trim() || isTyping} className="w-10 h-10 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-300 rounded-full flex items-center justify-center text-white transition-colors shrink-0">
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
