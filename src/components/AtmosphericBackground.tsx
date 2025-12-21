import React, { memo, useEffect, useState } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';

export const AtmosphericBackground = memo(function AtmosphericBackground() {
  const isMobile = useIsMobile();
  const [lightning, setLightning] = useState(false);

  // Random lightning flashes
  useEffect(() => {
    const triggerLightning = () => {
      if (Math.random() > 0.7) {
        setLightning(true);
        setTimeout(() => setLightning(false), 100 + Math.random() * 200);
      }
      // Schedule next check
      setTimeout(triggerLightning, 2000 + Math.random() * 5000);
    };
    
    const timer = setTimeout(triggerLightning, 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-black">
      {/* 1. Base Sky Gradient - Deep Red to Black */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(to bottom, #000000 0%, #1a0505 40%, #4a0a0a 80%, #7f1d1d 100%)',
        }}
      />

      {/* 2. Moving Clouds / Fog Layers */}
      <div className="absolute inset-0 opacity-60 mix-blend-overlay">
        <div className="absolute inset-0 animate-fog-flow" 
             style={{
               backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(255,0,0,0.1) 0%, transparent 50%), radial-gradient(circle at 80% 30%, rgba(100,0,0,0.2) 0%, transparent 40%)',
               filter: 'blur(40px)',
               transform: 'scale(1.5)',
             }} 
        />
      </div>

      {/* 3. The "Shadow Monster" in the Sky (Abstract Silhouette) */}
      <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[80vw] h-[60vh] opacity-40 mix-blend-multiply pointer-events-none">
         <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="w-full h-full filter blur-xl animate-pulse-slow">
            <path fill="#000000" d="M45.7,-76.3C58.9,-69.3,69.1,-55.6,76.3,-41.2C83.5,-26.9,87.7,-11.8,85.8,2.4C83.9,16.6,75.9,29.9,66.3,41.5C56.7,53.1,45.5,63,32.9,68.9C20.3,74.8,6.3,76.7,-6.8,75.1C-19.9,73.5,-32.1,68.4,-43.3,60.8C-54.5,53.2,-64.7,43.1,-71.8,31.1C-78.9,19.1,-82.9,5.2,-80.4,-7.5C-77.9,-20.2,-68.9,-31.7,-58.3,-41.3C-47.7,-50.9,-35.5,-58.6,-23.1,-66.1C-10.7,-73.6,1.9,-80.9,15.3,-81.8C28.7,-82.7,42.9,-77.2,45.7,-76.3Z" transform="translate(100 100)" />
         </svg>
      </div>

      {/* 4. Lightning Flash Overlay */}
      <div 
        className={`absolute inset-0 bg-red-500 mix-blend-overlay transition-opacity duration-75 ${lightning ? 'opacity-30' : 'opacity-0'}`}
      />
      <div 
        className={`absolute inset-0 bg-white mix-blend-overlay transition-opacity duration-50 ${lightning ? 'opacity-10' : 'opacity-0'}`}
      />

      {/* 5. Floating Spores / Particles */}
      <div className="absolute inset-0 opacity-50">
        {[...Array(isMobile ? 10 : 20)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white/40 blur-[1px] animate-float-particle"
            style={{
              width: Math.random() * 3 + 1 + 'px',
              height: Math.random() * 3 + 1 + 'px',
              left: Math.random() * 100 + '%',
              top: Math.random() * 100 + '%',
              animationDuration: 10 + Math.random() * 20 + 's',
              animationDelay: -Math.random() * 20 + 's',
            }}
          />
        ))}
      </div>

      {/* 6. Ground/Tree Silhouette Layers */}
      {/* Back Layer (Lighter/Further) */}
      <div className="absolute bottom-0 left-0 right-0 h-[30vh] sm:h-[40vh] z-10 opacity-80">
         <svg viewBox="0 0 1440 320" className="w-full h-full preserve-3d" preserveAspectRatio="none">
            <path fill="#1a0505" fillOpacity="1" d="M0,256L40,245.3C80,235,160,213,240,218.7C320,224,400,256,480,261.3C560,267,640,245,720,229.3C800,213,880,203,960,208C1040,213,1120,235,1200,240C1280,245,1360,235,1400,229.3L1440,224L1440,320L1400,320C1360,320,1280,320,1200,320C1120,320,1040,320,960,320C880,320,800,320,720,320C640,320,560,320,480,320C400,320,320,320,240,320C160,320,80,320,40,320L0,320Z"></path>
         </svg>
      </div>

      {/* Front Layer (Darker/Closer - Jagged Trees) */}
      <div className="absolute bottom-0 left-0 right-0 h-[25vh] sm:h-[35vh] z-20">
         <svg viewBox="0 0 1440 320" className="w-full h-full" preserveAspectRatio="none">
            <path fill="#000000" fillOpacity="1" d="M0,288L24,272C48,256,96,224,144,229.3C192,235,240,277,288,288C336,299,384,277,432,250.7C480,224,528,192,576,197.3C624,203,672,245,720,256C768,267,816,245,864,224C912,203,960,181,1008,186.7C1056,192,1104,224,1152,240C1200,256,1248,256,1296,245.3C1344,235,1392,213,1416,202.7L1440,192L1440,320L1416,320C1392,320,1344,320,1296,320C1248,320,1200,320,1152,320C1104,320,1056,320,1008,320C960,320,912,320,864,320C816,320,768,320,720,320C672,320,624,320,576,320C528,320,480,320,432,320C384,320,336,320,288,320C240,320,192,320,144,320C96,320,48,320,24,320L0,320Z"></path>
         </svg>
      </div>

      {/* 7. Fog at the bottom to blend */}
      <div className="absolute bottom-0 left-0 right-0 h-[20vh] bg-gradient-to-t from-black via-black/80 to-transparent z-30" />

      <style>{`
        @keyframes fog-flow {
          0% { transform: scale(1.5) translate(0, 0); }
          50% { transform: scale(1.6) translate(-2%, -1%); }
          100% { transform: scale(1.5) translate(0, 0); }
        }
        .animate-fog-flow {
          animation: fog-flow 20s ease-in-out infinite alternate;
        }
        @keyframes float-particle {
          0% { transform: translateY(0) translateX(0); opacity: 0; }
          20% { opacity: 0.5; }
          80% { opacity: 0.5; }
          100% { transform: translateY(-100px) translateX(20px); opacity: 0; }
        }
        .animate-float-particle {
          animation-name: float-particle;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.3; transform: translateX(-50%) scale(1); }
          50% { opacity: 0.5; transform: translateX(-50%) scale(1.05); }
        }
        .animate-pulse-slow {
          animation: pulse-slow 8s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
});
