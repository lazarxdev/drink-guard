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
    console.warn('Anonymous auth disabled, using session-based auth:', error.message);

    const cachedSession = await AsyncStorage.getItem(AUTH_SESSION_KEY);
    if (cachedSession) {
      return cachedSession;
    }

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: `user-${Date.now()}-${Math.random().toString(36).substring(7)}@temp.local`,
      password: Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2),
    });

    if (signUpError || !signUpData.user) {
      throw new Error('Failed to create authenticated session');
    }

    await AsyncStorage.setItem(AUTH_SESSION_KEY, signUpData.user.id);
    return signUpData.user.id;
  }

  if (!data.user) {
    throw new Error('Failed to create anonymous user');
  }

  await AsyncStorage.setItem(AUTH_SESSION_KEY, data.user.id);
  return data.user.id;
}
