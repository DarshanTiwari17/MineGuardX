import { useState } from 'react';
import { Brain, AlertTriangle, ShieldCheck, Activity, CheckCircle, Navigation, Radio, Loader2, AlertCircle, Play } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import StatusCard from '../components/shared/StatusCard';
import StatusBadge from '../components/shared/StatusBadge';
import EmptyState from '../components/shared/EmptyState';

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

export default function AIDetection() {
  const { state } = useAppContext();
  const { rover, environment, hazards, cameras } = state;
  
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasCritical = hazards.activeHazards.some(h => h.severity === 'critical');
  const hasHigh = hazards.activeHazards.some(h => h.severity === 'high');
  const riskLevel = hasCritical ? 'CRITICAL' : hasHigh ? 'HIGH' : hazards.activeHazards.length > 0 ? 'WARNING' : 'NORMAL';

  const mockMineData = {
    timestamp: new Date().toISOString(),
    mine_status: {
      overall_status: riskLevel === 'NORMAL' ? 'Safe' : 'Danger',
      risk_level: riskLevel
    },
    environment: {
      temperature: environment.temperature,
      humidity: environment.humidity,
      oxygen: environment.oxygen,
      carbon_monoxide: environment.carbonMonoxide,
      methane: environment.methane,
      carbon_dioxide: environment.carbonDioxide
    },
    hazards: {
      smoke: hazards.activeHazards.some(h => h.type === 'SMOKE'),
      fire: hazards.activeHazards.some(h => h.type === 'FIRE'),
      gas_leak: hazards.activeHazards.some(h => ['METHANE', 'CO', 'CO2'].includes(h.type)),
      person_detected: cameras.detections.some(d => d.type === 'person'),
      rockfall: hazards.activeHazards.some(h => h.type === 'ROCKFALL'),
      water_detected: hazards.activeHazards.some(h => h.type === 'FLOODING')
    },
    rover: {
      battery: rover.battery,
      speed: rover.speed,
      position: rover.position,
      communication_status: rover.connectionStatus
    },
    ml_detections: cameras.detections.map(d => d.type),
    alerts: []
  };

  const analyzeData = async () => {
    setLoading(true);
    setError(null);
    setAnalysis(null);

    try {
      const response = await fetch('http://localhost:11434/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ollama'
        },
        body: JSON.stringify({
          model: 'qwen2.5:1.5b',
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: JSON.stringify(mockMineData) }
          ],
          response_format: { type: 'json_object' },
          temperature: 0.1
        })
      });

      if (!response.ok) {
        throw new Error('AI analysis unavailable. Please make sure Ollama is running.');
      }

      const data = await response.json();
      const content = data.choices[0].message.content;
      
      const cleanedContent = content.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
      const parsed = JSON.parse(cleanedContent) as AIAnalysis;
      setAnalysis(parsed);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to parse AI response or connect to Ollama.');
    } finally {
      setLoading(false);
    }
  };

  const getRiskVariant = (level: string) => {
    switch (level.toUpperCase()) {
      case 'CRITICAL': return 'critical';
      case 'HIGH': return 'critical';
      case 'MEDIUM': return 'warning';
      case 'LOW': return 'connected';
      default: return 'disconnected';
    }
  };

  return (
    <div className="page-container" style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Brain size={28} style={{ color: 'var(--color-accent)' }} />
            AI Detection & Analysis
          </h1>
          <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)' }}>
            Qwen2.5:1.5B powered safety analysis and recommendations.
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
          subtitle="Click 'Run Analysis' to process current mine and rover data through Qwen2.5:1.5B."
        />
      )}

      {analysis && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
          
          <StatusCard title="AI Summary" icon={<Activity size={16} />} badge={<StatusBadge variant={getRiskVariant(analysis.risk_level)} label={analysis.risk_level} />}>
            <div style={{ padding: '16px', background: 'var(--bg-secondary)', borderRadius: '8px', fontSize: '14px', lineHeight: '1.5' }}>
              <p style={{ margin: '0 0 16px 0' }}>{analysis.summary}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '12px' }}>
                <CheckCircle size={14} style={{ color: 'var(--color-connected)' }} />
                AI Confidence: {Math.round(analysis.confidence * 100)}%
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
                  <h4 style={{ margin: '0 0 8px 0', fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Required Monitoring</h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {analysis.monitoring_required.map((m, idx) => (
                      <span key={idx} style={{ padding: '4px 8px', background: 'var(--bg-tertiary)', borderRadius: '4px', fontSize: '11px', color: 'var(--text-secondary)' }}>
                        {m}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </StatusCard>
          
        </div>
      )}
    </div>
  );
}
