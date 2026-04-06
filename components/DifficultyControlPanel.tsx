import React, { useState } from 'react';
import { ChevronDown, SlidersHorizontal, Sparkles } from 'lucide-react';
import { AppSettings, SchoolGrade } from '../types';
import { getDifficultySummary, SCHOOL_GRADE_PRESETS } from '../utils/difficulty';

interface Props {
  settings: AppSettings;
  onChange: (patch: Partial<AppSettings>) => void;
  className?: string;
}

const schoolOptions: SchoolGrade[] = [
  'infantil',
  'primeiro_ano',
  'segundo_ano',
  'terceiro_ano_ou_mais',
];

const formatCountOffset = (value: number) => {
  if (value === 0) return 'Padrão';
  return `${value > 0 ? '+' : ''}${value}`;
};

export const DifficultyControlPanel: React.FC<Props> = ({ settings, onChange, className = '' }) => {
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const summary = getDifficultySummary(settings);

  return (
    <section className={`rounded-2xl border border-violet-200 bg-violet-50/80 p-4 sm:p-5 ${className}`}>
      <div className="flex items-center gap-2 mb-3">
        <SlidersHorizontal className="text-violet-700" size={20} />
        <h3 className="text-lg font-bold text-violet-900">Painel de Dificuldade</h3>
      </div>

      <p className="text-sm text-violet-800 mb-4">
        Escolha a série do aluno e ajuste manualmente o ritmo dos exercícios com movimento.
      </p>

      <div className="mb-4">
        <label className="block font-semibold mb-2 text-gray-700">Período / Série</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {schoolOptions.map((option) => {
            const preset = SCHOOL_GRADE_PRESETS[option];
            const active = settings.schoolGrade === option;
            return (
              <button
                key={option}
                type="button"
                onClick={() => onChange({ schoolGrade: option })}
                className={`rounded-xl border-2 p-3 text-left transition-all ${active
                  ? 'border-violet-500 bg-white shadow-sm'
                  : 'border-violet-100 bg-white/70 hover:border-violet-300'
                  }`}
              >
                <div className="font-bold text-gray-800">{preset.label}</div>
                <div className="text-xs text-gray-500 mt-1">{preset.description}</div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-violet-200 bg-white/80 overflow-hidden">
        <button
          type="button"
          onClick={() => setIsAdvancedOpen((prev) => !prev)}
          className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-violet-50 transition-colors"
        >
          <div>
            <div className="font-semibold text-violet-900">Ajustes finos</div>
            <div className="text-sm text-gray-500">Abra para controlar velocidade, quantidade e tamanho das bolhas.</div>
          </div>
          <ChevronDown
            size={18}
            className={`text-violet-700 transition-transform ${isAdvancedOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {isAdvancedOpen && (
          <div className="space-y-4 px-4 pb-4 pt-1 border-t border-violet-100">
            <div>
              <label className="font-semibold text-gray-700 flex justify-between gap-3">
                <span>Velocidade das bolhas</span>
                <span className="text-violet-700">{settings.bubbleSpeedMultiplier.toFixed(2)}x</span>
              </label>
              <input
                type="range"
                min="0.7"
                max="1.4"
                step="0.05"
                className="w-full mt-2 h-3 bg-violet-100 rounded-lg appearance-none cursor-pointer"
                value={settings.bubbleSpeedMultiplier}
                onChange={(e) => onChange({ bubbleSpeedMultiplier: parseFloat(e.target.value) })}
              />
            </div>

            <div>
              <label className="font-semibold text-gray-700 flex justify-between gap-3">
                <span>Quantidade de bolhas</span>
                <span className="text-violet-700">{formatCountOffset(settings.bubbleCountOffset)}</span>
              </label>
              <input
                type="range"
                min="-2"
                max="3"
                step="1"
                className="w-full mt-2 h-3 bg-violet-100 rounded-lg appearance-none cursor-pointer"
                value={settings.bubbleCountOffset}
                onChange={(e) => onChange({ bubbleCountOffset: parseInt(e.target.value, 10) })}
              />
            </div>

            <div>
              <label className="font-semibold text-gray-700 flex justify-between gap-3">
                <span>Tamanho das bolhas</span>
                <span className="text-violet-700">{settings.bubbleSizeMultiplier.toFixed(2)}x</span>
              </label>
              <input
                type="range"
                min="0.8"
                max="1.6"
                step="0.05"
                className="w-full mt-2 h-3 bg-violet-100 rounded-lg appearance-none cursor-pointer"
                value={settings.bubbleSizeMultiplier}
                onChange={(e) => onChange({ bubbleSizeMultiplier: parseFloat(e.target.value) })}
              />
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 rounded-xl bg-white/90 border border-violet-100 p-3">
        <div className="flex items-center gap-2 text-violet-800 font-semibold mb-2">
          <Sparkles size={16} /> Resumo da dificuldade ativa
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
          <div className="rounded-lg bg-violet-50 px-3 py-2">
            <div className="text-gray-500">Perfil</div>
            <div className="font-bold text-gray-800">{summary.intensity}</div>
          </div>
          <div className="rounded-lg bg-violet-50 px-3 py-2">
            <div className="text-gray-500">Velocidade</div>
            <div className="font-bold text-gray-800">{summary.speedLabel}</div>
          </div>
          <div className="rounded-lg bg-violet-50 px-3 py-2">
            <div className="text-gray-500">Bolhas</div>
            <div className="font-bold text-gray-800">{summary.countLabel}</div>
          </div>
          <div className="rounded-lg bg-violet-50 px-3 py-2">
            <div className="text-gray-500">Tamanho</div>
            <div className="font-bold text-gray-800">{summary.sizeLabel}</div>
          </div>
        </div>
      </div>
    </section>
  );
};
