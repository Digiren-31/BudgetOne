package com.budgetone.app.data.repository

import com.budgetone.app.data.dao.ExpenseDao
import com.budgetone.app.data.entity.Expense
import kotlinx.coroutines.flow.Flow

class ExpenseRepository(private val expenseDao: ExpenseDao) {
    
    fun getAllExpenses(): Flow<List<Expense>> = expenseDao.getAllExpenses()
    
    fun getExpensesByDateRange(startTime: Long, endTime: Long): Flow<List<Expense>> =
        expenseDao.getExpensesByDateRange(startTime, endTime)
    
    fun getExpensesByCategory(categoryId: Long): Flow<List<Expense>> =
        expenseDao.getExpensesByCategory(categoryId)
    
    suspend fun getExpenseById(id: Long): Expense? = expenseDao.getExpenseById(id)
    
    suspend fun insertExpense(expense: Expense): Long = expenseDao.insertExpense(expense)
    
    suspend fun updateExpense(expense: Expense) = expenseDao.updateExpense(expense)
    
    suspend fun deleteExpense(expense: Expense) = expenseDao.deleteExpense(expense)
    
    suspend fun deleteExpenseById(id: Long) = expenseDao.deleteExpenseById(id)
    
    fun getTotalByDateRange(startTime: Long, endTime: Long): Flow<Double?> =
        expenseDao.getTotalByDateRange(startTime, endTime)
    
    fun getTotalByCategoryAndDateRange(categoryId: Long, startTime: Long, endTime: Long): Flow<Double?> =
        expenseDao.getTotalByCategoryAndDateRange(categoryId, startTime, endTime)
}
