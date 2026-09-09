import React from 'react';
import { Compass, Sparkles, Activity, ShieldCheck } from 'lucide-react';

interface HeaderProps {
  backendOnline: boolean | null;
}

export const Header: React.FC<HeaderProps> = ({ backendOnline }) => {
  return (
    <header className="w-full max-w-6xl mx-auto pt-6 pb-4 px-4 sm:px-6">
      <nav className="flex items-center justify-between p-3.5 sm:p-4 rounded-3xl bg-white/30 backdrop-blur-xl border border-white/50 shadow-sm transition-all">
        {/* Brand Logo */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-pink-300 via-purple-300 to-sky-300 p-0.5 shadow-md flex items-center justify-center">
            <div className="w-full h-full bg-white/70 backdrop-blur-sm rounded-[14px] flex items-center justify-center">
              <Compass className="w-5 h-5 text-indigo-600 animate-spin-slow" />
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-lg sm:text-xl tracking-tight bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-800 bg-clip-text text-transparent">
                Aura Travel
              </span>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50/80 text-indigo-700 border border-indigo-200/50">
                <Sparkles className="w-2.5 h-2.5 mr-1 text-indigo-500" />
                Multi-Agent
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block">
              Parallel AI Orchestration • OpenStreetMap Intelligence
            </p>
          </div>
        </div>

        {/* Status Indicators */}
        <div className="flex items-center space-x-3">
          {/* Parallel Agents Pill */}
          <div className="hidden md:flex items-center space-x-1.5 px-3 py-1 rounded-full bg-white/50 border border-white/60 text-xs font-medium text-slate-600 shadow-sm">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>4 Agents Linked</span>
          </div>

          {/* Backend Status Pill */}
          <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-white/60 backdrop-blur-md border border-white/70 text-xs font-medium text-slate-700 shadow-sm">
            <Activity className={`w-3.5 h-3.5 ${backendOnline ? 'text-emerald-500' : backendOnline === false ? 'text-amber-500' : 'text-slate-400'}`} />
            <span className="hidden sm:inline">
              {backendOnline ? 'Backend Ready' : backendOnline === false ? 'Connecting...' : 'Checking API'}
            </span>
          </div>

          {/* Free & Open Badge */}
          <div className="flex items-center px-2.5 py-1 rounded-full bg-emerald-50/80 border border-emerald-200/60 text-[11px] font-medium text-emerald-700">
            <ShieldCheck className="w-3.5 h-3.5 mr-1" />
            <span>100% Free APIs</span>
          </div>
        </div>
      </nav>
    </header>
  );
};
