import { View, Text, StyleSheet, Animated } from 'react-native';
import { useEffect, useRef } from 'react';
import { Volume2, KeyRound } from 'lucide-react-native';

interface GracePeriodCountdownProps {
  seconds: number;
  totalSeconds: number;
  onComplete: () => void;
  themeColor: string;
  showVolumeIcon?: boolean;
}

export default function GracePeriodCountdown({
  seconds,
  totalSeconds,
  onComplete,
  themeColor,
  showVolumeIcon = true,
}: GracePeriodCountdownProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (seconds <= 0) {
      onComplete();
      return;
    }

    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.1,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();

    pulseAnim.setValue(0);
    Animated.timing(pulseAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, [seconds]);

  const progress = seconds / totalSeconds;
  const pulseOpacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 0],
  });
  const pulseScale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.5],
  });

  return (
    <View style={styles.container}>
      {showVolumeIcon ? (
        <View style={styles.iconContainer}>
          <Volume2 size={48} color={themeColor} />
        </View>
      ) : (
        <View style={styles.iconContainer}>
          <KeyRound size={48} color={themeColor} />
        </View>
      )}

      <View style={styles.countdownContainer}>
        <Animated.View
          style={[
            styles.pulseRing,
            {
              borderColor: themeColor,
              opacity: pulseOpacity,
              transform: [{ scale: pulseScale }],
            },
          ]}
        />

        <View style={[styles.progressRing, { borderColor: `${themeColor}40` }]}>
          <View
            style={[
              styles.progressFill,
              {
                borderColor: themeColor,
                borderTopWidth: 6,
                borderRightWidth: progress > 0.25 ? 6 : 0,
                borderBottomWidth: progress > 0.5 ? 6 : 0,
                borderLeftWidth: progress > 0.75 ? 6 : 0,
              },
            ]}
          />

          <Animated.View style={[styles.timeContainer, { transform: [{ scale: scaleAnim }] }]}>
            <Text style={[styles.timeText, { color: themeColor }]}>{seconds}</Text>
          </Animated.View>
        </View>
      </View>

      {showVolumeIcon ? (
        <>
          <Text style={styles.instructionText}>Press volume buttons now</Text>
          <Text style={styles.subText}>Enter your mute sequence</Text>
        </>
      ) : (
        <>
          <Text style={styles.instructionText}>Enter PIN to mute alarm</Text>
          <Text style={styles.subText}>Quick - time is running out!</Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginBottom: 24,
  },
  countdownContainer: {
    width: 160,
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    position: 'relative',
  },
  pulseRing: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 3,
  },
  progressRing: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 6,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  progressFill: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
  },
  timeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeText: {
    fontSize: 64,
    fontWeight: 'bold',
  },
  instructionText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  subText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});
