import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { useApp } from '@/contexts/AppContext';
import { supabase } from '@/lib/supabase';
import OnboardingModal from '@/components/OnboardingModal';
import { getTheme } from '@/utils/theme';

export default function Index() {
  const { settings, hasPin, loading } = useApp();
  const router = useRouter();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingChecked, setOnboardingChecked] = useState(false);

  const themeColor = settings?.theme_color || 'green';
  const theme = getTheme(themeColor);

  useEffect(() => {
    if (!loading) {
      const needsOnboarding = !settings || settings.onboarding_completed === false || settings.onboarding_completed === null;

      if (needsOnboarding) {
        setShowOnboarding(true);
        setOnboardingChecked(true);
      } else {
        setOnboardingChecked(true);
        navigate();
      }
    }
  }, [loading]);

  const navigate = () => {
    if (hasPin) {
      router.replace('/login');
    } else {
      router.replace('/setup-password');
    }
  };

  const handleOnboardingComplete = async () => {
    try {
      const userId = settings?.user_id;
      if (userId) {
        await supabase
          .from('app_settings')
          .update({ onboarding_completed: true, updated_at: new Date().toISOString() })
          .eq('user_id', userId);
      }
    } catch (error) {
      console.error('Error updating onboarding status:', error);
    }

    setShowOnboarding(false);
    navigate();
  };

  return (
    <View style={styles.container}>
      {!onboardingChecked && (
        <>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={styles.text}>Loading...</Text>
        </>
      )}

      <OnboardingModal
        visible={showOnboarding}
        onComplete={handleOnboardingComplete}
        themeColor={theme.primary}
      />
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
