// ============================================================
// thingSpeakService.ts — Multi-Channel ThingSpeak Adapter & Service
// Fetches telemetry from Channel 3499946 & Channel 3500118 concurrently
// Maps raw feeds to EnvironmentalReading / EnvironmentSnapshot
// ============================================================

import type {
  EnvironmentSnapshot,
  EnvironmentalReading,
  EnvironmentalSensor,
  EnvironmentHistory,
  SensorData,
  DataFreshness,
  SensorStatus,
} from '../types/sensors';
import { emitEnvironmentUpdate, saveEnvironmentSnapshot } from './environmentBus';

export interface ChannelConfig {
  channelId: string;
  readApiKey?: string;
}

// Configured ThingSpeak channels
export const THINGSPEAK_CHANNELS: ChannelConfig[] = [
  {
    channelId:
      (import.meta.env.VITE_THINGSPEAK_CHANNEL_ID_1 as string) ||
      (import.meta.env.VITE_THINGSPEAK_CHANNEL_ID as string) ||
      '3499946',
    readApiKey:
      (import.meta.env.VITE_THINGSPEAK_READ_API_KEY_1 as string) ||
      (import.meta.env.VITE_THINGSPEAK_READ_API_KEY as string) ||
      'RF6N7LZ9Z0SXD4ON',
  },
  {
    channelId:
      (import.meta.env.VITE_THINGSPEAK_CHANNEL_ID_2 as string) || '3500118',
    readApiKey:
      (import.meta.env.VITE_THINGSPEAK_READ_API_KEY_2 as string) ||
      '86MFI2630J8IU3Y3',
  },
];

export const THINGSPEAK_POLL_INTERVAL_MS = Number(
  import.meta.env.VITE_THINGSPEAK_POLL_INTERVAL_MS || 15000
);

const BASE_URL_PREFIX = 'https://api.thingspeak.com/channels';

export interface ThingSpeakFeedEntry {
  created_at: string;
  entry_id: number;
  field1?: string | null;
  field2?: string | null;
  field3?: string | null;
  field4?: string | null;
  field5?: string | null;
}

export interface ThingSpeakChannelMeta {
  id: number;
  name: string;
  description?: string;
  field1?: string;
  field2?: string;
  field3?: string;
  field4?: string;
  field5?: string;
  last_entry_id?: number;
}

export interface ThingSpeakHistoryResponse {
  channel: ThingSpeakChannelMeta;
  feeds: ThingSpeakFeedEntry[];
}

export interface ChannelFetchResult {
  config: ChannelConfig;
  latest: ThingSpeakFeedEntry | null;
  history: ThingSpeakHistoryResponse | null;
}

/**
 * Determine data freshness state based on the ThingSpeak created_at timestamp
 */
export function calculateFreshness(timestampISO: string | null): DataFreshness {
  if (!timestampISO) return 'UNAVAILABLE';
  const timestampMs = new Date(timestampISO).getTime();
  if (isNaN(timestampMs)) return 'UNAVAILABLE';

  const ageMs = Date.now() - timestampMs;

  // Freshness thresholds
  // <= 2 minutes: LIVE
  // 2 to 10 minutes: STALE
  // > 10 minutes: OFFLINE
  if (ageMs <= 2 * 60 * 1000) {
    return 'LIVE';
  } else if (ageMs <= 10 * 60 * 1000) {
    return 'STALE';
  } else {
    return 'OFFLINE';
  }
}

/**
 * Helper to build an unavailable reading structure
 */
function createUnavailableReading(sensorType: string, parameter: string): EnvironmentalReading {
  return {
    sensorId: `TS-${parameter.toUpperCase().replace(/\s+/g, '_')}`,
    sensorType,
    parameter,
    value: null,
    unit: '',
    timestamp: null,
    status: 'offline',
    dataFreshness: 'UNAVAILABLE',
    source: 'ThingSpeak',
  };
}

/**
 * Convert a raw ThingSpeak field entry to an EnvironmentalReading
 */
function parseFieldReading(
  rawFieldVal: string | null | undefined,
  timestampISO: string | null,
  sensorType: string,
  parameter: string,
  thresholdHigh: number | null = null
): EnvironmentalReading {
  if (rawFieldVal === null || rawFieldVal === undefined || rawFieldVal.trim() === '') {
    return createUnavailableReading(sensorType, parameter);
  }

  const numericVal = parseFloat(rawFieldVal);
  if (isNaN(numericVal)) {
    return createUnavailableReading(sensorType, parameter);
  }

  const freshness = calculateFreshness(timestampISO);
  let status: SensorStatus = freshness === 'LIVE' ? 'ok' : freshness === 'STALE' ? 'stale' : 'offline';

  if (thresholdHigh !== null && numericVal > thresholdHigh && status === 'ok') {
    status = 'warning';
  }

  return {
    sensorId: `TS-${parameter.toUpperCase().replace(/\s+/g, '_')}`,
    sensorType,
    parameter,
    value: numericVal,
    unit: '',
    timestamp: timestampISO,
    status,
    dataFreshness: freshness,
    source: 'ThingSpeak',
    thresholdHigh,
  };
}

