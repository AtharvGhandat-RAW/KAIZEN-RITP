import React, { memo } from 'react';

export const HeroSection = memo(function HeroSection({ onExploreEvents, animateIn = true }: { onExploreEvents?: () => void; animateIn?: boolean }) {
  const title = "KAIZEN";
  const [shouldAnimate, setShouldAnimate] = React.useState(animateIn);

  React.useEffect(() => {
    if (animateIn) {
      setShouldAnimate(true);
    }
  }, [animateIn]);

  return (
    <div className="hero-section relative pt-20 sm:pt-24 md:pt-28 pb-16 sm:pb-20 md:pb-24 px-4 sm:px-6 md:px-8 lg:px-12 flex items-center justify-center min-h-screen w-full max-w-[1440px] mx-auto">
      <div className="text-center w-full max-w-4xl mx-auto">
        {/* Main Title - Character-by-Character Animation */}
        <h1
          className="kaizen-title mb-6 sm:mb-8 tracking-wider relative"
          style={{
            fontFamily: '"Benguiat", "ITC Benguiat", "Libre Baskerville", "Merriweather", "Times New Roman", serif',
            lineHeight: '1',
            letterSpacing: '0.05em',
            textTransform: 'uppercase'
          }}
        >
          {title.split('').map((char, index) => (
            <span
              key={index}
              className="inline-block kaizen-letter"
              style={{
                color: 'transparent',
                WebkitTextStroke: '1.0px #ff4500',
                textShadow: `
                  0 0 8px rgba(255, 69, 0, 0.4),
                  0 0 15px rgba(255, 69, 0, 0.3),
                  0 0 25px rgba(255, 69, 0, 0.2),
                  0 0 35px rgba(255, 0, 0, 0.15)
                `,
                filter: 'contrast(1.1)',
                animation: shouldAnimate ? `
                  letterGlitchReveal 0.8s ease-out ${index * 0.12}s forwards,
                  letterGlow 6s ease-in-out infinite ${1.2 + index * 0.12}s
                ` : 'none',
                opacity: shouldAnimate ? 0 : 1,
                transform: shouldAnimate ? 'scale(0.9) translateY(20px)' : 'none'
              }}
            >
              {char}
            </span>
          ))}
        </h1>

        {/* Subtitle with entrance animation */}
        <p
          className="subtitle text-white/90 mb-8 sm:mb-10 md:mb-12 px-4"
          style={{
            textShadow: '0 2px 10px rgba(0, 0, 0, 0.8)',
            letterSpacing: '0.02em',
            animation: shouldAnimate ? 'subtitleEntrance 1.5s ease-out 1.2s forwards' : 'none',
            opacity: shouldAnimate ? 0 : 1
          }}
        >
          The Official Tech Fest of RIT —<br />
          <span style={{ color: 'rgba(255, 255, 255, 0.75)' }}>Stranger Things Edition</span>
        </p>

        {/* CTA Buttons with Enhanced Interactivity and entrance animation */}
        <div
          className="cta-buttons flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center px-4"
          style={{
            animation: shouldAnimate ? 'buttonsEntrance 1.5s ease-out 1.5s forwards' : 'none',
            opacity: shouldAnimate ? 0 : 1
          }}
        >
          <button
            className="group relative px-6 sm:px-8 md:px-10 py-3 sm:py-3.5 border-2 border-red-600 text-white transition-all duration-300 overflow-hidden w-full sm:w-auto"
            style={{ fontSize: '14px', letterSpacing: '0.05em' }}
            onClick={onExploreEvents}
          >
            <span className="relative z-10 text-center">Explore Events</span>
            <div
              className="absolute inset-0 bg-red-600/0 group-hover:bg-red-600/20 transition-all duration-300"
              style={{
                boxShadow: '0 0 0px rgba(255, 69, 0, 0)',
                transition: 'all 0.3s ease'
              }}
            />
            <div
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              style={{
                boxShadow: 'inset 0 0 20px rgba(255, 69, 0, 0.3), 0 0 20px rgba(255, 69, 0, 0.2)'
              }}
            />
          </button>
        </div>
      </div>

      {/* CSS Animations & Responsive Styles */}
      <style>{`
        /* Responsive Font Sizes */
        .kaizen-title {
          font-size: 60px;
        }

        .kaizen-letter {
          -webkit-text-stroke-width: 0.8px;
        }

        .subtitle {
          font-size: 16px;
          line-height: 1.6;
        }

        @media (min-width: 480px) {
          .kaizen-title {
            font-size: 80px;
          }
          .kaizen-letter {
            -webkit-text-stroke-width: 0.9px;
          }
          .subtitle {
            font-size: 18px;
          }
        }

        @media (min-width: 640px) {
          .kaizen-title {
            font-size: 100px;
          }
          .kaizen-letter {
            -webkit-text-stroke-width: 1.0px;
          }
          .subtitle {
            font-size: 19px;
          }
        }

        @media (min-width: 768px) {
          .kaizen-title {
            font-size: 120px;
          }
          .subtitle {
            font-size: 20px;
          }
        }

        @media (min-width: 1024px) {
          .kaizen-title {
            font-size: 140px;
          }
          .subtitle {
            font-size: 22px;
          }
        }

        @keyframes letterGlitchReveal {
          0% {
            opacity: 0;
            transform: scale(0.85) translateY(30px);
            filter: blur(8px) contrast(1.1);
          }
          20% {
            opacity: 0.3;
            transform: scale(0.92) translateY(20px) translateX(-3px);
            filter: blur(6px) contrast(1.1);
          }
          40% {
            opacity: 0.6;
            transform: scale(1.05) translateY(10px) translateX(3px);
            filter: blur(4px) contrast(1.1);
          }
          60% {
            opacity: 0.8;
            transform: scale(0.98) translateY(5px) translateX(-2px);
            filter: blur(2px) contrast(1.1);
          }
          80% {
            opacity: 0.95;
            transform: scale(1.02) translateY(0px) translateX(1px);
            filter: blur(1px) contrast(1.1);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0px) translateX(0px);
            filter: blur(0px) contrast(1.1);
          }
        }

        @keyframes letterGlow {
          0%, 100% {
            text-shadow: 
              0 0 8px rgba(255, 69, 0, 0.4),
              0 0 15px rgba(255, 69, 0, 0.3),
              0 0 25px rgba(255, 69, 0, 0.2),
              0 0 35px rgba(255, 0, 0, 0.15);
          }
          50% {
            text-shadow: 
              0 0 12px rgba(255, 69, 0, 0.5),
              0 0 20px rgba(255, 69, 0, 0.4),
              0 0 30px rgba(255, 69, 0, 0.3),
              0 0 40px rgba(255, 0, 0, 0.2);
          }
        }

        @keyframes subtitleEntrance {
          0% {
            opacity: 0;
            transform: translateY(20px);
            filter: blur(5px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
            filter: blur(0px);
          }
        }

        @keyframes buttonsEntrance {
          0% {
            opacity: 0;
            transform: translateY(20px);
            filter: blur(5px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
            filter: blur(0px);
          }
        }

        @keyframes lineExpand {
          0% {
            width: 0px;
            opacity: 0;
          }
          100% {
            width: 60px;
            opacity: 1;
          }
        }

        @media (min-width: 640px) {
          @keyframes lineExpand {
            0% {
              width: 0px;
              opacity: 0;
            }
            100% {
              width: 80px;
              opacity: 1;
            }
          }
        }

        @media (min-width: 768px) {
          @keyframes lineExpand {
            0% {
              width: 0px;
              opacity: 0;
            }
            100% {
              width: 96px;
              opacity: 1;
            }
          }
        }

        @keyframes dangerPulse {
          0%, 100% { 
            box-shadow: inset 0 0 25px rgba(255, 69, 0, 0.4), 0 0 25px rgba(255, 69, 0, 0.3);
          }
          50% { 
            box-shadow: inset 0 0 30px rgba(255, 69, 0, 0.5), 0 0 30px rgba(255, 69, 0, 0.4);
          }
        }
      `}</style>
    </div>
  );
});
