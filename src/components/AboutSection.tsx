import React from 'react';
import { Sparkles, Target, Rocket } from 'lucide-react';

interface AboutSectionProps {
  onDiscoverMore?: () => void;
}

export function AboutSection({ onDiscoverMore }: AboutSectionProps) {
  const features = [
    {
      icon: Sparkles,
      title: 'Innovation',
      description: 'Pushing boundaries of technology and creativity'
    },
    {
      icon: Target,
      title: 'Excellence',
      description: 'Striving for perfection in every challenge'
    },
    {
      icon: Rocket,
      title: 'Growth',
      description: 'Empowering the next generation of tech leaders'
    }
  ];

  return (
    <section id="about" className="relative py-16 sm:py-20 md:py-24 px-4 sm:px-6 md:px-8 lg:px-12 w-full max-w-[1440px] mx-auto">
      <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
        {/* Left Side - Content */}
        <div 
          className="order-2 lg:order-1"
          style={{
            animation: 'slideInLeft 0.8s ease-out forwards',
            opacity: 0
          }}
        >
          <div className="mb-6">
            <span className="inline-block px-4 py-1.5 border border-red-600/40 text-red-500 text-sm uppercase tracking-wider mb-4">
              About KAIZEN
            </span>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl text-white/90 mb-6" style={{
            textShadow: '0 0 30px rgba(255, 69, 0, 0.3)'
          }}>
            Where Innovation Meets <span className="text-red-500">Reality</span>
          </h2>

          <p className="text-white/70 text-base sm:text-lg leading-relaxed mb-6">
            KAIZEN is not just a tech fest—it's a gateway to the extraordinary. Inspired by the Stranger Things universe, we blend cutting-edge technology with immersive experiences that challenge, inspire, and transform.
          </p>

          <p className="text-white/60 text-sm sm:text-base leading-relaxed mb-8">
            Join thousands of innovators, coders, and dreamers as we navigate through the digital unknown, solving problems that matter and creating solutions for tomorrow.
          </p>

          {/* Features Grid */}
          <div className="grid sm:grid-cols-3 gap-4 sm:gap-6 mb-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div 
                  key={feature.title}
                  className="text-center sm:text-left"
                  style={{
                    animation: `fadeInUp 0.6s ease-out ${0.3 + index * 0.1}s forwards`,
                    opacity: 0
                  }}
                >
                  <Icon className="w-8 h-8 text-red-500 mb-3 mx-auto sm:mx-0" />
                  <h4 className="text-white text-sm sm:text-base mb-1">{feature.title}</h4>
                  <p className="text-white/50 text-xs sm:text-sm">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side - Visual Element */}
        <div 
          className="order-1 lg:order-2 relative"
          style={{
            animation: 'slideInRight 0.8s ease-out forwards',
            opacity: 0
          }}
        >
          <div className="relative aspect-square max-w-md mx-auto lg:max-w-none">
            {/* Central glowing box */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative w-48 h-48 sm:w-64 sm:h-64 md:w-80 md:h-80">
                {/* Rotating border */}
                <div className="absolute inset-0 border-2 border-red-600/40 animate-spin-slow" style={{
                  animation: 'rotateBorder 20s linear infinite'
                }} />
                
                {/* Inner glow */}
                <div className="absolute inset-4 bg-gradient-to-br from-red-950/30 via-black/50 to-black/30 backdrop-blur-sm flex items-center justify-center">
                  <div className="text-center p-6">
                    <div className="text-4xl sm:text-5xl md:text-6xl text-white mb-2" style={{
                      textShadow: '0 0 30px rgba(255, 69, 0, 0.6)'
                    }}>
                      2026
                    </div>
                    <div className="text-red-500 text-sm sm:text-base uppercase tracking-widest">
                      Tech Fest
                    </div>
                  </div>
                </div>

                {/* Floating particles */}
                {[...Array(8)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute w-1 h-1 bg-red-500 rounded-full"
                    style={{
                      top: `${Math.random() * 100}%`,
                      left: `${Math.random() * 100}%`,
                      animation: `float ${3 + Math.random() * 2}s ease-in-out infinite ${Math.random() * 2}s`,
                      opacity: 0.6
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Corner accents */}
            <div className="absolute top-0 left-0 w-12 sm:w-16 h-12 sm:h-16 border-t-2 border-l-2 border-red-600/60" />
            <div className="absolute top-0 right-0 w-12 sm:w-16 h-12 sm:h-16 border-t-2 border-r-2 border-red-600/60" />
            <div className="absolute bottom-0 left-0 w-12 sm:w-16 h-12 sm:h-16 border-b-2 border-l-2 border-red-600/60" />
            <div className="absolute bottom-0 right-0 w-12 sm:w-16 h-12 sm:h-16 border-b-2 border-r-2 border-red-600/60" />
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-60px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(60px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes rotateBorder {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
            opacity: 0.3;
          }
          50% {
            transform: translateY(-20px);
            opacity: 0.8;
          }
        }
      `}</style>
    </section>
  );
}