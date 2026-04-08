import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { PaperPlaneRight, ArrowLeft } from '@phosphor-icons/react';

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
    <div className="min-h-screen bg-white flex flex-col">
      <nav className="bg-white border-b-2 border-gray-200 py-4 px-6 md:px-12 flex items-center gap-4 sticky top-0 z-50">
        <button
          data-testid="back-to-dashboard-button"
          onClick={() => navigate(`/dashboard/${docId}`)}
          className="p-2 hover:bg-gray-100 rounded-md transition-colors"
        >
          <ArrowLeft size={24} weight="bold" className="text-gray-900" />
        </button>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-black">
          Document Chat
        </h1>
      </nav>

      <div className="flex-1 overflow-y-auto p-6 md:p-12">
        <div className="max-w-4xl mx-auto">
          {messages.length === 0 && (
            <div className="text-center py-12">
              <p className="text-lg text-gray-600 mb-4">
                Ask questions about your document.
              </p>
              <p className="text-base text-gray-500">
                I'll provide guidance based on the document analysis.
              </p>
            </div>
          )}

          <div className="space-y-6">
            {messages.map((msg, index) => (
              <div
                key={index}
                data-testid={`chat-message-${msg.role}`}
                className={`flex ${
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-2xl rounded-md p-6 ${
                    msg.role === 'user'
                      ? 'bg-[#0052CC] text-white'
                      : 'bg-gray-50 border-2 border-gray-200 text-gray-900'
                  }`}
                >
                  <p className="text-base leading-relaxed whitespace-pre-wrap">
                    {msg.content}
                  </p>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-50 border-2 border-gray-200 rounded-md p-6">
                  <p className="text-base text-gray-600">Thinking...</p>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>

      <div className="bg-white border-t-2 border-gray-200 p-6 md:p-12 sticky bottom-0">
        <div className="max-w-4xl mx-auto flex gap-4">
          <input
            type="text"
            data-testid="chat-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask a question about the document..."
            className="flex-1 bg-white border-2 border-gray-300 text-gray-900 text-lg rounded-md focus:border-[#0052CC] focus:ring-2 focus:ring-[#0052CC] focus:outline-none p-3"
            disabled={loading}
          />
          <button
            data-testid="chat-send-button"
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="bg-[#0052CC] text-white font-semibold text-lg px-6 py-3 rounded-md hover:bg-[#003D99] focus:ring-4 focus:ring-blue-300 focus:outline-none transition-all disabled:opacity-50"
          >
            <PaperPlaneRight size={24} weight="bold" />
          </button>
        </div>
      </div>
    </div>
  );
}