export type InputMethod = 'mouse' | 'trackpad';

export interface AppSettings {
  doubleClickSpeed: number; // ms tolerance
  stickyDrag: boolean; // "Click to pick, Click to drop" vs "Hold to drag"
  snapDistance: number; // pixels
  targetSizeMultiplier: number; // 1.0 to 2.0
  highContrast: boolean;
  inputMethodHint: InputMethod; // Detected or manually set
}

export interface LevelStats {
  attempts: number;
  timeSeconds: number;
  completed: boolean;
  score: number;
}

export interface UserProfile {
  // Removed id, name, avatar for single-user mode
  progress: Record<number, LevelStats>; // Level ID -> Stats
  settings: AppSettings;
}

export interface GameState {
  profile: UserProfile;
  view: 'map' | 'game' | 'teacher';
  activeLevelId: number | null;
}

export enum GameEvent {
  CLICK = 'CLICK',
  DOUBLE_CLICK = 'DOUBLE_CLICK',
  DRAG_START = 'DRAG_START',
  DRAG_END = 'DRAG_END',
  HOVER_ENTER = 'HOVER_ENTER',
  HOVER_LEAVE = 'HOVER_LEAVE'
}