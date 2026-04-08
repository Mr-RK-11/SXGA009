import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import ForceGraph2D from 'react-force-graph-2d';
import { Download, ChatCircle, Calendar, Warning, CheckCircle, XCircle } from '@phosphor-icons/react';
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
      const [docRes, graphRes] = await Promise.all([
        axios.get(`${API}/document/${docId}`),
        axios.get(`${API}/graph/${docId}`)
      ]);
      setDocument(docRes.data);
      setGraphData(graphRes.data);
    } catch (error) {
      console.error('Fetch error:', error);
      alert('Failed to load document');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    try {
      const response = await axios.get(`${API}/pdf/highlighted/${docId}`);
      const pdfBase64 = response.data.pdf_base64;
      const byteCharacters = atob(pdfBase64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `highlighted_${document.filename}`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to download PDF');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-lg text-gray-800">Loading document analysis...</p>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-lg text-gray-800">Document not found</p>
      </div>
    );
  }

  const getRiskBadge = () => {
    if (document.risk_score >= 70) {
      return (
        <div className="flex items-center gap-2 bg-red-100 text-red-800 border-2 border-red-200 text-sm font-bold px-3 py-1 rounded-full uppercase tracking-wide">
          <XCircle size={20} weight="bold" />
          High Risk
        </div>
      );
    } else if (document.risk_score >= 40) {
      return (
        <div className="flex items-center gap-2 bg-yellow-100 text-yellow-800 border-2 border-yellow-300 text-sm font-bold px-3 py-1 rounded-full uppercase tracking-wide">
          <Warning size={20} weight="bold" />
          Medium Risk
        </div>
      );
    }
    return (
      <div className="flex items-center gap-2 bg-green-100 text-green-800 border-2 border-green-200 text-sm font-bold px-3 py-1 rounded-full uppercase tracking-wide">
        <CheckCircle size={20} weight="bold" />
        Low Risk
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-white">
      <nav className="bg-white border-b-2 border-gray-200 py-4 px-6 md:px-12 flex justify-between items-center sticky top-0 z-50">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-black">
          Legal Sage
        </h1>
        <button
          onClick={() => navigate('/upload')}
          className="bg-white text-gray-900 font-semibold text-lg px-6 py-3 rounded-md border-2 border-gray-300 hover:border-gray-900 hover:bg-gray-50 focus:ring-4 focus:ring-gray-200 focus:outline-none transition-all"
        >
          New Analysis
        </button>
      </nav>

      <div className="p-6 md:p-12">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <div className="flex flex-wrap items-center gap-4 mb-4">
              <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-black">
                {document.filename}
              </h2>
              {getRiskBadge()}
              <span className="bg-gray-100 text-gray-800 border-2 border-gray-200 text-sm font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                {document.doc_type}
              </span>
            </div>
            <div className="flex flex-wrap gap-4">
              <button
                data-testid="download-pdf-button"
                onClick={handleDownload}
                className="flex items-center gap-2 bg-[#0052CC] text-white font-semibold text-lg px-6 py-3 rounded-md hover:bg-[#003D99] focus:ring-4 focus:ring-blue-300 focus:outline-none transition-all"
              >
                <Download size={24} weight="bold" />
                Download Highlighted PDF
              </button>
              <button
                data-testid="open-chat-button"
                onClick={() => navigate(`/chat/${docId}`)}
                className="flex items-center gap-2 bg-white text-gray-900 font-semibold text-lg px-6 py-3 rounded-md border-2 border-gray-300 hover:border-gray-900 hover:bg-gray-50 focus:ring-4 focus:ring-gray-200 focus:outline-none transition-all"
              >
                <ChatCircle size={24} weight="bold" />
                Ask Questions
              </button>
              {document.risk_score > 70 && (
                <button
                  data-testid="book-consultation-button"
                  onClick={() => setShowConsultation(true)}
                  className="flex items-center gap-2 bg-[#B91C1C] text-white font-semibold text-lg px-6 py-3 rounded-md hover:bg-[#991B1B] focus:ring-4 focus:ring-red-300 focus:outline-none transition-all"
                >
                  <Calendar size={24} weight="bold" />
                  Consult Lawyer
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            <div className="lg:col-span-1">
              <div className="bg-gray-50 border-2 border-gray-200 rounded-md p-6">
                <h3 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-4">
                  Risk Score
                </h3>
                <div className="text-center">
                  <div className="text-6xl font-bold text-black mb-2">
                    {document.risk_score}
                  </div>
                  <p className="text-base text-gray-800">out of 100</p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-2">
              <div className="bg-gray-50 border-2 border-gray-200 rounded-md p-6">
                <h3 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-4">
                  Document Summary
                </h3>
                <div className="text-base text-gray-800 leading-relaxed whitespace-pre-wrap">
                  {document.simplified_text}
                </div>
              </div>
            </div>
          </div>

          <div className="mb-8">
            <h3 className="text-2xl sm:text-3xl font-semibold tracking-tight text-black mb-6">
              Key Clauses
            </h3>
            <div className="grid grid-cols-1 gap-4">
              {document.clauses.map((clause, index) => {
                const severityColors = {
                  high: 'bg-red-100 border-red-200 text-red-800',
                  medium: 'bg-yellow-100 border-yellow-300 text-yellow-800',
                  low: 'bg-green-100 border-green-200 text-green-800'
                };
                return (
                  <div
                    key={index}
                    data-testid={`clause-card-${clause.severity}`}
                    className={`border-2 rounded-md p-6 ${severityColors[clause.severity] || severityColors.low}`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold px-3 py-1 rounded-full bg-white border-2 uppercase tracking-wide">
                          {clause.type}
                        </span>
                        <span className="text-sm font-bold px-3 py-1 rounded-full bg-white border-2 uppercase tracking-wide">
                          Score: {clause.score}
                        </span>
                      </div>
                    </div>
                    <p className="text-base font-medium mb-2">
                      {clause.text}
                    </p>
                    <p className="text-base opacity-90">
                      {clause.explanation}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mb-8">
            <h3 className="text-2xl sm:text-3xl font-semibold tracking-tight text-black mb-6">
              Clause Relationships
            </h3>
            <div className="bg-white border-2 border-gray-200 rounded-md p-6" style={{ height: '500px' }}>
              {graphData && graphData.nodes && graphData.nodes.length > 0 ? (
                <ForceGraph2D
                  graphData={graphData}
                  nodeLabel="name"
                  nodeColor="color"
                  nodeRelSize={10}
                  linkColor={() => '#D1D5DB'}
                  linkWidth={2}
                  backgroundColor="#FFFFFF"
                  nodeCanvasObjectMode={() => 'after'}
                  nodeCanvasObject={(node, ctx, globalScale) => {
                    const label = node.name;
                    const fontSize = 14 / globalScale;
                    ctx.font = `bold ${fontSize}px IBM Plex Sans`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillStyle = '#000000';
                    ctx.fillText(label, node.x, node.y + 20);
                  }}
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-lg text-gray-600">No clause relationships found</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showConsultation && (
        <ConsultationModal
          documentId={docId}
          onClose={() => setShowConsultation(false)}
        />
      )}
    </div>
  );
}