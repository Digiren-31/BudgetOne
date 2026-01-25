import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Currency, CURRENCIES, DEFAULT_CURRENCY, getCurrencyByCode } from '../constants/currencies';

interface UserProfile {
  name: string;
  photoUri: string | null;
}

// Notification tone options
export type NotificationTone = 'default' | 'silent' | 'short' | 'long';

// Quick pick category for notifications
export interface QuickPickCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
}

interface NotificationSettings {
  smsDetectionEnabled: boolean;
  dailySummaryEnabled: boolean;
  // Quick entry customization
  quickPickCategories: string[]; // Array of 3 category IDs
  notificationTone: NotificationTone;
  vibrationEnabled: boolean;
  showMerchantInNotification: boolean;
  autoExpandNotification: boolean;
}

interface SettingsContextType {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  profile: UserProfile;
  setProfile: (profile: UserProfile) => void;
  notifications: NotificationSettings;
  setNotifications: (settings: NotificationSettings) => void;
  isLoading: boolean;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const SETTINGS_STORAGE_KEY = '@chillar_settings';

interface StoredSettings {
  currencyCode: string;
  profile: UserProfile;
  notifications: NotificationSettings;
}

const defaultSettings: StoredSettings = {
  currencyCode: DEFAULT_CURRENCY.code,
  profile: {
    name: '',
    photoUri: null,
  },
  notifications: {
    smsDetectionEnabled: true,
    dailySummaryEnabled: false,
    // Default quick pick categories: Food, Travel, Shopping
    quickPickCategories: ['food', 'travel', 'shopping'],
    notificationTone: 'default',
    vibrationEnabled: true,
    showMerchantInNotification: true,
    autoExpandNotification: true,
  },
};

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<StoredSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const stored = await AsyncStorage.getItem(SETTINGS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<StoredSettings>;
        setSettings({
          ...defaultSettings,
          ...parsed,
        });
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async (newSettings: StoredSettings) => {
    try {
      await AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(newSettings));
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  };

  const setCurrency = useCallback((currency: Currency) => {
    const newSettings = { ...settings, currencyCode: currency.code };
    setSettings(newSettings);
    saveSettings(newSettings);
  }, [settings]);

  const setProfile = useCallback((profile: UserProfile) => {
    const newSettings = { ...settings, profile };
    setSettings(newSettings);
    saveSettings(newSettings);
  }, [settings]);

  const setNotifications = useCallback((notifications: NotificationSettings) => {
    const newSettings = { ...settings, notifications };
    setSettings(newSettings);
    saveSettings(newSettings);
  }, [settings]);

  const currency = getCurrencyByCode(settings.currencyCode);

  return (
    <SettingsContext.Provider
      value={{
        currency,
        setCurrency,
        profile: settings.profile,
        setProfile,
        notifications: settings.notifications,
        setNotifications,
        isLoading,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
