import { View, Text, TouchableOpacity, StyleSheet, Vibration, Platform } from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Volume2, VolumeX, Check, RotateCcw, ChevronRight } from 'lucide-react-native';
import { useApp } from '@/contexts/AppContext';
import { getTheme, isDarkTheme as checkDarkTheme } from '@/utils/theme';
import { useVolumeButtons, VolumeButton } from '@/hooks/useVolumeButtons';

const MIN_SEQUENCE_LENGTH = 2;
const MAX_SEQUENCE_LENGTH = 4;

export default function SetupVolumeSequence() {
  const { settings, updateVolumeMuteSequence } = useApp();
  const router = useRouter();
  const [sequence, setSequence] = useState<VolumeButton[]>([]);
  const [confirmSequence, setConfirmSequence] = useState<VolumeButton[]>([]);
  const [isConfirming, setIsConfirming] = useState(false);
  const [error, setError] = useState('');
  const isConfirmingRef = useRef(false);
  const sequenceRef = useRef<VolumeButton[]>([]);
  const confirmSequenceRef = useRef<VolumeButton[]>([]);

  const themeColor = settings?.theme_color || 'green';
  const theme = getTheme(themeColor);
  const isDarkTheme = checkDarkTheme(themeColor);
  const textColor = isDarkTheme ? '#fff' : '#000';

  const handleVolumeChange = (hwSequence: VolumeButton[]) => {
    if (hwSequence.length === 0) return;
    const button = hwSequence[hwSequence.length - 1];

    if (isConfirmingRef.current) {
      if (confirmSequenceRef.current.length < MAX_SEQUENCE_LENGTH) {
        const updated = [...confirmSequenceRef.current, button];
        confirmSequenceRef.current = updated;
        setConfirmSequence(updated);
        setError('');
      }
    } else {
      if (sequenceRef.current.length < MAX_SEQUENCE_LENGTH) {
        const updated = [...sequenceRef.current, button];
        sequenceRef.current = updated;
        setSequence(updated);
        setError('');
      }
    }
  };

  const { startListening, stopListening, resetSequence: resetHwSequence } = useVolumeButtons(handleVolumeChange);

  // Start listening on mount
  useEffect(() => {
    startListening();
    return () => stopListening();
  }, []);

  // Keep refs in sync
  useEffect(() => {
    isConfirmingRef.current = isConfirming;
  }, [isConfirming]);

  const removeLastButton = () => {
    if (isConfirming) {
      if (confirmSequence.length > 0) {
        const updated = confirmSequence.slice(0, -1);
        confirmSequenceRef.current = updated;
        setConfirmSequence(updated);
        setError('');
      }
    } else {
      if (sequence.length > 0) {
        const updated = sequence.slice(0, -1);
        sequenceRef.current = updated;
        setSequence(updated);
        setError('');
      }
    }
  };

  const clearSequence = () => {
    if (isConfirming) {
      confirmSequenceRef.current = [];
      setConfirmSequence([]);
    } else {
      sequenceRef.current = [];
      setSequence([]);
    }
    setError('');
  };

  const handleContinue = () => {
    if (!isConfirming) {
      if (sequence.length < MIN_SEQUENCE_LENGTH) {
        setError(`Sequence must be at least ${MIN_SEQUENCE_LENGTH} buttons`);
        return;
      }
      setIsConfirming(true);
      // Reset hw listener for the confirm phase
      resetHwSequence();
      setError('');
    } else {
      if (confirmSequence.length !== sequence.length) {
        setError('Sequences do not match');
        confirmSequenceRef.current = [];
        setConfirmSequence([]);
        resetHwSequence();
        return;
      }

      const sequencesMatch = sequence.every((button, index) => button === confirmSequence[index]);

      if (!sequencesMatch) {
        setError('Sequences do not match');
        confirmSequenceRef.current = [];
        setConfirmSequence([]);
        resetHwSequence();
        return;
      }

      handleSave();
    }
  };

  const handleSave = async () => {
    stopListening();
    try {
      await updateVolumeMuteSequence(sequence);
      router.back();
    } catch (err) {
      setError('Error saving sequence');
    }
  };

  const handleSkip = () => {
    stopListening();
    router.back();
  };

  const currentSequence = isConfirming ? confirmSequence : sequence;
  const canContinue = currentSequence.length >= MIN_SEQUENCE_LENGTH;

  return (
    <LinearGradient colors={theme.gradient} style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Volume2 size={64} color={theme.primary} />
          <Text style={[styles.title, { color: textColor }]}>
            {isConfirming ? 'Confirm Your Sequence' : 'Create Volume Sequence'}
          </Text>
          <Text style={[styles.subtitle, { color: isDarkTheme ? '#999' : '#666' }]}>
            {isConfirming
              ? 'Press the same volume button sequence again to confirm'
              : 'Press the physical volume buttons to create your mute pattern'}
          </Text>
        </View>

        <View style={styles.sequenceDisplay}>
          <View style={styles.sequenceContainer}>
            {currentSequence.map((button, index) => (
              <View
                key={index}
                style={[
                  styles.sequenceButton,
                  {
                    backgroundColor: button === 'up' ? theme.primary : '#666',
                  },
                ]}
              >
                <Text style={styles.sequenceButtonText}>
                  {button === 'up' ? '↑' : '↓'}
                </Text>
              </View>
            ))}
            {Array.from({
              length: MAX_SEQUENCE_LENGTH - currentSequence.length,
            }).map((_, index) => (
              <View
                key={`empty-${index}`}
                style={[styles.sequenceButton, styles.emptyButton]}
              />
            ))}
          </View>

          <Text style={[styles.lengthText, { color: isDarkTheme ? '#999' : '#666' }]}>
            {currentSequence.length} / {MAX_SEQUENCE_LENGTH} buttons
            {currentSequence.length < MIN_SEQUENCE_LENGTH &&
              ` (min ${MIN_SEQUENCE_LENGTH})`}
          </Text>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={styles.controls}>
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: '#333' }]}
              onPress={removeLastButton}
            >
              <RotateCcw size={20} color="#fff" />
              <Text style={styles.actionButtonText}>Undo</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: '#333' }]}
              onPress={clearSequence}
            >
              <VolumeX size={20} color="#fff" />
              <Text style={styles.actionButtonText}>Clear</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.continueButton,
              {
                backgroundColor: canContinue ? theme.primary : '#333',
                opacity: canContinue ? 1 : 0.5,
              },
            ]}
            onPress={handleContinue}
            disabled={!canContinue}
          >
            <Text style={styles.continueButtonText}>
              {isConfirming ? 'Save Sequence' : 'Continue'}
            </Text>
            {isConfirming ? <Check size={20} color="#fff" /> : <ChevronRight size={20} color="#fff" />}
          </TouchableOpacity>

          <TouchableOpacity onPress={handleSkip}>
            <Text style={styles.skipText}>Skip for now</Text>
          </TouchableOpacity>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    marginTop: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  sequenceDisplay: {
    alignItems: 'center',
  },
  sequenceContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  sequenceButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#333',
    borderStyle: 'dashed',
  },
  sequenceButtonText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  lengthText: {
    fontSize: 14,
  },
  error: {
    color: '#ff4444',
    fontSize: 14,
    textAlign: 'center',
    backgroundColor: 'rgba(255, 68, 68, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 24,
  },
  controls: {
    gap: 16,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    gap: 16,
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 16,
    width: '100%',
    gap: 8,
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  skipText: {
    color: '#999',
    fontSize: 14,
  },
});
