import React from 'react';
import { 
  LayoutDashboard, 
  PlayCircle, 
  AlertCircle, 
  History, 
  Settings, 
  Activity,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { SystemHealth } from '../types';

export type TabType = 'overview' | 'simulator' | 'incidents' | 'recovery' | 'settings';

interface SidebarProps {
  currentTab: TabType;
  onSelectTab: (tab: TabType) => void;
  health: SystemHealth | null;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab, health }) => {
  const navItems = [
    { id: 'overview' as TabType, label: 'Overview', icon: LayoutDashboard },
    { id: 'simulator' as TabType, label: 'Workflows & Simulator', icon: PlayCircle },
    { id: 'incidents' as TabType, label: 'Incidents Dossier', icon: AlertCircle },
    { id: 'recovery' as TabType, label: 'Recovery History', icon: History },
    { id: 'settings' as TabType, label: 'Settings & Safety', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-[#0d131f] border-r border-slate-800/80 flex flex-col h-screen select-none shrink-0">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800/70">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
            <Zap className="w-5 h-5 fill-white/20" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-slate-100 text-lg tracking-tight">HealFlow</h1>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                AI MVP
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">Self-Healing Automation</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
        <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Core Operations
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-indigo-600/15 text-indigo-300 border border-indigo-500/30 shadow-sm shadow-indigo-950'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Closed Loop Architecture Tag */}
      <div className="px-4 py-3 mx-3 mb-3 rounded-lg bg-slate-900/80 border border-slate-800 text-[11px] text-slate-400">
        <div className="flex items-center gap-1.5 font-semibold text-slate-300 mb-1">
          <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
          Closed Loop Assurance
        </div>
        <p className="text-[10px] leading-relaxed text-slate-400">
          DETECT &rarr; DIAGNOSE &rarr; DECIDE &rarr; RECOVER &rarr; VERIFY &rarr; REPORT
        </p>
      </div>

      {/* Bottom Health Pill */}
      <div className="p-3 border-t border-slate-800/80 bg-[#090d16]">
        <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-900/60 border border-slate-800 text-xs">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                health?.status === 'healthy' ? 'bg-emerald-400' : 'bg-rose-400'
              }`} />
              <span className={`relative inline-flex rounded-full h-2 w-2 ${
                health?.status === 'healthy' ? 'bg-emerald-500' : 'bg-rose-500'
              }`} />
            </span>
            <span className="text-slate-300 font-medium text-xs">
              {health?.status === 'healthy' ? 'Backend Ready' : 'Backend Offline'}
            </span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">
            {health?.database_connected ? 'DB OK' : 'DB ERR'}
          </span>
        </div>
      </div>
    </aside>
  );
};
