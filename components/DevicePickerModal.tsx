import React, { useState, useEffect } from 'react';
import { playSound } from '../utils/sound';
import { AppSettings, InputMethod } from '../types';
import { Button } from './Button';
import { DifficultyControlPanel } from './DifficultyControlPanel';

interface Props {
    settings: AppSettings;
    onUpdateSettings: (settings: AppSettings) => void;
    onSelect: (method: InputMethod) => void;
}

export const DevicePickerModal: React.FC<Props> = ({ settings, onUpdateSettings, onSelect }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [selectedMethod, setSelectedMethod] = useState<InputMethod>(settings.inputMethodHint);

    useEffect(() => {
        // Only show once per session
        const hasSelected = localStorage.getItem('deviceSelected');
        if (!hasSelected) {
            setIsVisible(true);
            playSound('pop');
        }
    }, []);

    useEffect(() => {
        setSelectedMethod(settings.inputMethodHint);
    }, [settings.inputMethodHint]);

    if (!isVisible) return null;

    const handleHover = () => {
        playSound('pop');
    };

    const handleMethodChange = (method: InputMethod) => {
        setSelectedMethod(method);
        onUpdateSettings({
            ...settings,
            inputMethodHint: method,
            stickyDrag: method === 'trackpad'
        });
    };

    const handleDifficultyChange = (patch: Partial<AppSettings>) => {
        onUpdateSettings({
            ...settings,
            ...patch
        });
    };

    const handleConfirm = () => {
        playSound('success');
        localStorage.setItem('deviceSelected', 'true');
        setIsVisible(false);
        onSelect(selectedMethod);
    };

    return (
        <div className="fixed inset-0 z-[100] overflow-y-auto bg-black/50 backdrop-blur-sm">
            <div className="flex min-h-full items-start justify-center p-3 sm:items-center sm:p-4">
                <div className="my-3 w-full max-w-3xl rounded-3xl bg-white p-4 shadow-2xl transform transition-all animate-in zoom-in-95 duration-300 sm:my-4 sm:p-6 lg:p-8">
                <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-800 mb-2">Bem-vindo(a)!</h2>
                <p className="text-center text-gray-600 mb-5 sm:mb-6 text-base sm:text-lg">
                    Escolha o dispositivo e ajuste a dificuldade antes de começar.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <button
                        type="button"
                        onMouseEnter={handleHover}
                        onClick={() => handleMethodChange('mouse')}
                        className={`flex flex-col items-center justify-center p-4 sm:p-6 rounded-2xl border-4 transition-all group scale-100 hover:scale-[1.02] active:scale-95 min-h-32 sm:min-h-40 ${selectedMethod === 'mouse'
                            ? 'border-blue-500 bg-blue-50 shadow-lg'
                            : 'border-blue-100 hover:border-blue-500 hover:bg-blue-50'
                            }`}
                    >
                        <div className="text-4xl sm:text-5xl mb-3 sm:mb-4 group-hover:-translate-y-2 transition-transform">🖱️</div>
                        <span className="text-lg sm:text-xl font-bold text-gray-700 group-hover:text-blue-700">Mouse</span>
                        <span className="text-sm text-gray-500 mt-1 sm:mt-2 text-center">Melhor para precisão</span>
                    </button>

                    <button
                        type="button"
                        onMouseEnter={handleHover}
                        onClick={() => handleMethodChange('trackpad')}
                        className={`flex flex-col items-center justify-center p-4 sm:p-6 rounded-2xl border-4 transition-all group scale-100 hover:scale-[1.02] active:scale-95 min-h-32 sm:min-h-40 ${selectedMethod === 'trackpad'
                            ? 'border-green-500 bg-green-50 shadow-lg'
                            : 'border-green-100 hover:border-green-500 hover:bg-green-50'
                            }`}
                    >
                        <div className="text-4xl sm:text-5xl mb-3 sm:mb-4 group-hover:-translate-y-2 transition-transform">💻</div>
                        <span className="text-lg sm:text-xl font-bold text-gray-700 group-hover:text-green-700">Trackpad</span>
                        <span className="text-sm text-gray-500 mt-1 sm:mt-2 text-center">Notebooks / Laptops</span>
                    </button>
                </div>

                <DifficultyControlPanel
                    settings={settings}
                    onChange={handleDifficultyChange}
                    className="mt-6"
                />

                <div className="mt-5 flex flex-col gap-3 border-t border-slate-200 pt-4 sm:mt-6 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-gray-500 sm:max-w-md">
                        Você poderá ajustar essas opções depois no <strong>Painel do Professor</strong>.
                    </p>
                    <Button onClick={handleConfirm} className="w-full justify-center sm:w-auto sm:min-w-44">
                        Começar a jogar
                    </Button>
                </div>
                </div>
            </div>
        </div>
    );
};
