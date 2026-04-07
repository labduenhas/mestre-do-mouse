import React, { useState, useEffect, useRef } from 'react';
import { AppSettings, LevelStats } from '../types';
import { Button } from '../components/Button';
import { playSound } from '../utils/sound';
import { FullscreenButton } from '../components/FullscreenButton';

interface Props {
    settings: AppSettings;
    onComplete: (stats: LevelStats) => void;
    onExit: () => void;
    isMission?: boolean;
}

// Each pattern is a grid of booleans. true = should be filled
const PATTERNS: { name: string; grid: boolean[][]; gridSize: number; color: string }[] = [
    {
        name: 'Coração',
        gridSize: 5,
        color: 'bg-red-400',
        grid: [
            [false, true, false, true, false],
            [true, true, true, true, true],
            [true, true, true, true, true],
            [false, true, true, true, false],
            [false, false, true, false, false],
        ]
    },
    {
        name: 'Cruz',
        gridSize: 5,
        color: 'bg-blue-400',
        grid: [
            [false, false, true, false, false],
            [false, false, true, false, false],
            [true, true, true, true, true],
            [false, false, true, false, false],
            [false, false, true, false, false],
        ]
    },
    {
        name: 'Letra T',
        gridSize: 5,
        color: 'bg-green-400',
        grid: [
            [true, true, true, true, true],
            [false, false, true, false, false],
            [false, false, true, false, false],
            [false, false, true, false, false],
            [false, false, true, false, false],
        ]
    },
    {
        name: 'Escada',
        gridSize: 5,
        color: 'bg-yellow-400',
        grid: [
            [true, false, false, false, false],
            [true, true, false, false, false],
            [true, true, true, false, false],
            [true, true, true, true, false],
            [true, true, true, true, true],
        ]
    },
    {
        name: 'Moldura',
        gridSize: 6,
        color: 'bg-purple-400',
        grid: [
            [true, true, true, true, true, true],
            [true, false, false, false, false, true],
            [true, false, false, false, false, true],
            [true, false, false, false, false, true],
            [true, false, false, false, false, true],
            [true, true, true, true, true, true],
        ]
    },
    {
        name: 'Diamante',
        gridSize: 7,
        color: 'bg-cyan-400',
        grid: [
            [false, false, false, true, false, false, false],
            [false, false, true, true, true, false, false],
            [false, true, true, true, true, true, false],
            [true, true, true, true, true, true, true],
            [false, true, true, true, true, true, false],
            [false, false, true, true, true, false, false],
            [false, false, false, true, false, false, false],
        ]
    },
    {
        name: 'Seta',
        gridSize: 7,
        color: 'bg-orange-400',
        grid: [
            [false, false, false, true, false, false, false],
            [false, false, true, true, true, false, false],
            [false, true, true, true, true, true, false],
            [true, true, true, true, true, true, true],
            [false, false, false, true, false, false, false],
            [false, false, false, true, false, false, false],
            [false, false, false, true, false, false, false],
        ]
    },
    {
        name: 'Xadrez',
        gridSize: 6,
        color: 'bg-pink-400',
        grid: [
            [true, false, true, false, true, false],
            [false, true, false, true, false, true],
            [true, false, true, false, true, false],
            [false, true, false, true, false, true],
            [true, false, true, false, true, false],
            [false, true, false, true, false, true],
        ]
    }
];

