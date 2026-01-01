package com.budgetone.app.data.repository

import com.budgetone.app.data.dao.SmsTemplateDao
import com.budgetone.app.data.entity.SmsTemplate
import kotlinx.coroutines.flow.Flow

class SmsTemplateRepository(private val smsTemplateDao: SmsTemplateDao) {
    
    fun getActiveTemplates(): Flow<List<SmsTemplate>> = smsTemplateDao.getActiveTemplates()
    
    fun getAllTemplates(): Flow<List<SmsTemplate>> = smsTemplateDao.getAllTemplates()
    
    suspend fun getTemplateById(id: Long): SmsTemplate? = smsTemplateDao.getTemplateById(id)
    
    suspend fun insertTemplate(template: SmsTemplate): Long = smsTemplateDao.insertTemplate(template)
    
    suspend fun updateTemplate(template: SmsTemplate) = smsTemplateDao.updateTemplate(template)
    
    suspend fun deleteTemplate(template: SmsTemplate) = smsTemplateDao.deleteTemplate(template)
}
