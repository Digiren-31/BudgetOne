package com.budgetone.app.sms

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.provider.Telephony
import android.telephony.SmsMessage
import android.util.Log
import com.budgetone.app.notification.NotificationHelper

class SmsReceiver : BroadcastReceiver() {
    
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action == Telephony.Sms.Intents.SMS_RECEIVED_ACTION) {
            val messages = Telephony.Sms.Intents.getMessagesFromIntent(intent)
            
            for (message in messages) {
                val messageBody = message.messageBody
                val sender = message.displayOriginatingAddress
                
                Log.d("SmsReceiver", "SMS from: $sender, Body: $messageBody")
                
                // Try to parse SMS using templates
                val smsParser = SmsParser(context)
                val parsedData = smsParser.parseSms(messageBody, sender)
                
                if (parsedData != null) {
                    // Show notification for debit transaction
                    NotificationHelper.showTransactionNotification(
                        context,
                        parsedData.amount,
                        parsedData.bankName
                    )
                }
            }
        }
    }
}
