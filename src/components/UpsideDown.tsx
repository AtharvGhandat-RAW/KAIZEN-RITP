import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { X, Zap, AlertTriangle, Radio, Eye, Skull, ChevronRight, Lock, Sparkles, Ghost, Flame, Brain, Code, Gamepad2, Volume2, VolumeX } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface UpsideDownProps {
  onClose: () => void;
}

interface SecretEvent {
  id: string;
  name: string;
  description: string;
  category: string;
  level: string;
  participants: string;
}

// Icon mapping for categories
const categoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  'Hackathon': Code,
  'Coding': Zap,
  'Gaming': Gamepad2,
  'AI/ML': Brain,
  'Robotics': Ghost,
  'Workshop': Radio,
  'Design': Eye,
  'default': Skull
};

// Horror level mapping
const horrorLevels = ['Haunted', 'Nightmare', 'Demonic', 'Possessed', 'Apocalyptic'];
const horrorColors = ['#ff4500', '#dc2626', '#b91c1c', '#991b1b', '#7f1d1d'];

export function UpsideDown({ onClose }: UpsideDownProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [glitchActive, setGlitchActive] = useState(false);
  const [events, setEvents] = useState<SecretEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [flickerText, setFlickerText] = useState(false);
  const [bloodDrip, setBloodDrip] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch real events from database
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const { data, error } = await supabase
          .from('events')
          .select('id, name, description, category')
          .in('status', ['upcoming', 'ongoing'])
          .limit(6);

        if (error) throw error;

        const mappedEvents: SecretEvent[] = (data || []).map((event, index) => ({
          id: event.id,
          name: event.name,
          description: event.description || 'A mysterious challenge awaits in the darkness...',
          category: event.category,
          level: horrorLevels[index % horrorLevels.length],
          participants: `${Math.floor(Math.random() * 150) + 50}+`
        }));

        setEvents(mappedEvents);
      } catch (err) {
        console.error('Error fetching events:', err);
        // Fallback to default events
        setEvents(defaultSecrets);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  useEffect(() => {
    // Trigger entrance animation
    const timer = setTimeout(() => setIsVisible(true), 50);

    // Random glitch effects - more intense
    const glitchInterval = setInterval(() => {
      setGlitchActive(true);
      setTimeout(() => setGlitchActive(false), 200);
    }, 3000 + Math.random() * 2000);

    // Flicker effect for text
    const flickerInterval = setInterval(() => {
      setFlickerText(true);
      setTimeout(() => setFlickerText(false), 100);
    }, 5000 + Math.random() * 3000);

    // Blood drip effect
    const bloodInterval = setInterval(() => {
      setBloodDrip(true);
      setTimeout(() => setBloodDrip(false), 2000);
    }, 8000);

    return () => {
      clearTimeout(timer);
      clearInterval(glitchInterval);
      clearInterval(flickerInterval);
      clearInterval(bloodInterval);
    };
  }, []);

  const handleClose = useCallback(() => {
    setIsVisible(false);
    setTimeout(onClose, 400);
  }, [onClose]);

  // Default fallback secrets if database is empty
  const defaultSecrets: SecretEvent[] = useMemo(() => [
    {
      id: '1',
      name: 'Code Sprint Challenge',
      description: 'Elite coding competition with complex algorithmic problems and real-time debugging. Only the strongest survive.',
      category: 'Coding',
      level: 'Nightmare',
      participants: '150+'
    },
    {
      id: '2',
      name: 'Midnight Hackathon',
      description: 'Build breakthrough solutions under pressure. 24 hours of pure innovation in complete darkness.',
      category: 'Hackathon',
      level: 'Demonic',
      participants: '200+'
    },
    {
      id: '3',
      name: 'AI Overlord Workshop',
      description: 'Master the dark arts of artificial intelligence. Create models that think... and plot.',
      category: 'AI/ML',
      level: 'Possessed',
      participants: '180+'
    },
    {
      id: '4',
      name: 'Haunted Gaming Arena',
      description: 'Battle through cursed tournaments. Your reflexes vs supernatural opponents.',
      category: 'Gaming',
      level: 'Haunted',
      participants: '120+'
    },
    {
      id: '5',
      name: 'Robot Apocalypse',
      description: 'Build machines that will outlast humanity. The ultimate robotics showdown.',
      category: 'Robotics',
      level: 'Apocalyptic',
      participants: '80+'
    }
  ], []);

  const displayEvents = events.length > 0 ? events : defaultSecrets;

  return (
    <div 
      ref={containerRef}
      className={`fixed inset-0 z-[100] transition-all duration-500 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
      style={{
        background: 'linear-gradient(180deg, #000000 0%, #0a0000 20%, #150000 50%, #0a0000 80%, #000000 100%)',
        overflowY: 'auto',
        overflowX: 'hidden',
        WebkitOverflowScrolling: 'touch',
      }}
    >
      {/* Blood drip overlay */}
      <div 
        className={`fixed top-0 left-0 right-0 h-32 pointer-events-none z-50 transition-opacity duration-1000 ${bloodDrip ? 'opacity-100' : 'opacity-0'}`}
        style={{
          background: 'linear-gradient(to bottom, rgba(139, 0, 0, 0.8) 0%, rgba(139, 0, 0, 0.4) 30%, transparent 100%)',
        }}
      />

      {/* Animated Background Layer - Optimized */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {/* Floating ash/ember particles */}
        <div className="particles-layer">
          {[...Array(20)].map((_, i) => (
            <div
              key={`ember-${i}`}
              className="absolute rounded-full"
              style={{
                width: `${Math.random() * 3 + 1}px`,
                height: `${Math.random() * 3 + 1}px`,
                backgroundColor: `rgba(${180 + Math.random() * 75}, ${Math.random() * 30}, 0, ${0.4 + Math.random() * 0.4})`,
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animation: `riseEmber ${10 + Math.random() * 10}s linear infinite ${Math.random() * 5}s`,
                boxShadow: `0 0 ${Math.random() * 6 + 2}px rgba(255, 69, 0, 0.6)`
              }}
            />
          ))}
        </div>

        {/* Fog/mist layer */}
        <div 
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse at 50% 100%, rgba(139, 0, 0, 0.15) 0%, transparent 60%)',
            animation: 'fogDrift 20s ease-in-out infinite',
          }}
        />

        {/* Pulsing red glow - center */}
        <div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{
            width: 'min(100vw, 1000px)',
            height: 'min(100vw, 1000px)',
            background: 'radial-gradient(circle, rgba(139, 0, 0, 0.3) 0%, rgba(80, 0, 0, 0.15) 40%, transparent 70%)',
            filter: 'blur(80px)',
            animation: 'ominousPulse 6s ease-in-out infinite',
          }}
        />

        {/* Vignette effect */}
        <div 
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse at center, transparent 0%, transparent 40%, rgba(0,0,0,0.8) 100%)',
          }}
        />

        {/* Scan lines */}
        <div 
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(139, 0, 0, 0.3) 2px, rgba(139, 0, 0, 0.3) 4px)',
          }}
        />
      </div>

      {/* Close Button */}
      <button
        onClick={handleClose}
        className="fixed top-4 right-4 sm:top-6 sm:right-6 z-[110] p-2.5 sm:p-3 border border-red-800/60 bg-black/95 text-red-500 hover:text-red-400 hover:border-red-600 hover:bg-red-950/30 transition-all duration-300 group"
        aria-label="Close Upside Down"
      >
        <X className="w-5 h-5 sm:w-6 sm:h-6 group-hover:rotate-90 transition-transform duration-300" />
      </button>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen px-4 sm:px-6 md:px-8 lg:px-12 py-20 sm:py-24">
        <div className="max-w-7xl mx-auto">
          
          {/* Header */}
          <div className="text-center mb-12 sm:mb-16 md:mb-20">
            <div 
              className={`transition-all duration-700 ${isVisible ? 'translate-y-0 opacity-100' : '-translate-y-10 opacity-0'}`}
              style={{ transitionDelay: '100ms' }}
            >
              {/* Skull decoration */}
              <div className="flex justify-center mb-4 sm:mb-6">
                <Skull 
                  className={`w-10 h-10 sm:w-12 sm:h-12 text-red-600 ${flickerText ? 'opacity-20' : 'opacity-100'}`}
                  style={{
                    filter: 'drop-shadow(0 0 10px rgba(139, 0, 0, 0.8))',
                    animation: 'floatSkull 4s ease-in-out infinite'
                  }}
                />
              </div>

              {/* Title with glitch effect */}
              <h1 
                className={`mb-4 sm:mb-6 ${glitchActive ? 'ud-glitch-text' : ''} ${flickerText ? 'ud-flicker' : ''}`}
                style={{
                  fontSize: 'clamp(2rem, 8vw, 5rem)',
                  color: '#8b0000',
                  textShadow: `
                    0 0 10px rgba(139, 0, 0, 0.9),
                    0 0 20px rgba(139, 0, 0, 0.7),
                    0 0 40px rgba(139, 0, 0, 0.5),
                    0 0 80px rgba(139, 0, 0, 0.3)
                  `,
                  fontFamily: '"Benguiat", "ITC Benguiat", "Libre Baskerville", serif',
                  letterSpacing: '0.1em',
                  lineHeight: '1.1',
                  textTransform: 'uppercase'
                }}
              >
                THE UPSIDE DOWN
              </h1>

              <p className={`text-red-400/80 text-base sm:text-lg md:text-xl mb-4 ${flickerText ? 'opacity-50' : 'opacity-100'}`}>
                You've crossed into the realm of shadows
              </p>

              <div className="flex items-center justify-center gap-3 text-red-600/60 text-xs sm:text-sm uppercase tracking-[0.2em]">
                <Flame className="w-4 h-4 text-red-600 animate-pulse" />
                <span>Classified Access Only</span>
                <Flame className="w-4 h-4 text-red-600 animate-pulse" />
              </div>

              {/* Decorative line */}
              <div 
                className="h-px mx-auto mt-6 sm:mt-8 bg-gradient-to-r from-transparent via-red-700 to-transparent"
                style={{ width: 'min(50%, 200px)' }}
              />
            </div>
          </div>

          {/* Warning Banner */}
          <div 
            className={`mb-12 sm:mb-16 transition-all duration-700 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}
            style={{ transitionDelay: '200ms' }}
          >
            <div className="relative bg-gradient-to-r from-red-950/50 via-red-900/30 to-red-950/50 border border-red-800/50 p-5 sm:p-6 md:p-8">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="p-3 bg-red-950/50 border border-red-800/50">
                  <AlertTriangle className="w-6 h-6 sm:w-8 sm:h-8 text-red-500 animate-pulse" />
                </div>
                <div className="flex-1">
                  <h3 className="text-red-500 text-lg sm:text-xl md:text-2xl font-bold mb-2 tracking-wide">
                    ⚠️ RESTRICTED TERRITORY
                  </h3>
                  <p className="text-red-400/70 text-sm sm:text-base leading-relaxed">
                    The challenges below are designed for elite participants only. 
                    Once you enter, there is no turning back. Your fate is sealed.
                  </p>
                </div>
              </div>
              
              {/* Corner accents */}
              <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-red-700" />
              <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-red-700" />
              <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-red-700" />
              <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-red-700" />
            </div>
          </div>

          {/* Secret Events Grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-72 bg-red-950/20 border border-red-900/30 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mb-16">
              {displayEvents.map((event, index) => {
                const Icon = categoryIcons[event.category] || categoryIcons['default'];
                const color = horrorColors[index % horrorColors.length];
                return (
                  <div
                    key={event.id}
                    className={`ud-secret-card group relative transition-all duration-700 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'}`}
                    style={{ transitionDelay: `${300 + index * 100}ms` }}
                  >
                    <div className="relative h-full bg-gradient-to-br from-black via-red-950/10 to-black border border-red-900/40 p-6 sm:p-7 hover:border-red-700 transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_0_40px_rgba(139,0,0,0.3)] min-h-[300px] flex flex-col overflow-hidden">
                      
                      {/* Hover glow effect */}
                      <div 
                        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                        style={{
                          background: `radial-gradient(circle at center, ${color}20 0%, transparent 70%)`,
                        }}
                      />
                      
                      {/* Content */}
                      <div className="relative z-10 flex-1 flex flex-col">
                        
                        {/* Icon and Level Badge */}
                        <div className="flex justify-between items-start mb-5">
                          <div 
                            className="p-3 border border-red-900/50 group-hover:border-red-700 group-hover:bg-red-950/30 transition-all duration-300"
                            style={{ boxShadow: `0 0 20px ${color}30` }}
                          >
                            <Icon className="w-6 h-6 sm:w-7 sm:h-7" style={{ color }} />
                          </div>
                          <span 
                            className="text-xs px-3 py-1.5 border border-red-900/60 uppercase tracking-wider bg-black/50"
                            style={{ color }}
                          >
                            {event.level}
                          </span>
                        </div>

                        {/* Title */}
                        <h3 
                          className="text-xl sm:text-2xl mb-3 font-bold tracking-wide"
                          style={{
                            color: '#dc2626',
                            textShadow: '0 0 15px rgba(220, 38, 38, 0.5)',
                          }}
                        >
                          {event.name}
                        </h3>

                        {/* Description */}
                        <p className="text-red-400/60 text-sm sm:text-base leading-relaxed group-hover:text-red-400/80 transition-colors duration-300 mb-5 flex-1">
                          {event.description}
                        </p>

                        {/* Participants Badge */}
                        <div className="flex items-center gap-2 mb-5 text-sm">
                          <Ghost className="w-4 h-4 text-red-500/60" />
                          <span className="text-red-500/60">{event.participants} Souls Entered</span>
                        </div>

                        {/* Access Button */}
                        <button className="w-full py-3 border border-red-900/60 text-red-500 text-sm hover:bg-red-950/50 hover:border-red-700 hover:text-red-400 transition-all duration-300 uppercase tracking-wider flex items-center justify-center gap-2 group/btn">
                          <Lock className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                          <span>Enter The Darkness</span>
                          <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                        </button>
                      </div>

                      {/* Scan line effect on hover */}
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none overflow-hidden">
                        <div 
                          className="absolute w-full h-px bg-gradient-to-r from-transparent via-red-500 to-transparent"
                          style={{ animation: 'scanLine 2s linear infinite' }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {/* Stats Section */}
          <div 
            className={`mb-16 transition-all duration-700 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'}`}
            style={{ transitionDelay: '900ms' }}
          >
            <div className="grid grid-cols-3 gap-4 sm:gap-6 max-w-3xl mx-auto">
              {[
                { value: '730+', label: 'Souls Entered' },
                { value: '5', label: 'Elite Events' },
                { value: '₹5L+', label: 'Blood Prize' }
              ].map((stat, i) => (
                <div key={i} className="text-center p-4 sm:p-6 border border-red-900/30 bg-red-950/10">
                  <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-red-500 mb-2" style={{ textShadow: '0 0 20px rgba(220, 38, 38, 0.5)' }}>
                    {stat.value}
                  </div>
                  <div className="text-xs sm:text-sm text-red-500/60 uppercase tracking-wider">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom CTA */}
          <div 
            className={`text-center pb-12 transition-all duration-700 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'}`}
            style={{ transitionDelay: '1000ms' }}
          >
            <button 
              onClick={handleClose}
              className="group relative px-8 sm:px-12 py-4 border-2 border-red-800 bg-gradient-to-br from-red-950/40 to-black text-red-500 hover:bg-red-950/60 hover:border-red-600 hover:text-red-400 transition-all duration-300 uppercase tracking-wider text-sm sm:text-base"
            >
              <span className="relative z-10 flex items-center gap-3">
                <ChevronRight className="w-5 h-5 rotate-180" />
                Escape To Surface
                <ChevronRight className="w-5 h-5 rotate-180" />
              </span>
            </button>
            
            <p className="text-red-600/40 text-sm mt-6 italic">
              The darkness will remember you...
            </p>
          </div>
        </div>
      </div>

      {/* CSS Animations */}
      <style>{`
        /* Rising ember particles */
        @keyframes riseEmber {
          0% {
            transform: translateY(0) translateX(0) scale(1);
            opacity: 0;
          }
          10% {
            opacity: 0.8;
          }
          90% {
            opacity: 0.8;
          }
          100% {
            transform: translateY(-100vh) translateX(${Math.random() * 100 - 50}px) scale(0.5);
            opacity: 0;
          }
        }

        /* Fog drift */
        @keyframes fogDrift {
          0%, 100% {
            transform: translateX(-5%) scale(1);
            opacity: 0.15;
          }
          50% {
            transform: translateX(5%) scale(1.1);
            opacity: 0.25;
          }
        }

        /* Ominous pulse */
        @keyframes ominousPulse {
          0%, 100% {
            opacity: 0.4;
            transform: translate(-50%, -50%) scale(1);
          }
          50% {
            opacity: 0.7;
            transform: translate(-50%, -50%) scale(1.15);
          }
        }

        /* Floating skull */
        @keyframes floatSkull {
          0%, 100% {
            transform: translateY(0) rotate(0deg);
          }
          50% {
            transform: translateY(-10px) rotate(3deg);
          }
        }

        /* Glitch effect */
        .ud-glitch-text {
          animation: udGlitch 0.3s ease-in-out;
        }

        @keyframes udGlitch {
          0% { transform: translate(0); filter: hue-rotate(0deg); }
          20% { transform: translate(-3px, 3px); filter: hue-rotate(90deg); }
          40% { transform: translate(3px, -3px); filter: hue-rotate(-90deg); }
          60% { transform: translate(-2px, -2px); filter: hue-rotate(180deg); }
          80% { transform: translate(2px, 2px); filter: hue-rotate(-180deg); }
          100% { transform: translate(0); filter: hue-rotate(0deg); }
        }

        /* Flicker effect */
        .ud-flicker {
          animation: udFlicker 0.1s ease-in-out;
        }

        @keyframes udFlicker {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }

        /* Scan line */
        @keyframes scanLine {
          0% { top: -2px; }
          100% { top: 100%; }
        }

        /* Selection color */
        ::selection {
          background: rgba(139, 0, 0, 0.5);
          color: #fff;
        }
      `}</style>
    </div>
  );
}