import { useEffect } from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withRepeat,
  Easing,
} from 'react-native-reanimated';
import { Shield } from 'lucide-react-native';

interface DescendingGuardianProps {
  countdown: number;
  color: string;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const FINAL_SHIELD_SIZE = 100;

export function DescendingGuardian({ countdown, color }: DescendingGuardianProps) {
  const translateY = useSharedValue(-SCREEN_HEIGHT);
  const scale = useSharedValue(3);
  const rotation = useSharedValue(-15);
  const opacity = useSharedValue(0);
  const glowOpacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 400 });
    translateY.value = withTiming(0, {
      duration: 1800,
      easing: Easing.out(Easing.cubic),
    });
    scale.value = withTiming(1, {
      duration: 1800,
      easing: Easing.out(Easing.cubic),
    });
    rotation.value = withSequence(
      withTiming(8, { duration: 900 }),
      withTiming(0, { duration: 900 })
    );

    glowOpacity.value = withSequence(
      withTiming(0, { duration: 1200 }),
      withRepeat(
        withSequence(
          withTiming(0.4, { duration: 800 }),
          withTiming(0.15, { duration: 800 })
        ),
        -1,
        true
      )
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { scale: scale.value },
      { rotate: `${rotation.value}deg` },
    ],
    opacity: opacity.value,
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  return (
    <View style={styles.fullScreen}>
      <Animated.View style={[styles.glowContainer, glowStyle]}>
        <View style={[styles.glow, { backgroundColor: color }]} />
      </Animated.View>

      <Animated.View style={[styles.container, animatedStyle]}>
        <Shield size={FINAL_SHIELD_SIZE} color={color} strokeWidth={4} fill={color} fillOpacity={0.2} />
        <Animated.Text style={[styles.countdown, { color }]}>
          {countdown}
        </Animated.Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  fullScreen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 200,
    height: 200,
  },
  glowContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    width: FINAL_SHIELD_SIZE * 0.85,
    height: FINAL_SHIELD_SIZE * 0.85,
    borderRadius: FINAL_SHIELD_SIZE * 0.425,
  },
  countdown: {
    position: 'absolute',
    fontSize: 48,
    fontWeight: 'bold',
  },
});
