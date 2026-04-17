import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

let permissionGranted = false;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export async function setupNotifications(): Promise<boolean> {
  if (Platform.OS === 'web') return false;

  try {
    const existing = await Notifications.getPermissionsAsync();
    let status = existing.status;

    if (status !== 'granted') {
      const requested = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: false,
          allowSound: true,
        },
      });
      status = requested.status;
    }

    permissionGranted = status === 'granted';
    return permissionGranted;
  } catch (err) {
    console.error('Notification setup failed:', err);
    return false;
  }
}

export async function sendTamperNotification() {
  if (!permissionGranted || Platform.OS === 'web') return;

  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Drink Guard',
        body: 'Motion detected — check your drink',
        sound: 'default',
        interruptionLevel: 'timeSensitive',
      },
      trigger: null,
    });
  } catch (err) {
    console.error('Failed to send tamper notification:', err);
  }
}
