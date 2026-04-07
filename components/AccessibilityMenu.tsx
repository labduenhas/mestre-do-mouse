import React, { useState } from 'react';
import { AudioLines, Contrast, PersonStanding, Type, Waves, X } from 'lucide-react';
import type { NarratorKey } from '../types';

interface NarratorOption {
  key: NarratorKey;
  label: string;
  icon: string;
  description: string;
}

interface AccessibilityMenuProps {
  highContrast: boolean;
  setHighContrast: (value: boolean) => void;
  simpleFont: boolean;
  setSimpleFont: (value: boolean) => void;
  reduceAnimations: boolean;
  setReduceAnimations: (value: boolean) => void;
  speechEnabled: boolean;
  setSpeechEnabled: (value: boolean) => void;
  selectedNarrator: NarratorKey;
  setSelectedNarrator: (value: NarratorKey) => void;
  narratorOptions: NarratorOption[];
  onPreviewNarrator: (value: NarratorKey) => void;
  onTestSpeech: () => void;
  speechStatus: {
    kind: 'idle' | 'starting' | 'playing' | 'success' | 'warning' | 'error';
    message: string;
  };
}

interface ToggleRowProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  checked: boolean;
  onToggle: (value: boolean) => void;
  highContrastMode?: boolean;
}

const ToggleRow: React.FC<ToggleRowProps> = ({ icon, title, description, checked, onToggle, highContrastMode = false }) => (
  <div className={`flex items-center justify-between gap-4 rounded-2xl border px-3 py-3 ${highContrastMode ? 'border-yellow-300 bg-slate-900' : 'border-slate-200 bg-slate-50'}`}>
    <div className="flex min-w-0 flex-1 gap-3">
      <div className={`mt-0.5 shrink-0 ${highContrastMode ? 'text-yellow-300' : 'text-slate-700'}`}>{icon}</div>
      <div className="min-w-0">
        <div className={`font-semibold ${highContrastMode ? 'text-white' : 'text-slate-800'}`}>{title}</div>
        <p className={`text-sm leading-snug ${highContrastMode ? 'text-slate-200' : 'text-slate-600'}`}>{description}</p>
      </div>
    </div>

    <button
      type="button"
      aria-label={`${checked ? 'Desativar' : 'Ativar'} ${title}`}
      aria-pressed={checked}
      onClick={() => onToggle(!checked)}
      className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full p-0.5 transition-all ${checked ? (highContrastMode ? 'bg-yellow-400' : 'bg-emerald-500') : (highContrastMode ? 'bg-slate-600' : 'bg-slate-300')}`}
    >
      <span
        className={`absolute left-0.5 top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'}`}
      />
    </button>
  </div>
);

