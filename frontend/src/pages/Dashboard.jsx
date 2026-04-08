import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import ForceGraph2D from 'react-force-graph-2d';
import { ChatCircle, Calendar, Warning, CheckCircle, XCircle, FileText } from '@phosphor-icons/react';
import ConsultationModal from '../components/ConsultationModal';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function Dashboard() {
  const { docId } = useParams();
  const navigate = useNavigate();
  const [document, setDocument] = useState(null);
  const [graphData, setGraphData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showConsultation, setShowConsultation] = useState(false);
  const [assignedLawyer, setAssignedLawyer] = useState(null);

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (!user) {
      navigate('/');
      return;
    }
    fetchDocument();
  }, [docId]);

  const fetchDocument = async () => {
    try {
      const [docRes, graphRes, lawyerRes] = await Promise.all([
        axios.get(`${API}/document/${docId}`),
        axios.get(`${API}/graph/${docId}`),
        axios.get(`${API}/lawyer-for-document/${docId}`)
      ]);
      setDocument(docRes.data);
      setGraphData(graphRes.data);
      setAssignedLawyer(lawyerRes.data);
    } catch (error) {
      console.error('Fetch error:', error);
      alert('Failed to load document');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#2563EB] rounded-full mb-4 animate-pulse-custom">
            <FileText size={32} weight="bold" className="text-white" />
          </div>
          <p className="text-lg text-gray-600">Loading analysis...</p>
        </div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <p className="text-lg text-gray-600">Document not found</p>
      </div>
    );
  }

  const getRiskBadge = () => {
    if (document.risk_score >= 70) {
      return {
        label: 'High Risk',
        color: 'bg-red-100 text-red-700 border-red-200',
        icon: XCircle
      };
    } else if (document.risk_score >= 40) {
      return {
        label: 'Moderate Risk',
        color: 'bg-yellow-100 text-yellow-700 border-yellow-200',
        icon: Warning
      };
    }
    return {
      label: 'Low Risk',
      color: 'bg-green-100 text-green-700 border-green-200',
      icon: CheckCircle
    };
  };

  const riskBadge = getRiskBadge();
  const RiskIcon = riskBadge.icon;

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <nav className="bg-white border-b-2 border-gray-200 py-5 px-6 md:px-12 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Legal Sage
            </h1>
            <p className="text-sm text-gray-500">AI-powered legal clarity</p>
          </div>
          <button
            onClick={() => navigate('/upload')}
            className="bg-[#2563EB] text-white font-semibold px-6 py-3 rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 focus:outline-none transition-all duration-200 transform hover:scale-105"
          >
            New Analysis
          </button>
        </div>
      </nav>

      <div className="p-6 md:p-12">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 mb-8 animate-fade-in">
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
                {document.filename}
              </h2>
              <div className={`flex items-center gap-2 px-4 py-2 rounded-full border-2 font-semibold ${riskBadge.color}`}>
                <RiskIcon size={20} weight="fill" />
                {riskBadge.label}
              </div>
              <span className="px-4 py-2 bg-gray-100 text-gray-700 rounded-full border-2 border-gray-200 font-semibold text-sm uppercase">
                {document.doc_type}
              </span>
            </div>
            
            <div className="flex flex-wrap gap-4">
              <button
                data-testid="open-chat-button"
                onClick={() => navigate(`/chat/${docId}`)}
                className="flex items-center gap-2 bg-[#2563EB] text-white font-semibold px-6 py-3 rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 focus:outline-none transition-all duration-200 transform hover:scale-105"
              >
                <ChatCircle size={20} weight="fill" />
                Ask Questions
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 text-center transform transition-all duration-300 hover:shadow-xl">
              <h3 className="text-lg font-semibold text-gray-600 mb-4">
                Overall Risk Score
              </h3>
              <div className="text-7xl font-bold text-[#2563EB] mb-2">
                {document.risk_score}
              </div>
              <p className="text-sm text-gray-500 mb-6">out of 100</p>
              
              {/* Show lawyer button when risk > 10 or always if undefined */}
              {(document.risk_score > 10 || !document.risk_score) && (
                <button
                  data-testid="consult-lawyer-button"
                  onClick={() => setShowConsultation(true)}
                  className="w-full flex items-center justify-center gap-2 bg-[#DC2626] text-white font-semibold px-6 py-3 rounded-lg hover:bg-red-700 focus:ring-4 focus:ring-red-300 focus:outline-none transition-all duration-200 transform hover:scale-105 shadow-lg"
                >
                  <Calendar size={20} weight="fill" />
                  Consult a Lawyer
                </button>
              )}
            </div>

            <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg p-6 md:p-8 transform transition-all duration-300 hover:shadow-xl">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Document Summary
              </h3>
              <div className="text-base text-gray-700 leading-relaxed whitespace-pre-wrap max-h-64 overflow-y-auto">
                {document.simplified_text}
              </div>
            </div>
          </div>

          <div className="mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">
              Key Clauses Analysis
            </h3>
            <div className="grid grid-cols-1 gap-4">
              {document.clauses.map((clause, index) => {
                const severityConfig = {
                  high: { bg: 'bg-red-50', border: 'border-red-300', text: 'text-red-800', badge: 'bg-red-100' },
                  medium: { bg: 'bg-yellow-50', border: 'border-yellow-300', text: 'text-yellow-800', badge: 'bg-yellow-100' },
                  low: { bg: 'bg-green-50', border: 'border-green-300', text: 'text-green-800', badge: 'bg-green-100' }
                };
                const config = severityConfig[clause.severity] || severityConfig.low;
                
                return (
                  <div
                    key={index}
                    data-testid={`clause-card-${clause.severity}`}
                    className={`${config.bg} border-2 ${config.border} rounded-xl p-6 transform transition-all duration-300 hover:shadow-lg hover:scale-[1.01]`}
                  >
                    <div className="flex flex-wrap gap-2 mb-3">
                      <span className={`${config.badge} ${config.text} text-xs font-bold px-3 py-1 rounded-full uppercase`}>
                        {clause.type}
                      </span>
                      <span className={`${config.badge} ${config.text} text-xs font-bold px-3 py-1 rounded-full uppercase`}>
                        Risk: {clause.score}/100
                      </span>
                      <span className={`${config.badge} ${config.text} text-xs font-bold px-3 py-1 rounded-full uppercase`}>
                        {clause.severity} Severity
                      </span>
                    </div>
                    <p className={`text-base font-medium mb-3 ${config.text}`}>
                      {clause.text}
                    </p>
                    <p className="text-sm text-gray-700">
                      <strong>Analysis:</strong> {clause.explanation}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 transform transition-all duration-300 hover:shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900">
                Key Risk Relationships
              </h3>
              
              {/* Legend */}
              <div className="flex gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-[#DC2626] rounded-full"></div>
                  <span className="text-gray-700 font-medium">High Risk</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-[#F59E0B] rounded-full"></div>
                  <span className="text-gray-700 font-medium">Medium Risk</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-[#16A34A] rounded-full"></div>
                  <span className="text-gray-700 font-medium">Low Risk</span>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-xl p-4" style={{ height: '500px' }}>
              {graphData && graphData.nodes && graphData.nodes.length > 0 ? (
                <ForceGraph2D
                  graphData={graphData}
                  nodeLabel={(node) => `
                    <div style="background: white; padding: 12px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); max-width: 300px;">
                      <div style="font-weight: bold; color: #1F2937; margin-bottom: 8px;">${node.name}</div>
                      <div style="font-size: 12px; color: #4B5563; margin-bottom: 6px;">Risk Score: ${node.score}/100</div>
                      <div style="font-size: 12px; color: #6B7280; line-height: 1.4;">${node.explanation || 'No details available'}</div>
                    </div>
                  `}
                  nodeColor="color"
                  nodeRelSize={8}
                  linkColor={() => '#D1D5DB'}
                  linkWidth={1.5}
                  backgroundColor="#F9FAFB"
                  d3VelocityDecay={0.3}
                  nodeCanvasObjectMode={() => 'after'}
                  nodeCanvasObject={(node, ctx, globalScale) => {
                    const label = node.name;
                    const fontSize = 11 / globalScale;
                    ctx.font = `600 ${fontSize}px Inter`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillStyle = '#1F2937';
                    ctx.fillText(label, node.x, node.y + 22);
                  }}
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-lg text-gray-500">No clause relationships found</p>
                </div>
              )}
            </div>
            
            <p className="text-sm text-gray-500 mt-4 text-center">
              Showing top {graphData?.nodes?.length || 0} highest-risk clauses and their relationships
            </p>
          </div>
        </div>
      </div>

      {showConsultation && assignedLawyer && (
        <ConsultationModal
          documentId={docId}
          lawyer={assignedLawyer}
          onClose={() => setShowConsultation(false)}
        />
      )}
    </div>
  );
}
