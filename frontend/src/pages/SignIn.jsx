import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { User, FileText } from '@phosphor-icons/react';

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
    <div className="min-h-screen bg-white flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="bg-[#0052CC] p-6 rounded-md">
              <FileText size={48} weight="bold" className="text-white" />
            </div>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-black leading-tight mb-4">
            Legal Sage
          </h1>
          <p className="text-lg text-gray-800 leading-relaxed max-w-xl mx-auto">
            Simplify legal documents with AI-powered analysis. 
            Understand your contracts, leases, and agreements with ease.
          </p>
        </div>

        <div className="bg-gray-50 border-2 border-gray-200 rounded-md p-8 md:p-12">
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-black mb-8">
            Get Started
          </h2>
          
          <form onSubmit={handleSignIn} className="space-y-6">
            <div>
              <label className="text-sm font-semibold tracking-[0.05em] uppercase text-gray-700 block mb-2">
                Full Name
              </label>
              <div className="relative">
                <User size={24} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" weight="bold" />
                <input
                  type="text"
                  data-testid="signin-name-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-white border-2 border-gray-300 text-gray-900 text-lg rounded-md focus:border-[#0052CC] focus:ring-2 focus:ring-[#0052CC] focus:outline-none p-3 pl-12 w-full"
                  placeholder="Enter your full name"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold tracking-[0.05em] uppercase text-gray-700 block mb-2">
                Email Address
              </label>
              <input
                type="email"
                data-testid="signin-email-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-white border-2 border-gray-300 text-gray-900 text-lg rounded-md focus:border-[#0052CC] focus:ring-2 focus:ring-[#0052CC] focus:outline-none p-3 w-full"
                placeholder="your.email@example.com"
                required
              />
            </div>

            <button
              type="submit"
              data-testid="signin-submit-button"
              disabled={loading}
              className="bg-[#0052CC] text-white font-semibold text-lg px-6 py-3 rounded-md border-2 border-transparent hover:bg-[#003D99] focus:ring-4 focus:ring-blue-300 focus:outline-none transition-all w-full disabled:opacity-50"
            >
              {loading ? 'Signing In...' : 'Continue'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}