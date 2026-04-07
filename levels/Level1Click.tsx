import React, { useState, useEffect, useRef } from 'react';
import { AppSettings, LevelStats } from '../types';
import { Button } from '../components/Button';
import { playSound } from '../utils/sound';
import { Circle, Cloud, Star, Heart, Triangle, Hexagon, Square, Smile } from 'lucide-react';
import { FullscreenButton } from '../components/FullscreenButton';

interface Props {
  settings: AppSettings;
  onComplete: (stats: LevelStats) => void;
  onExit: () => void;
  isMission?: boolean;
}

interface Target {
  id: number;
  x: number;
  y: number;
  color: string;
}

const COLORS = ['text-red-500', 'text-blue-500', 'text-green-500', 'text-yellow-500', 'text-purple-500', 'text-pink-500'];
const HIGH_CONTRAST_COLORS = ['text-yellow-300', 'text-cyan-300', 'text-fuchsia-300', 'text-lime-300', 'text-orange-300', 'text-rose-300'];

const PHASES = [
  { name: "Bolinhas", icon: Circle, count: 3 },
  { name: "Balões", icon: Triangle, count: 4, rotate: true },
  { name: "Nuvens", icon: Cloud, count: 4 },
  { name: "Docinhos", icon: Hexagon, count: 5 },
  { name: "Estrelas", icon: Star, count: 5 },
  { name: "Corações", icon: Heart, count: 6 },
  { name: "Presentes", icon: Square, count: 6 },
  { name: "Carinhas", icon: Smile, count: 8 },
];

export const Level1Click: React.FC<Props> = ({ settings, onComplete, onExit, isMission = false }) => {
  const [phaseIndex, setPhaseIndex] = useState(isMission ? Math.floor(Math.random() * PHASES.length) : 0);
  const [targets, setTargets] = useState<Target[]>([]);
  const [score, setScore] = useState(0);
  const [totalAttempts, setTotalAttempts] = useState(0);

  const startTime = useRef(Date.now());
  const suppressBackgroundFeedbackRef = useRef(false);
  const currentPhase = PHASES[phaseIndex];
  const isHighContrast = settings.highContrast;

  useEffect(() => {
    generateTargets();
    setScore(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phaseIndex]);

  const generateTargets = () => {
    const newTargets = [];
    const palette = settings.highContrast ? HIGH_CONTRAST_COLORS : COLORS;

    for (let i = 0; i < currentPhase.count; i++) {
      newTargets.push({
        id: i,
        x: 10 + Math.random() * 80,
        y: 15 + Math.random() * 70,
        color: palette[i % palette.length]
      });
    }
    setTargets(newTargets);
  };

  const handleBackgroundClick = (e: React.PointerEvent) => {
    if (suppressBackgroundFeedbackRef.current) {
      suppressBackgroundFeedbackRef.current = false;
      return;
    }

    if (e.target !== e.currentTarget) return;

    setTotalAttempts(p => p + 1);
    playSound('error');
  };

  const handleTargetClick = (e: React.PointerEvent, id: number) => {
    e.stopPropagation();
    suppressBackgroundFeedbackRef.current = true;
    playSound('pop');

    const newTargets = targets.filter(t => t.id !== id);
    setTargets(newTargets);
    setScore(s => s + 1);

    if (newTargets.length === 0) {
      playSound('success');
      if (isMission) {
        finishLevel();
      } else if (phaseIndex < PHASES.length - 1) {
        setTimeout(() => setPhaseIndex(p => p + 1), 800);
      } else {
        finishLevel();
      }
    }
  };

  const finishLevel = () => {
    const timeSeconds = Math.round((Date.now() - startTime.current) / 1000);
    setTimeout(() => {
      onComplete({
        attempts: totalAttempts,
        timeSeconds,
        completed: true,
        score: 100
      });
    }, 500);
  };

  const sizeClass = settings.targetSizeMultiplier > 1.2 ? 'w-32 h-32' : 'w-24 h-24';
  const Icon = currentPhase.icon;

  return (
    <div className={`relative w-full h-full overflow-hidden ${isHighContrast ? 'bg-slate-950' : 'bg-blue-50'}`} onPointerUp={handleBackgroundClick}>
      <div className={`absolute top-0 left-0 z-10 flex w-full items-center justify-between p-4 shadow-sm ${isHighContrast ? 'border-b border-yellow-300 bg-slate-900/95' : 'bg-white/80 backdrop-blur-sm'}`}>
        <div>
          <h2 className={`text-2xl font-bold ${isHighContrast ? 'text-white' : 'text-blue-900'}`}>
            {isMission ? 'Missão: Clique' : `Nível 1: ${currentPhase.name}`}
          </h2>
          {!isMission && <div className={`text-sm font-bold ${isHighContrast ? 'text-yellow-200' : 'text-blue-600'}`}>Fase {phaseIndex + 1}/{PHASES.length}</div>}
        </div>
        <div className={`text-xl font-bold ${isHighContrast ? 'text-yellow-300' : 'text-green-600'}`}>{score}/{currentPhase.count}</div>
        {!isMission && (
          <div className="flex gap-2">
            <FullscreenButton />
            <Button size="sm" variant="secondary" onClick={(e) => { e.stopPropagation(); onExit(); }}>Sair</Button>
          </div>
        )}
      </div>

      {targets.map(t => (
        <div
          key={t.id}
          className={`absolute flex items-center justify-center transition-all duration-500 ease-out cursor-pointer hover:scale-110 active:scale-95 animate-bounce ${sizeClass}`}
          style={{
            left: `${t.x}%`,
            top: `${t.y}%`,
            animationDuration: '3s',
            transform: currentPhase.rotate ? 'rotate(180deg)' : 'none'
          }}
          onPointerDown={(e) => handleTargetClick(e, t.id)}
        >
          <Icon
            className={`w-full h-full ${isHighContrast ? `${t.color} fill-current drop-shadow-[0_0_14px_rgba(255,255,255,0.7)]` : `${t.color} fill-current drop-shadow-lg`}`}
            strokeWidth={1.5}
          />
        </div>
      ))}
    </div>
  );
};