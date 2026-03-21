import { useEffect, useRef, useState, useCallback } from 'react';
import { Platform } from 'react-native';

export type VolumeButton = 'up' | 'down';

// Safe import - react-native-volume-manager requires a dev build (not Expo Go)
let VolumeManagerModule: any = null;
try {
  VolumeManagerModule = require('react-native-volume-manager').VolumeManager;
} catch {
  // Not available in Expo Go - will use on-screen fallback
}

const MID_VOLUME = 0.5;
const VOLUME_THRESHOLD = 0.01;

interface VolumeButtonDetectionResult {
  sequence: VolumeButton[];
  isListening: boolean;
  isNativeAvailable: boolean;
  startListening: () => void;
  stopListening: () => void;
  resetSequence: () => void;
}

export function useVolumeButtons(
  onSequenceChange?: (sequence: VolumeButton[]) => void
): VolumeButtonDetectionResult {
  const [sequence, setSequence] = useState<VolumeButton[]>([]);
  const [isListening, setIsListening] = useState(false);
  const sequenceRef = useRef<VolumeButton[]>([]);
  const lastVolumeRef = useRef<number>(MID_VOLUME);
  const suppressRef = useRef(false);
  const isNativeAvailable = Platform.OS !== 'web' && VolumeManagerModule != null;

  const addToSequence = useCallback((button: VolumeButton) => {
    const newSequence = [...sequenceRef.current, button];
    sequenceRef.current = newSequence;
    setSequence(newSequence);
    onSequenceChange?.(newSequence);
  }, [onSequenceChange]);

  const resetSequence = useCallback(() => {
    sequenceRef.current = [];
    setSequence([]);
  }, []);

  const startListening = useCallback(async () => {
    resetSequence();
    setIsListening(true);

    if (!isNativeAvailable) return;

    try {
      VolumeManagerModule.showNativeVolumeUI({ enabled: false });
      await VolumeManagerModule.setVolume(MID_VOLUME, { showUI: false });
      lastVolumeRef.current = MID_VOLUME;
      suppressRef.current = false;
    } catch (err) {
      console.error('Error initializing volume listener:', err);
    }
  }, [resetSequence, isNativeAvailable]);

  const stopListening = useCallback(() => {
    setIsListening(false);

    if (isNativeAvailable) {
      try {
        VolumeManagerModule.showNativeVolumeUI({ enabled: true });
      } catch {
        // ignore cleanup errors
      }
    }
  }, [isNativeAvailable]);

  useEffect(() => {
    if (!isListening || !isNativeAvailable) return;

    const listener = VolumeManagerModule.addVolumeListener((result: { volume: number }) => {
      const newVolume = result.volume;
      const diff = newVolume - lastVolumeRef.current;

      // Ignore our own volume resets
      if (suppressRef.current) {
        suppressRef.current = false;
        lastVolumeRef.current = newVolume;
        return;
      }

      if (Math.abs(diff) < VOLUME_THRESHOLD) return;

      const button: VolumeButton = diff > 0 ? 'up' : 'down';
      addToSequence(button);

      // Reset volume back to midpoint for next press detection
      suppressRef.current = true;
      VolumeManagerModule.setVolume(MID_VOLUME, { showUI: false }).then(() => {
        lastVolumeRef.current = MID_VOLUME;
      });
    });

    return () => {
      listener.remove();
    };
  }, [isListening, isNativeAvailable, addToSequence]);

  useEffect(() => {
    return () => {
      if (isNativeAvailable) {
        try {
          VolumeManagerModule.showNativeVolumeUI({ enabled: true });
        } catch {
          // ignore
        }
      }
    };
  }, [isNativeAvailable]);

  return {
    sequence,
    isListening,
    isNativeAvailable,
    startListening,
    stopListening,
    resetSequence,
  };
}

// Utility function to check if a sequence matches the expected pattern
export function validateVolumeSequence(
  enteredSequence: VolumeButton[],
  expectedSequence: VolumeButton[]
): boolean {
  if (enteredSequence.length !== expectedSequence.length) {
    return false;
  }

  return enteredSequence.every((button, index) => button === expectedSequence[index]);
}

// Utility function to parse stored sequence string
export function parseVolumeSequence(sequenceString: string | null): VolumeButton[] {
  if (!sequenceString) return [];

  try {
    const parsed = JSON.parse(sequenceString);
    if (Array.isArray(parsed)) {
      return parsed.filter(item => item === 'up' || item === 'down');
    }
    return [];
  } catch {
    return [];
  }
}
