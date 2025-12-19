import React, { memo } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';

export const HeroSection = memo(function HeroSection({ onExploreEvents, animateIn = true }: { onExploreEvents?: () => void; animateIn?: boolean }) {
  const title = "KAIZEN";
  const isMobile = useIsMobile();
  const [shouldAnimate, setShouldAnimate] = React.useState(animateIn);

  React.useEffect(() => {
    if (animateIn) {
      setShouldAnimate(true);
    }
  }, [animateIn]);

  // Disable complex animations on mobile for performance
  const enableAnimations = shouldAnimate && !isMobile;

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
                WebkitTextStroke: isMobile ? '0.8px #ff4500' : '1.0px #ff4500',
                textShadow: isMobile
                  ? '0 0 8px rgba(255, 69, 0, 0.4)'
                  : `0 0 8px rgba(255, 69, 0, 0.4), 0 0 15px rgba(255, 69, 0, 0.3), 0 0 25px rgba(255, 69, 0, 0.2)`,
                animation: enableAnimations ? `letterReveal 0.6s ease-out ${index * 0.1}s forwards` : 'none',
                opacity: enableAnimations ? 0 : 1,
                transform: enableAnimations ? 'translateY(10px)' : 'none'
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
            animation: enableAnimations ? 'fadeInUp 0.8s ease-out 0.8s forwards' : 'none',
            opacity: enableAnimations ? 0 : 1
          }}
        >
          The Official Tech Fest of RIT —<br />
          <span style={{ color: 'rgba(255, 255, 255, 0.75)' }}>Stranger Things Edition</span>
        </p>

        {/* CTA Buttons with Enhanced Interactivity and entrance animation */}
        <div
          className="cta-buttons flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center px-4"
          style={{
            animation: enableAnimations ? 'fadeInUp 0.8s ease-out 1s forwards' : 'none',
            opacity: enableAnimations ? 0 : 1
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

      {/* CSS Animations & Responsive Styles - Optimized for Mobile Performance */}
      <style>{`
        /* Responsive Font Sizes */
        .kaizen-title {
          font-size: 42px; /* Smaller start for mobile */
        }

        .kaizen-letter {
          -webkit-text-stroke-width: 0.6px;
        }

        .subtitle {
          font-size: 14px;
          line-height: 1.5;
        }

        @media (min-width: 375px) {
          .kaizen-title {
            font-size: 52px;
          }
        }

        @media (min-width: 480px) {
          .kaizen-title {
            font-size: 70px;
          }
          .kaizen-letter {
            -webkit-text-stroke-width: 0.9px;
          }
          .subtitle {
            font-size: 16px;
          }
        }

        @media (min-width: 640px) {
          .kaizen-title {
            font-size: 90px;
          }
          .kaizen-letter {
            -webkit-text-stroke-width: 1.0px;
          }
          .subtitle {
            font-size: 18px;
          }
        }

        @media (min-width: 768px) {
          .kaizen-title {
            font-size: 110px;
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

        /* Lightweight animations - NO blur or filter for performance */
        @keyframes letterReveal {
          0% {
            opacity: 0;
            transform: translateY(10px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeInUp {
          0% {
            opacity: 0;
            transform: translateY(15px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
});