/**
 * Fetch latest entry from a single ThingSpeak channel
 */
async function fetchChannelLatest(config: ChannelConfig): Promise<ThingSpeakFeedEntry | null> {
  try {
    const url = config.readApiKey
      ? `${BASE_URL_PREFIX}/${config.channelId}/feeds/last.json?api_key=${config.readApiKey}`
      : `${BASE_URL_PREFIX}/${config.channelId}/feeds/last.json`;

    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data || typeof data !== 'object' || !data.created_at) return null;
    return data as ThingSpeakFeedEntry;
  } catch (err) {
    console.warn(`[ThingSpeakService] Error fetching channel ${config.channelId} latest:`, err);
    return null;
  }
}

/**
 * Fetch historical entries from a single ThingSpeak channel
 */
async function fetchChannelHistory(config: ChannelConfig): Promise<ThingSpeakHistoryResponse | null> {
  try {
    const url = config.readApiKey
      ? `${BASE_URL_PREFIX}/${config.channelId}/feeds.json?results=50&api_key=${config.readApiKey}`
      : `${BASE_URL_PREFIX}/${config.channelId}/feeds.json?results=50`;

    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data || typeof data !== 'object' || !Array.isArray(data.feeds)) return null;
    return data as ThingSpeakHistoryResponse;
  } catch (err) {
    console.warn(`[ThingSpeakService] Error fetching channel ${config.channelId} history:`, err);
    return null;
  }
}

/**
 * Fetch data concurrently across all configured channels
 */
export async function fetchAllChannels(): Promise<ChannelFetchResult[]> {
  return Promise.all(
    THINGSPEAK_CHANNELS.map(async (config) => {
      const [latest, history] = await Promise.all([
        fetchChannelLatest(config),
        fetchChannelHistory(config),
      ]);
      return { config, latest, history };
    })
  );
}

// Backward compatibility exports
export async function getThingSpeakLatest(): Promise<ThingSpeakFeedEntry | null> {
  const results = await fetchAllChannels();
  return results[0]?.latest || null;
}

export async function getThingSpeakHistory(): Promise<ThingSpeakHistoryResponse | null> {
  const results = await fetchAllChannels();
  return results[0]?.history || null;
}

/**
 * Parse a channel's feed fields according to metadata or standard mappings
 */
function extractReadingsFromChannel(
  latestEntry: ThingSpeakFeedEntry | null,
  meta: ThingSpeakChannelMeta | undefined,
  timestampISO: string | null
): { methane?: EnvironmentalReading; co?: EnvironmentalReading; distance?: EnvironmentalReading } {
  if (!latestEntry) return {};

  const out: { methane?: EnvironmentalReading; co?: EnvironmentalReading; distance?: EnvironmentalReading } = {};

  // Check channel field labels in metadata if available
  const f1Name = (meta?.field1 || '').toLowerCase();
  const f2Name = (meta?.field2 || '').toLowerCase();
  const f3Name = (meta?.field3 || '').toLowerCase();

  // Field 1 mapping
  if (latestEntry.field1 !== null && latestEntry.field1 !== undefined) {
    if (f1Name.includes('distance')) {
      out.distance = parseFieldReading(latestEntry.field1, timestampISO, 'Distance Sensor', 'Distance');
    } else if (f1Name.includes('co') && !f1Name.includes('methane')) {
      out.co = parseFieldReading(latestEntry.field1, timestampISO, 'MQ-7 Gas Sensor', 'Carbon Monoxide');
    } else {
      // Default Channel 3499946 field1 -> Methane
      out.methane = parseFieldReading(latestEntry.field1, timestampISO, 'MQ-4 Gas Sensor', 'Methane');
    }
  }

  // Field 2 mapping
  if (latestEntry.field2 !== null && latestEntry.field2 !== undefined) {
    if (f2Name.includes('distance')) {
      out.distance = parseFieldReading(latestEntry.field2, timestampISO, 'Distance Sensor', 'Distance');
    } else {
      // Default Channel 3499946 field2 -> Carbon Monoxide
      out.co = parseFieldReading(latestEntry.field2, timestampISO, 'MQ-7 Gas Sensor', 'Carbon Monoxide');
    }
  }

  // Field 3 mapping
  if (latestEntry.field3 !== null && latestEntry.field3 !== undefined) {
    if (f3Name.includes('methane')) {
      out.methane = parseFieldReading(latestEntry.field3, timestampISO, 'MQ-4 Gas Sensor', 'Methane');
    } else {
      // Default Channel 3499946 field3 -> Distance
      out.distance = parseFieldReading(latestEntry.field3, timestampISO, 'Distance Sensor', 'Distance');
    }
  }

  return out;
}

