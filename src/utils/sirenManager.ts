// ============================================================
// sirenManager — Generic Emergency Warning Siren Manager
// Handles independent audio triggers (e.g., FALL and SOS)
// without uncontrolled stacking, looping, or overlapping.
// ============================================================

const SIREN_URL = '/audio/emergency-siren.wav';

interface SirenConfig {
  cycles: number;
  gapMs: number;
  volume: number;
}

export const SIREN_DEFAULT_CONFIG: SirenConfig = {
  cycles: 3,
  gapMs: 250,
  volume: 1.0,
};

class SirenManager {
  private audio: HTMLAudioElement | null = null;
  private isPlaying = false;
  private currentCycle = 0;
  private config: SirenConfig;
  private activeTriggers: Set<string> = new Set();
  private timeoutId: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.config = { ...SIREN_DEFAULT_CONFIG };
    if (typeof window !== 'undefined') {
      this.audio = new Audio(SIREN_URL);
    }
  }

  /**
   * Set global configuration for the siren.
   */
  public setConfig(config: Partial<SirenConfig>) {
    this.config = { ...this.config, ...config };
  }

  /**
   * Trigger the siren for a specific event source independently.
   * If the siren is already playing, it will register the trigger
   * but will not cause audio overlap.
   */
  public trigger(sourceId: string) {
    this.activeTriggers.add(sourceId);

    if (!this.isPlaying) {
      this.currentCycle = 0;
      this.playCycle();
    }
  }

  /**
   * Stop the siren for a specific event source.
   */
  public stop(sourceId: string) {
    this.activeTriggers.delete(sourceId);
    if (this.activeTriggers.size === 0) {
      this.halt();
    }
  }

  /**
   * Completely stop audio and clear all triggers.
   */
  private halt() {
    this.isPlaying = false;
    this.currentCycle = 0;
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    if (this.audio) {
      this.audio.pause();
      this.audio.currentTime = 0;
    }
  }

  private playCycle = async () => {
    if (this.activeTriggers.size === 0) {
      this.halt();
      return;
    }

    if (this.currentCycle >= this.config.cycles) {
      // Completed configured cycles for all current triggers, we halt and clear triggers.
      // This enforces the "2-3 cycles -> STOP" rule.
      this.activeTriggers.clear();
      this.halt();
      return;
    }

    this.isPlaying = true;
    if (this.audio) {
      this.audio.volume = this.config.volume;
      this.audio.currentTime = 0;
      try {
        await this.audio.play();

        // When audio finishes, wait gapMs then play next cycle
        this.audio.onended = () => {
          this.currentCycle++;
          this.timeoutId = setTimeout(() => {
            this.playCycle();
          }, this.config.gapMs);
        };
      } catch (err) {
        console.warn('Browser auto-play blocked the emergency siren.', err);
        // Clear triggers if blocked so we don't get stuck in a bad state
        this.activeTriggers.clear();
        this.halt();
      }
    }
  }
}

export const sirenManager = new SirenManager();
