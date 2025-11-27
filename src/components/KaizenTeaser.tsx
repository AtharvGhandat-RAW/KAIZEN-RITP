import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Users,
  Megaphone,
  Code,
  Handshake,
  Palette,
  Settings,
  X,
} from "lucide-react";

interface KaizenTeaserProps {
  onComplete: () => void;
}

export function KaizenTeaser({
  onComplete,
}: KaizenTeaserProps) {
  const [scene, setScene] = useState(0);
  const [letterVisible, setLetterVisible] = useState<number[]>(
    [],
  );
  const [currentTeam, setCurrentTeam] = useState(0);
  const [finaleKaizenVisible, setFinaleKaizenVisible] =
    useState<number[]>([]);
  const [finaleRitpVisible, setFinaleRitpVisible] =
    useState(false);

  const teams = [
    {
      icon: Settings,
      title: "Operations Unit",
      heads: ["Shrinivas (AIML)", "Janhavi (CO)"],
      desc: "The backbone of logistics, coordination, and on-ground execution.",
    },
    {
      icon: Users,
      title: "Management Unit",
      heads: ["Vitali (AIML)", "Aviraj (CO)"],
      desc: "Ensuring planning, discipline, and smooth administrative flow.",
    },
    {
      icon: Megaphone,
      title: "Digital Media Unit",
      heads: ["Riya (AIML)", "Siddhant (CO)"],
      desc: "The voice of our fest—crafting presence, engagement & digital identity.",
    },
    {
      icon: Code,
      title: "Tech & Production Unit",
      heads: ["Athrav (AIML)", "Shravani (CO)", "Amar (AIML)"],
      desc: "Innovation meets execution—bringing tech excellence to life.",
    },
    {
      icon: Handshake,
      title: "Partnership Unit",
      heads: ["Prasad (AIML)", "Sonal (AIML)"],
      desc: "Building bridges, collaborations, and impactful partnerships.",
    },
    {
      icon: Palette,
      title: "Ambience Design Unit",
      heads: ["Mayuri (AIML)", "Sanika (AIML)", "Sunil (AIML)"],
      desc: "Creators of the vibe—crafting visual magic and aesthetic brilliance.",
    },
  ];

  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];

    // Scene 1: KAIZEN (0-5s)
    timers.push(setTimeout(() => setScene(1), 300));
    [0, 1, 2, 3, 4, 5].forEach((i) => {
      timers.push(
        setTimeout(
          () => {
            setLetterVisible((prev) => [...prev, i]);
          },
          800 + i * 450,
        ),
      );
    });

    // Scene 2: RITP + Message (5-9s)
    timers.push(setTimeout(() => setScene(2), 5500));

    // Scene 3: COC Intro (9-11s)
    timers.push(setTimeout(() => setScene(3), 9500));

    // Scene 4: Team cards (11-26.5s, 2.5s each - faster and more dynamic)
    teams.forEach((_, i) => {
      timers.push(
        setTimeout(
          () => {
            setScene(4);
            setCurrentTeam(i);
          },
          11500 + i * 2500,
        ),
      );
    });

    // Scene 5: Finale KAIZEN RITP reveal (26.5-32s)
    timers.push(
      setTimeout(() => {
        setScene(5);
        [0, 1, 2, 3, 4, 5].forEach((i) => {
          timers.push(
            setTimeout(
              () => {
                setFinaleKaizenVisible((prev) => [...prev, i]);
              },
              400 + i * 300,
            ),
          );
        });
      }, 26500),
    );

    timers.push(
      setTimeout(() => setFinaleRitpVisible(true), 29000),
    );
    timers.push(setTimeout(() => onComplete(), 32000));

    return () => timers.forEach((t) => clearTimeout(t));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onComplete]);

  return (
    <div className="stranger-intro">
      <div className="void-bg" />

      <div className="fog-drift">
        <div className="fog-layer fog-1" />
        <div className="fog-layer fog-2" />
      </div>

      <div className="particle-void">
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className="void-particle"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 8}s`,
              animationDuration: `${15 + Math.random() * 10}s`,
            }}
          />
        ))}
      </div>

      <button onClick={() => onComplete()} className="skip-btn">
        <X className="w-4 h-4" />
        <span>SKIP</span>
      </button>

      <div className="stage">
        {/* SCENE 1: KAIZEN */}
        {scene === 1 && (
          <div className="scene scene-stranger">
            <div className="stranger-title">
              {["K", "A", "I", "Z", "E", "N"].map(
                (letter, i) => (
                  <div
                    key={i}
                    className={`stranger-letter ${letterVisible.includes(i) ? "drift-in" : ""}`}
                  >
                    <span className="letter-shadow">
                      {letter}
                    </span>
                    <span className="letter-main">
                      {letter}
                    </span>
                    <span className="letter-glow">
                      {letter}
                    </span>
                  </div>
                ),
              )}
            </div>

            {letterVisible.length >= 6 && (
              <div className="stranger-subtitle">
                <span className="sub-text">THE TECH FEST</span>
              </div>
            )}
          </div>
        )}

        {/* SCENE 2: RITP + Message */}
        {scene === 2 && (
          <div className="scene scene-message">
            <div className="ritp-container">
              <div className="ritp-glow" />
              <span className="ritp-text">RITP</span>
            </div>

            <div className="msg-card">
              <div className="msg-label">FEST COORDINATOR</div>
              <div className="msg-name">RISHIKANT MALLICK</div>
              <div className="msg-name">PRAVIN THITE</div>
              <div className="msg-quote">
                "Bringing Innovation, Creativity & Teamwork to
                Life"
              </div>

              <div className="corner c-tl" />
              <div className="corner c-tr" />
              <div className="corner c-bl" />
              <div className="corner c-br" />
            </div>
          </div>
        )}

        {/* SCENE 3: COC Intro */}
        {scene === 3 && (
          <div className="scene scene-coc-intro">
            <div className="icon-wrap">
              <Sparkles className="icon-main" />
              <div className="icon-pulse" />
            </div>

            <h1 className="coc-title">
              CORE ORGANIZING
              <br />
              COMMITTEE
            </h1>

            <div className="coc-subtitle">
              The Powerhouse Behind KAIZEN
            </div>
          </div>
        )}

        {/* SCENE 4: Simple Team Cards with Professional Transitions */}
        {scene === 4 && (
          <div className="scene scene-team">
            {teams.map((team, idx) => {
              const Icon = team.icon;
              const isActive = idx === currentTeam;

              return (
                <div
                  key={idx}
                  className={`team-card-simple ${isActive ? "active" : ""} ${idx < currentTeam ? "past" : ""} ${idx > currentTeam ? "future" : ""}`}
                >
                  <div className="card-inner">
                    <div className="icon-box">
                      <Icon className="team-icon" />
                    </div>

                    <h2 className="team-title">{team.title}</h2>

                    <div className="team-heads">
                      {team.heads.map((head, headIdx) => (
                        <div key={headIdx} className="head-tag">
                          {head}
                        </div>
                      ))}
                    </div>

                    <p className="team-desc">{team.desc}</p>
                  </div>

                  <div className="corner c-tl" />
                  <div className="corner c-tr" />
                  <div className="corner c-bl" />
                  <div className="corner c-br" />
                </div>
              );
            })}
          </div>
        )}

        {/* SCENE 5: Finale */}
        {scene === 5 && (
          <div className="scene scene-finale">
            <div className="energy-rings">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="energy-ring"
                  style={{
                    animationDelay: `${i * 0.3}s`,
                  }}
                />
              ))}
            </div>

            <div className="finale-container">
              <div className="finale-kaizen">
                {["K", "A", "I", "Z", "E", "N"].map(
                  (letter, i) => (
                    <div
                      key={i}
                      className={`finale-letter ${finaleKaizenVisible.includes(i) ? "appear" : ""}`}
                    >
                      <span className="finale-letter-shadow">
                        {letter}
                      </span>
                      <span className="finale-letter-main">
                        {letter}
                      </span>
                      <span className="finale-letter-glow">
                        {letter}
                      </span>
                    </div>
                  ),
                )}
              </div>

              {finaleKaizenVisible.length >= 6 && (
                <div className="finale-divider">
                  <div className="divider-line" />
                </div>
              )}

              {finaleRitpVisible && (
                <div className="finale-ritp">
                  <div className="ritp-wrapper">
                    <span className="ritp-letter">R</span>
                    <span className="ritp-letter">I</span>
                    <span className="ritp-letter">T</span>
                    <span className="ritp-letter">P</span>
                  </div>

                  <div className="ritp-tagline">
                    WHERE INNOVATION MEETS EXCELLENCE
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Orbitron:wght@700;900&family=Rajdhani:wght@600;700&family=Inter:wght@400;600&display=swap');
        
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
        
        .stranger-intro {
          position: fixed;
          inset: 0;
          z-index: 100;
          background: #000;
          overflow: hidden;
          font-family: 'Rajdhani', sans-serif;
        }
        
        .void-bg {
          position: absolute;
          inset: 0;
          background: #000;
        }
        
        .fog-drift {
          position: absolute;
          inset: 0;
          pointer-events: none;
        }
        
        .fog-layer {
          position: absolute;
          width: 200%;
          height: 200%;
          top: -50%;
          left: -50%;
          background: radial-gradient(ellipse at center, rgba(60, 0, 0, 0.12) 0%, transparent 60%);
        }
        
        .fog-1 {
          animation: fog-move 40s ease-in-out infinite alternate;
        }
        
        .fog-2 {
          animation: fog-move 50s ease-in-out infinite alternate-reverse;
          opacity: 0.6;
        }
        
        @keyframes fog-move {
          from { transform: translate(0, 0); }
          to { transform: translate(5%, 5%); }
        }
        
        .particle-void {
          position: absolute;
          inset: 0;
          pointer-events: none;
        }
        
        .void-particle {
          position: absolute;
          width: 1px;
          height: 1px;
          background: rgba(255, 60, 60, 0.4);
          border-radius: 50%;
          animation: particle-float linear infinite;
        }
        
        @keyframes particle-float {
          0% { opacity: 0; transform: translateY(0); }
          20% { opacity: 1; }
          80% { opacity: 0.3; }
          100% { opacity: 0; transform: translateY(-200px); }
        }
        
        .skip-btn {
          position: fixed;
          top: 2rem;
          right: 2rem;
          z-index: 110;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem 2rem;
          background: rgba(10, 0, 0, 0.9);
          border: 1.5px solid rgba(255, 60, 60, 0.5);
          color: #ff6666;
          font-family: 'Orbitron', monospace;
          font-weight: 700;
          font-size: 0.9rem;
          letter-spacing: 0.15em;
          cursor: pointer;
          transition: all 0.3s ease;
          backdrop-filter: blur(10px);
        }
        
        .skip-btn:hover {
          background: rgba(40, 0, 0, 0.95);
          border-color: #ff4444;
          color: #ff4444;
          transform: translateY(-2px);
          box-shadow: 0 4px 20px rgba(255, 60, 60, 0.3);
        }
        
        .stage {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
        }
        
        .scene {
          width: 100%;
          max-width: 1200px;
          animation: scene-fade 0.8s ease-out;
        }
        
        @keyframes scene-fade {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        /* SCENE 1: KAIZEN */
        .scene-stranger {
          text-align: center;
          perspective: 1000px;
        }
        
        .stranger-title {
          display: flex;
          justify-content: center;
          gap: clamp(0.5rem, 1.5vw, 1.5rem);
          margin-bottom: 3rem;
          flex-wrap: wrap;
        }
        
        .stranger-letter {
          position: relative;
          display: inline-block;
          opacity: 0;
          transform: scale(0.3) translateZ(-500px);
          filter: blur(20px);
        }
        
        .stranger-letter.drift-in {
          animation: stranger-drift 2s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
        }
        
        @keyframes stranger-drift {
          0% {
            opacity: 0;
            transform: scale(0.3) translateZ(-500px) translateY(100px);
            filter: blur(20px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateZ(0) translateY(0);
            filter: blur(0);
          }
        }
        
        .letter-shadow,
        .letter-main,
        .letter-glow {
          font-family: 'Playfair Display', serif;
          font-size: clamp(5rem, 15vw, 12rem);
          font-weight: 900;
          line-height: 1;
          display: block;
        }
        
        .letter-shadow {
          position: absolute;
          top: 4px;
          left: 4px;
          color: #000;
          filter: blur(4px);
          z-index: 1;
          opacity: 0.8;
        }
        
        .letter-main {
          position: relative;
          color: transparent;
          -webkit-text-stroke: 2px #ff0000;
          text-stroke: 2px #ff0000;
          z-index: 2;
          filter: drop-shadow(0 0 10px rgba(255, 0, 0, 0.8));
        }
        
        .letter-glow {
          position: absolute;
          top: 0;
          left: 0;
          color: #ff0000;
          opacity: 0.3;
          filter: blur(12px);
          z-index: 0;
          animation: glow-pulse 3s ease-in-out infinite;
        }
        
        @keyframes glow-pulse {
          0%, 100% {
            opacity: 0.25;
            filter: blur(12px);
          }
          50% {
            opacity: 0.4;
            filter: blur(16px);
          }
        }
        
        .stranger-subtitle {
          animation: subtitle-rise 1s ease-out 1s backwards;
        }
        
        @keyframes subtitle-rise {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .sub-text {
          font-family: 'Rajdhani', sans-serif;
          font-size: clamp(1.25rem, 3vw, 2rem);
          font-weight: 700;
          letter-spacing: 0.4em;
          color: rgba(255, 120, 120, 0.85);
          text-transform: uppercase;
          text-shadow: 0 0 12px rgba(255, 60, 60, 0.5);
        }
        
        /* SCENE 2: MESSAGE */
        .scene-message {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 3rem;
        }
        
        .ritp-container {
          position: relative;
          padding: 2rem 4rem;
        }
        
        .ritp-glow {
          position: absolute;
          inset: -30px;
          background: radial-gradient(circle, rgba(255, 60, 60, 0.3) 0%, transparent 70%);
          filter: blur(40px);
          animation: ritp-pulse 2.5s ease-in-out infinite;
        }
        
        @keyframes ritp-pulse {
          0%, 100% {
            opacity: 0.5;
            transform: scale(0.9);
          }
          50% {
            opacity: 0.8;
            transform: scale(1.1);
          }
        }
        
        .ritp-text {
          position: relative;
          z-index: 2;
          font-family: 'Playfair Display', serif;
          font-size: clamp(4rem, 12vw, 7rem);
          font-weight: 900;
          letter-spacing: 0.5em;
          color: transparent;
          -webkit-text-stroke: 2px #ff0000;
          text-stroke: 2px #ff0000;
          filter: drop-shadow(0 0 12px rgba(255, 0, 0, 0.8));
        }
        
        .msg-card {
          position: relative;
          width: 100%;
          max-width: 800px;
          padding: clamp(2.5rem, 5vw, 4rem) clamp(2rem, 4vw, 3rem);
          background: linear-gradient(135deg, rgba(30, 0, 0, 0.95), rgba(15, 0, 0, 0.98));
          border: 2px solid rgba(255, 60, 60, 0.4);
          backdrop-filter: blur(10px);
          box-shadow: 0 0 60px rgba(255, 60, 60, 0.15);
          text-align: center;
        }
        
        .msg-label {
          font-family: 'Rajdhani', sans-serif;
          font-size: clamp(1rem, 2.5vw, 1.5rem);
          font-weight: 700;
          letter-spacing: 0.3em;
          color: rgba(255, 120, 120, 0.85);
          text-transform: uppercase;
          margin-bottom: 1rem;
        }
        
        .msg-name {
          font-family: 'Playfair Display', serif;
          font-size: clamp(2.5rem, 6vw, 4rem);
          font-weight: 900;
          color: #ff4444;
          text-shadow: 0 0 20px rgba(255, 60, 60, 0.7);
          margin-bottom: 2rem;
        }
        
        .msg-quote {
          font-family: 'Inter', sans-serif;
          font-size: clamp(1.1rem, 2.5vw, 1.6rem);
          font-weight: 400;
          line-height: 1.7;
          color: rgba(255, 255, 255, 0.9);
        }
        
        /* SCENE 3: COC INTRO */
        .scene-coc-intro {
          text-align: center;
        }
        
        .icon-wrap {
          position: relative;
          display: inline-block;
          margin-bottom: 3rem;
        }
        
        .icon-main {
          width: clamp(4rem, 10vw, 6rem);
          height: clamp(4rem, 10vw, 6rem);
          color: #ff4444;
          filter: drop-shadow(0 0 25px rgba(255, 60, 60, 0.8));
          animation: icon-drift 0.8s ease-out, icon-float 3s ease-in-out 0.8s infinite;
        }
        
        @keyframes icon-drift {
          from {
            opacity: 0;
            transform: scale(0.5) rotate(-90deg);
          }
          to {
            opacity: 1;
            transform: scale(1) rotate(0deg);
          }
        }
        
        @keyframes icon-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }
        
        .icon-pulse {
          position: absolute;
          inset: -20px;
          border: 2px solid rgba(255, 60, 60, 0.5);
          border-radius: 50%;
          animation: pulse-ring 2s ease-out infinite;
        }
        
        @keyframes pulse-ring {
          0% {
            transform: scale(1);
            opacity: 1;
          }
          100% {
            transform: scale(1.8);
            opacity: 0;
          }
        }
        
        .coc-title {
          font-family: 'Playfair Display', serif;
          font-size: clamp(2.5rem, 8vw, 5.5rem);
          font-weight: 900;
          color: #ff4444;
          text-shadow: 0 0 20px rgba(255, 60, 60, 0.7);
          letter-spacing: 0.1em;
          line-height: 1.2;
          margin-bottom: 2rem;
        }
        
        .coc-subtitle {
          font-family: 'Rajdhani', sans-serif;
          font-size: clamp(1.25rem, 3vw, 2rem);
          font-weight: 700;
          letter-spacing: 0.3em;
          color: rgba(255, 120, 120, 0.85);
          text-transform: uppercase;
        }
        
        /* ==========================================
           SCENE 4: SIMPLE PROFESSIONAL CARDS
        ========================================== */
        
        .scene-team {
          position: relative;
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        /* Simple Card - All cards stacked */
        .team-card-simple {
          position: absolute;
          width: 100%;
          max-width: 900px;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          opacity: 0;
          transition: opacity 0.6s ease, transform 0.6s ease;
          pointer-events: none;
        }
        
        /* Past cards - fade out to left */
        .team-card-simple.past {
          opacity: 0;
          transform: translate(-60%, -50%);
        }
        
        /* Active card - visible and centered */
        .team-card-simple.active {
          opacity: 1;
          transform: translate(-50%, -50%);
          pointer-events: auto;
          z-index: 10;
        }
        
        /* Future cards - hidden to right */
        .team-card-simple.future {
          opacity: 0;
          transform: translate(-40%, -50%);
        }
        
        .card-inner {
          position: relative;
          width: 100%;
          padding: clamp(3rem, 5vw, 4rem) clamp(2rem, 4vw, 3rem);
          background: linear-gradient(135deg, rgba(30, 0, 0, 0.95), rgba(15, 0, 0, 0.98));
          border: 2px solid rgba(255, 60, 60, 0.4);
          backdrop-filter: blur(10px);
          box-shadow: 0 0 60px rgba(255, 60, 60, 0.15);
        }
        
        .icon-box {
          display: flex;
          justify-content: center;
          margin-bottom: 2rem;
        }
        
        .team-icon {
          width: clamp(4rem, 10vw, 5rem);
          height: clamp(4rem, 10vw, 5rem);
          color: #ff4444;
          filter: drop-shadow(0 0 20px rgba(255, 60, 60, 0.8));
        }
        
        .team-title {
          font-family: 'Playfair Display', serif;
          font-size: clamp(2.5rem, 6vw, 3.8rem);
          font-weight: 900;
          text-align: center;
          color: #ff4444;
          text-shadow: 0 0 20px rgba(255, 60, 60, 0.7);
          letter-spacing: 0.05em;
          text-transform: uppercase;
          margin-bottom: 2rem;
        }
        
        .team-heads {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: clamp(0.75rem, 2vw, 1.25rem);
          margin-bottom: 2.5rem;
        }
        
        .head-tag {
          padding: clamp(0.75rem, 1.5vw, 1rem) clamp(1.5rem, 3vw, 2rem);
          background: rgba(0, 0, 0, 0.6);
          border: 2px solid rgba(255, 60, 60, 0.5);
          font-family: 'Rajdhani', sans-serif;
          font-size: clamp(1.05rem, 2vw, 1.3rem);
          font-weight: 700;
          color: rgba(255, 255, 255, 0.95);
        }
        
        .team-desc {
          font-family: 'Inter', sans-serif;
          font-size: clamp(1.05rem, 2.2vw, 1.3rem);
          font-weight: 400;
          line-height: 1.7;
          text-align: center;
          color: rgba(255, 255, 255, 0.9);
          max-width: 700px;
          margin: 0 auto;
        }
        
        /* CORNERS */
        .corner {
          position: absolute;
          width: clamp(20px, 3vw, 30px);
          height: clamp(20px, 3vw, 30px);
          border-color: rgba(255, 60, 60, 0.5);
          border-width: 2px;
          border-style: solid;
        }
        
        .c-tl {
          top: -2px;
          left: -2px;
          border-right: none;
          border-bottom: none;
        }
        
        .c-tr {
          top: -2px;
          right: -2px;
          border-left: none;
          border-bottom: none;
        }
        
        .c-bl {
          bottom: -2px;
          left: -2px;
          border-right: none;
          border-top: none;
        }
        
        .c-br {
          bottom: -2px;
          right: -2px;
          border-left: none;
          border-top: none;
        }
        
        /* SCENE 5: FINALE */
        .scene-finale {
          position: relative;
          text-align: center;
        }
        
        .energy-rings {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 1000px;
          height: 1000px;
          z-index: 0;
        }
        
        .energy-ring {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 150px;
          height: 150px;
          border: 3px solid rgba(255, 60, 60, 0.5);
          border-radius: 50%;
          animation: ring-expand 3s ease-out infinite;
        }
        
        @keyframes ring-expand {
          0% {
            transform: translate(-50%, -50%) scale(0.5);
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -50%) scale(4);
            opacity: 0;
          }
        }
        
        .finale-container {
          position: relative;
          z-index: 2;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2rem;
        }
        
        .finale-kaizen {
          display: flex;
          justify-content: center;
          gap: clamp(0.75rem, 2vw, 2rem);
          flex-wrap: wrap;
        }
        
        .finale-letter {
          position: relative;
          display: inline-block;
          opacity: 0;
          transform: scale(0.5) translateY(-100px);
        }
        
        .finale-letter.appear {
          animation: finale-appear 1s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        
        @keyframes finale-appear {
          0% {
            opacity: 0;
            transform: scale(0.5) translateY(-100px);
            filter: blur(20px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
            filter: blur(0);
          }
        }
        
        .finale-letter-shadow,
        .finale-letter-main,
        .finale-letter-glow {
          font-family: 'Playfair Display', serif;
          font-size: clamp(5rem, 15vw, 11rem);
          font-weight: 900;
          line-height: 1;
          display: block;
        }
        
        .finale-letter-shadow {
          position: absolute;
          top: 6px;
          left: 6px;
          color: #000;
          filter: blur(6px);
          z-index: 1;
          opacity: 0.8;
        }
        
        .finale-letter-main {
          position: relative;
          color: transparent;
          -webkit-text-stroke: 3px #ff0000;
          text-stroke: 3px #ff0000;
          z-index: 2;
          filter: drop-shadow(0 0 15px rgba(255, 0, 0, 0.9));
        }
        
        .finale-letter-glow {
          position: absolute;
          top: 0;
          left: 0;
          color: #ff0000;
          opacity: 0.4;
          filter: blur(20px);
          z-index: 0;
          animation: finale-glow-pulse 2.5s ease-in-out infinite;
        }
        
        @keyframes finale-glow-pulse {
          0%, 100% {
            opacity: 0.3;
            filter: blur(20px);
          }
          50% {
            opacity: 0.5;
            filter: blur(25px);
          }
        }
        
        .finale-divider {
          width: 100%;
          display: flex;
          justify-content: center;
          animation: divider-in 0.8s ease-out;
        }
        
        @keyframes divider-in {
          from {
            opacity: 0;
            transform: scaleX(0);
          }
          to {
            opacity: 1;
            transform: scaleX(1);
          }
        }
        
        .divider-line {
          width: clamp(200px, 60%, 500px);
          height: 2px;
          background: linear-gradient(90deg, transparent, #ff0000, transparent);
          box-shadow: 0 0 20px rgba(255, 0, 0, 0.8);
        }
        
        .finale-ritp {
          animation: ritp-rise 0.8s ease-out;
        }
        
        @keyframes ritp-rise {
          from {
            opacity: 0;
            transform: translateY(50px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .ritp-wrapper {
          display: flex;
          justify-content: center;
          gap: clamp(0.5rem, 1.5vw, 1.5rem);
          margin-bottom: 1.5rem;
        }
        
        .ritp-letter {
          font-family: 'Playfair Display', serif;
          font-size: clamp(3rem, 10vw, 6rem);
          font-weight: 900;
          color: transparent;
          -webkit-text-stroke: 2px #ff0000;
          text-stroke: 2px #ff0000;
          filter: drop-shadow(0 0 12px rgba(255, 0, 0, 0.8));
          animation: ritp-letter-pop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) backwards;
        }
        
        .ritp-letter:nth-child(1) { animation-delay: 0s; }
        .ritp-letter:nth-child(2) { animation-delay: 0.1s; }
        .ritp-letter:nth-child(3) { animation-delay: 0.2s; }
        .ritp-letter:nth-child(4) { animation-delay: 0.3s; }
        
        @keyframes ritp-letter-pop {
          from {
            opacity: 0;
            transform: scale(0.5);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        .ritp-tagline {
          font-family: 'Rajdhani', sans-serif;
          font-size: clamp(1rem, 2.5vw, 1.75rem);
          font-weight: 700;
          letter-spacing: 0.35em;
          color: rgba(255, 120, 120, 0.9);
          text-transform: uppercase;
          text-shadow: 0 0 15px rgba(255, 60, 60, 0.6);
        }
        
        /* RESPONSIVE */
        @media (max-width: 1024px) {
          .team-card-simple {
            max-width: 750px;
          }
          
          .card-inner {
            padding: 2.5rem 2rem;
          }
        }
        
        @media (max-width: 768px) {
          .skip-btn {
            top: 1rem;
            right: 1rem;
            padding: 0.75rem 1.5rem;
            font-size: 0.8rem;
          }
          
          .stage {
            padding: 1.5rem;
          }
          
          .team-card-simple {
            max-width: 600px;
          }
          
          .card-inner {
            padding: 2rem 1.5rem;
          }
          
          .team-title {
            font-size: 2.2rem;
            margin-bottom: 1.5rem;
          }
          
          .icon-box {
            margin-bottom: 1.5rem;
          }
          
          .team-icon {
            width: 3.5rem;
            height: 3.5rem;
          }
        }
        
        @media (max-width: 640px) {
          .stage {
            padding: 1rem;
          }
          
          .team-card-simple {
            max-width: 100%;
          }
          
          .card-inner {
            padding: 2rem 1.25rem;
          }
        }
        
        @media (max-width: 480px) {
          .skip-btn {
            padding: 0.6rem 1.2rem;
            font-size: 0.75rem;
            top: 0.75rem;
            right: 0.75rem;
          }
          
          .stage {
            padding: 0.75rem;
          }
          
          .card-inner {
            padding: 1.75rem 1rem;
          }
          
          .team-title {
            font-size: 1.75rem;
            margin-bottom: 1.25rem;
          }
          
          .team-icon {
            width: 3rem;
            height: 3rem;
          }
          
          .head-tag {
            padding: 0.6rem 1rem;
            font-size: 0.9rem;
          }
          
          .team-desc {
            font-size: 1rem;
          }
        }
        
        @media (max-width: 360px) {
          .card-inner {
            padding: 1.5rem 0.85rem;
          }
          
          .team-title {
            font-size: 1.5rem;
          }
          
          .head-tag {
            padding: 0.5rem 0.85rem;
            font-size: 0.85rem;
          }
        }
      `}</style>
    </div>
  );
}