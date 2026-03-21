import { View, Text, StyleSheet, Vibration, Platform, TouchableOpacity } from 'react-native';
import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useApp } from '@/contexts/AppContext';
import { verifyPin } from '@/utils/crypto';
import { getTheme, isDarkTheme as checkDarkTheme } from '@/utils/theme';
import { supabase } from '@/lib/supabase';
import GracePeriodCountdown from '@/components/GracePeriodCountdown';
import PINKeypad from '@/components/PINKeypad';
import { VolumeButton, parseVolumeSequence, validateVolumeSequence } from '@/hooks/useVolumeButtons';

export default function GracePeriod() {
  const { settings } = useApp();
  const router = useRouter();
  const params = useLocalSearchParams();
  const [countdown, setCountdown] = useState(settings?.grace_period_seconds || 3);
  const [volumeSequence, setVolumeSequence] = useState<VolumeButton[]>([]);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [showPinEntry, setShowPinEntry] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const expectedSequenceRef = useRef<VolumeButton[]>([]);

  const themeColor = settings?.theme_color || 'green';
  const theme = getTheme(themeColor);
  const isDarkTheme = checkDarkTheme(themeColor);
  const isIncognito = settings?.incognito_mode || false;
  const volumeMuteEnabled = settings?.volume_mute_enabled ?? true;
  const expectedSequence = parseVolumeSequence(settings?.volume_mute_sequence || null);
  const hasVolumeSequence = volumeMuteEnabled && expectedSequence.length > 0;

  // Keep a ref of expected sequence for use in callbacks
  useEffect(() => {
    expectedSequenceRef.current = expectedSequence;
  }, [expectedSequence]);

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

  const handleVolumePress = useCallback((button: VolumeButton) => {
    if (Platform.OS !== 'web') {
      Vibration.vibrate(50);
    }

    setVolumeSequence(prev => {
      const newSequence = [...prev, button];
      const expected = expectedSequenceRef.current;

      if (newSequence.length === expected.length) {
        const isValid = validateVolumeSequence(newSequence, expected);
        if (isValid) {
          handleSequenceSuccess();
        } else {
          return [];
        }
      }

      return newSequence;
    });
  }, []);

  const handleGracePeriodExpired = async () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

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
        <View style={styles.volumeControls}>
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

          <View style={styles.volumeButtonRow}>
            <TouchableOpacity
              style={[styles.volumeButton, { backgroundColor: theme.primary }]}
              onPress={() => handleVolumePress('up')}
              activeOpacity={0.7}
            >
              <Text style={styles.volumeButtonSymbol}>↑</Text>
              <Text style={styles.volumeButtonLabel}>Vol Up</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.volumeButton, { backgroundColor: '#555' }]}
              onPress={() => handleVolumePress('down')}
              activeOpacity={0.7}
            >
              <Text style={styles.volumeButtonSymbol}>↓</Text>
              <Text style={styles.volumeButtonLabel}>Vol Down</Text>
            </TouchableOpacity>
          </View>

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
  volumeControls: {
    marginTop: 32,
    alignItems: 'center',
    width: '100%',
  },
  sequenceProgress: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  sequenceDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  volumeButtonRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
  },
  volumeButton: {
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 14,
    alignItems: 'center',
    minWidth: 120,
  },
  volumeButtonSymbol: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
  },
  volumeButtonLabel: {
    color: '#fff',
    fontSize: 13,
    marginTop: 4,
  },
  switchToPinText: {
    color: '#999',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});
