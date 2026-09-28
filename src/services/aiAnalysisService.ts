import type {
  EnvironmentSnapshot,
  HazardState,
  LiveMonitoringState,
  RoverState,
} from '../types';
import type { YoloDetectionResult } from '../hooks/useYoloPoseDetection';

export interface AIAnalysis {
  risk_level: string;
  summary: string;
  threats: { type: string; severity: string; reason: string }[];
  recommendations: { priority: string; action: string; reason: string }[];
  rover_action: string;
  human_action: string;
  monitoring_required: string[];
  confidence: number;
}

export interface AIAnalysisSnapshot {
  rover: RoverState;
  environment: EnvironmentSnapshot;
  hazards: HazardState;
  cameras: LiveMonitoringState;
}

export interface AIAnalysisResult {
  analysis: AIAnalysis;
  provider: string;
}

const SYSTEM_PROMPT = `You are the MineGuard-X AI safety analysis assistant.

Analyze the supplied structured mine and rover data.

Use ONLY the information provided.
Never invent sensor readings, hazards, detections or events.
Identify important safety risks and explain them clearly.
Provide practical recommendations based on the available data.

Return ONLY valid JSON matching the requested output schema.

{
  "risk_level": "LOW|MEDIUM|HIGH|CRITICAL",
  "summary": "short explanation",
  "threats": [
    { "type": "...", "severity": "...", "reason": "..." }
  ],
  "recommendations": [
    { "priority": "...", "action": "...", "reason": "..." }
  ],
  "rover_action": "CONTINUE|SLOW DOWN|STOP|RETURN_TO_BASE",
  "human_action": "...",
  "monitoring_required": ["..."],
  "confidence": 0.95
}`;

function buildYoloSummary(yolo: YoloDetectionResult): string {
  if (!yolo.timestamp || yolo.people_detected === 0) {
    return 'No persons detected by AI camera system.';
  }

  const lines = [`People detected: ${yolo.people_detected}`, ''];
  yolo.detections.forEach((person) => {
    lines.push(`Person ${person.id}: ${person.fall_confirmed ? 'FALL (confirmed)' : 'STANDING'}`);
  });

  if (yolo.any_fall) {
    lines.push('');
    const fallen = yolo.detections
      .filter((person) => person.fall_confirmed)
      .map((person) => `Person ${person.id}`)
      .join(', ');
    lines.push(`Confirmed fall(s): ${fallen}`);
  }

  return lines.join('\n');
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown error.';
}

async function parseAnalysisResponse(response: Response): Promise<AIAnalysis> {
  const data = await response.json() as {
    choices?: { message?: { content?: string | null } }[];
    detail?: string;
  };
  if (!response.ok) {
    throw new Error(data.detail || `Request failed with HTTP ${response.status}.`);
  }

  const content = data.choices?.[0]?.message?.content;
  if (typeof content !== 'string') {
    throw new Error('AI response did not contain a completion.');
  }

  const cleaned = content.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
  return JSON.parse(cleaned) as AIAnalysis;
}

async function requestBackupAnalysis(messages: { role: string; content: string }[]): Promise<AIAnalysis> {
  const endpoint = import.meta.env.DEV
    ? 'http://127.0.0.1:8765/ai/analyze'
    : '/.netlify/functions/grok-analysis';
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages,
      response_format: { type: 'json_object' },
      temperature: 0.1,
    }),
  });

  return parseAnalysisResponse(response);
}

export async function analyzeMineData(
  snapshot: AIAnalysisSnapshot,
  yoloData: YoloDetectionResult,
): Promise<AIAnalysisResult> {
  const { rover, environment, hazards, cameras } = snapshot;
  const hasCritical = hazards.activeHazards.some((hazard) => hazard.severity === 'critical');
  const hasHigh = hazards.activeHazards.some((hazard) => hazard.severity === 'high');
  const riskLevel = hasCritical ? 'CRITICAL' : hasHigh ? 'HIGH' : hazards.activeHazards.length > 0 ? 'MEDIUM' : 'LOW';

  const mineData = {
    timestamp: new Date().toISOString(),
    mine_status: {
      overall_status: riskLevel === 'LOW' ? 'Safe' : 'Danger',
      risk_level: riskLevel,
    },
    environment: {
      temperature: environment.readings.temperature.value,
      humidity: environment.readings.humidity.value,
      oxygen: environment.readings.o2.value,
      carbon_monoxide: environment.readings.co.value,
      methane: environment.readings.methane.value,
      carbon_dioxide: environment.readings.co2.value,
    },
    hazards: {
      smoke: hazards.activeHazards.some((hazard) => hazard.type === 'SMOKE'),
      fire: hazards.activeHazards.some((hazard) => hazard.type === 'FIRE'),
      gas_leak: hazards.activeHazards.some((hazard) => ['METHANE', 'CO', 'CO2'].includes(hazard.type)),
      person_detected: cameras.detections.some((detection) => detection.type === 'person'),
      rockfall: hazards.activeHazards.some((hazard) => hazard.type === 'ROCKFALL'),
      water_detected: hazards.activeHazards.some((hazard) => hazard.type === 'FLOODING'),
    },
    rover: {
      battery: rover.batteryLevel,
      speed: null,
      position: rover.location,
      communication_status: rover.connectionStatus,
    },
    yolo_pose_detection: buildYoloSummary(yoloData),
    ml_detections: cameras.detections.map((detection) => detection.type),
    alerts: [],
  };

  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: JSON.stringify(mineData) },
  ];

  if (!import.meta.env.DEV) {
    try {
      return { analysis: await requestBackupAnalysis(messages), provider: 'Backup model' };
    } catch (error: unknown) {
      console.warn('AI analysis request failed.', getErrorMessage(error));
      throw new Error('AI analysis is temporarily unavailable. Check your connection and try again.');
    }
  }

  try {
    const response = await fetch('http://localhost:11434/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ollama',
      },
      body: JSON.stringify({
        model: 'qwen2.5:1.5b',
        messages,
        response_format: { type: 'json_object' },
        temperature: 0.1,
      }),
    });
    return { analysis: await parseAnalysisResponse(response), provider: 'Primary model' };
  } catch (qwenError: unknown) {
    try {
      return { analysis: await requestBackupAnalysis(messages), provider: 'Backup model' };
    } catch (grokError: unknown) {
      console.warn('AI analysis could not complete.', {
        primaryError: getErrorMessage(qwenError),
        backupError: getErrorMessage(grokError),
      });
      throw new Error('AI analysis is temporarily unavailable. Check your connection and try again.');
    }
  }
}