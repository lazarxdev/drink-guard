import { supabase } from '@/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AUTH_SESSION_KEY = '@drink_guard_auth_session';

export async function getUserId(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    await AsyncStorage.setItem(AUTH_SESSION_KEY, user.id);
    return user.id;
  }

  const { data, error } = await supabase.auth.signInAnonymously();

  if (error) {
    // Anonymous auth is required for data isolation.
    // If it's disabled on the Supabase project, check the cached session
    // as a read-only fallback but don't create insecure temp accounts.
    const cachedSession = await AsyncStorage.getItem(AUTH_SESSION_KEY);
    if (cachedSession) {
      return cachedSession;
    }

    throw new Error(
      'Anonymous authentication is not enabled. Please enable it in Supabase Dashboard > Authentication > Providers > Anonymous Sign-Ins.'
    );
  }

  if (!data.user) {
    throw new Error('Failed to create anonymous user');
  }

  await AsyncStorage.setItem(AUTH_SESSION_KEY, data.user.id);
  return data.user.id;
}
