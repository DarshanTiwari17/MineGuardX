// ============================================================
// RecordingControls — Video recording & snapshot toolbar
// Controls reflect backend readiness. Disabled when backend is disconnected.
// ============================================================

import { useState } from 'react';
import { Circle, Square, Camera, AlertCircle } from 'lucide-react';
import type { CameraType, RecordingState } from '../../types';
import { startRecording, stopRecording, captureSnapshot } from '../../services/api';

interface RecordingControlsProps {
  activeCamera: CameraType;
  recording: RecordingState;
  onStateChange?: (state: Partial<RecordingState>) => void;
  compact?: boolean;
}

export default function RecordingControls({
  activeCamera,
  recording,
  onStateChange,
  compact = false,
}: RecordingControlsProps) {
  const [feedback, setFeedback] = useState<string | null>(null);

  async function handleStart() {
    if (!recording.canRecord) {
      setFeedback('Recording unavailable — rover backend disconnected');
      return;
    }
    const res = await startRecording(activeCamera);
    if (!res.success) {
      setFeedback(res.error);
    } else {
      onStateChange?.({ isRecording: true, status: 'recording' });
    }
  }

  async function handleStop() {
    if (!recording.isRecording) return;
    const res = await stopRecording(activeCamera);
    if (!res.success) {
      setFeedback(res.error);
    } else {
      onStateChange?.({ isRecording: false, status: 'idle' });
    }
  }

  async function handleSnapshot() {
    const res = await captureSnapshot(activeCamera);
    if (!res.success) {
      setFeedback('Snapshot unavailable — camera offline');
    } else {
      onStateChange?.({ lastSnapshotAt: new Date().toISOString() });
    }
  }

  return (
    <div className={`recording-toolbar ${compact ? 'compact' : ''}`}>
      <div className="recording-btn-group">
        {/* Start Recording */}
        <button
          type="button"
          className="btn recording-btn rec-start"
          disabled={!recording.canRecord || recording.isRecording}
          onClick={handleStart}
          title={
            !recording.canRecord
              ? 'Recording unavailable — backend not connected'
              : 'Start Recording'
          }
          aria-label="Start recording video"
        >
          <Circle
            size={12}
            className={recording.isRecording ? 'rec-pulse' : ''}
            fill={recording.isRecording ? 'var(--color-critical)' : 'none'}
            aria-hidden="true"
          />
          <span>Start Recording</span>
        </button>

        {/* Stop Recording */}
        <button
          type="button"
          className="btn recording-btn rec-stop"
          disabled={!recording.isRecording}
          onClick={handleStop}
          title={!recording.isRecording ? 'No active recording' : 'Stop Recording'}
          aria-label="Stop recording video"
        >
          <Square size={12} aria-hidden="true" />
          <span>Stop</span>
        </button>

        {/* Snapshot */}
        <button
          type="button"
          className="btn recording-btn rec-snap"
          disabled={!recording.canRecord}
          onClick={handleSnapshot}
          title={
            !recording.canRecord
              ? 'Snapshot unavailable — camera offline'
              : 'Capture Snapshot'
          }
          aria-label="Capture still snapshot"
        >
          <Camera size={12} aria-hidden="true" />
          <span>Snapshot</span>
        </button>
      </div>

      {/* Backend Disconnection / Notice */}
      <div className="recording-notice" role="status" aria-live="polite">
        <AlertCircle size={12} aria-hidden="true" />
        <span>{feedback || 'Recording unavailable — rover backend disconnected'}</span>
      </div>
    </div>
  );
}
