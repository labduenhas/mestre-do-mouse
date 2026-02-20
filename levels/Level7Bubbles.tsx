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

interface Bubble {
    id: number;
    x: number;
    y: number;
    size: number;
    color: string;
    speed: number;
    popped: boolean;
    driftX: number;
}

const BUBBLE_COLORS = [
    'from-pink-300 to-pink-500',
    'from-blue-300 to-blue-500',
    'from-green-300 to-green-500',
    'from-purple-300 to-purple-500',
    'from-yellow-300 to-yellow-500',
    'from-cyan-300 to-cyan-500',
];

const PHASE_CONFIG = [
    { count: 3, speed: 0.084, minSize: 121 },
    { count: 4, speed: 0.096, minSize: 113 },
    { count: 4, speed: 0.105, minSize: 104 },
    { count: 5, speed: 0.113, minSize: 95 },
    { count: 5, speed: 0.121, minSize: 86 },
    { count: 6, speed: 0.129, minSize: 83 },
    { count: 7, speed: 0.136, minSize: 78 },
    { count: 8, speed: 0.143, minSize: 72 },
];

export const Level7Bubbles: React.FC<Props> = ({ settings, onComplete, onExit, isMission = false }) => {
    const [phaseIndex, setPhaseIndex] = useState(isMission ? Math.floor(Math.random() * PHASE_CONFIG.length) : 0);
    const [bubbles, setBubbles] = useState<Bubble[]>([]);
    const [totalAttempts, setTotalAttempts] = useState(0);
    const [poppedCount, setPoppedCount] = useState(0);
    const [lastClickTime, setLastClickTime] = useState(0);
    const [popEffects, setPopEffects] = useState<{ id: number; x: number; y: number }[]>([]);

    const startTime = useRef(Date.now());
    const animationRef = useRef<number>(0);
    const bubblesRef = useRef<Bubble[]>([]);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const config = PHASE_CONFIG[phaseIndex];
    const DOUBLE_CLICK_TIME = settings.doubleClickSpeed;

    const generateBubbles = useCallback(() => {
        const newBubbles: Bubble[] = [];
        for (let i = 0; i < config.count; i++) {
            const size = config.minSize + Math.random() * 30;
            newBubbles.push({
                id: i,
                x: 10 + Math.random() * 75,
                y: 100 + Math.random() * 20, // Start below screen
                size,
                color: BUBBLE_COLORS[Math.floor(Math.random() * BUBBLE_COLORS.length)],
                speed: config.speed + Math.random() * 0.2,
                popped: false,
                driftX: (Math.random() - 0.5) * 0.3,
            });
        }
        setBubbles(newBubbles);
        bubblesRef.current = newBubbles;
        setPoppedCount(0);
    }, [config]);

    useEffect(() => {
        generateBubbles();
    }, [phaseIndex, generateBubbles]);

    // Animation loop
    useEffect(() => {
        const animate = () => {
            bubblesRef.current = bubblesRef.current.map(b => {
                if (b.popped) return b;
                let newY = b.y - b.speed;
                let newX = b.x + b.driftX;

                // Wrap around if goes off top
                if (newY < -15) {
                    newY = 105;
                    newX = 10 + Math.random() * 75;
                }
                // Bounce off sides
                if (newX < 2 || newX > 90) {
                    b.driftX = -b.driftX;
                    newX = Math.max(2, Math.min(90, newX));
                }

                return { ...b, y: newY, x: newX };
            });
            setBubbles([...bubblesRef.current]);
            animationRef.current = requestAnimationFrame(animate);
        };

        animationRef.current = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(animationRef.current);
    }, [phaseIndex]);

    const handleBubblePointerDown = (e: React.PointerEvent, id: number) => {
        e.preventDefault();
        e.stopPropagation();

        const bubble = bubblesRef.current.find(b => b.id === id);
        if (!bubble || bubble.popped) return;

        const now = Date.now();
        const timeDiff = now - lastClickTime;

        if (timeDiff < DOUBLE_CLICK_TIME) {
            // Double click! Pop it
            if (timerRef.current) clearTimeout(timerRef.current);
            popBubble(id, e.clientX, e.clientY);
        } else {
            playSound('pop');
            setLastClickTime(now);

            if (timerRef.current) clearTimeout(timerRef.current);
            timerRef.current = setTimeout(() => {
                setTotalAttempts(p => p + 1);
            }, DOUBLE_CLICK_TIME);
        }
    };

    const popBubble = (id: number, x: number, y: number) => {
        playSound('success');
        bubblesRef.current = bubblesRef.current.map(b =>
            b.id === id ? { ...b, popped: true } : b
        );
        setBubbles([...bubblesRef.current]);

        // Pop effect
        const effectId = Date.now();
        setPopEffects(prev => [...prev, { id: effectId, x, y }]);
        setTimeout(() => setPopEffects(prev => prev.filter(e => e.id !== effectId)), 600);

        const newPoppedCount = poppedCount + 1;
        setPoppedCount(newPoppedCount);

        if (newPoppedCount >= config.count) {
            if (isMission) {
                finishLevel();
            } else if (phaseIndex < PHASE_CONFIG.length - 1) {
                setTimeout(() => setPhaseIndex(p => p + 1), 800);
            } else {
                finishLevel();
            }
        }
    };

    const finishLevel = () => {
        cancelAnimationFrame(animationRef.current);
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

    return (
        <div className="relative w-full h-full bg-gradient-to-b from-sky-200 to-sky-400 overflow-hidden">
            <div className="absolute top-0 left-0 p-4 w-full flex justify-between items-center bg-white/80 backdrop-blur-sm shadow-sm z-10">
                <div>
                    <h2 className="text-2xl font-bold text-sky-900">
                        {isMission ? 'Missão: Bolhas' : 'Bolhas Mágicas'}
                    </h2>
                    {!isMission && <div className="text-sm text-sky-600 font-bold">Fase {phaseIndex + 1}/{PHASE_CONFIG.length}</div>}
                </div>
                <div className="text-xl font-bold text-green-600">{poppedCount}/{config.count}</div>
                {!isMission && (
                    <div className="flex gap-2">
                        <FullscreenButton />
                        <Button size="sm" variant="secondary" onClick={(e) => { e.stopPropagation(); onExit(); }}>Sair</Button>
                    </div>
                )}
            </div>

            {/* Instruction */}
            <div className="absolute top-20 left-0 right-0 text-center z-10 pointer-events-none">
                <p className="text-lg text-white font-bold drop-shadow-md">
                    {settings.inputMethodHint === 'trackpad'
                        ? 'Toque-toque rápido nas bolhas!'
                        : 'Duplo-clique para estourar!'}
                </p>
            </div>

            {/* Bubbles */}
            {bubbles.map(b => !b.popped && (
                <div
                    key={b.id}
                    className="absolute cursor-pointer transition-transform hover:scale-110 active:scale-90"
                    style={{
                        left: `${b.x}%`,
                        top: `${b.y}%`,
                        width: b.size * settings.targetSizeMultiplier,
                        height: b.size * settings.targetSizeMultiplier,
                        transform: 'translate(-50%, -50%)',
                    }}
                    onPointerDown={(e) => handleBubblePointerDown(e, b.id)}
                >
                    <div
                        className={`w-full h-full rounded-full bg-gradient-to-br ${b.color} shadow-lg border-2 border-white/50 relative overflow-hidden`}
                    >
                        {/* Shine effect */}
                        <div className="absolute top-2 left-2 w-1/3 h-1/3 bg-white/40 rounded-full blur-sm" />
                    </div>
                </div>
            ))}

            {/* Pop effects */}
            {popEffects.map(effect => (
                <div
                    key={effect.id}
                    className="fixed pointer-events-none z-50"
                    style={{ left: effect.x, top: effect.y, transform: 'translate(-50%, -50%)' }}
                >
                    <div className="text-4xl animate-ping">💥</div>
                </div>
            ))}
        </div>
    );
};
