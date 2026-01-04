package com.budgetone.app.data.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "sms_templates")
data class SmsTemplate(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    val bankName: String,
    val patternRegex: String,
    val sampleSms: String,
    val amountPosition: Int, // Position/index of amount in the pattern
    val isActive: Boolean = true
)
