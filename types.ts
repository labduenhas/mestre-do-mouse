export type InputMethod = 'mouse' | 'trackpad';
export type SchoolGrade = 'infantil' | 'primeiro_ano' | 'segundo_ano' | 'terceiro_ano_ou_mais';
export type NarratorKey = 'robozinha' | 'clara' | 'suavinha';

export interface AppSettings {
  doubleClickSpeed: number; // ms tolerance
  stickyDrag: boolean; // "Click to pick, Click to drop" vs "Hold to drag"
  snapDistance: number; // pixels
  targetSizeMultiplier: number; // 1.0 to 2.0
  highContrast: boolean;
  simpleFont: boolean;
  reduceAnimations: boolean;
  speechEnabled: boolean;
  narratorKey: NarratorKey;
  inputMethodHint: InputMethod; // Detected or manually set
  schoolGrade: SchoolGrade;
  bubbleSpeedMultiplier: number;
  bubbleCountOffset: number;
  bubbleSizeMultiplier: number;
  devMode: boolean; // DEV: unlock all levels and phases
}

export interface LevelStats {
  attempts: number;
  timeSeconds: number;
  completed: boolean;
  score: number;
}

export interface UserProfile {
  progress: Record<string, LevelStats>; // Key = "phase-level", e.g. "1-1", "2-3"
  settings: AppSettings;
  currentPhase: number; // 1 or 2 (the highest unlocked phase)
}

export interface GameState {
  profile: UserProfile;
  view: 'map' | 'game' | 'teacher';
  activePhaseId: number | null;
  activeLevelId: number | null;
}

export interface LevelInfo {
  id: number;
  title: string;
  desc: string;
  icon: string;
  isFinal?: boolean;
}

export interface PhaseInfo {
  id: number;
  title: string;
  subtitle: string;
  color: string; // tailwind color prefix, e.g. "green", "purple"
  levels: LevelInfo[];
}

export enum GameEvent {
  CLICK = 'CLICK',
  DOUBLE_CLICK = 'DOUBLE_CLICK',
  DRAG_START = 'DRAG_START',
  DRAG_END = 'DRAG_END',
  HOVER_ENTER = 'HOVER_ENTER',
  HOVER_LEAVE = 'HOVER_LEAVE'
}