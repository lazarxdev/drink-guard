import { View, Text, StyleSheet } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useApp } from '@/contexts/AppContext';
import { hashPin, verifyPin } from '@/utils/crypto';
import { ShieldCheck } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import PINKeypad from '@/components/PINKeypad';
import { getTheme, isDarkTheme as checkDarkTheme } from '@/utils/theme';

type ResetStep = 'verify' | 'enter' | 'confirm';

export default function ResetPin() {
  const [pin, setPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [step, setStep] = useState<ResetStep>('verify');
  const [error, setError] = useState('');
  const { savePin, settings } = useApp();
  const router = useRouter();

  const themeColor = settings?.theme_color || 'green';
  const theme = getTheme(themeColor);
  const isDarkTheme = checkDarkTheme(themeColor);
  const textColor = isDarkTheme ? '#fff' : '#000';

  useEffect(() => {
    if (step === 'verify' && pin.length === 4) {
      handleVerifyPin();
    }
  }, [pin, step]);

  useEffect(() => {
    if (step === 'enter' && newPin.length === 4) {
      setStep('confirm');
      setError('');
    }
  }, [newPin, step]);

  useEffect(() => {
    if (step === 'confirm' && confirmPin.length === 4) {
      handleResetPin();
    }
  }, [confirmPin, step]);

  const handleVerifyPin = async () => {
    try {
      const currentHash = settings?.pin_hash;
      if (!currentHash) {
        setError('No PIN set');
        return;
      }

      const isValid = await verifyPin(pin, currentHash);
      if (isValid) {
        setStep('enter');
        setError('');
        setPin('');
      } else {
        setError('Incorrect PIN');
        setPin('');
      }
    } catch (err) {
      console.error('PIN verification error:', err);
      setError('Verification failed');
      setPin('');
    }
  };

  const handleResetPin = async () => {
    setError('');

    if (newPin !== confirmPin) {
      setError('PINs do not match. Please try again.');
      setNewPin('');
      setConfirmPin('');
      setStep('enter');
      return;
    }

    try {
      const hashedPin = await hashPin(newPin);
      await savePin(hashedPin);
      router.back();
    } catch (err) {
      console.error('PIN reset error:', err);
      setError(`Failed to reset PIN: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setNewPin('');
      setConfirmPin('');
      setStep('enter');
    }
  };

  const handleBack = () => {
    if (step === 'confirm') {
      setConfirmPin('');
      setStep('enter');
      setError('');
    } else if (step === 'enter') {
      setNewPin('');
      setStep('verify');
      setError('');
    } else {
      router.back();
    }
  };

  const getSubtitle = () => {
    switch (step) {
      case 'verify':
        return 'Enter your current PIN';
      case 'enter':
        return 'Create a new 4-digit PIN';
      case 'confirm':
        return 'Confirm your new PIN';
    }
  };

  const getCurrentPin = () => {
    switch (step) {
      case 'verify':
        return pin;
      case 'enter':
        return newPin;
      case 'confirm':
        return confirmPin;
    }
  };

  const handlePinChange = (value: string) => {
    switch (step) {
      case 'verify':
        setPin(value);
        break;
      case 'enter':
        setNewPin(value);
        break;
      case 'confirm':
        setConfirmPin(value);
        break;
    }
  };

  return (
    <LinearGradient colors={theme.gradient} style={styles.container}>
      <View style={styles.content}>
        <ShieldCheck size={60} color={theme.primary} style={styles.icon} />
        <Text style={[styles.title, { color: textColor }]}>Reset PIN</Text>
        <Text style={[styles.subtitle, { color: isDarkTheme ? '#999' : '#666' }]}>
          {getSubtitle()}
        </Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <PINKeypad
          pin={getCurrentPin()}
          onPinChange={handlePinChange}
          maxLength={4}
          themeColor={theme.primary}
          isDarkTheme={isDarkTheme}
          onBack={handleBack}
          showBack={step === 'confirm' || step === 'enter'}
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
