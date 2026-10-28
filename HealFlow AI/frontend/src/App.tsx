import React, { useState, useEffect, useCallback } from 'react';
import { api } from './api/client';
import { 
  DashboardSummary, 
  WorkflowDefinition, 
  Incident, 
  SystemHealth, 
  WorkflowRun,
  SettingsStatus 
} from './types';
import { Sidebar, TabType } from './components/Sidebar';
import { Header } from './components/Header';
import { OverviewDashboard } from './components/OverviewDashboard';
import { WorkflowSimulator } from './components/WorkflowSimulator';
import { RecoveryHistory } from './components/RecoveryHistory';
import { SettingsView } from './components/SettingsView';
import { IncidentDetailsModal } from './components/IncidentDetailsModal';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<TabType>('overview');
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [workflows, setWorkflows] = useState<WorkflowDefinition[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [settings, setSettings] = useState<SettingsStatus | null>(null);
  const [preselectedScenario, setPreselectedScenario] = useState<string>('timeout');
  
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isRunningWorkflow, setIsRunningWorkflow] = useState<boolean>(false);
  const [isRecovering, setIsRecovering] = useState<boolean>(false);
  const [isResetting, setIsResetting] = useState<boolean>(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  const loadData = useCallback(async (quiet = false) => {
    if (!quiet) setIsRefreshing(true);
    try {
      const [healthData, summaryData, workflowsData, incidentsData, settingsData] = await Promise.all([
        api.getHealth().catch(() => null),
        api.getDashboardSummary().catch(() => null),
        api.getWorkflows().catch(() => []),
        api.getIncidents().catch(() => []),
        api.getSettingsStatus().catch(() => null),
      ]);

      if (healthData) setHealth(healthData);
      if (summaryData) setSummary(summaryData);
      if (workflowsData.length > 0) setWorkflows(workflowsData);
      if (settingsData) setSettings(settingsData);
      setIncidents(incidentsData);
    } catch (err: any) {
      console.error('Failed to load telemetry:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    // Background polling every 12 seconds
    const interval = setInterval(() => {
      loadData(true);
    }, 12000);
    return () => clearInterval(interval);
  }, [loadData]);

  const handleExecuteWorkflow = async (scenario: string, payload?: Record<string, any>): Promise<WorkflowRun> => {
    setIsRunningWorkflow(true);
    try {
      const run = await api.runWorkflow(scenario, payload);
      await loadData(true);
      
      const inc = run.incidents?.[0];
      if (run.status === 'RECOVERED') {
        showToast(`Workflow self-healed! Verification assertion passed for ${run.workflow_name}.`, 'success');
      } else if (run.status === 'NEEDS_HUMAN_REVIEW') {
        showToast(`Workflow quarantined. Missing mandatory field requires human review.`, 'info');
      } else {
        showToast(`Unrecoverable incident halted by policy and escalated to operations.`, 'error');
      }

      return run;
    } catch (err: any) {
      showToast(err.message || 'Execution failed', 'error');
      throw err;
    } finally {
      setIsRunningWorkflow(false);
    }
  };

  const handleQuickRun = (scenario: string) => {
    setPreselectedScenario(scenario);
    setCurrentTab('simulator');
  };

  const handleManualRecover = async (incidentId: string, payload?: Record<string, any>) => {
    setIsRecovering(true);
    try {
      const updatedIncident = await api.manualRecover(incidentId, payload);
      setSelectedIncident(updatedIncident);
      await loadData(true);
      showToast(`Remediation payload submitted! Incident ${updatedIncident.id} verified and recovered.`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Remediation failed', 'error');
    } finally {
      setIsRecovering(false);
    }
  };

  const handleResetDemo = async () => {
    setIsResetting(true);
    try {
      await api.resetDemoData();
      await loadData();
      showToast('Demo data safely reset. Database is clean for next run.', 'info');
    } catch (err: any) {
      showToast(err.message || 'Reset failed', 'error');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#090d16] text-slate-100 overflow-hidden font-sans">
      {/* Sidebar */}
      <Sidebar 
        currentTab={currentTab} 
        onSelectTab={setCurrentTab} 
        health={health} 
      />

      {/* Main App Container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <Header
          currentTab={currentTab}
          onOpenSimulator={() => setCurrentTab('simulator')}
          onRefresh={() => loadData(false)}
          isRefreshing={isRefreshing}
          health={health}
        />

        {/* Dynamic View Body */}
        <main className="flex-1 overflow-y-auto p-8">
          {currentTab === 'overview' && (
            <OverviewDashboard
              summary={summary}
              onOpenSimulator={() => setCurrentTab('simulator')}
              onSelectIncident={setSelectedIncident}
              onQuickRun={handleQuickRun}
              isLoading={isLoading}
            />
          )}

          {currentTab === 'simulator' && (
            <WorkflowSimulator
              workflows={workflows}
              onExecute={handleExecuteWorkflow}
              onSelectIncident={setSelectedIncident}
              isRunning={isRunningWorkflow}
              preselectedScenario={preselectedScenario}
            />
          )}

          {currentTab === 'incidents' && (
            <RecoveryHistory
              incidents={incidents}
              onSelectIncident={setSelectedIncident}
              isLoading={isLoading}
            />
          )}

          {currentTab === 'recovery' && (
            <RecoveryHistory
              incidents={incidents}
              onSelectIncident={setSelectedIncident}
              isLoading={isLoading}
            />
          )}

          {currentTab === 'settings' && (
            <SettingsView
              settings={settings}
              health={health}
              onResetDemo={handleResetDemo}
              isResetting={isResetting}
            />
          )}
        </main>
      </div>

      {/* Toast Alert */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl border shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom duration-300 text-xs font-medium ${
          toast.type === 'success' 
            ? 'bg-emerald-950/90 border-emerald-700/80 text-emerald-200' 
            : toast.type === 'error'
            ? 'bg-rose-950/90 border-rose-700/80 text-rose-200'
            : 'bg-indigo-950/90 border-indigo-700/80 text-indigo-200'
        }`}>
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span>{toast.message}</span>
          <button 
            onClick={() => setToast(null)}
            className="p-1 hover:bg-white/10 rounded ml-2"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Incident Details Dossier Modal */}
      <IncidentDetailsModal
        incident={selectedIncident}
        onClose={() => setSelectedIncident(null)}
        onManualRecover={handleManualRecover}
        isRecovering={isRecovering}
      />
    </div>
  );
};
