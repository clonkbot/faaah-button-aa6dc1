import { useState, useRef, useCallback, useEffect } from 'react';

interface Particle {
  id: number;
  x: number;
  y: number;
  angle: number;
  color: string;
}

interface Ring {
  id: number;
  x: number;
  y: number;
}

const colors = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#FF8C42', '#A8E6CF', '#FF5E5B', '#00F5D4'];

export default function App() {
  const [isPressed, setIsPressed] = useState(false);
  const [shake, setShake] = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [rings, setRings] = useState<Ring[]>([]);
  const [clickCount, setClickCount] = useState(0);
  const [showFaaah, setShowFaaah] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const playFaaahSound = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    const ctx = audioContextRef.current;

    // Create a "Faaah" sound using oscillators
    const now = ctx.currentTime;

    // Main voice - descending tone
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(400, now);
    osc1.frequency.exponentialRampToValueAtTime(150, now + 0.4);
    gain1.gain.setValueAtTime(0.3, now);
    gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.5);

    // Harmonic layer
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(300, now);
    osc2.frequency.exponentialRampToValueAtTime(100, now + 0.35);
    gain2.gain.setValueAtTime(0.2, now);
    gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now);
    osc2.stop(now + 0.4);

    // Noise burst for the "F" sound
    const bufferSize = ctx.sampleRate * 0.1;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    const noise = ctx.createBufferSource();
    const noiseGain = ctx.createGain();
    const noiseFilter = ctx.createBiquadFilter();
    noise.buffer = noiseBuffer;
    noiseFilter.type = 'highpass';
    noiseFilter.frequency.value = 3000;
    noiseGain.gain.setValueAtTime(0.15, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noise.start(now);
    noise.stop(now + 0.1);
  }, []);

  const handleClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;

    // Play sound
    playFaaahSound();

    // Trigger animations
    setIsPressed(true);
    setShake(true);
    setClickCount(c => c + 1);
    setShowFaaah(true);

    // Create particles
    const newParticles: Particle[] = [];
    for (let i = 0; i < 12; i++) {
      newParticles.push({
        id: Date.now() + i,
        x,
        y,
        angle: (i / 12) * 360,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }
    setParticles(prev => [...prev, ...newParticles]);

    // Create ring
    const newRing: Ring = { id: Date.now(), x, y };
    setRings(prev => [...prev, newRing]);

    // Cleanup
    setTimeout(() => setIsPressed(false), 150);
    setTimeout(() => setShake(false), 300);
    setTimeout(() => setShowFaaah(false), 600);
    setTimeout(() => {
      setParticles(prev => prev.filter(p => !newParticles.some(np => np.id === p.id)));
    }, 800);
    setTimeout(() => {
      setRings(prev => prev.filter(r => r.id !== newRing.id));
    }, 700);
  }, [playFaaahSound]);

  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  return (
    <div className={`min-h-[100dvh] bg-zinc-950 flex flex-col items-center justify-center relative overflow-hidden ${shake ? 'animate-shake' : ''}`}>
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, #fff 1px, transparent 0)`,
          backgroundSize: '32px 32px'
        }} />
      </div>

      {/* Animated background glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[300px] h-[300px] md:w-[500px] md:h-[500px] rounded-full bg-gradient-to-r from-rose-500/20 via-amber-500/20 to-cyan-500/20 blur-3xl animate-pulse-slow" />
      </div>

      {/* Particles */}
      {particles.map(particle => (
        <div
          key={particle.id}
          className="absolute w-3 h-3 md:w-4 md:h-4 rounded-full animate-particle pointer-events-none"
          style={{
            left: particle.x,
            top: particle.y,
            backgroundColor: particle.color,
            '--angle': `${particle.angle}deg`,
            boxShadow: `0 0 10px ${particle.color}`,
          } as React.CSSProperties}
        />
      ))}

      {/* Rings */}
      {rings.map(ring => (
        <div
          key={ring.id}
          className="absolute w-40 h-40 md:w-64 md:h-64 border-4 border-amber-400 rounded-full animate-ring pointer-events-none"
          style={{
            left: ring.x,
            top: ring.y,
            transform: 'translate(-50%, -50%)',
          }}
        />
      ))}

      {/* Faaah text explosion */}
      {showFaaah && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
          <span className="text-6xl md:text-9xl font-bangers text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-amber-300 to-cyan-400 animate-faaah-pop drop-shadow-2xl">
            FAAAH!
          </span>
        </div>
      )}

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center gap-6 md:gap-8 px-4">
        {/* Title */}
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bangers text-white tracking-wider text-center">
          <span className="text-rose-400">F</span>
          <span className="text-amber-400">A</span>
          <span className="text-cyan-400">A</span>
          <span className="text-emerald-400">A</span>
          <span className="text-violet-400">H</span>
        </h1>

        {/* Subtitle */}
        <p className="text-zinc-500 text-sm md:text-base font-mono tracking-widest uppercase">
          Press the button. You know you want to.
        </p>

        {/* THE BUTTON */}
        <button
          ref={buttonRef}
          onClick={handleClick}
          className={`
            relative group
            w-48 h-48 md:w-64 md:h-64 lg:w-72 lg:h-72
            rounded-full
            bg-gradient-to-br from-rose-500 via-amber-500 to-rose-600
            shadow-[0_0_60px_rgba(251,113,133,0.5),inset_0_-8px_20px_rgba(0,0,0,0.3),inset_0_8px_20px_rgba(255,255,255,0.2)]
            hover:shadow-[0_0_80px_rgba(251,113,133,0.7),inset_0_-8px_20px_rgba(0,0,0,0.3),inset_0_8px_20px_rgba(255,255,255,0.3)]
            active:shadow-[0_0_40px_rgba(251,113,133,0.4),inset_0_8px_20px_rgba(0,0,0,0.4)]
            transition-all duration-150 ease-out
            hover:scale-105 active:scale-95
            cursor-pointer
            border-4 border-rose-300/30
            ${isPressed ? 'scale-90' : ''}
          `}
        >
          {/* Button shine */}
          <div className="absolute inset-4 md:inset-6 rounded-full bg-gradient-to-br from-white/30 to-transparent pointer-events-none" />

          {/* Button text */}
          <span className="absolute inset-0 flex items-center justify-center text-4xl md:text-5xl lg:text-6xl font-bangers text-white drop-shadow-lg tracking-wider">
            FAAAH
          </span>

          {/* Animated ring around button */}
          <div className="absolute -inset-3 md:-inset-4 rounded-full border-2 border-rose-400/30 animate-ping-slow" />
          <div className="absolute -inset-6 md:-inset-8 rounded-full border border-amber-400/20 animate-ping-slower" />
        </button>

        {/* Click counter */}
        <div className="flex items-center gap-2 text-zinc-600 font-mono text-xs md:text-sm">
          <span className="text-rose-400">{clickCount}</span>
          <span>faaah{clickCount !== 1 ? 's' : ''} unleashed</span>
        </div>
      </div>

      {/* Footer */}
      <footer className="absolute bottom-4 md:bottom-6 left-0 right-0 text-center">
        <p className="text-zinc-600 text-xs font-mono">
          Requested by <a href="https://twitter.com/asterixind" target="_blank" rel="noopener noreferrer" className="text-zinc-500 hover:text-zinc-400 transition-colors">@asterixind</a> · Built by <a href="https://twitter.com/clonkbot" target="_blank" rel="noopener noreferrer" className="text-zinc-500 hover:text-zinc-400 transition-colors">@clonkbot</a>
        </p>
      </footer>

      {/* Custom styles */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
          20%, 40%, 60%, 80% { transform: translateX(4px); }
        }

        @keyframes particle {
          0% {
            transform: translate(-50%, -50%) rotate(var(--angle)) translateY(0) scale(1);
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -50%) rotate(var(--angle)) translateY(-150px) scale(0);
            opacity: 0;
          }
        }

        @keyframes ring {
          0% {
            transform: translate(-50%, -50%) scale(0.5);
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -50%) scale(3);
            opacity: 0;
          }
        }

        @keyframes faaah-pop {
          0% {
            transform: scale(0) rotate(-10deg);
            opacity: 0;
          }
          50% {
            transform: scale(1.2) rotate(5deg);
            opacity: 1;
          }
          100% {
            transform: scale(1.5) rotate(0deg);
            opacity: 0;
          }
        }

        @keyframes ping-slow {
          0% { transform: scale(1); opacity: 0.5; }
          100% { transform: scale(1.3); opacity: 0; }
        }

        @keyframes ping-slower {
          0% { transform: scale(1); opacity: 0.3; }
          100% { transform: scale(1.5); opacity: 0; }
        }

        @keyframes pulse-slow {
          0%, 100% { opacity: 0.2; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(1.1); }
        }

        .animate-shake { animation: shake 0.3s ease-in-out; }
        .animate-particle { animation: particle 0.8s ease-out forwards; }
        .animate-ring { animation: ring 0.7s ease-out forwards; }
        .animate-faaah-pop { animation: faaah-pop 0.6s ease-out forwards; }
        .animate-ping-slow { animation: ping-slow 2s ease-out infinite; }
        .animate-ping-slower { animation: ping-slower 3s ease-out infinite; }
        .animate-pulse-slow { animation: pulse-slow 4s ease-in-out infinite; }

        .font-bangers { font-family: 'Bangers', cursive; }
      `}</style>
    </div>
  );
}
