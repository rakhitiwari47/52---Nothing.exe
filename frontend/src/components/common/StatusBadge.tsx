import React from 'react';
import { 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  RefreshCw, 
  ShieldAlert, 
  Sparkles, 
  Cpu, 
  UserCheck 
} from 'lucide-react';
import { IncidentStatus, SeverityType, DiagnosisSource, VerificationStatus } from '../../types';

interface StatusBadgeProps {
  status: IncidentStatus | string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const s = status.toUpperCase();
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  if (s === 'RECOVERED') {
    return (
      <span className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 ${sizeClasses}`}>
        <CheckCircle2 className="w-3.5 h-3.5" />
        RECOVERED
      </span>
    );
  }

  if (s === 'DETECTED') {
    return (
      <span className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 ${sizeClasses}`}>
        <AlertTriangle className="w-3.5 h-3.5" />
        DETECTED
      </span>
    );
  }

  if (s === 'DIAGNOSING') {
    return (
      <span className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 ${sizeClasses}`}>
        <Clock className="w-3.5 h-3.5 animate-pulse" />
        DIAGNOSING
      </span>
    );
  }

  if (s === 'RECOVERING') {
    return (
      <span className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 ${sizeClasses}`}>
        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
        RECOVERING
      </span>
    );
  }

  if (s === 'NEEDS_HUMAN_REVIEW') {
    return (
      <span className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20 ${sizeClasses}`}>
        <UserCheck className="w-3.5 h-3.5" />
        NEEDS REVIEW
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 ${sizeClasses}`}>
      <ShieldAlert className="w-3.5 h-3.5" />
      {s}
    </span>
  );
};

export const SeverityBadge: React.FC<{ severity: SeverityType | string }> = ({ severity }) => {
  const sev = severity.toUpperCase();
  switch (sev) {
    case 'CRITICAL':
      return (
        <span className="px-2 py-0.5 text-xs font-semibold rounded bg-rose-950/80 text-rose-300 border border-rose-800/60">
          CRITICAL
        </span>
      );
    case 'HIGH':
      return (
        <span className="px-2 py-0.5 text-xs font-semibold rounded bg-amber-950/80 text-amber-300 border border-amber-800/60">
          HIGH
        </span>
      );
    case 'MEDIUM':
      return (
        <span className="px-2 py-0.5 text-xs font-semibold rounded bg-blue-950/80 text-blue-300 border border-blue-800/60">
          MEDIUM
        </span>
      );
    default:
      return (
        <span className="px-2 py-0.5 text-xs font-semibold rounded bg-slate-800 text-slate-300 border border-slate-700">
          LOW
        </span>
      );
  }
};

export const SourceBadge: React.FC<{ source: DiagnosisSource | string }> = ({ source }) => {
  if (source === 'AI_LLM') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-medium rounded-full bg-violet-500/15 text-violet-300 border border-violet-500/30">
        <Sparkles className="w-3 h-3 text-violet-400" />
        AI LLM Diagnosis
      </span>
    );
  }

  if (source === 'HUMAN_OPERATOR') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-medium rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
        <UserCheck className="w-3 h-3 text-emerald-400" />
        Human Verified
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-medium rounded-full bg-slate-800/80 text-slate-300 border border-slate-700">
      <Cpu className="w-3 h-3 text-slate-400" />
      Deterministic Fallback Rule
    </span>
  );
};

export const VerificationBadge: React.FC<{ status: VerificationStatus | string }> = ({ status }) => {
  const s = status.toUpperCase();
  if (s === 'PASSED') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
        <CheckCircle2 className="w-3 h-3" /> PASSED
      </span>
    );
  }
  if (s === 'SKIPPED') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded bg-slate-800 text-slate-400 border border-slate-700">
        SKIPPED
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded bg-rose-950 text-rose-400 border border-rose-800">
      <AlertTriangle className="w-3 h-3" /> FAILED
    </span>
  );
};
