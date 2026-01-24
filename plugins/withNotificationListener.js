/**
 * Expo Config Plugin for Notification Listener
 * 
 * This plugin adds native Android code to listen for incoming notifications
 * which is more reliable than SMS reading on modern Android versions.
 * 
 * NotificationListenerService can read all incoming notifications including
 * bank SMS notifications, making it a reliable way to detect expenses.
 */

const { withAndroidManifest, withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Add NotificationListenerService to AndroidManifest.xml
 */
function withNotificationListenerManifest(config) {
  return withAndroidManifest(config, async (config) => {
    const androidManifest = config.modResults;
    const mainApplication = androidManifest.manifest.application[0];

    // Add the NotificationListenerService
    if (!mainApplication.service) {
      mainApplication.service = [];
    }

    // Check if service already exists
    const serviceExists = mainApplication.service.some(
      (s) => s.$['android:name'] === '.BudgetNotificationListener'
    );

    if (!serviceExists) {
      mainApplication.service.push({
        $: {
          'android:name': '.BudgetNotificationListener',
          'android:label': 'BudgetOne Notification Listener',
          'android:permission': 'android.permission.BIND_NOTIFICATION_LISTENER_SERVICE',
          'android:exported': 'false',
        },
        'intent-filter': [
          {
            action: [
              {
                $: {
                  'android:name': 'android.service.notification.NotificationListenerService',
                },
              },
            ],
          },
        ],
      });
    }

    return config;
  });
}

/**
 * Create the native Notification Listener Kotlin files
 */
function withNotificationListenerNativeCode(config) {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const packageName = config.android?.package || 'com.budgetone.app';
      const packagePath = packageName.replace(/\./g, '/');
      
      const androidSrcPath = path.join(
        projectRoot,
        'android',
        'app',
        'src',
        'main',
        'java',
        packagePath
      );

      // Create directory if it doesn't exist
      if (!fs.existsSync(androidSrcPath)) {
        fs.mkdirSync(androidSrcPath, { recursive: true });
      }

      // Create BudgetNotificationListener.kt - NotificationListenerService
      const notificationListenerCode = `package ${packageName}

import android.app.Notification
import android.content.ComponentName
import android.content.Intent
import android.os.Build
import android.provider.Settings
import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
import android.util.Log

class BudgetNotificationListener : NotificationListenerService() {
    
    companion object {
        private const val TAG = "BudgetNotificationListener"
        
        // Static reference to the module for sending events
        var notificationModule: NotificationListenerModule? = null
        
        // Bank sender patterns to filter notifications
        private val BANK_PATTERNS = listOf(
            // Common Indian bank sender IDs
            "HDFC", "ICICI", "SBI", "AXIS", "KOTAK", "PNB", "BOB", "IDBI",
            "CITI", "HSBC", "STAN", "YES", "INDUS", "FEDERAL", "RBL",
            "PAYTM", "GPAY", "PHONEPE", "AMAZON", "FLIPKART",
            // Common transaction keywords
            "debited", "credited", "spent", "payment", "txn", "transaction",
            "withdrawn", "transfer", "upi", "imps", "neft"
        )
        
        fun isNotificationListenerEnabled(context: android.content.Context): Boolean {
            val cn = ComponentName(context, BudgetNotificationListener::class.java)
            val flat = Settings.Secure.getString(context.contentResolver, "enabled_notification_listeners")
            return flat != null && flat.contains(cn.flattenToString())
        }
    }

    override fun onNotificationPosted(sbn: StatusBarNotification?) {
        sbn ?: return
        
        try {
            val notification = sbn.notification
            val extras = notification.extras
            
            // Get notification details
            val packageName = sbn.packageName
            val title = extras.getCharSequence(Notification.EXTRA_TITLE)?.toString() ?: ""
            val text = extras.getCharSequence(Notification.EXTRA_TEXT)?.toString() ?: ""
            val bigText = extras.getCharSequence(Notification.EXTRA_BIG_TEXT)?.toString() ?: text
            val timestamp = sbn.postTime
            
            // Use the longer text content
            val content = if (bigText.length > text.length) bigText else text
            
            Log.d(TAG, "Notification from: \$packageName, title: \$title")
            
            // Check if this looks like a bank/payment notification
            val combinedText = "\$title \$content".lowercase()
            val isRelevant = BANK_PATTERNS.any { pattern -> 
                combinedText.contains(pattern.lowercase())
            }
            
            if (isRelevant) {
                Log.d(TAG, "Relevant notification detected: \$content")
                
                // Send to React Native module
                notificationModule?.sendNotificationEvent(
                    packageName = packageName,
                    title = title,
                    content = content,
                    timestamp = timestamp
                )
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error processing notification", e)
        }
    }

    override fun onNotificationRemoved(sbn: StatusBarNotification?) {
        // Not needed for our use case
    }
    
    override fun onListenerConnected() {
        super.onListenerConnected()
        Log.d(TAG, "Notification listener connected")
    }
    
    override fun onListenerDisconnected() {
        super.onListenerDisconnected()
        Log.d(TAG, "Notification listener disconnected")
    }
}
`;

      fs.writeFileSync(
        path.join(androidSrcPath, 'BudgetNotificationListener.kt'),
        notificationListenerCode
      );

      // Create NotificationListenerModule.kt - React Native Native Module
      const notificationModuleCode = `package ${packageName}

import android.content.ComponentName
import android.content.Intent
import android.os.Build
import android.provider.Settings
import android.util.Log
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule

class NotificationListenerModule(reactContext: ReactApplicationContext) : 
    ReactContextBaseJavaModule(reactContext), LifecycleEventListener {

    companion object {
        private const val TAG = "NotificationListenerModule"
        private const val MODULE_NAME = "NotificationListener"
        private const val NOTIFICATION_RECEIVED_EVENT = "onNotificationReceived"
    }

    private var listenerCount = 0

    init {
        reactContext.addLifecycleEventListener(this)
        // Register this module with the static service
        BudgetNotificationListener.notificationModule = this
    }

    override fun getName(): String = MODULE_NAME

    override fun onHostResume() {
        Log.d(TAG, "App resumed")
        BudgetNotificationListener.notificationModule = this
    }

    override fun onHostPause() {
        Log.d(TAG, "App paused")
    }

    override fun onHostDestroy() {
        Log.d(TAG, "App destroyed")
    }

    /**
     * Send notification event to JavaScript
     */
    fun sendNotificationEvent(packageName: String, title: String, content: String, timestamp: Long) {
        if (listenerCount > 0) {
            val params = Arguments.createMap().apply {
                putString("packageName", packageName)
                putString("title", title)
                putString("content", content)
                putDouble("timestamp", timestamp.toDouble())
            }

            reactApplicationContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                .emit(NOTIFICATION_RECEIVED_EVENT, params)
            
            Log.d(TAG, "Notification event sent to JS: \$title")
        } else {
            Log.d(TAG, "No listeners registered, notification event not sent")
        }
    }

    @ReactMethod
    fun isEnabled(promise: Promise) {
        try {
            val enabled = BudgetNotificationListener.isNotificationListenerEnabled(reactApplicationContext)
            promise.resolve(enabled)
        } catch (e: Exception) {
            promise.reject("ERROR", "Failed to check notification listener status", e)
        }
    }

    @ReactMethod
    fun openSettings(promise: Promise) {
        try {
            val intent = Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS)
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            reactApplicationContext.startActivity(intent)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("ERROR", "Failed to open settings", e)
        }
    }

    @ReactMethod
    fun startListening(promise: Promise) {
        try {
            BudgetNotificationListener.notificationModule = this
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("ERROR", "Failed to start listening", e)
        }
    }

    @ReactMethod
    fun stopListening(promise: Promise) {
        try {
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("ERROR", "Failed to stop listening", e)
        }
    }

    @ReactMethod
    fun addListener(eventName: String) {
        listenerCount++
        Log.d(TAG, "Listener added, count: \$listenerCount")
    }

    @ReactMethod
    fun removeListeners(count: Int) {
        listenerCount -= count
        if (listenerCount < 0) listenerCount = 0
        Log.d(TAG, "Listeners removed, count: \$listenerCount")
    }
}
`;

      fs.writeFileSync(
        path.join(androidSrcPath, 'NotificationListenerModule.kt'),
        notificationModuleCode
      );

      // Create NotificationListenerPackage.kt - Package to register the module
      const notificationPackageCode = `package ${packageName}

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager

class NotificationListenerPackage : ReactPackage {
    override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> {
        return listOf(NotificationListenerModule(reactContext))
    }

    override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> {
        return emptyList()
    }
}
`;

      fs.writeFileSync(
        path.join(androidSrcPath, 'NotificationListenerPackage.kt'),
        notificationPackageCode
      );

      console.log('[withNotificationListener] Created native notification listener files');
      return config;
    },
  ]);
}

/**
 * Main plugin export
 */
module.exports = function withNotificationListener(config) {
  config = withNotificationListenerManifest(config);
  config = withNotificationListenerNativeCode(config);
  return config;
};
