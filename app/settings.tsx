import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, Switch, RefreshControl, Modal, Animated, Dimensions } from 'react-native';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useApp } from '@/contexts/AppContext';
import { ChevronLeft, Volume2, Palette, FileSliders as Sliders, Trash2, Flashlight, EyeOff, KeyRound, History, RefreshCw, Circle as HelpCircle, ChevronDown, ChevronUp, ChevronRight, Clock } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Slider from '@react-native-community/slider';
import { THEME_COLORS, getTheme, isDarkTheme as checkDarkTheme } from '@/utils/theme';
import { Audio } from 'expo-av';
import { ALARM_SOUNDS } from '@/utils/alarm';
import { supabase } from '@/lib/supabase';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import { parseVolumeSequence } from '@/hooks/useVolumeButtons';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const STANDARD_ALARM_OPTIONS = [
  { id: 'bell', name: 'Bell', description: 'Classic - Attention-grabbing' },
  { id: 'alarm', name: 'Alarm', description: 'Modern - Generic beeping' },
  { id: 'buzzer', name: 'Buzzer', description: 'Soft - Gentle notification' },
];

const CUSTOM_ALARM_OPTIONS = [
  { id: 'FahHhH', name: 'FahHhH', description: 'Custom - Your personal sound' },
  { id: 'aaaa', name: 'aaaa', description: 'aaaa - the sound, but loud' },
  { id: 'wack', name: 'wack', description: 'bc we are charlie kirk' },
];

interface TamperingEvent {
  id: string;
  detected_at: string;
  acknowledged: boolean;
}

