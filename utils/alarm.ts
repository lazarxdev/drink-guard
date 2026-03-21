import { Audio } from 'expo-av';
import { Platform } from 'react-native';

let sound: Audio.Sound | null = null;

export const ALARM_SOUNDS = {
  bell: 'https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg',
  alarm: 'https://actions.google.com/sounds/v1/alarms/beep_short.ogg',
  buzzer: 'https://actions.google.com/sounds/v1/alarms/digital_watch_alarm_long.ogg',
  FahHhH: require('../fahhhhhhhhhhhhhh.mp3'),
  aaaa: require('../aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa-e-lutador.mp3'),
  wack: require('../we-are-charlie-kirk-loud-asf.mp3'),
};

export async function setupAudio() {
  try {
    // playsInSilentModeIOS: false ensures alarm respects silent/ringer switch
    // On Android, the system automatically respects Do Not Disturb and ringer settings
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: false, // Respects iOS silent switch
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
    });
  } catch (error) {
    console.error('Error setting up audio:', error);
  }
}

export async function playAlarmSound(alarmType: string = 'bell') {
  try {
    if (Platform.OS === 'web') {
      return;
    }

    if (sound) {
      await sound.unloadAsync();
      sound = null;
    }

    const soundSource = ALARM_SOUNDS[alarmType as keyof typeof ALARM_SOUNDS] || ALARM_SOUNDS.bell;

    const { sound: newSound } = await Audio.Sound.createAsync(
      typeof soundSource === 'string' ? { uri: soundSource } : soundSource,
      { shouldPlay: true, isLooping: true, volume: 1.0 }
    );

    sound = newSound;
  } catch (error) {
    console.error('Error playing alarm sound:', error);
  }
}

export async function stopAlarmSound() {
  try {
    if (sound) {
      await sound.stopAsync();
      await sound.unloadAsync();
      sound = null;
    }
  } catch (error) {
    console.error('Error stopping alarm sound:', error);
  }
}
