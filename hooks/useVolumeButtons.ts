import { useEffect, useRef, useState } from 'react';
import { Platform, BackHandler } from 'react-native';

export type VolumeButton = 'up' | 'down';

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
  const listenerRef = useRef<any>(null);

  const addToSequence = (button: VolumeButton) => {
    const newSequence = [...sequenceRef.current, button];
    sequenceRef.current = newSequence;
    setSequence(newSequence);
    onSequenceChange?.(newSequence);
  };

  const resetSequence = () => {
    sequenceRef.current = [];
    setSequence([]);
  };

  const startListening = () => {
    if (Platform.OS === 'web') {
      console.log('Volume button detection not available on web');
      setIsListening(true);
      return;
    }

    resetSequence();
    setIsListening(true);

    // On Android, we can use BackHandler as a proxy for hardware buttons
    // Note: This is a workaround. Full volume button detection requires native modules
    if (Platform.OS === 'android') {
      listenerRef.current = BackHandler.addEventListener('hardwareBackPress', () => {
        // This is a placeholder - in a real implementation, you'd use a native module
        // to detect actual volume button presses
        return true;
      });
    }
  };

  const stopListening = () => {
    setIsListening(false);
    listenerRef.current?.remove();
    listenerRef.current = null;
  };

  useEffect(() => {
    return () => {
      stopListening();
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
