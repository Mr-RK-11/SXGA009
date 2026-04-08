import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { User, EnvelopeSimple } from '@phosphor-icons/react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function SignIn() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignIn = async (e) => {
    e.preventDefault();
    if (!name || !email) return;

    setLoading(true);
    try {
      const response = await axios.post(`${API}/auth/signin`, { name, email });
      localStorage.setItem('user', JSON.stringify(response.data));
      navigate('/survey');
    } catch (error) {
      console.error('Sign in error:', error);
      alert('Sign in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8FAFC] to-[#E0E7FF] flex items-center justify-center p-6">
      <div className="w-full max-w-2xl animate-fade-in">
        <div className="text-center mb-12">
          <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 mb-3">
            Legal Sage
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            AI-powered legal clarity
          </p>
          <p className="text-lg text-gray-600 max-w-xl mx-auto">
            Simplify legal documents with intelligent analysis. 
            Understand your contracts, leases, and agreements with ease.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 transform transition-all duration-300 hover:shadow-2xl">
          <h2 className="text-3xl font-semibold text-gray-900 mb-8">
            Get Started
          </h2>
          
          <form onSubmit={handleSignIn} className="space-y-6">
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-2">
                Full Name
              </label>
              <div className="relative">
                <User size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" weight="bold" />
                <input
                  type="text"
                  data-testid="signin-name-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-gray-50 border-2 border-gray-200 text-gray-900 text-lg rounded-xl focus:border-[#2563EB] focus:ring-2 focus:ring-blue-200 focus:outline-none p-4 pl-12 w-full transition-all duration-200"
                  placeholder="Enter your full name"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-2">
                Email Address
              </label>
              <div className="relative">
                <EnvelopeSimple size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" weight="bold" />
                <input
                  type="email"
                  data-testid="signin-email-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-gray-50 border-2 border-gray-200 text-gray-900 text-lg rounded-xl focus:border-[#2563EB] focus:ring-2 focus:ring-blue-200 focus:outline-none p-4 pl-12 w-full transition-all duration-200"
                  placeholder="your.email@example.com"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              data-testid="signin-submit-button"
              disabled={loading}
              className="bg-[#2563EB] text-white font-semibold text-lg px-8 py-4 rounded-xl hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 focus:outline-none transition-all duration-200 w-full disabled:opacity-50 disabled:cursor-not-allowed shadow-lg transform hover:scale-[1.02]"
            >
              {loading ? 'Signing In...' : 'Continue →'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
