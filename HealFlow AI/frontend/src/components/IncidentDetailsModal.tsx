import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  Terminal, 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  UserCheck, 
  Send,
  Cpu
} from 'lucide-react';
import { Incident } from '../types';
import { StatusBadge, SeverityBadge, SourceBadge, VerificationBadge } from './common/StatusBadge';

interface IncidentDetailsModalProps {
  incident: Incident | null;
  onClose: () => void;
  onManualRecover: (incidentId: string, payload?: Record<string, any>) => Promise<void>;
  isRecovering: boolean;
}

export const IncidentDetailsModal: React.FC<IncidentDetailsModalProps> = ({
  incident,
  onClose,
  onManualRecover,
  isRecovering,
}) => {
  const [remediationCurrency, setRemediationCurrency] = useState('USD');

  if (!incident) return null;

  const handleApprove = async () => {
    await onManualRecover(incident.id, { currency: remediationCurrency });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-4xl max-h-[90vh] bg-[#0d131f] border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-[#111827]">
          <div className="flex items-center gap-3">
            <span className="font-mono text-sm font-bold text-indigo-400">{incident.id}</span>
            <SeverityBadge severity={incident.severity} />
            <StatusBadge status={incident.status} />
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1 text-xs">
          {/* Metadata Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-[#090d16] border border-slate-800/80">
            <div>
              <span className="text-slate-400 text-[11px] block">Error Category</span>
              <span className="font-semibold text-slate-200 text-sm">{incident.error_category}</span>
            </div>
            <div>
              <span className="text-slate-400 text-[11px] block">Detected At</span>
              <span className="font-mono text-slate-300">{new Date(incident.created_at).toLocaleString()}</span>
            </div>
            <div>
              <span className="text-slate-400 text-[11px] block">Diagnosis Engine</span>
              <div className="mt-0.5">
                <SourceBadge source={incident.diagnosis_source} />
              </div>
            </div>
            <div>
              <span className="text-slate-400 text-[11px] block">Verification Proof</span>
              <div className="mt-0.5">
                <VerificationBadge status={incident.verification_status} />
              </div>
            </div>
          </div>

          {/* AI Diagnosis Breakdown */}
          <div className="p-5 rounded-xl bg-gradient-to-br from-indigo-950/30 to-[#0d131f] border border-indigo-500/20 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-violet-400" />
                Root Cause Analysis & Diagnostic Assessment
              </h4>
              <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                Confidence: {(incident.confidence * 100).toFixed(0)}%
              </span>
            </div>

            <div className="space-y-2 text-slate-300">
              <div>
                <span className="text-slate-400 font-medium">Probable Root Cause:</span>
                <p className="font-medium text-slate-100 mt-0.5 leading-relaxed">
                  {incident.probable_root_cause}
                </p>
              </div>

              <div>
                <span className="text-slate-400 font-medium">Technical Assessment:</span>
                <p className="text-slate-300 mt-0.5 leading-relaxed">
                  {incident.diagnosis}
                </p>
              </div>

              <div className="pt-2 flex flex-wrap items-center gap-4 text-[11px]">
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400">Allowlisted Action:</span>
                  <span className="font-mono font-semibold text-indigo-400">{incident.recommended_action}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400">Automated Recovery Allowed:</span>
                  <span className={incident.recovery_possible ? 'text-emerald-400 font-medium' : 'text-rose-400 font-medium'}>
                    {incident.recovery_possible ? 'YES' : 'NO (Escalate)'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400">Human Approval Mandatory:</span>
                  <span className={incident.requires_human_approval ? 'text-amber-400 font-medium' : 'text-slate-400'}>
                    {incident.requires_human_approval ? 'YES' : 'NO'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Human Remediation Box (for NEEDS_HUMAN_REVIEW) */}
          {incident.status === 'NEEDS_HUMAN_REVIEW' && (
            <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-800/80 space-y-3">
              <div className="flex items-center gap-2 text-amber-300 font-semibold text-xs">
                <UserCheck className="w-4 h-4 text-amber-400" />
                Human Remediation Required: Missing Mandatory Field
              </div>
              <p className="text-slate-300 text-xs">
                The payload missing the mandatory field <code className="text-amber-300 bg-amber-950/60 px-1 py-0.5 rounded">currency</code> was quarantined. Provide the currency code below to approve the remediation and re-run verification:
              </p>
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={remediationCurrency}
                  onChange={(e) => setRemediationCurrency(e.target.value.toUpperCase())}
                  placeholder="e.g. USD, EUR, GBP"
                  maxLength={3}
                  className="px-3 py-1.5 rounded-lg bg-[#090d16] border border-slate-700 text-slate-100 font-mono text-xs w-28 uppercase focus:outline-none focus:border-indigo-500"
                />
                <button
                  onClick={handleApprove}
                  disabled={isRecovering}
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  {isRecovering ? 'Applying Remediation...' : 'Approve & Verify Recovery'}
                </button>
              </div>
            </div>
          )}

          {/* Recovery Attempts & Audit Trail */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              Recovery Execution Audit Trail ({incident.recovery_attempts.length} attempts)
            </h4>

            {incident.recovery_attempts.length === 0 ? (
              <p className="text-slate-400 italic">No recovery attempts logged for this incident.</p>
            ) : (
              <div className="space-y-2">
                {incident.recovery_attempts.map((att) => (
                  <div
                    key={att.id}
                    className="p-3 rounded-lg bg-[#090d16] border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-indigo-400 font-semibold">Attempt #{att.attempt_number}</span>
                        <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                          {att.action_type}
                        </span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          att.status === 'SUCCESS' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                          att.status === 'BLOCKED' ? 'bg-amber-950 text-amber-400 border border-amber-800' :
                          'bg-rose-950 text-rose-400 border border-rose-800'
                        }`}>
                          {att.status}
                        </span>
                      </div>
                      <p className="text-slate-400 text-[11px] mt-1">{att.action_description}</p>
                      <p className="text-slate-300 font-mono text-[11px] mt-0.5">{att.result}</p>
                    </div>

                    <div className="text-right text-[11px] text-slate-400 font-mono shrink-0">
                      <div>{att.execution_time_ms}ms</div>
                      <div className="text-[10px]">{new Date(att.created_at).toLocaleTimeString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Verification Details */}
          {incident.verification_details && (
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5">
              <span className="font-semibold text-slate-300 text-xs flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Post-Recovery Verification Assertion
              </span>
              <p className="font-mono text-slate-300 text-[11px] leading-relaxed">
                {incident.verification_details}
              </p>
            </div>
          )}

          {/* Sanitized Raw Logs */}
          <div className="space-y-2">
            <span className="font-semibold text-slate-400 text-xs flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-indigo-400" />
              Sanitized Telemetry & Stack Trace
            </span>
            <div className="p-3 rounded-lg bg-[#090d16] border border-slate-800 font-mono text-slate-300 text-[11px] overflow-x-auto whitespace-pre-wrap max-h-48">
              {incident.sanitized_logs}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-[#111827] flex items-center justify-between">
          <span className="text-[11px] text-slate-400 font-mono">
            Workflow Run Ref: {incident.workflow_run_id}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
          >
            Close Dossier
          </button>
        </div>
      </div>
    </div>
  );
};
