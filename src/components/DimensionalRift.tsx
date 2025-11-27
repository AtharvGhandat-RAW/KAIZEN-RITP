import React from 'react';
import { useIsMobile } from '@/hooks/use-mobile';

export function DimensionalRift() {
  const isMobile = useIsMobile();

  // Don't render heavy rift on mobile
  if (isMobile) return null;

  return (
    <div className="fixed right-[8%] top-1/2 -translate-y-1/2 w-[450px] h-[850px] pointer-events-none z-5">
      
      {/* Atmospheric red fog */}
      <div 
        className="absolute inset-0 flex items-center justify-center"
        style={{
          filter: 'blur(120px)',
          opacity: 0.3
        }}
      >
        <div 
          className="w-[400px] h-[700px]"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(255, 50, 0, 0.5) 0%, rgba(200, 30, 0, 0.3) 35%, transparent 70%)',
          }}
        />
      </div>

      {/* Simple floating dots */}
      <div className="absolute inset-0 flex items-center justify-center">
        {[...Array(50)].map((_, i) => {
          const xPos = -100 + Math.random() * 200;
          const yPos = -200 + Math.random() * 400;
          const size = 1 + Math.random() * 3;
          
          return (
            <div
              key={`dot-${i}`}
              className="absolute rounded-full"
              style={{
                width: `${size}px`,
                height: `${size}px`,
                left: `calc(50% + ${xPos}px)`,
                top: `calc(50% + ${yPos}px)`,
                background: `radial-gradient(circle, 
                  rgba(255, ${100 + Math.random() * 100}, ${50 + Math.random() * 50}, ${0.8 + Math.random() * 0.2}) 0%, 
                  rgba(255, ${80 + Math.random() * 80}, ${40 + Math.random() * 40}, ${0.4 + Math.random() * 0.3}) 50%, 
                  transparent 100%
                )`,
                boxShadow: `0 0 ${4 + Math.random() * 6}px rgba(255, ${100 + Math.random() * 80}, ${50 + Math.random() * 40}, 0.8)`,
                animation: `floatDot ${4 + Math.random() * 6}s ease-in-out infinite`,
                animationDelay: `${Math.random() * 4}s`
              }}
            />
          );
        })}
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes floatDot {
          0%, 100% { 
            transform: translate(0, 0);
            opacity: 0.3;
          }
          25% {
            transform: translate(${(Math.random() - 0.5) * 30}px, ${(Math.random() - 0.5) * 30}px);
            opacity: 0.8;
          }
          50% {
            transform: translate(${(Math.random() - 0.5) * 50}px, ${(Math.random() - 0.5) * 50}px);
            opacity: 1;
          }
          75% {
            transform: translate(${(Math.random() - 0.5) * 30}px, ${(Math.random() - 0.5) * 30}px);
            opacity: 0.8;
          }
        }
      `}</style>
    </div>
  );
}