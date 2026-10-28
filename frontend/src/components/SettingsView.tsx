import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Database, 
  Sparkles, 
  Cpu, 
  Lock, 
  RotateCcw, 
  CheckCircle2, 
  AlertTriangle,
  Server,
  Zap,
  Layers
} from 'lucide-react';
import { SettingsStatus, SystemHealth } from '../types';

interface SettingsViewProps {
  settings: SettingsStatus | null;
  health: SystemHealth | null;
  onResetDemo: () => Promise<void>;
  isResetting: boolean;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  health,
  onResetDemo,
  isResetting,
}) => {
  const [showConfirmReset, setShowConfirmReset] = useState(false);

  const handleConfirmReset = async () => {
    await onResetDemo();
    setShowConfirmReset(false);
  };

  const isAiConfigured = settings?.ai_configured;

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Card 1: System Health & Architecture */}
      <div className="p-6 rounded-xl bg-[#0d131f] border border-slate-800/80 space-y-4">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <Server className="w-4 h-4 text-indigo-400" />
              Backend Architecture & Runtime Status
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Current environment execution variables and connection health
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            ONLINE
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-lg bg-[#090d16] border border-slate-800/80 space-y-1">
            <span className="text-slate-400 font-medium">Application Name</span>
            <div className="font-semibold text-slate-100">{settings?.app_name || 'HealFlow AI'}</div>
            <div className="text-[11px] text-slate-500 font-mono">Environment: {settings?.app_env || 'production'}</div>
          </div>

          <div className="p-4 rounded-lg bg-[#090d16] border border-slate-800/80 space-y-1">
            <span className="text-slate-400 font-medium">Database Engine</span>
            <div className="font-semibold text-slate-100 flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-indigo-400" />
              {settings?.database_engine || 'PostgreSQL'}
            </div>
            <div className="text-[11px] text-emerald-400 font-medium">
              {settings?.database_connected ? 'Connected & Indexed' : 'Disconnected'}
            </div>
          </div>

          <div className="p-4 rounded-lg bg-[#090d16] border border-slate-800/80 space-y-1">
            <span className="text-slate-400 font-medium">AI Diagnostician Engine</span>
            <div className="font-semibold text-slate-100 flex items-center gap-1.5">
              {isAiConfigured ? (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                  {settings?.ai_model_name || 'Gemini 1.5 Flash'}
                </>
              ) : (
                <>
                  <Cpu className="w-3.5 h-3.5 text-slate-400" />
                  Deterministic Fallback Engine
                </>
              )}
            </div>
            <div className="text-[11px] text-slate-400">
              {isAiConfigured ? 'Real LLM Diagnostics Active' : 'Deterministic Rules Active (Offline-safe)'}
            </div>
          </div>
        </div>
      </div>

      {/* Card 2: AI Configuration & Safe Fallback Notice */}
      <div className="p-6 rounded-xl bg-[#0d131f] border border-slate-800/80 space-y-4">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-violet-400" />
              AI Intelligence & Privacy Guardrails
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              LLM integration parameters and automated log masking policies
            </p>
          </div>
        </div>

        <div className="space-y-3 text-xs">
          <div className="p-4 rounded-lg bg-[#090d16] border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-200">Current AI Diagnostician Status:</span>
              <span className={`px-2.5 py-0.5 rounded-full font-medium ${
                isAiConfigured 
                  ? 'bg-violet-500/15 text-violet-300 border border-violet-500/30'
                  : 'bg-slate-800 text-slate-300 border border-slate-700'
              }`}>
                {settings?.ai_provider || 'Deterministic Fallback Rules'}
              </span>
            </div>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              {isAiConfigured
                ? 'External LLM API keys are secured in backend environment variables. All incoming runtime logs are scrubbed by the LogSanitizer before analysis.'
                : 'No LLM API key is configured. HealFlow AI operates in 100% deterministic local mode, providing instant, accurate root cause diagnoses for all hackathon demo scenarios without external dependencies.'}
            </p>
          </div>

          <div className="p-4 rounded-lg bg-indigo-950/20 border border-indigo-500/20 flex items-start gap-3">
            <Lock className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
            <div className="text-[11px] text-slate-300 leading-relaxed">
              <strong className="text-indigo-300">Privacy & Credential Isolation:</strong> API secrets, bearer tokens, passwords, and user PII are never logged, never exposed to the frontend, and stripped before any external AI provider invocation.
            </div>
          </div>
        </div>
      </div>

      {/* Card 3: Allowlisted Recovery Safety Boundaries */}
      <div className="p-6 rounded-xl bg-[#0d131f] border border-slate-800/80 space-y-4">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Allowlisted Policy & Safety Boundaries
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Deterministic limits to prevent runaway loops, infinite retries, or unsafe action execution
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-3.5 rounded-lg bg-[#090d16] border border-slate-800">
            <span className="text-slate-400">Max Recovery Retries</span>
            <div className="text-lg font-bold text-slate-100 font-mono mt-1">
              {settings?.safety_limits?.max_recovery_retries || 3}
            </div>
            <span className="text-[11px] text-slate-500">Hard stop against loops</span>
          </div>

          <div className="p-3.5 rounded-lg bg-[#090d16] border border-slate-800">
            <span className="text-slate-400">Execution Timeout</span>
            <div className="text-lg font-bold text-slate-100 font-mono mt-1">
              {settings?.safety_limits?.recovery_timeout_seconds || 10}s
            </div>
            <span className="text-[11px] text-slate-500">Bounded per attempt</span>
          </div>

          <div className="p-3.5 rounded-lg bg-[#090d16] border border-slate-800">
            <span className="text-slate-400">Rate Limit Backoff</span>
            <div className="text-lg font-bold text-slate-100 font-mono mt-1">
              Retry-After
            </div>
            <span className="text-[11px] text-slate-500">Adheres to target header</span>
          </div>
        </div>

        <div className="p-4 rounded-lg bg-[#090d16] border border-slate-800 space-y-2">
          <span className="text-xs font-semibold text-slate-300">Allowlisted Remediation Handlers:</span>
          <div className="flex flex-wrap gap-2">
            {(settings?.safety_limits?.allowlisted_recovery_actions || [
              'RETRY_BACKOFF',
              'RATE_LIMIT_BACKOFF',
              'REQUEST_SCHEMA_CORRECTION',
              'ESCALATE_TO_HUMAN'
            ]).map((act) => (
              <span key={act} className="px-2.5 py-1 rounded bg-slate-800 font-mono text-[11px] text-slate-200 border border-slate-700">
                {act}
              </span>
            ))}
          </div>
          <p className="text-[11px] text-slate-500 pt-1">
            * Direct shell script generation or arbitrary code execution from AI output is strictly blocked by architecture.
          </p>
        </div>
      </div>

      {/* Card 4: Safe Reset Demo Data */}
      <div className="p-6 rounded-xl bg-[#0d131f] border border-slate-800/80 space-y-4">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-semibold text-rose-300 flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-rose-400" />
              Demo Data Reset
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Safely purge all simulated workflow records to reset the live demo state
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs">
          <p className="text-slate-400 max-w-xl text-[11px] leading-relaxed">
            Clears all stored incident records, recovery attempts, and workflow history. Use this between hackathon presentations for a fresh, clean demo slate.
          </p>
          <button
            onClick={() => setShowConfirmReset(true)}
            disabled={isResetting}
            className="px-4 py-2 rounded-lg bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800/60 font-semibold text-xs flex items-center gap-2 shrink-0 transition-colors"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
            Reset All Demo Data
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmReset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="max-w-md w-full bg-[#0d131f] border border-slate-800 rounded-xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400">
              <AlertTriangle className="w-6 h-6" />
              <h4 className="font-bold text-slate-100 text-sm">Confirm Reset Demo Data</h4>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to delete all stored incidents and execution logs? This action will reset your dashboard metrics to zero.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowConfirmReset(false)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReset}
                disabled={isResetting}
                className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow"
              >
                {isResetting ? 'Purging records...' : 'Yes, Reset Data'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
