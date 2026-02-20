import React, { useState } from 'react';
import { AppSettings, LevelStats } from '../types';
import { Level6PixelArt } from './Level6PixelArt';
import { Level7Bubbles } from './Level7Bubbles';
import { Level8Puzzle } from './Level8Puzzle';
import { Level9Circuit } from './Level9Circuit';

interface Props {
    settings: AppSettings;
    onComplete: (stats: LevelStats) => void;
    onExit: () => void;
}

export const Level10Mission: React.FC<Props> = ({ settings, onComplete, onExit }) => {
    const [stage, setStage] = useState(0);
    const [totalAttempts, setTotalAttempts] = useState(0);
    const [startTime] = useState(Date.now());

    // Sequence: PixelArt, Puzzle, Bubbles, Circuit
    const SEQUENCE = [0, 2, 1, 3];

    const handleSubLevelComplete = (stats: LevelStats) => {
        setTotalAttempts(p => p + stats.attempts);

        if (stage < SEQUENCE.length - 1) {
            setStage(p => p + 1);
        } else {
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
            case 0: return <Level6PixelArt key="l6" {...commonProps} />;
            case 1: return <Level7Bubbles key="l7" {...commonProps} />;
            case 2: return <Level8Puzzle key="l8" {...commonProps} />;
            case 3: return <Level9Circuit key="l9" {...commonProps} />;
            default: return null;
        }
    };

    return (
        <div className="w-full h-full">
            {renderStage()}

            {/* Mission Progress Indicator */}
            <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-white/90 px-4 py-2 rounded-full shadow-lg border border-purple-200 z-50 pointer-events-none">
                <div className="flex gap-2">
                    {SEQUENCE.map((_, idx) => (
                        <div
                            key={idx}
                            className={`w-3 h-3 rounded-full ${idx <= stage ? 'bg-purple-600' : 'bg-gray-300'}`}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};
