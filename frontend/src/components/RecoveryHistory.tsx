import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  History, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Layers 
} from 'lucide-react';
import { Incident } from '../types';
import { StatusBadge, SeverityBadge, SourceBadge } from './common/StatusBadge';

interface RecoveryHistoryProps {
  incidents: Incident[];
  onSelectIncident: (incident: Incident) => void;
  isLoading: boolean;
}

export const RecoveryHistory: React.FC<RecoveryHistoryProps> = ({
  incidents,
  onSelectIncident,
  isLoading,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [severityFilter, setSeverityFilter] = useState('ALL');

  const filteredIncidents = useMemo(() => {
    return incidents.filter((inc) => {
      const matchesSearch = 
        inc.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inc.error_category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inc.probable_root_cause.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inc.recommended_action.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === 'ALL' || inc.status === statusFilter;
      const matchesSeverity = severityFilter === 'ALL' || inc.severity === severityFilter;

      return matchesSearch && matchesStatus && matchesSeverity;
    });
  }, [incidents, searchQuery, statusFilter, severityFilter]);

  return (
    <div className="space-y-6">
      {/* Search and Filters Bar */}
      <div className="p-4 rounded-xl bg-[#0d131f] border border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 w-full sm:w-auto">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by ID, error category, root cause, or action..."
            className="w-full pl-9 pr-4 py-2 bg-[#090d16] border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Filter className="w-3.5 h-3.5" />
            <span>Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-[#090d16] border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="RECOVERED">Recovered</option>
              <option value="NEEDS_HUMAN_REVIEW">Needs Review</option>
              <option value="UNRESOLVED">Unresolved</option>
              <option value="DETECTED">Detected</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <span>Severity:</span>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="bg-[#090d16] border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="ALL">All Severities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="rounded-xl bg-[#0d131f] border border-slate-800/80 p-5 overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-100">Recovery & Incident Audit History</h3>
            <p className="text-xs text-slate-400">Chronological ledger of workflow exceptions, root causes, and verification outcomes</p>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            Showing {filteredIncidents.length} of {incidents.length} records
          </span>
        </div>

        {filteredIncidents.length === 0 ? (
          <div className="py-16 text-center text-slate-400 flex flex-col items-center justify-center">
            <History className="w-10 h-10 mb-2 opacity-30 text-indigo-400" />
            <h4 className="text-sm font-medium text-slate-300">No Matching Recovery Records</h4>
            <p className="text-xs text-slate-500 mt-1">Try adjusting your search query or filter settings.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-medium">
                  <th className="pb-3 font-semibold">Incident ID</th>
                  <th className="pb-3 font-semibold">Error Category</th>
                  <th className="pb-3 font-semibold">Severity</th>
                  <th className="pb-3 font-semibold">Diagnosis Source</th>
                  <th className="pb-3 font-semibold">Recovery Policy Action</th>
                  <th className="pb-3 font-semibold">Attempts</th>
                  <th className="pb-3 font-semibold">Final Status</th>
                  <th className="pb-3 font-semibold text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredIncidents.map((inc) => (
                  <tr
                    key={inc.id}
                    onClick={() => onSelectIncident(inc)}
                    className="hover:bg-slate-800/40 cursor-pointer transition-colors group"
                  >
                    <td className="py-3 font-mono text-indigo-400 font-semibold">
                      {inc.id}
                    </td>
                    <td className="py-3 font-medium text-slate-200">
                      {inc.error_category}
                    </td>
                    <td className="py-3">
                      <SeverityBadge severity={inc.severity} />
                    </td>
                    <td className="py-3">
                      <SourceBadge source={inc.diagnosis_source} />
                    </td>
                    <td className="py-3 font-mono text-slate-300">
                      {inc.recommended_action}
                    </td>
                    <td className="py-3 font-mono text-slate-400">
                      {inc.recovery_attempts.length} attempt{inc.recovery_attempts.length === 1 ? '' : 's'}
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
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 group-hover:text-white transition-colors"
                      >
                        Inspect &rarr;
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
