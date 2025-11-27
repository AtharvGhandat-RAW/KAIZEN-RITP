import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { X, ChevronRight } from 'lucide-react';

// Type definitions for scene phases
type ScenePhase =
  | 'darkAwakening'      // Scene 1: 0-2s
  | 'festCoordinators'   // Scene 2: 2-6s
  | 'operationsUnit'     // Scene 3: 6-9s
  | 'managementUnit'     // Scene 4: 9-12s
  | 'digitalMediaUnit'   // Scene 5: 12-15s
  | 'techProductionUnit' // Scene 6: 15-18s
  | 'partnershipUnit'    // Scene 7: 18-21s
  | 'ambienceDesignUnit' // Scene 8: 21-24s
  | 'portalEmerges'      // Scene 9: 24-27s
  | 'finalReveal'        // Scene 10: 27-32s
  | 'enterButton';       // Scene 11: 32-34s

export function StrangerThingsIntro({ onComplete }: { onComplete: () => void }) {
  const [phase, setPhase] = useState<ScenePhase>('darkAwakening');
  const [showSkip, setShowSkip] = useState(false);
  const [glitchActive, setGlitchActive] = useState(false);
  const [lightningFlash, setLightningFlash] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [revealStage, setRevealStage] = useState(0); // 0-5 for staggered reveal
  const containerRef = useRef<HTMLDivElement>(null);

  // Scene timeline configuration (in milliseconds)
  const sceneTimeline = useMemo(() => ({
    darkAwakening: { start: 0, duration: 2000 },
    festCoordinators: { start: 2000, duration: 4000 },
    operationsUnit: { start: 6000, duration: 3000 },
    managementUnit: { start: 9000, duration: 3000 },
    digitalMediaUnit: { start: 12000, duration: 3000 },
    techProductionUnit: { start: 15000, duration: 3000 },
    partnershipUnit: { start: 18000, duration: 3000 },
    ambienceDesignUnit: { start: 21000, duration: 3000 },
    portalEmerges: { start: 24000, duration: 3000 },
    finalReveal: { start: 27000, duration: 5000 },
    enterButton: { start: 32000, duration: 2000 }
  }), []);

  // Trigger glitch effects with proper visual distortion
  const triggerGlitch = useCallback(() => {
    setGlitchActive(true);
    setTimeout(() => setGlitchActive(false), 200);
  }, []);

  // Trigger lightning flash effect
  const triggerLightning = useCallback(() => {
    setLightningFlash(true);
    setTimeout(() => setLightningFlash(false), 150);
  }, []);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    // Show skip button after 1 second
    timers.push(setTimeout(() => setShowSkip(true), 1000));

    // Scene transitions based on timeline
    const phases: ScenePhase[] = [
      'darkAwakening', 'festCoordinators', 'operationsUnit', 'managementUnit',
      'digitalMediaUnit', 'techProductionUnit', 'partnershipUnit', 'ambienceDesignUnit',
      'portalEmerges', 'finalReveal', 'enterButton'
    ];

    phases.forEach((p, index) => {
      if (index > 0) {
        timers.push(setTimeout(() => setPhase(p), sceneTimeline[p].start));
      }
    });

    // Staggered reveal stages for final reveal
    timers.push(setTimeout(() => setRevealStage(1), 27200)); // Start reveal
    timers.push(setTimeout(() => setRevealStage(2), 27600)); // Letters appear
    timers.push(setTimeout(() => setRevealStage(3), 28200)); // RITP appears
    timers.push(setTimeout(() => setRevealStage(4), 28800)); // Subtitle
    timers.push(setTimeout(() => setRevealStage(5), 29500)); // Full glow

    // Random glitch effects - less frequent but more impactful
    const glitchIntervals = [3500, 7000, 11000, 15500, 19000, 23000, 26500, 29000];
    glitchIntervals.forEach(time => {
      timers.push(setTimeout(triggerGlitch, time));
    });

    // Lightning flashes during portal and final reveal
    timers.push(setTimeout(triggerLightning, 24800));
    timers.push(setTimeout(triggerLightning, 25500));
    timers.push(setTimeout(triggerLightning, 27000));
    timers.push(setTimeout(triggerLightning, 28500));

    return () => timers.forEach(timer => clearTimeout(timer));
  }, [sceneTimeline, triggerGlitch, triggerLightning]);

  const handleExit = useCallback(() => {
    setIsExiting(true);
    // Call onComplete immediately so main content can start fading in
    // while the intro fades out (parallel transition for smoothness)
    onComplete();
  }, [onComplete]);

  const handleEnter = handleExit;
  const handleSkip = handleExit;

  // Check if we're past a certain phase
  const isPastPhase = useCallback((checkPhase: ScenePhase): boolean => {
    const phases: ScenePhase[] = [
      'darkAwakening', 'festCoordinators', 'operationsUnit', 'managementUnit',
      'digitalMediaUnit', 'techProductionUnit', 'partnershipUnit', 'ambienceDesignUnit',
      'portalEmerges', 'finalReveal', 'enterButton'
    ];
    return phases.indexOf(phase) >= phases.indexOf(checkPhase);
  }, [phase]);

  // Memoized particles - minimal for performance
  const particles = useMemo(() =>
    [...Array(8)].map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      size: Math.random() * 3 + 1,
      delay: Math.random() * 8,
      duration: 15 + Math.random() * 10
    })), []);

  // Memoized embers
  const embers = useMemo(() =>
    [...Array(4)].map((_, i) => ({
      id: i,
      left: 20 + (i * 20),
      delay: Math.random() * 8,
      duration: 18 + Math.random() * 8
    })), []);

  return (
    <div
      ref={containerRef}
      className={`intro-container ${isExiting ? 'exiting' : ''}`}
    >
      {/* Film Grain - CSS only */}
      <div className="film-grain" />

      {/* Glitch Effect Overlay */}
      <div className={`glitch-container ${glitchActive ? 'active' : ''}`}>
        <div className="glitch-slice glitch-slice-1" />
        <div className="glitch-slice glitch-slice-2" />
        <div className="glitch-slice glitch-slice-3" />
        <div className="glitch-scanlines" />
        <div className="glitch-noise" />
      </div>

      {/* Lightning Flash */}
      {lightningFlash && <div className="lightning-flash" />}

      {/* Atmospheric Background */}
      <div className="atmosphere">
        <div className="base-gradient" />
        <div className="fog-layer fog-1" />
        <div className="fog-layer fog-2" />
        <div className={`ambient-glow ${isPastPhase('portalEmerges') ? 'intense' : ''}`} />

        {/* Particles */}
        <div className="particles">
          {particles.map(p => (
            <div
              key={p.id}
              className={`particle ${isPastPhase('festCoordinators') ? 'visible' : ''}`}
              style={{
                left: `${p.left}%`,
                top: `${p.top}%`,
                width: `${p.size}px`,
                height: `${p.size}px`,
                animationDelay: `${p.delay}s`,
                animationDuration: `${p.duration}s`
              }}
            />
          ))}
        </div>

        {/* Embers */}
        <div className="embers">
          {embers.map(e => (
            <div
              key={e.id}
              className={`ember ${isPastPhase('festCoordinators') ? 'visible' : ''}`}
              style={{
                left: `${e.left}%`,
                animationDelay: `${e.delay}s`,
                animationDuration: `${e.duration}s`
              }}
            />
          ))}
        </div>

        {/* Vignette */}
        <div className="vignette" />
      </div>

      {/* Skip Button - Responsive */}
      {showSkip && phase !== 'enterButton' && (
        <button onClick={handleSkip} className="skip-btn" aria-label="Skip intro">
          <span className="skip-text">Skip</span>
          <X className="skip-icon" />
        </button>
      )}

      {/* Content */}
      <div className="content">
        {/* Scene 1: Dark Awakening */}
        {phase === 'darkAwakening' && (
          <div className="scene scene-awakening">
            <p className="awakening-text">A FEST BEYOND THE ORDINARY…</p>
          </div>
        )}

        {/* Scene 2: Fest Coordinators */}
        {phase === 'festCoordinators' && (
          <div className="scene scene-credits">
            <span className="credit-label">Fest Coordinators</span>
            <div className="credit-divider" />
            <div className="credit-names">
              <span className="credit-name primary">Rishikant Mallick</span>
              <span className="credit-amp">&</span>
              <span className="credit-name primary">Pravin Thite</span>
            </div>
          </div>
        )}

        {/* Scene 3-8: Other Credits */}
        {phase === 'operationsUnit' && (
          <div className="scene scene-credits">
            <span className="credit-label">Operations Unit</span>
            <div className="credit-divider" />
            <span className="credit-name">Shrinivas (AIML) • Janhavi (CO)</span>
          </div>
        )}

        {phase === 'managementUnit' && (
          <div className="scene scene-credits">
            <span className="credit-label">Management Unit</span>
            <div className="credit-divider" />
            <span className="credit-name">Vitali (AIML) • Aviraj (CO)</span>
          </div>
        )}

        {phase === 'digitalMediaUnit' && (
          <div className="scene scene-credits">
            <span className="credit-label">Digital Media Unit</span>
            <div className="credit-divider" />
            <span className="credit-name">Riya (AIML) • Siddhant (CO)</span>
          </div>
        )}

        {phase === 'techProductionUnit' && (
          <div className="scene scene-credits">
            <span className="credit-label">Tech & Production Unit</span>
            <div className="credit-divider" />
            <span className="credit-name">Atharv (AIML) • Shravani (CO) • Amar (AIML)</span>
          </div>
        )}

        {phase === 'partnershipUnit' && (
          <div className="scene scene-credits">
            <span className="credit-label">Partnership Unit</span>
            <div className="credit-divider" />
            <span className="credit-name">Prasad (AIML) • Sonal (AIML)</span>
          </div>
        )}

        {phase === 'ambienceDesignUnit' && (
          <div className="scene scene-credits">
            <span className="credit-label">Ambience Design Unit</span>
            <div className="credit-divider" />
            <span className="credit-name">Mayuri (AIML) • Sanika (AIML) • Sunil (AIML)</span>
          </div>
        )}

        {/* Scene 9: Portal */}
        {isPastPhase('portalEmerges') && !isPastPhase('finalReveal') && (
          <div className="portal">
            <div className="portal-ring ring-1" />
            <div className="portal-ring ring-2" />
            <div className="portal-ring ring-3" />
            <div className="portal-core" />
            <div className="portal-glow" />
          </div>
        )}

        {/* Scene 10: Final Reveal - Professional Horror Style */}
        {isPastPhase('finalReveal') && (
          <div className={`final-reveal stage-${revealStage}`}>
            {/* Crackling energy background */}
            <div className="energy-field">
              <div className="energy-bolt bolt-1" />
              <div className="energy-bolt bolt-2" />
              <div className="energy-bolt bolt-3" />
            </div>

            {/* Main title container */}
            <div className="title-container">
              {/* KAIZEN text with horror reveal */}
              <div className="kaizen-wrapper">
                <h1 className="kaizen-title">
                  {'KAIZEN'.split('').map((letter, i) => (
                    <span
                      key={i}
                      className="kaizen-letter"
                      style={{ animationDelay: `${i * 0.12}s` }}
                    >
                      {letter}
                    </span>
                  ))}
                </h1>
                {/* Glow layer */}
                <div className="kaizen-glow" aria-hidden="true">
                  {'KAIZEN'.split('').map((letter, i) => (
                    <span
                      key={i}
                      className="glow-letter"
                      style={{ animationDelay: `${i * 0.12}s` }}
                    >
                      {letter}
                    </span>
                  ))}
                </div>
              </div>

              {/* RITP subtitle */}
              <div className="ritp-wrapper">
                <h2 className="ritp-title">
                  {'RITP'.split('').map((letter, i) => (
                    <span
                      key={i}
                      className="ritp-letter"
                      style={{ animationDelay: `${0.8 + i * 0.1}s` }}
                    >
                      {letter}
                    </span>
                  ))}
                </h2>
              </div>

              {/* Tagline */}
              <div className="tagline-wrapper">
                <div className="tagline-line left" />
                <span className="tagline-text">FEAR THE UNKNOWN</span>
                <div className="tagline-line right" />
              </div>
            </div>

            {/* Blood drip effect */}
            <div className="blood-drips">
              <div className="drip drip-1" />
              <div className="drip drip-2" />
              <div className="drip drip-3" />
            </div>
          </div>
        )}

        {/* Scene 11: Enter Button */}
        {phase === 'enterButton' && (
          <div className="cta-section">
            <button onClick={handleEnter} className="cta-btn primary">
              <span className="cta-glow" />
              <span className="cta-text">Enter the Upside Down</span>
              <ChevronRight className="cta-arrow" />
              <span className="cta-corner tl" />
              <span className="cta-corner tr" />
              <span className="cta-corner bl" />
              <span className="cta-corner br" />
            </button>

            <button onClick={handleSkip} className="cta-btn secondary">
              <span className="cta-text">Skip Intro</span>
              <X className="cta-icon-sm" />
            </button>
          </div>
        )}
      </div>

      {/* Optimized CSS */}
      <style>{`
        /* === FONTS === */
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700;900&family=Raleway:wght@300;400;600&display=swap');

        /* === BASE CONTAINER === */
        .intro-container {
          position: fixed;
          inset: 0;
          z-index: 100;
          background: #000;
          overflow: hidden;
          font-family: 'Cinzel', serif;
          transition: opacity 1.2s ease-in-out, transform 1.2s ease-in-out;
        }

        .intro-container.exiting {
          opacity: 0;
          transform: scale(1.02);
          pointer-events: none;
        }

        /* === FILM GRAIN - Lightweight === */
        .film-grain {
          position: absolute;
          inset: 0;
          opacity: 0.035;
          pointer-events: none;
          z-index: 5;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
        }

        /* === GLITCH EFFECT - Proper Horror Glitch === */
        .glitch-container {
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 90;
          opacity: 0;
          transition: opacity 0.05s;
        }

        .glitch-container.active {
          opacity: 1;
        }

        .glitch-slice {
          position: absolute;
          left: 0;
          right: 0;
          height: 8px;
          background: linear-gradient(90deg, 
            transparent 0%,
            rgba(255, 0, 0, 0.8) 20%,
            rgba(255, 0, 0, 0.4) 40%,
            transparent 50%,
            rgba(255, 0, 0, 0.6) 70%,
            transparent 100%
          );
          transform: translateX(0);
          animation: glitch-slide 0.15s steps(2) infinite;
        }

        .glitch-slice-1 { top: 15%; animation-delay: 0s; }
        .glitch-slice-2 { top: 45%; animation-delay: 0.05s; height: 12px; }
        .glitch-slice-3 { top: 75%; animation-delay: 0.1s; }

        .glitch-scanlines {
          position: absolute;
          inset: 0;
          background: repeating-linear-gradient(
            0deg,
            transparent 0px,
            transparent 2px,
            rgba(255, 0, 0, 0.03) 2px,
            rgba(255, 0, 0, 0.03) 4px
          );
          animation: scanline-shift 0.1s steps(3) infinite;
        }

        .glitch-noise {
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse at 30% 50%, rgba(255, 0, 0, 0.15) 0%, transparent 50%),
                      radial-gradient(ellipse at 70% 50%, rgba(200, 0, 0, 0.1) 0%, transparent 50%);
          animation: noise-flicker 0.1s steps(4) infinite;
        }

        @keyframes glitch-slide {
          0% { transform: translateX(-100%); opacity: 0; }
          50% { transform: translateX(100%); opacity: 1; }
          100% { transform: translateX(200%); opacity: 0; }
        }

        @keyframes scanline-shift {
          0% { background-position: 0 0; }
          100% { background-position: 0 4px; }
        }

        @keyframes noise-flicker {
          0%, 100% { opacity: 0.3; }
          25% { opacity: 0.8; }
          50% { opacity: 0.2; }
          75% { opacity: 0.6; }
        }

        /* === LIGHTNING FLASH === */
        .lightning-flash {
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse at center, 
            rgba(255, 80, 80, 0.5) 0%, 
            rgba(255, 0, 0, 0.2) 40%, 
            transparent 70%
          );
          z-index: 85;
          animation: flash 0.15s ease-out;
          pointer-events: none;
        }

        @keyframes flash {
          0% { opacity: 0; }
          30% { opacity: 1; }
          100% { opacity: 0; }
        }

        /* === ATMOSPHERE === */
        .atmosphere {
          position: absolute;
          inset: 0;
          pointer-events: none;
        }

        .base-gradient {
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse at center, #0d0000 0%, #000 60%, #000 100%);
        }

        .fog-layer {
          position: absolute;
          inset: -30%;
          background: radial-gradient(ellipse at center, rgba(100, 0, 0, 0.12) 0%, transparent 60%);
          will-change: transform;
        }

        .fog-1 {
          animation: fog-move 25s ease-in-out infinite;
        }

        .fog-2 {
          animation: fog-move 30s ease-in-out infinite reverse;
          opacity: 0.6;
        }

        @keyframes fog-move {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(3%, -2%) scale(1.05); }
        }

        .ambient-glow {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 600px;
          height: 600px;
          background: radial-gradient(circle, rgba(120, 0, 0, 0.4) 0%, transparent 60%);
          transform: translate(-50%, -50%);
          filter: blur(60px);
          transition: all 1.5s ease-out;
          will-change: transform, opacity;
        }

        .ambient-glow.intense {
          width: 800px;
          height: 800px;
          background: radial-gradient(circle, rgba(150, 0, 0, 0.6) 0%, transparent 60%);
        }

        /* === PARTICLES === */
        .particles {
          position: absolute;
          inset: 0;
          overflow: hidden;
        }

        .particle {
          position: absolute;
          background: radial-gradient(circle, #ff2200 0%, #800000 60%, transparent 100%);
          border-radius: 50%;
          opacity: 0;
          transition: opacity 2s ease;
          will-change: transform;
          animation: float 20s linear infinite;
        }

        .particle.visible {
          opacity: 0.5;
        }

        @keyframes float {
          0% { transform: translateY(0) translateX(0); }
          100% { transform: translateY(-100vh) translateX(20px); }
        }

        /* === EMBERS === */
        .embers {
          position: absolute;
          inset: 0;
          overflow: hidden;
        }

        .ember {
          position: absolute;
          bottom: 0;
          width: 3px;
          height: 3px;
          background: #ff4400;
          border-radius: 50%;
          box-shadow: 0 0 8px #ff4400, 0 0 15px #ff2200;
          opacity: 0;
          transition: opacity 2s ease;
          will-change: transform;
          animation: rise 20s linear infinite;
        }

        .ember.visible {
          opacity: 1;
        }

        @keyframes rise {
          0% { transform: translateY(0); opacity: 1; }
          100% { transform: translateY(-100vh); opacity: 0; }
        }

        /* === VIGNETTE === */
        .vignette {
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse at center, transparent 0%, transparent 40%, rgba(0,0,0,0.6) 70%, rgba(0,0,0,0.95) 100%);
          pointer-events: none;
        }

        /* === SKIP BUTTON - FULLY RESPONSIVE === */
        .skip-btn {
          position: fixed;
          top: 1rem;
          right: 1rem;
          z-index: 200;
          display: flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.5rem 0.875rem;
          background: rgba(0, 0, 0, 0.9);
          border: 1.5px solid rgba(180, 0, 0, 0.5);
          color: #ff6666;
          font-family: 'Raleway', sans-serif;
          font-size: 0.7rem;
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.25s ease;
          animation: fadeIn 0.5s ease-out;
        }

        .skip-btn:hover, .skip-btn:focus {
          background: rgba(100, 0, 0, 0.5);
          border-color: #ff0000;
          color: #ff4444;
          outline: none;
        }

        .skip-btn:active {
          transform: scale(0.95);
        }

        .skip-icon {
          width: 14px;
          height: 14px;
        }

        @media (min-width: 480px) {
          .skip-btn {
            top: 1.5rem;
            right: 1.5rem;
            padding: 0.625rem 1.25rem;
            font-size: 0.75rem;
            gap: 0.5rem;
          }
          .skip-icon {
            width: 16px;
            height: 16px;
          }
        }

        @media (min-width: 768px) {
          .skip-btn {
            top: 2rem;
            right: 2rem;
            padding: 0.75rem 1.5rem;
            font-size: 0.8rem;
          }
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* === CONTENT === */
        .content {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 50;
          pointer-events: none;
        }

        .scene {
          text-align: center;
          padding: 0 1rem;
        }

        /* === AWAKENING SCENE === */
        .scene-awakening {
          animation: sceneIn 1.2s ease-out;
        }

        .awakening-text {
          font-size: clamp(0.85rem, 2vw, 1.3rem);
          font-weight: 400;
          letter-spacing: 0.35em;
          color: rgba(255, 100, 100, 0.75);
          text-transform: uppercase;
          text-shadow: 0 0 30px rgba(255, 0, 0, 0.5);
          animation: pulse 2s ease-in-out infinite;
        }

        /* === CREDITS SCENE === */
        .scene-credits {
          display: flex;
          flex-direction: column;
          align-items: center;
          animation: sceneIn 0.7s ease-out, sceneOut 0.7s ease-out 2.3s forwards;
        }

        .credit-label {
          font-family: 'Raleway', sans-serif;
          font-size: clamp(0.65rem, 1.4vw, 0.95rem);
          font-weight: 300;
          letter-spacing: 0.35em;
          text-transform: uppercase;
          color: rgba(255, 100, 100, 0.7);
          margin-bottom: 0.75rem;
          text-shadow: 0 0 15px rgba(255, 0, 0, 0.5);
        }

        .credit-divider {
          width: 80px;
          height: 2px;
          background: linear-gradient(90deg, transparent, #ff1a1a, transparent);
          margin-bottom: 0.75rem;
          box-shadow: 0 0 12px rgba(255, 26, 26, 0.7);
        }

        .credit-names {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.3rem;
        }

        .credit-name {
          font-family: 'Cinzel', serif;
          font-size: clamp(0.9rem, 2vw, 1.3rem);
          font-weight: 400;
          letter-spacing: 0.1em;
          color: rgba(255, 255, 255, 0.9);
          text-shadow: 0 0 20px rgba(255, 26, 26, 0.5);
        }

        .credit-name.primary {
          font-size: clamp(1.1rem, 2.5vw, 1.6rem);
          font-weight: 700;
          text-shadow: 0 0 30px rgba(255, 26, 26, 0.7);
        }

        .credit-amp {
          font-family: 'Cinzel', serif;
          font-size: clamp(0.9rem, 1.8vw, 1.2rem);
          color: rgba(255, 100, 100, 0.5);
        }

        @keyframes sceneIn {
          from { opacity: 0; transform: translateY(30px); filter: blur(8px); }
          to { opacity: 1; transform: translateY(0); filter: blur(0); }
        }

        @keyframes sceneOut {
          from { opacity: 1; filter: blur(0); }
          to { opacity: 0; filter: blur(12px); transform: translateY(-20px); }
        }

        @keyframes pulse {
          0%, 100% { opacity: 0.7; }
          50% { opacity: 1; }
        }

        /* === PORTAL === */
        .portal {
          position: relative;
          width: 350px;
          height: 350px;
          animation: portalIn 1.5s ease-out;
        }

        .portal-ring {
          position: absolute;
          top: 50%;
          left: 50%;
          border: 2px solid rgba(255, 26, 26, 0.4);
          border-radius: 50%;
          transform: translate(-50%, -50%);
          animation: ringPulse 2.5s ease-out infinite;
        }

        .ring-1 { width: 100px; height: 70px; }
        .ring-2 { width: 180px; height: 120px; animation-delay: 0.4s; }
        .ring-3 { width: 260px; height: 180px; animation-delay: 0.8s; }

        .portal-core {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 60px;
          height: 40px;
          background: radial-gradient(ellipse, rgba(255, 26, 26, 0.6) 0%, transparent 70%);
          border-radius: 50%;
          transform: translate(-50%, -50%);
          animation: corePulse 1.5s ease-in-out infinite;
        }

        .portal-glow {
          position: absolute;
          inset: -50%;
          background: radial-gradient(ellipse at center, rgba(150, 0, 0, 0.25) 0%, transparent 60%);
          filter: blur(40px);
        }

        @keyframes portalIn {
          from { opacity: 0; transform: scale(0); }
          to { opacity: 1; transform: scale(1); }
        }

        @keyframes ringPulse {
          0% { opacity: 0; transform: translate(-50%, -50%) scale(0.6); }
          50% { opacity: 0.8; }
          100% { opacity: 0; transform: translate(-50%, -50%) scale(1.4); }
        }

        @keyframes corePulse {
          0%, 100% { box-shadow: 0 0 30px rgba(255, 26, 26, 0.5); }
          50% { box-shadow: 0 0 60px rgba(255, 26, 26, 0.9); }
        }

        /* === FINAL REVEAL - PROFESSIONAL HORROR === */
        .final-reveal {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          animation: revealIn 1.5s ease-out;
        }

        /* Energy Field */
        .energy-field {
          position: absolute;
          inset: -100px;
          pointer-events: none;
        }

        .energy-bolt {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 2px;
          background: linear-gradient(to bottom, 
            transparent 0%, 
            rgba(255, 40, 40, 0.9) 20%, 
            rgba(255, 80, 80, 0.5) 50%,
            rgba(255, 40, 40, 0.9) 80%, 
            transparent 100%
          );
          height: 150px;
          opacity: 0;
          filter: blur(1px);
        }

        .stage-2 .energy-bolt { opacity: 0.7; animation: boltFlicker 0.2s steps(3) infinite; }

        .bolt-1 { transform: translate(-80px, -75px) rotate(-20deg); }
        .bolt-2 { transform: translate(80px, -75px) rotate(20deg); animation-delay: 0.1s; }
        .bolt-3 { transform: translate(0, 80px) rotate(0deg); height: 100px; animation-delay: 0.15s; }

        @keyframes boltFlicker {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 0.9; }
        }

        /* Title Container */
        .title-container {
          position: relative;
          z-index: 2;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        /* KAIZEN Title */
        .kaizen-wrapper {
          position: relative;
        }

        .kaizen-title {
          display: flex;
          gap: clamp(0.1rem, 0.5vw, 0.5rem);
          margin: 0;
        }

        .kaizen-letter {
          font-size: clamp(3rem, 12vw, 9rem);
          font-weight: 900;
          color: transparent;
          -webkit-text-stroke: 2px #ff0000;
          text-stroke: 2px #ff0000;
          display: inline-block;
          opacity: 0;
          transform: translateY(30px);
          animation: horrorLetterReveal 0.8s ease-out forwards;
          text-shadow: 
            0 0 30px rgba(255, 0, 0, 0.8),
            0 0 60px rgba(255, 0, 0, 0.4);
        }

        @keyframes horrorLetterReveal {
          0% {
            opacity: 0;
            transform: translateY(40px) scaleY(0.3);
            filter: blur(10px);
            text-shadow: 0 0 0 transparent;
          }
          50% {
            opacity: 0.7;
            transform: translateY(-5px) scaleY(1.1);
            filter: blur(2px);
            text-shadow: 
              0 0 50px rgba(255, 0, 0, 1),
              0 0 100px rgba(255, 0, 0, 0.8);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scaleY(1);
            filter: blur(0);
            text-shadow: 
              0 0 30px rgba(255, 0, 0, 0.8),
              0 0 60px rgba(255, 0, 0, 0.4);
          }
        }

        /* Glow layer behind letters */
        .kaizen-glow {
          position: absolute;
          top: 0;
          left: 0;
          display: flex;
          gap: clamp(0.1rem, 0.5vw, 0.5rem);
          z-index: -1;
        }

        .glow-letter {
          font-size: clamp(3rem, 12vw, 9rem);
          font-weight: 900;
          color: #ff0000;
          filter: blur(25px);
          opacity: 0;
          animation: glowReveal 1s ease-out 0.3s forwards;
        }

        .stage-5 .kaizen-letter {
          animation: horrorLetterReveal 0.8s ease-out forwards,
                     subtleFlicker 4s ease-in-out infinite 1.5s;
        }

        @keyframes subtleFlicker {
          0%, 100% {
            text-shadow: 
              0 0 30px rgba(255, 0, 0, 0.8),
              0 0 60px rgba(255, 0, 0, 0.4);
          }
          50% {
            text-shadow: 
              0 0 40px rgba(255, 0, 0, 1),
              0 0 80px rgba(255, 0, 0, 0.6);
          }
        }

        @keyframes glowReveal {
          to { opacity: 0.5; }
        }

        /* RITP Subtitle */
        .ritp-wrapper {
          margin-top: -0.5rem;
        }

        .ritp-title {
          display: flex;
          gap: 0.3em;
          margin: 0;
        }

        .ritp-letter {
          font-size: clamp(1.2rem, 4vw, 2.8rem);
          font-weight: 700;
          letter-spacing: 0.4em;
          color: transparent;
          -webkit-text-stroke: 1.5px #cc0000;
          text-stroke: 1.5px #cc0000;
          opacity: 0;
          transform: translateY(15px);
          animation: ritpReveal 0.5s ease-out forwards;
          text-shadow: 0 0 20px rgba(200, 0, 0, 0.5);
        }

        @keyframes ritpReveal {
          0% {
            opacity: 0;
            transform: translateY(20px);
            filter: blur(5px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
            filter: blur(0);
          }
        }

        /* Tagline */
        .tagline-wrapper {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-top: 1.5rem;
          opacity: 0;
          animation: taglineIn 1s ease-out 1.2s forwards;
        }

        .tagline-line {
          width: 50px;
          height: 1px;
          background: linear-gradient(90deg, transparent, #ff1a1a, transparent);
          box-shadow: 0 0 15px rgba(255, 26, 26, 0.7);
        }

        .tagline-text {
          font-size: clamp(0.7rem, 1.8vw, 1.1rem);
          font-weight: 600;
          letter-spacing: 0.25em;
          color: rgba(255, 255, 255, 0.9);
          text-shadow: 0 0 20px rgba(255, 26, 26, 0.6);
          white-space: nowrap;
        }

        @keyframes taglineIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* Blood Drips - Horror Effect */
        .blood-drips {
          position: absolute;
          top: 100%;
          left: 50%;
          transform: translateX(-50%);
          width: 80%;
          display: flex;
          justify-content: center;
          gap: 20%;
          pointer-events: none;
        }

        .drip {
          width: 3px;
          height: 0;
          background: linear-gradient(to bottom, #ff1a1a, #800000, transparent);
          border-radius: 0 0 2px 2px;
          opacity: 0;
        }

        .stage-4 .drip {
          animation: dripDown 2s ease-in forwards;
        }

        .drip-1 { animation-delay: 0.2s; }
        .drip-2 { animation-delay: 0.5s; }
        .drip-3 { animation-delay: 0.8s; }

        @keyframes dripDown {
          0% { height: 0; opacity: 0; }
          10% { opacity: 0.8; }
          100% { height: 60px; opacity: 0; }
        }

        @keyframes revealIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }

        /* === CTA SECTION === */
        .cta-section {
          position: absolute;
          bottom: 10%;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          flex-direction: column;
          gap: 1rem;
          align-items: center;
          animation: ctaIn 0.8s ease-out;
          z-index: 60;
          pointer-events: auto;
          width: 90%;
          max-width: 380px;
          padding: 0 1rem;
        }

        .cta-btn {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          width: 100%;
          padding: 1rem 1.5rem;
          background: #000;
          border: 2px solid rgba(255, 26, 26, 0.5);
          color: #fff;
          font-family: 'Cinzel', serif;
          font-size: clamp(0.8rem, 2vw, 0.95rem);
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.25s ease;
          overflow: hidden;
        }

        .cta-btn.primary {
          border-color: #ff1a1a;
          box-shadow: 0 0 15px rgba(255, 26, 26, 0.3);
        }

        .cta-btn.primary:hover {
          background: #1a0000;
          box-shadow: 0 0 25px rgba(255, 26, 26, 0.5);
          transform: translateY(-2px);
        }

        .cta-btn.secondary {
          padding: 0.75rem 1.25rem;
          border-color: rgba(255, 26, 26, 0.3);
          color: rgba(255, 255, 255, 0.7);
          font-size: clamp(0.7rem, 1.8vw, 0.8rem);
        }

        .cta-btn.secondary:hover {
          border-color: rgba(255, 26, 26, 0.6);
          color: #fff;
        }

        .cta-glow {
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at center, rgba(255, 26, 26, 0.3) 0%, transparent 70%);
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .cta-btn.primary:hover .cta-glow {
          opacity: 1;
        }

        .cta-text {
          position: relative;
          z-index: 1;
        }

        .cta-arrow {
          width: 18px;
          height: 18px;
          position: relative;
          z-index: 1;
        }

        .cta-icon-sm {
          width: 14px;
          height: 14px;
        }

        .cta-corner {
          position: absolute;
          width: 12px;
          height: 12px;
          border-color: #ff1a1a;
          opacity: 0.5;
          transition: all 0.3s ease;
        }

        .cta-btn:hover .cta-corner {
          opacity: 1;
          width: 16px;
          height: 16px;
        }

        .cta-corner.tl { top: -2px; left: -2px; border-top: 2px solid; border-left: 2px solid; }
        .cta-corner.tr { top: -2px; right: -2px; border-top: 2px solid; border-right: 2px solid; }
        .cta-corner.bl { bottom: -2px; left: -2px; border-bottom: 2px solid; border-left: 2px solid; }
        .cta-corner.br { bottom: -2px; right: -2px; border-bottom: 2px solid; border-right: 2px solid; }

        @keyframes ctaIn {
          from { opacity: 0; transform: translateX(-50%) translateY(40px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }

        /* === RESPONSIVE ADJUSTMENTS === */
        @media (max-width: 480px) {
          .kaizen-letter {
            -webkit-text-stroke: 1.5px #ff0000;
            text-stroke: 1.5px #ff0000;
          }

          .ritp-letter {
            -webkit-text-stroke: 1px #cc0000;
            text-stroke: 1px #cc0000;
          }

          .tagline-line {
            width: 30px;
          }

          .cta-section {
            bottom: 8%;
          }
        }

        @media (min-width: 768px) {
          .portal {
            width: 450px;
            height: 450px;
          }

          .ring-1 { width: 140px; height: 100px; }
          .ring-2 { width: 240px; height: 170px; }
          .ring-3 { width: 340px; height: 240px; }

          .tagline-line {
            width: 80px;
          }

          .cta-section {
            bottom: 12%;
          }

          .cta-btn {
            padding: 1.25rem 2rem;
          }
        }
      `}</style>
    </div>
  );
}
