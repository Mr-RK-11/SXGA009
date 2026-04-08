import React from 'react';
import { FileText, PlusCircle } from 'lucide-react';

const Sidebar = ({ onNewDocument, hasAnalysis }) => {
  return (
    <div className="w-72 bg-white/[0.02] backdrop-blur-xl border-r border-white/10 flex flex-col" data-testid="sidebar">
      {/* Brand */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
            <FileText className="w-6 h-6 text-white" strokeWidth={1.5} />
          </div>
          <div>
            <h2 className="text-lg font-medium" style={{ fontFamily: '"Outfit", sans-serif' }}>
              LegalAI
            </h2>
            <p className="text-xs text-slate-500">v1.0</p>
          </div>
        </div>
      </div>

      {/* New Document Button */}
      <div className="p-6">
        <button
          onClick={onNewDocument}
          className="w-full bg-white text-black font-medium px-4 py-3 rounded-lg hover:bg-slate-200 transition-colors flex items-center justify-center gap-2"
          style={{ fontFamily: '"IBM Plex Sans", sans-serif' }}
          data-testid="new-document-btn"
        >
          <PlusCircle className="w-5 h-5" strokeWidth={1.5} />
          New Analysis
        </button>
      </div>

      {/* Navigation */}
      <div className="flex-1 px-4">
        <div className="text-xs font-semibold tracking-[0.15em] uppercase text-slate-400 mb-3 px-2">
          Navigation
        </div>
        <nav className="space-y-1">
          <a
            href="#"
            className="block px-4 py-2 rounded-lg bg-white/5 text-white border-l-2 border-indigo-500"
            style={{ fontFamily: '"IBM Plex Sans", sans-serif' }}
            data-testid="nav-dashboard"
          >
            Dashboard
          </a>
          <a
            href="#"
            className="block px-4 py-2 rounded-lg text-slate-400 hover:bg-white/5 hover:text-white transition-colors"
            style={{ fontFamily: '"IBM Plex Sans", sans-serif' }}
            data-testid="nav-history"
          >
            History
          </a>
          <a
            href="#"
            className="block px-4 py-2 rounded-lg text-slate-400 hover:bg-white/5 hover:text-white transition-colors"
            style={{ fontFamily: '"IBM Plex Sans", sans-serif' }}
            data-testid="nav-settings"
          >
            Settings
          </a>
        </nav>
      </div>

      {/* Footer */}
      <div className="p-6 border-t border-white/10">
        <p className="text-xs text-slate-500 text-center">
          Powered by Groq AI
        </p>
      </div>
    </div>
  );
};

export default Sidebar;
