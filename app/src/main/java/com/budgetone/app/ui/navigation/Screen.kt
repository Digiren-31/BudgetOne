package com.budgetone.app.ui.navigation

sealed class Screen(val route: String) {
    object Home : Screen("home")
    object Analytics : Screen("analytics")
    object Settings : Screen("settings")
    object AddExpense : Screen("add_expense")
    object EditExpense : Screen("edit_expense/{expenseId}") {
        fun createRoute(expenseId: Long) = "edit_expense/$expenseId"
    }
    object CategoryDetail : Screen("category_detail/{categoryId}") {
        fun createRoute(categoryId: Long) = "category_detail/$categoryId"
    }
    object SmsOnboarding : Screen("sms_onboarding")
    object Profile : Screen("profile")
}
