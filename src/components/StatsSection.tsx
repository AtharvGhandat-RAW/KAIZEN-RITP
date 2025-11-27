import React, { useState, useEffect, useRef } from 'react';
import { Users, Trophy, Calendar, Zap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export function StatsSection() {
  const [inView, setInView] = useState(false);
  const [counts, setCounts] = useState({ participants: 0, events: 0, prizes: 0, colleges: 0 });
  const [realStats, setRealStats] = useState({ participants: 0, events: 0, prizes: 0, colleges: 50 });
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchStats();

    // Real-time listener
    const channel = supabase
      .channel('stats-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, fetchStats)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'registrations' }, fetchStats)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchStats = async () => {
    const { count: eventsCount } = await supabase.from('events').select('*', { count: 'exact', head: true });
    const { count: participantsCount } = await supabase.from('registrations').select('*', { count: 'exact', head: true });
    const { data: eventsData } = await supabase.from('events').select('prize_pool');
    const totalPrizes = eventsData?.reduce((sum, event) => sum + (event.prize_pool || 0), 0) || 0;
    setRealStats({ participants: participantsCount || 0, events: eventsCount || 0, prizes: Math.floor(totalPrizes / 1000), colleges: 50 });
  };

  const stats = [
    { icon: Users, label: 'Participants', value: realStats.participants, suffix: '+', key: 'participants' },
    { icon: Calendar, label: 'Events', value: realStats.events, suffix: '+', key: 'events' },
    { icon: Trophy, label: 'Prize Pool', value: realStats.prizes, suffix: 'K+', key: 'prizes', prefix: '₹' },
    { icon: Zap, label: 'Colleges', value: realStats.colleges, suffix: '+', key: 'colleges' }
  ];

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting && !inView) setInView(true); }, { threshold: 0.2 });
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, [inView]);

  useEffect(() => {
    if (inView) {
      const duration = 2000, steps = 60, stepDuration = duration / steps;
      let currentStep = 0;
      const interval = setInterval(() => {
        currentStep++;
        const progress = currentStep / steps;
        setCounts({ participants: Math.floor(realStats.participants * progress), events: Math.floor(realStats.events * progress), prizes: Math.floor(realStats.prizes * progress), colleges: Math.floor(realStats.colleges * progress) });
        if (currentStep >= steps) { clearInterval(interval); setCounts(realStats); }
      }, stepDuration);
      return () => clearInterval(interval);
    }
  }, [inView, realStats]);

  return (
    <section ref={sectionRef} className="relative py-16 sm:py-20 md:py-24 px-4 sm:px-6 md:px-8 lg:px-12 w-full max-w-[1440px] mx-auto">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-red-950/10 to-transparent pointer-events-none" />
      <div className="relative z-10 grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 md:gap-10">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          const displayValue = counts[stat.key as keyof typeof counts];
          return (
            <div key={stat.label} className="group relative text-center" style={{ animation: `fadeInScale 0.6s ease-out ${index * 0.1}s forwards`, opacity: 0 }}>
              <div className="absolute inset-0 bg-gradient-to-br from-red-600/0 to-red-600/0 group-hover:from-red-600/10 group-hover:to-transparent rounded-lg transition-all duration-500 -z-10" />
              <div className="inline-flex p-4 sm:p-5 border border-red-600/30 mb-4 group-hover:border-red-600/60 transition-all duration-300 group-hover:scale-110">
                <Icon className="w-6 h-6 sm:w-8 sm:h-8 text-red-500 group-hover:text-red-400 transition-colors duration-300" />
              </div>
              <div className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl mb-2 group-hover:scale-105 transition-transform duration-300" style={{ color: '#dc2626', textShadow: '0 0 30px rgba(220, 38, 38, 0.5)' }}>
                {stat.prefix}{displayValue.toLocaleString()}{stat.suffix}
              </div>
              <div className="text-red-400/70 text-sm sm:text-base uppercase tracking-wider">{stat.label}</div>
            </div>
          );
        })}
      </div>
      <style>{`@keyframes fadeInScale { from { opacity: 0; transform: scale(0.8) translateY(20px); } to { opacity: 1; transform: scale(1) translateY(0); } }`}</style>
    </section>
  );
}
