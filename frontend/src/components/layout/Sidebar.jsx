import React from 'react';
import {
  LayoutDashboard,
  Send,
  Inbox,
  KeyRound,
  ShieldAlert,
  History
} from 'lucide-react';

export const Sidebar = ({ activeTab, onSelectTab, inboxCount = 0 }) => {
  const navItems = [
    {
      id: 'overview',
      label: 'Overview',
      icon: LayoutDashboard,
      desc: 'System Status & Crypto Architecture'
    },
    {
      id: 'sender',
      label: 'Alice — Sender',
      icon: Send,
      desc: 'Compose & AES-256-GCM Encrypt'
    },
    {
      id: 'receiver',
      label: 'Bob — Receiver',
      icon: Inbox,
      badge: inboxCount > 0 ? inboxCount : null,
      desc: 'Inspect & Authenticated Decrypt'
    },
    {
      id: 'keys',
      label: 'Key Management',
      icon: KeyRound,
      desc: '256-bit Key Gen & Validation'
    },
    {
      id: 'attacker',
      label: 'Attacker Simulation',
      icon: ShieldAlert,
      desc: 'Tampering & Integrity Analysis'
    },
    {
      id: 'history',
      label: 'Communication History',
      icon: History,
      desc: 'SQLite Audit & Activity Logs'
    },
  ];

  return (
    <aside className="w-64 shrink-0 bg-[#070b13] border-r border-slate-800/80 min-h-[calc(100vh-65px)] flex flex-col justify-between p-4">
      <div className="space-y-6">
        {/* Module Title */}
        <div className="px-3 pt-2">
          <span className="text-[11px] font-mono uppercase tracking-widest text-slate-400 font-semibold">
            Operational Modules
          </span>
        </div>

        {/* Navigation list */}
        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full text-left px-3.5 py-3 rounded-xl transition-all duration-200 flex items-start gap-3 group ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-950/70 to-slate-900 border border-cyan-500/40 text-cyan-300 cyber-glow-cyan'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent'
                }`}
              >
                <Icon className={`w-5 h-5 shrink-0 mt-0.5 transition-colors ${
                  isActive ? 'text-cyan-400' : 'text-slate-500 group-hover:text-slate-300'
                }`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold tracking-tight truncate">
                      {item.label}
                    </span>
                    {item.badge && (
                      <span className="ml-2 text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 group-hover:text-slate-400 truncate mt-0.5 font-normal">
                    {item.desc}
                  </p>
                </div>
              </button>
            );
          })}
        </nav>
      </div>
    </aside>
  );
};

export default Sidebar;
