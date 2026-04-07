import React, { useEffect, useRef } from 'react';
import { Button } from './Button';
import { playSound } from '../utils/sound';

interface Props {
  onClose: () => void;
  reduceMotion?: boolean;
}

export const Celebration: React.FC<Props> = ({ onClose, reduceMotion = false }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    playSound('win');

    if (reduceMotion) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: any[] = [];
    const colors = ['#f87171', '#60a5fa', '#4ade80', '#fbbf24', '#a78bfa'];

    for (let i = 0; i < 150; i++) {
      particles.push({
        x: canvas.width / 2,
        y: canvas.height / 2,
        vx: (Math.random() - 0.5) * 20,
        vy: (Math.random() - 0.5) * 20 - 5,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 10 + 5,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 10
      });
    }

    let animationId: number;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.5;
        p.rotation += p.rotationSpeed;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();
      });

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animationId);
  }, [reduceMotion]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      {!reduceMotion && <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" />}
      <div className={`bg-white p-8 rounded-3xl shadow-2xl text-center ${reduceMotion ? '' : 'transform animate-[bounce_1s_infinite]'}`}>
        <h2 className="text-4xl font-bold text-yellow-500 mb-4">Parabéns! 🎉</h2>
        <p className="text-xl text-gray-700 mb-8 font-bold">Você completou todas as fases!</p>
        <Button size="lg" variant="success" onClick={onClose}>
          Continuar
        </Button>
      </div>
    </div>
  );
};