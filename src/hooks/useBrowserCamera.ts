// ============================================================
// useBrowserCamera — Browser MediaStream manager
// Requests getUserMedia, manages the stream lifecycle,
// and exposes it for both the visible <video> element
// and the YOLO frame-capture hook.
// ============================================================

import { useState, useEffect, useRef } from 'react';

export type CameraPermissionStatus = 'idle' | 'requesting' | 'granted' | 'denied' | 'unavailable';

interface UseBrowserCameraOptions {
  /** Whether to actually start the camera */
  enabled?: boolean;
  /** Video constraints */
  constraints?: MediaTrackConstraints;
}

interface UseBrowserCameraReturn {
  stream: MediaStream | null;
  permissionStatus: CameraPermissionStatus;
  error: string | null;
  /** Call to retry after denial */
  retry: () => void;
}

export function useBrowserCamera({
  enabled = true,
  constraints,
}: UseBrowserCameraOptions = {}): UseBrowserCameraReturn {
  const [stream, setStream]                     = useState<MediaStream | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<CameraPermissionStatus>('idle');
  const [error, setError]                       = useState<string | null>(null);
  const retryCountRef = useRef(0);
  const [retrySignal, setRetrySignal] = useState(0);

  useEffect(() => {
    if (!enabled) {
      setPermissionStatus('idle');
      return;
    }

    let active = true;
    let acquiredStream: MediaStream | null = null;

    async function acquire() {
      setPermissionStatus('requesting');
      setError(null);

      try {
        acquiredStream = await navigator.mediaDevices.getUserMedia({
          video: constraints ?? { width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });

        if (!active) {
          acquiredStream.getTracks().forEach((t) => t.stop());
          return;
        }

        setStream(acquiredStream);
        setPermissionStatus('granted');
      } catch (err: unknown) {
        if (!active) return;
        setStream(null);

        if (err instanceof Error) {
          if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
            setPermissionStatus('denied');
            setError('Camera permission denied. Please allow camera access and retry.');
          } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
            setPermissionStatus('unavailable');
            setError('No camera found. Please connect a camera and retry.');
          } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
            setPermissionStatus('unavailable');
            setError('Camera is in use by another application.');
          } else {
            setPermissionStatus('unavailable');
            setError(`Camera error: ${err.message}`);
          }
        } else {
          setPermissionStatus('unavailable');
          setError('Unknown camera error.');
        }
      }
    }

    acquire();

    return () => {
      active = false;
      if (acquiredStream) {
        acquiredStream.getTracks().forEach((t) => t.stop());
        setStream(null);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, retrySignal]);

  function retry() {
    retryCountRef.current++;
    setRetrySignal((s) => s + 1);
  }

  return { stream, permissionStatus, error, retry };
}
