import React, { useEffect, useRef, useState } from 'react';
import { GameState, UserProfile, LevelStats, AppSettings, InputMethod, NarratorKey } from './types';
import { INITIAL_PROFILE, PHASES_INFO } from './constants';
import { loadProfile, saveProfile } from './services/storage';
import { Button } from './components/Button';
import { TeacherPanel } from './components/TeacherPanel';
import { Celebration } from './components/Celebration';
import { DevicePickerModal } from './components/DevicePickerModal';
import { AccessibilityMenu } from './components/AccessibilityMenu';
import { PedagogicalInfoModal } from './components/PedagogicalInfoModal';
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

const LEVEL_NARRATIONS: Record<number, string> = {
  1: 'Olá! Vamos brincar com as formas. Clique ou toque nas bolinhas coloridas até limpar a tela. Se errar, tudo bem. Tente de novo com calma.',
  2: 'Agora é hora do tesouro. Faça dois cliques rápidos no mesmo baú para abrir. Procure fazer clique, clique bem rapidinho.',
  3: 'Vamos organizar os objetos. Arraste cada item para o lugar certo, com calma e atenção.',
  4: 'Este é o labirinto mágico. Comece na área de início e siga pelo caminho até a bandeira, sem sair da trilha.',
  5: 'Chegou a super missão. Use tudo o que você já aprendeu: clicar, clicar duas vezes e arrastar.',
  6: 'Vamos pintar o desenho. Observe o modelo e clique nas células certas para copiar a figura.',
  7: 'Hora das bolhas. Use dois cliques rápidos em cada bolha para estourar e continuar.',
  8: 'Monte o quebra-cabeça arrastando cada peça até o espaço correto.',
  9: 'Guie o robô pelo circuito. Siga o caminho com atenção até chegar ao final.',
  10: 'Esta é a missão final. Respire fundo, siga as pistas da tela e complete cada desafio no seu tempo.',
};

type VisualFeedback = 'success' | 'error' | 'win';
type SpeechStatusKind = 'idle' | 'starting' | 'playing' | 'success' | 'warning' | 'error';

type NarratorOption = {
  key: NarratorKey;
  label: string;
  icon: string;
  description: string;
  sample: string;
  rate: number;
  pitch: number;
  preferredTerms: string[];
  avoidTerms: string[];
};

