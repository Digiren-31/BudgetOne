import { useEffect } from 'react';
import { useSettings } from '../context/SettingsContext';
import { notificationService } from '../services/notificationService';
import { getActiveCategories } from '../services/database';

/**
 * Hook to sync notification settings with the notification service
 * 
 * This ensures that the quick pick categories and other notification
 * customizations from settings are applied to the notification service
 * when the app starts and whenever settings change.
 */
export function useNotificationSettingsSync() {
  const { notifications, isLoading } = useSettings();

  useEffect(() => {
    if (isLoading) return;

    const syncSettings = async () => {
      try {
        // Sync all notification customization settings
        notificationService.setCustomization({
          quickPickCategories: notifications.quickPickCategories,
          tone: notifications.notificationTone,
          vibrationEnabled: notifications.vibrationEnabled,
          showMerchantInNotification: notifications.showMerchantInNotification,
          autoExpandNotification: notifications.autoExpandNotification,
        });

        // Load and cache categories for display names in notifications
        const categories = await getActiveCategories();
        notificationService.updateCategoryCache(categories);

        console.log('[NotificationSettingsSync] Synced quick pick categories:', notifications.quickPickCategories);
      } catch (error) {
        console.error('[NotificationSettingsSync] Failed to sync settings:', error);
      }
    };

    syncSettings();
  }, [
    isLoading,
    notifications.quickPickCategories,
    notifications.notificationTone,
    notifications.vibrationEnabled,
    notifications.showMerchantInNotification,
    notifications.autoExpandNotification,
  ]);
}
