import React, { useState, useRef } from 'react';
import { AppSettings, LevelStats } from '../types';
import { Button } from '../components/Button';
import { playSound } from '../utils/sound';
import { Bot, Flag } from 'lucide-react';
import { FullscreenButton } from '../components/FullscreenButton';

interface Props {
    settings: AppSettings;
    onComplete: (stats: LevelStats) => void;
    onExit: () => void;
    isMission?: boolean;
}

interface Rect {
    x: number; y: number; w: number; h: number;
}

// All circuits verified: each segment overlaps with the next for continuous navigation.
// Coordinates in % of viewport.
const CIRCUITS: Rect[][] = [
    // 1: Gentle horizontal (easy)
    [
        { x: 5, y: 40, w: 15, h: 15 },
        { x: 15, y: 43, w: 25, h: 8 },
        { x: 35, y: 38, w: 8, h: 15 },
        { x: 38, y: 36, w: 25, h: 8 },
        { x: 58, y: 38, w: 8, h: 12 },
        { x: 61, y: 44, w: 20, h: 8 },
        { x: 76, y: 38, w: 15, h: 15 },
    ],
    // 2: L-shape
    [
        { x: 10, y: 10, w: 15, h: 15 },
        { x: 12, y: 20, w: 10, h: 30 },
        { x: 12, y: 45, w: 10, h: 12 },
        { x: 15, y: 50, w: 30, h: 10 },
        { x: 40, y: 50, w: 25, h: 10 },
        { x: 60, y: 45, w: 15, h: 15 },
    ],
    // 3: S-curve
    [
        { x: 5, y: 15, w: 15, h: 15 },
        { x: 15, y: 18, w: 25, h: 8 },
        { x: 35, y: 20, w: 10, h: 25 },
        { x: 30, y: 40, w: 20, h: 8 },
        { x: 25, y: 42, w: 10, h: 25 },
        { x: 28, y: 62, w: 25, h: 8 },
        { x: 48, y: 60, w: 10, h: 12 },
        { x: 53, y: 65, w: 15, h: 15 },
    ],
    // 4: Steps down-right
    [
        { x: 5, y: 10, w: 14, h: 14 },
        { x: 5, y: 20, w: 10, h: 15 },
        { x: 8, y: 30, w: 20, h: 8 },
        { x: 23, y: 33, w: 10, h: 15 },
        { x: 28, y: 43, w: 20, h: 8 },
        { x: 43, y: 46, w: 10, h: 15 },
        { x: 48, y: 56, w: 20, h: 8 },
        { x: 63, y: 54, w: 14, h: 14 },
    ],
    // 5: U-turn
    [
        { x: 10, y: 15, w: 14, h: 14 },
        { x: 12, y: 25, w: 8, h: 35 },
        { x: 12, y: 55, w: 8, h: 12 },
        { x: 15, y: 62, w: 50, h: 8 },
        { x: 60, y: 55, w: 8, h: 12 },
        { x: 60, y: 30, w: 8, h: 30 },
        { x: 60, y: 20, w: 14, h: 14 },
    ],
    // 6: Zigzag
    [
        { x: 5, y: 20, w: 14, h: 14 },
        { x: 14, y: 23, w: 20, h: 7 },
        { x: 29, y: 25, w: 7, h: 20 },
        { x: 29, y: 40, w: 20, h: 7 },
        { x: 44, y: 35, w: 7, h: 15 },
        { x: 44, y: 30, w: 20, h: 7 },
        { x: 59, y: 32, w: 7, h: 20 },
        { x: 59, y: 47, w: 20, h: 7 },
        { x: 74, y: 42, w: 14, h: 14 },
    ],
    // 7: Narrow corridor
    [
        { x: 10, y: 40, w: 14, h: 14 },
        { x: 20, y: 43, w: 25, h: 6 },
        { x: 40, y: 30, w: 6, h: 20 },
        { x: 40, y: 28, w: 25, h: 6 },
        { x: 60, y: 28, w: 6, h: 25 },
        { x: 60, y: 48, w: 20, h: 6 },
        { x: 75, y: 43, w: 14, h: 14 },
    ],
    // 8: Spiral
    [
        { x: 5, y: 10, w: 14, h: 14 },
        { x: 14, y: 12, w: 55, h: 6 },
        { x: 64, y: 12, w: 6, h: 50 },
        { x: 20, y: 56, w: 50, h: 6 },
        { x: 20, y: 30, w: 6, h: 32 },
        { x: 20, y: 28, w: 28, h: 6 },
        { x: 42, y: 28, w: 6, h: 15 },
        { x: 38, y: 38, w: 14, h: 12 },
    ],
];

/**
 * Renders all rectangles as a SINGLE SVG path — no internal borders or seams.
 * The glow comes from a CSS drop-shadow on the outer silhouette only.
 */
