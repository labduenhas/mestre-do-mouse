import React, { useState, useEffect } from 'react';
import { GameState, UserProfile, LevelStats, AppSettings, InputMethod } from './types';
import { INITIAL_PROFILE, PHASES_INFO } from './constants';
import { loadProfile, saveProfile } from './services/storage';
import { Button } from './components/Button';
import { TeacherPanel } from './components/TeacherPanel';
import { Celebration } from './components/Celebration';
import { DevicePickerModal } from './components/DevicePickerModal';
import { Level1Click } from './levels/Level1Click';
import { Level2DoubleClick } from './levels/Level2DoubleClick';
import { Level3Drag } from './levels/Level3Drag';
import { Level4Maze } from './levels/Level4Maze';
import { Level5Mission } from './levels/Level5Mission';
import { Level6PixelArt } from './levels/Level6PixelArt';
import { Level7Bubbles } from './levels/Level7Bubbles';
import { Level8Puzzle } from './levels/Level8Puzzle';
import { Level9Circuit } from './levels/Level9Circuit';
import { Level10Mission } from './levels/Level10Mission';
import { Settings, Play, CheckCircle, Lock, ChevronLeft, ChevronRight, Trophy, Star } from 'lucide-react';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>({
    profile: INITIAL_PROFILE,
    view: 'map',
    activePhaseId: null,
    activeLevelId: null
  });

  const [showCelebration, setShowCelebration] = useState(false);
  const [modalKey, setModalKey] = useState(0);
  const [selectedPhaseIndex, setSelectedPhaseIndex] = useState(0);

  useEffect(() => {
    const loaded = loadProfile();
    setGameState(prev => ({ ...prev, profile: loaded }));
  }, []);

  const saveState = (newProfile: UserProfile) => {
    saveProfile(newProfile);
    setGameState(prev => ({ ...prev, profile: newProfile }));
  };

  const isPhaseUnlocked = (phaseId: number): boolean => {
    if (gameState.profile.settings.devMode) return true;
    if (phaseId === 1) return true;
    // Phase N is unlocked if the final level of Phase N-1 is completed
    const prevPhase = PHASES_INFO.find(p => p.id === phaseId - 1);
    if (!prevPhase) return false;
    const finalLevel = prevPhase.levels[prevPhase.levels.length - 1];
    const key = `${phaseId - 1}-${finalLevel.id}`;
    return !!gameState.profile.progress[key]?.completed;
  };

  const isLevelUnlocked = (phaseId: number, levelIndex: number): boolean => {
    if (gameState.profile.settings.devMode) return true;
    if (levelIndex === 0) return isPhaseUnlocked(phaseId);
    const phase = PHASES_INFO.find(p => p.id === phaseId);
    if (!phase) return false;
    const prevLevel = phase.levels[levelIndex - 1];
    const key = `${phaseId}-${prevLevel.id}`;
    return !!gameState.profile.progress[key]?.completed;
  };

  const handleLevelSelect = (phaseId: number, levelId: number) => {
    setGameState(prev => ({
      ...prev,
      activePhaseId: phaseId,
      activeLevelId: levelId,
      view: 'game'
    }));
  };

  const handleLevelComplete = (stats: LevelStats) => {
    if (!gameState.activePhaseId || !gameState.activeLevelId) return;

    const key = `${gameState.activePhaseId}-${gameState.activeLevelId}`;
    const updatedProfile = {
      ...gameState.profile,
      progress: {
        ...gameState.profile.progress,
        [key]: stats
      }
    };

    saveState(updatedProfile);
    setGameState(prev => ({ ...prev, view: 'map', activePhaseId: null, activeLevelId: null }));
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
    setModalKey(prev => prev + 1);
  };

  const handleDeviceSelect = (method: InputMethod) => {
    handleSettingsUpdate({
      ...gameState.profile.settings,
      inputMethodHint: method,
      stickyDrag: method === 'trackpad'
    });
  };

  // Teacher Panel View
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

  // Game View
  if (gameState.view === 'game' && gameState.activeLevelId) {
    const props = {
      settings: gameState.profile.settings,
      onComplete: handleLevelComplete,
      onExit: () => setGameState(prev => ({ ...prev, view: 'map', activePhaseId: null, activeLevelId: null }))
    };

    const renderLevel = () => {
      switch (gameState.activeLevelId) {
        case 1: return <Level1Click {...props} />;
        case 2: return <Level2DoubleClick {...props} />;
        case 3: return <Level3Drag {...props} />;
        case 4: return <Level4Maze {...props} />;
        case 5: return <Level5Mission {...props} />;
        case 6: return <Level6PixelArt {...props} />;
        case 7: return <Level7Bubbles {...props} />;
        case 8: return <Level8Puzzle {...props} />;
        case 9: return <Level9Circuit {...props} />;
        case 10: return <Level10Mission {...props} />;
        default: return <div>Nível não encontrado</div>;
      }
    };

    return (
      <div className="w-full h-screen overflow-hidden" style={{ touchAction: 'none' }} onContextMenu={(e) => e.preventDefault()}>
        {renderLevel()}
      </div>
    );
  }

  // Map View
  const currentPhase = PHASES_INFO[selectedPhaseIndex];
  const phaseUnlocked = isPhaseUnlocked(currentPhase.id);

  const phaseColors: Record<string, { bg: string; text: string; border: string; accent: string; light: string }> = {
    green: { bg: 'bg-green-50', text: 'text-green-800', border: 'border-green-200', accent: 'bg-green-500', light: 'bg-green-100' },
    purple: { bg: 'bg-purple-50', text: 'text-purple-800', border: 'border-purple-200', accent: 'bg-purple-500', light: 'bg-purple-100' },
  };

  const colors = phaseColors[currentPhase.color] || phaseColors.green;

  return (
    <div className={`min-h-[100dvh] ${colors.bg} flex flex-col`}>
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

      {/* Phase Selector */}
      <div className="flex items-center justify-center gap-4 py-4 px-4">
        <button
          className={`p-2 rounded-full transition-all ${selectedPhaseIndex > 0 ? 'bg-white shadow-md hover:shadow-lg hover:scale-110 active:scale-95' : 'opacity-30 cursor-not-allowed'}`}
          onClick={() => selectedPhaseIndex > 0 && setSelectedPhaseIndex(p => p - 1)}
          disabled={selectedPhaseIndex === 0}
        >
          <ChevronLeft size={28} className="text-gray-600" />
        </button>

        <div className="text-center">
          <h2 className={`text-2xl sm:text-4xl font-bold ${colors.text} drop-shadow-sm`}>{currentPhase.title}</h2>
          <p className={`text-sm sm:text-lg font-medium ${colors.text} opacity-70`}>{currentPhase.subtitle}</p>
        </div>

        <button
          className={`p-2 rounded-full transition-all ${selectedPhaseIndex < PHASES_INFO.length - 1 ? 'bg-white shadow-md hover:shadow-lg hover:scale-110 active:scale-95' : 'opacity-30 cursor-not-allowed'}`}
          onClick={() => selectedPhaseIndex < PHASES_INFO.length - 1 && setSelectedPhaseIndex(p => p + 1)}
          disabled={selectedPhaseIndex >= PHASES_INFO.length - 1}
        >
          <ChevronRight size={28} className="text-gray-600" />
        </button>
      </div>

      {/* Phase Dots */}
      <div className="flex justify-center gap-2 mb-2 sm:mb-4">
        {PHASES_INFO.map((phase, idx) => (
          <button
            key={phase.id}
            onClick={() => setSelectedPhaseIndex(idx)}
            className={`w-3 h-3 rounded-full transition-all ${idx === selectedPhaseIndex
              ? `${colors.accent} scale-125`
              : isPhaseUnlocked(phase.id)
                ? 'bg-gray-400 hover:bg-gray-500'
                : 'bg-gray-300'
              }`}
          />
        ))}
      </div>

      {/* Levels Grid */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 pb-8 flex flex-col items-center">
        {!phaseUnlocked ? (
          <div className="flex flex-col items-center justify-center flex-1 gap-4 text-center p-8">
            <Lock size={64} className="text-gray-400" />
            <h3 className="text-2xl font-bold text-gray-500">Fase Bloqueada</h3>
            <p className="text-gray-400 max-w-md">
              Complete o desafio final da fase anterior para desbloquear esta fase!
            </p>
            <Button variant="secondary" onClick={() => setSelectedPhaseIndex(selectedPhaseIndex - 1)}>
              <ChevronLeft className="w-4 h-4 mr-2" /> Voltar à fase anterior
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-6 w-full max-w-5xl px-2 sm:px-4 pb-6">
            {currentPhase.levels.map((level, idx) => {
              const progressKey = `${currentPhase.id}-${level.id}`;
              const isCompleted = !!gameState.profile.progress[progressKey]?.completed;
              const isLocked = !isLevelUnlocked(currentPhase.id, idx);
              const isFinal = !!level.isFinal;

              return (
                <div
                  key={level.id}
                  className={`
                    relative rounded-2xl sm:rounded-3xl p-3 sm:p-6 border-b-4 sm:border-b-8 shadow-xl cursor-pointer transform transition-all duration-300 flex flex-row items-center gap-3 sm:gap-6
                    ${isFinal
                      ? `md:col-span-2 bg-gradient-to-br from-amber-100 to-orange-50 border-orange-300 hover:border-orange-400`
                      : `bg-white ${colors.border} hover:border-opacity-80`
                    }
                    ${isLocked
                      ? 'opacity-60 grayscale cursor-not-allowed'
                      : 'hover:-translate-y-2 hover:shadow-2xl active:scale-95'
                    }
                  `}
                  onClick={() => !isLocked && handleLevelSelect(currentPhase.id, level.id)}
                >
                  {/* Icon Circle */}
                  <div className={`
                    w-12 h-12 sm:w-20 sm:h-20 rounded-full flex items-center justify-center text-xl sm:text-3xl font-bold shrink-0 shadow-inner transition-colors
                    ${isCompleted
                      ? 'bg-green-500 text-white'
                      : isLocked
                        ? 'bg-gray-200 text-gray-400'
                        : isFinal
                          ? 'bg-orange-500 text-white animate-pulse'
                          : `${colors.accent} text-white`
                    }
                  `}>
                    {isCompleted ? <CheckCircle className="w-5 h-5 sm:w-8 sm:h-8" /> : isLocked ? <Lock className="w-5 h-5 sm:w-7 sm:h-7" /> : isFinal ? <Trophy className="w-5 h-5 sm:w-7 sm:h-7" /> : idx + 1}
                  </div>

                  {/* Text Info */}
                  <div className="flex-1 text-left">
                    <h3 className={`font-bold text-base sm:text-2xl mb-0.5 sm:mb-2 ${isFinal ? 'text-orange-900' : 'text-gray-800'}`}>
                      {level.title}
                    </h3>
                    <p className={`font-medium text-xs sm:text-base ${isFinal ? 'text-orange-800/80' : 'text-gray-500'}`}>
                      {level.desc}
                    </p>
                  </div>

                  {/* Action Icon */}
                  <div className="hidden md:flex items-center justify-center">
                    {!isLocked && !isCompleted && (
                      <div className={`p-3 rounded-full ${isFinal ? 'bg-orange-200 text-orange-600' : `${colors.light} ${colors.text}`}`}>
                        <Play size={32} fill="currentColor" />
                      </div>
                    )}
                    {isCompleted && (
                      <div className="text-green-600 font-bold bg-green-100 px-3 py-1 rounded-full text-sm flex items-center gap-1">
                        <Star size={14} fill="currentColor" /> Concluído
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <DevicePickerModal key={modalKey} onSelect={handleDeviceSelect} />
      {showCelebration && <Celebration onClose={() => setShowCelebration(false)} />}
    </div>
  );
};

export default App;