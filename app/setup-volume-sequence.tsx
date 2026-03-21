import { View, Text, TouchableOpacity, StyleSheet, Vibration, Platform } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Volume2, VolumeX, Check, RotateCcw, ChevronRight } from 'lucide-react-native';
import { useApp } from '@/contexts/AppContext';
import { getTheme, isDarkTheme as checkDarkTheme } from '@/utils/theme';
import { VolumeButton } from '@/hooks/useVolumeButtons';

const MIN_SEQUENCE_LENGTH = 3;
const MAX_SEQUENCE_LENGTH = 6;

export default function SetupVolumeSequence() {
  const { settings, updateVolumeMuteSequence } = useApp();
  const router = useRouter();
  const [sequence, setSequence] = useState<VolumeButton[]>([]);
  const [confirmSequence, setConfirmSequence] = useState<VolumeButton[]>([]);
  const [isConfirming, setIsConfirming] = useState(false);
  const [error, setError] = useState('');

  const themeColor = settings?.theme_color || 'green';
  const theme = getTheme(themeColor);
  const isDarkTheme = checkDarkTheme(themeColor);
  const textColor = isDarkTheme ? '#fff' : '#000';

  const addButton = (button: VolumeButton) => {
    if (Platform.OS !== 'web') {
      Vibration.vibrate(50);
    }

    const currentSequence = isConfirming ? confirmSequence : sequence;
    const setCurrentSequence = isConfirming ? setConfirmSequence : setSequence;

    if (currentSequence.length < MAX_SEQUENCE_LENGTH) {
      setCurrentSequence([...currentSequence, button]);
      setError('');
    }
  };

  const removeLastButton = () => {
    const currentSequence = isConfirming ? confirmSequence : sequence;
    const setCurrentSequence = isConfirming ? setConfirmSequence : setSequence;

    if (currentSequence.length > 0) {
      setCurrentSequence(currentSequence.slice(0, -1));
      setError('');
    }
  };

  const resetSequence = () => {
    if (isConfirming) {
      setConfirmSequence([]);
    } else {
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
      setError('');
    } else {
      if (confirmSequence.length !== sequence.length) {
        setError('Sequences do not match');
        setConfirmSequence([]);
        return;
      }

      const sequencesMatch = sequence.every((button, index) => button === confirmSequence[index]);

      if (!sequencesMatch) {
        setError('Sequences do not match');
        setConfirmSequence([]);
        return;
      }

      handleSave();
    }
  };

  const handleSave = async () => {
    try {
      await updateVolumeMuteSequence(sequence);
      router.back();
    } catch (err) {
      setError('Error saving sequence');
    }
  };

  const handleSkip = () => {
    router.back();
  };

  const canContinue = isConfirming
    ? confirmSequence.length >= MIN_SEQUENCE_LENGTH
    : sequence.length >= MIN_SEQUENCE_LENGTH;

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
              ? 'Enter the same sequence again to confirm'
              : 'Create a pattern using volume buttons to quickly mute alerts'}
          </Text>
        </View>

        <View style={styles.sequenceDisplay}>
          <View style={styles.sequenceContainer}>
            {(isConfirming ? confirmSequence : sequence).map((button, index) => (
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
              length: MAX_SEQUENCE_LENGTH - (isConfirming ? confirmSequence : sequence).length,
            }).map((_, index) => (
              <View
                key={`empty-${index}`}
                style={[styles.sequenceButton, styles.emptyButton]}
              />
            ))}
          </View>

          <Text style={[styles.lengthText, { color: isDarkTheme ? '#999' : '#666' }]}>
            {(isConfirming ? confirmSequence : sequence).length} / {MAX_SEQUENCE_LENGTH} buttons
            {(isConfirming ? confirmSequence : sequence).length < MIN_SEQUENCE_LENGTH &&
              ` (min ${MIN_SEQUENCE_LENGTH})`}
          </Text>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={styles.controls}>
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.volumeButton, { backgroundColor: theme.primary }]}
              onPress={() => addButton('up')}
            >
              <Text style={styles.volumeButtonLabel}>Volume Up</Text>
              <Text style={styles.volumeButtonSymbol}>↑</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.volumeButton, { backgroundColor: '#666' }]}
              onPress={() => addButton('down')}
            >
              <Text style={styles.volumeButtonLabel}>Volume Down</Text>
              <Text style={styles.volumeButtonSymbol}>↓</Text>
            </TouchableOpacity>
          </View>

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
              onPress={resetSequence}
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
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  volumeButton: {
    flex: 1,
    paddingVertical: 24,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  volumeButtonLabel: {
    color: '#fff',
    fontSize: 14,
    marginBottom: 8,
  },
  volumeButtonSymbol: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
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
