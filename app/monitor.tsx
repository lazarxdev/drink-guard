import { View, Text, TouchableOpacity, StyleSheet, Alert, TouchableWithoutFeedback, Animated } from 'react-native';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'expo-router';
import { useApp } from '@/contexts/AppContext';
import { useMotionDetection } from '@/hooks/useMotionDetection';
import { Shield, ShieldAlert, Settings } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { getTheme, isDarkTheme as checkDarkTheme } from '@/utils/theme';
import { supabase } from '@/lib/supabase';
import { verifyPin } from '@/utils/crypto';
import PINKeypad from '@/components/PINKeypad';
import { ShieldToMonitor } from '@/components/animations/ShieldToMonitor';

export default function Monitor() {
  const { settings } = useApp();
  const router = useRouter();
  const [isActivated, setIsActivated] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [showBlackScreen, setShowBlackScreen] = useState(false);
  const [motionEvents, setMotionEvents] = useState<Date[]>([]);
  const [showPinEntry, setShowPinEntry] = useState(false);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [lastEventTime, setLastEventTime] = useState<number | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [isRecalibrating, setIsRecalibrating] = useState(false);
  const [pendingEventTimer, setPendingEventTimer] = useState<NodeJS.Timeout | null>(null);
  const [pendingEvent, setPendingEvent] = useState<Date | null>(null);
  const textOpacity = useRef(new Animated.Value(1)).current;
  const calibratingTextOpacity = useRef(new Animated.Value(0)).current;
  const monitoringTextOpacity = useRef(new Animated.Value(0)).current;
  const stopButtonOpacity = useRef(new Animated.Value(0)).current;
  const { isMonitoring, motionDetected, startMonitoring, stopMonitoring, resetAlert } = useMotionDetection(
    settings?.sensitivity || 40
  );

  const IDLE_TIMEOUT_MS = 10000;
  const RECALIBRATION_MS = 2000;
  const EVENT_LOGGING_GRACE_PERIOD_MS = 5000;

  const themeColor = settings?.theme_color || 'green';
  const theme = getTheme(themeColor);
  const isDarkTheme = checkDarkTheme(themeColor);
  const textColor = isDarkTheme ? '#fff' : '#000';
  const iconColor = isDarkTheme ? theme.primary : '#000';
  const isIncognito = settings?.incognito_mode || false;

  // Ensure text opacity is set correctly when returning to ready state
  useEffect(() => {
    if (!isActivated) {
      textOpacity.setValue(1);
      calibratingTextOpacity.setValue(0);
      monitoringTextOpacity.setValue(0);
      stopButtonOpacity.setValue(0);
    }
  }, [isActivated]);

  useEffect(() => {
    if (motionDetected && !isPaused && isActivated && !isStarting && !isCalibrating) {
      const volumeMuteEnabled = settings?.volume_mute_enabled ?? true;
      const gracePeriod = settings?.grace_period_seconds || 4;
      const useGracePeriod = volumeMuteEnabled && gracePeriod > 0;

      if (isIncognito && showBlackScreen) {
        const now = new Date();
        setMotionEvents(prev => [...prev, now]);
        setLastEventTime(Date.now());
        setPendingEvent(now);

        stopMonitoring();
        setIsPaused(true);

        if (useGracePeriod) {
          router.push('/grace-period');
        } else {
          const timer = setTimeout(() => {
            const saveEvent = async () => {
              try {
                const userId = settings?.user_id;
                if (userId) {
                  await supabase.from('tampering_events').insert({
                    user_id: userId,
                    detected_at: now.toISOString(),
                    acknowledged: false,
                  });
                }
              } catch (error) {
                console.error('Error saving tampering event:', error);
              }
            };

            saveEvent();
            setPendingEvent(null);
            setPendingEventTimer(null);
          }, EVENT_LOGGING_GRACE_PERIOD_MS);

          setPendingEventTimer(timer);
        }
        resetAlert();
      } else if (!isIncognito) {
        if (useGracePeriod) {
          router.push('/grace-period');
        } else {
          router.push('/alert');
        }
      }
    }
  }, [motionDetected, isIncognito, showBlackScreen, isPaused, isActivated, isStarting, isCalibrating, settings?.volume_mute_enabled, settings?.grace_period_seconds]);

  const handleActivate = () => {
    setIsActivated(true);
    setIsStarting(true);
    setIsPaused(false);
    setIsRecalibrating(false);

    // Fade out the "Ready to Guard" text and START button
    Animated.timing(textOpacity, {
      toValue: 0,
      duration: 400,
      useNativeDriver: true,
    }).start();

    calibratingTextOpacity.setValue(0);
    monitoringTextOpacity.setValue(0);
    stopButtonOpacity.setValue(0);
  };


  const handleShieldTransitionComplete = () => {
    setIsStarting(false);
    setIsCalibrating(true);
    startMonitoring();

    // Fade in calibrating text
    Animated.timing(calibratingTextOpacity, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();

    // Wait for calibration period (matching the pulse duration)
    setTimeout(() => {
      // Fade out calibrating text as circle collapses (1200ms to match circle collapse)
      Animated.timing(calibratingTextOpacity, {
        toValue: 0,
        duration: 1200,
        useNativeDriver: true,
      }).start();

      // Start monitoring active text and button fade-in after circle starts collapsing
      setTimeout(() => {
        Animated.parallel([
          Animated.timing(monitoringTextOpacity, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(stopButtonOpacity, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ]).start();
      }, 600); // Start fading in halfway through the circle collapse

      setIsCalibrating(false);
      if (isIncognito) {
        setShowBlackScreen(true);
      }
    }, 1500);
  };

  const handleDeactivate = () => {
    Alert.alert(
      'Deactivate Monitoring',
      'Are you sure you want to stop monitoring?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Stop',
          style: 'destructive',
          onPress: () => {
            if (pendingEventTimer) {
              clearTimeout(pendingEventTimer);
              setPendingEventTimer(null);
            }
            stopMonitoring();
            resetAlert();
            setIsActivated(false);
            setIsStarting(false);
            setIsCalibrating(false);
            setShowBlackScreen(false);
            setMotionEvents([]);
            setShowPinEntry(false);
            setPin('');
            setPinError('');
            setLastEventTime(null);
            setIsPaused(false);
            setIsRecalibrating(false);
            setPendingEvent(null);
            // Reset opacity values
            textOpacity.setValue(1);
            calibratingTextOpacity.setValue(0);
            monitoringTextOpacity.setValue(0);
            stopButtonOpacity.setValue(0);
          },
        },
      ]
    );
  };

  const handleBlackScreenTap = () => {
    setShowPinEntry(true);
  };

  useEffect(() => {
    if (showPinEntry && isPaused && pin.length === 0) {
      const idleTimer = setTimeout(() => {
        setShowPinEntry(false);
        setPinError('');
        setIsRecalibrating(true);

        setTimeout(() => {
          setIsRecalibrating(false);
          setIsPaused(false);
          startMonitoring();
          resetAlert();
        }, RECALIBRATION_MS);
      }, IDLE_TIMEOUT_MS);

      return () => clearTimeout(idleTimer);
    }
  }, [showPinEntry, isPaused, pin]);

  const handlePinSubmit = async () => {
    if (!pin || pin.length !== 4) {
      setPinError('Please enter 4-digit PIN');
      return;
    }

    try {
      const isValid = await verifyPin(pin, settings?.pin_hash || '');

      if (isValid) {
        if (pendingEventTimer) {
          clearTimeout(pendingEventTimer);
          setPendingEventTimer(null);
        }

        if (pendingEvent) {
          setMotionEvents(prev => prev.filter(e => e !== pendingEvent));
          setPendingEvent(null);
        }

        stopMonitoring();
        resetAlert();
        setIsActivated(false);
        setIsStarting(false);
        setIsCalibrating(false);
        setShowBlackScreen(false);
        setMotionEvents([]);
        setShowPinEntry(false);
        setPin('');
        setPinError('');
        setLastEventTime(null);
        setIsPaused(false);
        setIsRecalibrating(false);
        // Reset opacity values
        textOpacity.setValue(1);
        calibratingTextOpacity.setValue(0);
        monitoringTextOpacity.setValue(0);
        stopButtonOpacity.setValue(0);
      } else {
        setPinError('Incorrect PIN');
        setPin('');
      }
    } catch (err) {
      setPinError('Error verifying PIN');
      setPin('');
    }
  };

  useEffect(() => {
    if (pin.length === 4) {
      handlePinSubmit();
    }
  }, [pin]);

  useEffect(() => {
    return () => {
      if (pendingEventTimer) {
        clearTimeout(pendingEventTimer);
      }
    };
  }, [pendingEventTimer]);

  // Black screen for incognito mode
  if (showBlackScreen) {
    if (showPinEntry) {
      return (
        <View style={styles.incognitoContainer}>
          <View style={styles.incognitoContent}>
            <Shield size={80} color={theme.primary} />
            <Text style={styles.incognitoTitle}>Enter PIN</Text>
            {motionEvents.length > 0 && (
              <Text style={styles.incognitoSubtitle}>
                {motionEvents.length} motion {motionEvents.length === 1 ? 'event' : 'events'} detected
              </Text>
            )}

            {pinError ? <Text style={styles.incognitoError}>{pinError}</Text> : null}

            <PINKeypad
              pin={pin}
              onPinChange={(value) => {
                setPin(value);
                setPinError('');
              }}
              maxLength={4}
              themeColor={theme.primary}
              isDarkTheme={true}
            />
          </View>
        </View>
      );
    }

    return (
      <TouchableWithoutFeedback onPress={isRecalibrating ? undefined : handleBlackScreenTap}>
        <View style={styles.blackScreen}>
          {isRecalibrating && (
            <View style={styles.recalibratingOverlay}>
              <ShieldAlert size={60} color={theme.primary} />
              <Text style={styles.recalibratingText}>Recalibrating...</Text>
              <Text style={styles.recalibratingSubtext}>Keep phone still</Text>
            </View>
          )}
        </View>
      </TouchableWithoutFeedback>
    );
  }

  return (
    <LinearGradient colors={theme.gradient} style={styles.container}>
      <TouchableOpacity style={styles.settingsButton} onPress={() => router.push('/settings')}>
        <Settings size={28} color={textColor} />
      </TouchableOpacity>

      <View style={styles.content}>
        {!isActivated ? (
          <View style={styles.activeContent}>
            <View style={styles.shieldContainer}>
              <Shield size={100} color={iconColor} />
            </View>

            <View style={styles.textSection}>
              <Animated.View style={{ opacity: textOpacity, position: 'absolute', width: '100%', alignItems: 'center' }}>
                <Text style={[styles.statusText, { color: textColor }]}>Ready to Guard</Text>
                <Text style={[styles.description, { color: isDarkTheme ? '#999' : '#666' }]}>
                  Place phone on drink and press START
                </Text>
              </Animated.View>
            </View>

            <View style={styles.buttonSection}>
              <Animated.View style={{ opacity: textOpacity }}>
                <TouchableOpacity
                  style={[styles.activateButton, { backgroundColor: isDarkTheme ? theme.primary : '#000' }]}
                  onPress={handleActivate}
                >
                  <Text style={styles.activateButtonText}>START</Text>
                </TouchableOpacity>
              </Animated.View>
            </View>
          </View>
        ) : (
          <>
            <View style={styles.activeContent}>
              <View style={styles.shieldContainer}>
                <ShieldToMonitor
                  isStarting={isStarting}
                  isCalibrating={isCalibrating}
                  isMonitoring={!isCalibrating && !isStarting}
                  color={theme.primary}
                  onTransitionComplete={handleShieldTransitionComplete}
                />
              </View>

              <View style={styles.textSection}>
                <Animated.View pointerEvents="none" style={{ opacity: calibratingTextOpacity, position: 'absolute', width: '100%', alignItems: 'center' }}>
                  <Text style={[styles.statusText, { color: textColor }]}>Calibrating...</Text>
                  <Text style={[styles.description, { color: isDarkTheme ? '#999' : '#666' }]}>
                    Please keep phone still
                  </Text>
                </Animated.View>

                <Animated.View pointerEvents="none" style={{ opacity: monitoringTextOpacity, position: 'absolute', width: '100%', alignItems: 'center' }}>
                  <Text style={[styles.statusText, { color: textColor }]}>Monitoring Active</Text>
                  <Text style={[styles.description, { color: isDarkTheme ? '#999' : '#666' }]}>
                    Movement will trigger alert
                  </Text>
                </Animated.View>
              </View>

              <View style={styles.buttonSection}>
                <Animated.View style={{ opacity: stopButtonOpacity }}>
                  <TouchableOpacity
                    style={[
                      styles.deactivateButton,
                      { backgroundColor: isDarkTheme ? '#333' : '#ddd' },
                    ]}
                    onPress={handleDeactivate}
                  >
                    <Text style={[styles.deactivateButtonText, { color: textColor }]}>STOP</Text>
                  </TouchableOpacity>
                </Animated.View>
              </View>
            </View>
          </>
        )}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  blackScreen: {
    flex: 1,
    backgroundColor: '#000',
  },
  incognitoContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  incognitoContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  incognitoTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 20,
    marginBottom: 8,
  },
  incognitoSubtitle: {
    fontSize: 15,
    color: '#999',
    marginBottom: 32,
    textAlign: 'center',
  },
  incognitoError: {
    color: '#ff4444',
    marginBottom: 24,
    textAlign: 'center',
    fontSize: 14,
  },
  settingsButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 10,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  activeContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  textSection: {
    alignItems: 'center',
    width: '100%',
    marginTop: 24,
    marginBottom: 32,
    height: 90,
    position: 'relative',
  },
  buttonSection: {
    alignItems: 'center',
    width: '100%',
    height: 60,
    justifyContent: 'center',
  },
  shieldContainer: {
    marginBottom: 0,
  },
  activeContainer: {
    marginBottom: 20,
    position: 'relative',
  },
  pulseContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulse: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
  },
  statusText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  activateButton: {
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 60,
    minWidth: 240,
    alignItems: 'center',
  },
  activateButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  deactivateButton: {
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 60,
    minWidth: 240,
    alignItems: 'center',
  },
  deactivateButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  countdownContainer: {
    width: 160,
    height: 160,
    borderRadius: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  countdownNumber: {
    fontSize: 80,
    fontWeight: 'bold',
  },
  recalibratingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    padding: 24,
  },
  recalibratingText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 16,
  },
  recalibratingSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
});
