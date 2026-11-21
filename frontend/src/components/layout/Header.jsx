import React from 'react';
import { Shield, ShieldAlert, Cpu, RefreshCw, Radio, HardDrive } from 'lucide-react';

export const Header = ({ backendOnline, onResetSession, activeTab }) => {
  return (
    <header className="sticky top-0 z-30 bg-[#0a0e17]/95 backdrop-blur-md border-b border-slate-800/80 px-6 py-3.5">
      <div className="flex items-center justify-between">
        {/* Title & Badges */}
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-700 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-base font-bold tracking-tight text-white font-mono">
                SECURE COMMUNICATION SIMULATOR
              </h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-700/50">
                AES-256-GCM
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Cryptographic Confidentiality, Integrity & Authentication (Alice ↔ Bob)
            </p>
          </div>
        </div>

        {/* System & Status indicators */}
        <div className="flex items-center gap-4">
          {/* Environment Indicator */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300">
            <HardDrive className="w-3.5 h-3.5 text-slate-400" />
            <span>ENV: LOCAL AIR-GAPPED</span>
          </div>

          {/* Backend Health Status */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono">
            <span className={`w-2 h-2 rounded-full ${backendOnline ? 'bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400' : 'bg-rose-500'}`} />
            <span className={backendOnline ? 'text-emerald-400' : 'text-rose-400'}>
              {backendOnline ? 'API ONLINE' : 'API DISCONNECTED'}
            </span>
          </div>

          {/* Reset Session */}
          <button
            onClick={onResetSession}
            title="Clear in-memory keys and session inputs"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-mono transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
            <span>Reset Session</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
