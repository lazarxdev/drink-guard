import { View, Text, StyleSheet, Vibration, Platform, TouchableOpacity } from 'react-native';
import { useEffect, useState, useRef } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useApp } from '@/contexts/AppContext';
import { verifyPin } from '@/utils/crypto';
import { getTheme, isDarkTheme as checkDarkTheme } from '@/utils/theme';
import { supabase } from '@/lib/supabase';
import GracePeriodCountdown from '@/components/GracePeriodCountdown';
import PINKeypad from '@/components/PINKeypad';
import { useVolumeButtons, parseVolumeSequence, validateVolumeSequence, VolumeButton } from '@/hooks/useVolumeButtons';

export default function GracePeriod() {
  const { settings } = useApp();
  const router = useRouter();
  const params = useLocalSearchParams();
  const [countdown, setCountdown] = useState(settings?.grace_period_seconds || 3);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [showPinEntry, setShowPinEntry] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const matchHandledRef = useRef(false);

  const themeColor = settings?.theme_color || 'green';
  const theme = getTheme(themeColor);
  const isDarkTheme = checkDarkTheme(themeColor);
  const isIncognito = settings?.incognito_mode || false;
  const volumeMuteEnabled = settings?.volume_mute_enabled ?? true;
  const expectedSequence = parseVolumeSequence(settings?.volume_mute_sequence || null);
  const hasVolumeSequence = volumeMuteEnabled && expectedSequence.length > 0;

  const { sequence: volumeSequence, startListening, stopListening, resetSequence } = useVolumeButtons();

  // Start listening for hardware volume buttons when the screen mounts
  useEffect(() => {
    if (hasVolumeSequence) {
      startListening();
    }
    return () => {
      stopListening();
    };
  }, [hasVolumeSequence]);

  // Check volume sequence against expected on each press
  useEffect(() => {
    if (!hasVolumeSequence || volumeSequence.length === 0 || matchHandledRef.current) return;

    if (volumeSequence.length === expectedSequence.length) {
      const isValid = validateVolumeSequence(volumeSequence, expectedSequence);
      if (isValid) {
        matchHandledRef.current = true;
        handleSequenceSuccess();
      } else {
        // Wrong sequence, reset and let them try again
        resetSequence();
      }
    } else if (volumeSequence.length > expectedSequence.length) {
      resetSequence();
    }
  }, [volumeSequence, expectedSequence, hasVolumeSequence]);

  useEffect(() => {
    if (countdown <= 0) {
      handleGracePeriodExpired();
      return;
    }

    timerRef.current = setTimeout(() => {
      setCountdown(countdown - 1);
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [countdown]);

  const handleGracePeriodExpired = async () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    stopListening();

    if (isIncognito) {
      try {
        const userId = settings?.user_id;
        if (userId) {
          await supabase.from('tampering_events').insert({
            user_id: userId,
            detected_at: new Date().toISOString(),
            acknowledged: false,
          });
        }
      } catch (error) {
        console.error('Error saving tampering event:', error);
      }
    }

    router.replace('/alert');
  };

  const handleSequenceSuccess = async () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    stopListening();

    if (Platform.OS !== 'web') {
      Vibration.vibrate([0, 100, 50, 100]);
    }

    router.replace({
      pathname: '/alert',
      params: { muted: 'true' },
    });
  };

  const handlePinSubmit = async () => {
    if (!pin) {
      setError('Please enter PIN');
      return;
    }

    try {
      const isValid = await verifyPin(pin, settings?.pin_hash || '');

      if (isValid) {
        if (timerRef.current) {
          clearTimeout(timerRef.current);
        }
        stopListening();

        if (Platform.OS !== 'web') {
          Vibration.vibrate([0, 100, 50, 100]);
        }

        router.replace({
          pathname: '/alert',
          params: { muted: 'true' },
        });
      } else {
        setError('Incorrect PIN');
        setPin('');
      }
    } catch (err) {
      setError('Error verifying PIN');
      setPin('');
    }
  };

  useEffect(() => {
    if (pin.length === 4) {
      handlePinSubmit();
    }
  }, [pin]);

  if (showPinEntry || !hasVolumeSequence) {
    return (
      <View style={[styles.container, { backgroundColor: isIncognito ? '#000' : '#1a1a1a' }]}>
        <View style={styles.pinContent}>
          <Text style={[styles.title, { color: theme.primary }]}>Enter PIN Quickly</Text>
          <Text style={[styles.subtitle, { color: isDarkTheme ? '#999' : '#666' }]}>
            {countdown > 0
              ? `${countdown}s remaining to prevent alarm`
              : 'Time expired - alarm will sound'}
          </Text>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <PINKeypad
            pin={pin}
            onPinChange={(value) => {
              setPin(value);
              setError('');
            }}
            maxLength={4}
            themeColor={theme.primary}
            isDarkTheme={isDarkTheme}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: isIncognito ? '#000' : '#1a1a1a' }]}>
      <GracePeriodCountdown
        seconds={countdown}
        totalSeconds={settings?.grace_period_seconds || 3}
        onComplete={handleGracePeriodExpired}
        themeColor={theme.primary}
        showVolumeIcon={hasVolumeSequence}
      />

      {hasVolumeSequence && (
        <View style={styles.volumeFeedback}>
          <View style={styles.sequenceProgress}>
            {expectedSequence.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.sequenceDot,
                  {
                    backgroundColor: index < volumeSequence.length
                      ? theme.primary
                      : 'rgba(255, 255, 255, 0.2)',
                  },
                ]}
              />
            ))}
          </View>

          <Text style={styles.volumeHint}>
            {volumeSequence.length === 0
              ? 'Press your volume button sequence now'
              : `${volumeSequence.length} / ${expectedSequence.length}`}
          </Text>

          <TouchableOpacity onPress={() => setShowPinEntry(true)}>
            <Text style={styles.switchToPinText}>Use PIN instead</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  pinContent: {
    width: '100%',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 48,
    textAlign: 'center',
  },
  error: {
    color: '#ff4444',
    fontSize: 14,
    textAlign: 'center',
    backgroundColor: 'rgba(255, 68, 68, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 24,
  },
  volumeFeedback: {
    marginTop: 32,
    alignItems: 'center',
  },
  sequenceProgress: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  sequenceDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  volumeHint: {
    color: '#999',
    fontSize: 14,
    marginBottom: 24,
    textAlign: 'center',
  },
  switchToPinText: {
    color: '#666',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});