/**
 * Adapt raw ThingSpeak multi-channel data into EnvironmentSnapshot
 */
export function adaptMultiChannelToSnapshot(
  channelResults: ChannelFetchResult[],
  previousSnapshot?: EnvironmentSnapshot | null
): EnvironmentSnapshot {
  let bestMethane: EnvironmentalReading = createUnavailableReading('MQ-4 Gas Sensor', 'Methane');
  let bestCo: EnvironmentalReading = createUnavailableReading('MQ-7 Gas Sensor', 'Carbon Monoxide');
  let bestDistance: EnvironmentalReading = createUnavailableReading('Distance Sensor', 'Distance');

  const combinedHistory: EnvironmentHistory[] = [];
  const sensors: EnvironmentalSensor[] = [];
  let latestCommTimestamp: string | null = null;

  channelResults.forEach(({ config, latest, history }) => {
    const timestampISO = latest?.created_at || history?.feeds?.slice(-1)[0]?.created_at || null;
    if (timestampISO) {
      if (!latestCommTimestamp || new Date(timestampISO) > new Date(latestCommTimestamp)) {
        latestCommTimestamp = timestampISO;
      }
    }

    const channelMeta = history?.channel;
    const extracted = extractReadingsFromChannel(latest, channelMeta, timestampISO);

    // Merge methane if valid
    if (extracted.methane && extracted.methane.value !== null) {
      if (bestMethane.value === null || (timestampISO && new Date(timestampISO) >= new Date(bestMethane.timestamp || 0))) {
        bestMethane = extracted.methane;
      }
    }

    // Merge CO if valid
    if (extracted.co && extracted.co.value !== null) {
      if (bestCo.value === null || (timestampISO && new Date(timestampISO) >= new Date(bestCo.timestamp || 0))) {
        bestCo = extracted.co;
      }
    }

    // Merge Distance if valid
    if (extracted.distance && extracted.distance.value !== null) {
      if (bestDistance.value === null || (timestampISO && new Date(timestampISO) >= new Date(bestDistance.timestamp || 0))) {
        bestDistance = extracted.distance;
      }
    }

    // Extract historical feeds
    if (history && Array.isArray(history.feeds)) {
      const f1Name = (channelMeta?.field1 || '').toLowerCase();
      const f2Name = (channelMeta?.field2 || '').toLowerCase();
      const f3Name = (channelMeta?.field3 || '').toLowerCase();

      history.feeds.forEach((feed) => {
        const feedTime = feed.created_at;

        // Field 1
        if (feed.field1 !== null && feed.field1 !== undefined && feed.field1.trim() !== '') {
          const val = parseFloat(feed.field1);
          if (!isNaN(val)) {
            const isDist = f1Name.includes('distance');
            const paramName = isDist ? 'Distance' : 'Methane (MQ-4)';
            const sensorId = isDist ? `TS-${config.channelId}-DIST` : `TS-${config.channelId}-MQ4`;
            combinedHistory.push({
              id: `hist-${config.channelId}-f1-${feed.entry_id}`,
              timestamp: feedTime,
              sensorId,
              parameter: paramName,
              value: val,
              unit: '',
              status: 'ok',
            });
          }
        }

        // Field 2
        if (feed.field2 !== null && feed.field2 !== undefined && feed.field2.trim() !== '') {
          const val = parseFloat(feed.field2);
          if (!isNaN(val)) {
            combinedHistory.push({
              id: `hist-${config.channelId}-f2-${feed.entry_id}`,
              timestamp: feedTime,
              sensorId: `TS-${config.channelId}-MQ7`,
              parameter: 'Carbon Monoxide (MQ-7)',
              value: val,
              unit: '',
              status: 'ok',
            });
          }
        }

        // Field 3
        if (feed.field3 !== null && feed.field3 !== undefined && feed.field3.trim() !== '') {
          const val = parseFloat(feed.field3);
          if (!isNaN(val)) {
            const isMethane = f3Name.includes('methane');
            const paramName = isMethane ? 'Methane (MQ-4)' : 'Distance';
            const sensorId = isMethane ? `TS-${config.channelId}-MQ4` : `TS-${config.channelId}-DIST`;
            combinedHistory.push({
              id: `hist-${config.channelId}-f3-${feed.entry_id}`,
              timestamp: feedTime,
              sensorId,
              parameter: paramName,
              value: val,
              unit: '',
              status: 'ok',
            });
          }
        }
      });
    }
  });

  // Sort history chronologically
  combinedHistory.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  // Currently unprovided fields
  const co2 = createUnavailableReading('CO2 Sensor', 'Carbon Dioxide');
  const h2s = createUnavailableReading('H2S Sensor', 'Hydrogen Sulfide');
  const o2 = createUnavailableReading('O2 Sensor', 'Oxygen');
  const temperature = createUnavailableReading('Temp Sensor', 'Temperature');
  const humidity = createUnavailableReading('Humidity Sensor', 'Humidity');

  const readings: SensorData = {
    methane: bestMethane,
    co: bestCo,
    co2,
    h2s,
    o2,
    temperature,
    humidity,
    distance: bestDistance,
  };

  // Sensor health items
  if (bestMethane.value !== null) {
    sensors.push({
      sensorId: 'TS-MQ4',
      sensorType: 'MQ-4 Methane',
      parameters: ['Methane'],
      status: bestMethane.dataFreshness === 'LIVE' ? 'CONNECTED' : 'STALE',
      lastCommunication: bestMethane.timestamp,
      location: { x: 120, y: 85, z: -15, zone: 'Sub-Level 2' },
      errorState: null,
    });
  }
  if (bestCo.value !== null) {
    sensors.push({
      sensorId: 'TS-MQ7',
      sensorType: 'MQ-7 Carbon Monoxide',
      parameters: ['Carbon Monoxide'],
      status: bestCo.dataFreshness === 'LIVE' ? 'CONNECTED' : 'STALE',
      lastCommunication: bestCo.timestamp,
      location: { x: 120, y: 85, z: -15, zone: 'Sub-Level 2' },
      errorState: null,
    });
  }
  if (bestDistance.value !== null) {
    sensors.push({
      sensorId: 'TS-DISTANCE',
      sensorType: 'Distance Sensor',
      parameters: ['Distance'],
      status: bestDistance.dataFreshness === 'LIVE' ? 'CONNECTED' : 'STALE',
      lastCommunication: bestDistance.timestamp,
      location: { x: 120, y: 85, z: -15, zone: 'Sub-Level 2' },
      errorState: null,
    });
  }

  // Evaluate overall environmental status
  let overallStatus: EnvironmentSnapshot['overallStatus'] = 'NORMAL';
  const hasLiveReading = [bestMethane, bestCo, bestDistance].some((r) => r.dataFreshness === 'LIVE');
  const hasWarning = [bestMethane, bestCo, bestDistance].some((r) => r.status === 'warning' || r.status === 'critical');

  if (hasWarning) {
    overallStatus = 'WARNING';
  } else if (!hasLiveReading) {
    const hasStale = [bestMethane, bestCo, bestDistance].some((r) => r.dataFreshness === 'STALE');
    overallStatus = hasStale ? 'WARNING' : 'UNKNOWN';
  }

  // If fetch failed completely across all channels and previous snapshot exists
  const allFailed = channelResults.every((r) => !r.latest);
  if (allFailed && previousSnapshot) {
    return {
      ...previousSnapshot,
      overallStatus: 'OFFLINE',
    };
  }

  const channelIdsStr = THINGSPEAK_CHANNELS.map((c) => c.channelId).join(', ');

  return {
    readings,
    sensors,
    overallStatus,
    history: combinedHistory,
    dataSource: `ThingSpeak (Channels ${channelIdsStr})`,
    lastUpdated: latestCommTimestamp,
  };
}

