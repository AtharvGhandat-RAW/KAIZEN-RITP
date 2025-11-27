import React from 'react';
import { ArrowRight, Calendar, MapPin, Mail } from 'lucide-react';

interface RegistrationCTAProps {
  onOpen: () => void;
}

export function RegistrationCTA({ onOpen }: RegistrationCTAProps) {
  return (
    <section id="registration" className="relative py-16 sm:py-20 md:py-24 px-4 sm:px-6 md:px-8 lg:px-12 w-full max-w-[1440px] mx-auto">
      {/* Main CTA Card */}
      <div 
        className="relative overflow-hidden"
        style={{
          animation: 'scaleIn 0.8s ease-out forwards',
          opacity: 0
        }}
      >
        {/* Background with gradient */}
        <div className="relative bg-gradient-to-br from-red-950/20 via-black/50 to-black/30 backdrop-blur-sm border border-red-600/30 p-8 sm:p-12 md:p-16">
          {/* Animated background particles */}
          <div className="absolute inset-0 opacity-30">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 bg-red-500 rounded-full"
                style={{
                  top: `${Math.random() * 100}%`,
                  left: `${Math.random() * 100}%`,
                  animation: `twinkle ${2 + Math.random() * 3}s ease-in-out infinite ${Math.random() * 2}s`
                }}
              />
            ))}
          </div>

          {/* Content */}
          <div className="relative z-10 text-center max-w-3xl mx-auto">
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-white mb-4 sm:mb-6" style={{
              textShadow: '0 0 40px rgba(255, 69, 0, 0.4)'
            }}>
              Ready to Enter the <span className="text-red-500">Upside Down</span>?
            </h2>

            <p className="text-white/70 text-base sm:text-lg md:text-xl mb-8 sm:mb-10">
              Register now and be part of the most thrilling tech fest experience. Limited spots available!
            </p>

            {/* Event Info Cards */}
            <div className="grid sm:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-10">
              {[
                { icon: Calendar, label: 'Date', value: 'Coming Soon' },
                { icon: MapPin, label: 'Venue', value: 'RIT Campus' },
                { icon: Mail, label: 'Contact', value: 'info@kaizen.com' }
              ].map((info, index) => {
                const Icon = info.icon;
                return (
                  <div 
                    key={info.label}
                    className="bg-black/40 border border-red-600/20 p-4 sm:p-5 hover:border-red-600/50 transition-all duration-300"
                    style={{
                      animation: `fadeInUp 0.6s ease-out ${0.2 + index * 0.1}s forwards`,
                      opacity: 0
                    }}
                  >
                    <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-red-500 mx-auto mb-2 sm:mb-3" />
                    <div className="text-white/50 text-xs sm:text-sm uppercase tracking-wider mb-1">
                      {info.label}
                    </div>
                    <div className="text-white text-sm sm:text-base">
                      {info.value}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center">
              <button 
                onClick={onOpen}
                className="group relative px-8 sm:px-10 md:px-12 py-3 sm:py-4 bg-red-600 text-white hover:bg-red-700 transition-all duration-300 overflow-hidden w-full sm:w-auto"
              >
                <span className="relative z-10 flex items-center justify-center gap-2 text-sm sm:text-base md:text-lg">
                  Register Now
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform duration-300" />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-red-600 to-red-700 group-hover:scale-110 transition-transform duration-300" />
              </button>

              <button className="group relative px-8 sm:px-10 md:px-12 py-3 sm:py-4 border-2 border-red-600 text-white hover:bg-red-600/10 transition-all duration-300 w-full sm:w-auto">
                <span className="relative z-10 text-sm sm:text-base md:text-lg">
                  View Schedule
                </span>
                <div className="absolute inset-0 bg-red-600/0 group-hover:bg-red-600/5 transition-all duration-300" />
              </button>
            </div>

            {/* Urgency text */}
            <p className="text-red-400 text-sm sm:text-base mt-6 sm:mt-8 animate-pulse">
              ⚡ Early bird discount ends soon!
            </p>
          </div>

          {/* Corner decorations */}
          <div className="absolute top-0 left-0 w-16 sm:w-20 md:w-24 h-16 sm:h-20 md:h-24 border-t-2 border-l-2 border-red-600/60" />
          <div className="absolute top-0 right-0 w-16 sm:w-20 md:w-24 h-16 sm:h-20 md:h-24 border-t-2 border-r-2 border-red-600/60" />
          <div className="absolute bottom-0 left-0 w-16 sm:w-20 md:w-24 h-16 sm:h-20 md:h-24 border-b-2 border-l-2 border-red-600/60" />
          <div className="absolute bottom-0 right-0 w-16 sm:w-20 md:w-24 h-16 sm:h-20 md:h-24 border-b-2 border-r-2 border-red-600/60" />
        </div>
      </div>

      <style>{`
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
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

        @keyframes twinkle {
          0%, 100% {
            opacity: 0.2;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.5);
          }
        }
      `}</style>
    </section>
  );
}