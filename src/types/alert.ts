// ============================================================
// Alert — system alerts and notifications
// ============================================================

export type AlertSeverity = 'info' | 'warning' | 'critical';
export type AlertCategory =
  | 'sensor'
  | 'rover'
  | 'wearable'
  | 'communication'
  | 'ai'
  | 'system'
  | 'hazard';

export interface Alert {
  id: string;
  severity: AlertSeverity;
  category: AlertCategory;
  title: string;
  message: string;
  /** ISO timestamp */
  timestamp: string;
  /** Has the operator acknowledged this alert */
  acknowledged: boolean;
  /** Linked hazard ID if applicable */
  hazardId: string | null;
  /** Linked wearable ID if applicable */
  wearableId: string | null;
}

export interface AlertState {
  alerts: Alert[];
  /** Count of unacknowledged alerts */
  activeCount: number;
}

export const INITIAL_ALERT_STATE: AlertState = {
  alerts: [],
  activeCount: 0,
};
