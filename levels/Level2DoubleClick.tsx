import React, { useState, useEffect, useRef } from 'react';
import { AppSettings, LevelStats } from '../types';
import { Button } from '../components/Button';
import { playSound } from '../utils/sound';
import { Box, Lock, Sparkles } from 'lucide-react';
import { FullscreenButton } from '../components/FullscreenButton';

interface Props {
  settings: AppSettings;
  onComplete: (stats: LevelStats) => void;
  onExit: () => void;
  isMission?: boolean;
}

interface Chest {
  id: number;
  isOpen: boolean;
  color: string;
}

const CHEST_COLORS = [
  'text-yellow-700 fill-yellow-500',
  'text-red-800 fill-red-600',
  'text-blue-800 fill-blue-600',
  'text-green-800 fill-green-600',
  'text-purple-800 fill-purple-600',
];

export const Level2DoubleClick: React.FC<Props> = ({ settings, onComplete, onExit, isMission = false }) => {
  const [phase, setPhase] = useState(isMission ? 3 : 1);
  const [chests, setChests] = useState<Chest[]>([]);
  const [layoutStyle, setLayoutStyle] = useState(''); // Randomize flex logic

  const [attempts, setAttempts] = useState(0);
  const [clickCount, setClickCount] = useState(0);
  const [lastClickTime, setLastClickTime] = useState(0);
  const [shakeId, setShakeId] = useState<number | null>(null);

  const startTime = useRef(Date.now());
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const DOUBLE_CLICK_TIME = settings.doubleClickSpeed;
  const TOTAL_PHASES = 8;

  useEffect(() => {
    setupPhase();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const setupPhase = () => {
    // Randomize layout alignment
    const alignments = ['justify-center', 'justify-start', 'justify-end', 'justify-around', 'justify-between'];
    setLayoutStyle(alignments[phase % alignments.length]);

    const count = Math.ceil(phase / 2);
    const newChests: Chest[] = [];

    // Shuffle colors start index to ensure variety even with same count
    const colorStart = Math.floor(Math.random() * CHEST_COLORS.length);

    for (let i = 0; i < count; i++) {
      newChests.push({
        id: i,
        isOpen: false,
        color: CHEST_COLORS[(colorStart + i) % CHEST_COLORS.length]
      });
    }
    setChests(newChests);
  };

  const handlePointerDown = (e: React.PointerEvent, id: number) => {
    e.preventDefault();
    e.stopPropagation();

    const chest = chests.find(c => c.id === id);
    if (!chest || chest.isOpen) return;

    const now = Date.now();
    const timeDiff = now - lastClickTime;

    if (timeDiff < DOUBLE_CLICK_TIME) {
      if (timerRef.current) clearTimeout(timerRef.current);
      playSound('success');
      openChest(id);
      setClickCount(0);
    } else {
      playSound('pop');
      setLastClickTime(now);
      setClickCount(1);
      setShakeId(id);
      setTimeout(() => setShakeId(null), 300);

      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        setClickCount(0);
        setAttempts(p => p + 1);
      }, DOUBLE_CLICK_TIME);
    }
  };

  const openChest = (id: number) => {
    const updated = chests.map(c => c.id === id ? { ...c, isOpen: true } : c);
    setChests(updated);

    if (updated.every(c => c.isOpen)) {
      playSound('success');
      if (isMission) {
        finishLevel();
      } else if (phase < TOTAL_PHASES) {
        setTimeout(() => setPhase(p => p + 1), 1000);
      } else {
        finishLevel();
      }
    }
  };

  const finishLevel = () => {
    const timeSeconds = Math.round((Date.now() - startTime.current) / 1000);
    setTimeout(() => {
      onComplete({
        attempts,
        timeSeconds,
        completed: true,
        score: 100
      });
    }, 1000);
  };

  return (
    <div className="relative w-full h-full bg-indigo-50 flex flex-col items-center overflow-hidden">
      <div className="absolute top-0 left-0 p-4 w-full flex justify-between items-center bg-white/80 z-10">
        <div>
          <h2 className="text-2xl font-bold text-indigo-900">
            {isMission ? 'Missão: Duplo Clique' : 'Nível 2: O Tesouro'}
          </h2>
          {!isMission && <div className="text-sm font-bold text-indigo-600">Fase {phase}/{TOTAL_PHASES}</div>}
        </div>
        {!isMission && (
          <div className="flex gap-2">
            <FullscreenButton />
            <Button size="sm" variant="secondary" onClick={onExit}>Sair</Button>
          </div>
        )}
      </div>

      <div className="mt-24 mb-4 text-center px-4 w-full">
        <p className="text-xl text-indigo-800 font-bold">
          {settings.inputMethodHint === 'trackpad'
            ? 'Toque-toque rápido!'
            : 'Clique-clique rápido!'}
        </p>
      </div>

      {/* Flexible Grid Container that changes alignment */}
      <div className={`flex flex-wrap ${layoutStyle} items-center content-center gap-12 p-8 w-full max-w-5xl h-full pb-20`}>
        {chests.map(chest => (
          <div
            key={chest.id}
            className={`
              relative w-40 h-40 md:w-56 md:h-56 cursor-pointer transition-transform
              ${shakeId === chest.id ? 'animate-[wiggle_0.3s_ease-in-out]' : ''}
              ${chest.isOpen ? 'scale-110' : 'hover:scale-105 active:scale-95'}
            `}
            onPointerDown={(e) => handlePointerDown(e, chest.id)}
          >
            {chest.isOpen ? (
              <>
                <div className="absolute inset-0 flex items-center justify-center animate-bounce">
                  <Box size={180} className="text-yellow-600 fill-yellow-200 opacity-50" strokeWidth={1.5} />
                </div>
                <div className="absolute inset-0 flex items-center justify-center -mt-8 z-10">
                  <Sparkles size={100} className="text-yellow-400 fill-yellow-200 animate-spin-slow" />
                </div>
                <div className="absolute inset-0 flex items-center justify-center z-20">
                  <span className="text-5xl drop-shadow-md">💎</span>
                </div>
              </>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <Box size={180} className={chest.color} strokeWidth={1.5} />
                <div className="absolute mt-8">
                  <Lock size={40} className="text-black/30" />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <style>{`
        @keyframes wiggle {
          0%, 100% { transform: rotate(-3deg); }
          50% { transform: rotate(3deg); }
        }
        .animate-spin-slow {
          animation: spin 3s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};