export type ScenarioType = 'timeout' | 'rate_limit' | 'invalid_input' | 'unrecoverable';

export type IncidentStatus = 
  | 'DETECTED' 
  | 'DIAGNOSING' 
  | 'RECOVERING' 
  | 'RECOVERED' 
  | 'NEEDS_HUMAN_REVIEW' 
  | 'UNRESOLVED';

export type SeverityType = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type VerificationStatus = 'PENDING' | 'PASSED' | 'FAILED' | 'SKIPPED';

export type DiagnosisSource = 'AI_LLM' | 'FALLBACK_RULES' | 'HUMAN_OPERATOR';

export interface WorkflowDefinition {
  id: string;
  name: string;
  scenario: ScenarioType;
  description: string;
  expected_failure: string;
  recovery_strategy: string;
  severity: SeverityType;
  default_payload: Record<string, any>;
}

export interface RecoveryAttempt {
  id: string;
  incident_id: string;
  attempt_number: number;
  action_type: string;
  action_description: string;
  status: 'SUCCESS' | 'FAILED' | 'BLOCKED' | 'ESCALATED';
  result: string;
  execution_time_ms: number;
  created_at: string;
}

export interface Incident {
  id: string;
  workflow_run_id: string;
  error_category: string;
  severity: SeverityType;
  error_message: string;
  sanitized_logs: string;
  diagnosis: string;
  probable_root_cause: string;
  confidence: number;
  recommended_action: string;
  recovery_possible: boolean;
  requires_human_approval: boolean;
  status: IncidentStatus;
  diagnosis_source: DiagnosisSource;
  verification_status: VerificationStatus;
  verification_details?: string;
  created_at: string;
  resolved_at?: string;
  recovery_attempts: RecoveryAttempt[];
}

export interface WorkflowRun {
  id: string;
  workflow_name: string;
  scenario: ScenarioType;
  status: string;
  started_at: string;
  completed_at?: string;
  duration_ms?: number;
  input_payload?: string;
  output_payload?: string;
  error_message?: string;
  incidents: Incident[];
}

export interface DashboardSummary {
  total_incidents: number;
  recovered_incidents: number;
  unresolved_incidents: number;
  needs_review_incidents: number;
  recovery_success_rate: number;
  total_workflow_runs: number;
  recent_incidents: Incident[];
  recent_runs: WorkflowRun[];
  system_status: string;
}

export interface SafetyLimits {
  max_recovery_retries: number;
  recovery_timeout_seconds: number;
  rate_limit_backoff_max_wait: number;
  allowlisted_recovery_actions: string[];
}

export interface SettingsStatus {
  app_name: string;
  app_env: string;
  database_engine: string;
  database_connected: boolean;
  ai_provider: string;
  ai_configured: boolean;
  ai_model_name?: string;
  safety_limits: SafetyLimits;
  demo_mode: boolean;
}

export interface SystemHealth {
  status: string;
  app: string;
  environment: string;
  database_connected: boolean;
  ai_engine: string;
  timestamp: string;
}
