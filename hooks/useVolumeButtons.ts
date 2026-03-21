import { useEffect, useRef, useState, useCallback } from 'react';
import { Platform } from 'react-native';
import { VolumeManager } from 'react-native-volume-manager';

export type VolumeButton = 'up' | 'down';

const MID_VOLUME = 0.5;
const VOLUME_THRESHOLD = 0.01;

interface VolumeButtonDetectionResult {
  sequence: VolumeButton[];
  isListening: boolean;
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
    if (Platform.OS === 'web') {
      setIsListening(true);
      return;
    }

    resetSequence();
    setIsListening(true);

    try {
      // Hide the system volume HUD so presses are invisible
      VolumeManager.showNativeVolumeUI({ enabled: false });

      // Set volume to midpoint so we can detect both up and down
      await VolumeManager.setVolume(MID_VOLUME, { showUI: false });
      lastVolumeRef.current = MID_VOLUME;
      suppressRef.current = false;
    } catch (err) {
      console.error('Error initializing volume listener:', err);
    }
  }, [resetSequence]);

  const stopListening = useCallback(() => {
    setIsListening(false);

    if (Platform.OS !== 'web') {
      try {
        VolumeManager.showNativeVolumeUI({ enabled: true });
      } catch (err) {
        // ignore cleanup errors
      }
    }
  }, []);

  useEffect(() => {
    if (!isListening || Platform.OS === 'web') return;

    const listener = VolumeManager.addVolumeListener((result) => {
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
      VolumeManager.setVolume(MID_VOLUME, { showUI: false }).then(() => {
        lastVolumeRef.current = MID_VOLUME;
      });
    });

    return () => {
      listener.remove();
    };
  }, [isListening, addToSequence]);

  useEffect(() => {
    return () => {
      if (Platform.OS !== 'web') {
        try {
          VolumeManager.showNativeVolumeUI({ enabled: true });
        } catch (err) {
          // ignore
        }
      }
    };
  }, []);

  return {
    sequence,
    isListening,
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
