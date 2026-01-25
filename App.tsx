import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';

import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { SettingsProvider } from './src/context/SettingsContext';
import { AppNavigator } from './src/navigation/AppNavigator';
import { initDatabase } from './src/services/database';
import { notificationService } from './src/services/notificationService';
import { smsService } from './src/services/smsService';
import { notificationListenerService } from './src/services/notificationListenerService';
import { useNotificationHandler } from './src/hooks/useNotificationHandler';

function AppContent() {
  const { colors, isDark } = useTheme();
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      // Initialize database
      await initDatabase();

      // Initialize notification service
      await notificationService.initialize();

      // Start SMS listening if permission is granted
      const smsStatus = await smsService.checkPermission();
      if (smsStatus === 'granted') {
        await smsService.startListening();
      }

      // Process any pending expenses detected while app was in background
      if (notificationListenerService.isAvailable()) {
        const isEnabled = await notificationListenerService.isEnabled();
        if (isEnabled) {
          const processed = await notificationListenerService.processPendingExpenses();
          if (processed > 0) {
            console.log('[App] Processed', processed, 'background expenses');
          }
        }
      }

      setIsReady(true);
    } catch (err) {
      console.error('Failed to initialize app:', err);
      setError('Failed to initialize app. Please restart.');
    }
  };

  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
      </View>
    );
  }

  if (!isReady) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          Loading...
        </Text>
      </View>
    );
  }

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <NavigationContainer
        theme={{
          dark: isDark,
          colors: {
            primary: colors.primary,
            background: colors.background,
            card: colors.surface,
            text: colors.text,
            border: colors.border,
            notification: colors.error,
          },
        }}
      >
        <NotificationHandler />
        <AppNavigator />
      </NavigationContainer>
    </>
  );
}

// Separate component to use navigation hook
function NotificationHandler() {
  useNotificationHandler();
  return null;
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <SettingsProvider>
          <AppContent />
        </SettingsProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    padding: 20,
  },
});
