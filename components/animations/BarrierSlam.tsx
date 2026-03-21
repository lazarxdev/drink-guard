import { useEffect, useRef } from 'react';
import { StyleSheet, View, Animated, Easing } from 'react-native';
import { Shield } from 'lucide-react-native';

interface BarrierSlamProps {
  countdown: number;
  color: string;
}

export function BarrierSlam({ countdown, color }: BarrierSlamProps) {
  const shieldScale = useRef(new Animated.Value(6)).current;
  const shockwaveScale = useRef(new Animated.Value(0)).current;
  const shockwaveOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const scaleMap: { [key: number]: number } = {
      5: 6,
      4: 4.5,
      3: 3,
      2: 1.8,
      1: 1.2,
      0: 1,
    };

    const targetScale = scaleMap[countdown] ?? 1;

    Animated.spring(shieldScale, {
      toValue: targetScale,
      tension: 50,
      friction: 7,
      useNativeDriver: true,
    }).start();

    if (countdown === 5) {
      shockwaveScale.setValue(0);
      shockwaveOpacity.setValue(0);

      Animated.sequence([
        Animated.delay(100),
        Animated.parallel([
          Animated.timing(shockwaveScale, {
            toValue: 5,
            duration: 1500,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.timing(shockwaveOpacity, {
              toValue: 0.9,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(shockwaveOpacity, {
              toValue: 0,
              duration: 1300,
              useNativeDriver: true,
            }),
          ]),
        ]),
      ]).start();
    }
  }, [countdown]);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.shockwave,
          { borderColor: color },
          {
            transform: [{ scale: shockwaveScale }],
            opacity: shockwaveOpacity,
          },
        ]}
      />

      <Animated.View style={{ transform: [{ scale: shieldScale }] }}>
        <Shield size={100} color={color} strokeWidth={4} fill={color} fillOpacity={0.2} />
      </Animated.View>

      <Animated.Text style={[styles.countdown, { color }]}>
        {countdown}
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 200,
    height: 200,
  },
  shockwave: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderWidth: 4,
    borderRadius: 60,
  },
  countdown: {
    position: 'absolute',
    fontSize: 48,
    fontWeight: 'bold',
  },
});
