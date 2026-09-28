// ============================================================
// BrowserCameraViewer — Live camera feed using getUserMedia
// Shows the actual browser camera stream.
// When YOLO confirms a FALL, draws a red bounding box overlay
// ONLY on the fallen person. Standing people show NO box.
// ============================================================

import { useRef, useEffect, useState } from 'react';
import { WifiOff, AlertTriangle, RotateCw, Camera } from 'lucide-react';
import type { YoloDetectionResult, YoloPersonDetection } from '../../hooks/useYoloPoseDetection';
import type { CameraPermissionStatus } from '../../hooks/useBrowserCamera';
import { sirenManager } from '../../utils/sirenManager';

interface BrowserCameraViewerProps {
  stream: MediaStream | null;
  permissionStatus: CameraPermissionStatus;
  cameraError: string | null;
  yoloDetections: YoloDetectionResult;
  onRetry: () => void;
  compact?: boolean;
}

export default function BrowserCameraViewer({
  stream,
  permissionStatus,
  cameraError,
  yoloDetections,
  onRetry,
  compact = false,
}: BrowserCameraViewerProps) {
  const videoRef      = useRef<HTMLVideoElement>(null);
  const containerRef  = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded]   = useState(false);

  // Attach stream to video element
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (stream) {
      video.srcObject = stream;
      video.play().catch(() => {/* autoplay may be blocked until user interaction */});
      setIsLoaded(false);
    } else {
      video.srcObject = null;
      setIsLoaded(false);
    }
  }, [stream]);

  const hasStream = !!stream && permissionStatus === 'granted';

  // Confirmed fall detections only (with bounding boxes)
  const fallDetections: YoloPersonDetection[] = yoloDetections.detections.filter(
    (d) => d.fall_confirmed && d.bounding_box_pct,
  );

  // ── YOLO Fall Siren Logic ────────────────────────────────────────────────
  const previousFallState = useRef(false);

  useEffect(() => {
    const isCurrentlyFalling = fallDetections.length > 0;

    if (isCurrentlyFalling && !previousFallState.current) {
      // Transition from NO FALL -> FALL
      sirenManager.trigger('yolo-fall');
    }

    // Update state to prevent re-triggering for the same continuous fall
    previousFallState.current = isCurrentlyFalling;
  }, [fallDetections.length]); // Dependencies: only re-evaluate when fall count changes or on remount

  if (!hasStream) {
    // Show appropriate offline / permission state
    const isPermissionDenied  = permissionStatus === 'denied';
    const isUnavailable       = permissionStatus === 'unavailable';
    const isRequesting        = permissionStatus === 'requesting';
    const isIdle              = permissionStatus === 'idle';

    return (
      <div
        className="viewer-offline-state"
        role="status"
        ref={containerRef}
        style={{ position: 'relative', width: '100%', height: '100%' }}
      >
        <div
          className="offline-icon-ring"
          style={{ borderColor: isPermissionDenied || isUnavailable ? 'var(--color-critical)' : undefined }}
        >
          {isPermissionDenied || isUnavailable ? (
            <AlertTriangle
              size={compact ? 32 : 48}
              color="var(--color-critical)"
              aria-hidden="true"
            />
          ) : (
            <WifiOff
              size={compact ? 32 : 48}
              color="var(--color-offline)"
              aria-hidden="true"
            />
          )}
        </div>

        <div className="offline-status-text">
          <div className="offline-headline">
            {isRequesting || isIdle
              ? 'REQUESTING CAMERA ACCESS'
              : isPermissionDenied
              ? 'CAMERA PERMISSION DENIED'
              : 'CAMERA UNAVAILABLE'}
          </div>
          <div className="offline-sub">
            {cameraError ?? (isRequesting ? 'Awaiting browser camera permission...' : 'No live feed')}
          </div>
        </div>

        {(isPermissionDenied || isUnavailable) && (
          <button
            type="button"
            className="btn btn-primary retry-btn"
            onClick={onRetry}
            style={{ marginTop: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}
          >
            <RotateCw size={14} />
            <span>Retry Camera</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}
    >
      {/* Live browser camera video */}
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        onLoadedData={() => setIsLoaded(true)}
        aria-label="Live camera feed"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: 'block',
          background: '#000',
        }}
      />

      {/* Camera icon watermark while loading */}
      {!isLoaded && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0,0,0,0.6)',
          }}
        >
          <Camera size={compact ? 32 : 48} color="var(--text-muted)" aria-hidden="true" />
        </div>
      )}

      {/* FALL bounding box overlay — ONLY for confirmed falls */}
      {fallDetections.map((person) => {
        const bbox = person.bounding_box_pct!;
        return (
          <div
            key={person.id}
            aria-label={`FALL detected – Person ${person.id}`}
            style={{
              position: 'absolute',
              left:   `${bbox.x}%`,
              top:    `${bbox.y}%`,
              width:  `${bbox.width}%`,
              height: `${bbox.height}%`,
              border: '2px solid var(--color-critical)',
              boxSizing: 'border-box',
              pointerEvents: 'none',
            }}
          >
            {/* FALL label above the box */}
            <div
              style={{
                position: 'absolute',
                top: '-22px',
                left: 0,
                background: 'var(--color-critical)',
                color: '#fff',
                fontSize: '11px',
                fontWeight: 700,
                fontFamily: 'var(--font-mono, monospace)',
                letterSpacing: '0.05em',
                padding: '2px 6px',
                borderRadius: '2px',
                whiteSpace: 'nowrap',
                lineHeight: '1.4',
              }}
            >
              FALL — {Math.round(person.confidence * 100)}%
            </div>
          </div>
        );
      })}
    </div>
  );
}
