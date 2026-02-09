import { AppSettings, UserProfile } from './types';

export const DEFAULT_SETTINGS: AppSettings = {
  doubleClickSpeed: 600, // Forgiving default
  stickyDrag: false, // Default to standard drag, configurable
  snapDistance: 50,
  targetSizeMultiplier: 1.0,
  highContrast: false,
  inputMethodHint: 'mouse'
};

export const INITIAL_PROFILE: UserProfile = {
  progress: {},
  settings: { ...DEFAULT_SETTINGS }
};

export const LEVEL_INFO = [
  { id: 1, title: 'Mundo das Formas', desc: '8 fases: Clique nas bolinhas, balões e doces', icon: 'Target' },
  { id: 2, title: 'Caça ao Tesouro', desc: '8 fases: Encontre o tesouro nos baús', icon: 'Box' },
  { id: 3, title: 'Arrumar o Quarto', desc: '8 fases: Guarde os brinquedos na caixa', icon: 'Grab' },
  { id: 4, title: 'Labirinto Mágico', desc: '8 fases: Leve o fantasma até a saída', icon: 'Activity' },
  { id: 5, title: 'Super Missão', desc: 'Desafio final com todas as habilidades!', icon: 'Award' }
];

export const STORAGE_KEY = 'mestre_mouse_single_v1';