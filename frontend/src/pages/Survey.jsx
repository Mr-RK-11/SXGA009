import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { CheckCircle } from '@phosphor-icons/react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const QUESTIONS = [
  {
    id: 1,
    question: "How familiar are you with legal documents?",
    options: [
      "I've never read a legal document before",
      "I've read a few but find them confusing",
      "I understand basic legal documents",
      "I regularly work with legal documents"
    ]
  },
  {
    id: 2,
    question: "Do you understand legal terms like 'liability' and 'indemnification'?",
    options: [
      "I don't know these terms at all",
      "I've heard them but don't understand",
      "I understand basic legal terms",
      "I'm comfortable with legal terminology"
    ]
  },
  {
    id: 3,
    question: "Have you ever signed a contract or legal agreement?",
    options: [
      "Never",
      "Once or twice, with help",
      "Several times",
      "Regularly, I review them myself"
    ]
  },
  {
    id: 4,
    question: "How comfortable are you identifying risks in a contract?",
    options: [
      "Not comfortable at all",
      "Slightly comfortable",
      "Moderately comfortable",
      "Very comfortable"
    ]
  },
  {
    id: 5,
    question: "What's your background with legal matters?",
    options: [
      "No legal background",
      "Basic understanding from personal experience",
      "Some formal training or education",
      "Professional legal background"
    ]
  },
  {
    id: 6,
    question: "When reading a contract, how much detail do you prefer?",
    options: [
      "Simple summary in plain language",
      "Basic explanation with some details",
      "Moderate detail with legal terms explained",
      "Full legal analysis with terminology"
    ]
  }
];

export default function Survey() {
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (!user) {
      navigate('/');
    }
  }, [navigate]);

  const handleAnswer = (questionId, optionIndex) => {
    setAnswers(prev => ({ ...prev, [questionId]: optionIndex }));
  };

  const calculateLevel = (score) => {
    if (score <= 6) return 'beginner';
    if (score <= 12) return 'intermediate';
    return 'advanced';
  };

  const handleSubmit = async () => {
    if (Object.keys(answers).length !== QUESTIONS.length) {
      alert('Please answer all questions');
      return;
    }

    const totalScore = Object.values(answers).reduce((sum, score) => sum + score, 0);
    const userLevel = calculateLevel(totalScore);
    
    const user = JSON.parse(localStorage.getItem('user'));
    setLoading(true);
    
    try {
      await axios.post(`${API}/survey`, {
        user_id: user.id,
        score: totalScore,
        user_level: userLevel
      });
      
      user.user_level = userLevel;
      user.survey_score = totalScore;
      localStorage.setItem('user', JSON.stringify(user));
      navigate('/upload');
    } catch (error) {
      console.error('Survey error:', error);
      alert('Failed to save survey. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const allAnswered = Object.keys(answers).length === QUESTIONS.length;
  const progress = (Object.keys(answers).length / QUESTIONS.length) * 100;

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 md:p-12">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-3">
            Legal Knowledge Assessment
          </h1>
          <p className="text-lg text-gray-600">
            Help us personalize your document analysis experience
          </p>
          
          {/* Progress Bar */}
          <div className="mt-6 bg-gray-200 rounded-full h-3 overflow-hidden">
            <div 
              className="bg-[#2563EB] h-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-sm text-gray-500 mt-2">
            {Object.keys(answers).length} of {QUESTIONS.length} questions answered
          </p>
        </div>

        <div className="space-y-8">
          {QUESTIONS.map((q, qIndex) => (
            <div 
              key={q.id}
              className="bg-white rounded-lg shadow-sm p-6 md:p-8 transform transition-all duration-300 hover:shadow-md"
            >
              <h3 className="text-xl font-semibold text-gray-900 mb-6">
                {qIndex + 1}. {q.question}
              </h3>
              <div className="space-y-3">
                {q.options.map((option, optionIndex) => {
                  const isSelected = answers[q.id] === optionIndex;
                  return (
                    <button
                      key={optionIndex}
                      data-testid={`survey-q${q.id}-option${optionIndex}`}
                      onClick={() => handleAnswer(q.id, optionIndex)}
                      className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200 transform hover:scale-[1.02] ${
                        isSelected
                          ? 'border-[#2563EB] bg-blue-50 shadow-sm'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-base text-gray-800 pr-4">
                          {option}
                        </span>
                        {isSelected && (
                          <CheckCircle size={24} weight="fill" className="text-[#2563EB] flex-shrink-0" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 sticky bottom-6">
          <button
            data-testid="survey-submit-button"
            onClick={handleSubmit}
            disabled={!allAnswered || loading}
            className="w-full bg-[#2563EB] text-white font-semibold text-lg px-8 py-4 rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 focus:outline-none transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg transform hover:scale-[1.02]"
          >
            {loading ? 'Submitting...' : allAnswered ? 'Continue to Upload' : `Answer ${QUESTIONS.length - Object.keys(answers).length} More Questions`}
          </button>
        </div>
      </div>
    </div>
  );
}