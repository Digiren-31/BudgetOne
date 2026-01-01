# BudgetOne

A modern Android budget tracking application with an intuitive, Apple-inspired design.

## 🌟 Features

### 📊 Daily Expenditure Tracking
- Clean, scrollable list of today's expenses
- Each entry displays title, amount, category with icon, time, and optional notes
- Floating Action Button for quick expense addition
- Beautiful bottom sheet for adding/editing expenses
- Daily total prominently displayed
- Edit and delete functionality

### 📈 Analytics & Reports
- Overview dashboard with total expenditure summaries
- Time-based filtering (Day, Week, Month, Year, Custom range)
- Category-wise breakdown with visualizations
- Spending trends over time
- Budget insights and patterns

### 🔔 Smart SMS Integration
- **SMS Template Onboarding:** Register bank SMS templates by selecting and marking amount in SMS
- **Multiple Bank Support:** Support for different SMS formats from various banks
- **Automatic Parsing:** Smart detection of debit transactions from bank SMS
- **Intelligent Notifications:** Get notified when debit SMS detected with quick add options
- **Pattern Learning:** System learns SMS patterns for automatic recognition

### ⚙️ Settings & Customization
- User profile management
- Theme toggle (Light/Dark/System)
- Currency preferences
- Category management
- Notification settings
- Data backup and export options

## 🏗️ Architecture

Built using modern Android development best practices:

- **Language:** Kotlin
- **UI Framework:** Jetpack Compose with Material Design 3
- **Architecture:** MVVM (Model-View-ViewModel)
- **Database:** Room for local storage
- **Navigation:** Navigation Component with bottom navigation
- **Async:** Kotlin Coroutines and Flow

## 📁 Project Structure

```
app/
├── src/main/java/com/budgetone/app/
│   ├── data/
│   │   ├── entity/          # Room entities
│   │   ├── dao/             # Data Access Objects
│   │   ├── database/        # Database configuration
│   │   └── repository/      # Repository pattern
│   ├── ui/
│   │   ├── theme/           # Material 3 theming
│   │   ├── screens/         # UI screens
│   │   │   ├── home/        # Home/Dashboard
│   │   │   ├── analytics/   # Analytics & Reports
│   │   │   └── settings/    # Settings
│   │   └── navigation/      # Navigation setup
│   ├── viewmodel/           # ViewModels
│   ├── sms/                 # SMS parsing logic
│   ├── notification/        # Notification helpers
│   ├── MainActivity.kt
│   └── BudgetOneApplication.kt
└── res/
    ├── values/              # Strings, themes
    ├── drawable/            # Icons and drawables
    └── mipmap/              # Launcher icons
```

## 🎨 Design Philosophy

**Apple-inspired aesthetics** with:
- Clean, minimal, and sophisticated UI
- Generous whitespace and consistent padding
- Modern typography with careful weight selection
- Subtle animations and micro-interactions
- True dark mode (OLED-friendly blacks)
- High contrast for excellent legibility

## 🗄️ Database Schema

### Tables:
1. **Expense** - id, title, amount, category_id, timestamp, notes, source
2. **Category** - id, name, icon, color (pre-loaded with 8 default categories)
3. **SmsTemplate** - id, bank_name, pattern_regex, sample_sms, amount_position
4. **UserSetting** - key-value pairs for user preferences

## 🔒 Permissions

Required permissions:
- `RECEIVE_SMS` - For detecting incoming SMS
- `READ_SMS` - For reading SMS content
- `POST_NOTIFICATIONS` - For showing transaction alerts (Android 13+)

All permissions are requested at runtime with proper handling.

## 🚀 Getting Started

### Prerequisites
- Android Studio Hedgehog | 2023.1.1 or newer
- Android SDK 26 (Android 8.0) or higher
- Kotlin 1.9.20

### Build Instructions

1. Clone the repository:
```bash
git clone https://github.com/Digiren-31/BudgetOne.git
```

2. Open the project in Android Studio

3. Sync Gradle files

4. Run the app on an emulator or physical device

## 🎯 Key Features Implementation Status

- ✅ Project structure and Gradle configuration
- ✅ Room database with all tables
- ✅ Material 3 theme with dark/light mode
- ✅ Home screen with expense list UI
- ✅ Analytics screen with filtering
- ✅ Settings screen with profile
- ✅ SMS receiver and parser
- ✅ Notification system
- ⏳ ViewModel integration with UI (in progress)
- ⏳ SMS onboarding wizard UI
- ⏳ Chart visualizations
- ⏳ Data persistence and CRUD operations

## 📱 Screens

1. **Home/Dashboard** - Today's expenses with FAB
2. **Add/Edit Expense** - Bottom sheet modal
3. **Analytics** - Charts and category breakdowns
4. **Settings** - User profile and app settings
5. **SMS Onboarding** - Template setup wizard (to be completed)
6. **Profile Edit** - User information (to be completed)

## 🤝 Contributing

This is a demonstration project. Feel free to fork and customize for your needs.

## 📄 License

This project is open source and available under the MIT License.

## 🙏 Acknowledgments

- Material Design 3 guidelines
- Jetpack Compose documentation
- Android developer community
