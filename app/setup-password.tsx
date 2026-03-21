import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useApp } from '@/contexts/AppContext';
import { hashPin } from '@/utils/crypto';
import { ShieldCheck } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import PINKeypad from '@/components/PINKeypad';
import { getTheme, isDarkTheme as checkDarkTheme } from '@/utils/theme';

export default function SetupPassword() {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [step, setStep] = useState<'enter' | 'confirm'>('enter');
  const [error, setError] = useState('');
  const { savePin, settings } = useApp();
  const router = useRouter();

  const themeColor = settings?.theme_color || 'green';
  const theme = getTheme(themeColor);
  const isDarkTheme = checkDarkTheme(themeColor);
  const textColor = isDarkTheme ? '#fff' : '#000';

  useEffect(() => {
    if (step === 'enter' && pin.length === 4) {
      setStep('confirm');
      setError('');
    }
  }, [pin, step]);

  useEffect(() => {
    if (step === 'confirm' && confirmPin.length === 4) {
      handleSetup();
    }
  }, [confirmPin, step]);

  const handleSetup = async () => {
    setError('');

    if (pin !== confirmPin) {
      setError('PINs do not match. Please try again.');
      setPin('');
      setConfirmPin('');
      setStep('enter');
      return;
    }

    try {
      const hashedPin = await hashPin(pin);
      await savePin(hashedPin);
      router.replace('/monitor');
    } catch (err) {
      console.error('PIN setup error:', err);
      setError(`Failed to save PIN: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setPin('');
      setConfirmPin('');
      setStep('enter');
    }
  };

  const handleBack = () => {
    if (step === 'confirm') {
      setConfirmPin('');
      setStep('enter');
      setError('');
    }
  };

  return (
    <LinearGradient colors={theme.gradient} style={styles.container}>
      <View style={styles.content}>
        <ShieldCheck size={60} color={theme.primary} style={styles.icon} />
        <Text style={[styles.title, { color: textColor }]}>Drink Guard</Text>
        <Text style={[styles.subtitle, { color: isDarkTheme ? '#999' : '#666' }]}>
          {step === 'enter' ? 'Create a 4-digit PIN' : 'Confirm your PIN'}
        </Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <PINKeypad
          pin={step === 'enter' ? pin : confirmPin}
          onPinChange={step === 'enter' ? setPin : setConfirmPin}
          maxLength={4}
          themeColor={theme.primary}
          isDarkTheme={isDarkTheme}
          onBack={handleBack}
          showBack={step === 'confirm'}
        />

      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  icon: {
    marginBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 48,
    textAlign: 'center',
  },
  error: {
    color: '#ff4444',
    marginBottom: 24,
    textAlign: 'center',
    fontSize: 14,
  },
});
