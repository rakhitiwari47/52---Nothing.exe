import React from 'react';
import { 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  Activity, 
  ArrowUpRight, 
  Play, 
  Clock, 
  Database,
  Layers,
  Sparkles
} from 'lucide-react';
import { DashboardSummary, Incident, WorkflowRun } from '../types';
import { StatusBadge, SeverityBadge, SourceBadge } from './common/StatusBadge';

interface OverviewDashboardProps {
  summary: DashboardSummary | null;
  onOpenSimulator: () => void;
  onSelectIncident: (incident: Incident) => void;
  onQuickRun: (scenario: string) => void;
  isLoading: boolean;
}

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({
  summary,
  onOpenSimulator,
  onSelectIncident,
  onQuickRun,
  isLoading,
}) => {
  if (isLoading && !summary) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-400 gap-3">
        <Activity className="w-8 h-8 animate-spin text-indigo-500" />
        <p className="text-sm font-medium">Loading live system telemetry...</p>
      </div>
    );
  }

  const totalIncidents = summary?.total_incidents || 0;
  const recovered = summary?.recovered_incidents || 0;
  const unresolved = summary?.unresolved_incidents || 0;
  const needsReview = summary?.needs_review_incidents || 0;
  const successRate = summary?.recovery_success_rate || 0.0;
  const recentIncidents = summary?.recent_incidents || [];
  const recentRuns = summary?.recent_runs || [];

  return (
    <div className="space-y-6">
      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Incidents */}
        <div className="p-5 rounded-xl bg-[#0d131f] border border-slate-800/80 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Incidents</span>
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-100 tracking-tight">{totalIncidents}</span>
            <span className="text-xs text-slate-400">from {summary?.total_workflow_runs || 0} runs</span>
          </div>
          <p className="mt-2 text-xs text-slate-400">All detected workflow anomalies</p>
        </div>

        {/* Card 2: Recovered */}
        <div className="p-5 rounded-xl bg-[#0d131f] border border-slate-800/80 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Self-Healed</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-emerald-400 tracking-tight">{recovered}</span>
            <span className="text-xs text-emerald-400/80 font-medium">Verified Clean</span>
          </div>
          <p className="mt-2 text-xs text-slate-400">Autonomously recovered & confirmed</p>
        </div>

        {/* Card 3: Unresolved & Needs Review */}
        <div className="p-5 rounded-xl bg-[#0d131f] border border-slate-800/80 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Escalated / Review</span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-amber-400 tracking-tight">{unresolved + needsReview}</span>
            <span className="text-xs text-slate-400">
              ({needsReview} review, {unresolved} unresolv.)
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-400">Safely quarantined per policy</p>
        </div>

        {/* Card 4: Success Rate */}
        <div className="p-5 rounded-xl bg-[#0d131f] border border-slate-800/80 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Auto-Recovery Rate</span>
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-indigo-400 tracking-tight">{successRate}%</span>
            <span className="text-xs text-slate-400">closed-loop</span>
          </div>
          <div className="mt-3 w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div 
              className="bg-indigo-500 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(successRate, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Quick Launch Control Strip */}
      <div className="p-5 rounded-xl bg-gradient-to-r from-indigo-950/40 via-[#0d131f] to-[#0d131f] border border-indigo-500/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-semibold text-slate-100">Live Hackathon Demonstration Runner</h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Dispatch a controlled failure scenario to trigger the closed-loop self-healing engine in real time.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <button
            onClick={() => onQuickRun('timeout')}
            className="flex-1 md:flex-initial px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors flex items-center gap-1.5"
          >
            <Play className="w-3 h-3 text-indigo-400" />
            Timeout (HTTP 504)
          </button>
          <button
            onClick={() => onQuickRun('rate_limit')}
            className="flex-1 md:flex-initial px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors flex items-center gap-1.5"
          >
            <Play className="w-3 h-3 text-amber-400" />
            Rate Limit (429)
          </button>
          <button
            onClick={() => onQuickRun('invalid_input')}
            className="flex-1 md:flex-initial px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors flex items-center gap-1.5"
          >
            <Play className="w-3 h-3 text-orange-400" />
            Schema Error
          </button>
          <button
            onClick={onOpenSimulator}
            className="flex-1 md:flex-initial px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-colors flex items-center gap-1"
          >
            Simulator &rarr;
          </button>
        </div>
      </div>

      {/* Main Content Split: Recent Incidents & Workflow Execution Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Recent Incidents Table (2 cols) */}
        <div className="lg:col-span-2 rounded-xl bg-[#0d131f] border border-slate-800/80 p-5 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-100">Recent Incidents</h3>
              <p className="text-xs text-slate-400">Captured failures and their automated recovery status</p>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              {recentIncidents.length} record{recentIncidents.length === 1 ? '' : 's'}
            </span>
          </div>

          {recentIncidents.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-12 text-center">
              <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 mb-3">
                <Layers className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-medium text-slate-200">No Incidents Recorded Yet</h4>
              <p className="text-xs text-slate-400 max-w-sm mt-1">
                The database is clean. Click below to launch a test scenario and watch HealFlow AI detect, diagnose, and recover automatically.
              </p>
              <button
                onClick={() => onQuickRun('timeout')}
                className="mt-4 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-indigo-600/20"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                Run 90s Live Demo
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-medium">
                    <th className="pb-3 font-semibold">Incident ID</th>
                    <th className="pb-3 font-semibold">Category</th>
                    <th className="pb-3 font-semibold">Severity</th>
                    <th className="pb-3 font-semibold">Diagnosis Source</th>
                    <th className="pb-3 font-semibold">Status</th>
                    <th className="pb-3 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {recentIncidents.map((inc) => (
                    <tr 
                      key={inc.id}
                      onClick={() => onSelectIncident(inc)}
                      className="hover:bg-slate-800/40 cursor-pointer transition-colors group"
                    >
                      <td className="py-3 font-mono text-indigo-400 font-medium">
                        {inc.id}
                      </td>
                      <td className="py-3 text-slate-300 font-medium">
                        {inc.error_category}
                      </td>
                      <td className="py-3">
                        <SeverityBadge severity={inc.severity} />
                      </td>
                      <td className="py-3">
                        <SourceBadge source={inc.diagnosis_source} />
                      </td>
                      <td className="py-3">
                        <StatusBadge status={inc.status} size="sm" />
                      </td>
                      <td className="py-3 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectIncident(inc);
                          }}
                          className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 group-hover:text-white transition-colors"
                        >
                          Details &rarr;
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Column: Execution Activity Stream (1 col) */}
        <div className="rounded-xl bg-[#0d131f] border border-slate-800/80 p-5 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-100">Execution Activity</h3>
              <p className="text-xs text-slate-400">Workflow simulation runs</p>
            </div>
            <Clock className="w-4 h-4 text-slate-400" />
          </div>

          {recentRuns.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-10 text-center text-slate-400">
              <Activity className="w-8 h-8 mb-2 opacity-40" />
              <p className="text-xs">No workflow runs logged yet.</p>
            </div>
          ) : (
            <div className="space-y-3 flex-1 overflow-y-auto">
              {recentRuns.map((run) => (
                <div 
                  key={run.id}
                  className="p-3 rounded-lg bg-slate-900/60 border border-slate-800/80 space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-200 text-xs truncate max-w-[160px]">
                      {run.workflow_name}
                    </span>
                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                      run.status === 'RECOVERED' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                      run.status === 'NEEDS_HUMAN_REVIEW' ? 'bg-amber-950 text-amber-400 border border-amber-800' :
                      'bg-rose-950 text-rose-400 border border-rose-800'
                    }`}>
                      {run.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span className="font-mono">{run.scenario}</span>
                    <span>{run.duration_ms}ms</span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    {new Date(run.started_at).toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
