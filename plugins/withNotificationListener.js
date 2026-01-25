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
          'android:label': 'Chillar Notification Listener',
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
      const packageName = config.android?.package || 'com.chillar.app';
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
      // Enhanced version that works fully in background without React Native
      const notificationListenerCode = `package ${packageName}

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import android.os.Build
import android.provider.Settings
import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
import android.util.Log
import androidx.core.app.NotificationCompat
import org.json.JSONArray
import org.json.JSONObject
import java.util.regex.Pattern
import java.util.UUID

class BudgetNotificationListener : NotificationListenerService() {
    
    companion object {
        private const val TAG = "BudgetNotificationListener"
        private const val PREFS_NAME = "ChillarExpenses"
        private const val PENDING_EXPENSES_KEY = "pending_expenses"
        private const val CHANNEL_ID = "chillar_expenses"
        private const val NOTIFICATION_ID = 1001
        
        // Static reference to the module for sending events (when app is running)
        var notificationModule: NotificationListenerModule? = null
        
        // Bank sender patterns to filter notifications
        private val BANK_PATTERNS = listOf(
            "HDFC", "ICICI", "SBI", "AXIS", "KOTAK", "PNB", "BOB", "IDBI",
            "CITI", "HSBC", "STAN", "YES", "INDUS", "FEDERAL", "RBL",
            "PAYTM", "GPAY", "PHONEPE", "AMAZON", "FLIPKART",
            "debited", "credited", "spent", "payment", "txn", "transaction",
            "withdrawn", "transfer", "upi", "imps", "neft", "purchase"
        )
        
        // Patterns to extract amount from SMS/notification
        private val AMOUNT_PATTERNS = listOf(
            Pattern.compile("(?:rs\\\\.?|inr)\\\\s*([\\\\d,]+(?:\\\\.\\\\d{2})?)", Pattern.CASE_INSENSITIVE),
            Pattern.compile("(?:amount|amt)[:\\\\s]*(?:rs\\\\.?|inr)?\\\\s*([\\\\d,]+(?:\\\\.\\\\d{2})?)", Pattern.CASE_INSENSITIVE),
            Pattern.compile("([\\\\d,]+(?:\\\\.\\\\d{2})?)\\\\s*(?:rs|inr|\\\\/\\\\-)", Pattern.CASE_INSENSITIVE),
            Pattern.compile("(?:debited|credited|spent|paid|received)[:\\\\s]*(?:rs\\\\.?|inr)?\\\\s*([\\\\d,]+(?:\\\\.\\\\d{2})?)", Pattern.CASE_INSENSITIVE)
        )
        
        // Patterns to extract merchant/payee
        private val MERCHANT_PATTERNS = listOf(
            Pattern.compile("(?:at|to|from|@)\\\\s+([A-Za-z0-9\\\\s]+?)(?:\\\\s+on|\\\\s+ref|\\\\s+txn|\\\\.|\\\$)", Pattern.CASE_INSENSITIVE),
            Pattern.compile("(?:VPA|UPI)[:\\\\s]*([a-zA-Z0-9._-]+@[a-zA-Z]+)", Pattern.CASE_INSENSITIVE),
            Pattern.compile("(?:paid to|received from|transfer to|transfer from)\\\\s+([A-Za-z0-9\\\\s]+?)(?:\\\\s+|\\\\.|,|\\\$)", Pattern.CASE_INSENSITIVE)
        )
        
        fun isNotificationListenerEnabled(context: Context): Boolean {
            val cn = ComponentName(context, BudgetNotificationListener::class.java)
            val flat = Settings.Secure.getString(context.contentResolver, "enabled_notification_listeners")
            return flat != null && flat.contains(cn.flattenToString())
        }
    }
    
    private lateinit var sharedPrefs: SharedPreferences
    
    override fun onCreate() {
        super.onCreate()
        sharedPrefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        createNotificationChannel()
        Log.d(TAG, "BudgetNotificationListener service created")
    }

    override fun onNotificationPosted(sbn: StatusBarNotification?) {
        sbn ?: return
        
        try {
            val notification = sbn.notification
            val extras = notification.extras
            
            val packageName = sbn.packageName
            val title = extras.getCharSequence(Notification.EXTRA_TITLE)?.toString() ?: ""
            val text = extras.getCharSequence(Notification.EXTRA_TEXT)?.toString() ?: ""
            val bigText = extras.getCharSequence(Notification.EXTRA_BIG_TEXT)?.toString() ?: text
            val timestamp = sbn.postTime
            
            val content = if (bigText.length > text.length) bigText else text
            
            Log.d(TAG, "Notification from: \$packageName, title: \$title")
            
            val combinedText = "\$title \$content".lowercase()
            val isRelevant = BANK_PATTERNS.any { pattern -> 
                combinedText.contains(pattern.lowercase())
            }
            
            if (isRelevant) {
                Log.d(TAG, "Relevant notification detected: \$content")
                
                // Extract amount and merchant natively
                val amount = extractAmount(content)
                val merchant = extractMerchant(content)
                
                if (amount != null && amount > 0) {
                    Log.d(TAG, "Extracted amount: \$amount, merchant: \$merchant")
                    
                    // Store expense for when app opens
                    storeExpense(amount, merchant, content, timestamp)
                    
                    // Show notification to user
                    showExpenseNotification(amount, merchant)
                    
                    // Also try to send to React Native if app is running
                    notificationModule?.sendNotificationEvent(
                        packageName = packageName,
                        title = title,
                        content = content,
                        timestamp = timestamp
                    )
                } else {
                    Log.d(TAG, "Could not extract amount from: \$content")
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error processing notification", e)
        }
    }
    
    private fun extractAmount(text: String): Double? {
        for (pattern in AMOUNT_PATTERNS) {
            val matcher = pattern.matcher(text)
            if (matcher.find()) {
                val amountStr = matcher.group(1)?.replace(",", "") ?: continue
                try {
                    return amountStr.toDouble()
                } catch (e: NumberFormatException) {
                    continue
                }
            }
        }
        return null
    }
    
    private fun extractMerchant(text: String): String {
        for (pattern in MERCHANT_PATTERNS) {
            val matcher = pattern.matcher(text)
            if (matcher.find()) {
                return matcher.group(1)?.trim() ?: "Unknown"
            }
        }
        return "Unknown"
    }
    
    private fun storeExpense(amount: Double, merchant: String, rawText: String, timestamp: Long) {
        try {
            val pendingJson = sharedPrefs.getString(PENDING_EXPENSES_KEY, "[]") ?: "[]"
            val pendingArray = JSONArray(pendingJson)
            
            val expense = JSONObject().apply {
                put("id", UUID.randomUUID().toString())
                put("amount", amount)
                put("merchant", merchant)
                put("rawText", rawText)
                put("timestamp", timestamp)
                put("processed", false)
            }
            
            pendingArray.put(expense)
            
            sharedPrefs.edit()
                .putString(PENDING_EXPENSES_KEY, pendingArray.toString())
                .apply()
            
            Log.d(TAG, "Stored expense: \$amount to \$merchant")
        } catch (e: Exception) {
            Log.e(TAG, "Error storing expense", e)
        }
    }
    
    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val name = "Expense Notifications"
            val descriptionText = "Notifications for detected expenses"
            val importance = NotificationManager.IMPORTANCE_DEFAULT
            val channel = NotificationChannel(CHANNEL_ID, name, importance).apply {
                description = descriptionText
            }
            val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            notificationManager.createNotificationChannel(channel)
        }
    }
    
    private fun showExpenseNotification(amount: Double, merchant: String) {
        try {
            // Create intent for main action (open app)
            val launchIntent = packageManager.getLaunchIntentForPackage(packageName)?.apply {
                putExtra("expense_amount", amount)
                putExtra("expense_merchant", merchant)
                putExtra("action", "view")
            }
            val pendingIntent = PendingIntent.getActivity(
                this, 0, launchIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            
            // Create intents for quick action buttons
            val foodIntent = packageManager.getLaunchIntentForPackage(packageName)?.apply {
                putExtra("expense_amount", amount)
                putExtra("expense_merchant", merchant)
                putExtra("action", "category_food")
            }
            val foodPendingIntent = PendingIntent.getActivity(
                this, 1, foodIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            
            val shoppingIntent = packageManager.getLaunchIntentForPackage(packageName)?.apply {
                putExtra("expense_amount", amount)
                putExtra("expense_merchant", merchant)
                putExtra("action", "category_shopping")
            }
            val shoppingPendingIntent = PendingIntent.getActivity(
                this, 2, shoppingIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            
            val otherIntent = packageManager.getLaunchIntentForPackage(packageName)?.apply {
                putExtra("expense_amount", amount)
                putExtra("expense_merchant", merchant)
                putExtra("action", "category_other")
            }
            val otherPendingIntent = PendingIntent.getActivity(
                this, 3, otherIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            
            // Get the app's notification icon resource
            val iconResId = resources.getIdentifier("notification_icon", "drawable", packageName)
            val finalIconId = if (iconResId != 0) iconResId else resources.getIdentifier("ic_launcher", "mipmap", packageName)
            
            val notification = NotificationCompat.Builder(this, CHANNEL_ID)
                .setSmallIcon(if (finalIconId != 0) finalIconId else android.R.drawable.ic_dialog_info)
                .setContentTitle("💰 New expense detected")
                .setContentText("₹\${"%.2f".format(amount)} at \$merchant")
                .setStyle(NotificationCompat.BigTextStyle()
                    .bigText("₹\${"%.2f".format(amount)} at \$merchant\\n\\nTap a category to save this expense quickly:"))
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setContentIntent(pendingIntent)
                .setAutoCancel(true)
                .setColor(0xFF4F46E5.toInt())
                .addAction(0, "🍔 Food", foodPendingIntent)
                .addAction(0, "🛍️ Shopping", shoppingPendingIntent)
                .addAction(0, "📝 Other", otherPendingIntent)
                .build()
            
            val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            notificationManager.notify(System.currentTimeMillis().toInt(), notification)
            
            Log.d(TAG, "Showed expense notification with quick actions")
        } catch (e: Exception) {
            Log.e(TAG, "Error showing notification", e)
        }
    }

    override fun onNotificationRemoved(sbn: StatusBarNotification?) {
        // Not needed
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
import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import android.os.Build
import android.provider.Settings
import android.util.Log
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule
import org.json.JSONArray
import org.json.JSONObject

class NotificationListenerModule(reactContext: ReactApplicationContext) : 
    ReactContextBaseJavaModule(reactContext), LifecycleEventListener {

    companion object {
        private const val TAG = "NotificationListenerModule"
        private const val MODULE_NAME = "NotificationListener"
        private const val NOTIFICATION_RECEIVED_EVENT = "onNotificationReceived"
        private const val PREFS_NAME = "ChillarExpenses"
        private const val PENDING_EXPENSES_KEY = "pending_expenses"
    }

    private var listenerCount = 0
    private val sharedPrefs: SharedPreferences = reactContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

    init {
        reactContext.addLifecycleEventListener(this)
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
    fun getPendingExpenses(promise: Promise) {
        try {
            val pendingJson = sharedPrefs.getString(PENDING_EXPENSES_KEY, "[]") ?: "[]"
            val pendingArray = JSONArray(pendingJson)
            
            val result = Arguments.createArray()
            for (i in 0 until pendingArray.length()) {
                val expense = pendingArray.getJSONObject(i)
                val expenseMap = Arguments.createMap().apply {
                    putString("id", expense.optString("id"))
                    putDouble("amount", expense.optDouble("amount"))
                    putString("merchant", expense.optString("merchant"))
                    putString("rawText", expense.optString("rawText"))
                    putDouble("timestamp", expense.optDouble("timestamp"))
                    putBoolean("processed", expense.optBoolean("processed"))
                }
                result.pushMap(expenseMap)
            }
            
            promise.resolve(result)
        } catch (e: Exception) {
            promise.reject("ERROR", "Failed to get pending expenses", e)
        }
    }
    
    @ReactMethod
    fun clearPendingExpenses(promise: Promise) {
        try {
            sharedPrefs.edit().putString(PENDING_EXPENSES_KEY, "[]").apply()
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("ERROR", "Failed to clear pending expenses", e)
        }
    }
    
    @ReactMethod
    fun markExpenseProcessed(id: String, promise: Promise) {
        try {
            val pendingJson = sharedPrefs.getString(PENDING_EXPENSES_KEY, "[]") ?: "[]"
            val pendingArray = JSONArray(pendingJson)
            val newArray = JSONArray()
            
            for (i in 0 until pendingArray.length()) {
                val expense = pendingArray.getJSONObject(i)
                if (expense.optString("id") == id) {
                    expense.put("processed", true)
                }
                newArray.put(expense)
            }
            
            sharedPrefs.edit().putString(PENDING_EXPENSES_KEY, newArray.toString()).apply()
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("ERROR", "Failed to mark expense processed", e)
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
