import React, { useState, useEffect } from 'react';
import { playSound } from '../utils/sound';
import { InputMethod } from '../types';

interface Props {
    onSelect: (method: InputMethod) => void;
}

export const DevicePickerModal: React.FC<Props> = ({ onSelect }) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Only show once per session
        const hasSelected = localStorage.getItem('deviceSelected');
        if (!hasSelected) {
            setIsVisible(true);
            playSound('pop'); // optional initial sound
        }
    }, []);

    if (!isVisible) return null;

    const handleSelect = (method: InputMethod) => {
        playSound('success');
        localStorage.setItem('deviceSelected', 'true');
        setIsVisible(false);
        onSelect(method);
    };

    const handleHover = () => {
        playSound('pop');
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl transform transition-all animate-in zoom-in-95 duration-300">
                <h2 className="text-3xl font-bold text-center text-gray-800 mb-2">Bem-vindo(a)!</h2>
                <p className="text-center text-gray-600 mb-8 text-lg">
                    Para personalizar sua experiência, o que você vai usar para jogar?
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button
                        onMouseEnter={handleHover}
                        onClick={() => handleSelect('mouse')}
                        className="flex flex-col items-center justify-center p-6 rounded-2xl border-4 border-blue-100 hover:border-blue-500 hover:bg-blue-50 transition-all group scale-100 hover:scale-105 active:scale-95"
                    >
                        <div className="text-5xl mb-4 group-hover:-translate-y-2 transition-transform">🖱️</div>
                        <span className="text-xl font-bold text-gray-700 group-hover:text-blue-700">Mouse</span>
                        <span className="text-sm text-gray-500 mt-2 text-center">Melhor para precisão</span>
                    </button>

                    <button
                        onMouseEnter={handleHover}
                        onClick={() => handleSelect('trackpad')}
                        className="flex flex-col items-center justify-center p-6 rounded-2xl border-4 border-green-100 hover:border-green-500 hover:bg-green-50 transition-all group scale-100 hover:scale-105 active:scale-95"
                    >
                        <div className="text-5xl mb-4 group-hover:-translate-y-2 transition-transform">💻</div>
                        <span className="text-xl font-bold text-gray-700 group-hover:text-green-700">Trackpad</span>
                        <span className="text-sm text-gray-500 mt-2 text-center">Notebooks / Laptops</span>
                    </button>
                </div>
            </div>
        </div>
    );
};
