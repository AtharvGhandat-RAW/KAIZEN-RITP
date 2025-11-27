import React, { useState, useEffect } from 'react';
import { X, Zap, AlertTriangle, Radio, Eye, Skull, ChevronRight, Lock, Sparkles } from 'lucide-react';

interface UpsideDownProps {
  onClose: () => void;
}

export function UpsideDown({ onClose }: UpsideDownProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [glitchActive, setGlitchActive] = useState(false);
  const [particleCount, setParticleCount] = useState(40);
  const [vineCount, setVineCount] = useState(10);

  useEffect(() => {
    // DO NOT prevent body scroll - let it scroll naturally
    // document.body.style.overflow = 'hidden';
    
    // Set responsive counts based on screen size
    const updateCounts = () => {
      const width = window.innerWidth;
      if (width < 640) {
        setParticleCount(12);
        setVineCount(0);
      } else if (width < 768) {
        setParticleCount(18);
        setVineCount(4);
      } else if (width < 1024) {
        setParticleCount(25);
        setVineCount(6);
      } else {
        setParticleCount(40);
        setVineCount(10);
      }
    };
    
    updateCounts();
    window.addEventListener('resize', updateCounts);
    
    // Trigger entrance animation
    setTimeout(() => setIsVisible(true), 50);

    // Random glitch effects
    const glitchInterval = setInterval(() => {
      setGlitchActive(true);
      setTimeout(() => setGlitchActive(false), 150);
    }, 4000 + Math.random() * 3000);

    return () => {
      // document.body.style.overflow = '';
      clearInterval(glitchInterval);
      window.removeEventListener('resize', updateCounts);
    };
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 400);
  };

  const secrets = [
    {
      icon: Zap,
      title: 'Code Sprint Challenge',
      description: 'Elite coding competition with complex algorithmic problems and real-time debugging',
      level: 'Expert',
      color: '#ff4500',
      participants: '150+'
    },
    {
      icon: AlertTriangle,
      title: 'Midnight Hackathon',
      description: 'Build breakthrough solutions under pressure. 24 hours of pure innovation',
      level: 'Advanced',
      color: '#dc2626',
      participants: '200+'
    },
    {
      icon: Radio,
      title: 'Tech Talk Series',
      description: 'Exclusive workshops with industry experts on cutting-edge technologies',
      level: 'Elite',
      color: '#b91c1c',
      participants: '180+'
    },
    {
      icon: Eye,
      title: 'Project Showcase',
      description: 'Present your innovative projects to industry leaders and win recognition',
      level: 'Classified',
      color: '#991b1b',
      participants: '120+'
    },
    {
      icon: Skull,
      title: 'Ultimate Tech War',
      description: 'The most intense multi-round technical competition. Prove your supremacy.',
      level: 'Nightmare',
      color: '#7f1d1d',
      participants: '80+'
    }
  ];

  return (
    <div 
      className={`fixed inset-0 z-[100] overflow-y-auto overflow-x-hidden transition-all duration-500 upside-down-scroll ${isVisible ? 'opacity-100' : 'opacity-0'}`}
      style={{
        background: 'linear-gradient(180deg, #050505 0%, #0a0000 30%, #120000 60%, #080000 100%)',
      }}
    >
      {/* Animated Background Layer */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Floating particles - Responsive count */}
        <div className="particles-layer">
          {[...Array(particleCount)].map((_, i) => (
            <div
              key={`particle-${i}`}
              className="absolute rounded-full pointer-events-none"
              style={{
                width: Math.random() * 4 + 2 + 'px',
                height: Math.random() * 4 + 2 + 'px',
                backgroundColor: `rgba(139, 0, 0, ${0.3 + Math.random() * 0.4})`,
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animation: `floatParticle ${8 + Math.random() * 12}s ease-in-out infinite ${Math.random() * 5}s`,
                boxShadow: `0 0 ${Math.random() * 10 + 5}px rgba(139, 0, 0, 0.5)`
              }}
            />
          ))}
        </div>

        {/* Vines/tendrils effect - Hidden on mobile */}
        {vineCount > 0 && (
          <div className="absolute inset-0 opacity-10">
            {[...Array(vineCount)].map((_, i) => (
              <div
                key={`vine-${i}`}
                className="absolute h-full pointer-events-none"
                style={{
                  width: '1px',
                  left: `${(i + 1) * (100 / (vineCount + 1))}%`,
                  background: 'linear-gradient(to bottom, transparent 0%, rgba(139, 0, 0, 0.6) 50%, transparent 100%)',
                  animation: `sway ${2.5 + Math.random() * 2}s ease-in-out infinite ${Math.random() * 2}s`,
                  transformOrigin: 'top center'
                }}
              />
            ))}
          </div>
        )}

        {/* Pulsing red glow - Fully responsive */}
        <div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          style={{
            width: 'min(90vw, 1200px)',
            height: 'min(90vw, 1200px)',
            background: 'radial-gradient(circle, rgba(139, 0, 0, 0.4) 0%, rgba(100, 0, 0, 0.2) 30%, rgba(60, 0, 0, 0.1) 50%, transparent 70%)',
            filter: 'blur(min(10vw, 100px))',
            animation: 'ominousPulse 5s ease-in-out infinite',
          }}
        />

        {/* Grid overlay */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(rgba(139, 0, 0, 0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(139, 0, 0, 0.5) 1px, transparent 1px)',
            backgroundSize: 'clamp(30px, 5vw, 50px) clamp(30px, 5vw, 50px)'
          }}
        />
      </div>

      {/* Close Button - Fully Responsive */}
      <button
        onClick={handleClose}
        className="fixed top-4 right-4 sm:top-6 sm:right-6 md:top-8 md:right-8 z-50 p-2 sm:p-3 border border-red-800/50 bg-black/90 backdrop-blur-sm text-red-500 hover:text-red-400 hover:border-red-700 hover:bg-black transition-all duration-300 group touch-manipulation"
        aria-label="Close Upside Down"
      >
        <X className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 group-hover:rotate-90 transition-transform duration-300" />
      </button>

      {/* Main Content - Scrollable with responsive padding */}
      <div className="relative z-10 min-h-full px-4 sm:px-6 md:px-8 lg:px-12 py-16 sm:py-20 md:py-24">
        <div className="max-w-7xl mx-auto">
          
          {/* Header - Fully Responsive */}
          <div className="text-center mb-10 sm:mb-12 md:mb-16 lg:mb-20">
            <div 
              className={`transition-all duration-700 ${isVisible ? 'translate-y-0 opacity-100' : '-translate-y-10 opacity-0'}`}
              style={{ transitionDelay: '100ms' }}
            >
              {/* Title with glitch effect - Responsive font size */}
              <h1 
                className={`mb-4 sm:mb-5 md:mb-6 ${glitchActive ? 'glitch-text' : ''}`}
                style={{
                  fontSize: 'clamp(1.75rem, 6vw + 1rem, 5rem)',
                  color: '#8b0000',
                  textShadow: `
                    0 0 10px rgba(139, 0, 0, 0.9),
                    0 0 20px rgba(139, 0, 0, 0.7),
                    0 0 30px rgba(139, 0, 0, 0.5),
                    0 0 40px rgba(139, 0, 0, 0.3)
                    ${glitchActive ? ', 3px 3px 0px rgba(139, 0, 0, 0.9), -3px -3px 0px rgba(0, 100, 100, 0.6)' : ''}
                  `,
                  fontFamily: '"Benguiat", "ITC Benguiat", "Times New Roman", serif',
                  letterSpacing: '0.05em',
                  lineHeight: '1.1'
                }}
              >
                THE UPSIDE DOWN
              </h1>

              <p className="text-red-400/80 text-sm sm:text-base md:text-lg lg:text-xl mb-3 sm:mb-4 px-4">
                You've entered the realm of shadows
              </p>

              <div className="flex items-center justify-center gap-2 text-red-600/60 text-xs sm:text-sm uppercase tracking-widest">
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-red-600 rounded-full animate-pulse" />
                <span>Classified Access Only</span>
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-red-600 rounded-full animate-pulse" />
              </div>

              {/* Decorative line - Responsive width */}
              <div 
                className="h-px mx-auto mt-5 sm:mt-6 bg-gradient-to-r from-transparent via-red-800/60 to-transparent"
                style={{
                  width: 'min(20vw, 120px)',
                  animation: 'expandLine 0.8s ease-out 0.5s forwards',
                  transform: 'scaleX(0)'
                }}
              />
            </div>
          </div>

          {/* Warning Banner - Fully Responsive */}
          <div 
            className={`mb-10 sm:mb-12 md:mb-16 transition-all duration-700 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}
            style={{ transitionDelay: '200ms' }}
          >
            <div className="relative bg-gradient-to-br from-red-950/40 via-red-900/20 to-black/40 border border-red-900/60 p-4 sm:p-5 md:p-6 lg:p-8 backdrop-blur-md">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                <AlertTriangle className="w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 text-red-600 flex-shrink-0 animate-pulse" />
                <div className="flex-1">
                  <h3 className="text-red-500 text-base sm:text-lg md:text-xl lg:text-2xl mb-2 sm:mb-3">
                    ⚠️ Warning: You Are Now in Restricted Territory
                  </h3>
                  <p className="text-red-400/70 text-xs sm:text-sm md:text-base leading-relaxed">
                    The events and challenges below are designed for elite participants only. 
                    Proceed with caution and prepare for the unexpected.
                  </p>
                </div>
              </div>
              
              {/* Corner accents - Responsive size */}
              <div className="absolute top-0 left-0 w-3 h-3 sm:w-4 sm:h-4 border-t-2 border-l-2 border-red-800" />
              <div className="absolute top-0 right-0 w-3 h-3 sm:w-4 sm:h-4 border-t-2 border-r-2 border-red-800" />
              <div className="absolute bottom-0 left-0 w-3 h-3 sm:w-4 sm:h-4 border-b-2 border-l-2 border-red-800" />
              <div className="absolute bottom-0 right-0 w-3 h-3 sm:w-4 sm:h-4 border-b-2 border-r-2 border-red-800" />
            </div>
          </div>

          {/* Secret Events Grid - Fully Responsive */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 md:gap-7 lg:gap-8 mb-10 sm:mb-12 md:mb-16">
            {secrets.map((secret, index) => {
              const Icon = secret.icon;
              return (
                <div
                  key={secret.title}
                  className={`secret-card group relative cursor-pointer transition-all duration-700 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'}`}
                  style={{ transitionDelay: `${300 + index * 100}ms` }}
                >
                  <div className="relative h-full bg-gradient-to-br from-black/80 via-black/60 to-red-950/20 border border-red-900/40 p-5 sm:p-6 md:p-7 lg:p-8 hover:border-red-800/70 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl backdrop-blur-sm min-h-[280px] sm:min-h-[300px] md:min-h-[320px] flex flex-col">
                    
                    {/* Animated glow effect on hover */}
                    <div 
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                      style={{
                        background: `radial-gradient(circle at center, ${secret.color}15 0%, transparent 70%)`,
                        animation: 'pulseGlow 2s ease-in-out infinite'
                      }}
                    />
                    
                    {/* Content */}
                    <div className="relative z-10 flex-1 flex flex-col">
                      
                      {/* Icon and Level Badge */}
                      <div className="flex justify-between items-start mb-4 sm:mb-5">
                        <div 
                          className="inline-flex p-2.5 sm:p-3 border border-red-900/50 group-hover:border-red-800/80 transition-all duration-300 group-hover:scale-110 group-hover:rotate-6"
                        >
                          <Icon 
                            className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8" 
                            style={{ color: secret.color }}
                          />
                        </div>
                        <span 
                          className="text-[10px] sm:text-xs px-2 sm:px-2.5 py-1 border border-red-900/60 uppercase tracking-wider"
                          style={{ color: secret.color }}
                        >
                          {secret.level}
                        </span>
                      </div>

                      {/* Title - Responsive font */}
                      <h3 
                        className="text-xl sm:text-2xl md:text-3xl mb-2 sm:mb-3 transition-all duration-300 group-hover:tracking-wide"
                        style={{
                          color: '#dc2626',
                          textShadow: '0 0 10px rgba(220, 38, 38, 0.5)',
                          fontSize: 'clamp(1.125rem, 2vw + 0.5rem, 1.875rem)'
                        }}
                      >
                        {secret.title}
                      </h3>

                      {/* Description - Responsive text */}
                      <p className="text-red-400/60 text-sm sm:text-base leading-relaxed group-hover:text-red-400/90 transition-colors duration-300 mb-4 sm:mb-5 flex-1">
                        {secret.description}
                      </p>

                      {/* Participants Badge */}
                      <div className="flex items-center gap-2 mb-4 sm:mb-5 text-xs sm:text-sm">
                        <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-red-500/60" />
                        <span className="text-red-500/60">{secret.participants} Participants</span>
                      </div>

                      {/* Access Button - Fully responsive */}
                      <button className="w-full py-2.5 sm:py-3 border border-red-900/60 text-red-600 text-xs sm:text-sm hover:bg-red-950/40 hover:border-red-800 transition-all duration-300 uppercase tracking-wider flex items-center justify-center gap-2 group/btn touch-manipulation">
                        <Lock className="w-3 h-3 sm:w-4 sm:h-4 group-hover/btn:scale-110 transition-transform duration-300" />
                        <span>Access Classified</span>
                        <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 group-hover/btn:translate-x-1 transition-transform duration-300" />
                      </button>
                    </div>

                    {/* Animated corners */}
                    <div className="absolute top-0 left-0 w-4 h-4 sm:w-5 sm:h-5 border-t border-l border-red-900/60 group-hover:border-red-700 transition-colors duration-300" />
                    <div className="absolute bottom-0 right-0 w-4 h-4 sm:w-5 sm:h-5 border-b border-r border-red-900/60 group-hover:border-red-700 transition-colors duration-300" />
                    
                    {/* Scan line effect */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-30 transition-opacity duration-500 pointer-events-none overflow-hidden">
                      <div 
                        className="absolute w-full h-px bg-gradient-to-r from-transparent via-red-500 to-transparent"
                        style={{
                          animation: 'scanLine 2s linear infinite'
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Additional Info Section - Responsive */}
          <div 
            className={`mb-10 sm:mb-12 md:mb-16 transition-all duration-700 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'}`}
            style={{ transitionDelay: '900ms' }}
          >
            <div className="text-center max-w-3xl mx-auto">
              <p className="text-red-400/60 text-sm sm:text-base md:text-lg leading-relaxed mb-4 sm:mb-6">
                These exclusive events are accessible only to those who dare to venture into the unknown. 
                Each challenge has been carefully crafted to test your limits and push the boundaries of innovation.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs sm:text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse" />
                  <span className="text-red-500/60">730+ Total Participants</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse" />
                  <span className="text-red-500/60">5 Elite Events</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse" />
                  <span className="text-red-500/60">₹5L+ Prizes</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom CTA - Fully Responsive */}
          <div 
            className={`text-center transition-all duration-700 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'}`}
            style={{ transitionDelay: '1000ms' }}
          >
            <div className="relative inline-block">
              <button 
                onClick={handleClose}
                className="group relative px-6 sm:px-8 md:px-10 lg:px-12 py-3 sm:py-3.5 md:py-4 border-2 border-red-900 bg-gradient-to-br from-red-950/30 to-black/50 text-red-500 hover:bg-red-950/50 hover:border-red-800 hover:text-red-400 transition-all duration-300 uppercase tracking-wider text-sm sm:text-base backdrop-blur-sm touch-manipulation"
              >
                <span className="relative z-10 flex items-center gap-2">
                  <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 rotate-180" />
                  Return to Surface
                  <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 rotate-180" />
                </span>
                <div className="absolute inset-0 bg-red-900/0 group-hover:bg-red-900/20 transition-all duration-300" />
              </button>
              
              {/* Glowing ring */}
              <div 
                className="absolute inset-0 border border-red-900/20 pointer-events-none"
                style={{
                  animation: 'expandRing 3s ease-out infinite'
                }}
              />
            </div>
            
            <p className="text-red-600/50 text-xs sm:text-sm mt-5 sm:mt-6 animate-pulse">
              The darkness follows you back...
            </p>
          </div>
        </div>
      </div>

      {/* CSS Animations - All Responsive */}
      <style>{`
        /* Particles animation */
        @keyframes floatParticle {
          0%, 100% {
            transform: translate(0, 0) scale(1);
            opacity: 0.3;
          }
          25% {
            transform: translate(clamp(5px, 2vw, 10px), clamp(-20px, -5vw, -30px)) scale(1.2);
            opacity: 0.7;
          }
          50% {
            transform: translate(clamp(-10px, -3vw, -15px), clamp(-40px, -10vw, -60px)) scale(0.8);
            opacity: 0.5;
          }
          75% {
            transform: translate(clamp(10px, 3vw, 20px), clamp(-30px, -7vw, -40px)) scale(1.1);
            opacity: 0.6;
          }
        }

        /* Vines swaying */
        @keyframes sway {
          0%, 100% {
            transform: translateX(0) scaleY(1) rotate(0deg);
          }
          33% {
            transform: translateX(clamp(4px, 1.5vw, 8px)) scaleY(1.03) rotate(1deg);
          }
          66% {
            transform: translateX(clamp(-4px, -1.5vw, -8px)) scaleY(0.97) rotate(-1deg);
          }
        }

        /* Ominous pulsing glow */
        @keyframes ominousPulse {
          0%, 100% {
            opacity: 0.5;
            transform: translate(-50%, -50%) scale(1);
          }
          50% {
            opacity: 0.8;
            transform: translate(-50%, -50%) scale(1.2);
          }
        }

        /* Glitch effect */
        .glitch-text {
          animation: glitch 0.2s ease-in-out;
        }

        @keyframes glitch {
          0% { transform: translate(0); }
          20% { transform: translate(-2px, 2px); filter: hue-rotate(90deg); }
          40% { transform: translate(2px, -2px); filter: hue-rotate(-90deg); }
          60% { transform: translate(-1px, -1px); filter: hue-rotate(180deg); }
          80% { transform: translate(1px, 1px); filter: hue-rotate(-180deg); }
          100% { transform: translate(0); filter: hue-rotate(0deg); }
        }

        /* Line expansion */
        @keyframes expandLine {
          from {
            transform: scaleX(0);
            opacity: 0;
          }
          to {
            transform: scaleX(1);
            opacity: 1;
          }
        }

        /* Card glow pulse */
        @keyframes pulseGlow {
          0%, 100% {
            opacity: 0;
          }
          50% {
            opacity: 1;
          }
        }

        /* Scan line */
        @keyframes scanLine {
          0% {
            top: -2px;
          }
          100% {
            top: 100%;
          }
        }

        /* Expanding ring */
        @keyframes expandRing {
          0% {
            transform: scale(1);
            opacity: 0.5;
          }
          100% {
            transform: scale(1.5);
            opacity: 0;
          }
        }

        /* Custom scrollbar - Responsive width */
        .custom-scrollbar::-webkit-scrollbar {
          width: clamp(4px, 1vw, 8px);
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.3);
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(139, 0, 0, 0.6);
          border-radius: 4px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(139, 0, 0, 0.9);
        }

        /* Firefox scrollbar */
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: rgba(139, 0, 0, 0.6) rgba(0, 0, 0, 0.3);
        }

        /* Responsive text selection */
        ::selection {
          background: rgba(139, 0, 0, 0.4);
          color: #fff;
        }

        /* Mobile optimizations */
        @media (max-width: 640px) {
          .secret-card {
            -webkit-tap-highlight-color: transparent;
          }
          
          /* Reduce animation complexity on mobile */
          @media (prefers-reduced-motion: reduce) {
            * {
              animation-duration: 0.01ms !important;
              animation-iteration-count: 1 !important;
              transition-duration: 0.01ms !important;
            }
          }
        }

        /* Tablet optimizations */
        @media (min-width: 641px) and (max-width: 1023px) {
          .secret-card:hover {
            transform: translateY(-4px);
          }
        }

        /* Desktop optimizations */
        @media (min-width: 1024px) {
          .secret-card:hover {
            transform: translateY(-8px);
          }
        }
      `}</style>
    </div>
  );
}