export const AccessibilityMenu: React.FC<AccessibilityMenuProps> = ({
  highContrast,
  setHighContrast,
  simpleFont,
  setSimpleFont,
  reduceAnimations,
  setReduceAnimations,
  speechEnabled,
  setSpeechEnabled,
  selectedNarrator,
  setSelectedNarrator,
  narratorOptions,
  onPreviewNarrator,
  onTestSpeech,
  speechStatus,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="absolute left-2 top-4 z-[70] sm:left-4">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={isOpen ? 'Fechar menu de acessibilidade' : 'Abrir menu de acessibilidade'}
        className={`flex h-12 w-12 items-center justify-center rounded-full border shadow-lg backdrop-blur-sm transition-transform hover:scale-105 ${highContrast ? 'border-yellow-300 bg-slate-950 text-yellow-300' : 'border-sky-200 bg-white/95 text-slate-700'}`}
      >
        {isOpen ? <X size={20} /> : <PersonStanding size={20} />}
      </button>

      {isOpen && (
        <div className={`mt-3 w-[min(22rem,calc(100vw-1rem))] rounded-3xl border p-3 shadow-2xl backdrop-blur-md sm:p-4 ${highContrast ? 'border-yellow-300 bg-slate-950 text-white' : 'border-slate-200 bg-white/95'}`}>
          <div className={`-mx-3 mb-3 border-b px-3 pb-3 pt-1 sm:-mx-4 sm:px-4 ${highContrast ? 'border-yellow-300 bg-slate-950/95' : 'border-slate-200 bg-white/95'}`}>
            <h2 className={`text-base font-bold ${highContrast ? 'text-white' : 'text-slate-800'}`}>Acessibilidade</h2>
            <p className={`text-sm ${highContrast ? 'text-slate-200' : 'text-slate-600'}`}>Ajustes rápidos para deixar a experiência mais confortável.</p>
          </div>

          <div className="space-y-2.5 pb-1">
            <ToggleRow
              icon={<Contrast size={18} />}
              title="Alto Contraste"
              description="Cores mais fortes e melhor legibilidade de elementos importantes."
              checked={highContrast}
              onToggle={setHighContrast}
              highContrastMode={highContrast}
            />

            <ToggleRow
              icon={<Type size={18} />}
              title="Fonte Simples"
              description="Usa uma fonte sem serifa, mais limpa para leitura."
              checked={simpleFont}
              onToggle={setSimpleFont}
              highContrastMode={highContrast}
            />

            <ToggleRow
              icon={<Waves size={18} />}
              title="Reduzir Animações"
              description="Diminui movimentos e transições visuais não essenciais."
              checked={reduceAnimations}
              onToggle={setReduceAnimations}
              highContrastMode={highContrast}
            />

            <ToggleRow
              icon={<AudioLines size={18} />}
              title="Narração de Áudio"
              description="Lê instruções principais em voz alta quando disponíveis."
              checked={speechEnabled}
              onToggle={setSpeechEnabled}
              highContrastMode={highContrast}
            />

            {speechEnabled && (
              <div className={`rounded-2xl border p-2.5 sm:p-3 ${highContrast ? 'border-yellow-300 bg-slate-900' : 'border-slate-200 bg-slate-50'}`}>
                <p className={`text-[11px] font-bold uppercase tracking-wide ${highContrast ? 'text-yellow-200' : 'text-slate-500'}`}>
                  Escolha a narradora
                </p>

                <div className="mt-2 space-y-2">
                  {narratorOptions.map((narrator) => {
                    const isSelected = narrator.key === selectedNarrator;

                    return (
                      <div
                        key={narrator.key}
                        className={`rounded-2xl border p-2 ${isSelected
                          ? highContrast
                            ? 'border-yellow-300 bg-slate-950'
                            : 'border-blue-300 bg-blue-50'
                          : highContrast
                            ? 'border-slate-700 bg-slate-950/60'
                            : 'border-slate-200 bg-white'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <button
                            type="button"
                            aria-pressed={isSelected}
                            onClick={() => setSelectedNarrator(narrator.key)}
                            className="flex min-w-0 flex-1 items-start gap-3 text-left"
                          >
                            <span className="text-xl" aria-hidden="true">{narrator.icon}</span>
                            <span className="min-w-0">
                              <span className={`block text-sm font-bold ${highContrast ? 'text-white' : 'text-slate-800'}`}>
                                {narrator.label}
                              </span>
                              <span className={`block text-xs ${highContrast ? 'text-slate-200' : 'text-slate-600'}`}>
                                {narrator.description}
                              </span>
                            </span>
                          </button>

                          <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${isSelected
                            ? highContrast
                              ? 'bg-yellow-300 text-slate-950'
                              : 'bg-blue-600 text-white'
                            : highContrast
                              ? 'bg-slate-700 text-slate-200'
                              : 'bg-slate-100 text-slate-600'
                          }`}>
                            {isSelected ? 'Ativa' : 'Usar'}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => onPreviewNarrator(narrator.key)}
                          className={`mt-2 w-full rounded-xl px-3 py-2 text-xs font-bold transition-colors ${highContrast ? 'bg-slate-800 text-yellow-200 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                        >
                          🔊 Testar {narrator.label}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className={`mt-3 rounded-2xl border p-3 ${highContrast ? 'border-yellow-300 bg-slate-900' : 'border-slate-200 bg-slate-50'}`}>
            <button
              type="button"
              onClick={onTestSpeech}
              className={`w-full rounded-xl px-3 py-2 text-sm font-bold transition-colors ${highContrast ? 'bg-yellow-300 text-slate-950 hover:bg-yellow-200' : 'bg-blue-600 text-white hover:bg-blue-500'}`}
            >
              {speechEnabled ? '🔊 Testar narradora selecionada' : '🔊 Testar narração agora'}
            </button>

            <div
              className={`mt-2 rounded-xl px-3 py-2 text-xs font-semibold ${
                speechStatus.kind === 'error'
                  ? 'bg-red-100 text-red-700'
                  : speechStatus.kind === 'warning'
                    ? 'bg-amber-100 text-amber-800'
                    : speechStatus.kind === 'playing' || speechStatus.kind === 'success'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-slate-100 text-slate-700'
              }`}
              role="status"
              aria-live="polite"
            >
              Status da narração: {speechStatus.message}
            </div>

            <p className={`mt-2 text-xs leading-relaxed ${highContrast ? 'text-slate-200' : 'text-slate-600'}`}>
              Como usar: ative a narração, escolha a voz que preferir e toque em <strong>Testar</strong>. Depois entre em um exercício para ouvir a instrução com essa narradora.
            </p>
            <p className={`mt-1 text-xs ${highContrast ? 'text-slate-300' : 'text-slate-500'}`}>
              Se aparecer <strong>synthesis-failed</strong> ou a fala não começar, deixe a aba ativa e teste outra narradora disponível.
            </p>
          </div>

          <p className={`mt-3 text-xs ${highContrast ? 'text-slate-300' : 'text-slate-500'}`}>
            O botão fica só na tela inicial para não atrapalhar as atividades.
          </p>
        </div>
      )}
    </div>
  );
};
