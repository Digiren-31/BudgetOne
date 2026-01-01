package com.budgetone.app.data.dao

import androidx.room.*
import com.budgetone.app.data.entity.Expense
import kotlinx.coroutines.flow.Flow

@Dao
interface ExpenseDao {
    @Query("SELECT * FROM expenses ORDER BY timestamp DESC")
    fun getAllExpenses(): Flow<List<Expense>>

    @Query("SELECT * FROM expenses WHERE timestamp >= :startTime AND timestamp <= :endTime ORDER BY timestamp DESC")
    fun getExpensesByDateRange(startTime: Long, endTime: Long): Flow<List<Expense>>

    @Query("SELECT * FROM expenses WHERE categoryId = :categoryId ORDER BY timestamp DESC")
    fun getExpensesByCategory(categoryId: Long): Flow<List<Expense>>

    @Query("SELECT * FROM expenses WHERE id = :id")
    suspend fun getExpenseById(id: Long): Expense?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertExpense(expense: Expense): Long

    @Update
    suspend fun updateExpense(expense: Expense)

    @Delete
    suspend fun deleteExpense(expense: Expense)

    @Query("DELETE FROM expenses WHERE id = :id")
    suspend fun deleteExpenseById(id: Long)

    @Query("SELECT SUM(amount) FROM expenses WHERE timestamp >= :startTime AND timestamp <= :endTime")
    fun getTotalByDateRange(startTime: Long, endTime: Long): Flow<Double?>

    @Query("SELECT SUM(amount) FROM expenses WHERE categoryId = :categoryId AND timestamp >= :startTime AND timestamp <= :endTime")
    fun getTotalByCategoryAndDateRange(categoryId: Long, startTime: Long, endTime: Long): Flow<Double?>
}
