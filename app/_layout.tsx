import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { AppProvider } from '@/contexts/AppContext';

export default function RootLayout() {
  useFrameworkReady();

  return (
    <AppProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#000' },
          animation: 'fade',
          animationDuration: 150,
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="setup-password" />
        <Stack.Screen
          name="login"
          options={{
            contentStyle: { backgroundColor: '#000' },
            animation: 'fade',
            animationDuration: 150,
          }}
        />
        <Stack.Screen name="monitor" />
        <Stack.Screen
          name="alert"
          options={{
            gestureEnabled: false,
            contentStyle: { backgroundColor: '#000' },
            animation: 'fade',
            animationDuration: 100,
          }}
        />
        <Stack.Screen
          name="grace-period"
          options={{
            gestureEnabled: false,
            contentStyle: { backgroundColor: '#000' },
            animation: 'fade',
            animationDuration: 100,
          }}
        />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </AppProvider>
  );
}
