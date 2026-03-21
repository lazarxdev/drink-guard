import { View, Text, StyleSheet, Animated, Vibration } from 'react-native';
import { useEffect, useState, useRef } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useApp } from '@/contexts/AppContext';
import { verifyPin } from '@/utils/crypto';
import { setupAudio, playAlarmSound, stopAlarmSound } from '@/utils/alarm';
import { startFlashlight, stopFlashlight } from '@/utils/flashlight';
import { supabase } from '@/lib/supabase';
import { TriangleAlert as AlertTriangle, Volume2 } from 'lucide-react-native';
import PINKeypad from '@/components/PINKeypad';
import { getTheme, isDarkTheme as checkDarkTheme } from '@/utils/theme';

export default function Alert() {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [flashOn, setFlashOn] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const { settings } = useApp();
  const router = useRouter();
  const params = useLocalSearchParams();
  const flashAnim = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const flashIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const isMuted = params.muted === 'true';
  const isIncognito = settings?.incognito_mode || false;
  const themeColor = settings?.theme_color || 'green';
  const theme = getTheme(themeColor);
  const isDarkTheme = checkDarkTheme(themeColor);

  useEffect(() => {
    const handleAlert = async () => {
      if (isMuted) {
        return;
      }

      // Log tampering event for all modes
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

      if (!isIncognito) {
        await setupAudio();
        await playAlarmSound(settings?.alarm_sound || 'bell');

        if (settings?.use_flash) {
          if (!permission?.granted) {
            try {
              await requestPermission();
            } catch (err) {
              console.error('Failed to request camera permission:', err);
            }
          }

          await startFlashlight();
          flashIntervalRef.current = setInterval(() => {
            setFlashOn(prev => !prev);
          }, 500);
        }

        const pattern = [500, 500, 500, 500];
        Vibration.vibrate(pattern, true);
      }
    };

    handleAlert();

    if (!isIncognito && !isMuted) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(flashAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(flashAnim, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }

    return () => {
      if (!isIncognito && !isMuted) {
        Vibration.cancel();
        stopAlarmSound();
        stopFlashlight();
      }
      if (flashIntervalRef.current) {
        clearInterval(flashIntervalRef.current);
        flashIntervalRef.current = null;
      }
      setFlashOn(false);
    };
  }, [settings?.use_flash, isIncognito, isMuted]);

  const backgroundColor = flashAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#8B0000', '#FF0000'],
  });

  const shakeScreen = () => {
    shakeAnim.setValue(0);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  const handleSubmit = async () => {
    if (!pin) {
      setError('Please enter PIN');
      shakeScreen();
      return;
    }

    try {
      const isValid = await verifyPin(pin, settings?.pin_hash || '');

      if (isValid) {
        if (!isIncognito) {
          Vibration.cancel();
          await stopAlarmSound();
          await stopFlashlight();
          if (flashIntervalRef.current) {
            clearInterval(flashIntervalRef.current);
            flashIntervalRef.current = null;
          }
          setFlashOn(false);
        }

        await new Promise(resolve => setTimeout(resolve, 100));
        router.replace('/monitor');
      } else {
        setAttempts(prev => prev + 1);
        setError(`Incorrect PIN (${attempts + 1} failed attempts)`);
        setPin('');
        shakeScreen();
        if (!isIncognito) {
          Vibration.vibrate([0, 200, 100, 200]);
        }
      }
    } catch (err) {
      setError('Error verifying PIN');
      setPin('');
      shakeScreen();
    }
  };

  useEffect(() => {
    if (pin.length === 4) {
      handleSubmit();
    }
  }, [pin]);

  if (isIncognito || isMuted) {
    return (
      <View style={[styles.container, styles.incognitoContainer]}>
        <View style={styles.content}>
          {isMuted ? (
            <Volume2 size={80} color={theme.primary} style={styles.icon} />
          ) : (
            <AlertTriangle size={80} color={theme.primary} style={styles.icon} />
          )}
          <Text style={[styles.title, styles.incognitoTitle]}>Enter PIN</Text>
          <Text style={[styles.subtitle, styles.incognitoSubtitle]}>
            {isMuted ? 'Alarm muted - enter PIN to stop monitoring' : 'Motion detected'}
          </Text>

          {error ? <Text style={styles.incognitoError}>{error}</Text> : null}

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
    <Animated.View style={[styles.container, { backgroundColor }]}>
      {settings?.use_flash && permission?.granted && (
        <CameraView
          style={styles.camera}
          facing="back"
          enableTorch={flashOn}
        />
      )}
      <Animated.View style={[styles.content, { transform: [{ translateX: shakeAnim }] }]}>
        <AlertTriangle size={80} color="#fff" style={styles.icon} />
        <Text style={styles.title}>ALERT!</Text>
        <Text style={styles.subtitle}>Motion detected</Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <PINKeypad
          pin={pin}
          onPinChange={(value) => {
            setPin(value);
            setError('');
          }}
          maxLength={4}
          themeColor="#fff"
          isDarkTheme={true}
        />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  incognitoContainer: {
    backgroundColor: '#000',
  },
  camera: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  icon: {
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  incognitoTitle: {
    color: '#fff',
  },
  subtitle: {
    fontSize: 16,
    color: '#ffcccc',
    marginBottom: 48,
    textAlign: 'center',
  },
  incognitoSubtitle: {
    color: '#999',
  },
  error: {
    color: '#fff',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    padding: 10,
    borderRadius: 8,
    marginBottom: 24,
    textAlign: 'center',
    fontSize: 14,
  },
  incognitoError: {
    color: '#ff4444',
    marginBottom: 24,
    textAlign: 'center',
    fontSize: 14,
  },
});
