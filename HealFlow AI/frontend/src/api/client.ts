import {
  DashboardSummary,
  WorkflowDefinition,
  WorkflowRun,
  Incident,
  RecoveryAttempt,
  SettingsStatus,
  SystemHealth
} from '../types';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

class ApiClient {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${BASE_URL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        let errorMsg = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errData = await response.json();
          if (errData && errData.detail) {
            errorMsg = errData.detail;
          }
        } catch (_) {
          // ignore parsing error
        }
        throw new Error(errorMsg);
      }

      return (await response.json()) as T;
    } catch (err: any) {
      if (err.message && err.message.includes('Failed to fetch')) {
        throw new Error('Backend server is unreachable. Ensure the FastAPI backend is running on port 8000.');
      }
      throw err;
    }
  }

  // Health
  async getHealth(): Promise<SystemHealth> {
    return this.request<SystemHealth>('/health');
  }

  // Dashboard Summary
  async getDashboardSummary(): Promise<DashboardSummary> {
    return this.request<DashboardSummary>('/api/dashboard/summary');
  }

  // Workflows
  async getWorkflows(): Promise<WorkflowDefinition[]> {
    return this.request<WorkflowDefinition[]>('/api/workflows');
  }

  async runWorkflow(
    scenario: string,
    customPayload?: Record<string, any>,
    workflowName?: string
  ): Promise<WorkflowRun> {
    return this.request<WorkflowRun>('/api/workflows/run', {
      method: 'POST',
      body: JSON.stringify({
        scenario,
        custom_payload: customPayload,
        workflow_name: workflowName,
      }),
    });
  }

  async getWorkflowRuns(limit = 50): Promise<WorkflowRun[]> {
    return this.request<WorkflowRun[]>(`/api/workflows/runs?limit=${limit}`);
  }

  // Incidents
  async getIncidents(status?: string, severity?: string, limit = 50): Promise<Incident[]> {
    const params = new URLSearchParams();
    if (status && status !== 'ALL') params.append('status', status);
    if (severity && severity !== 'ALL') params.append('severity', severity);
    params.append('limit', limit.toString());
    return this.request<Incident[]>(`/api/incidents?${params.toString()}`);
  }

  async getIncident(incidentId: string): Promise<Incident> {
    return this.request<Incident>(`/api/incidents/${incidentId}`);
  }

  async manualRecover(
    incidentId: string,
    remediationPayload?: Record<string, any>,
    action = 'approve_remediation'
  ): Promise<Incident> {
    return this.request<Incident>(`/api/incidents/${incidentId}/recover`, {
      method: 'POST',
      body: JSON.stringify({
        action,
        remediation_payload: remediationPayload,
      }),
    });
  }

  // Recovery History
  async getRecoveryHistory(limit = 50): Promise<RecoveryAttempt[]> {
    return this.request<RecoveryAttempt[]>(`/api/recovery-history?limit=${limit}`);
  }

  // Settings
  async getSettingsStatus(): Promise<SettingsStatus> {
    return this.request<SettingsStatus>('/api/settings/status');
  }

  // Demo Reset
  async resetDemoData(): Promise<{ status: string; message: string }> {
    return this.request<{ status: string; message: string }>('/api/demo/reset', {
      method: 'POST',
      body: JSON.stringify({ confirm: true }),
    });
  }
}

export const api = new ApiClient();