let pollingIntervalId: number | null = null;
let currentSnapshot: EnvironmentSnapshot | null = null;

/**
 * Perform a single poll cycle across all channels and broadcast the snapshot update
 */
export async function pollThingSpeakOnce(): Promise<EnvironmentSnapshot> {
  const channelResults = await fetchAllChannels();
  const snapshot = adaptMultiChannelToSnapshot(channelResults, currentSnapshot);
  currentSnapshot = snapshot;
  saveEnvironmentSnapshot(snapshot);
  emitEnvironmentUpdate(snapshot);
  return snapshot;
}

/**
 * Start periodic polling loop for all ThingSpeak channels
 */
export function startThingSpeakPolling(intervalMs: number = THINGSPEAK_POLL_INTERVAL_MS): () => void {
  if (pollingIntervalId !== null) {
    window.clearInterval(pollingIntervalId);
  }

  // Trigger initial fetch immediately
  pollThingSpeakOnce().catch((err) => {
    console.error('[ThingSpeakService] Error during initial multi-channel poll:', err);
  });

  pollingIntervalId = window.setInterval(() => {
    pollThingSpeakOnce().catch((err) => {
      console.error('[ThingSpeakService] Error during periodic multi-channel poll:', err);
    });
  }, intervalMs);

  return () => {
    if (pollingIntervalId !== null) {
      window.clearInterval(pollingIntervalId);
      pollingIntervalId = null;
    }
  };
}
