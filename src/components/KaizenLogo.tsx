import React from 'react';

interface KaizenLogoProps {
  className?: string;
}

export function KaizenLogo({ className = "" }: KaizenLogoProps) {
  return (
    <div className={`kaizen-stranger-logo ${className}`}>
      <svg viewBox="0 0 500 200" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <defs>
          <style>
            {`
              @import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:wght@700&display=swap');
              
              .stranger-text {
                font-family: 'Libre Baskerville', 'ITC Benguiat', 'Times New Roman', serif;
                font-weight: 700;
                font-size: 60px;
                letter-spacing: 8px;
                fill: none;
                stroke: #ff0000;
                stroke-width: 2.5;
                stroke-linejoin: round;
                filter: drop-shadow(0 0 8px rgba(255, 0, 0, 0.8)) 
                        drop-shadow(0 0 15px rgba(255, 0, 0, 0.5))
                        drop-shadow(0 0 25px rgba(255, 0, 0, 0.3));
              }
              
              .stranger-text-small {
                font-family: 'Libre Baskerville', 'ITC Benguiat', 'Times New Roman', serif;
                font-weight: 700;
                font-size: 58px;
                letter-spacing: 18px;
                fill: none;
                stroke: #ff0000;
                stroke-width: 2.5;
                stroke-linejoin: round;
                filter: drop-shadow(0 0 8px rgba(255, 0, 0, 0.8)) 
                        drop-shadow(0 0 15px rgba(255, 0, 0, 0.5))
                        drop-shadow(0 0 25px rgba(255, 0, 0, 0.3));
              }
              
              .stranger-line {
                stroke: #ff0000;
                stroke-width: 3;
                stroke-linecap: square;
                filter: drop-shadow(0 0 6px rgba(255, 0, 0, 0.7));
              }
            `}
          </style>
        </defs>
        
        {/* Top line */}
        <line x1="50" y1="30" x2="450" y2="30" className="stranger-line" />
        
        {/* KAIZEN text */}
        <text x="250" y="90" textAnchor="middle" className="stranger-text">
          KAIZEN
        </text>
        
        {/* RITP text */}
        <text x="250" y="155" textAnchor="middle" className="stranger-text-small">
          RITP
        </text>
        
        {/* Bottom line */}
        <line x1="50" y1="175" x2="450" y2="175" className="stranger-line" />
      </svg>
    </div>
  );
}
