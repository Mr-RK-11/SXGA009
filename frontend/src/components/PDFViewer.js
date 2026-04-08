import React from 'react';
import { Download, ZoomIn, ZoomOut, FileText } from 'lucide-react';

const PDFViewer = ({ fileName, downloadUrl, clauses }) => {
  return (
    <div
      className="bg-[#131820]/80 backdrop-blur-md rounded-xl border border-white/10 overflow-hidden"
      data-testid="pdf-viewer"
    >
      {/* Toolbar */}
      <div className="border-b border-white/10 p-4 flex items-center justify-between bg-white/[0.02]">
        <div className="flex items-center gap-3">
          <FileText className="w-5 h-5 text-slate-400" strokeWidth={1.5} />
          <span className="text-sm font-medium text-white" style={{ fontFamily: '"IBM Plex Sans", sans-serif' }}>
            {fileName}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="p-2 hover:bg-white/5 rounded-lg transition-colors"
            title="Zoom Out"
            data-testid="pdf-zoom-out"
          >
            <ZoomOut className="w-4 h-4 text-slate-400" strokeWidth={1.5} />
          </button>
          <button
            className="p-2 hover:bg-white/5 rounded-lg transition-colors"
            title="Zoom In"
            data-testid="pdf-zoom-in"
          >
            <ZoomIn className="w-4 h-4 text-slate-400" strokeWidth={1.5} />
          </button>
          <a
            href={downloadUrl}
            download
            className="p-2 hover:bg-white/5 rounded-lg transition-colors"
            title="Download"
            data-testid="pdf-download-btn"
          >
            <Download className="w-4 h-4 text-slate-400" strokeWidth={1.5} />
          </a>
        </div>
      </div>

      {/* PDF Preview Mock */}
      <div className="p-8 overflow-auto max-h-[700px]">
        <div className="bg-[#1E2530] rounded-lg p-8 shadow-2xl mx-auto max-w-3xl" style={{ boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)' }}>
          <div className="space-y-6 text-slate-300 leading-loose" style={{ fontFamily: '"IBM Plex Sans", sans-serif' }}>
            <h2 className="text-2xl font-bold text-white mb-6">Legal Document Preview</h2>
            
            <p className="text-sm text-slate-500 mb-8">
              This is a visual representation of your highlighted PDF. Download the file to view the complete document with all highlights.
            </p>

            {/* Display highlighted clauses */}
            <div className="space-y-4">
              {clauses.slice(0, 5).map((clause, index) => {
                const highlightColors = {
                  high: 'rgba(239, 68, 68, 0.2)',
                  medium: 'rgba(245, 158, 11, 0.2)',
                  low: 'rgba(16, 185, 129, 0.2)',
                };

                return (
                  <div key={index} className="mb-4">
                    <p
                      className="inline px-2 py-1 rounded"
                      style={{
                        backgroundColor: highlightColors[clause.severity],
                        borderLeft: `3px solid ${clause.severity === 'high' ? '#EF4444' : clause.severity === 'medium' ? '#F59E0B' : '#10B981'}`,
                      }}
                    >
                      {clause.text}
                    </p>
                  </div>
                );
              })}

              <p className="text-slate-400 italic mt-6">
                ... additional clauses highlighted in the full document ...
              </p>
            </div>

            <div className="mt-8 p-4 bg-white/5 border border-white/10 rounded-lg">
              <p className="text-sm text-slate-400">
                <strong className="text-white">Note:</strong> Download the highlighted PDF to view all {clauses.length} extracted clauses with color-coded highlights.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PDFViewer;
