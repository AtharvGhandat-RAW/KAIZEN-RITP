import React from 'react';
import { AlertTriangle } from 'lucide-react';

export const MaintenancePage = () => {
    return (
        <div className="min-h-screen bg-black text-red-500 flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-red-900/20 via-black to-black" />

            <div className="relative z-10 text-center max-w-2xl mx-auto space-y-8 animate-in fade-in zoom-in duration-1000">
                <div className="flex justify-center mb-8">
                    <div className="relative">
                        <div className="absolute inset-0 bg-red-500 blur-2xl opacity-20 animate-pulse" />
                        <AlertTriangle className="w-24 h-24 text-red-600 relative z-10 animate-bounce" />
                    </div>
                </div>

                <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-red-500 to-red-900 drop-shadow-[0_0_15px_rgba(220,38,38,0.5)] font-serif">
                    UNDER MAINTENANCE
                </h1>

                <div className="space-y-4">
                    <p className="text-xl md:text-2xl text-red-400/80 font-light tracking-wide">
                        The gate to the Upside Down is temporarily closed.
                    </p>
                    <p className="text-red-500/60 max-w-md mx-auto">
                        Our mind flayers are working on the system. We will be back shortly.
                        Please check back later.
                    </p>
                </div>

                <div className="pt-12">
                    <div className="h-1 w-32 mx-auto bg-gradient-to-r from-transparent via-red-900 to-transparent" />
                    <p className="mt-4 text-xs text-red-900/50 uppercase tracking-[0.2em]">
                        Kaizen 2025 • System Halted
                    </p>
                </div>
            </div>
        </div>
    );
};
