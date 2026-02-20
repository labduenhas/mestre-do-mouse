import React, { useState, useEffect } from 'react';
import { GameState, UserProfile, LevelStats, AppSettings } from './types';
import { INITIAL_PROFILE, LEVEL_INFO } from './constants';
import { loadProfile, saveProfile } from './services/storage';
import { Button } from './components/Button';
import { TeacherPanel } from './components/TeacherPanel';
import { Celebration } from './components/Celebration';
import { Level1Click } from './levels/Level1Click';
import { Level2DoubleClick } from './levels/Level2DoubleClick';
import { Level3Drag } from './levels/Level3Drag';
import { Level4Maze } from './levels/Level4Maze';
import { Level5Mission } from './levels/Level5Mission';
import { Settings, Play, CheckCircle, Lock } from 'lucide-react';
import { DevicePickerModal } from './components/DevicePickerModal';
import { InputMethod } from './types';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>({
    profile: INITIAL_PROFILE,
    view: 'map', // Start directly on map
    activeLevelId: null
  });

  const [showCelebration, setShowCelebration] = useState(false);
  const [modalKey, setModalKey] = useState(0);

  useEffect(() => {
    const loaded = loadProfile();
    setGameState(prev => ({ ...prev, profile: loaded }));
  }, []);

  const saveState = (newProfile: UserProfile) => {
    saveProfile(newProfile);
    setGameState(prev => ({ ...prev, profile: newProfile }));
  };

  const handleLevelSelect = (id: number) => {
    if (id > 1) {
      const prevLevel = gameState.profile.progress[id - 1];
      if (!prevLevel || !prevLevel.completed) return;
    }
    setGameState(prev => ({ ...prev, activeLevelId: id, view: 'game' }));
  };

  const handleLevelComplete = (stats: LevelStats) => {
    if (!gameState.activeLevelId) return;

    const updatedProfile = {
      ...gameState.profile,
      progress: {
        ...gameState.profile.progress,
        [gameState.activeLevelId]: stats
      }
    };

    saveState(updatedProfile);
    setGameState(prev => ({ ...prev, view: 'map', activeLevelId: null }));
    setShowCelebration(true);
  };

  const handleSettingsUpdate = (newSettings: AppSettings) => {
    const updatedProfile = { ...gameState.profile, settings: newSettings };
    saveState(updatedProfile);
  };

  const handleResetProgress = () => {
    const updatedProfile = { ...gameState.profile, progress: {} };
    saveState(updatedProfile);
    localStorage.removeItem('deviceSelected');
    setModalKey(prev => prev + 1); // Force remount of the modal
  };

  const handleDeviceSelect = (method: InputMethod) => {
    handleSettingsUpdate({
      ...gameState.profile.settings,
      inputMethodHint: method,
      stickyDrag: method === 'trackpad'
    });
  };

  if (gameState.view === 'teacher') {
    return (
      <TeacherPanel
        profile={gameState.profile}
        onUpdateSettings={handleSettingsUpdate}
        onClose={() => setGameState(prev => ({ ...prev, view: 'map' }))}
        onResetProgress={handleResetProgress}
      />
    );
  }

  if (gameState.view === 'game' && gameState.activeLevelId) {
    const props = {
      settings: gameState.profile.settings,
      onComplete: handleLevelComplete,
      onExit: () => setGameState(prev => ({ ...prev, view: 'map', activeLevelId: null }))
    };

    const renderLevel = () => {
      switch (gameState.activeLevelId) {
        case 1: return <Level1Click {...props} />;
        case 2: return <Level2DoubleClick {...props} />;
        case 3: return <Level3Drag {...props} />;
        case 4: return <Level4Maze {...props} />;
        case 5: return <Level5Mission {...props} />;
        default: return <div>Nível não encontrado</div>;
      }
    };

    return (
      <div className="w-full h-screen" onContextMenu={(e) => e.preventDefault()}>
        {renderLevel()}
      </div>
    );
  }

  // Map View
  return (
    <div className="min-h-screen bg-green-50 flex flex-col">
      <header className="p-4 bg-white shadow-sm flex justify-between items-center z-10 sticky top-0">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🎓</span>
          <div className="font-bold text-gray-700 text-lg sm:text-xl">Mestre do Mouse</div>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="primary" onClick={() => setGameState(prev => ({ ...prev, view: 'teacher' }))}>
            <Settings className="w-4 h-4 mr-2" /> Prof.
          </Button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 md:p-8 flex flex-col items-center justify-center">
        <h2 className="text-4xl font-bold text-green-800 mb-8 drop-shadow-sm text-center">Mapa de Fases</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-5xl px-4">
          {LEVEL_INFO.map((level, idx) => {
            const isCompleted = !!gameState.profile.progress[level.id]?.completed;
            const isLocked = idx > 0 && !gameState.profile.progress[level.id - 1]?.completed;
            const isFinal = level.id === 5;

            return (
              <div
                key={level.id}
                className={`
                     relative rounded-3xl p-6 border-b-8 shadow-xl cursor-pointer transform transition-all duration-300 flex flex-col md:flex-row items-center gap-6
                     ${isFinal
                    ? 'md:col-span-2 bg-gradient-to-br from-amber-100 to-orange-50 border-orange-300 hover:border-orange-400'
                    : 'bg-white border-green-200 hover:border-green-300'
                  }
                     ${isLocked
                    ? 'opacity-60 grayscale cursor-not-allowed'
                    : 'hover:-translate-y-2 hover:shadow-2xl active:scale-95'
                  }
                   `}
                onClick={() => !isLocked && handleLevelSelect(level.id)}
              >
                {/* Icon Circle */}
                <div className={`
                       w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold shrink-0 shadow-inner transition-colors
                       ${isCompleted
                    ? 'bg-green-500 text-white'
                    : isLocked
                      ? 'bg-gray-200 text-gray-400'
                      : isFinal
                        ? 'bg-orange-500 text-white animate-pulse'
                        : 'bg-blue-500 text-white'
                  }
                    `}>
                  {isCompleted ? <CheckCircle size={32} /> : isLocked ? <Lock size={28} /> : level.id}
                </div>

                {/* Text Info */}
                <div className="flex-1 text-center md:text-left">
                  <h3 className={`font-bold text-2xl mb-2 ${isFinal ? 'text-orange-900' : 'text-gray-800'}`}>
                    {level.title}
                  </h3>
                  <p className={`font-medium text-base ${isFinal ? 'text-orange-800/80' : 'text-gray-500'}`}>
                    {level.desc}
                  </p>
                </div>

                {/* Action Icon (Play or Status) */}
                <div className="hidden md:flex items-center justify-center">
                  {!isLocked && !isCompleted && (
                    <div className={`p-3 rounded-full ${isFinal ? 'bg-orange-200 text-orange-600' : 'bg-blue-100 text-blue-600'}`}>
                      <Play size={32} fill="currentColor" />
                    </div>
                  )}
                  {isCompleted && (
                    <div className="text-green-600 font-bold bg-green-100 px-3 py-1 rounded-full text-sm">
                      Concluído
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <DevicePickerModal key={modalKey} onSelect={handleDeviceSelect} />
      {showCelebration && <Celebration onClose={() => setShowCelebration(false)} />}
    </div>
  );
};

export default App;