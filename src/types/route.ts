// ============================================================
// RescueRoute — dynamic rescue route planner data
// ============================================================

export type RouteStatus =
  | 'calculating'
  | 'active'
  | 'completed'
  | 'aborted'
  | 'no_route';

export type RouteRiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface RouteWaypoint {
  id: string;
  x: number;
  y: number;
  zone: string;
  label: string | null;
  /** True if rover has already passed this waypoint */
  visited: boolean;
}

export interface RescueRoute {
  id: string;
  /** Wearable ID of the miner being rescued */
  targetWearableId: string | null;
  /** Display name of the target miner */
  targetMinerName: string | null;
  status: RouteStatus;
  /** Planned distance in metres */
  distanceMetres: number | null;
  /** Estimated time of arrival in seconds */
  etaSeconds: number | null;
  riskLevel: RouteRiskLevel | null;
  waypoints: RouteWaypoint[];
  /** ISO timestamp when this route was computed */
  calculatedAt: string | null;
  /** ISO timestamp of last route update (replanning) */
  lastUpdated: string | null;
}

export const INITIAL_ROUTE: RescueRoute | null = null;
