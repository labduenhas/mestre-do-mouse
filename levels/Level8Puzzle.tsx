import React, { useState, useEffect, useRef, useCallback } from 'react';
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

interface PuzzlePiece {
    id: number;
    color: string;
    label: string;
    targetRow: number;
    targetCol: number;
    currentX: number;
    currentY: number;
    placed: boolean;
}

const PUZZLE_CONFIGS = [
    { rows: 2, cols: 2, name: 'Quadrado Simples' },
    { rows: 2, cols: 3, name: 'Retângulo' },
    { rows: 3, cols: 2, name: 'Retângulo Alto' },
    { rows: 3, cols: 3, name: 'Grade 3x3' },
    { rows: 2, cols: 4, name: 'Faixa Larga' },
    { rows: 4, cols: 2, name: 'Faixa Alta' },
    { rows: 3, cols: 4, name: 'Mosaico Grande' },
    { rows: 4, cols: 3, name: 'Mosaico Final' },
];

const PIECE_COLORS = [
    { bg: 'bg-red-400', label: '🍎' },
    { bg: 'bg-blue-400', label: '💎' },
    { bg: 'bg-green-400', label: '🌿' },
    { bg: 'bg-yellow-400', label: '⭐' },
    { bg: 'bg-purple-400', label: '🍇' },
    { bg: 'bg-pink-400', label: '🌸' },
    { bg: 'bg-orange-400', label: '🍊' },
    { bg: 'bg-cyan-400', label: '🧊' },
    { bg: 'bg-lime-400', label: '🥝' },
    { bg: 'bg-rose-400', label: '🌹' },
    { bg: 'bg-indigo-400', label: '🔮' },
    { bg: 'bg-teal-400', label: '🐢' },
];

const COLOR_HEX_MAP: Record<string, string> = {
    'bg-red-400': '#f87171',
    'bg-blue-400': '#60a5fa',
    'bg-green-400': '#4ade80',
    'bg-yellow-400': '#facc15',
    'bg-purple-400': '#c084fc',
    'bg-pink-400': '#f472b6',
    'bg-orange-400': '#fb923c',
    'bg-cyan-400': '#22d3ee',
    'bg-lime-400': '#a3e635',
    'bg-rose-400': '#fb7185',
    'bg-indigo-400': '#818cf8',
    'bg-teal-400': '#2dd4bf',
};

