import React, { useEffect, useState } from 'react';

interface Bubble {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  vx: number;
  vy: number;
}

const BUBBLE_COLORS = [
  'rgba(56, 189, 248, 0.7)',   // sky blue
  'rgba(251, 146, 60, 0.7)',   // orange
  'rgba(168, 85, 247, 0.7)',   // purple
  'rgba(74, 222, 128, 0.7)',   // emerald
  'rgba(244, 63, 94, 0.7)',    // rose
  'rgba(250, 204, 21, 0.7)',   // yellow
];

export const ClickBubbleEffect: React.FC = () => {
  const [bubbles, setBubbles] = useState<Bubble[]>([]);

  useEffect(() => {
    let idCounter = 0;

    const handleClick = (e: MouseEvent) => {
      // Create 5 to 8 bubbles at click coordinates
      const count = Math.floor(Math.random() * 4) + 5;
      const newBubbles: Bubble[] = [];

      for (let i = 0; i < count; i++) {
        idCounter++;
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 3 + 1.5;
        newBubbles.push({
          id: idCounter,
          x: e.clientX,
          y: e.clientY,
          size: Math.floor(Math.random() * 16) + 12,
          color: BUBBLE_COLORS[Math.floor(Math.random() * BUBBLE_COLORS.length)],
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 1.5, // slightly float upwards
        });
      }

      setBubbles((prev) => [...prev.slice(-40), ...newBubbles]);
    };

    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  // Animate bubbles float & shrink/fade out with requestAnimationFrame
  useEffect(() => {
    if (bubbles.length === 0) return;

    let animId: number;
    let lastTime = performance.now();

    const animate = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      setBubbles((prev) => {
        if (prev.length === 0) return prev;
        return prev
          .map((b) => ({
            ...b,
            x: b.x + b.vx * 60 * dt,
            y: b.y + b.vy * 60 * dt,
            vy: b.vy - 0.05 * 60 * dt, // gravity/upward float
            size: b.size - 0.6 * 60 * dt,
          }))
          .filter((b) => b.size > 2);
      });

      animId = requestAnimationFrame(animate);
    };

    animId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animId);
  }, [bubbles.length > 0 ? 1 : 0]);

  if (bubbles.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {bubbles.map((b) => (
        <div
          key={b.id}
          className="absolute rounded-full shadow-sm"
          style={{
            left: `${b.x}px`,
            top: `${b.y}px`,
            width: `${b.size}px`,
            height: `${b.size}px`,
            backgroundColor: b.color,
            transform: 'translate(-50%, -50%)',
            border: '1.5px solid rgba(255, 255, 255, 0.8)',
            boxShadow: '0 0 10px rgba(255, 255, 255, 0.5)',
          }}
        />
      ))}
    </div>
  );
};
