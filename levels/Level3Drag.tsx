import React, { useState, useEffect, useRef } from 'react';
import { AppSettings, LevelStats } from '../types';
import { Button } from '../components/Button';
import { playSound } from '../utils/sound';
import { Car, Gamepad2, Ticket, Bone, Key, PenTool, Plane, Ship } from 'lucide-react';

interface Props {
  settings: AppSettings;
  onComplete: (stats: LevelStats) => void;
  onExit: () => void;
  isMission?: boolean;
}

interface Toy {
  id: number;
  type: 'car' | 'gamepad' | 'ticket' | 'bone' | 'key' | 'pen' | 'plane' | 'ship';
  x: number;
  y: number;
  isPlaced: boolean;
  placedRotation?: number; // Visual flair for placed items
  placedOffset?: {x: number, y: number};
}

const TOY_TYPES = ['car', 'gamepad', 'ticket', 'bone', 'key', 'pen', 'plane', 'ship'] as const;

export const Level3Drag: React.FC<Props> = ({ settings, onComplete, onExit, isMission = false }) => {
  const [phase, setPhase] = useState(isMission ? 4 : 1);
  const [toys, setToys] = useState<Toy[]>([]);
  const [activeToyId, setActiveToyId] = useState<number | null>(null);
  const [isStickyHolding, setIsStickyHolding] = useState(false);
  const [attempts, setAttempts] = useState(0);
  
  const startTime = useRef(Date.now());
  const boxRef = useRef<HTMLDivElement>(null);
  const TOTAL_PHASES = 8;

  useEffect(() => {
    setupPhase();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const setupPhase = () => {
    const count = Math.min(1 + Math.ceil(phase / 2), 4);
    const newToys: Toy[] = [];
    
    for (let i = 0; i < count; i++) {
      const type = TOY_TYPES[(phase + i) % TOY_TYPES.length];
      newToys.push({
        id: i,
        type: type,
        x: 10 + Math.random() * 20 + (i * 15), 
        y: 60 + Math.random() * 20, 
        isPlaced: false,
        placedRotation: Math.random() * 30 - 15,
        placedOffset: { x: Math.random() * 20 - 10, y: Math.random() * 10 }
      });
    }
    setToys(newToys);
  };

  const updateToyPosition = (e: React.PointerEvent) => {
    if (activeToyId === null) return;
    const x = (e.clientX / window.innerWidth) * 100;
    const y = (e.clientY / window.innerHeight) * 100;
    setToys(prev => prev.map(t => t.id === activeToyId ? { ...t, x, y } : t));
  };

  const checkDrop = () => {
    if (activeToyId === null || !boxRef.current) return;

    const boxRect = boxRef.current.getBoundingClientRect();
    const boxCenterX = boxRect.left + boxRect.width / 2;
    const boxCenterY = boxRect.top + boxRect.height / 2;

    const toy = toys.find(t => t.id === activeToyId);
    if (!toy) return;

    const toyXPx = (toy.x / 100) * window.innerWidth;
    const toyYPx = (toy.y / 100) * window.innerHeight;
    const dist = Math.hypot(toyXPx - boxCenterX, toyYPx - boxCenterY);
    const threshold = boxRect.width / 2 + settings.snapDistance;

    if (dist < threshold) {
      playSound('pop');
      setToys(prev => prev.map(t => 
        t.id === activeToyId ? { ...t, isPlaced: true, x: 0, y: 0 } : t
      ));
    } else {
      playSound('error');
      setAttempts(p => p + 1);
    }
    
    setActiveToyId(null);
    setIsStickyHolding(false);
  };

  const handlePointerDown = (e: React.PointerEvent, id: number) => {
    e.stopPropagation();
    playSound('pop');
    if (settings.stickyDrag) {
       if (activeToyId === id && isStickyHolding) {
         checkDrop();
       } else if (activeToyId === null) {
         setActiveToyId(id);
         setIsStickyHolding(true);
         (e.target as HTMLElement).setPointerCapture(e.pointerId);
       }
    } else {
      setActiveToyId(id);
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!settings.stickyDrag && activeToyId !== null) {
      checkDrop();
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    }
  };

  useEffect(() => {
    if (toys.length > 0 && toys.every(t => t.isPlaced)) {
      playSound('success');
      if (isMission) {
        finishLevel();
      } else if (phase < TOTAL_PHASES) {
        setTimeout(() => setPhase(p => p + 1), 800);
      } else {
        finishLevel();
      }
    }
  }, [toys, phase, isMission]);

  const finishLevel = () => {
    const timeSeconds = Math.round((Date.now() - startTime.current) / 1000);
    setTimeout(() => {
        onComplete({ attempts, timeSeconds, completed: true, score: 100 });
    }, 500);
  };

  const getToyIcon = (type: string, size=48) => {
    switch(type) {
      case 'car': return <Car size={size} className="text-red-500" />;
      case 'gamepad': return <Gamepad2 size={size} className="text-purple-500" />;
      case 'ticket': return <Ticket size={size} className="text-yellow-500" />;
      case 'bone': return <Bone size={size} className="text-gray-500" />;
      case 'key': return <Key size={size} className="text-orange-500" />;
      case 'pen': return <PenTool size={size} className="text-blue-500" />;
      case 'plane': return <Plane size={size} className="text-sky-500" />;
      case 'ship': return <Ship size={size} className="text-indigo-500" />;
      default: return <Car size={size} />;
    }
  };

  return (
    <div 
      className="relative w-full h-full overflow-hidden touch-none"
      onPointerMove={(e) => activeToyId !== null && updateToyPosition(e)}
      onPointerUp={(e) => { if (settings.stickyDrag && isStickyHolding) checkDrop(); }}
    >
      {/* Cartoon Room Background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-2/3 bg-green-100" 
             style={{ backgroundImage: 'radial-gradient(circle, #dcfce7 10%, transparent 10%)', backgroundSize: '30px 30px' }}></div>
        <div className="absolute bottom-0 left-0 w-full h-1/3 bg-amber-100 border-t-8 border-green-200"></div>
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-3/4 h-24 bg-red-100 rounded-full opacity-50"></div>
      </div>

      <div className="absolute top-0 left-0 p-4 w-full flex justify-between items-center bg-white/80 z-20">
        <div>
           <h2 className="text-2xl font-bold text-green-900">
             {isMission ? 'Missão: Arrumar' : 'Nível 3: O Quartinho'}
           </h2>
           {!isMission && <div className="text-sm font-bold text-green-700">Fase {phase}/{TOTAL_PHASES}</div>}
        </div>
        {!isMission && <Button size="sm" variant="secondary" onClick={onExit}>Sair</Button>}
      </div>

      {/* Target Box - Cartoon Style */}
      <div 
        ref={boxRef}
        className="absolute left-3/4 top-1/2 w-64 h-56 transform -translate-y-1/2 -translate-x-12 z-0"
      >
        {/* Layer 1: Back of Box */}
        <div className="absolute bottom-0 w-full h-4/5 bg-amber-700 rounded-b-xl border-4 border-amber-900 z-0"></div>
        
        {/* Layer 2: Interior Shadow */}
        <div className="absolute bottom-2 left-2 right-2 h-4/5 bg-amber-900/50 rounded-b-lg z-0"></div>
        
        {/* Layer 3: Placed Toys (Inside the box) */}
        <div className="absolute bottom-4 left-4 right-4 h-40 z-10">
           {toys.filter(t => t.isPlaced).map((t) => (
             <div 
               key={t.id} 
               className="absolute transition-all duration-500 ease-out"
               style={{ 
                 bottom: `${10 + (t.placedOffset?.y || 0)}px`,
                 left: `${40 + (t.placedOffset?.x || 0)}px`,
                 transform: `rotate(${t.placedRotation}deg)`
               }}
             >
                {getToyIcon(t.type, 64)}
             </div>
           ))}
        </div>

        {/* Layer 4: Front of Box (Covers the bottom of the toys) */}
        <div className="absolute bottom-0 w-full h-1/2 bg-amber-600 rounded-b-xl border-x-4 border-b-4 border-amber-800 flex items-center justify-center z-20">
           <span className="font-bold text-amber-200 text-2xl tracking-widest uppercase opacity-70">Brinquedos</span>
        </div>
      </div>

      {/* Layer 5: Draggable Toys (Always on top) */}
      {toys.map(t => !t.isPlaced && (
        <div
          key={t.id}
          className={`absolute flex items-center justify-center p-4 bg-white rounded-full shadow-xl cursor-grab active:cursor-grabbing border-4 border-white z-30
             ${activeToyId === t.id ? 'scale-125 border-blue-400 shadow-2xl' : ''}
          `}
          style={{ 
            left: `${t.x}%`, 
            top: `${t.y}%`, 
            transform: 'translate(-50%, -50%)',
            transition: activeToyId === t.id ? 'none' : 'all 0.3s ease-out'
          }}
          onPointerDown={(e) => handlePointerDown(e, t.id)}
          onPointerUp={handlePointerUp}
        >
          {getToyIcon(t.type)}
          
          {settings.stickyDrag && activeToyId === t.id && (
             <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs px-2 py-1 rounded-full whitespace-nowrap animate-bounce shadow-md">
               Clique na caixa
             </div>
          )}
        </div>
      ))}
    </div>
  );
};