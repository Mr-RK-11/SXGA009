import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { GraduationCap, BookOpen, Certificate } from '@phosphor-icons/react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function Survey() {
  const [selectedLevel, setSelectedLevel] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (!user) {
      navigate('/');
    }
  }, [navigate]);

  const handleSubmit = async () => {
    if (!selectedLevel) return;

    const user = JSON.parse(localStorage.getItem('user'));
    setLoading(true);
    
    try {
      await axios.post(`${API}/survey`, {
        user_id: user.id,
        user_level: selectedLevel
      });
      
      user.user_level = selectedLevel;
      localStorage.setItem('user', JSON.stringify(user));
      navigate('/upload');
    } catch (error) {
      console.error('Survey error:', error);
      alert('Failed to save preferences. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const levels = [
    {
      id: 'beginner',
      title: 'Beginner',
      description: 'Little to no legal knowledge. Need simple explanations.',
      icon: BookOpen
    },
    {
      id: 'intermediate',
      title: 'Intermediate',
      description: 'Some understanding of legal terms. Need moderate detail.',
      icon: GraduationCap
    },
    {
      id: 'advanced',
      title: 'Advanced',
      description: 'Strong legal background. Need comprehensive analysis.',
      icon: Certificate
    }
  ];

  return (
    <div className="min-h-screen bg-white p-6 md:p-12">
      <div className="max-w-4xl mx-auto">
        <div className="mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-black leading-tight mb-4">
            Legal Knowledge Survey
          </h1>
          <p className="text-lg text-gray-800 leading-relaxed">
            Help us tailor the document analysis to your understanding level.
          </p>
        </div>

        <div className="space-y-6 mb-8">
          {levels.map((level) => {
            const Icon = level.icon;
            const isSelected = selectedLevel === level.id;
            
            return (
              <button
                key={level.id}
                data-testid={`survey-level-${level.id}`}
                onClick={() => setSelectedLevel(level.id)}
                className={`w-full text-left bg-gray-50 border-2 rounded-md p-6 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-300 ${
                  isSelected
                    ? 'border-[#0052CC] bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-md ${
                    isSelected ? 'bg-[#0052CC]' : 'bg-gray-200'
                  }`}>
                    <Icon size={32} weight="bold" className={isSelected ? 'text-white' : 'text-gray-700'} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2">
                      {level.title}
                    </h3>
                    <p className="text-base text-gray-800 leading-relaxed">
                      {level.description}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <button
          data-testid="survey-submit-button"
          onClick={handleSubmit}
          disabled={!selectedLevel || loading}
          className="bg-[#0052CC] text-white font-semibold text-lg px-6 py-3 rounded-md border-2 border-transparent hover:bg-[#003D99] focus:ring-4 focus:ring-blue-300 focus:outline-none transition-all disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Continue'}
        </button>
      </div>
    </div>
  );
}