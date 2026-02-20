import React, { useState, useRef, useEffect } from 'react';
import { AppSettings, LevelStats } from '../types';
import { Button } from '../components/Button';
import { playSound } from '../utils/sound';
import { Ghost, Flag } from 'lucide-react';
import { FullscreenButton } from '../components/FullscreenButton';

interface Props {
  settings: AppSettings;
  onComplete: (stats: LevelStats) => void;
  onExit: () => void;
  isMission?: boolean;
}

// 8 Maze Layouts (Rectangles logic)
// Format: { x, y, w, h } in percentages
const MAZES = [
  // 1: Straight line
  [
    { x: 10, y: 40, w: 20, h: 20 }, // Start
    { x: 30, y: 45, w: 40, h: 10 }, // Path
    { x: 70, y: 40, w: 20, h: 20 }  // End
  ],
  // 2: L Shape
  [
    { x: 10, y: 10, w: 20, h: 20 }, // Start
    { x: 10, y: 30, w: 15, h: 50 }, // Down
    { x: 10, y: 70, w: 60, h: 15 }, // Right
    { x: 70, y: 70, w: 20, h: 20 }  // End
  ],
  // 3: U Shape
  [
    { x: 10, y: 10, w: 20, h: 20 }, // Start
    { x: 15, y: 30, w: 10, h: 50 }, // Down
    { x: 15, y: 80, w: 70, h: 10 }, // Right
    { x: 75, y: 30, w: 10, h: 50 }, // Up
    { x: 70, y: 10, w: 20, h: 20 }  // End
  ],
  // 4: Steps
  [
    { x: 5, y: 80, w: 15, h: 15 }, // Start
    { x: 5, y: 60, w: 15, h: 20 }, // Up
    { x: 20, y: 60, w: 20, h: 10 }, // Right
    { x: 40, y: 40, w: 10, h: 30 }, // Up
    { x: 40, y: 40, w: 30, h: 10 }, // Right
    { x: 70, y: 20, w: 10, h: 30 }, // Up
    { x: 70, y: 5, w: 20, h: 20 },  // End
  ],
  // 5: ZigZag (Horizontal)
  [
    { x: 5, y: 10, w: 15, h: 15 }, // Start
    { x: 20, y: 15, w: 15, h: 5 }, // R
    { x: 30, y: 20, w: 5, h: 20 }, // D
    { x: 35, y: 35, w: 15, h: 5 }, // R
    { x: 45, y: 15, w: 5, h: 20 }, // U
    { x: 50, y: 15, w: 15, h: 5 }, // R
    { x: 65, y: 10, w: 20, h: 20 } // End
  ],
  // 6: The "S"
  [
    { x: 10, y: 10, w: 20, h: 15 }, // Start
    { x: 30, y: 10, w: 40, h: 10 }, // R
    { x: 60, y: 20, w: 10, h: 30 }, // D
    { x: 30, y: 40, w: 30, h: 10 }, // L
    { x: 30, y: 50, w: 10, h: 30 }, // D
    { x: 40, y: 70, w: 40, h: 10 }, // R
    { x: 80, y: 70, w: 15, h: 15 }  // End
  ],
  // 7: Narrow Bridge
  [
    { x: 5, y: 40, w: 20, h: 20 }, // Start
    { x: 25, y: 45, w: 50, h: 6 }, // Narrow!
    { x: 75, y: 40, w: 20, h: 20 } // End
  ],
  // 8: Big Spiral
  [
    { x: 10, y: 10, w: 15, h: 15 }, // Start (Top Left)
    { x: 25, y: 10, w: 60, h: 10 }, // Right
    { x: 75, y: 20, w: 10, h: 60 }, // Down
    { x: 25, y: 70, w: 50, h: 10 }, // Left
    { x: 25, y: 30, w: 10, h: 40 }, // Up
    { x: 35, y: 30, w: 25, h: 10 }, // Right (Center-ish)
    { x: 50, y: 40, w: 15, h: 15 }  // End
  ]
];