export const Level6PixelArt: React.FC<Props> = ({ settings, onComplete, onExit, isMission = false }) => {
    const [phaseIndex, setPhaseIndex] = useState(isMission ? Math.floor(Math.random() * PATTERNS.length) : 0);
    const [filled, setFilled] = useState<boolean[][]>([]);
    const [totalAttempts, setTotalAttempts] = useState(0);
    const [correctCount, setCorrectCount] = useState(0);

    const startTime = useRef(Date.now());
    const currentPattern = PATTERNS[phaseIndex];
    const totalRequired = currentPattern.grid.flat().filter(Boolean).length;
    const highContrast = settings.highContrast;

    useEffect(() => {
        // Initialize empty grid
        const emptyGrid = currentPattern.grid.map(row => row.map(() => false));
        setFilled(emptyGrid);
        setCorrectCount(0);
    }, [phaseIndex]);

    const handleCellClick = (row: number, col: number) => {
        if (filled[row]?.[col]) return; // Already filled

        if (currentPattern.grid[row][col]) {
            // Correct cell
            playSound('pop');
            const newFilled = filled.map((r, ri) =>
                r.map((c, ci) => (ri === row && ci === col) ? true : c)
            );
            setFilled(newFilled);
            const newCount = correctCount + 1;
            setCorrectCount(newCount);

            if (newCount >= totalRequired) {
                playSound('success');
                if (isMission) {
                    finishLevel();
                } else if (phaseIndex < PATTERNS.length - 1) {
                    setTimeout(() => setPhaseIndex(p => p + 1), 800);
                } else {
                    finishLevel();
                }
            }
        } else {
            // Wrong cell
            playSound('error');
            setTotalAttempts(p => p + 1);
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

    const cellSize = currentPattern.gridSize <= 5 ? 'w-14 h-14 sm:w-16 sm:h-16' : 'w-10 h-10 sm:w-12 sm:h-12';

    return (
        <div className={`relative w-full h-full flex flex-col items-center overflow-hidden ${highContrast ? 'bg-slate-950' : 'bg-amber-50'}`}>
            <div className={`absolute top-0 left-0 z-10 flex w-full items-center justify-between p-4 shadow-sm ${highContrast ? 'border-b border-yellow-300 bg-slate-900/95' : 'bg-white/80 backdrop-blur-sm'}`}>
                <div>
                    <h2 className={`text-2xl font-bold ${highContrast ? 'text-white' : 'text-amber-900'}`}>
                        {isMission ? 'Missão: Pintura' : `Pintura Digital: ${currentPattern.name}`}
                    </h2>
                    {!isMission && <div className={`text-sm font-bold ${highContrast ? 'text-yellow-200' : 'text-amber-600'}`}>Fase {phaseIndex + 1}/{PATTERNS.length}</div>}
                </div>
                <div className={`text-xl font-bold ${highContrast ? 'text-yellow-300' : 'text-green-600'}`}>{correctCount}/{totalRequired}</div>
                {!isMission && (
                    <div className="flex gap-2">
                        <FullscreenButton />
                        <Button size="sm" variant="secondary" onClick={(e) => { e.stopPropagation(); onExit(); }}>Sair</Button>
                    </div>
                )}
            </div>

            <div className="flex-1 flex flex-col items-center justify-center gap-6 mt-16">
                {/* Reference Pattern (small) */}
                <div className="text-center">
                    <p className={`mb-2 text-sm font-bold ${highContrast ? 'text-yellow-200' : 'text-amber-700'}`}>Modelo:</p>
                    <div className={`inline-grid gap-0.5 rounded-lg p-2 ${highContrast ? 'border border-yellow-300 bg-slate-900' : ''}`} style={{ gridTemplateColumns: `repeat(${currentPattern.gridSize}, 1fr)` }}>
                        {currentPattern.grid.map((row, ri) =>
                            row.map((cell, ci) => (
                                <div
                                    key={`ref-${ri}-${ci}`}
                                    className={`w-4 h-4 sm:w-5 sm:h-5 rounded-sm border ${cell
                                        ? `${currentPattern.color} ${highContrast ? 'border-white shadow-[0_0_0_1px_rgba(255,255,255,0.75)]' : 'border-transparent'}`
                                        : highContrast ? 'bg-slate-700 border-slate-400' : 'bg-gray-200 border-transparent'
                                        }`}
                                />
                            ))
                        )}
                    </div>
                </div>

                {/* Interactive Grid */}
                <div className="inline-grid gap-1" style={{ gridTemplateColumns: `repeat(${currentPattern.gridSize}, 1fr)` }}>
                    {currentPattern.grid.map((row, ri) =>
                        row.map((cell, ci) => (
                            <div
                                key={`cell-${ri}-${ci}`}
                                className={`
                  ${cellSize} rounded-lg border-2 cursor-pointer transition-all duration-200
                  ${filled[ri]?.[ci]
                                        ? `${currentPattern.color} ${highContrast ? 'border-white scale-95 shadow-[0_0_0_2px_rgba(255,255,255,0.75)]' : 'border-transparent scale-95 shadow-inner'}`
                                        : highContrast
                                            ? 'bg-slate-900 border-slate-300 hover:border-yellow-300 hover:bg-slate-800 hover:scale-105 active:scale-90'
                                            : 'bg-white border-gray-300 hover:border-amber-400 hover:bg-amber-50 hover:scale-105 active:scale-90'
                                    }
                `}
                                onClick={() => handleCellClick(ri, ci)}
                                onMouseEnter={() => { if (!filled[ri]?.[ci]) playSound('pop'); }}
                            />
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};
