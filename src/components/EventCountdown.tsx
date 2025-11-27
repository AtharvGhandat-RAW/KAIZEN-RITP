import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export function EventCountdown() {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });
  const [countdownTarget, setCountdownTarget] = useState<string | null>(null);

  useEffect(() => {
    const fetchCountdownTarget = async () => {
      const { data } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'countdown_target')
        .maybeSingle();

      if (data?.value) {
        // Remove quotes if present and parse
        const cleanValue = typeof data.value === 'string' 
          ? data.value.replace(/"/g, '') 
          : String(data.value);
        setCountdownTarget(cleanValue);
      }
    };

    fetchCountdownTarget();

    const channel = supabase
      .channel('countdown-settings')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'settings',
        filter: 'key=eq.countdown_target'
      }, (payload) => {
        if (payload.new && 'value' in payload.new) {
          // Remove quotes if present and parse
          const rawValue = payload.new.value;
          const cleanValue = typeof rawValue === 'string'
            ? rawValue.replace(/"/g, '')
            : String(rawValue);
          setCountdownTarget(cleanValue);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (!countdownTarget) return;

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const targetDate = new Date(countdownTarget).getTime();
      const distance = targetDate - now;

      if (distance < 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      setTimeLeft({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000)
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [countdownTarget]);

  return (
    <section className="relative py-16 sm:py-20 md:py-24 px-4 sm:px-6 md:px-8 lg:px-12 mt-8 sm:mt-12 md:mt-16 w-full max-w-[1440px] mx-auto">
      <div className="text-center mb-8 sm:mb-10">
        <div className="flex items-center justify-center gap-2 mb-[12px] mt-[13px] mr-[0px] ml-[0px]">
          <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-red-500" />
          <h2 className="text-2xl sm:text-3xl md:text-4xl text-white/90">
            Event Starts In
          </h2>
        </div>
        <div className="h-px w-16 sm:w-20 md:w-24 bg-gradient-to-r from-transparent via-red-600/60 to-transparent mx-auto" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 md:gap-8 max-w-4xl mx-auto">
        {[
          { label: 'Days', value: timeLeft.days },
          { label: 'Hours', value: timeLeft.hours },
          { label: 'Minutes', value: timeLeft.minutes },
          { label: 'Seconds', value: timeLeft.seconds }
        ].map((item, index) => (
          <div
            key={item.label}
            className="countdown-card relative group"
            style={{
              animation: `fadeInUp 0.6s ease-out ${index * 0.1}s forwards`,
              opacity: 0
            }}
          >
            <div className="relative bg-black/40 backdrop-blur-sm border border-red-600/30 p-4 sm:p-6 md:p-8 hover:border-red-600/60 transition-all duration-300 hover:scale-105">
              {/* Glow effect on hover */}
              <div className="absolute inset-0 bg-red-600/0 group-hover:bg-red-600/5 transition-all duration-300" />
              
              <div className="relative z-10">
                <div className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-white mb-2" style={{
                  textShadow: '0 0 20px rgba(255, 69, 0, 0.5)'
                }}>
                  {String(item.value).padStart(2, '0')}
                </div>
                <div className="text-xs sm:text-sm md:text-base text-red-400 uppercase tracking-wider">
                  {item.label}
                </div>
              </div>

              {/* Corner accents */}
              <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-red-600/60" />
              <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-red-600/60" />
              <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-red-600/60" />
              <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-red-600/60" />
            </div>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </section>
  );
}
