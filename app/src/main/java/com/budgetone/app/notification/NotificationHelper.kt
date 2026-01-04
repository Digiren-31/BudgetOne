package com.budgetone.app.notification

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import com.budgetone.app.MainActivity
import com.budgetone.app.R
import java.text.NumberFormat
import java.util.*

object NotificationHelper {
    
    private const val CHANNEL_ID = "transaction_notifications"
    private const val CHANNEL_NAME = "Transaction Alerts"
    private const val CHANNEL_DESC = "Notifications for detected transactions"
    
    fun createNotificationChannel(context: Context) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val importance = NotificationManager.IMPORTANCE_HIGH
            val channel = NotificationChannel(CHANNEL_ID, CHANNEL_NAME, importance).apply {
                description = CHANNEL_DESC
            }
            
            val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            notificationManager.createNotificationChannel(channel)
        }
    }
    
    fun showTransactionNotification(context: Context, amount: Double, bankName: String) {
        createNotificationChannel(context)
        
        val formattedAmount = formatCurrency(amount)
        
        // Intent to open app
        val intent = Intent(context, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
            putExtra("amount", amount)
            putExtra("source", "sms")
        }
        
        val pendingIntent = PendingIntent.getActivity(
            context,
            0,
            intent,
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )
        
        val notification = NotificationCompat.Builder(context, CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_notification)
            .setContentTitle("Transaction Detected")
            .setContentText("$formattedAmount debited from $bankName. What was this for?")
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setAutoCancel(true)
            .setContentIntent(pendingIntent)
            .build()
        
        try {
            NotificationManagerCompat.from(context).notify(
                System.currentTimeMillis().toInt(),
                notification
            )
        } catch (e: SecurityException) {
            // Handle notification permission not granted
        }
    }
    
    private fun formatCurrency(amount: Double): String {
        val format = NumberFormat.getCurrencyInstance(Locale("en", "IN"))
        return format.format(amount)
    }
}
