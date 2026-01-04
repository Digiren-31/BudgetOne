package com.budgetone.app

import android.app.Application
import com.budgetone.app.notification.NotificationHelper

class BudgetOneApplication : Application() {
    
    override fun onCreate() {
        super.onCreate()
        
        // Create notification channels
        NotificationHelper.createNotificationChannel(this)
    }
}
