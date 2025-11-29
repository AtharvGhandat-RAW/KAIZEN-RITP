import React from 'react';

interface KaizenLogoProps {
  className?: string;
}

export function KaizenLogo({ className = "" }: KaizenLogoProps) {
  return (
    <div className={`kaizen-premium-logo ${className}`}>
      <svg viewBox="0 0 500 200" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <defs>
          <style>
            {`
              @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@700&display=swap');
              
              .premium-text-main {
                font-family: 'Cinzel', 'Trajan Pro', 'Times New Roman', serif;
                font-weight: 700;
                font-size: 72px;
                letter-spacing: 12px;
                fill: transparent;
                stroke: #dc2626;
                stroke-width: 1.5;
                filter: drop-shadow(0 0 3px rgba(220, 38, 38, 0.9)) 
                        drop-shadow(0 0 8px rgba(220, 38, 38, 0.6))
                        drop-shadow(0 0 15px rgba(220, 38, 38, 0.4));
                animation: premiumGlow 4s ease-in-out infinite;
              }
              
              .premium-text-sub {
                font-family: 'Cinzel', 'Trajan Pro', 'Times New Roman', serif;
                font-weight: 700;
                font-size: 36px;
                letter-spacing: 24px;
                fill: transparent;
                stroke: #dc2626;
                stroke-width: 1;
                filter: drop-shadow(0 0 3px rgba(220, 38, 38, 0.8)) 
                        drop-shadow(0 0 8px rgba(220, 38, 38, 0.5));
                animation: premiumGlow 4s ease-in-out infinite 0.5s;
              }
              
              .premium-line {
                stroke: #dc2626;
                stroke-width: 2;
                stroke-linecap: round;
                filter: drop-shadow(0 0 4px rgba(220, 38, 38, 0.8));
              }
              
              .premium-ornament {
                fill: none;
                stroke: #dc2626;
                stroke-width: 1.5;
                filter: drop-shadow(0 0 3px rgba(220, 38, 38, 0.6));
              }
              
              @keyframes premiumGlow {
                0%, 100% {
                  filter: drop-shadow(0 0 3px rgba(220, 38, 38, 0.9)) 
                          drop-shadow(0 0 8px rgba(220, 38, 38, 0.6))
                          drop-shadow(0 0 15px rgba(220, 38, 38, 0.4));
                }
                50% {
                  filter: drop-shadow(0 0 5px rgba(220, 38, 38, 1)) 
                          drop-shadow(0 0 12px rgba(220, 38, 38, 0.8))
                          drop-shadow(0 0 20px rgba(220, 38, 38, 0.5));
                }
              }
            `}
          </style>

          {/* Gradient for premium effect */}
          <linearGradient id="premiumStroke" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#991b1b" />
            <stop offset="50%" stopColor="#ef4444" />
            <stop offset="100%" stopColor="#991b1b" />
          </linearGradient>
        </defs>

        {/* Top decorative line with ornaments */}
        <g className="premium-ornament">
          <line x1="80" y1="35" x2="180" y2="35" className="premium-line" />
          <circle cx="70" cy="35" r="4" />
          <line x1="320" y1="35" x2="420" y2="35" className="premium-line" />
          <circle cx="430" cy="35" r="4" />
        </g>

        {/* KAIZEN text */}
        <text x="250" y="105" textAnchor="middle" className="premium-text-main">
          KAIZEN
        </text>

        {/* RITP text */}
        <text x="262" y="150" textAnchor="middle" className="premium-text-sub">
          RITP
        </text>

        {/* Bottom decorative line with ornaments */}
        <g className="premium-ornament">
          <line x1="80" y1="170" x2="180" y2="170" className="premium-line" />
          <circle cx="70" cy="170" r="4" />
          <line x1="320" y1="170" x2="420" y2="170" className="premium-line" />
          <circle cx="430" cy="170" r="4" />
        </g>
      </svg>
    </div>
  );
}
