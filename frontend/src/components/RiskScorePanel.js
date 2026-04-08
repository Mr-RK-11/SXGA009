import React from 'react';
import { AlertTriangle } from 'lucide-react';

const RiskScorePanel = ({ score }) => {
  const getSeverity = (score) => {
    if (score >= 70) return 'high';
    if (score >= 40) return 'medium';
    return 'low';
  };

  const severity = getSeverity(score);

  const colors = {
    high: {
      text: '#F87171',
      bg: 'rgba(239, 68, 68, 0.1)',
      border: 'rgba(239, 68, 68, 0.2)',
      glow: '0 0 20px rgba(239,68,68,0.4)',
    },
    medium: {
      text: '#FBBF24',
      bg: 'rgba(245, 158, 11, 0.1)',
      border: 'rgba(245, 158, 11, 0.2)',
      glow: '0 0 20px rgba(245,158,11,0.4)',
    },
    low: {
      text: '#34D399',
      bg: 'rgba(16, 185, 129, 0.1)',
      border: 'rgba(16, 185, 129, 0.2)',
      glow: '0 0 20px rgba(16,185,129,0.4)',
    },
  };

  const color = colors[severity];
  const percentage = (score / 100) * 283; // Circumference of circle (2 * PI * r, r=45)

  return (
    <div
      className="p-8 rounded-xl bg-white/[0.03] backdrop-blur-xl border border-white/10"
      data-testid="risk-score-panel"
    >
      <div className="text-center">
        <div className="text-xs font-semibold tracking-[0.15em] uppercase text-slate-400 mb-6">
          Overall Risk Score
        </div>

        {/* Circular Progress Ring */}
        <div className="relative inline-flex items-center justify-center mb-6">
          <svg className="w-40 h-40 transform -rotate-90">
            {/* Background circle */}
            <circle
              cx="80"
              cy="80"
              r="45"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="8"
              fill="none"
            />
            {/* Progress circle */}
            <circle
              cx="80"
              cy="80"
              r="45"
              stroke={color.text}
              strokeWidth="8"
              fill="none"
              strokeDasharray="283"
              strokeDashoffset={283 - percentage}
              strokeLinecap="round"
              style={{
                filter: `drop-shadow(${color.glow})`,
                transition: 'stroke-dashoffset 1s ease-in-out',
              }}
            />
          </svg>

          {/* Score in the center */}
          <div className="absolute">
            <div
              className="text-6xl font-light tracking-tighter"
              style={{
                fontFamily: '"JetBrains Mono", monospace',
                color: color.text,
                textShadow: color.glow,
              }}
              data-testid="risk-score-value"
            >
              {score}
            </div>
            <div className="text-sm text-slate-400 mt-1">/ 100</div>
          </div>
        </div>

        {/* Severity Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full" style={{ backgroundColor: color.bg, border: `1px solid ${color.border}` }}>
          <AlertTriangle className="w-4 h-4" style={{ color: color.text }} strokeWidth={1.5} />
          <span className="text-sm font-medium capitalize" style={{ color: color.text, fontFamily: '"IBM Plex Sans", sans-serif' }}>
            {severity} Risk
          </span>
        </div>

        {/* Description */}
        <p className="mt-6 text-sm text-slate-400 leading-relaxed" style={{ fontFamily: '"IBM Plex Sans", sans-serif' }}>
          {severity === 'high' && 'This contract contains significant risk factors that require careful review.'}
          {severity === 'medium' && 'This contract has moderate risk elements that should be reviewed.'}
          {severity === 'low' && 'This contract appears to have minimal risk factors.'}
        </p>
      </div>
    </div>
  );
};

export default RiskScorePanel;
