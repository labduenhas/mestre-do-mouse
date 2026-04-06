import { UserProfile, LevelStats } from '../types';
import { STORAGE_KEY, STORAGE_KEY_V1, INITIAL_PROFILE, DEFAULT_SETTINGS } from '../constants';

const normalizeProfile = (profile: Partial<UserProfile>): UserProfile => ({
  progress: profile.progress ?? {},
  settings: { ...DEFAULT_SETTINGS, ...(profile.settings || {}) },
  currentPhase: profile.currentPhase || 1,
});

/**
 * Migrates v1 data (numeric progress keys) to v2 format (string "phase-level" keys).
 * All old numeric keys belong to Phase 1.
 */
const migrateV1toV2 = (v1Data: any): UserProfile => {
  const newProgress: Record<string, LevelStats> = {};

  if (v1Data.progress) {
    for (const [key, value] of Object.entries(v1Data.progress)) {
      // Old keys were numeric (1-5), map them to "1-N" for Phase 1
      newProgress[`1-${key}`] = value as LevelStats;
    }
  }

  return normalizeProfile({
    progress: newProgress,
    settings: v1Data.settings,
    currentPhase: 1,
  });
};

export const loadProfile = (): UserProfile => {
  try {
    // Try loading v2 data first
    const v2Data = localStorage.getItem(STORAGE_KEY);
    if (v2Data) {
      const parsed = JSON.parse(v2Data);
      return normalizeProfile(parsed);
    }

    // Try migrating from v1
    const v1Data = localStorage.getItem(STORAGE_KEY_V1);
    if (v1Data) {
      const parsed = JSON.parse(v1Data);
      const migrated = migrateV1toV2(parsed);
      // Save migrated data as v2
      localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
      return migrated;
    }
  } catch (e) {
    console.error("Failed to load profile", e);
  }
  return normalizeProfile(INITIAL_PROFILE);
};

export const saveProfile = (profile: UserProfile): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizeProfile(profile)));
  } catch (e) {
    console.error("Failed to save profile", e);
  }
};