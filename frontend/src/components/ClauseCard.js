import React from 'react';
import { AlertCircle, CheckCircle, Info } from 'lucide-react';

const ClauseCard = ({ clause, index }) => {
  const colors = {
    high: {
      text: '#F87171',
      bg: 'rgba(239, 68, 68, 0.1)',
      border: 'rgba(239, 68, 68, 0.2)',
      borderLeft: '#EF4444',
    },
    medium: {
      text: '#FBBF24',
      bg: 'rgba(245, 158, 11, 0.1)',
      border: 'rgba(245, 158, 11, 0.2)',
      borderLeft: '#F59E0B',
    },
    low: {
      text: '#34D399',
      bg: 'rgba(16, 185, 129, 0.1)',
      border: 'rgba(16, 185, 129, 0.2)',
      borderLeft: '#10B981',
    },
  };

  const color = colors[clause.severity];

  const getIcon = () => {
    if (clause.severity === 'high') return <AlertCircle className="w-4 h-4" strokeWidth={1.5} />;
    if (clause.severity === 'medium') return <Info className="w-4 h-4" strokeWidth={1.5} />;
    return <CheckCircle className="w-4 h-4" strokeWidth={1.5} />;
  };

  return (
    <div
      className="p-5 rounded-lg border bg-white/[0.02] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:bg-white/[0.04] hover:border-white/20 hover:shadow-lg"
      style={{
        borderColor: color.border,
        borderLeftWidth: '2px',
        borderLeftColor: color.borderLeft,
      }}
      data-testid={`clause-card-${clause.severity}`}
    >
      {/* Severity Badge */}
      <div className="flex items-center justify-between mb-3">
        <div
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider"
          style={{ backgroundColor: color.bg, color: color.text }}
        >
          {getIcon()}
          {clause.severity}
        </div>
        <div
          className="text-sm font-medium"
          style={{ fontFamily: '"JetBrains Mono", monospace', color: color.text }}
        >
          {clause.score}/100
        </div>
      </div>

      {/* Clause Type */}
      <div className="text-xs text-slate-500 uppercase tracking-wider mb-2" style={{ fontFamily: '"IBM Plex Sans", sans-serif' }}>
        {clause.type}
      </div>

      {/* Clause Text */}
      <p className="text-slate-300 mb-3 leading-relaxed" style={{ fontFamily: '"IBM Plex Sans", sans-serif' }}>
        "{clause.text}"
      </p>

      {/* Explanation */}
      <div className="pt-3 border-t border-white/10">
        <p className="text-sm text-slate-400 leading-relaxed" style={{ fontFamily: '"IBM Plex Sans", sans-serif' }}>
          {clause.explanation}
        </p>
      </div>
    </div>
  );
};

export default ClauseCard;
