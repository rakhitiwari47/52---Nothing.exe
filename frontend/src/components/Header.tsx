import React from 'react';
import { Play, RefreshCw, Sparkles, Cpu, CheckCircle } from 'lucide-react';
import { TabType } from './Sidebar';
import { SystemHealth } from '../types';

interface HeaderProps {
  currentTab: TabType;
  onOpenSimulator: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  health: SystemHealth | null;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onOpenSimulator,
  onRefresh,
  isRefreshing,
  health,
}) => {
  const getTabDetails = () => {
    switch (currentTab) {
      case 'overview':
        return {
          title: 'System Overview & Recovery Metrics',
          subtitle: 'Real-time telemetry and automated incident resolution analytics',
        };
      case 'simulator':
        return {
          title: 'Safe Workflow Simulator & Closed-Loop Engine',
          subtitle: 'Controlled failure reproduction with automated self-healing execution',
        };
      case 'incidents':
        return {
          title: 'Incidents Dossier & Triage Records',
          subtitle: 'Deep dive into sanitized error logs, AI root causes, and verification proofs',
        };
      case 'recovery':
        return {
          title: 'Remediation & Recovery Audit Trail',
          subtitle: 'Allowlisted action execution history with backoff and retry accounting',
        };
      case 'settings':
        return {
          title: 'Engine Configuration & Operational Guardrails',
          subtitle: 'AI diagnostic service credentials, database status, and safety limits',
        };
    }
  };

  const { title, subtitle } = getTabDetails();

  const isAiActive = health?.ai_engine?.includes('Gemini') || health?.ai_engine?.includes('OpenAI');

  return (
    <header className="h-16 px-8 border-b border-slate-800/80 bg-[#0d131f]/60 backdrop-blur-md flex items-center justify-between sticky top-0 z-20">
      <div>
        <h2 className="text-base font-semibold text-slate-100 tracking-tight">{title}</h2>
        <p className="text-xs text-slate-400">{subtitle}</p>
      </div>

      <div className="flex items-center gap-3">
        {/* AI Engine Status Badge */}
        <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs">
          {isAiActive ? (
            <>
              <Sparkles className="w-3.5 h-3.5 text-violet-400" />
              <span className="text-slate-300 font-medium">{health?.ai_engine}</span>
            </>
          ) : (
            <>
              <Cpu className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-slate-300 font-medium">Deterministic Rule Engine</span>
            </>
          )}
        </div>

        {/* Refresh Action */}
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition-colors"
          title="Refresh real-time data"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-indigo-400' : ''}`} />
        </button>

        {/* Quick Launch Workflow Button */}
        {currentTab !== 'simulator' && (
          <button
            onClick={onOpenSimulator}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all"
          >
            <Play className="w-3.5 h-3.5 fill-white" />
            Run Test Workflow
          </button>
        )}
      </div>
    </header>
  );
};