export const Level8Puzzle: React.FC<Props> = ({ settings, onComplete, onExit, isMission = false }) => {
    const [phaseIndex, setPhaseIndex] = useState(isMission ? Math.floor(Math.random() * PUZZLE_CONFIGS.length) : 0);
    const [pieces, setPieces] = useState<PuzzlePiece[]>([]);
    const [dragId, setDragId] = useState<number | null>(null);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const [totalAttempts, setTotalAttempts] = useState(0);
    const [placedCount, setPlacedCount] = useState(0);
    const [hoverSlot, setHoverSlot] = useState<string | null>(null);
    const [cellSize, setCellSize] = useState(90);

    const startTime = useRef(Date.now());
    const containerRef = useRef<HTMLDivElement>(null);

    const config = PUZZLE_CONFIGS[phaseIndex];
    const totalPieces = config.rows * config.cols;
    const SNAP_DIST = settings.snapDistance * 1.2;
    const highContrast = settings.highContrast;

    // Compute cell size responsively: grid should fill ~65% of available space
    const computeCellSize = useCallback(() => {
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        // Available area: 65% of viewport, minus header (70px) and footer (60px)
        const availW = vw * 0.65;
        const availH = (vh - 130) * 0.65;
        const maxCellW = Math.floor(availW / config.cols);
        const maxCellH = Math.floor(availH / config.rows);
        const size = Math.min(maxCellW, maxCellH, 160); // Cap at 160px
        setCellSize(Math.max(size, 50)); // Minimum 50px
    }, [config]);

    useEffect(() => {
        computeCellSize();
        window.addEventListener('resize', computeCellSize);
        return () => window.removeEventListener('resize', computeCellSize);
    }, [computeCellSize]);

    useEffect(() => {
        generatePuzzle();
        setPlacedCount(0);
        setHoverSlot(null);
    }, [phaseIndex, cellSize]);

    const generatePuzzle = () => {
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const newPieces: PuzzlePiece[] = [];
        let id = 0;
        for (let r = 0; r < config.rows; r++) {
            for (let c = 0; c < config.cols; c++) {
                const colorInfo = PIECE_COLORS[id % PIECE_COLORS.length];
                // Scatter pieces across the bottom 25% of the screen
                const scatterMinY = vh * 0.72;
                const scatterMaxY = vh * 0.88;
                newPieces.push({
                    id,
                    color: colorInfo.bg,
                    label: colorInfo.label,
                    targetRow: r,
                    targetCol: c,
                    currentX: 30 + Math.random() * (vw * 0.7),
                    currentY: scatterMinY + Math.random() * (scatterMaxY - scatterMinY),
                    placed: false,
                });
                id++;
            }
        }
        setPieces(newPieces.sort(() => Math.random() - 0.5));
    };

    const getGridOrigin = () => {
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const gridWidth = config.cols * cellSize;
        const gridHeight = config.rows * cellSize;
        // Center horizontally; vertically center in the area between header and piece zone
        const headerH = 70;
        const pieceZoneStart = vh * 0.70;
        const availableH = pieceZoneStart - headerH;
        const offsetX = (vw - gridWidth) / 2;
        const offsetY = headerH + (availableH - gridHeight) / 2;
        return { offsetX, offsetY };
    };

    const getTargetPosition = (row: number, col: number) => {
        const { offsetX, offsetY } = getGridOrigin();
        return {
            x: offsetX + col * cellSize,
            y: offsetY + row * cellSize,
        };
    };

    const findHoverSlot = (px: number, py: number): { row: number; col: number } | null => {
        for (let r = 0; r < config.rows; r++) {
            for (let c = 0; c < config.cols; c++) {
                const pos = getTargetPosition(r, c);
                const cx = pos.x + cellSize / 2;
                const cy = pos.y + cellSize / 2;
                const dist = Math.sqrt((px + cellSize / 2 - cx) ** 2 + (py + cellSize / 2 - cy) ** 2);
                if (dist < cellSize * 0.8) {
                    return { row: r, col: c };
                }
            }
        }
        return null;
    };

    const handlePointerDown = (e: React.PointerEvent, id: number) => {
        e.preventDefault();
        e.stopPropagation();
        const piece = pieces.find(p => p.id === id);
        if (!piece || piece.placed) return;

        if (settings.stickyDrag) {
            if (dragId === id) {
                checkDrop(id);
                setDragId(null);
                setHoverSlot(null);
                return;
            }
            setDragId(id);
            playSound('pop');
            return;
        }

        setDragId(id);
        setDragOffset({
            x: e.clientX - piece.currentX,
            y: e.clientY - piece.currentY,
        });
        playSound('pop');
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (dragId === null) return;
        e.preventDefault();

        const newX = e.clientX - (settings.stickyDrag ? cellSize / 2 : dragOffset.x);
        const newY = e.clientY - (settings.stickyDrag ? cellSize / 2 : dragOffset.y);

        const slot = findHoverSlot(newX, newY);
        setHoverSlot(slot ? `${slot.row}-${slot.col}` : null);

        setPieces(prev => prev.map(p =>
            p.id === dragId ? { ...p, currentX: newX, currentY: newY } : p
        ));
    };

    const handlePointerUp = () => {
        if (dragId === null) return;
        if (settings.stickyDrag) return;

        checkDrop(dragId);
        setDragId(null);
        setHoverSlot(null);
    };

    const checkDrop = (id: number) => {
        const piece = pieces.find(p => p.id === id);
        if (!piece) return;

        const target = getTargetPosition(piece.targetRow, piece.targetCol);
        const dx = Math.abs(piece.currentX - target.x);
        const dy = Math.abs(piece.currentY - target.y);

        if (dx < SNAP_DIST && dy < SNAP_DIST) {
            playSound('success');
            const updated = pieces.map(p =>
                p.id === id ? { ...p, currentX: target.x, currentY: target.y, placed: true } : p
            );
            setPieces(updated);
            const newPlaced = placedCount + 1;
            setPlacedCount(newPlaced);

            if (newPlaced >= totalPieces) {
                if (isMission) {
                    finishLevel();
                } else if (phaseIndex < PUZZLE_CONFIGS.length - 1) {
                    setTimeout(() => setPhaseIndex(p => p + 1), 800);
                } else {
                    finishLevel();
                }
            }
        } else {
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

    const getSlotGlow = (r: number, c: number): string => {
        if (dragId === null || !hoverSlot) return '';
        if (hoverSlot !== `${r}-${c}`) return '';

        const draggedPiece = pieces.find(p => p.id === dragId);
        if (!draggedPiece) return '';

        if (draggedPiece.targetRow === r && draggedPiece.targetCol === c) {
            return highContrast
                ? 'shadow-[0_0_25px_6px_rgba(250,204,21,0.8)] border-yellow-300 bg-slate-700/80'
                : 'shadow-[0_0_25px_6px_rgba(59,130,246,0.8)] border-blue-400 bg-blue-100/60';
        } else {
            return highContrast
                ? 'shadow-[0_0_25px_6px_rgba(248,113,113,0.75)] border-red-300 bg-slate-700/80'
                : 'shadow-[0_0_25px_6px_rgba(234,179,8,0.8)] border-yellow-400 bg-yellow-100/60';
        }
    };

    return (
        <div
            ref={containerRef}
            className={`relative w-full h-full overflow-hidden touch-none ${highContrast ? 'bg-slate-950' : 'bg-teal-50'}`}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
        >
            <div className={`absolute top-0 left-0 z-20 flex w-full items-center justify-between p-4 shadow-sm ${highContrast ? 'border-b border-yellow-300 bg-slate-900/95' : 'bg-white/80 backdrop-blur-sm'}`}>
                <div>
                    <h2 className={`text-2xl font-bold ${highContrast ? 'text-white' : 'text-teal-900'}`}>
                        {isMission ? 'Missão: Puzzle' : `Quebra-Cabeça: ${config.name}`}
                    </h2>
                    {!isMission && <div className={`text-sm font-bold ${highContrast ? 'text-yellow-200' : 'text-teal-600'}`}>Fase {phaseIndex + 1}/{PUZZLE_CONFIGS.length}</div>}
                </div>
                <div className={`text-xl font-bold ${highContrast ? 'text-yellow-300' : 'text-green-600'}`}>{placedCount}/{totalPieces}</div>
                {!isMission && (
                    <div className="flex gap-2">
                        <FullscreenButton />
                        <Button size="sm" variant="secondary" onClick={(e) => { e.stopPropagation(); onExit(); }}>Sair</Button>
                    </div>
                )}
            </div>

            {/* Target Grid */}
            {Array.from({ length: config.rows }).map((_, r) =>
                Array.from({ length: config.cols }).map((_, c) => {
                    const pos = getTargetPosition(r, c);
                    const glowClass = getSlotGlow(r, c);
                    const slotPiece = pieces.find(p => p.targetRow === r && p.targetCol === c);
                    const isPlaced = slotPiece?.placed;
                    const pieceHex = slotPiece ? COLOR_HEX_MAP[slotPiece.color] || '#99f6e4' : '#99f6e4';
                    return (
                        <div
                            key={`target-${r}-${c}`}
                            className={`absolute rounded-xl transition-all duration-200 flex items-center justify-center
                ${glowClass || (highContrast ? 'bg-slate-900/60' : 'bg-transparent')}
              `}
                            style={{
                                left: pos.x,
                                top: pos.y,
                                width: cellSize - 6,
                                height: cellSize - 6,
                                border: `2.5px solid ${highContrast ? '#f8fafc' : pieceHex}`,
                                borderStyle: 'solid',
                                opacity: isPlaced ? 0 : 1,
                            }}
                        >
                            {!isPlaced && slotPiece && (
                                <span style={{ fontSize: cellSize * 0.38, opacity: highContrast ? 0.34 : 0.18 }} className="select-none pointer-events-none">
                                    {slotPiece.label}
                                </span>
                            )}
                        </div>
                    );
                })
            )}

            {/* Draggable Pieces */}
            {pieces.map(piece => (
                <div
                    key={piece.id}
                    className={`
            absolute rounded-xl shadow-lg border-2 transition-shadow
            ${highContrast ? 'border-white/90 ring-1 ring-yellow-200/80' : 'border-white/60'}
            ${piece.placed
                            ? 'cursor-default'
                            : dragId === piece.id
                                ? 'cursor-grabbing z-50 shadow-2xl scale-110'
                                : 'cursor-grab hover:shadow-xl hover:scale-105 active:scale-95 z-10'
                        }
            ${piece.color}
          `}
                    style={{
                        left: piece.currentX,
                        top: piece.currentY,
                        width: cellSize - 6,
                        height: cellSize - 6,
                    }}
                    onPointerDown={(e) => handlePointerDown(e, piece.id)}
                >
                    <div className="w-full h-full flex items-center justify-center text-3xl select-none">
                        {piece.label}
                    </div>
                </div>
            ))}

            {/* Hint */}
            <div className="absolute bottom-4 left-0 right-0 text-center pointer-events-none">
                <p className={`inline-block rounded-full px-4 py-2 text-sm font-bold ${highContrast ? 'border border-yellow-300 bg-slate-900/95 text-white' : 'bg-white/70 text-teal-700'}`}>
                    {settings.stickyDrag
                        ? 'Clique para pegar, clique de novo para soltar'
                        : 'Arraste as peças para a posição correta'}
                </p>
            </div>
        </div>
    );
};
