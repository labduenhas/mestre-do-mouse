import { AppSettings, SchoolGrade } from '../types';

export interface BubbleBaseConfig {
  count: number;
  speed: number;
  minSize: number;
}

export interface EffectiveBubbleConfig extends BubbleBaseConfig {
  sizeMultiplier: number;
  speedMultiplier: number;
}

interface SchoolGradePreset {
  label: string;
  description: string;
  speedMultiplier: number;
  bubbleCountOffset: number;
  bubbleSizeMultiplier: number;
}

export const SCHOOL_GRADE_PRESETS: Record<SchoolGrade, SchoolGradePreset> = {
  infantil: {
    label: 'Educação Infantil',
    description: 'Mais apoio visual, bolhas maiores e ritmo mais calmo.',
    speedMultiplier: 0.82,
    bubbleCountOffset: -1,
    bubbleSizeMultiplier: 1.2,
  },
  primeiro_ano: {
    label: '1º ano',
    description: 'Progressão guiada com desafio leve.',
    speedMultiplier: 0.92,
    bubbleCountOffset: 0,
    bubbleSizeMultiplier: 1.1,
  },
  segundo_ano: {
    label: '2º ano',
    description: 'Equilíbrio entre controle e velocidade.',
    speedMultiplier: 1,
    bubbleCountOffset: 0,
    bubbleSizeMultiplier: 1,
  },
  terceiro_ano_ou_mais: {
    label: '3º ano ou mais',
    description: 'Ritmo mais rápido e maior densidade de bolhas.',
    speedMultiplier: 1.12,
    bubbleCountOffset: 1,
    bubbleSizeMultiplier: 0.92,
  },
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export const getSchoolGradePreset = (grade: SchoolGrade) => SCHOOL_GRADE_PRESETS[grade];

export const getEffectiveBubbleConfig = (
  baseConfig: BubbleBaseConfig,
  settings: AppSettings,
): EffectiveBubbleConfig => {
  const preset = getSchoolGradePreset(settings.schoolGrade);
  const speedMultiplier = clamp(preset.speedMultiplier * settings.bubbleSpeedMultiplier, 0.55, 1.8);
  const count = clamp(baseConfig.count + preset.bubbleCountOffset + settings.bubbleCountOffset, 2, 12);
  const minSize = Math.round(
    baseConfig.minSize * clamp(preset.bubbleSizeMultiplier * settings.bubbleSizeMultiplier, 0.75, 1.8),
  );
  const sizeMultiplier = clamp(
    settings.targetSizeMultiplier * preset.bubbleSizeMultiplier * settings.bubbleSizeMultiplier,
    0.75,
    2.4,
  );

  return {
    count,
    speed: Number((baseConfig.speed * speedMultiplier).toFixed(3)),
    minSize,
    sizeMultiplier,
    speedMultiplier,
  };
};

export const getDifficultySummary = (settings: AppSettings) => {
  const preset = getSchoolGradePreset(settings.schoolGrade);
  const speed = preset.speedMultiplier * settings.bubbleSpeedMultiplier;
  const count = preset.bubbleCountOffset + settings.bubbleCountOffset;
  const size = preset.bubbleSizeMultiplier * settings.bubbleSizeMultiplier;

  const intensity = speed < 0.9 || count < 0
    ? 'Suave'
    : speed > 1.1 || count > 0
      ? 'Desafiador'
      : 'Equilibrado';

  return {
    preset,
    intensity,
    speedLabel: `${Math.round(speed * 100)}%`,
    countLabel: count === 0 ? 'Padrão' : `${count > 0 ? '+' : ''}${count} bolha(s)`,
    sizeLabel: `${Math.round(size * 100)}%`,
  };
};
