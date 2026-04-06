import { AppSettings, UserProfile, PhaseInfo } from './types';

export const DEFAULT_SETTINGS: AppSettings = {
  doubleClickSpeed: 600,
  stickyDrag: false,
  snapDistance: 50,
  targetSizeMultiplier: 1.0,
  highContrast: false,
  inputMethodHint: 'mouse',
  schoolGrade: 'primeiro_ano',
  bubbleSpeedMultiplier: 1,
  bubbleCountOffset: 0,
  bubbleSizeMultiplier: 1,
  devMode: false
};

export const INITIAL_PROFILE: UserProfile = {
  progress: {},
  settings: { ...DEFAULT_SETTINGS },
  currentPhase: 1
};

export const PHASES_INFO: PhaseInfo[] = [
  {
    id: 1,
    title: 'Fase 1',
    subtitle: 'Primeiros Passos',
    color: 'green',
    levels: [
      { id: 1, title: 'Mundo das Formas', desc: 'Clique nas bolinhas, balões e doces', icon: 'Target' },
      { id: 2, title: 'Caça ao Tesouro', desc: 'Encontre o tesouro nos baús', icon: 'Box' },
      { id: 3, title: 'Arrumar o Quarto', desc: 'Guarde os brinquedos na caixa', icon: 'Grab' },
      { id: 4, title: 'Labirinto Mágico', desc: 'Leve o fantasma até a saída', icon: 'Activity' },
      { id: 5, title: 'Super Missão', desc: 'Desafio final com todas as habilidades!', icon: 'Award', isFinal: true }
    ]
  },
  {
    id: 2,
    title: 'Fase 2',
    subtitle: 'Novos Desafios',
    color: 'purple',
    levels: [
      { id: 6, title: 'Pintura Digital', desc: 'Pinte o mosaico clicando nas células', icon: 'Palette' },
      { id: 7, title: 'Bolhas Mágicas', desc: 'Estoure as bolhas com duplo-clique', icon: 'Circle' },
      { id: 8, title: 'Quebra-Cabeça', desc: 'Monte o quebra-cabeça arrastando as peças', icon: 'Puzzle' },
      { id: 9, title: 'Circuito do Robô', desc: 'Guie o robô pelo circuito', icon: 'Bot' },
      { id: 10, title: 'Super Missão 2', desc: 'Desafio final com os novos exercícios!', icon: 'Trophy', isFinal: true }
    ]
  }
];

// Kept for backward compatibility
export const LEVEL_INFO = PHASES_INFO.flatMap(p => p.levels);

export const STORAGE_KEY = 'mestre_mouse_single_v2';
export const STORAGE_KEY_V1 = 'mestre_mouse_single_v1';