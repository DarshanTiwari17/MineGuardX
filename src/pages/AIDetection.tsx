import { useState, useEffect } from 'react';
import { Brain, AlertTriangle, ShieldCheck, Activity, CheckCircle, Navigation, Radio, Loader2, AlertCircle, Play, Users } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import StatusCard from '../components/shared/StatusCard';
import StatusBadge from '../components/shared/StatusBadge';
import EmptyState from '../components/shared/EmptyState';
import { yoloStore } from '../services/yoloStore';
import type { YoloDetectionResult } from '../hooks/useYoloPoseDetection';

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
  const {
    aiAnalysis: analysis,
    aiAnalysisProvider: analysisProvider,
    aiAnalysisLoading: loading,
    aiAnalysisError: error,
    runAIAnalysis,
  } = useAppContext();

  // ── Subscribe to latest YOLO stabilized detections ──────────────────────
  const [yoloData, setYoloData] = useState<YoloDetectionResult>(yoloStore.getLatest());

  useEffect(() => {
    return yoloStore.subscribe((result) => setYoloData(result));
  }, []);

  const anyYoloFall  = yoloData.any_fall;

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
          onClick={() => void runAIAnalysis()}
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