export const Level4Maze: React.FC<Props> = ({ settings, onComplete, onExit, isMission = false }) => {
  const [phase, setPhase] = useState(isMission ? 4 : 0);
  const [attempts, setAttempts] = useState(0);
  const [playerPos, setPlayerPos] = useState({ x: 0, y: 0 });
  const [isHolding, setIsHolding] = useState(false);
  const [shake, setShake] = useState(false);

  const startTime = useRef(Date.now());
  const TOTAL_PHASES = 8;
  const currentPath = MAZES[phase];
  const startRect = currentPath[0];
  const endRect = currentPath[currentPath.length - 1];

  const isSafe = (xPct: number, yPct: number) => {
    return currentPath.some(r =>
      xPct >= r.x && xPct <= r.x + r.w &&
      yPct >= r.y && yPct <= r.y + r.h
    );
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const xPct = (e.clientX / window.innerWidth) * 100;
    const yPct = (e.clientY / window.innerHeight) * 100;

    setPlayerPos({ x: xPct, y: yPct });

    const inStart = xPct >= startRect.x && xPct <= startRect.x + startRect.w &&
      yPct >= startRect.y && yPct <= startRect.y + startRect.h;

    const inEnd = xPct >= endRect.x && xPct <= endRect.x + endRect.w &&
      yPct >= endRect.y && yPct <= endRect.y + endRect.h;

    if (!isHolding) {
      if (inStart) {
        setIsHolding(true); // Picked up!
        playSound('pop');
      }
      return;
    }

    if (!isSafe(xPct, yPct)) {
      // Failed!
      setIsHolding(false);
      setAttempts(p => p + 1);
      setShake(true);
      setTimeout(() => setShake(false), 300);
      playSound('error');
    } else if (inEnd) {
      // Won Phase
      setIsHolding(false);
      playSound('success');
      if (isMission) {
        finishLevel();
      } else if (phase < TOTAL_PHASES - 1) {
        setPhase(p => p + 1);
      } else {
        finishLevel();
      }
    }
  };

  const finishLevel = () => {
    const timeSeconds = Math.round((Date.now() - startTime.current) / 1000);
    onComplete({ attempts, timeSeconds, completed: true, score: 100 });
  };

  return (
    <div
      className={`relative w-full h-full bg-slate-800 overflow-hidden cursor-none touch-none ${shake ? 'animate-[shake_0.2s_ease-in-out_2]' : ''}`}
      onPointerMove={handlePointerMove}
    >
      <div className="absolute top-0 left-0 p-4 w-full flex justify-between items-center z-20 pointer-events-none">
        <div>
          <h2 className="text-2xl font-bold text-white drop-shadow-md">
            {isMission ? 'Missão: Labirinto' : `Nível 4: Labirinto Mágico`}
          </h2>
          {!isMission && <div className="text-white font-bold">Fase {phase + 1}/{TOTAL_PHASES}</div>}
        </div>
        <div className="pointer-events-auto">
          {!isMission && (
            <div className="flex gap-2">
              <FullscreenButton />
              <Button size="sm" variant="secondary" onClick={onExit}>Sair</Button>
            </div>
          )}
        </div>
      </div>

      {/* Unified maze path — single SVG shape, no internal seams */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ filter: 'drop-shadow(0 0 8px rgba(129, 140, 248, 0.5))' }}
      >
        <path
          d={currentPath.map(r => `M${r.x},${r.y} h${r.w} v${r.h} h${-r.w}Z`).join(' ')}
          fill="#6366f1"
          stroke="none"
          fillRule="nonzero"
        />
      </svg>

      {/* Start Zone Indicator */}
      <div
        className={`absolute flex items-center justify-center font-bold text-white/50 pointer-events-none transition-opacity ${isHolding ? 'opacity-20' : 'opacity-100 animate-pulse'}`}
        style={{ left: `${startRect.x}%`, top: `${startRect.y}%`, width: `${startRect.w}%`, height: `${startRect.h}%` }}
      >
        <div className="text-center">
          <div>INÍCIO</div>
          {!isHolding && <div className="text-xs text-yellow-300">Passe aqui</div>}
        </div>
      </div>

      {/* End Zone */}
      <div
        className="absolute flex items-center justify-center font-bold text-green-900 bg-green-400 border-4 border-green-500 animate-pulse pointer-events-none shadow-[0_0_20px_rgba(74,222,128,0.5)]"
        style={{ left: `${endRect.x}%`, top: `${endRect.y}%`, width: `${endRect.w}%`, height: `${endRect.h}%` }}
      >
        <Flag size={24} />
      </div>

      {/* Player Avatar */}
      <div
        className="absolute pointer-events-none transition-all duration-75 ease-linear z-50"
        style={{
          left: `${playerPos.x}%`,
          top: `${playerPos.y}%`,
          transform: 'translate(-50%, -50%)'
        }}
      >
        <div className={`relative ${isHolding ? 'scale-100' : 'scale-50 grayscale opacity-50'}`}>
          <Ghost size={48} className="text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.8)] fill-white/20" />
          {!isHolding && <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-32 bg-red-500 text-white text-xs p-1 rounded text-center">Volte ao início!</div>}
        </div>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-10px); }
          75% { transform: translateX(10px); }
        }
      `}</style>
    </div>
  );
};