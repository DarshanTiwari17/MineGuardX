import { useState, useEffect, useCallback, useRef } from 'react';
import { Brain, AlertTriangle, ShieldCheck, Activity, CheckCircle, Navigation, Radio, Loader2, AlertCircle, Play, Users } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import StatusCard from '../components/shared/StatusCard';
import StatusBadge from '../components/shared/StatusBadge';
import EmptyState from '../components/shared/EmptyState';
import { yoloStore } from '../services/yoloStore';
import type { YoloDetectionResult } from '../hooks/useYoloPoseDetection';

interface Threat {
  type: string;
  severity: string;
  reason: string;
}

interface Recommendation {
  priority: string;
  action: string;
  reason: string;
}

interface AIAnalysis {
  risk_level: string;
  summary: string;
  threats: Threat[];
  recommendations: Recommendation[];
  rover_action: string;
  human_action: string;
  monitoring_required: string[];
  confidence: number;
}

interface ChatCompletionResponse {
  choices?: Array<{ message?: { content?: string | null } }>;
  detail?: string;
}

async function parseAnalysisResponse(response: Response): Promise<AIAnalysis> {
  const data = await response.json() as ChatCompletionResponse;
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

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown error.';
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

/** Build a human-readable YOLO pose detection summary to pass to Qwen. */
function buildYoloSummary(yolo: YoloDetectionResult): string {
  if (!yolo.timestamp || yolo.people_detected === 0) {
    return 'No persons detected by AI camera system.';
  }

  const lines: string[] = [
    `People detected: ${yolo.people_detected}`,
    '',
  ];

  yolo.detections.forEach((p) => {
    const status = p.fall_confirmed ? 'FALL (confirmed)' : 'STANDING';
    lines.push(`Person ${p.id}: ${status}`);
  });

  if (yolo.any_fall) {
    lines.push('');
    const fallen = yolo.detections.filter((p) => p.fall_confirmed).map((p) => `Person ${p.id}`).join(', ');
    lines.push(`Confirmed fall(s): ${fallen}`);
  }

  return lines.join('\n');
}

export default function AIDetection() {
  const { state, demoMode, demoPhase } = useAppContext();
  const { rover, environment, hazards, cameras } = state;

  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
  const [analysisProvider, setAnalysisProvider] = useState<string | null>(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const lastAutoRunPhaseRef = useRef<string | null>(null);

  // ── Subscribe to latest YOLO stabilized detections ──────────────────────
  const [yoloData, setYoloData] = useState<YoloDetectionResult>(yoloStore.getLatest());

  useEffect(() => {
    return yoloStore.subscribe((result) => setYoloData(result));
  }, []);

  const hasCritical  = hazards.activeHazards.some(h => h.severity === 'critical');
  const hasHigh      = hazards.activeHazards.some(h => h.severity === 'high');
  const riskLevel    = hasCritical ? 'CRITICAL' : hasHigh ? 'HIGH' : hazards.activeHazards.length > 0 ? 'MEDIUM' : 'LOW';
  const anyYoloFall  = yoloData.any_fall;

  const analyzeData = useCallback(async () => {
    setLoading(true);
    setError(null);
    setAnalysis(null);
    setAnalysisProvider(null);

    // Build structured payload that Qwen receives.
    // YOLO section is text-only summary — Qwen never sees raw camera footage.
    const mineData = {
      timestamp:   new Date().toISOString(),
      mine_status: {
        overall_status: riskLevel === 'LOW' ? 'Safe' : 'Danger',
        risk_level:     riskLevel,
      },
      environment: {
        temperature:     environment.readings.temperature.value,
        humidity:        environment.readings.humidity.value,
        oxygen:          environment.readings.o2.value,
        carbon_monoxide: environment.readings.co.value,
        methane:         environment.readings.methane.value,
        carbon_dioxide:  environment.readings.co2.value,
      },
      hazards: {
        smoke:            hazards.activeHazards.some(h => h.type === 'SMOKE'),
        fire:             hazards.activeHazards.some(h => h.type === 'FIRE'),
        gas_leak:         hazards.activeHazards.some(h => ['METHANE', 'CO', 'CO2'].includes(h.type)),
        person_detected:  cameras.detections.some(d => d.type === 'person'),
        rockfall:         hazards.activeHazards.some(h => h.type === 'ROCKFALL'),
        water_detected:   hazards.activeHazards.some(h => h.type === 'FLOODING'),
      },
      rover: {
        battery:              rover.batteryLevel,
        speed:                null,
        position:             rover.location,
        communication_status: rover.connectionStatus,
      },
      // YOLO pose detection results (stabilized) — text summary only
      yolo_pose_detection: buildYoloSummary(yoloData),
      // Legacy detection types
      ml_detections: cameras.detections.map(d => d.type),
      alerts: [],
    };

    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: JSON.stringify(mineData) },
    ];

    try {
      let parsed: AIAnalysis;
      let provider: string;

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
        parsed = await parseAnalysisResponse(response);
        provider = 'Ollama / Qwen';
      } catch (qwenError: unknown) {
        const grokEndpoint = import.meta.env.DEV
          ? 'http://127.0.0.1:8765/ai/analyze'
          : '/.netlify/functions/grok-analysis';
        const response = await fetch(grokEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages,
            response_format: { type: 'json_object' },
            temperature: 0.1,
          }),
        });

        try {
          parsed = await parseAnalysisResponse(response);
        } catch (grokError: unknown) {
          throw new Error(`Qwen unavailable (${getErrorMessage(qwenError)}). Grok fallback failed (${getErrorMessage(grokError)}).`);
        }
        provider = 'Grok fallback';
      }

      setAnalysis(parsed);
      setAnalysisProvider(provider);
    } catch (err: unknown) {
      console.error(err);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [rover, environment, hazards, cameras, yoloData, riskLevel]);

  // Run once for each demo phase so the request matches that phase's data.
  useEffect(() => {
    if (!demoMode || !demoPhase) {
      lastAutoRunPhaseRef.current = null;
      return;
    }

    if (lastAutoRunPhaseRef.current === demoPhase) return;
    lastAutoRunPhaseRef.current = demoPhase;
    analyzeData();
  }, [demoMode, demoPhase, analyzeData]);

  const getRiskVariant = (level: string) => {
    switch (level.toUpperCase()) {
      case 'CRITICAL': return 'critical';
      case 'HIGH':     return 'critical';
      case 'MEDIUM':   return 'warning';
      case 'LOW':      return 'connected';
      default:         return 'disconnected';
    }
  };

  return (
    <div className="page-container" style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Brain size={28} style={{ color: 'var(--color-accent)' }} />
            AI Detection &amp; Analysis
          </h1>
          <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)' }}>
            AI Model powered safety analysis. AI pose detections from Live Monitoring are passed as structured context.
          </p>
        </div>
        <button
          onClick={analyzeData}
          disabled={loading}
          className="btn btn-primary"
        >
          {loading ? <Loader2 size={16} className="spin" /> : <Play size={16} />}
          {loading ? 'Analyzing Data...' : 'Run Analysis'}
        </button>
      </div>

      {/* YOLO context summary card */}
      <div
        style={{
          background:    'var(--bg-secondary)',
          border:        `1px solid ${anyYoloFall ? 'var(--color-critical)' : 'var(--border-subtle)'}`,
          borderRadius:  '8px',
          padding:       '14px 16px',
          marginBottom:  '20px',
          display:       'flex',
          alignItems:    'flex-start',
          gap:           '12px',
        }}
      >
        <Users size={20} style={{ color: 'var(--color-info)', flexShrink: 0, marginTop: '2px' }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.05em' }}>
            AI Pose Detection Context (will be sent to AI Model)
          </div>
          <pre
            style={{
              margin:     0,
              fontSize:   '12px',
              fontFamily: 'var(--font-mono, monospace)',
              color:      anyYoloFall ? 'var(--color-critical)' : 'var(--text-secondary)',
              whiteSpace: 'pre-wrap',
              lineHeight: '1.6',
            }}
          >
            {buildYoloSummary(yoloData)}
          </pre>
          {yoloData.timestamp && (
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>
              Last updated: {yoloData.timestamp}
            </div>
          )}
        </div>
        {anyYoloFall && (
          <StatusBadge variant="critical" label="FALL DETECTED" />
        )}
      </div>

      {error && (
        <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', padding: '16px', borderRadius: '8px', color: 'var(--color-critical)', display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <AlertCircle size={24} />
          <div>
            <strong>Error: </strong> {error}
          </div>
        </div>
      )}

      {!analysis && !loading && !error && (
        <EmptyState
          icon={<Brain size={48} style={{ opacity: 0.5 }} />}
          title="No Analysis Data"
          subtitle="Click 'Run Analysis' to process current mine and rover data through AI Model. AI detections from Live Monitoring are automatically included."
        />
      )}

      {analysis && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>

          <StatusCard title="AI Summary" icon={<Activity size={16} />} badge={<StatusBadge variant={getRiskVariant(analysis.risk_level)} label={analysis.risk_level} />}>
            <div style={{ padding: '16px', background: 'var(--bg-secondary)', borderRadius: '8px', fontSize: '14px', lineHeight: '1.5' }}>
              <p style={{ margin: '0 0 16px 0' }}>{analysis.summary}</p>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', color: 'var(--text-muted)', fontSize: '12px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle size={14} style={{ color: 'var(--color-connected)' }} />
                  AI Confidence: {Math.round(analysis.confidence * 100)}%
                </span>
                {analysisProvider && <span>Provider: {analysisProvider}</span>}
              </div>
            </div>
          </StatusCard>

          <StatusCard title="Detected Threats" icon={<AlertTriangle size={16} />}>
            {analysis.threats.length === 0 ? (
              <EmptyState icon={<ShieldCheck size={24} />} title="No active threats" subtitle="AI did not identify any immediate threats." />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px' }}>
                {analysis.threats.map((t, idx) => (
                  <div key={idx} style={{ padding: '12px', borderRadius: '6px', background: 'var(--bg-secondary)', borderLeft: `4px solid ${t.severity.toUpperCase() === 'CRITICAL' || t.severity.toUpperCase() === 'HIGH' ? 'var(--color-critical)' : 'var(--color-warning)'}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <strong style={{ fontSize: '14px' }}>{t.type}</strong>
                      <StatusBadge variant={getRiskVariant(t.severity)} label={t.severity} />
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{t.reason}</div>
                  </div>
                ))}
              </div>
            )}
          </StatusCard>

          <StatusCard title="Safety Recommendations" icon={<ShieldCheck size={16} />}>
            {analysis.recommendations.length === 0 ? (
              <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)' }}>No recommendations.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '12px' }}>
                {analysis.recommendations.map((r, idx) => (
                  <div key={idx} style={{ padding: '12px', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <StatusBadge variant={getRiskVariant(r.priority)} label={`Priority: ${r.priority}`} />
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 500, marginBottom: '4px', color: 'var(--text-primary)' }}>{r.action}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{r.reason}</div>
                  </div>
                ))}
              </div>
            )}
          </StatusCard>

          <StatusCard title="Action Plan" icon={<Navigation size={16} />}>
            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Rover Action</h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Radio size={16} style={{ color: 'var(--color-accent)' }} />
                  <span style={{ fontSize: '14px', fontWeight: 600 }}>{analysis.rover_action}</span>
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Human Action</h4>
                <div style={{ fontSize: '14px' }}>{analysis.human_action}</div>
              </div>

              {analysis.monitoring_required.length > 0 && (
                <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
                  <h4 style={{ margin: '0 0 8px 0', fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Monitoring Required</h4>
                  <ul style={{ paddingLeft: '20px', color: 'var(--text-secondary)', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {analysis.monitoring_required.map((item, idx) => <li key={idx}>{item}</li>)}
                  </ul>
                </div>
              )}
            </div>
          </StatusCard>

        </div>
      )}
    </div>
  );
}
