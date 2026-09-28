// ============================================================
// yoloStore — Lightweight module-level YOLO detection store
//
// This allows the YOLO detections produced on the Live Monitoring
// page to be consumed by the AI Detection page (for Grok analysis)
// without requiring a full Redux/Context refactor.
//
// Architecture:
//   LiveMonitoring page → calls yoloStore.publish(result)
//   AIDetection page    → calls yoloStore.subscribe(callback)
//                      OR reads yoloStore.getLatest()
// ============================================================

import type { YoloDetectionResult } from '../hooks/useYoloPoseDetection';

type Subscriber = (result: YoloDetectionResult) => void;

const EMPTY: YoloDetectionResult = {
  timestamp:       null,
  people_detected: 0,
  any_fall:        false,
  detections:      [],
};

let _latest: YoloDetectionResult = EMPTY;
const _subscribers = new Set<Subscriber>();

export const yoloStore = {
  publish(result: YoloDetectionResult) {
    _latest = result;
    _subscribers.forEach((cb) => cb(result));
  },

  subscribe(cb: Subscriber): () => void {
    _subscribers.add(cb);
    // Immediately deliver latest value
    cb(_latest);
    return () => _subscribers.delete(cb);
  },

  getLatest(): YoloDetectionResult {
    return _latest;
  },
};