const CircuitPath: React.FC<{ rects: Rect[]; highContrast?: boolean }> = ({ rects, highContrast = false }) => {
    const d = rects.map(r =>
        `M${r.x},${r.y} h${r.w} v${r.h} h${-r.w}Z`
    ).join(' ');

    return (
        <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ filter: highContrast ? 'drop-shadow(0 0 10px rgba(250, 204, 21, 0.8))' : 'drop-shadow(0 0 6px rgba(79, 70, 229, 0.45))' }}
        >
            <path
                d={d}
                fill={highContrast ? '#facc15' : '#4F46E5'}
                stroke="none"
                fillRule="nonzero"
            />
        </svg>
    );
};

export const Level9Circuit: React.FC<Props> = ({ settings, onComplete, onExit, isMission = false }) => {
    const [phase, setPhase] = useState(isMission ? 4 : 0);
    const [attempts, setAttempts] = useState(0);
    const [playerPos, setPlayerPos] = useState({ x: 0, y: 0 });
    const [isHolding, setIsHolding] = useState(false);
    const [shake, setShake] = useState(false);

    const startTime = useRef(Date.now());
    const TOTAL_PHASES = 8;
    const currentPath = CIRCUITS[phase];
    const startRect = currentPath[0];
    const endRect = currentPath[currentPath.length - 1];
    const highContrast = settings.highContrast;

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
                setIsHolding(true);
                playSound('pop');
            }
            return;
        }

        if (!isSafe(xPct, yPct)) {
            setIsHolding(false);
            setAttempts(p => p + 1);
            setShake(true);
            setTimeout(() => setShake(false), 300);
            playSound('error');
        } else if (inEnd) {
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
            className={`relative w-full h-full overflow-hidden cursor-none touch-none ${highContrast ? 'bg-slate-950' : 'bg-slate-100'} ${shake ? 'animate-[shake_0.2s_ease-in-out_2]' : ''}`}
            onPointerMove={handlePointerMove}
        >
            <div className="absolute top-0 left-0 z-20 flex w-full items-center justify-between p-4 pointer-events-none">
                <div className={`rounded-2xl px-3 py-2 ${highContrast ? 'border border-yellow-300 bg-slate-950/90' : 'bg-white/65 backdrop-blur-sm'}`}>
                    <h2 className={`text-2xl font-bold drop-shadow-md ${highContrast ? 'text-white' : 'text-indigo-800'}`}>
                        {isMission ? 'Missão: Circuito' : 'Circuito do Robô'}
                    </h2>
                    {!isMission && <div className={`font-bold ${highContrast ? 'text-yellow-200' : 'text-indigo-600'}`}>Fase {phase + 1}/{TOTAL_PHASES}</div>}
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

            {/* Unified Circuit Path (SVG-based, no overlapping borders) */}
            <CircuitPath rects={currentPath} highContrast={highContrast} />

            {/* Start Zone */}
            <div
                className={`absolute flex items-center justify-center font-bold pointer-events-none transition-opacity z-10 ${isHolding ? 'opacity-20' : 'opacity-100 animate-pulse'}`}
                style={{ left: `${startRect.x}%`, top: `${startRect.y}%`, width: `${startRect.w}%`, height: `${startRect.h}%` }}
            >
                <div className={`rounded-xl px-3 py-2 text-center ${highContrast ? 'border border-yellow-300 bg-slate-950/90 text-white' : 'text-white'}`}>
                    <div className="text-sm">INÍCIO</div>
                    {!isHolding && <div className={`text-xs ${highContrast ? 'text-yellow-200' : 'text-emerald-200'}`}>Passe aqui</div>}
                </div>
            </div>

            {/* End Zone */}
            <div
                className={`absolute flex items-center justify-center font-bold animate-pulse pointer-events-none z-10 ${highContrast ? 'border-2 border-white bg-yellow-300 text-slate-950 shadow-[0_0_18px_rgba(250,204,21,0.75)]' : 'text-amber-900 bg-amber-400 border-2 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.6)]'}`}
                style={{ left: `${endRect.x}%`, top: `${endRect.y}%`, width: `${endRect.w}%`, height: `${endRect.h}%` }}
            >
                <Flag size={20} />
            </div>

            {/* Player Robot */}
            <div
                className="absolute pointer-events-none transition-all duration-75 ease-linear z-50"
                style={{
                    left: `${playerPos.x}%`,
                    top: `${playerPos.y}%`,
                    transform: 'translate(-50%, -50%)'
                }}
            >
                <div className={`relative ${isHolding ? 'scale-100' : 'scale-50 grayscale opacity-50'}`}>
                    <Bot size={40} className={highContrast ? 'text-slate-950 drop-shadow-[0_0_12px_rgba(255,255,255,0.8)]' : 'text-orange-500 drop-shadow-[0_0_10px_rgba(249,115,22,0.8)]'} />
                    {!isHolding && <div className={`absolute -top-6 left-1/2 -translate-x-1/2 w-32 text-xs p-1 rounded text-center ${highContrast ? 'bg-slate-950 text-yellow-200 border border-yellow-300' : 'bg-red-500 text-white'}`}>Volte ao início!</div>}
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
