package com.budgetone.app.data.database

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import androidx.sqlite.db.SupportSQLiteDatabase
import com.budgetone.app.data.dao.*
import com.budgetone.app.data.entity.*
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

@Database(
    entities = [
        Expense::class,
        Category::class,
        SmsTemplate::class,
        UserSetting::class
    ],
    version = 1,
    exportSchema = false
)
abstract class BudgetDatabase : RoomDatabase() {
    abstract fun expenseDao(): ExpenseDao
    abstract fun categoryDao(): CategoryDao
    abstract fun smsTemplateDao(): SmsTemplateDao
    abstract fun userSettingDao(): UserSettingDao

    companion object {
        @Volatile
        private var INSTANCE: BudgetDatabase? = null

        fun getDatabase(context: Context): BudgetDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    BudgetDatabase::class.java,
                    "budget_database"
                )
                    .addCallback(DatabaseCallback(context))
                    .build()
                INSTANCE = instance
                instance
            }
        }

        private class DatabaseCallback(
            private val context: Context
        ) : RoomDatabase.Callback() {
            override fun onCreate(db: SupportSQLiteDatabase) {
                super.onCreate(db)
                INSTANCE?.let { database ->
                    CoroutineScope(Dispatchers.IO).launch {
                        populateDatabase(database.categoryDao())
                    }
                }
            }
        }

        private suspend fun populateDatabase(categoryDao: CategoryDao) {
            // Pre-populate categories
            val categories = listOf(
                Category(1, "Food & Dining", "restaurant", "#FF6B6B"),
                Category(2, "Transportation", "directions_car", "#4ECDC4"),
                Category(3, "Shopping", "shopping_bag", "#45B7D1"),
                Category(4, "Entertainment", "movie", "#FFA07A"),
                Category(5, "Bills & Utilities", "receipt_long", "#98D8C8"),
                Category(6, "Health", "health_and_safety", "#F7DC6F"),
                Category(7, "Education", "school", "#BB8FCE"),
                Category(8, "Other", "category", "#95A5A6")
            )
            categoryDao.insertCategories(categories)
        }
    }
}
