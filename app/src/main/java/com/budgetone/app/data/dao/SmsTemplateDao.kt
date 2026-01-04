package com.budgetone.app.data.dao

import androidx.room.*
import com.budgetone.app.data.entity.SmsTemplate
import kotlinx.coroutines.flow.Flow

@Dao
interface SmsTemplateDao {
    @Query("SELECT * FROM sms_templates WHERE isActive = 1")
    fun getActiveTemplates(): Flow<List<SmsTemplate>>

    @Query("SELECT * FROM sms_templates")
    fun getAllTemplates(): Flow<List<SmsTemplate>>

    @Query("SELECT * FROM sms_templates WHERE id = :id")
    suspend fun getTemplateById(id: Long): SmsTemplate?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertTemplate(template: SmsTemplate): Long

    @Update
    suspend fun updateTemplate(template: SmsTemplate)

    @Delete
    suspend fun deleteTemplate(template: SmsTemplate)
}
