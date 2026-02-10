import React from 'react';
import { AppSettings, UserProfile, LevelStats } from '../types';
import { Button } from './Button';
import { Settings, Info, MousePointer2 } from 'lucide-react';

interface Props {
  profile: UserProfile;
  onUpdateSettings: (s: AppSettings) => void;
  onClose: () => void;
  onResetProgress: () => void;
}

export const TeacherPanel: React.FC<Props> = ({ profile, onUpdateSettings, onClose, onResetProgress }) => {
  const { settings } = profile;

  const handleChange = (key: keyof AppSettings, value: any) => {
    onUpdateSettings({ ...settings, [key]: value });
  };

  return (
    <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
      <div className="max-w-4xl mx-auto p-8">
        <div className="flex justify-between items-center mb-8 border-b pb-4">
          <div className="flex items-center gap-3">
            <Settings size={32} className="text-gray-700" />
            <h2 className="text-3xl font-bold text-gray-800">Painel do Professor</h2>
          </div>
          <Button onClick={onClose} variant="secondary">Fechar e Salvar</Button>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <section className="bg-gray-50 p-6 rounded-2xl border border-gray-200">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <MousePointer2 /> Ajustes de Entrada
            </h3>

            <div className="space-y-6">
              {/* Input Method Hint */}
              <div>
                <label className="block font-semibold mb-2 text-gray-700">Dispositivo Principal (Dica)</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleChange('inputMethodHint', 'mouse')}
                    className={`flex-1 p-3 rounded-lg border-2 ${settings.inputMethodHint === 'mouse' ? 'border-blue-500 bg-blue-50 font-bold' : 'border-gray-200'}`}
                  >
                    🖱️ Mouse
                  </button>
                  <button
                    onClick={() => handleChange('inputMethodHint', 'trackpad')}
                    className={`flex-1 p-3 rounded-lg border-2 ${settings.inputMethodHint === 'trackpad' ? 'border-blue-500 bg-blue-50 font-bold' : 'border-gray-200'}`}
                  >
                    💻 Trackpad
                  </button>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  {settings.inputMethodHint === 'trackpad'
                    ? 'Modo Trackpad ativa tolerâncias maiores e sugere arrastar com clique duplo.'
                    : 'Modo Mouse prioriza precisão.'}
                </p>
              </div>

              {/* Drag Mode */}
              <div>
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-gray-700">Modo "Pegar e Soltar"</label>
                  <input
                    type="checkbox"
                    className="w-6 h-6"
                    checked={settings.stickyDrag}
                    onChange={(e) => handleChange('stickyDrag', e.target.checked)}
                  />
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Útil para trackpads. Em vez de segurar o botão para arrastar, a criança clica para pegar o objeto e clica de novo para soltar.
                </p>
              </div>

              {/* Double Click Speed */}
              <div>
                <label className="font-semibold text-gray-700 flex justify-between">
                  <span>Velocidade Duplo Clique</span>
                  <span className="text-blue-600">{settings.doubleClickSpeed}ms</span>
                </label>
                <input
                  type="range"
                  min="200"
                  max="1500"
                  step="50"
                  className="w-full mt-2 h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  value={settings.doubleClickSpeed}
                  onChange={(e) => handleChange('doubleClickSpeed', parseInt(e.target.value))}
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>Rápido (Expert)</span>
                  <span>Lento (Iniciante)</span>
                </div>
              </div>

              {/* Size */}
              <div>
                <label className="font-semibold text-gray-700 flex justify-between">
                  <span>Tamanho dos Alvos</span>
                  <span className="text-blue-600">{settings.targetSizeMultiplier}x</span>
                </label>
                <input
                  type="range"
                  min="1"
                  max="2"
                  step="0.1"
                  className="w-full mt-2 h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  value={settings.targetSizeMultiplier}
                  onChange={(e) => handleChange('targetSizeMultiplier', parseFloat(e.target.value))}
                />
              </div>
            </div>
          </section>

          <section className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Info /> Relatório de Progresso
            </h3>

            <div className="space-y-4">
              {Object.entries(profile.progress).length === 0 ? (
                <div className="text-gray-500 italic">Nenhuma atividade registrada ainda.</div>
              ) : (
                Object.entries(profile.progress).map(([lvlId, rawStats]) => {
                  const stats = rawStats as LevelStats;
                  return (
                    <div key={lvlId} className="bg-white p-3 rounded-lg shadow-sm">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-bold text-gray-700">Nível {lvlId}</span>
                        <span className="text-xs font-bold bg-green-100 text-green-700 px-2 py-1 rounded">Concluído</span>
                      </div>
                      <div className="text-sm text-gray-600 grid grid-cols-2 gap-2">
                        <div>Tempo: {stats.timeSeconds}s</div>
                        <div>Tentativas Erros: {stats.attempts}</div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="mt-8 pt-4 border-t border-blue-200">
              <h4 className="font-bold text-sm text-blue-800 uppercase mb-2">Dica Pedagógica</h4>
              <p className="text-sm text-blue-900 leading-relaxed mb-4">
                Competência BNCC (Cultura Digital): Se o aluno estiver usando trackpad e tiver dificuldade no arrastar (Nível 3), ative o <strong>Modo Pegar e Soltar</strong>. Isso reduz a carga cognitiva e motora simultânea.
              </p>

              <Button
                onClick={() => {
                  if (window.confirm("Tem certeza que deseja apagar todo o progresso? Essa ação não pode ser desfeita.")) {
                    onResetProgress();
                    onClose();
                  }
                }}
                variant="danger"
                className="w-full justify-center"
              >
                🗑️ Zerar Todo o Progresso
              </Button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};