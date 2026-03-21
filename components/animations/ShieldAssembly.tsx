import { useEffect } from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  withRepeat,
  Easing,
} from 'react-native-reanimated';
import { Shield } from 'lucide-react-native';
import Svg, { Path } from 'react-native-svg';

interface ShieldAssemblyProps {
  countdown: number;
  color: string;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SHIELD_SIZE = Math.min(SCREEN_WIDTH, SCREEN_HEIGHT) * 0.6;

const PIECE_PATHS = [
  'M 0,-40 L 15,-30 L 15,-10 L 0,-5 Z',
  'M 0,-40 L -15,-30 L -15,-10 L 0,-5 Z',
  'M 15,-30 L 30,-15 L 25,5 L 15,-10 Z',
  'M -15,-30 L -30,-15 L -25,5 L -15,-10 Z',
  'M 30,-15 L 35,10 L 25,25 L 25,5 Z',
  'M -30,-15 L -35,10 L -25,25 L -25,5 Z',
  'M 25,25 L 15,40 L 0,45 L 0,30 L 15,20 Z',
  'M -25,25 L -15,40 L 0,45 L 0,30 L -15,20 Z',
];

const PIECE_ORIGINS = [
  { x: 0, y: -SCREEN_HEIGHT },
  { x: 0, y: -SCREEN_HEIGHT },
  { x: SCREEN_WIDTH, y: -SCREEN_HEIGHT / 2 },
  { x: -SCREEN_WIDTH, y: -SCREEN_HEIGHT / 2 },
  { x: SCREEN_WIDTH, y: 0 },
  { x: -SCREEN_WIDTH, y: 0 },
  { x: SCREEN_WIDTH / 2, y: SCREEN_HEIGHT },
  { x: -SCREEN_WIDTH / 2, y: SCREEN_HEIGHT },
];

export function ShieldAssembly({ countdown, color }: ShieldAssemblyProps) {
  const shieldOpacity = useSharedValue(0);
  const shieldScale = useSharedValue(0.5);
  const glowOpacity = useSharedValue(0);
  const glowScale = useSharedValue(0.8);

  const pieceAnimations = PIECE_PATHS.map((_, index) => ({
    x: useSharedValue(PIECE_ORIGINS[index].x),
    y: useSharedValue(PIECE_ORIGINS[index].y),
    opacity: useSharedValue(0),
    rotation: useSharedValue((Math.random() - 0.5) * 180),
  }));

  useEffect(() => {
    pieceAnimations.forEach((piece, index) => {
      const delay = index * 80;

      piece.opacity.value = withDelay(delay, withTiming(1, { duration: 200 }));

      piece.x.value = withDelay(
        delay,
        withTiming(0, {
          duration: 800,
          easing: Easing.out(Easing.cubic),
        })
      );

      piece.y.value = withDelay(
        delay,
        withTiming(0, {
          duration: 800,
          easing: Easing.out(Easing.cubic),
        })
      );

      piece.rotation.value = withDelay(
        delay,
        withTiming(0, {
          duration: 800,
          easing: Easing.out(Easing.back(1.5)),
        })
      );
    });

    shieldOpacity.value = withDelay(700, withTiming(1, { duration: 400 }));
    shieldScale.value = withDelay(
      700,
      withSequence(
        withTiming(1.15, { duration: 400, easing: Easing.out(Easing.back(1.5)) }),
        withTiming(1, { duration: 300 })
      )
    );

    glowOpacity.value = withDelay(
      1000,
      withRepeat(
        withSequence(
          withTiming(0.35, { duration: 1000 }),
          withTiming(0.15, { duration: 1000 })
        ),
        -1,
        true
      )
    );

    glowScale.value = withDelay(
      1000,
      withRepeat(
        withSequence(
          withTiming(1.1, { duration: 1000 }),
          withTiming(1, { duration: 1000 })
        ),
        -1,
        true
      )
    );
  }, []);

  const shieldStyle = useAnimatedStyle(() => ({
    opacity: shieldOpacity.value,
    transform: [{ scale: shieldScale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
    transform: [{ scale: glowScale.value }],
  }));

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.glow, { backgroundColor: color }, glowStyle]} />

      <View style={styles.piecesContainer}>
        {PIECE_PATHS.map((path, index) => {
          const pieceStyle = useAnimatedStyle(() => ({
            transform: [
              { translateX: pieceAnimations[index].x.value },
              { translateY: pieceAnimations[index].y.value },
              { rotate: `${pieceAnimations[index].rotation.value}deg` },
            ],
            opacity: pieceAnimations[index].opacity.value,
          }));

          return (
            <Animated.View
              key={index}
              style={[styles.piece, pieceStyle]}
            >
              <Svg width={SHIELD_SIZE * 1.5} height={SHIELD_SIZE * 1.5} viewBox="-50 -50 100 100">
                <Path
                  d={path}
                  fill={color}
                  opacity={0.7}
                  stroke={color}
                  strokeWidth={0.5}
                />
              </Svg>
            </Animated.View>
          );
        })}
      </View>

      <Animated.View style={[styles.shieldContainer, shieldStyle]}>
        <Shield
          size={SHIELD_SIZE}
          color={color}
          strokeWidth={2.5}
          fill={color}
          fillOpacity={0.12}
        />
      </Animated.View>

      <Animated.Text style={[styles.countdown, { color }]}>
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
  piecesContainer: {
    position: 'absolute',
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  piece: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shieldContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  countdown: {
    position: 'absolute',
    fontSize: Math.min(SCREEN_WIDTH, SCREEN_HEIGHT) * 0.23,
    fontWeight: 'bold',
  },
});
