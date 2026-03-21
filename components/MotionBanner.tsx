import { View, Text, StyleSheet, Animated } from 'react-native';
import { useEffect, useRef } from 'react';
import { AlertTriangle } from 'lucide-react-native';

interface MotionBannerProps {
  eventCount: number;
  latestTimestamp: Date | null;
  onDismiss: () => void;
  themeColor: string;
}

export default function MotionBanner({ eventCount, latestTimestamp, onDismiss, themeColor }: MotionBannerProps) {
  const slideAnim = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.delay(3500),
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss();
    });
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <Animated.View
      style={[
        styles.banner,
        {
          backgroundColor: themeColor,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={styles.content}>
        <AlertTriangle size={24} color="#fff" />
        <View style={styles.textContainer}>
          <Text style={styles.title}>
            {eventCount === 1 ? 'Motion Detected' : `${eventCount} Motion Events`}
          </Text>
          {latestTimestamp && (
            <Text style={styles.timestamp}>
              Last detected at {formatTime(latestTimestamp)}
            </Text>
          )}
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1000,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  textContainer: {
    marginLeft: 12,
    flex: 1,
  },
  title: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  timestamp: {
    color: '#fff',
    fontSize: 13,
    opacity: 0.9,
  },
});