const NARRATOR_OPTIONS: NarratorOption[] = [
  {
    key: 'robozinha',
    label: 'Robozinho',
    icon: '🤖',
    description: 'A voz atual, mais sintética e marcadinha.',
    sample: 'Oi! Eu sou o Robozinho. Falo do jeitinho original, com voz mais de robô.',
    rate: 0.88,
    pitch: 1,
    preferredTerms: ['espeak', 'robot', 'default', 'male', 'klatt'],
    avoidTerms: ['whisper'],
  },
  {
    key: 'clara',
    label: 'Clara',
    icon: '✨',
    description: 'Busca uma voz mais polida e fácil de entender.',
    sample: 'Olá! Eu sou a Clara. Tento falar de um jeito mais nítido e fácil de entender.',
    rate: 0.92,
    pitch: 1.05,
    preferredTerms: ['google', 'microsoft', 'natural', 'luciana', 'maria', 'female', 'brazil'],
    avoidTerms: ['espeak', 'robot', 'croak', 'whisper'],
  },
  {
    key: 'suavinha',
    label: 'Suavinha',
    icon: '🌷',
    description: 'Mais calma e pausada para uma escuta confortável.',
    sample: 'Oi! Eu sou a Suavinha. Falo mais devagar para ficar mais confortável de acompanhar.',
    rate: 0.8,
    pitch: 0.96,
    preferredTerms: ['female', 'maria', 'ana', 'portuguese', 'brazil', 'natural'],
    avoidTerms: ['espeak', 'robot', 'croak'],
  },
];

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
  const [highContrast, setHighContrast] = useState(INITIAL_PROFILE.settings.highContrast);
  const [simpleFont, setSimpleFont] = useState(INITIAL_PROFILE.settings.simpleFont);
  const [reduceAnimations, setReduceAnimations] = useState(INITIAL_PROFILE.settings.reduceAnimations);
  const [speechEnabled, setSpeechEnabled] = useState(INITIAL_PROFILE.settings.speechEnabled);
  const [selectedNarrator, setSelectedNarrator] = useState<NarratorKey>(INITIAL_PROFILE.settings.narratorKey);
  const [visualFeedback, setVisualFeedback] = useState<{ type: VisualFeedback; message: string } | null>(null);
  const [screenReaderAnnouncement, setScreenReaderAnnouncement] = useState('');
  const [speechStatus, setSpeechStatus] = useState<{ kind: SpeechStatusKind; message: string }>({
    kind: 'idle',
    message: 'Narração desativada.',
  });
  const feedbackTimeoutRef = useRef<number | null>(null);
  const speechTimeoutRef = useRef<number | null>(null);
  const speechStatusTimeoutRef = useRef<number | null>(null);
  const speechUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const voiceChangeHandlerRef = useRef<(() => void) | null>(null);
  const lastSpokenTextRef = useRef('');
  const lastSpeechTimeRef = useRef(0);

  useEffect(() => {
    const loaded = loadProfile();
    setGameState(prev => ({ ...prev, profile: loaded }));
    setHighContrast(!!loaded.settings.highContrast);
    setSimpleFont(!!loaded.settings.simpleFont);
    setReduceAnimations(!!loaded.settings.reduceAnimations);
    setSpeechEnabled(!!loaded.settings.speechEnabled);
    setSelectedNarrator((loaded.settings.narratorKey as NarratorKey) || 'robozinha');
  }, []);

  useEffect(() => {
    const handleFeedback = (event: Event) => {
      const detail = (event as CustomEvent<{ type?: 'pop' | 'success' | 'error' | 'win' }>).detail;

      if (!detail?.type || detail.type === 'pop') return;

      const feedbackMap: Record<VisualFeedback, string> = {
        success: '✅ Acerto! Continue assim.',
        error: '⚠️ Tente novamente.',
        win: '🏆 Missão concluída!'
      };

      const type: VisualFeedback = detail.type === 'win' ? 'win' : detail.type;
      setVisualFeedback({ type, message: feedbackMap[type] });

      if (feedbackTimeoutRef.current) {
        window.clearTimeout(feedbackTimeoutRef.current);
      }

      feedbackTimeoutRef.current = window.setTimeout(() => setVisualFeedback(null), 1200);
    };

    window.addEventListener('game-audio-feedback', handleFeedback as EventListener);

    return () => {
      window.removeEventListener('game-audio-feedback', handleFeedback as EventListener);
      if (feedbackTimeoutRef.current) {
        window.clearTimeout(feedbackTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return;
    }

    const synth = window.speechSynthesis;
    const warmUp = () => {
      synth.getVoices();
    };

    warmUp();
    window.addEventListener('pointerdown', warmUp, { once: true });

    return () => {
      window.removeEventListener('pointerdown', warmUp);
    };
  }, []);

  const normalizeVoiceLabel = (value: string) => value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  const getNarratorOption = (narratorKey: NarratorKey) => {
    return NARRATOR_OPTIONS.find((option) => option.key === narratorKey) ?? NARRATOR_OPTIONS[0];
  };

  const pickVoiceForNarrator = (voices: SpeechSynthesisVoice[], narratorKey: NarratorKey, attempt = 0) => {
    if (!voices.length) return undefined;

    const ptBrVoices = voices.filter((voice) => /^pt-br/i.test(voice.lang));
    if (!ptBrVoices.length) {
      return undefined;
    }

    const narrator = getNarratorOption(narratorKey);
    const candidates = ptBrVoices
      .map((voice) => {
        const normalized = normalizeVoiceLabel(`${voice.name} ${voice.lang}`);
        let score = 12;

        if (voice.localService) score += 1;
        if (voice.default) score += 2;

        narrator.preferredTerms.forEach((term) => {
          if (normalized.includes(term)) score += 4;
        });

        narrator.avoidTerms.forEach((term) => {
          if (normalized.includes(term)) score -= 6;
        });

        if (narrator.key === 'robozinha' && /(espeak|robot|synt|mbrola|klatt)/.test(normalized)) {
          score += 8;
        }

        if (narrator.key !== 'robozinha' && /(espeak|robot|croak|whisper|klatt)/.test(normalized)) {
          score -= 7;
        }

        if (attempt > 0 && /(espeak|robot|croak|whisper|klatt)/.test(normalized)) {
          score -= 4;
        }

        return { voice, score };
      })
      .sort((a, b) => b.score - a.score);

    return candidates[0]?.voice;
  };

  const getSpeechErrorMessage = (error?: string, voicesCount = 0) => {
    switch (error) {
      case 'not-allowed':
        return 'O navegador bloqueou a fala até receber um clique. Toque em “Testar narração” novamente.';
      case 'audio-busy':
      case 'interrupted':
      case 'canceled':
        return 'A fala foi interrompida por outro áudio ou ação da aba. Tente novamente com esta guia em primeiro plano.';
      case 'voice-unavailable':
        return voicesCount > 0
          ? 'Não encontrei uma voz disponível em português do Brasil (pt-BR) para esta narradora.'
          : 'Nenhuma voz do navegador foi carregada ainda. Aguarde alguns segundos e teste novamente.';
      case 'synthesis-failed':
        return voicesCount > 0
          ? 'A voz pt-BR do navegador falhou ao iniciar. Tente outra narradora ou teste novamente.'
          : 'O navegador ainda não carregou uma voz brasileira disponível. Aguarde um instante e toque em “Testar narração” novamente.';
      default:
        return `O navegador não conseguiu reproduzir a fala (${error || 'erro desconhecido'}).`;
    }
  };

  const speakMessage = (message: string, options?: { force?: boolean; narratorKey?: NarratorKey; skipRecentCheck?: boolean }) => {
    const text = message.trim();
    if (!text) return;

    const narrator = getNarratorOption(options?.narratorKey ?? selectedNarrator);
    setScreenReaderAnnouncement(text);

    if (!speechEnabled && !options?.force) {
      setSpeechStatus({ kind: 'warning', message: 'Ative a narração para ouvir as instruções.' });
      return;
    }

    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setSpeechStatus({ kind: 'error', message: 'Este navegador não oferece suporte à narração por voz.' });
      return;
    }

    const synth = window.speechSynthesis;
    const clearVoiceChangeListener = () => {
      if (voiceChangeHandlerRef.current) {
        synth.removeEventListener('voiceschanged', voiceChangeHandlerRef.current);
        voiceChangeHandlerRef.current = null;
      }
    };

    if (speechTimeoutRef.current) {
      window.clearTimeout(speechTimeoutRef.current);
    }
    if (speechStatusTimeoutRef.current) {
      window.clearTimeout(speechStatusTimeoutRef.current);
    }

    clearVoiceChangeListener();
    setSpeechStatus({ kind: 'starting', message: `Preparando a voz ${narrator.label}...` });

    const speakNow = (attempt = 0) => {
      const recentlySpokenSameText = attempt === 0
        && !options?.skipRecentCheck
        && lastSpokenTextRef.current === text
        && Date.now() - lastSpeechTimeRef.current < 1500;

      if (recentlySpokenSameText) {
        return;
      }

      lastSpokenTextRef.current = text;
      lastSpeechTimeRef.current = Date.now();
      clearVoiceChangeListener();

      if (synth.speaking || synth.pending) {
        synth.cancel();
      }

      const utterance = new SpeechSynthesisUtterance(text);
      speechUtteranceRef.current = utterance;

      const voices = synth.getVoices();
      const preferredVoice = pickVoiceForNarrator(voices, narrator.key, attempt);

      if (!preferredVoice) {
        speechUtteranceRef.current = null;
        setSpeechStatus({ kind: 'error', message: 'Nenhuma voz em português do Brasil (pt-BR) foi encontrada no navegador.' });
        return;
      }

      utterance.voice = preferredVoice;
      utterance.lang = preferredVoice.lang || 'pt-BR';

      utterance.rate = narrator.rate;
      utterance.pitch = narrator.pitch;
      utterance.volume = 1;
      utterance.onstart = () => setSpeechStatus({ kind: 'playing', message: `${narrator.icon} ${narrator.label} começou a narração.` });
      utterance.onend = () => {
        speechUtteranceRef.current = null;
        setSpeechStatus({ kind: 'success', message: `${narrator.icon} ${narrator.label} terminou a leitura.` });
      };
      utterance.onerror = (event) => {
        const error = event.error || 'erro desconhecido';
        setScreenReaderAnnouncement(`Áudio indisponível no momento. Instrução: ${text}`);

        if (attempt === 0 && ['synthesis-failed', 'voice-unavailable', 'audio-busy'].includes(error)) {
          setSpeechStatus({ kind: 'warning', message: `${narrator.label} falhou na primeira tentativa. Tentando novamente...` });
          speechTimeoutRef.current = window.setTimeout(() => speakNow(1), 400);
          return;
        }

        speechUtteranceRef.current = null;
        setSpeechStatus({ kind: 'error', message: getSpeechErrorMessage(error, synth.getVoices().length) });
      };

      window.setTimeout(() => {
        synth.resume();
        synth.speak(utterance);
      }, attempt === 0 ? 80 : 160);

      speechStatusTimeoutRef.current = window.setTimeout(() => {
        if (!synth.speaking && !synth.pending) {
          setSpeechStatus({ kind: 'warning', message: 'A fala não começou. Deixe a aba ativa e teste novamente.' });
        }
      }, 1800);
    };

    const waitForVoices = (remainingChecks = 8) => {
      const voices = synth.getVoices();
      if (voices.length > 0 || remainingChecks <= 0) {
        speakNow();
        return;
      }

      setSpeechStatus({ kind: 'warning', message: 'Carregando as vozes do navegador...' });
      speechTimeoutRef.current = window.setTimeout(() => waitForVoices(remainingChecks - 1), 250);
    };

    if (synth.getVoices().length > 0) {
      speakNow();
      return;
    }

    const handleVoicesChanged = () => {
      clearVoiceChangeListener();
      speakNow();
    };

    voiceChangeHandlerRef.current = handleVoicesChanged;
    synth.addEventListener('voiceschanged', handleVoicesChanged);
    waitForVoices();
  };

  useEffect(() => {
    if (!speechEnabled || gameState.view !== 'game' || !gameState.activeLevelId) {
      return;
    }

    speakMessage(LEVEL_NARRATIONS[gameState.activeLevelId] ?? 'Siga as instruções da atividade na tela.', { force: true });
  }, [speechEnabled, gameState.view, gameState.activeLevelId]);

  useEffect(() => {
    return () => {
      if (speechTimeoutRef.current) {
        window.clearTimeout(speechTimeoutRef.current);
      }
      if (speechStatusTimeoutRef.current) {
        window.clearTimeout(speechStatusTimeoutRef.current);
      }

      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        if (voiceChangeHandlerRef.current) {
          window.speechSynthesis.removeEventListener('voiceschanged', voiceChangeHandlerRef.current);
        }
        speechUtteranceRef.current = null;
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const saveState = (newProfile: UserProfile) => {
    saveProfile(newProfile);
    setGameState(prev => ({ ...prev, profile: newProfile }));
  };

  const handleSettingsUpdate = (newSettings: AppSettings) => {
    const updatedProfile = { ...gameState.profile, settings: newSettings };
    saveState(updatedProfile);
    setHighContrast(!!newSettings.highContrast);
    setSimpleFont(!!newSettings.simpleFont);
    setReduceAnimations(!!newSettings.reduceAnimations);
    setSpeechEnabled(!!newSettings.speechEnabled);
    setSelectedNarrator((newSettings.narratorKey as NarratorKey) || 'robozinha');
  };

  const effectiveSettings: AppSettings = {
    ...gameState.profile.settings,
    highContrast,
    simpleFont,
    reduceAnimations,
    speechEnabled,
    narratorKey: selectedNarrator,
  };

  const updateAccessibilitySetting = (
    key: 'highContrast' | 'simpleFont' | 'reduceAnimations' | 'speechEnabled',
    value: boolean,
  ) => {
    const nextSettings: AppSettings = {
      ...effectiveSettings,
      [key]: value,
    };

    handleSettingsUpdate(nextSettings);

    if (key === 'speechEnabled') {
      if (value) {
        speakMessage('Narração ativada. Eu vou explicar cada exercício em voz alta, com frases curtas e claras.', { force: true, skipRecentCheck: true });
      } else if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        setScreenReaderAnnouncement('Narração desativada.');
        setSpeechStatus({ kind: 'idle', message: 'Narração desativada.' });
      }
    }
  };

  const updateNarratorChoice = (value: NarratorKey) => {
    const narrator = getNarratorOption(value);
    const nextSettings: AppSettings = {
      ...effectiveSettings,
      narratorKey: value,
    };

    handleSettingsUpdate(nextSettings);
    setScreenReaderAnnouncement(`Narrador ${narrator.label} selecionado.`);
    setSpeechStatus({ kind: 'idle', message: `Narrador ${narrator.label} selecionado.` });
  };

  const previewNarrator = (value: NarratorKey) => {
    updateNarratorChoice(value);
    speakMessage(getNarratorOption(value).sample, {
      force: true,
      narratorKey: value,
      skipRecentCheck: true,
    });
  };

  const isPhaseUnlocked = (phaseId: number): boolean => {
    if (effectiveSettings.devMode) return true;
    if (phaseId === 1) return true;

    const prevPhase = PHASES_INFO.find(p => p.id === phaseId - 1);
    if (!prevPhase) return false;
    const finalLevel = prevPhase.levels[prevPhase.levels.length - 1];
    const key = `${phaseId - 1}-${finalLevel.id}`;
    return !!gameState.profile.progress[key]?.completed;
  };

  const isLevelUnlocked = (phaseId: number, levelIndex: number): boolean => {
    if (effectiveSettings.devMode) return true;
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

  const handleResetProgress = () => {
    const updatedProfile = { ...gameState.profile, progress: {} };
    saveState(updatedProfile);
    localStorage.removeItem('deviceSelected');
    setModalKey(prev => prev + 1);
  };

  const handleDeviceSelect = (method: InputMethod) => {
    handleSettingsUpdate({
      ...effectiveSettings,
      inputMethodHint: method,
      stickyDrag: method === 'trackpad'
    });
  };

  const phaseColors: Record<string, { bg: string; text: string; border: string; accent: string; light: string }> = {
    green: { bg: 'bg-green-50', text: 'text-green-800', border: 'border-green-200', accent: 'bg-green-500', light: 'bg-green-100' },
    purple: { bg: 'bg-purple-50', text: 'text-purple-800', border: 'border-purple-200', accent: 'bg-purple-500', light: 'bg-purple-100' },
  };

  const renderCurrentView = () => {
    if (gameState.view === 'teacher') {
      return (
        <TeacherPanel
          profile={{ ...gameState.profile, settings: effectiveSettings }}
          onUpdateSettings={handleSettingsUpdate}
          onClose={() => setGameState(prev => ({ ...prev, view: 'map' }))}
          onResetProgress={handleResetProgress}
        />
      );
    }

    if (gameState.view === 'game' && gameState.activeLevelId) {
      const props = {
        settings: effectiveSettings,
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
        <div
          className="w-full h-screen overflow-hidden"
          style={{ touchAction: 'none' }}
          onContextMenu={(e) => e.preventDefault()}
          aria-label={`Exercício ${gameState.activeLevelId}. ${LEVEL_NARRATIONS[gameState.activeLevelId] ?? 'Siga as instruções da tela.'}`}
        >
          {renderLevel()}
        </div>
      );
    }

    const currentPhase = PHASES_INFO[selectedPhaseIndex];
    const phaseUnlocked = isPhaseUnlocked(currentPhase.id);
    const colors = phaseColors[currentPhase.color] || phaseColors.green;
    const phaseTitleClass = highContrast ? 'text-yellow-200' : colors.text;
    const phaseSubtitleClass = highContrast ? 'text-slate-100' : `${colors.text} opacity-70`;
    const navButtonClass = highContrast
      ? 'border border-yellow-300 bg-slate-900 text-white shadow-md hover:bg-slate-800 active:scale-95'
      : 'bg-white shadow-md hover:scale-110 hover:shadow-lg active:scale-95';

    return (
      <div className={`min-h-[100dvh] ${highContrast ? 'bg-slate-950' : colors.bg} flex flex-col`}>
        <header className={`sticky top-0 z-10 flex items-center justify-between p-4 pl-20 pr-20 shadow-sm ${highContrast ? 'border-b-2 border-yellow-300 bg-slate-950' : 'bg-white'}`}>
          <div className="flex items-center gap-3">
            <span className="text-3xl">🎓</span>
            <div className={`font-bold text-lg sm:text-xl ${highContrast ? 'text-white' : 'text-gray-700'}`}>Mestre do Mouse</div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="primary" onClick={() => setGameState(prev => ({ ...prev, view: 'teacher' }))}>
              <Settings className="w-4 h-4 mr-2" /> Prof.
            </Button>
          </div>
        </header>

        <div className="flex items-center justify-center gap-4 px-4 py-4">
          <button
            className={`rounded-full p-2 transition-all ${selectedPhaseIndex > 0 ? navButtonClass : 'cursor-not-allowed opacity-30'}`}
            onClick={() => selectedPhaseIndex > 0 && setSelectedPhaseIndex(p => p - 1)}
            disabled={selectedPhaseIndex === 0}
          >
            <ChevronLeft size={28} className={highContrast ? 'text-white' : 'text-gray-600'} />
          </button>

          <div className="text-center">
            <h2 className={`text-2xl sm:text-4xl font-bold drop-shadow-sm ${phaseTitleClass}`}>{currentPhase.title}</h2>
            <p className={`text-sm sm:text-lg font-medium ${phaseSubtitleClass}`}>{currentPhase.subtitle}</p>
          </div>

          <button
            className={`rounded-full p-2 transition-all ${selectedPhaseIndex < PHASES_INFO.length - 1 ? navButtonClass : 'cursor-not-allowed opacity-30'}`}
            onClick={() => selectedPhaseIndex < PHASES_INFO.length - 1 && setSelectedPhaseIndex(p => p + 1)}
            disabled={selectedPhaseIndex >= PHASES_INFO.length - 1}
          >
            <ChevronRight size={28} className={highContrast ? 'text-white' : 'text-gray-600'} />
          </button>
        </div>

        <div className="mb-2 flex justify-center gap-2 sm:mb-4">
          {PHASES_INFO.map((phase, idx) => (
            <button
              key={phase.id}
              onClick={() => setSelectedPhaseIndex(idx)}
              className={`h-3 w-3 rounded-full transition-all ${idx === selectedPhaseIndex
                ? `${highContrast ? 'bg-yellow-400' : colors.accent} scale-125`
                : isPhaseUnlocked(phase.id)
                  ? highContrast
                    ? 'bg-slate-300 hover:bg-yellow-300'
                    : 'bg-gray-400 hover:bg-gray-500'
                  : 'bg-gray-300'
                }`}
            />
          ))}
        </div>

        <div className="flex flex-1 flex-col items-center overflow-y-auto p-4 pb-8 md:p-8">
          {!phaseUnlocked ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
              <Lock size={64} className={highContrast ? 'text-yellow-300' : 'text-gray-400'} />
              <h3 className={`text-2xl font-bold ${highContrast ? 'text-white' : 'text-gray-500'}`}>Fase Bloqueada</h3>
              <p className={`max-w-md ${highContrast ? 'text-slate-200' : 'text-gray-400'}`}>
                Complete o desafio final da fase anterior para desbloquear esta fase!
              </p>
              <Button variant="secondary" onClick={() => setSelectedPhaseIndex(selectedPhaseIndex - 1)}>
                <ChevronLeft className="w-4 h-4 mr-2" /> Voltar à fase anterior
              </Button>
            </div>
          ) : (
            <div className="grid w-full max-w-5xl grid-cols-1 gap-3 px-2 pb-6 sm:gap-6 sm:px-4 md:grid-cols-2">
              {currentPhase.levels.map((level, idx) => {
                const progressKey = `${currentPhase.id}-${level.id}`;
                const isCompleted = !!gameState.profile.progress[progressKey]?.completed;
                const isLocked = !isLevelUnlocked(currentPhase.id, idx);
                const isFinal = !!level.isFinal;

                return (
                  <div
                    key={level.id}
                    className={`
                      relative flex cursor-pointer flex-row items-center gap-3 rounded-2xl border-b-4 p-3 shadow-xl transition-all duration-300 sm:gap-6 sm:rounded-3xl sm:border-b-8 sm:p-6
                      ${highContrast
                        ? `${isFinal ? 'md:col-span-2' : ''} border-yellow-300 bg-slate-900 hover:border-yellow-200`
                        : isFinal
                          ? 'md:col-span-2 bg-gradient-to-br from-amber-100 to-orange-50 border-orange-300 hover:border-orange-400'
                          : `bg-white ${colors.border} hover:border-opacity-80`
                      }
                      ${isLocked
                        ? highContrast ? 'cursor-not-allowed opacity-70' : 'cursor-not-allowed grayscale opacity-60'
                        : 'hover:-translate-y-2 hover:shadow-2xl active:scale-95'
                      }
                    `}
                    onClick={() => !isLocked && handleLevelSelect(currentPhase.id, level.id)}
                  >
                    <div className={`
                      flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-xl font-bold shadow-inner transition-colors sm:h-20 sm:w-20 sm:text-3xl
                      ${isCompleted
                        ? highContrast ? 'bg-emerald-400 text-slate-950' : 'bg-green-500 text-white'
                        : isLocked
                          ? highContrast ? 'bg-slate-700 text-slate-100' : 'bg-gray-200 text-gray-400'
                          : isFinal
                            ? highContrast ? 'bg-yellow-400 text-slate-950 animate-pulse' : 'bg-orange-500 text-white animate-pulse'
                            : highContrast ? 'bg-yellow-300 text-slate-950' : `${colors.accent} text-white`
                      }
                    `}>
                      {isCompleted ? <CheckCircle className="w-5 h-5 sm:w-8 sm:h-8" /> : isLocked ? <Lock className="w-5 h-5 sm:w-7 sm:h-7" /> : isFinal ? <Trophy className="w-5 h-5 sm:w-7 sm:h-7" /> : idx + 1}
                    </div>

                    <div className="flex-1 text-left">
                      <h3 className={`mb-0.5 text-base font-bold sm:mb-2 sm:text-2xl ${highContrast ? 'text-white' : isFinal ? 'text-orange-900' : 'text-gray-800'}`}>
                        {level.title}
                      </h3>
                      <p className={`text-xs font-medium sm:text-base ${highContrast ? 'text-slate-200' : isFinal ? 'text-orange-800/80' : 'text-gray-500'}`}>
                        {level.desc}
                      </p>
                    </div>

                    <div className="hidden items-center justify-center md:flex">
                      {!isLocked && !isCompleted && (
                        <div className={`rounded-full p-3 ${highContrast ? 'bg-yellow-200 text-slate-950' : isFinal ? 'bg-orange-200 text-orange-600' : `${colors.light} ${colors.text}`}`}>
                          <Play size={32} fill="currentColor" />
                        </div>
                      )}
                      {isCompleted && (
                        <div className={`flex items-center gap-1 rounded-full px-3 py-1 text-sm font-bold ${highContrast ? 'bg-emerald-300 text-slate-950' : 'bg-green-100 text-green-600'}`}>
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

        <DevicePickerModal
          key={modalKey}
          settings={effectiveSettings}
          onUpdateSettings={handleSettingsUpdate}
          onSelect={handleDeviceSelect}
        />
        {showCelebration && <Celebration onClose={() => setShowCelebration(false)} reduceMotion={reduceAnimations} />}
      </div>
    );
  };

  const rootClasses = [
    'min-h-screen',
    highContrast ? 'accessibility-high-contrast' : '',
    simpleFont ? 'accessibility-simple-font' : '',
    reduceAnimations ? 'accessibility-reduce-motion' : '',
    visualFeedback ? `feedback-${visualFeedback.type}` : '',
  ].filter(Boolean).join(' ');

  return (
    <div className={rootClasses}>
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {screenReaderAnnouncement}
      </div>

      {renderCurrentView()}

      <PedagogicalInfoModal topOffsetClass={gameState.view === 'map' ? 'top-4' : 'top-20'} />

      {gameState.view === 'map' && (
        <AccessibilityMenu
          highContrast={highContrast}
          setHighContrast={(value) => updateAccessibilitySetting('highContrast', value)}
          simpleFont={simpleFont}
          setSimpleFont={(value) => updateAccessibilitySetting('simpleFont', value)}
          reduceAnimations={reduceAnimations}
          setReduceAnimations={(value) => updateAccessibilitySetting('reduceAnimations', value)}
          speechEnabled={speechEnabled}
          setSpeechEnabled={(value) => updateAccessibilitySetting('speechEnabled', value)}
          selectedNarrator={selectedNarrator}
          setSelectedNarrator={updateNarratorChoice}
          narratorOptions={NARRATOR_OPTIONS.map(({ key, label, icon, description }) => ({ key, label, icon, description }))}
          onPreviewNarrator={previewNarrator}
          onTestSpeech={() => speakMessage('Teste de narração. Se você está ouvindo esta mensagem, o áudio acessível está funcionando corretamente.', { force: true, skipRecentCheck: true })}
          speechStatus={speechStatus}
        />
      )}

      {visualFeedback && (
        <div className="fixed bottom-4 left-1/2 z-[85] -translate-x-1/2 rounded-full border border-white/60 bg-slate-900/90 px-4 py-2 text-sm font-bold text-white shadow-2xl backdrop-blur-md">
          {visualFeedback.message}
        </div>
      )}
    </div>
  );
};

export default App;