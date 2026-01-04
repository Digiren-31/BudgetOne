package com.budgetone.app.data.dao

import androidx.room.*
import com.budgetone.app.data.entity.UserSetting
import kotlinx.coroutines.flow.Flow

@Dao
interface UserSettingDao {
    @Query("SELECT * FROM user_settings")
    fun getAllSettings(): Flow<List<UserSetting>>

    @Query("SELECT * FROM user_settings WHERE key = :key")
    suspend fun getSettingByKey(key: String): UserSetting?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertSetting(setting: UserSetting)

    @Update
    suspend fun updateSetting(setting: UserSetting)

    @Delete
    suspend fun deleteSetting(setting: UserSetting)
}
