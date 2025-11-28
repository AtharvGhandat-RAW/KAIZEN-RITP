import React, { memo, useMemo } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';

// Memoized particle component for better performance
const Particle = memo(({ style }: { style: React.CSSProperties }) => (
  <div className="absolute rounded-full" style={style} />
));
Particle.displayName = 'Particle';

export const AtmosphericBackground = memo(function AtmosphericBackground() {
  const isMobile = useIsMobile();

  // Pre-calculate particles - REDUCED from 15 to 6 for performance
  const particles = useMemo(() => [...Array(6)].map((_, i) => {
    const xPos = (i * 16) % 100;
    const yPos = (i * 18 + 10) % 100;
    const size = 1.5 + (i * 0.3);
    const duration = 20 + (i * 5);
    const delay = i * 3;

    return {
      key: `particle-${i}`,
      style: {
        left: `${xPos}%`,
        top: `${yPos}%`,
        width: `${size}px`,
        height: `${size}px`,
        background: `radial-gradient(circle, rgba(255, 120, 60, 0.7) 0%, rgba(255, 80, 40, 0.4) 50%, transparent 100%)`,
        boxShadow: `0 0 ${4 + i}px rgba(255, 100, 50, 0.6)`,
        animation: `particleDrift ${duration}s ease-in-out infinite`,
        animationDelay: `${delay}s`,
      }
    };
  }), []);

  // Pre-calculate embers - REDUCED from 10 to 4 for performance
  const embers = useMemo(() => [...Array(4)].map((_, i) => {
    const xPos = (i * 25) % 100;
    const yPos = 25 + (i * 15) % 50;
    const size = 2 + (i * 0.3);
    const duration = 25 + (i * 5);
    const delay = i * 4;
    return {
      key: `ember-${i}`,
      style: {
        left: `${xPos}%`,
        top: `${yPos}%`,
        width: `${size}px`,
        height: `${size}px`,
        background: `radial-gradient(circle, rgba(255, 140, 70, 0.75) 0%, rgba(255, 100, 50, 0.45) 50%, transparent 100%)`,
        boxShadow: `0 0 ${6 + i}px rgba(255, 120, 60, 0.7)`,
        animation: `emberFloat ${duration}s ease-in-out infinite`,
        animationDelay: `${delay}s`,
      }
    };
  }), []);

  // On mobile, use a static gradient background for maximum performance
  if (isMobile) {
    return (
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-red-900/20 via-background to-background" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 pointer-events-none z-0">
      {/* Optimized floating particles - reduced count */}
      {particles.map(p => <Particle key={p.key} style={p.style} />)}

      {/* Optimized floating embers - reduced count */}
      {embers.map(e => <Particle key={e.key} style={e.style} />)}

      {/* Simple ambient glow - just one instead of multiple */}
      <div
        className="absolute left-[30%] top-[40%] w-[400px] h-[400px] rounded-full"
        style={{
          background: 'radial-gradient(circle at center, rgba(80, 20, 0, 0.12) 0%, transparent 70%)',
          filter: 'blur(100px)',
        }}
      />

      {/* Simplified CSS Animations */}
      <style>{`
        @keyframes particleDrift {
          0%, 100% { 
            transform: translateY(0);
            opacity: 0.4;
          }
          50% {
            transform: translateY(-30px);
            opacity: 0.8;
          }
        }

        @keyframes emberFloat {
          0%, 100% { 
            transform: translateY(0);
            opacity: 0.3;
          }
          50% {
            transform: translateY(-50px);
            opacity: 0.7;
          }
        }
      `}</style>
    </div>
  );
});
