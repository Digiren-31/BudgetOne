package com.budgetone.app.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.budgetone.app.data.entity.Category
import com.budgetone.app.data.entity.Expense
import com.budgetone.app.data.repository.CategoryRepository
import com.budgetone.app.data.repository.ExpenseRepository
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import java.util.*

data class ExpenseUiState(
    val expenses: List<Expense> = emptyList(),
    val categories: List<Category> = emptyList(),
    val todayTotal: Double = 0.0,
    val isLoading: Boolean = false
)

class ExpenseViewModel(
    private val expenseRepository: ExpenseRepository,
    private val categoryRepository: CategoryRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(ExpenseUiState())
    val uiState: StateFlow<ExpenseUiState> = _uiState.asStateFlow()

    init {
        loadTodayExpenses()
        loadCategories()
    }

    private fun loadTodayExpenses() {
        viewModelScope.launch {
            val calendar = Calendar.getInstance()
            calendar.set(Calendar.HOUR_OF_DAY, 0)
            calendar.set(Calendar.MINUTE, 0)
            calendar.set(Calendar.SECOND, 0)
            calendar.set(Calendar.MILLISECOND, 0)
            val startOfDay = calendar.timeInMillis

            calendar.set(Calendar.HOUR_OF_DAY, 23)
            calendar.set(Calendar.MINUTE, 59)
            calendar.set(Calendar.SECOND, 59)
            calendar.set(Calendar.MILLISECOND, 999)
            val endOfDay = calendar.timeInMillis

            combine(
                expenseRepository.getExpensesByDateRange(startOfDay, endOfDay),
                expenseRepository.getTotalByDateRange(startOfDay, endOfDay)
            ) { expenses, total ->
                _uiState.update { it.copy(expenses = expenses, todayTotal = total ?: 0.0) }
            }.collect()
        }
    }

    private fun loadCategories() {
        viewModelScope.launch {
            categoryRepository.getAllCategories().collect { categories ->
                _uiState.update { it.copy(categories = categories) }
            }
        }
    }

    fun addExpense(expense: Expense) {
        viewModelScope.launch {
            expenseRepository.insertExpense(expense)
        }
    }

    fun updateExpense(expense: Expense) {
        viewModelScope.launch {
            expenseRepository.updateExpense(expense)
        }
    }

    fun deleteExpense(expense: Expense) {
        viewModelScope.launch {
            expenseRepository.deleteExpense(expense)
        }
    }

    fun getCategoryById(categoryId: Long): Category? {
        return _uiState.value.categories.find { it.id == categoryId }
    }
}
