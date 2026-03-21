import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useApp } from '@/contexts/AppContext';

export default function Index() {
  const { hasPin, loading } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (hasPin) {
        router.replace('/login');
      } else {
        router.replace('/setup-password');
      }
    }
  }, [hasPin, loading]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#007AFF" />
      <Text style={styles.text}>Loading...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  text: {
    marginTop: 16,
    fontSize: 16,
    color: '#fff',
  },
});
