import React, { useState } from 'react';
import { AppSettings, LevelStats } from '../types';
import { Level1Click } from './Level1Click';
import { Level2DoubleClick } from './Level2DoubleClick';
import { Level3Drag } from './Level3Drag';
import { Level4Maze } from './Level4Maze';

interface Props {
  settings: AppSettings;
  onComplete: (stats: LevelStats) => void;
  onExit: () => void;
}

export const Level5Mission: React.FC<Props> = ({ settings, onComplete, onExit }) => {
  const [stage, setStage] = useState(0);
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [startTime] = useState(Date.now());

  // Sequence of challenges (Indices: 0=Click, 1=Double, 2=Drag, 3=Maze)
  // We shuffle them or keep a fixed diverse order. Let's do fixed diverse for now.
  const SEQUENCE = [0, 2, 1, 3]; 

  const handleSubLevelComplete = (stats: LevelStats) => {
    setTotalAttempts(p => p + stats.attempts);
    
    if (stage < SEQUENCE.length - 1) {
      setStage(p => p + 1);
    } else {
      // All done
      const timeSeconds = Math.round((Date.now() - startTime) / 1000);
      onComplete({
        attempts: totalAttempts + stats.attempts,
        timeSeconds,
        completed: true,
        score: 100
      });
    }
  };

  const commonProps = {
    settings,
    onComplete: handleSubLevelComplete,
    onExit,
    isMission: true
  };

  const renderStage = () => {
    const gameType = SEQUENCE[stage];
    switch (gameType) {
      case 0: return <Level1Click key="l1" {...commonProps} />;
      case 1: return <Level2DoubleClick key="l2" {...commonProps} />;
      case 2: return <Level3Drag key="l3" {...commonProps} />;
      case 3: return <Level4Maze key="l4" {...commonProps} />;
      default: return null;
    }
  };

  return (
    <div className="w-full h-full">
      {/* Overlay to show progress between internal stage switches if needed, 
          but for seamless flow we just render the component */}
      {renderStage()}
      
      {/* Mission Progress Indicator */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-white/90 px-4 py-2 rounded-full shadow-lg border border-blue-200 z-50 pointer-events-none">
         <div className="flex gap-2">
            {SEQUENCE.map((_, idx) => (
              <div 
                key={idx}
                className={`w-3 h-3 rounded-full ${idx <= stage ? 'bg-blue-600' : 'bg-gray-300'}`}
              />
            ))}
         </div>
      </div>
    </div>
  );
};