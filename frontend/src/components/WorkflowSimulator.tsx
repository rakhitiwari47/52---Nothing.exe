import React, { useState, useEffect } from 'react';
import { 
  Play, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldAlert, 
  Code2, 
  Terminal, 
  ArrowRight,
  Sparkles,
  Cpu,
  Layers,
  Info
} from 'lucide-react';
import { WorkflowDefinition, WorkflowRun, Incident, ScenarioType } from '../types';
import { SeverityBadge, StatusBadge, SourceBadge } from './common/StatusBadge';

interface WorkflowSimulatorProps {
  workflows: WorkflowDefinition[];
  onExecute: (scenario: string, payload?: Record<string, any>) => Promise<WorkflowRun>;
  onSelectIncident: (incident: Incident) => void;
  isRunning: boolean;
  preselectedScenario?: string;
}

export const WorkflowSimulator: React.FC<WorkflowSimulatorProps> = ({
  workflows,
  onExecute,
  onSelectIncident,
  isRunning,
  preselectedScenario,
}) => {
  const [selectedScenario, setSelectedScenario] = useState<ScenarioType>('timeout');
  const [customPayload, setCustomPayload] = useState<string>('{}');
  const [activeTab, setActiveTab] = useState<'overview' | 'payload' | 'logs'>('overview');
  const [latestRun, setLatestRun] = useState<WorkflowRun | null>(null);
  const [executionPhase, setExecutionPhase] = useState<number>(0); 
  // 0: idle, 1: DETECT, 2: DIAGNOSE, 3: DECIDE, 4: RECOVER, 5: VERIFY, 6: REPORT

  useEffect(() => {
    if (preselectedScenario) {
      setSelectedScenario(preselectedScenario as ScenarioType);
    }
  }, [preselectedScenario]);

  const currentWf = workflows.find((w) => w.scenario === selectedScenario) || workflows[0];

  useEffect(() => {
    if (currentWf) {
      setCustomPayload(JSON.stringify(currentWf.default_payload, null, 2));
    }
  }, [currentWf]);

  const handleRun = async () => {
    let parsedPayload: Record<string, any> | undefined;
    try {
      parsedPayload = JSON.parse(customPayload);
    } catch (err) {
      alert('Invalid JSON in payload editor. Please correct the syntax before executing.');
      return;
    }

    setExecutionPhase(1); // DETECT
    
    // Simulate real-time visual step progressions
    const timer1 = setTimeout(() => setExecutionPhase(2), 350); // DIAGNOSE
    const timer2 = setTimeout(() => setExecutionPhase(3), 700); // DECIDE
    const timer3 = setTimeout(() => setExecutionPhase(4), 1100); // RECOVER
    const timer4 = setTimeout(() => setExecutionPhase(5), 1500); // VERIFY

    try {
      const result = await onExecute(selectedScenario, parsedPayload);
      setLatestRun(result);
      setExecutionPhase(6); // REPORT (Completed)
      setActiveTab('logs');
    } catch (err) {
      setExecutionPhase(0);
    } finally {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    }
  };

  const steps = [
    { num: 1, label: 'DETECT', desc: 'Trap exception & sanitize logs' },
    { num: 2, label: 'DIAGNOSE', desc: 'AI root cause & impact assessment' },
    { num: 3, label: 'DECIDE', desc: 'Allowlisted policy evaluation' },
    { num: 4, label: 'RECOVER', desc: 'Bounded remediation execution' },
    { num: 5, label: 'VERIFY', desc: 'Independent outcome assertion' },
    { num: 6, label: 'REPORT', desc: 'Persist state & update metrics' },
  ];

  const currentIncident = latestRun?.incidents?.[0];

  return (
    <div className="space-y-6">
      {/* Scenario Selection Selector */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {workflows.map((wf) => {
          const isSelected = selectedScenario === wf.scenario;
          return (
            <button
              key={wf.id}
              onClick={() => {
                setSelectedScenario(wf.scenario);
                setLatestRun(null);
                setExecutionPhase(0);
              }}
              className={`p-4 rounded-xl text-left border transition-all ${
                isSelected
                  ? 'bg-indigo-950/40 border-indigo-500 shadow-md shadow-indigo-950 text-slate-100'
                  : 'bg-[#0d131f] border-slate-800 hover:border-slate-700 text-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <SeverityBadge severity={wf.severity} />
                <span className="text-[10px] font-mono text-slate-400 uppercase">{wf.scenario}</span>
              </div>
              <h4 className="font-semibold text-sm line-clamp-1">{wf.name}</h4>
              <p className="text-xs text-slate-400 mt-1 line-clamp-2">{wf.description}</p>
            </button>
          );
        })}
      </div>

      {/* Main Execution Workspace */}
      <div className="rounded-xl bg-[#0d131f] border border-slate-800/80 p-6 space-y-6">
        {/* Scenario Header & Action */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-3">
              <h3 className="text-base font-bold text-slate-100">{currentWf?.name}</h3>
              <SeverityBadge severity={currentWf?.severity || 'MEDIUM'} />
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">{currentWf?.description}</p>
          </div>

          <button
            onClick={handleRun}
            disabled={isRunning}
            className={`px-5 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 shadow-lg transition-all ${
              isRunning
                ? 'bg-slate-800 text-slate-400 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/25 active:scale-95'
            }`}
          >
            {isRunning ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" />
                Executing Self-Healing Loop...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
                Execute Test Workflow
              </>
            )}
          </button>
        </div>

        {/* Closed-Loop Visual Step Progression */}
        <div className="p-4 rounded-xl bg-[#090d16] border border-slate-800/80">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              Closed-Loop Execution Pipeline
            </span>
            <span className="text-[11px] text-slate-400 font-mono">
              {executionPhase === 0 && 'Ready to trigger'}
              {executionPhase > 0 && executionPhase < 6 && `Executing Step ${executionPhase} of 6...`}
              {executionPhase === 6 && 'Closed loop complete'}
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
            {steps.map((st) => {
              const isActive = executionPhase === st.num;
              const isPast = executionPhase > st.num;
              return (
                <div
                  key={st.num}
                  className={`p-3 rounded-lg border text-center transition-all ${
                    isActive
                      ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300 ring-1 ring-indigo-500 shadow-md shadow-indigo-950 animate-pulse'
                      : isPast
                      ? 'bg-emerald-950/20 border-emerald-800/80 text-emerald-400'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400'
                  }`}
                >
                  <div className="flex items-center justify-center gap-1 font-mono text-xs font-bold mb-1">
                    {isPast ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : `${st.num}.`} {st.label}
                  </div>
                  <div className="text-[10px] leading-tight text-slate-400">{st.desc}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Tab Controls: Overview vs Payload vs Logs */}
        <div>
          <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeTab === 'overview'
                  ? 'bg-slate-800 text-slate-100'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Overview & Specifications
            </button>
            <button
              onClick={() => setActiveTab('payload')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
                activeTab === 'payload'
                  ? 'bg-slate-800 text-slate-100'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              Payload Editor
            </button>
            <button
              onClick={() => setActiveTab('logs')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
                activeTab === 'logs'
                  ? 'bg-slate-800 text-slate-100'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              Runtime Logs {latestRun && <span className="w-2 h-2 rounded-full bg-emerald-400" />}
            </button>
          </div>

          <div className="mt-4">
            {/* Tab 1: Overview */}
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-lg bg-slate-900/60 border border-slate-800 space-y-2">
                  <div className="font-semibold text-slate-300 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                    Expected Controlled Failure
                  </div>
                  <div className="font-mono text-rose-300 bg-rose-950/40 p-2.5 rounded border border-rose-900/40">
                    {currentWf?.expected_failure}
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-slate-900/60 border border-slate-800 space-y-2">
                  <div className="font-semibold text-slate-300 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    Allowlisted Recovery Policy
                  </div>
                  <div className="font-mono text-emerald-300 bg-emerald-950/40 p-2.5 rounded border border-emerald-900/40">
                    {currentWf?.recovery_strategy}
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Payload Editor */}
            {activeTab === 'payload' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Custom JSON payload passed to the workflow executor:</span>
                  <button
                    onClick={() => setCustomPayload(JSON.stringify(currentWf.default_payload, null, 2))}
                    className="text-indigo-400 hover:underline"
                  >
                    Reset to Default Payload
                  </button>
                </div>
                <textarea
                  value={customPayload}
                  onChange={(e) => setCustomPayload(e.target.value)}
                  rows={8}
                  className="w-full font-mono text-xs bg-[#090d16] border border-slate-800 rounded-lg p-3 text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>
            )}

            {/* Tab 3: Runtime Logs */}
            {activeTab === 'logs' && (
              <div className="space-y-4">
                {latestRun ? (
                  <div className="space-y-3">
                    {/* Outcome Notification Banner */}
                    <div className={`p-4 rounded-lg border flex items-center justify-between ${
                      latestRun.status === 'RECOVERED'
                        ? 'bg-emerald-950/30 border-emerald-800/80 text-emerald-300'
                        : latestRun.status === 'NEEDS_HUMAN_REVIEW'
                        ? 'bg-amber-950/30 border-amber-800/80 text-amber-300'
                        : 'bg-rose-950/30 border-rose-800/80 text-rose-300'
                    }`}>
                      <div className="flex items-center gap-3">
                        <StatusBadge status={latestRun.status} />
                        <div>
                          <div className="font-semibold text-xs text-slate-100">
                            {latestRun.status === 'RECOVERED' && 'Self-Healing Loop Completed Successfully'}
                            {latestRun.status === 'NEEDS_HUMAN_REVIEW' && 'Human Approval Required — Quarantined'}
                            {latestRun.status === 'UNRESOLVED' && 'Incident Escalated to Human Operations'}
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            Duration: {latestRun.duration_ms}ms &bull; Run ID: {latestRun.id}
                          </div>
                        </div>
                      </div>

                      {currentIncident && (
                        <button
                          onClick={() => onSelectIncident(currentIncident)}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors flex items-center gap-1.5"
                        >
                          View Full Incident Dossier &rarr;
                        </button>
                      )}
                    </div>

                    {/* Sanitized Terminal Log Viewer */}
                    <div className="rounded-lg bg-[#090d16] border border-slate-800 overflow-hidden font-mono text-xs">
                      <div className="px-3 py-2 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-slate-400">
                        <div className="flex items-center gap-2">
                          <Terminal className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Sanitized Runtime Telemetry & Execution Log</span>
                        </div>
                        <span className="text-[10px] text-emerald-400 font-semibold">ALL SECRETS REDACTED</span>
                      </div>
                      <pre className="p-4 text-slate-300 overflow-x-auto whitespace-pre-wrap leading-relaxed">
                        {currentIncident?.sanitized_logs || 'No log data available.'}
                      </pre>
                    </div>

                    {/* AI Root Cause Card */}
                    {currentIncident && (
                      <div className="p-4 rounded-lg bg-slate-900/80 border border-slate-800 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-xs text-slate-200 flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                            Diagnosis: {currentIncident.error_category}
                          </span>
                          <SourceBadge source={currentIncident.diagnosis_source} />
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          <strong className="text-slate-100">Root Cause:</strong> {currentIncident.probable_root_cause}
                        </p>
                        <p className="text-xs text-slate-400">
                          <strong className="text-slate-300">Allowlisted Action:</strong> {currentIncident.recommended_action} &bull; Confidence: {(currentIncident.confidence * 100).toFixed(0)}%
                        </p>
                        {currentIncident.verification_details && (
                          <div className="mt-2 p-2.5 rounded bg-[#090d16] border border-slate-800 font-mono text-[11px] text-emerald-400">
                            {currentIncident.verification_details}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-10 text-slate-400">
                    <Terminal className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="text-xs">No active execution. Click "Execute Test Workflow" above to run.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
