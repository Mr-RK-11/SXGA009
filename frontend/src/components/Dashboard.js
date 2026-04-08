import React, { useState } from 'react';
import axios from 'axios';
import Sidebar from './Sidebar';
import UploadZone from './UploadZone';
import RiskScorePanel from './RiskScorePanel';
import ClauseCard from './ClauseCard';
import PDFViewer from './PDFViewer';
import { Loader2 } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Dashboard = () => {
  const [userType, setUserType] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [error, setError] = useState(null);

  const handleFileUpload = async (file) => {
    setAnalyzing(true);
    setError(null);
    setAnalysisResult(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('user_type', userType);

    try {
      const response = await axios.post(`${API}/analyze`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setAnalysisResult(response.data);
    } catch (err) {
      console.error('Error analyzing document:', err);
      setError(err.response?.data?.detail || 'Failed to analyze document');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleNewDocument = () => {
    setAnalysisResult(null);
    setError(null);
  };

  const getRiskInterpretation = (score) => {
    if (score > 70) return 'High Risk - Review Carefully';
    if (score > 40) return 'Moderate Risk';
    return 'Safe to Sign';
  };

  // User Profile Selection Screen
  if (!userType) {
    return (
      <div className="min-h-screen bg-[#0B0F14] text-white overflow-hidden">
        {/* Ambient glowing orbs */}
        <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[150px] pointer-events-none" />
        <div className="fixed bottom-0 left-0 w-[600px] h-[600px] bg-rose-600/10 rounded-full blur-[150px] pointer-events-none" />
        <div className="fixed top-1/2 left-1/2 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />

        <div className="flex items-center justify-center min-h-screen relative z-10">
          <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-xl p-12 max-w-2xl w-full mx-8">
            <h2 className="text-3xl font-medium mb-2 text-center" style={{ fontFamily: '"Outfit", sans-serif' }}>
              Select Your Profile
            </h2>
            <p className="text-slate-400 text-center mb-8" style={{ fontFamily: '"IBM Plex Sans", sans-serif' }}>
              Help us personalize your contract analysis
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {['Student', 'Employee', 'Freelancer', 'Tenant'].map((type) => (
                <button
                  key={type}
                  onClick={() => setUserType(type.toLowerCase())}
                  className="p-6 rounded-lg border bg-white/[0.02] border-white/10 hover:bg-white/[0.06] hover:border-white/20 transition-all duration-300 text-left"
                  data-testid={`profile-${type.toLowerCase()}`}
                >
                  <h3 className="text-xl font-medium mb-2" style={{ fontFamily: '"Outfit", sans-serif' }}>
                    {type}
                  </h3>
                  <p className="text-sm text-slate-400" style={{ fontFamily: '"IBM Plex Sans", sans-serif' }}>
                    {type === 'Student' && 'Focus on penalties, fees, and financial obligations'}
                    {type === 'Employee' && 'Focus on work obligations and restrictions'}
                    {type === 'Freelancer' && 'Focus on payments, liability, and deadlines'}
                    {type === 'Tenant' && 'Focus on rent, deposits, and termination terms'}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0F14] text-white overflow-hidden">
      {/* Ambient glowing orbs */}
      <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-[600px] h-[600px] bg-rose-600/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="fixed top-1/2 left-1/2 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="flex h-screen relative z-10">
        {/* Sidebar */}
        <Sidebar onNewDocument={handleNewDocument} hasAnalysis={!!analysisResult} />

        {/* Main Content */}
        <div className="flex-1 overflow-auto">
          <div className="p-8">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-4xl md:text-5xl font-light tracking-tighter text-white" style={{ fontFamily: '"Outfit", sans-serif' }}>
                Legal Decision Intelligence
              </h1>
              <p className="text-slate-400 mt-2" style={{ fontFamily: '"IBM Plex Sans", sans-serif' }}>
                AI-powered contract analysis and risk assessment
              </p>
            </div>

            {/* Upload Section */}
            {!analysisResult && !analyzing && (
              <div className="max-w-2xl mx-auto mt-20">
                <UploadZone onFileUpload={handleFileUpload} />
                {error && (
                  <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
                    {error}
                  </div>
                )}
              </div>
            )}

            {/* Analyzing State */}
            {analyzing && (
              <div className="flex flex-col items-center justify-center mt-20">
                <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-xl p-12 text-center">
                  <Loader2 className="w-16 h-16 animate-spin text-indigo-400 mx-auto mb-4" />
                  <h3 className="text-2xl font-medium mb-2" style={{ fontFamily: '"Outfit", sans-serif' }}>
                    Analyzing Document
                  </h3>
                  <p className="text-slate-400" style={{ fontFamily: '"IBM Plex Sans", sans-serif' }}>
                    AI is extracting clauses and calculating risk scores...
                  </p>
                </div>
              </div>
            )}

            {/* Analysis Results */}
            {analysisResult && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - PDF Viewer */}
                <div className="lg:col-span-2">
                  <PDFViewer 
                    fileName={analysisResult.document_name}
                    downloadUrl={`${BACKEND_URL}${analysisResult.highlighted_file}`}
                    clauses={analysisResult.clauses}
                  />
                </div>

                {/* Right Column - Risk Score & Clauses */}
                <div className="space-y-6">
                  {/* Risk Score Panel */}
                  <RiskScorePanel 
                    score={analysisResult.risk_score}
                    interpretation={getRiskInterpretation(analysisResult.risk_score)}
                  />

                  {/* Clause Cards */}
                  <div className="space-y-4">
                    <h3 className="text-xl font-medium" style={{ fontFamily: '"Outfit", sans-serif' }}>
                      Extracted Clauses ({analysisResult.clauses.length})
                    </h3>
                    <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                      {analysisResult.clauses.map((clause, index) => (
                        <ClauseCard key={index} clause={clause} index={index} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
