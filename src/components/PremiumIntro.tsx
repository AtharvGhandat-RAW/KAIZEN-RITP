import { useEffect, useState } from 'react';
import { KaizenLogo } from '@/components/KaizenLogo';

interface PremiumIntroProps {
  onComplete: () => void;
}

// Stranger Things–inspired cinematic intro
export const PremiumIntro = ({ onComplete }: PremiumIntroProps) => {
  const [currentScene, setCurrentScene] = useState(0);
  const [opacity, setOpacity] = useState(0);

  // Full timeline based on your prompt
  const scenes = [
    { type: 'opening', duration: 2000 }, // Scene 1
    { type: 'credits', title: 'FEST COORDINATORS', names: ['Rishikant Mallick', 'Pravin Thite'], duration: 4000 }, // 2
    { type: 'credits', title: 'OPERATIONS UNIT', names: ['Shrinivas (AIML)', 'Janhavi (CO)'], duration: 3000 }, // 3
    { type: 'credits', title: 'MANAGEMENT UNIT', names: ['Vitali (AIML)', 'Aviraj (CO)'], duration: 3000 }, // 4
    { type: 'credits', title: 'DIGITAL MEDIA UNIT', names: ['Riya (AIML)', 'Siddhant (CO)'], duration: 3000 }, // 5
    { type: 'credits', title: 'TECH & PRODUCTION UNIT', names: ['Athrav (AIML)', 'Shravani (CO)', 'Amar (AIML)'], duration: 3000 }, // 6
    { type: 'credits', title: 'PARTNERSHIP UNIT', names: ['Prasad (AIML)', 'Sonal (AIML)'], duration: 3000 }, // 7
    { type: 'credits', title: 'AMBIENCE DESIGN UNIT', names: ['Mayuri (AIML)', 'Sanika (AIML)', 'Sunil (AIML)'], duration: 3000 }, // 8
    { type: 'portal', duration: 3000 }, // 9
    { type: 'finale', duration: 4000 }, // 10
    { type: 'enter', duration: 0 }, // 11 – stays until user clicks
  ] as const;

  useEffect(() => {
    let advanceTimer: number | undefined;
    const fadeInTimer: number | undefined = window.setTimeout(() => setOpacity(1), 80);

    // fade in scene
    setOpacity(0);

    const scene = scenes[currentScene];

    // auto-advance until last scene ("enter")
    if (scene.duration > 0 && currentScene < scenes.length - 1) {
      advanceTimer = window.setTimeout(() => {
        setOpacity(0);
        window.setTimeout(() => setCurrentScene((s) => s + 1), 400);
      }, scene.duration);
    }

    return () => {
      if (advanceTimer) window.clearTimeout(advanceTimer);
      if (fadeInTimer) window.clearTimeout(fadeInTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentScene]);

  const handleComplete = () => {
    localStorage.setItem('kaizen-intro-v2-seen', 'true');
    onComplete();
  };

  const current = scenes[currentScene];

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black overflow-hidden">
      {/* Atmospheric background */}
      <div className="absolute inset-0">
        {/* Deep red fog */}
        <div
          className="absolute inset-0 opacity-50"
          style={{
            background:
              'radial-gradient(circle at center, rgba(255,26,26,0.4) 0%, rgba(179,0,0,0.25) 35%, rgba(0,0,0,0.95) 70%)',
            animation: 'intro-fog 10s ease-in-out infinite',
          }}
        />

        {/* Floating particles */}
        <div className="absolute inset-0 overflow-hidden">
          {Array.from({ length: 24 }).map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full"
              style={{
                width: `${1 + (i % 3)}px`,
                height: `${1 + (i % 3)}px`,
                left: `${(i * 37) % 100}%`,
                top: `${(i * 53) % 100}%`,
                background: 'rgba(255,26,26,0.6)',
                boxShadow: '0 0 12px rgba(255,26,26,0.7)',
                animation: `intro-particle ${8 + (i % 5)}s linear infinite`,
                animationDelay: `${i * 0.2}s`,
              }}
            />
          ))}
        </div>

        {/* Vignette + scanline feel */}
        <div
          className="absolute inset-0 opacity-80"
          style={{
            background:
              'radial-gradient(circle at center, transparent 0%, transparent 45%, rgba(0,0,0,0.9) 90%)',
          }}
        />
        <div
          className="absolute inset-0 opacity-20 mix-blend-screen"
          style={{
            background:
              'repeating-linear-gradient(0deg, rgba(255,26,26,0.14) 0, rgba(255,26,26,0.14) 1px, transparent 2px, transparent 4px)',
            animation: 'intro-scan 4s linear infinite',
          }}
        />
      </div>

      {/* Skip button – always visible for UX */}
      <button
        onClick={handleComplete}
        className="fixed top-4 right-4 sm:top-6 sm:right-6 z-50 px-4 py-2 text-[10px] sm:text-xs md:text-sm uppercase tracking-[0.25em] transition-transform duration-300 hover:scale-105"
        style={{
          fontFamily: 'Cinzel, serif',
          color: '#ff1a1a',
          border: '1px solid rgba(255,26,26,0.4)',
          background: 'rgba(0,0,0,0.7)',
          textShadow: '0 0 12px rgba(255,26,26,0.9)',
          backdropFilter: 'blur(8px)',
        }}
      >
        Skip Intro
      </button>

      {/* Main content */}
      <div
        className="relative z-10 max-w-5xl w-full px-4 sm:px-8 text-center transition-opacity duration-500"
        style={{ opacity }}
      >
        {/* Scene 1 – Dark awakening */}
        {current.type === 'opening' && (
          <p
            className="text-xs sm:text-sm md:text-base uppercase tracking-[0.4em] text-red-400/80"
            style={{
              fontFamily: 'Cinzel, serif',
              textShadow: '0 0 16px rgba(255,26,26,0.7)',
            }}
          >
            A FEST BEYOND THE ORDINARY…
          </p>
        )}

        {/* Scenes 2–8 – Units & names */}
        {current.type === 'credits' && (
          <div className="space-y-6 sm:space-y-8">
            <h2
              className="text-xl sm:text-3xl md:text-4xl lg:text-5xl uppercase tracking-[0.35em]"
              style={{
                fontFamily: 'Cinzel, serif',
                color: '#ff1a1a',
                textShadow:
                  '0 0 26px rgba(255,26,26,1), 0 0 52px rgba(255,26,26,0.8), 0 0 90px rgba(179,0,0,0.7)',
              }}
            >
              {current.title}
            </h2>
            <div className="space-y-3 sm:space-y-4">
              {current.names?.map((name, idx) => (
                <p
                  key={name}
                  className="text-sm sm:text-lg md:text-2xl text-white/90 tracking-[0.15em]"
                  style={{
                    fontFamily: 'Cinzel, serif',
                    textShadow: '0 0 20px rgba(255,255,255,0.5)',
                    animation: `intro-name 0.8s ease-out ${idx * 0.1}s both`,
                  }}
                >
                  {name}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Scene 9 – Portal emerges */}
        {current.type === 'portal' && (
          <div className="flex flex-col items-center justify-center space-y-6">
            <div className="relative">
              <div
                className="absolute inset-0 rounded-full"
                style={{
                  width: '260px',
                  height: '260px',
                  background:
                    'radial-gradient(ellipse at center, rgba(255,26,26,0.5) 0%, rgba(179,0,0,0.35) 40%, transparent 70%)',
                  filter: 'blur(18px)',
                  animation: 'intro-portal 3s ease-in-out infinite',
                }}
              />
              <div className="relative flex items-center justify-center w-44 h-44 sm:w-56 sm:h-56 md:w-64 md:h-64">
                <KaizenLogo
                  className="relative z-10 w-full h-full"
                />
              </div>
            </div>
          </div>
        )}

        {/* Scene 10 – Final KAIZEN reveal */}
        {current.type === 'finale' && (
          <div className="space-y-6 sm:space-y-8">
            <h1
              className="text-5xl sm:text-6xl md:text-8xl lg:text-9xl uppercase tracking-[0.35em]"
              style={{
                fontFamily: 'Cinzel, serif',
                color: '#ff1a1a',
                textShadow:
                  '0 0 40px rgba(255,26,26,1), 0 0 80px rgba(255,26,26,0.9), 0 0 130px rgba(179,0,0,0.8)',
                animation: 'intro-title 2.2s ease-in-out infinite',
              }}
            >
              KAIZEN
            </h1>
            <h2
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl uppercase tracking-[0.45em]"
              style={{
                fontFamily: 'Cinzel, serif',
                color: '#d10000',
                textShadow: '0 0 30px rgba(209,0,0,0.95)',
              }}
            >
              RITP
            </h2>
            <p
              className="mt-6 text-xs sm:text-sm md:text-base uppercase tracking-[0.6em] text-red-300/90"
              style={{
                fontFamily: 'Cinzel, serif',
                textShadow: '0 0 20px rgba(255,26,26,0.7)',
              }}
            >
              FEAR THE UNKNOWN
            </p>
          </div>
        )}

        {/* Scene 11 – Enter button + skip hint */}
        {current.type === 'enter' && (
          <div className="flex flex-col items-center justify-center space-y-10">
            <button
              onClick={handleComplete}
              className="relative px-10 py-4 text-xs sm:text-sm md:text-base uppercase tracking-[0.35em] transition-transform duration-300 hover:scale-110"
              style={{
                fontFamily: 'Cinzel, serif',
                color: '#ff1a1a',
                border: '2px solid rgba(255,26,26,0.65)',
                background: 'rgba(0,0,0,0.8)',
                boxShadow:
                  '0 0 28px rgba(255,26,26,0.5), inset 0 0 18px rgba(255,26,26,0.3)',
              }}
            >
              Enter the Upside Down →
            </button>
          </div>
        )}
      </div>

      {/* Custom intro animations */}
      <style>{`
        @keyframes intro-fog {
          0%, 100% { transform: scale(1); opacity: 0.45; }
          50% { transform: scale(1.06); opacity: 0.7; }
        }

        @keyframes intro-particle {
          0% { transform: translate3d(0, 10vh, 0); opacity: 0; }
          10% { opacity: 0.7; }
          80% { opacity: 0.7; }
          100% { transform: translate3d(0, -90vh, 0); opacity: 0; }
        }

        @keyframes intro-scan {
          0% { transform: translateY(0); }
          100% { transform: translateY(-8px); }
        }

        @keyframes intro-name {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes intro-portal {
          0%, 100% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.12); opacity: 0.8; }
        }

        @keyframes intro-portal-rotate {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @keyframes intro-title {
          0%, 100% { text-shadow: 0 0 40px rgba(255,26,26,1), 0 0 90px rgba(179,0,0,0.8); }
          50% { text-shadow: 0 0 60px rgba(255,26,26,1), 0 0 120px rgba(179,0,0,1); }
        }
      `}</style>
    </div>
  );
};
