import { useEffect } from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { Shield } from 'lucide-react-native';

interface ShieldPulseWaveProps {
  countdown: number;
  color: string;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SHIELD_SIZE = Math.min(SCREEN_WIDTH, SCREEN_HEIGHT) * 0.6;

export function ShieldPulseWave({ countdown, color }: ShieldPulseWaveProps) {
  const shieldScale = useSharedValue(0.3);
  const shieldOpacity = useSharedValue(0);
  const shieldRotation = useSharedValue(-10);

  const wave1Scale = useSharedValue(0);
  const wave1Opacity = useSharedValue(0);
  const wave2Scale = useSharedValue(0);
  const wave2Opacity = useSharedValue(0);
  const wave3Scale = useSharedValue(0);
  const wave3Opacity = useSharedValue(0);

  const glowIntensity = useSharedValue(0);
  const countdownScale = useSharedValue(0.5);

  useEffect(() => {
    shieldOpacity.value = withTiming(1, { duration: 300 });
    shieldScale.value = withSequence(
      withTiming(1.2, { duration: 800, easing: Easing.out(Easing.back(1.5)) }),
      withTiming(1, { duration: 400, easing: Easing.inOut(Easing.ease) })
    );
    shieldRotation.value = withSequence(
      withTiming(10, { duration: 600 }),
      withTiming(0, { duration: 600 })
    );

    wave1Scale.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 0 }),
        withTiming(2.5, { duration: 1500, easing: Easing.out(Easing.cubic) })
      ),
      -1,
      false
    );
    wave1Opacity.value = withRepeat(
      withSequence(
        withTiming(0.8, { duration: 300 }),
        withTiming(0, { duration: 1200 })
      ),
      -1,
      false
    );

    wave2Scale.value = withDelay(
      500,
      withRepeat(
        withSequence(
          withTiming(0, { duration: 0 }),
          withTiming(2.5, { duration: 1500, easing: Easing.out(Easing.cubic) })
        ),
        -1,
        false
      )
    );
    wave2Opacity.value = withDelay(
      500,
      withRepeat(
        withSequence(
          withTiming(0.6, { duration: 300 }),
          withTiming(0, { duration: 1200 })
        ),
        -1,
        false
      )
    );

    wave3Scale.value = withDelay(
      1000,
      withRepeat(
        withSequence(
          withTiming(0, { duration: 0 }),
          withTiming(2.5, { duration: 1500, easing: Easing.out(Easing.cubic) })
        ),
        -1,
        false
      )
    );
    wave3Opacity.value = withDelay(
      1000,
      withRepeat(
        withSequence(
          withTiming(0.4, { duration: 300 }),
          withTiming(0, { duration: 1200 })
        ),
        -1,
        false
      )
    );

    glowIntensity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 800 }),
        withTiming(0.5, { duration: 800 })
      ),
      -1,
      true
    );

    countdownScale.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 500 }),
        withTiming(1, { duration: 500 })
      ),
      -1,
      true
    );
  }, []);

  const shieldStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: shieldScale.value },
      { rotate: `${shieldRotation.value}deg` },
    ],
    opacity: shieldOpacity.value,
  }));

  const wave1Style = useAnimatedStyle(() => ({
    transform: [{ scale: wave1Scale.value }],
    opacity: wave1Opacity.value,
  }));

  const wave2Style = useAnimatedStyle(() => ({
    transform: [{ scale: wave2Scale.value }],
    opacity: wave2Opacity.value,
  }));

  const wave3Style = useAnimatedStyle(() => ({
    transform: [{ scale: wave3Scale.value }],
    opacity: wave3Opacity.value,
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowIntensity.value * 0.3,
    transform: [{ scale: 1 + glowIntensity.value * 0.2 }],
  }));

  const countdownTextStyle = useAnimatedStyle(() => ({
    transform: [{ scale: countdownScale.value }],
  }));

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.glow, { backgroundColor: color }, glowStyle]} />

      <Animated.View style={[styles.wave, { borderColor: color }, wave3Style]} />
      <Animated.View style={[styles.wave, { borderColor: color }, wave2Style]} />
      <Animated.View style={[styles.wave, { borderColor: color }, wave1Style]} />

      <Animated.View style={[styles.shieldContainer, shieldStyle]}>
        <Shield size={SHIELD_SIZE} color={color} strokeWidth={2} fill={color} fillOpacity={0.1} />
      </Animated.View>

      <Animated.Text style={[styles.countdown, { color }, countdownTextStyle]}>
        {countdown}
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
    width: SHIELD_SIZE * 0.8,
    height: SHIELD_SIZE * 0.8,
    borderRadius: SHIELD_SIZE * 0.4,
  },
  wave: {
    position: 'absolute',
    width: SHIELD_SIZE,
    height: SHIELD_SIZE,
    borderRadius: SHIELD_SIZE / 2,
    borderWidth: 4,
  },
  shieldContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  countdown: {
    position: 'absolute',
    fontSize: Math.min(SCREEN_WIDTH, SCREEN_HEIGHT) * 0.25,
    fontWeight: 'bold',
  },
});