export default function Settings() {
  const router = useRouter();
  const { settings, updateSensitivity, updateThemeColor, updateAlarmSound, updateUseFlash, updateIncognitoMode, updateVolumeMuteEnabled, updateGracePeriod } = useApp();
  const [sensitivity, setSensitivity] = useState(settings?.sensitivity ?? 40);
  const [gracePeriod, setGracePeriod] = useState(settings?.grace_period_seconds ?? 4);
  const [slidersReady, setSlidersReady] = useState(false);
  const [tamperingEvents, setTamperingEvents] = useState<TamperingEvent[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showCustomSounds, setShowCustomSounds] = useState(false);
  const [showHowToUse, setShowHowToUse] = useState(false);
  const themeColor = settings?.theme_color || 'green';
  const theme = getTheme(themeColor);
  const previewSoundRef = useRef<Audio.Sound | null>(null);

  // Animation values
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  // Sync sliders with loaded settings - delay render until after
  // entry animation so the native iOS slider calculates thumb position
  // correctly against a stable layout
  useEffect(() => {
    if (settings) {
      if (settings.sensitivity !== undefined) setSensitivity(settings.sensitivity);
      if (settings.grace_period_seconds !== undefined) setGracePeriod(settings.grace_period_seconds);
      const timer = setTimeout(() => setSlidersReady(true), 300);
      return () => clearTimeout(timer);
    }
  }, [settings?.sensitivity, settings?.grace_period_seconds]);

  useFocusEffect(
    useCallback(() => {
      loadTamperingEvents();
    }, [])
  );

  useEffect(() => {
    // Entry animation
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 200,
        friction: 20,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 200,
        friction: 20,
      }),
    ]).start();

    return () => {
      if (previewSoundRef.current) {
        previewSoundRef.current.unloadAsync();
      }
    };
  }, []);

  const loadTamperingEvents = async () => {
    try {
      setLoadingEvents(true);
      const userId = settings?.user_id;
      if (!userId) return;

      const { data, error } = await supabase
        .from('tampering_events')
        .select('*')
        .eq('user_id', userId)
        .order('detected_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching tampering events:', error);
        return;
      }

      setTamperingEvents(data || []);

      const unacknowledgedEvents = data?.filter(e => !e.acknowledged) || [];
      if (unacknowledgedEvents.length > 0) {
        const eventIds = unacknowledgedEvents.map(e => e.id);
        await supabase
          .from('tampering_events')
          .update({ acknowledged: true })
          .in('id', eventIds);
      }
    } catch (err) {
      console.error('Error loading tampering events:', err);
    } finally {
      setLoadingEvents(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadTamperingEvents();
    setRefreshing(false);
  };

  const handleSensitivityChange = async (value: number) => {
    setSensitivity(Math.round(value));
    try {
      await updateSensitivity(Math.round(value));
    } catch (error) {
      Alert.alert('Error', 'Failed to update sensitivity');
    }
  };

  const handleThemeChange = async (color: string) => {
    try {
      await updateThemeColor(color);
    } catch (error) {
      Alert.alert('Error', 'Failed to update theme color');
    }
  };

  const playPreview = async (soundId: string) => {
    try {
      // Stop any currently playing preview
      if (previewSoundRef.current) {
        try {
          const status = await previewSoundRef.current.getStatusAsync();
          if (status.isLoaded) {
            await previewSoundRef.current.stopAsync();
            await previewSoundRef.current.unloadAsync();
          }
        } catch (error) {
          console.error('Error cleaning up previous sound:', error);
        }
        previewSoundRef.current = null;
      }

      // Set up audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
      });

      // Get the sound source
      const soundSource = ALARM_SOUNDS[soundId as keyof typeof ALARM_SOUNDS];
      if (!soundSource) {
        Alert.alert('Error', 'Sound not available');
        return;
      }

      // Create and play the preview sound
      const { sound } = await Audio.Sound.createAsync(
        typeof soundSource === 'string' ? { uri: soundSource } : soundSource,
        { shouldPlay: true, isLooping: false, volume: 0.7 }
      );

      previewSoundRef.current = sound;

      // Auto-stop after 2 seconds
      setTimeout(async () => {
        try {
          if (previewSoundRef.current) {
            const status = await previewSoundRef.current.getStatusAsync();
            if (status.isLoaded) {
              await previewSoundRef.current.stopAsync();
              await previewSoundRef.current.unloadAsync();
            }
            previewSoundRef.current = null;
          }
        } catch (error) {
          console.error('Error stopping preview sound:', error);
          previewSoundRef.current = null;
        }
      }, 2000);
    } catch (error) {
      console.error('Error playing preview:', error);
      Alert.alert('Error', 'Failed to play preview. Please check your connection.');
    }
  };

  const handleAlarmSoundChange = async (soundId: string) => {
    try {
      await updateAlarmSound(soundId);
      await playPreview(soundId);
    } catch (error) {
      Alert.alert('Error', 'Failed to update alarm sound');
    }
  };

  const handleFlashToggle = async (value: boolean) => {
    try {
      await updateUseFlash(value);
    } catch (error) {
      Alert.alert('Error', 'Failed to update flash setting');
    }
  };

  const handleIncognitoToggle = async (value: boolean) => {
    try {
      await updateIncognitoMode(value);
    } catch (error) {
      Alert.alert('Error', 'Failed to update incognito mode');
    }
  };

  const handleVolumeMuteToggle = async (value: boolean) => {
    try {
      await updateVolumeMuteEnabled(value);
    } catch (error) {
      Alert.alert('Error', 'Failed to update volume mute setting');
    }
  };

  const handleGracePeriodChange = async (value: number) => {
    const rounded = Math.round(value);
    setGracePeriod(rounded);
    try {
      await updateGracePeriod(rounded);
    } catch (error) {
      Alert.alert('Error', 'Failed to update grace period');
    }
  };

  const handleClearHistory = () => {
    Alert.alert(
      'Clear Activity History',
      'This will delete all acknowledged motion detection events. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              const userId = settings?.user_id;
              if (!userId) return;

              const { error } = await supabase
                .from('tampering_events')
                .delete()
                .eq('user_id', userId)
                .eq('acknowledged', true);

              if (error) {
                Alert.alert('Error', 'Failed to clear history');
                return;
              }

              await loadTamperingEvents();
              Alert.alert('Success', 'Activity history cleared');
            } catch (err) {
              Alert.alert('Error', 'Failed to clear history');
            }
          },
        },
      ]
    );
  };

  const handleClearData = () => {
    Alert.alert(
      'Clear All Data',
      'This will reset all settings and remove your PIN. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear Data',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Info', 'This feature requires additional implementation for data clearing');
          },
        },
      ]
    );
  };

  const handleBack = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: SCREEN_HEIGHT,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 120,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      router.back();
    });
  };

  const isDarkTheme = checkDarkTheme(themeColor);
  const textColor = isDarkTheme ? '#fff' : '#000';
  const secondaryTextColor = isDarkTheme ? '#999' : '#666';
  const cardBg = isDarkTheme ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)';
  const iconColor = isDarkTheme ? theme.primary : '#000';
  const accentColor = isDarkTheme ? theme.primary : '#000';

  return (
    <View style={styles.container}>
      <Animated.View
        style={{
          flex: 1,
          opacity: fadeAnim,
          transform: [
            { translateY: slideAnim },
            { scale: scaleAnim },
          ],
        }}
      >
        <LinearGradient colors={theme.gradient} style={styles.gradientContainer}>
          <View style={styles.header}>
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <ChevronLeft size={28} color={textColor} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: textColor }]}>Settings</Text>
          </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={theme.primary} />
        }
      >
        <View style={[styles.section, { backgroundColor: cardBg }]}>
          <TouchableOpacity
            style={styles.howToUseHeader}
            onPress={() => setShowHowToUse(!showHowToUse)}
            activeOpacity={0.7}
          >
            <View style={styles.sectionHeader}>
              <HelpCircle size={24} color={iconColor} />
              <Text style={[styles.sectionTitle, { color: textColor }]}>How to Use</Text>
            </View>
            {showHowToUse ? (
              <ChevronUp size={24} color={iconColor} />
            ) : (
              <ChevronDown size={24} color={iconColor} />
            )}
          </TouchableOpacity>

          {showHowToUse && (
            <View style={styles.howToUseContent}>
              <View style={styles.instructionStep}>
                <Text style={[styles.stepNumber, { color: accentColor }]}>1</Text>
                <View style={styles.stepContent}>
                  <Text style={[styles.stepTitle, { color: textColor }]}>Set Your PIN</Text>
                  <Text style={[styles.stepDescription, { color: secondaryTextColor }]}>
                    Create a 4-digit PIN to secure your monitoring. You'll need this to stop alerts.
                  </Text>
                </View>
              </View>

              <View style={styles.instructionStep}>
                <Text style={[styles.stepNumber, { color: accentColor }]}>2</Text>
                <View style={styles.stepContent}>
                  <Text style={[styles.stepTitle, { color: textColor }]}>Adjust Settings</Text>
                  <Text style={[styles.stepDescription, { color: secondaryTextColor }]}>
                    Customize sensitivity, alarm sound, theme, and enable features like flash alerts or incognito mode.
                  </Text>
                </View>
              </View>

              <View style={styles.instructionStep}>
                <Text style={[styles.stepNumber, { color: accentColor }]}>3</Text>
                <View style={styles.stepContent}>
                  <Text style={[styles.stepTitle, { color: textColor }]}>Start Monitoring</Text>
                  <Text style={[styles.stepDescription, { color: secondaryTextColor }]}>
                    Place your phone on or near your drink and press START. Wait for the countdown and calibration.
                  </Text>
                </View>
              </View>

              <View style={styles.instructionStep}>
                <Text style={[styles.stepNumber, { color: accentColor }]}>4</Text>
                <View style={styles.stepContent}>
                  <Text style={[styles.stepTitle, { color: textColor }]}>Alert Response</Text>
                  <Text style={[styles.stepDescription, { color: secondaryTextColor }]}>
                    If motion is detected, an alarm will sound. Enter your PIN to stop the alert. In incognito mode, events are logged silently.
                  </Text>
                </View>
              </View>

              <View style={[styles.proTipBox, { backgroundColor: `${accentColor}15`, borderColor: `${accentColor}40` }]}>
                <Text style={[styles.proTipTitle, { color: accentColor }]}>Pro Tips</Text>
                <Text style={[styles.proTipText, { color: secondaryTextColor }]}>
                  • Higher sensitivity detects smaller movements{'\n'}
                  • Incognito mode is perfect for discreet monitoring{'\n'}
                  • Flash alerts work great in dark environments{'\n'}
                  • Check Recent Activity for logged events
                </Text>
              </View>
            </View>
          )}
        </View>

        <View style={[styles.section, { backgroundColor: cardBg }]}>
          <View style={styles.sectionHeader}>
            <Sliders size={24} color={iconColor} />
            <Text style={[styles.sectionTitle, { color: textColor }]}>Detection Sensitivity</Text>
          </View>
          <Text style={[styles.sectionDescription, { color: secondaryTextColor }]}>
            Adjust how sensitive motion detection is
          </Text>
          <View style={styles.sliderContainer}>
            <Text style={[styles.sensitivityValue, { color: accentColor }]}>
              {sensitivity}%
            </Text>
            {slidersReady && (
              <Slider
                key={`sensitivity-${settings?.sensitivity ?? 40}`}
                style={styles.slider}
                minimumValue={10}
                maximumValue={100}
                step={1}
                value={settings?.sensitivity ?? 40}
                onValueChange={(v) => setSensitivity(Math.round(v))}
                onSlidingComplete={handleSensitivityChange}
                minimumTrackTintColor={accentColor}
                maximumTrackTintColor={isDarkTheme ? '#333' : '#ddd'}
                thumbTintColor={accentColor}
              />
            )}
            <View style={styles.sliderLabels}>
              <Text style={[styles.sliderLabel, { color: secondaryTextColor }]}>Less Sensitive</Text>
              <Text style={[styles.sliderLabel, { color: secondaryTextColor }]}>More Sensitive</Text>
            </View>
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: cardBg }]}>
          <View style={styles.sectionHeader}>
            <Palette size={24} color={iconColor} />
            <Text style={[styles.sectionTitle, { color: textColor }]}>Theme Color</Text>
          </View>
          <Text style={[styles.sectionDescription, { color: secondaryTextColor }]}>
            Choose your preferred app color scheme
          </Text>
          <View style={styles.colorGrid}>
            {Object.entries(THEME_COLORS).map(([colorKey, colorValue]) => (
              <TouchableOpacity
                key={colorKey}
                style={[
                  styles.colorOption,
                  {
                    backgroundColor: colorValue.primary,
                    borderWidth: themeColor === colorKey ? 4 : 2,
                    borderColor: themeColor === colorKey
                      ? (isDarkTheme ? '#fff' : '#000')
                      : (isDarkTheme ? '#444' : '#ccc'),
                  },
                ]}
                onPress={() => handleThemeChange(colorKey)}
              >
                {themeColor === colorKey && (
                  <View style={[styles.colorCheck, {
                    backgroundColor: colorKey === 'white' ? 'rgba(0, 0, 0, 0.7)' : 'rgba(0, 0, 0, 0.3)'
                  }]}>
                    <Text style={styles.colorCheckText}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.colorLabels}>
            {Object.keys(THEME_COLORS).map((colorKey) => (
              <Text
                key={colorKey}
                style={[
                  styles.colorLabel,
                  { color: themeColor === colorKey ? accentColor : secondaryTextColor },
                ]}
              >
                {colorKey.charAt(0).toUpperCase() + colorKey.slice(1)}
              </Text>
            ))}
          </View>
        </View>


        <View style={[styles.section, { backgroundColor: cardBg }]}>
          <View style={styles.sectionHeader}>
            <Clock size={24} color={iconColor} />
            <Text style={[styles.sectionTitle, { color: textColor }]}>Grace Period</Text>
          </View>
          <Text style={[styles.sectionDescription, { color: secondaryTextColor }]}>
            Time delay after motion detected to enter PIN and prevent alarm from sounding
          </Text>
          <View style={styles.flashToggleContainer}>
            <Text style={[styles.flashToggleLabel, { color: textColor }]}>
              Enable Grace Period
            </Text>
            <Switch
              value={settings?.volume_mute_enabled ?? true}
              onValueChange={handleVolumeMuteToggle}
              trackColor={{ false: isDarkTheme ? '#333' : '#ddd', true: `${accentColor}80` }}
              thumbColor={settings?.volume_mute_enabled ? accentColor : isDarkTheme ? '#666' : '#f4f3f4'}
            />
          </View>

          {(settings?.volume_mute_enabled ?? true) && (
            <>
              <View style={styles.sliderContainer}>
                <View style={styles.gracePeriodHeader}>
                  <Text style={[styles.flashToggleLabel, { color: textColor }]}>
                    Grace Period: {gracePeriod}s
                  </Text>
                </View>
                <Text style={[styles.sectionDescription, { color: secondaryTextColor, marginBottom: 12 }]}>
                  Seconds to enter PIN after motion is detected
                </Text>
                <Slider
                  key={`grace-${settings?.grace_period_seconds ?? 4}`}
                  style={styles.slider}
                  minimumValue={2}
                  maximumValue={7}
                  step={1}
                  value={settings?.grace_period_seconds ?? 4}
                  onValueChange={(v) => setGracePeriod(Math.round(v))}
                  onSlidingComplete={handleGracePeriodChange}
                  minimumTrackTintColor={accentColor}
                  maximumTrackTintColor={isDarkTheme ? '#333' : '#ddd'}
                  thumbTintColor={accentColor}
                />
                <View style={styles.sliderLabels}>
                  <Text style={[styles.sliderLabel, { color: secondaryTextColor }]}>2 seconds</Text>
                  <Text style={[styles.sliderLabel, { color: secondaryTextColor }]}>7 seconds</Text>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.settingButton, { borderColor: isDarkTheme ? '#333' : '#ddd' }]}
                onPress={() => router.push('/setup-volume-sequence')}
              >
                <View style={styles.settingButtonContent}>
                  <Text style={[styles.settingButtonLabel, { color: textColor }]}>
                    {parseVolumeSequence(settings?.volume_mute_sequence || null).length > 0
                      ? 'Volume Sequence (Optional)'
                      : 'Set Volume Sequence (Optional)'}
                  </Text>
                  <Text style={[styles.sequencePreview, { color: secondaryTextColor }]}>
                    {parseVolumeSequence(settings?.volume_mute_sequence || null).length > 0
                      ? `${parseVolumeSequence(settings?.volume_mute_sequence || null).length} button pattern configured`
                      : 'Use volume buttons as alternative to PIN during grace period'}
                  </Text>
                </View>
                <ChevronRight size={20} color={iconColor} />
              </TouchableOpacity>
            </>
          )}
        </View>

        <View style={[styles.section, { backgroundColor: cardBg }]}>
          <View style={styles.sectionHeader}>
            <EyeOff size={24} color={iconColor} />
            <Text style={[styles.sectionTitle, { color: textColor }]}>Incognito Mode</Text>
          </View>
          <Text style={[styles.sectionDescription, { color: secondaryTextColor }]}>
            Silent alert mode - no sound, no vibration, just locks to PIN screen
          </Text>
          <View style={styles.flashToggleContainer}>
            <Text style={[styles.flashToggleLabel, { color: textColor }]}>
              Enable Stealth Mode
            </Text>
            <Switch
              value={settings?.incognito_mode || false}
              onValueChange={handleIncognitoToggle}
              trackColor={{ false: isDarkTheme ? '#333' : '#ddd', true: `${accentColor}80` }}
              thumbColor={settings?.incognito_mode ? accentColor : isDarkTheme ? '#666' : '#f4f3f4'}
            />
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: cardBg }]}>
          <View style={styles.sectionHeaderWithAction}>
            <View style={styles.sectionHeader}>
              <History size={24} color={iconColor} />
              <Text style={[styles.sectionTitle, { color: textColor }]}>Recent Activity</Text>
            </View>
            <TouchableOpacity
              onPress={handleRefresh}
              disabled={loadingEvents}
              style={styles.refreshButton}
            >
              <RefreshCw size={20} color={iconColor} />
            </TouchableOpacity>
          </View>
          <Text style={[styles.sectionDescription, { color: secondaryTextColor }]}>
            Motion detection events from Incognito Mode
          </Text>

          {loadingEvents ? (
            <Text style={[styles.emptyText, { color: secondaryTextColor }]}>Loading...</Text>
          ) : tamperingEvents.length === 0 ? (
            <Text style={[styles.emptyText, { color: secondaryTextColor }]}>No activity recorded yet</Text>
          ) : (
            <>
              <View style={styles.activityList}>
                {tamperingEvents.map((event) => {
                  const eventDate = new Date(event.detected_at);
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

                  return (
                    <View
                      key={event.id}
                      style={[
                        styles.activityItem,
                        { borderColor: isDarkTheme ? '#333' : '#ddd' },
                      ]}
                    >
                      <View style={styles.activityContent}>
                        <View style={[styles.activityDot, {
                          backgroundColor: event.acknowledged ? (isDarkTheme ? '#666' : '#999') : accentColor
                        }]} />
                        <View style={styles.activityDetails}>
                          <Text style={[styles.activityTime, { color: textColor }]}>
                            {timeString}
                          </Text>
                          <Text style={[styles.activityDate, { color: secondaryTextColor }]}>
                            {dateString}
                          </Text>
                        </View>
                      </View>
                      {!event.acknowledged && (
                        <View style={[styles.newBadge, { backgroundColor: accentColor }]}>
                          <Text style={styles.newBadgeText}>NEW</Text>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
              {tamperingEvents.some(e => e.acknowledged) && (
                <TouchableOpacity
                  style={[styles.clearHistoryButton, { borderColor: isDarkTheme ? '#333' : '#ddd' }]}
                  onPress={handleClearHistory}
                >
                  <Text style={[styles.clearHistoryButtonText, { color: textColor }]}>
                    Clear Acknowledged Events
                  </Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </View>

        <View style={[styles.section, { backgroundColor: cardBg }]}>
          <View style={styles.sectionHeader}>
            <Flashlight size={24} color={iconColor} />
            <Text style={[styles.sectionTitle, { color: textColor }]}>Flash Alert</Text>
          </View>
          <Text style={[styles.sectionDescription, { color: secondaryTextColor }]}>
            Enable camera flash when motion is detected
          </Text>
          <View style={styles.flashToggleContainer}>
            <Text style={[styles.flashToggleLabel, { color: textColor }]}>
              Use Flashlight
            </Text>
            <Switch
              value={settings?.use_flash || false}
              onValueChange={handleFlashToggle}
              trackColor={{ false: isDarkTheme ? '#333' : '#ddd', true: `${accentColor}80` }}
              thumbColor={settings?.use_flash ? accentColor : isDarkTheme ? '#666' : '#f4f3f4'}
              disabled={settings?.incognito_mode || false}
            />
          </View>
          {settings?.incognito_mode && (
            <Text style={[styles.disabledNote, { color: secondaryTextColor }]}>
              Disabled in Incognito Mode
            </Text>
          )}
        </View>

        <View style={[styles.section, { backgroundColor: cardBg }]}>
          <View style={styles.sectionHeaderWithAction}>
            <View style={styles.sectionHeader}>
              <TouchableOpacity
                onPress={() => setShowCustomSounds(!showCustomSounds)}
                style={styles.easterEggButton}
              >
                <Volume2 size={24} color={showCustomSounds ? accentColor : iconColor} />
              </TouchableOpacity>
              <Text style={[styles.sectionTitle, { color: textColor }]}>Alarm Sound</Text>
            </View>
          </View>
          <Text style={[styles.sectionDescription, { color: secondaryTextColor }]}>
            Select the sound that plays when motion is detected. Tap to preview.
          </Text>
          <View style={styles.soundList}>
            {STANDARD_ALARM_OPTIONS.map((sound) => (
              <TouchableOpacity
                key={sound.id}
                style={[
                  styles.soundOption,
                  {
                    backgroundColor: settings?.alarm_sound === sound.id
                      ? `${accentColor}20`
                      : 'transparent',
                    borderColor: settings?.alarm_sound === sound.id
                      ? accentColor
                      : isDarkTheme
                      ? '#333'
                      : '#ddd',
                  },
                ]}
                onPress={() => handleAlarmSoundChange(sound.id)}
              >
                <View style={styles.soundInfo}>
                  <Text style={[styles.soundName, { color: textColor }]}>
                    {sound.name}
                  </Text>
                  <Text style={[styles.soundDescription, { color: secondaryTextColor }]}>
                    {sound.description}
                  </Text>
                </View>
                {settings?.alarm_sound === sound.id && (
                  <View style={[styles.soundCheck, { backgroundColor: accentColor }]}>
                    <Text style={styles.soundCheckText}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
            {showCustomSounds && CUSTOM_ALARM_OPTIONS.map((sound) => (
              <TouchableOpacity
                key={sound.id}
                style={[
                  styles.soundOption,
                  {
                    backgroundColor: settings?.alarm_sound === sound.id
                      ? `${accentColor}20`
                      : 'transparent',
                    borderColor: settings?.alarm_sound === sound.id
                      ? accentColor
                      : isDarkTheme
                      ? '#333'
                      : '#ddd',
                  },
                ]}
                onPress={() => handleAlarmSoundChange(sound.id)}
              >
                <View style={styles.soundInfo}>
                  <Text style={[styles.soundName, { color: textColor }]}>
                    {sound.name}
                  </Text>
                  <Text style={[styles.soundDescription, { color: secondaryTextColor }]}>
                    {sound.description}
                  </Text>
                </View>
                {settings?.alarm_sound === sound.id && (
                  <View style={[styles.soundCheck, { backgroundColor: accentColor }]}>
                    <Text style={styles.soundCheckText}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: cardBg }]}>
          <View style={styles.sectionHeader}>
            <KeyRound size={24} color={iconColor} />
            <Text style={[styles.sectionTitle, { color: textColor }]}>Security</Text>
          </View>
          <Text style={[styles.sectionDescription, { color: secondaryTextColor }]}>Change your PIN code</Text>
          <TouchableOpacity
            style={[styles.resetPinButton, { borderColor: isDarkTheme ? '#333' : '#ddd' }]}
            onPress={() => router.push('/reset-pin')}
          >
            <Text style={[styles.resetPinButtonText, { color: textColor }]}>Reset PIN</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.section, { backgroundColor: cardBg }]}>
          <View style={styles.sectionHeader}>
            <Trash2 size={24} color="#FF5252" />
            <Text style={[styles.sectionTitle, { color: textColor }]}>Data Management</Text>
          </View>
          <Text style={[styles.sectionDescription, { color: secondaryTextColor }]}>
            Reset app settings and clear all data
          </Text>
          <TouchableOpacity style={styles.dangerButton} onPress={handleClearData}>
            <Text style={styles.dangerButtonText}>Clear All Data</Text>
          </TouchableOpacity>
        </View>

          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: secondaryTextColor }]}>
              Drink Guardian v2.1
            </Text>
            <Text style={[styles.footerText, { color: secondaryTextColor }]}>
              Keep your drink safe
            </Text>
          </View>
        </ScrollView>
        </LinearGradient>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  gradientContainer: {
    flex: 1,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionHeaderWithAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 12,
  },
  refreshButton: {
    padding: 8,
  },
  sectionDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
  sliderContainer: {
    marginTop: 10,
  },
  sensitivityValue: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  sliderLabel: {
    fontSize: 12,
  },
  colorGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 10,
  },
  colorOption: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  colorCheck: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorCheckText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  colorLabels: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
  },
  colorLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  soundList: {
    gap: 12,
  },
  soundOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
  },
  soundInfo: {
    flex: 1,
  },
  soundName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  soundDescription: {
    fontSize: 13,
  },
  soundCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  soundCheckText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  dangerButton: {
    backgroundColor: '#FF5252',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 10,
  },
  dangerButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    alignItems: 'center',
    marginTop: 20,
    paddingVertical: 20,
  },
  footerText: {
    fontSize: 12,
    marginBottom: 4,
  },
  flashToggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  flashToggleLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  disabledNote: {
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 8,
  },
  resetPinButton: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 10,
    borderWidth: 2,
  },
  resetPinButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  activityList: {
    gap: 10,
    maxHeight: 300,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  activityContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  activityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  activityDetails: {
    flex: 1,
  },
  activityTime: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  activityDate: {
    fontSize: 13,
  },
  newBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  newBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 20,
    fontStyle: 'italic',
  },
  clearHistoryButton: {
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 16,
    borderWidth: 1,
  },
  clearHistoryButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  easterEggButton: {
    padding: 8,
  },
  howToUseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  howToUseContent: {
    marginTop: 16,
    gap: 20,
  },
  instructionStep: {
    flexDirection: 'row',
    gap: 16,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 32,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  proTipBox: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 8,
  },
  settingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    marginBottom: 16,
  },
  settingButtonContent: {
    flex: 1,
  },
  settingButtonLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  sequencePreview: {
    fontSize: 13,
  },
  gracePeriodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  proTipTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  proTipText: {
    fontSize: 13,
    lineHeight: 20,
  },
  animationScrollView: {
    marginVertical: 10,
  },
  animationGrid: {
    flexDirection: 'row',
    gap: 12,
    paddingRight: 20,
  },
  animationCard: {
    width: 200,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
  },
  animationCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  animationName: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  animationCheck: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  animationCheckText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  animationDescription: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 12,
  },
  previewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
  },
  previewButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  previewModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewModalContent: {
    width: '80%',
    padding: 30,
    borderRadius: 20,
    alignItems: 'center',
    gap: 20,
  },
  previewModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closePreviewButton: {
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 12,
    marginTop: 10,
  },
  closePreviewButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
