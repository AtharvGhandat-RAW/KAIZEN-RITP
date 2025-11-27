import React, { memo, useMemo } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';

// Memoized particle component for better performance
const Particle = memo(({ style }: { style: React.CSSProperties }) => (
  <div className="absolute rounded-full" style={style} />
));
Particle.displayName = 'Particle';

export const AtmosphericBackground = memo(function AtmosphericBackground() {
  const isMobile = useIsMobile();
  
  // On mobile, use a static gradient background for maximum performance
  if (isMobile) {
    return (
      <div className="fixed inset-0 pointer-events-none z-0" style={{ contain: 'strict' }}>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-red-900/20 via-background to-background" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-red-950/30 via-transparent to-transparent" />
      </div>
    );
  }
  
  // Pre-calculate particles only once - reduce count on mobile
  const particles = useMemo(() => [...Array(15)].map((_, i) => {
    const xPos = Math.random() * 100;
    const yPos = Math.random() * 100;
    const size = 1 + Math.random() * 2;
    const duration = 15 + Math.random() * 25;
    const delay = Math.random() * 20;

    const opacity1 = (0.6 + (i * 0.03)).toFixed(2);
    const opacity2 = (0.3 + (i * 0.02)).toFixed(2);
    return {
      key: `particle-${i}`,
      style: {
        left: `${xPos}%`,
        top: `${yPos}%`,
        width: `${size}px`,
        height: `${size}px`,
        background: `radial-gradient(circle, rgba(255, 120, 60, ${opacity1}) 0%, rgba(255, 80, 40, ${opacity2}) 50%, transparent 100%)`,
        boxShadow: `0 0 ${4 + i * 0.5}px rgba(255, 100, 50, 0.7)`,
        filter: 'blur(0.5px)',
        animation: `particleDrift ${duration}s ease-in-out infinite`,
        animationDelay: `${delay}s`,
        willChange: 'transform' as const,
      }
    };
  }), []);

  // Pre-calculate embers only once - reduce count on mobile
  const embers = useMemo(() => [...Array(10)].map((_, i) => {
    const xPos = (i * 10) % 100;
    const yPos = 20 + (i * 6) % 60;
    const size = 1.5 + (i * 0.2);
    const duration = 20 + (i * 3);
    const delay = i * 2.5;
    const opacity1 = (0.7 + (i * 0.03)).toFixed(2);
    const opacity2 = (0.4 + (i * 0.03)).toFixed(2);
    return {
      key: `ember-${i}`,
      style: {
        left: `${xPos}%`,
        top: `${yPos}%`,
        width: `${size}px`,
        height: `${size}px`,
        background: `radial-gradient(circle, rgba(255, 140, 70, ${opacity1}) 0%, rgba(255, 100, 50, ${opacity2}) 50%, transparent 100%)`,
        boxShadow: `0 0 ${5 + i * 0.7}px rgba(255, 120, 60, 0.8)`,
        filter: 'blur(0.6px)',
        animation: `emberFloat ${duration}s ease-in-out infinite`,
        animationDelay: `${delay}s`,
        willChange: 'transform' as const,
      }
    };
  }), []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0" style={{ contain: 'strict' }}>
      {/* Optimized floating particles */}
      {particles.map(p => <Particle key={p.key} style={p.style} />)}

      {/* Optimized floating embers */}
      {embers.map(e => <Particle key={e.key} style={e.style} />)}

      {/* Very subtle background rift texture - not dominant */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full"
        style={{
          background: `
            radial-gradient(ellipse at 50% 50%, transparent 30%, rgba(40, 0, 0, 0.1) 60%, transparent 80%)
          `,
          opacity: 0.4,
          animation: 'subtleRiftPulse 10s ease-in-out infinite'
        }}
      />

      {/* Ambient glow spots */}
      <div
        className="absolute left-[20%] top-[30%] w-[300px] h-[300px] rounded-full"
        style={{
          background: 'radial-gradient(circle at center, rgba(80, 20, 0, 0.15) 0%, transparent 70%)',
          filter: 'blur(80px)',
          animation: 'glowSpot1 12s ease-in-out infinite'
        }}
      />
      <div
        className="absolute right-[25%] top-[40%] w-[350px] h-[350px] rounded-full"
        style={{
          background: 'radial-gradient(circle at center, rgba(70, 15, 0, 0.12) 0%, transparent 70%)',
          filter: 'blur(90px)',
          animation: 'glowSpot2 14s ease-in-out infinite'
        }}
      />
      <div
        className="absolute left-[30%] bottom-[25%] w-[280px] h-[280px] rounded-full"
        style={{
          background: 'radial-gradient(circle at center, rgba(75, 18, 0, 0.13) 0%, transparent 70%)',
          filter: 'blur(85px)',
          animation: 'glowSpot3 13s ease-in-out infinite'
        }}
      />

      {/* Subtle scanline effect for cinematic feel */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255, 255, 255, 0.03) 2px, rgba(255, 255, 255, 0.03) 4px)',
          pointerEvents: 'none'
        }}
      />

      {/* CSS Animations */}
      <style>{`
        @keyframes particleDrift {
          0% { 
            transform: translate(0, 0);
            opacity: 0.3;
          }
          25% {
            opacity: 0.7;
          }
          50% {
            transform: translate(${(Math.random() - 0.5) * 100}px, ${(Math.random() - 0.5) * 100}px);
            opacity: 0.9;
          }
          75% {
            opacity: 0.6;
          }
          100% { 
            transform: translate(${(Math.random() - 0.5) * 200}px, ${(Math.random() - 0.5) * 200}px);
            opacity: 0.3;
          }
        }

        @keyframes emberFloat {
          0% { 
            transform: translate(0, 0);
            opacity: 0;
          }
          10% {
            opacity: 0.6;
          }
          50% {
            transform: translate(${(Math.random() - 0.5) * 60}px, -${80 + Math.random() * 80}px);
            opacity: 0.8;
          }
          90% {
            opacity: 0.3;
          }
          100% { 
            transform: translate(${(Math.random() - 0.5) * 100}px, -${140 + Math.random() * 120}px);
            opacity: 0;
          }
        }

        @keyframes subtleRiftPulse {
          0%, 100% { 
            opacity: 0.3;
            transform: translate(-50%, -50%) scale(1);
          }
          50% { 
            opacity: 0.5;
            transform: translate(-50%, -50%) scale(1.1);
          }
        }

        @keyframes glowSpot1 {
          0%, 100% { 
            opacity: 0.5;
            transform: translate(0, 0) scale(1);
          }
          50% { 
            opacity: 0.8;
            transform: translate(20px, -20px) scale(1.2);
          }
        }

        @keyframes glowSpot2 {
          0%, 100% { 
            opacity: 0.4;
            transform: translate(0, 0) scale(1);
          }
          50% { 
            opacity: 0.7;
            transform: translate(-25px, 25px) scale(1.15);
          }
        }

        @keyframes glowSpot3 {
          0%, 100% { 
            opacity: 0.45;
            transform: translate(0, 0) scale(1);
          }
          50% { 
            opacity: 0.75;
            transform: translate(15px, 15px) scale(1.18);
          }
        }
      `}</style>
    </div>
  );
});
