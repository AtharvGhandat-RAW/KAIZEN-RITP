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
  | 'preReveal'          // Scene 9: 24-27s (Darkness/Suspense)
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
    preReveal: { start: 24000, duration: 3000 }, // Replaced portal with dark suspense
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
      'preReveal', 'finalReveal', 'enterButton'
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
      'preReveal', 'finalReveal', 'enterButton'
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
        <div className={`ambient-glow ${isPastPhase('preReveal') ? 'intense' : ''}`} />

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

        {/* Scene 9: Pre-Reveal Suspense (Darkness before the storm) */}
        {isPastPhase('preReveal') && !isPastPhase('finalReveal') && (
          <div className="pre-reveal-suspense">
            {/* Just darkness and subtle energy building up */}
            <div className="suspense-glow" />
          </div>
        )}

        {/* Scene 10: Final Reveal - Stranger Things Style */}
        {isPastPhase('finalReveal') && (
          <div className={`final-reveal stage-${revealStage}`}>
            <div className="stranger-things-container">
              
              {/* KAIZEN - The Main Title */}
              <div className="st-title-wrapper">
                <h1 className="st-title-main">
                  {'KAIZEN'.split('').map((letter, i) => (
                    <span 
                      key={i} 
                      className={`st-letter st-letter-${i}`}
                      style={{ 
                        animationDelay: `${i * 0.1}s` 
                      }}
                    >
                      {letter}
                    </span>
                  ))}
                </h1>
              </div>

              {/* RITP - The Subtitle */}
              <div className="st-subtitle-wrapper">
                <h2 className="st-title-sub">
                  {'RITP'.split('').map((letter, i) => (
                    <span 
                      key={i} 
                      className="st-letter-sub"
                      style={{ 
                        animationDelay: `${2 + (i * 0.1)}s` 
                      }}
                    >
                      {letter}
                    </span>
                  ))}
                </h2>
              </div>

              {/* Top Bar */}
              <div className="st-bar st-bar-top" />
              
              {/* Bottom Bar (optional, usually ST has lines forming letters, but we'll use bars for style) */}
              <div className="st-bar st-bar-bottom" />

              {/* Glow/Fog behind */}
              <div className="st-glow-bg" />
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
          transform: scale(2); /* Zoom through effect */
          pointer-events: none;
          filter: blur(10px);
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
        /* === PRE-REVEAL SUSPENSE === */
        .pre-reveal-suspense {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .suspense-glow {
          width: 100%;
          height: 100%;
          background: radial-gradient(circle at center, rgba(0,0,0,0) 0%, #000 100%);
          animation: suspensePulse 0.5s ease-in-out infinite alternate;
        }

        @keyframes suspensePulse {
          from { opacity: 0.3; }
          to { opacity: 0.7; }
        }

        /* === FINAL REVEAL - STRANGER THINGS STYLE === */
        .final-reveal {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 100%;
        }

        .stranger-things-container {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 100%;
          perspective: 1000px;
        }

        /* KAIZEN Title */
        .st-title-wrapper {
          position: relative;
          z-index: 10;
          margin-bottom: 1rem;
        }

        .st-title-main {
          display: flex;
          justify-content: center;
          margin: 0;
          line-height: 1;
        }

        .st-letter {
          font-family: 'Cinzel', serif; /* Closest to Benguiat we have loaded */
          font-size: clamp(4rem, 15vw, 12rem);
          font-weight: 900;
          color: transparent;
          -webkit-text-stroke: 2px #ed1c24; /* Stranger Things Red */
          text-stroke: 2px #ed1c24;
          display: inline-block;
          position: relative;
          
          /* Initial State for Animation */
          opacity: 0;
          transform: scale(3);
          
          animation: stLetterReveal 4s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
        }

        /* Individual letter adjustments for that "uneven" look if needed, 
           but uniform drift is the signature */
        
        @keyframes stLetterReveal {
          0% {
            opacity: 0;
            transform: scale(3);
            margin: 0 2vw; /* Simulate letter-spacing with margin for flex items */
            filter: blur(10px);
          }
          20% {
            opacity: 1;
            filter: blur(0px);
          }
          100% {
            opacity: 1;
            transform: scale(1);
            margin: 0 0.1vw;
            -webkit-text-stroke: 2px #ed1c24;
            text-shadow: 0 0 15px rgba(237, 28, 36, 0.5);
          }
        }

        /* RITP Subtitle */
        .st-subtitle-wrapper {
          position: relative;
          z-index: 10;
          margin-top: -1vw;
        }

        .st-title-sub {
          display: flex;
          justify-content: center;
          margin: 0;
        }

        .st-letter-sub {
          font-family: 'Cinzel', serif;
          font-size: clamp(1.5rem, 5vw, 4rem);
          font-weight: 700;
          color: #ed1c24; /* Solid red for subtitle usually, or outlined */
          -webkit-text-stroke: 1px #ed1c24;
          display: inline-block;
          
          opacity: 0;
          transform: scale(2);
          
          animation: stSubtitleReveal 3.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
        }

        @keyframes stSubtitleReveal {
          0% {
            opacity: 0;
            transform: scale(2);
            margin: 0 2vw;
          }
          100% {
            opacity: 1;
            transform: scale(1);
            margin: 0 0.2vw;
            text-shadow: 0 0 10px rgba(237, 28, 36, 0.6);
          }
        }

        /* Bars */
        .st-bar {
          position: absolute;
          left: 0;
          right: 0;
          height: clamp(2px, 0.5vw, 6px);
          background: #ed1c24;
          box-shadow: 0 0 15px rgba(237, 28, 36, 0.8);
          opacity: 0;
          animation: stBarSlide 3s ease-out forwards 1s;
        }

        .st-bar-top {
          top: 25%;
          transform: translateX(-100%);
        }

        .st-bar-bottom {
          bottom: 25%;
          transform: translateX(100%);
        }

        @keyframes stBarSlide {
          0% { opacity: 0; transform: scaleX(0); }
          10% { opacity: 1; }
          100% { opacity: 0.6; transform: scaleX(1); }
        }

        /* Glow Background */
        .st-glow-bg {
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at center, rgba(237, 28, 36, 0.15) 0%, transparent 60%);
          z-index: 1;
          opacity: 0;
          animation: stBgPulse 4s ease-in-out infinite;
        }

        @keyframes stBgPulse {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.1); }
        }

        /* Responsive adjustments */
        @media (max-width: 768px) {
          .st-bar-top { top: 30%; }
          .st-bar-bottom { bottom: 30%; }
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
