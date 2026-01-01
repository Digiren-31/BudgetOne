package com.budgetone.app.sms

import android.content.Context
import com.budgetone.app.data.database.BudgetDatabase
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.runBlocking
import java.util.regex.Pattern

data class ParsedSmsData(
    val amount: Double,
    val bankName: String,
    val transactionType: String = "debit"
)

class SmsParser(private val context: Context) {
    
    private val database = BudgetDatabase.getDatabase(context)
    
    fun parseSms(messageBody: String, sender: String): ParsedSmsData? {
        // Get active SMS templates
        val templates = runBlocking {
            database.smsTemplateDao().getActiveTemplates().first()
        }
        
        // Try to match against each template
        for (template in templates) {
            try {
                val pattern = Pattern.compile(template.patternRegex, Pattern.CASE_INSENSITIVE)
                val matcher = pattern.matcher(messageBody)
                
                if (matcher.find()) {
                    // Extract amount based on template
                    val amountStr = matcher.group(template.amountPosition)
                    val amount = amountStr?.replace(",", "")?.replace("Rs.", "")
                        ?.replace("INR", "")?.trim()?.toDoubleOrNull()
                    
                    if (amount != null && amount > 0) {
                        return ParsedSmsData(
                            amount = amount,
                            bankName = template.bankName,
                            transactionType = "debit"
                        )
                    }
                }
            } catch (e: Exception) {
                // Continue to next template if this one fails
                continue
            }
        }
        
        // Fallback: Try to detect common patterns
        return detectCommonPattern(messageBody, sender)
    }
    
    private fun detectCommonPattern(messageBody: String, sender: String): ParsedSmsData? {
        // Common patterns for debit SMS
        val debitKeywords = listOf("debited", "withdrawn", "spent", "paid", "deducted")
        val hasDebitKeyword = debitKeywords.any { messageBody.contains(it, ignoreCase = true) }
        
        if (!hasDebitKeyword) return null
        
        // Try to extract amount using common patterns
        val amountPatterns = listOf(
            "Rs\\.?\\s*(\\d+(?:,\\d+)*(?:\\.\\d{2})?)",
            "INR\\s*(\\d+(?:,\\d+)*(?:\\.\\d{2})?)",
            "₹\\s*(\\d+(?:,\\d+)*(?:\\.\\d{2})?)",
            "(\\d+(?:,\\d+)*(?:\\.\\d{2})?)\\s*(?:Rs|INR|debited|withdrawn)"
        )
        
        for (patternStr in amountPatterns) {
            try {
                val pattern = Pattern.compile(patternStr, Pattern.CASE_INSENSITIVE)
                val matcher = pattern.matcher(messageBody)
                
                if (matcher.find()) {
                    val amountStr = matcher.group(1)
                    val amount = amountStr?.replace(",", "")?.toDoubleOrNull()
                    
                    if (amount != null && amount > 0) {
                        return ParsedSmsData(
                            amount = amount,
                            bankName = extractBankName(sender, messageBody),
                            transactionType = "debit"
                        )
                    }
                }
            } catch (e: Exception) {
                continue
            }
        }
        
        return null
    }
    
    private fun extractBankName(sender: String, messageBody: String): String {
        // Try to extract bank name from sender ID or message body
        val commonBanks = listOf(
            "HDFC", "ICICI", "SBI", "AXIS", "KOTAK", "PNB", "BOB", "CANARA",
            "UNION", "IDBI", "YES", "INDUS", "FEDERAL", "RBL", "IDFC"
        )
        
        // Check sender
        for (bank in commonBanks) {
            if (sender.contains(bank, ignoreCase = true)) {
                return bank
            }
        }
        
        // Check message body
        for (bank in commonBanks) {
            if (messageBody.contains(bank, ignoreCase = true)) {
                return bank
            }
        }
        
        return "Unknown Bank"
    }
}
