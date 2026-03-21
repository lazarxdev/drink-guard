import { useEffect, useRef } from 'react';
import { StyleSheet, View, Animated, Easing, Dimensions } from 'react-native';
import { Shield } from 'lucide-react-native';

interface ShieldToMonitorProps {
  isStarting: boolean;
  isCalibrating: boolean;
  isMonitoring: boolean;
  color: string;
  onTransitionComplete?: () => void;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const BASE_SHIELD_SIZE = 300; // Larger base size for better resolution when scaled
const SCALE_DOWN_FACTOR = 0.33; // Scale down to maintain same visual size as before (100px)

export function ShieldToMonitor({
  isStarting,
  isCalibrating,
  isMonitoring,
  color,
  onTransitionComplete
}: ShieldToMonitorProps) {
  const shieldScale = useRef(new Animated.Value(SCALE_DOWN_FACTOR)).current;
  const shieldTranslateY = useRef(new Animated.Value(0)).current;
  const shieldRotate = useRef(new Animated.Value(0)).current;
  const circleOpacity = useRef(new Animated.Value(0)).current;
  const circleScale = useRef(new Animated.Value(0.8)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const exclamationOpacity = useRef(new Animated.Value(0)).current;
  const shieldFillOpacity = useRef(new Animated.Value(0)).current;
  const circleCollapseScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isStarting) {
      // Phase 1: Blow up to fit screen with a spin
      const screenFitScale = Math.min(SCREEN_WIDTH, SCREEN_HEIGHT) * 0.85 / BASE_SHIELD_SIZE;
      Animated.parallel([
        Animated.spring(shieldScale, {
          toValue: screenFitScale,
          tension: 40,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(shieldRotate, {
          toValue: 1,
          duration: 800,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Phase 2: Scale down to SCALE_DOWN_FACTOR back to "Ready to Guard" position
        Animated.parallel([
          Animated.timing(shieldScale, {
            toValue: SCALE_DOWN_FACTOR,
            duration: 2000,
            easing: Easing.bezier(0.4, 0.0, 0.2, 1),
            useNativeDriver: true,
          }),
          Animated.timing(shieldRotate, {
            toValue: 0,
            duration: 2000,
            easing: Easing.bezier(0.4, 0.0, 0.2, 1),
            useNativeDriver: true,
          }),
        ]).start(() => {
          // Phase 3: After shield settles at "Ready to Guard" position, show green circle
          Animated.parallel([
            Animated.timing(circleOpacity, {
              toValue: 1,
              duration: 600,
              useNativeDriver: true,
            }),
            Animated.spring(circleScale, {
              toValue: 1,
              tension: 40,
              friction: 8,
              useNativeDriver: true,
            }),
          ]).start(() => {
            if (onTransitionComplete) {
              onTransitionComplete();
            }
          });
        });
      });
    }
  }, [isStarting]);

  useEffect(() => {
    if (isCalibrating && !isMonitoring) {
      // Fade in exclamation mark
      Animated.timing(exclamationOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }).start();

      // Start pulsing green circle
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    } else if (isMonitoring) {
      // Stop pulsing and transition to monitoring state
      Animated.parallel([
        // Stop pulsing
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        // Fade out exclamation mark
        Animated.timing(exclamationOpacity, {
          toValue: 0,
          duration: 600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        // Fill shield with color as circle collapses - perfectly synchronized
        Animated.timing(shieldFillOpacity, {
          toValue: 1,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        // Collapse circle into shield at EXACT same rate - creates "absorption" effect
        Animated.timing(circleCollapseScale, {
          toValue: 0.35,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        // Keep circle visible during collapse, then fade out at the very end
        Animated.sequence([
          Animated.delay(900),
          Animated.timing(circleOpacity, {
            toValue: 0,
            duration: 300,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    }
  }, [isCalibrating, isMonitoring]);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.greenCircle,
          {
            backgroundColor: `${color}40`,
            opacity: circleOpacity,
            transform: [
              {
                scale: Animated.multiply(
                  Animated.multiply(circleScale, pulseAnim),
                  circleCollapseScale
                )
              }
            ],
          },
        ]}
      />

      <Animated.View style={{
        transform: [
          { scale: shieldScale },
          {
            rotateY: shieldRotate.interpolate({
              inputRange: [0, 1],
              outputRange: ['0deg', '360deg']
            })
          }
        ]
      }}>
        {/* Filled shield that appears when monitoring */}
        <Animated.View style={{ position: 'absolute', opacity: shieldFillOpacity }}>
          <Shield size={BASE_SHIELD_SIZE} color={color} strokeWidth={2.5} fill={color} />
        </Animated.View>
        {/* Outline shield */}
        <Shield size={BASE_SHIELD_SIZE} color={color} strokeWidth={2.5} />
      </Animated.View>

      <Animated.Text
        style={[
          styles.exclamation,
          { color, opacity: exclamationOpacity }
        ]}
      >
        !
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 250,
    height: 250,
  },
  greenCircle: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
  },
  exclamation: {
    position: 'absolute',
    fontSize: 60,
    fontWeight: 'bold',
  },
});
