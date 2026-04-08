import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { PaperPlaneRight, ArrowLeft, ChatCircle } from '@phosphor-icons/react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function Chat() {
  const { docId } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (!user) {
      navigate('/');
    }
  }, [navigate]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await axios.post(`${API}/chat`, {
        document_id: docId,
        message: input
      });

      const assistantMessage = { role: 'assistant', content: response.data.response };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage = { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      <nav className="bg-white border-b-2 border-gray-200 py-4 px-6 md:px-12 sticky top-0 z-50 shadow-sm">
        <div className="max-w-5xl mx-auto flex items-center gap-4">
          <button
            data-testid="back-to-dashboard-button"
            onClick={() => navigate(`/dashboard/${docId}`)}
            className="p-3 hover:bg-gray-100 rounded-xl transition-all duration-200 transform hover:scale-105"
          >
            <ArrowLeft size={24} weight="bold" className="text-gray-900" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Document Chat
            </h1>
            <p className="text-sm text-gray-500">Ask questions about your document</p>
          </div>
        </div>
      </nav>

      <div className="flex-1 overflow-y-auto p-6 md:p-12">
        <div className="max-w-4xl mx-auto">
          {messages.length === 0 && (
            <div className="text-center py-16 animate-fade-in">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-[#2563EB] rounded-full mb-6">
                <ChatCircle size={40} weight="fill" className="text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                Ask Me Anything
              </h2>
              <p className="text-lg text-gray-600 mb-2">
                I'll help you understand your document better.
              </p>
              <p className="text-base text-gray-500">
                I provide guidance based on the analysis, not legal advice.
              </p>
            </div>
          )}

          <div className="space-y-6">
            {messages.map((msg, index) => (
              <div
                key={index}
                data-testid={`chat-message-${msg.role}`}
                className={`flex animate-fade-in ${
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-2xl rounded-2xl p-6 shadow-md transform transition-all duration-200 hover:shadow-lg ${
                    msg.role === 'user'
                      ? 'bg-[#2563EB] text-white'
                      : 'bg-white text-gray-900 border-2 border-gray-200'
                  }`}
                >
                  <p className="text-base leading-relaxed whitespace-pre-wrap">
                    {msg.content}
                  </p>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start animate-fade-in">
                <div className="bg-white border-2 border-gray-200 rounded-2xl p-6 shadow-md">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>

      <div className="bg-white border-t-2 border-gray-200 p-6 md:p-8 sticky bottom-0 shadow-lg">
        <div className="max-w-4xl mx-auto flex gap-4">
          <input
            type="text"
            data-testid="chat-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your question here..."
            className="flex-1 bg-gray-50 border-2 border-gray-200 text-gray-900 text-base rounded-xl focus:border-[#2563EB] focus:ring-2 focus:ring-blue-200 focus:outline-none p-4 transition-all duration-200"
            disabled={loading}
          />
          <button
            data-testid="chat-send-button"
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="bg-[#2563EB] text-white font-semibold px-6 py-4 rounded-xl hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 focus:outline-none transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg transform hover:scale-105"
          >
            <PaperPlaneRight size={24} weight="fill" />
          </button>
        </div>
      </div>
    </div>
  );
}
