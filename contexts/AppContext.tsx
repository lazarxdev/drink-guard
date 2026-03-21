import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, AppSettings } from '@/lib/supabase';
import { getUserId } from '@/utils/storage';

interface AppContextType {
  settings: AppSettings | null;
  loading: boolean;
  hasPin: boolean;
  savePin: (pinHash: string) => Promise<void>;
  updateSensitivity: (sensitivity: number) => Promise<void>;
  updateThemeColor: (color: string) => Promise<void>;
  updateAlarmSound: (sound: string) => Promise<void>;
  updateUseFlash: (useFlash: boolean) => Promise<void>;
  updateIncognitoMode: (incognitoMode: boolean) => Promise<void>;
  updateVolumeMuteEnabled: (enabled: boolean) => Promise<void>;
  updateVolumeMuteSequence: (sequence: string[]) => Promise<void>;
  updateGracePeriod: (seconds: number) => Promise<void>;
  refreshSettings: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshSettings = async () => {
    try {
      const userId = await getUserId();
      const { data, error } = await supabase
        .from('app_settings')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;
      setSettings(data);
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshSettings();
  }, []);

  const savePin = async (pinHash: string) => {
    try {
      const userId = await getUserId();
      console.log('User ID:', userId);
      console.log('Has existing settings:', !!settings);

      if (settings) {
        console.log('Updating existing settings...');
        const { data, error } = await supabase
          .from('app_settings')
          .update({ pin_hash: pinHash, updated_at: new Date().toISOString() })
          .eq('user_id', userId)
          .select();

        console.log('Update result:', { data, error });
        if (error) throw error;
      } else {
        console.log('Inserting new settings...');
        const { data, error } = await supabase
          .from('app_settings')
          .insert({ user_id: userId, pin_hash: pinHash })
          .select();

        console.log('Insert result:', { data, error });
        if (error) throw error;
      }

      console.log('Refreshing settings...');
      await refreshSettings();
    } catch (error) {
      console.error('Error saving PIN:', error);
      throw error;
    }
  };

  const updateSensitivity = async (sensitivity: number) => {
    try {
      const userId = await getUserId();
      const { error } = await supabase
        .from('app_settings')
        .update({ sensitivity, updated_at: new Date().toISOString() })
        .eq('user_id', userId);

      if (error) throw error;
      await refreshSettings();
    } catch (error) {
      console.error('Error updating sensitivity:', error);
      throw error;
    }
  };

  const updateThemeColor = async (theme_color: string) => {
    try {
      const userId = await getUserId();
      const { error } = await supabase
        .from('app_settings')
        .update({ theme_color, updated_at: new Date().toISOString() })
        .eq('user_id', userId);

      if (error) throw error;
      await refreshSettings();
    } catch (error) {
      console.error('Error updating theme color:', error);
      throw error;
    }
  };

  const updateAlarmSound = async (alarm_sound: string) => {
    try {
      const userId = await getUserId();
      const { error } = await supabase
        .from('app_settings')
        .update({ alarm_sound, updated_at: new Date().toISOString() })
        .eq('user_id', userId);

      if (error) throw error;
      await refreshSettings();
    } catch (error) {
      console.error('Error updating alarm sound:', error);
      throw error;
    }
  };

  const updateUseFlash = async (use_flash: boolean) => {
    try {
      const userId = await getUserId();
      const { error } = await supabase
        .from('app_settings')
        .update({ use_flash, updated_at: new Date().toISOString() })
        .eq('user_id', userId);

      if (error) throw error;
      await refreshSettings();
    } catch (error) {
      console.error('Error updating flash setting:', error);
      throw error;
    }
  };

  const updateIncognitoMode = async (incognito_mode: boolean) => {
    try {
      const userId = await getUserId();
      const { error } = await supabase
        .from('app_settings')
        .update({ incognito_mode, updated_at: new Date().toISOString() })
        .eq('user_id', userId);

      if (error) throw error;
      await refreshSettings();
    } catch (error) {
      console.error('Error updating incognito mode:', error);
      throw error;
    }
  };

  const updateVolumeMuteEnabled = async (volume_mute_enabled: boolean) => {
    try {
      const userId = await getUserId();
      const { error } = await supabase
        .from('app_settings')
        .update({ volume_mute_enabled, updated_at: new Date().toISOString() })
        .eq('user_id', userId);

      if (error) throw error;
      await refreshSettings();
    } catch (error) {
      console.error('Error updating volume mute enabled:', error);
      throw error;
    }
  };

  const updateVolumeMuteSequence = async (sequence: string[]) => {
    try {
      const userId = await getUserId();
      const volume_mute_sequence = JSON.stringify(sequence);
      const { error } = await supabase
        .from('app_settings')
        .update({ volume_mute_sequence, updated_at: new Date().toISOString() })
        .eq('user_id', userId);

      if (error) throw error;
      await refreshSettings();
    } catch (error) {
      console.error('Error updating volume mute sequence:', error);
      throw error;
    }
  };

  const updateGracePeriod = async (grace_period_seconds: number) => {
    try {
      const userId = await getUserId();
      const { error } = await supabase
        .from('app_settings')
        .update({ grace_period_seconds, updated_at: new Date().toISOString() })
        .eq('user_id', userId);

      if (error) throw error;
      await refreshSettings();
    } catch (error) {
      console.error('Error updating grace period:', error);
      throw error;
    }
  };

  return (
    <AppContext.Provider
      value={{
        settings,
        loading,
        hasPin: !!settings?.pin_hash,
        savePin,
        updateSensitivity,
        updateThemeColor,
        updateAlarmSound,
        updateUseFlash,
        updateIncognitoMode,
        updateVolumeMuteEnabled,
        updateVolumeMuteSequence,
        updateGracePeriod,
        refreshSettings,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}
