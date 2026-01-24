/**
 * Expo Config Plugin for SMS Receiver
 * 
 * This plugin adds native Android code to listen for incoming SMS messages
 * in the background and forward them to the React Native app.
 */

const { withAndroidManifest, withMainApplication, withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Add SMS receiver to AndroidManifest.xml
 */
function withSmsReceiverManifest(config) {
  return withAndroidManifest(config, async (config) => {
    const androidManifest = config.modResults;
    const mainApplication = androidManifest.manifest.application[0];

    // Add the SMS BroadcastReceiver
    if (!mainApplication.receiver) {
      mainApplication.receiver = [];
    }

    // Check if receiver already exists
    const receiverExists = mainApplication.receiver.some(
      (r) => r.$['android:name'] === '.SmsReceiver'
    );

    if (!receiverExists) {
      mainApplication.receiver.push({
        $: {
          'android:name': '.SmsReceiver',
          'android:enabled': 'true',
          'android:exported': 'true',
          'android:permission': 'android.permission.BROADCAST_SMS',
        },
        'intent-filter': [
          {
            $: {
              'android:priority': '999',
            },
            action: [
              {
                $: {
                  'android:name': 'android.provider.Telephony.SMS_RECEIVED',
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
 * Create the native SMS Receiver Kotlin file
 */
function withSmsReceiverNativeCode(config) {
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

      // Create SmsReceiver.kt
      const smsReceiverCode = `package ${packageName}

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.telephony.SmsMessage
import android.util.Log

class SmsReceiver : BroadcastReceiver() {
    companion object {
        private const val TAG = "SmsReceiver"
        private const val SMS_RECEIVED = "android.provider.Telephony.SMS_RECEIVED"
        
        // Static reference to the module for sending events
        var smsReceiverModule: SmsReceiverModule? = null
    }

    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action != SMS_RECEIVED) return

        try {
            val bundle: Bundle? = intent.extras
            if (bundle != null) {
                val pdus = bundle.get("pdus") as Array<*>?
                val format = bundle.getString("format") ?: "3gpp"
                
                pdus?.forEach { pdu ->
                    val smsMessage = SmsMessage.createFromPdu(pdu as ByteArray, format)
                    val sender = smsMessage.displayOriginatingAddress ?: ""
                    val body = smsMessage.messageBody ?: ""
                    val timestamp = smsMessage.timestampMillis

                    Log.d(TAG, "SMS received from: \$sender")
                    
                    // Send to React Native module
                    smsReceiverModule?.sendSmsEvent(sender, body, timestamp)
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error processing SMS", e)
        }
    }
}
`;

      fs.writeFileSync(
        path.join(androidSrcPath, 'SmsReceiver.kt'),
        smsReceiverCode
      );

      // Create SmsReceiverModule.kt - React Native Native Module
      const smsReceiverModuleCode = `package ${packageName}

import android.Manifest
import android.content.ContentResolver
import android.content.pm.PackageManager
import android.database.Cursor
import android.net.Uri
import android.util.Log
import androidx.core.content.ContextCompat
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule

class SmsReceiverModule(reactContext: ReactApplicationContext) : 
    ReactContextBaseJavaModule(reactContext), LifecycleEventListener {

    companion object {
        private const val TAG = "SmsReceiverModule"
        private const val MODULE_NAME = "SmsReceiver"
        private const val SMS_RECEIVED_EVENT = "onSmsReceived"
    }

    private var listenerCount = 0

    init {
        reactContext.addLifecycleEventListener(this)
        // Register this module with the static receiver
        SmsReceiver.smsReceiverModule = this
    }

    override fun getName(): String = MODULE_NAME

    override fun onHostResume() {
        Log.d(TAG, "App resumed")
    }

    override fun onHostPause() {
        Log.d(TAG, "App paused")
    }

    override fun onHostDestroy() {
        Log.d(TAG, "App destroyed")
        SmsReceiver.smsReceiverModule = null
    }

    /**
     * Send SMS event to JavaScript
     */
    fun sendSmsEvent(address: String, body: String, timestamp: Long) {
        if (listenerCount > 0) {
            val params = Arguments.createMap().apply {
                putString("address", address)
                putString("body", body)
                putDouble("date", timestamp.toDouble())
            }

            reactApplicationContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                .emit(SMS_RECEIVED_EVENT, params)
            
            Log.d(TAG, "SMS event sent to JS")
        } else {
            Log.d(TAG, "No listeners registered, SMS event not sent")
        }
    }

    @ReactMethod
    fun startListening(promise: Promise) {
        try {
            SmsReceiver.smsReceiverModule = this
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

    @ReactMethod
    fun getRecentMessages(limit: Int, promise: Promise) {
        try {
            if (ContextCompat.checkSelfPermission(
                    reactApplicationContext,
                    Manifest.permission.READ_SMS
                ) != PackageManager.PERMISSION_GRANTED
            ) {
                promise.reject("PERMISSION_DENIED", "SMS permission not granted")
                return
            }

            val messages = WritableNativeArray()
            val cursor: Cursor? = reactApplicationContext.contentResolver.query(
                Uri.parse("content://sms/inbox"),
                arrayOf("_id", "address", "body", "date", "read"),
                null,
                null,
                "date DESC LIMIT \$limit"
            )

            cursor?.use {
                val idIndex = it.getColumnIndex("_id")
                val addressIndex = it.getColumnIndex("address")
                val bodyIndex = it.getColumnIndex("body")
                val dateIndex = it.getColumnIndex("date")
                val readIndex = it.getColumnIndex("read")

                while (it.moveToNext()) {
                    val message = Arguments.createMap().apply {
                        putString("_id", it.getString(idIndex) ?: "")
                        putString("address", it.getString(addressIndex) ?: "")
                        putString("body", it.getString(bodyIndex) ?: "")
                        putString("date", it.getString(dateIndex) ?: "0")
                        putString("read", it.getString(readIndex) ?: "0")
                    }
                    messages.pushMap(message)
                }
            }

            promise.resolve(messages)
        } catch (e: Exception) {
            Log.e(TAG, "Error reading SMS", e)
            promise.reject("ERROR", "Failed to read SMS messages", e)
        }
    }
}
`;

      fs.writeFileSync(
        path.join(androidSrcPath, 'SmsReceiverModule.kt'),
        smsReceiverModuleCode
      );

      // Create SmsReceiverPackage.kt - Package to register the module
      const smsReceiverPackageCode = `package ${packageName}

import android.view.View
import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ReactShadowNode
import com.facebook.react.uimanager.ViewManager

class SmsReceiverPackage : ReactPackage {
    override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> {
        return listOf(SmsReceiverModule(reactContext))
    }

    override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<View, ReactShadowNode<*>>> {
        return emptyList()
    }
}
`;

      fs.writeFileSync(
        path.join(androidSrcPath, 'SmsReceiverPackage.kt'),
        smsReceiverPackageCode
      );

      return config;
    },
  ]);
}

/**
 * Modify MainApplication to register the package
 */
function withSmsReceiverPackageRegistration(config) {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      // The package registration will be handled by the autolinking or
      // we'll need to manually add it. For Expo, we can use a different approach.
      // This is handled by creating a separate registration file.
      return config;
    },
  ]);
}

/**
 * Main plugin export
 */
module.exports = function withSmsReceiver(config) {
  config = withSmsReceiverManifest(config);
  config = withSmsReceiverNativeCode(config);
  return config;
};
