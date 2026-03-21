import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

const supabaseUrl = Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_ANON_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface AppSettings {
  id: string;
  user_id: string;
  pin_hash: string | null;
  sensitivity: number;
  theme_color: string;
  alarm_sound: string;
  use_flash: boolean;
  incognito_mode: boolean;
  countdown_animation_style: string;
  onboarding_completed: boolean | null;
  volume_mute_enabled: boolean;
  volume_mute_sequence: string | null;
  grace_period_seconds: number;
  created_at: string;
  updated_at: string;
}
