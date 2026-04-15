import { View, Text, StyleSheet, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useApp } from '@/contexts/AppContext';
import { verifyPin } from '@/utils/crypto';
import { supabase } from '@/lib/supabase';
import { ShieldCheck } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import PINKeypad from '@/components/PINKeypad';
import { getTheme, isDarkTheme as checkDarkTheme } from '@/utils/theme';
import { recordFailedAttempt, isLockedOut, resetLockout } from '@/utils/pinLockout';

export default function Login() {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [locked, setLocked] = useState(false);
  const [lockSeconds, setLockSeconds] = useState(0);
  const { settings } = useApp();
  const router = useRouter();

  const checkForTamperingEvents = async () => {
    try {
      const userId = settings?.user_id;
      if (!userId) return;

      const { data: events, error } = await supabase
        .from('tampering_events')
        .select('*')
        .eq('user_id', userId)
        .eq('acknowledged', false)
        .order('detected_at', { ascending: false });

      if (error) {
        console.error('Error fetching tampering events:', error);
        return;
      }

      if (events && events.length > 0) {
        // Get the most recent event
        const latestEvent = events[0];
        const eventDate = new Date(latestEvent.detected_at);

        // Format timestamp
        const timeString = eventDate.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        });
        const dateString = eventDate.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        });

        // Show alert
        Alert.alert(
          'Tampering Detected',
          `Device movement was detected in Incognito mode at ${timeString} on ${dateString}`,
          [
            {
              text: 'OK',
              onPress: async () => {
                // Mark all events as acknowledged
                await supabase
                  .from('tampering_events')
                  .update({ acknowledged: true })
                  .eq('user_id', userId)
                  .eq('acknowledged', false);
              },
            },
          ]
        );
      }
    } catch (err) {
      console.error('Error checking tampering events:', err);
    }
  };

  useEffect(() => {
    if (pin.length === 4) {
      handleLogin();
    }
  }, [pin]);

  // Lockout countdown timer
  useEffect(() => {
    if (!locked) return;
    const interval = setInterval(() => {
      const status = isLockedOut();
      if (!status.locked) {
        setLocked(false);
        setLockSeconds(0);
        setError('');
      } else {
        setLockSeconds(status.remainingSeconds);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [locked]);

  const handleLogin = async () => {
    setError('');

    const lockStatus = isLockedOut();
    if (lockStatus.locked) {
      setLocked(true);
      setLockSeconds(lockStatus.remainingSeconds);
      setError(`Too many attempts. Try again in ${lockStatus.remainingSeconds}s`);
      setPin('');
      return;
    }

    try {
      const isValid = await verifyPin(pin, settings?.pin_hash || '');

      if (isValid) {
        resetLockout();
        await checkForTamperingEvents();
        router.replace('/monitor');
      } else {
        const result = recordFailedAttempt();

        if (result.locked) {
          setLocked(true);
          setLockSeconds(result.remainingSeconds);
          setError(`Too many attempts. Locked for ${result.remainingSeconds}s`);
        } else {
          setError(`Incorrect PIN (${result.attempts}/5 attempts)`);
        }
        setPin('');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Failed to verify PIN');
      setPin('');
    }
  };

  const themeColor = settings?.theme_color || 'green';
  const theme = getTheme(themeColor);
  const isDarkTheme = checkDarkTheme(themeColor);
  const textColor = isDarkTheme ? '#fff' : '#000';

  return (
    <LinearGradient colors={theme.gradient} style={styles.container}>
      <View style={styles.content}>
        <ShieldCheck size={60} color={theme.primary} style={styles.icon} />
        <Text style={[styles.title, { color: textColor }]}>Drink Guard</Text>
        <Text style={[styles.subtitle, { color: isDarkTheme ? '#999' : '#666' }]}>Enter your PIN to continue</Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <PINKeypad pin={pin} onPinChange={setPin} maxLength={4} themeColor={theme.primary} isDarkTheme={isDarkTheme} />
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
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  icon: {
    marginBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 48,
    textAlign: 'center',
  },
  error: {
    color: '#ff4444',
    marginBottom: 24,
    textAlign: 'center',
    fontSize: 14,
  },
});
