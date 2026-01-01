package com.budgetone.app.data.repository

import com.budgetone.app.data.dao.CategoryDao
import com.budgetone.app.data.entity.Category
import kotlinx.coroutines.flow.Flow

class CategoryRepository(private val categoryDao: CategoryDao) {
    
    fun getAllCategories(): Flow<List<Category>> = categoryDao.getAllCategories()
    
    suspend fun getCategoryById(id: Long): Category? = categoryDao.getCategoryById(id)
    
    suspend fun insertCategory(category: Category): Long = categoryDao.insertCategory(category)
    
    suspend fun updateCategory(category: Category) = categoryDao.updateCategory(category)
    
    suspend fun deleteCategory(category: Category) = categoryDao.deleteCategory(category)
}
