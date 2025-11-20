import React, { useState, useEffect } from 'react';

interface Effect {
  id: number;
  x: number;
  y: number;
  color: string;
}

export const GlobalEffects: React.FC = () => {
  const [effects, setEffects] = useState<Effect[]>([]);

  useEffect(() => {
    const handlePointerDown = (e: PointerEvent) => {
      // Theme colors: Indigo, Violet, Pink, Sky
      const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#0ea5e9'];
      const newEffect = {
        id: Date.now() + Math.random(),
        x: e.clientX,
        y: e.clientY,
        color: colors[Math.floor(Math.random() * colors.length)],
      };

      setEffects(prev => [...prev, newEffect]);

      // Cleanup effect after animation
      setTimeout(() => {
        setEffects(prev => prev.filter(ef => ef.id !== newEffect.id));
      }, 750);
    };

    window.addEventListener('pointerdown', handlePointerDown);
    return () => window.removeEventListener('pointerdown', handlePointerDown);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden" aria-hidden="true">
      {effects.map((effect) => (
        <div key={effect.id} className="absolute" style={{ left: effect.x, top: effect.y }}>
          {/* Expanding Ripple */}
          <div 
            className="absolute -translate-x-1/2 -translate-y-1/2 border-2 rounded-full opacity-0 animate-ripple"
            style={{ borderColor: effect.color }}
          />
          
          {/* Particles bursting outwards */}
          {[0, 45, 90, 135, 180, 225, 270, 315].map((deg, i) => (
            <div
              key={i}
              className="absolute top-0 left-0 w-1.5 h-1.5 rounded-full animate-burst"
              style={{
                backgroundColor: effect.color,
                // We use CSS variable for rotation to let keyframes know the direction
                '--tw-rotate': `${deg}deg`, 
                transform: `rotate(${deg}deg) translateY(0px)`,
              } as React.CSSProperties} 
            />
          ))}
        </div>
      ))}
      <style>{`
        @keyframes ripple {
          0% { width: 0; height: 0; opacity: 0.8; border-width: 3px; }
          100% { width: 50px; height: 50px; opacity: 0; border-width: 0; }
        }
        @keyframes burst {
          0% { transform: rotate(var(--tw-rotate)) translateY(0); opacity: 1; }
          100% { transform: rotate(var(--tw-rotate)) translateY(-35px); opacity: 0; }
        }
        .animate-ripple { animation: ripple 0.6s cubic-bezier(0, 0, 0.2, 1) forwards; }
        .animate-burst { animation: burst 0.6s cubic-bezier(0, 0, 0.2, 1) forwards; }
      `}</style>
    </div>
  );
};