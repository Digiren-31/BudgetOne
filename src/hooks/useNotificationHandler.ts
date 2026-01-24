import { useEffect, useCallback } from 'react';
import * as Notifications from 'expo-notifications';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { notificationService, NOTIFICATION_ACTIONS } from '../services/notificationService';
import { createExpense, updateSuggestionStatus, getPendingSuggestions } from '../services/database';
import { RootStackParamList } from '../navigation/AppNavigator';
import { generateUUID } from '../utils/uuid';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

/**
 * Hook to handle notification responses
 * 
 * This hook sets up listeners for notification actions and handles
 * the creation of expenses when users interact with notifications.
 */
export function useNotificationHandler() {
  const navigation = useNavigation<NavigationProp>();

  const handleNotificationResponse = useCallback(
    async (response: Notifications.NotificationResponse) => {
      const data = response.notification.request.content.data;
      const actionIdentifier = response.actionIdentifier;

      if (data?.type === 'expense_suggestion') {
        const suggestionId = data.suggestionId as string;
        const amount = data.amount as number;
        const dateTime = data.dateTime as string;

        // Map action to category
        const categoryMap: { [key: string]: string } = {
          [NOTIFICATION_ACTIONS.FOOD]: 'food',
          [NOTIFICATION_ACTIONS.TRAVEL]: 'travel',
          [NOTIFICATION_ACTIONS.GROCERY]: 'grocery',
          [NOTIFICATION_ACTIONS.SHOPPING]: 'shopping',
          [NOTIFICATION_ACTIONS.OTHER]: 'misc',
        };

        const categoryId = categoryMap[actionIdentifier];

        if (categoryId) {
          // Quick action selected - create expense directly
          try {
            await createExpense({
              id: generateUUID(),
              amount,
              categoryId,
              remark: null,
              dateTime,
              source: 'sms',
              isConfirmed: true,
              smsPatternId: null,
              originalSmsText: null,
            });

            await updateSuggestionStatus(suggestionId, 'confirmed');
          } catch (error) {
            console.error('Failed to create expense from notification:', error);
          }
        } else if (actionIdentifier === Notifications.DEFAULT_ACTION_IDENTIFIER) {
          // User tapped the notification body - open add expense screen
          navigation.navigate('AddExpense', {
            prefillAmount: amount,
            prefillDateTime: dateTime,
            suggestionId,
          });
        }
      } else if (data?.type === 'daily_summary' || data?.type === 'daily_summary_reminder') {
        // Open insights tab
        navigation.navigate('MainTabs');
      }
    },
    [navigation]
  );

  useEffect(() => {
    // Handle notification when app is in foreground
    const foregroundSubscription = notificationService.addNotificationReceivedListener(
      (notification) => {
        console.log('Notification received in foreground:', notification);
      }
    );

    // Handle notification response (tap or action)
    const responseSubscription = notificationService.addNotificationResponseListener(
      handleNotificationResponse
    );

    // Check for initial notification (app launched from notification)
    const checkInitialNotification = async () => {
      const response = await notificationService.getLastNotificationResponse();
      if (response) {
        handleNotificationResponse(response);
      }
    };
    checkInitialNotification();

    return () => {
      foregroundSubscription.remove();
      responseSubscription.remove();
    };
  }, [handleNotificationResponse]);
}
