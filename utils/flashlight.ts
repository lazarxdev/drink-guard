import { Platform } from 'react-native';

export let flashlightEnabled = false;
export let flashlightBlinking = false;

export const startFlashlight = async (): Promise<void> => {
  if (Platform.OS === 'web') {
    console.log('Flashlight not available on web');
    return;
  }

  flashlightEnabled = true;
  flashlightBlinking = true;
};

export const stopFlashlight = async (): Promise<void> => {
  flashlightEnabled = false;
  flashlightBlinking = false;
};

export const isFlashlightActive = (): boolean => {
  return flashlightEnabled;
};
