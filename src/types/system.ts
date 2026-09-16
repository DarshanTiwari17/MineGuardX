// ============================================================
// SystemHealth — health status of all system subsystems
// ============================================================

export type SubsystemStatus = 'connected' | 'disconnected' | 'unavailable' | 'warning' | 'error';

export interface SubsystemHealth {
  status: SubsystemStatus;
  /** Optional human-readable status detail */
  detail: string | null;
  /** ISO timestamp of last status check */
  lastChecked: string | null;
  /** Response time in ms for services that can be pinged */
  responseTimeMs: number | null;
}

export interface SystemHealth {
  backend: SubsystemHealth;
  database: SubsystemHealth;
  roverConnection: SubsystemHealth;
  sensors: SubsystemHealth;
  cameras: SubsystemHealth;
  communication: SubsystemHealth;
  aiServices: SubsystemHealth;
}

const unavailableSubsystem = (): SubsystemHealth => ({
  status: 'unavailable',
  detail: null,
  lastChecked: null,
  responseTimeMs: null,
});

export const INITIAL_SYSTEM_HEALTH: SystemHealth = {
  backend: unavailableSubsystem(),
  database: unavailableSubsystem(),
  roverConnection: unavailableSubsystem(),
  sensors: unavailableSubsystem(),
  cameras: unavailableSubsystem(),
  communication: unavailableSubsystem(),
  aiServices: unavailableSubsystem(),
};
