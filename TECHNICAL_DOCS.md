# BudgetOne - Technical Documentation

## Overview

BudgetOne is a modern Android budget tracking application built with Jetpack Compose and Material Design 3. It features an Apple-inspired design aesthetic with smart SMS integration for automatic expense detection.

## Architecture

### MVVM Pattern
The app follows the Model-View-ViewModel architecture:

```
┌─────────────┐
│     View    │ (Jetpack Compose UI)
│  (Screen)   │
└──────┬──────┘
       │
       ↓
┌─────────────┐
│  ViewModel  │ (Business Logic)
└──────┬──────┘
       │
       ↓
┌─────────────┐
│ Repository  │ (Data Layer)
└──────┬──────┘
       │
       ↓
┌─────────────┐
│  Room DAO   │ (Database Access)
└─────────────┘
```

## Core Components

### 1. Database Layer (Room)

#### Entities
- **Expense**: Stores individual expense records
  - Fields: id, title, amount, categoryId, timestamp, notes, source
  - Source can be "manual" (user added) or "sms" (auto-detected)

- **Category**: Pre-defined spending categories
  - Fields: id, name, icon, color
  - 8 default categories: Food, Transport, Shopping, Entertainment, Bills, Health, Education, Other

- **SmsTemplate**: Bank SMS patterns for parsing
  - Fields: id, bankName, patternRegex, sampleSms, amountPosition, isActive
  - Allows users to register custom bank SMS formats

- **UserSetting**: Key-value store for preferences
  - Fields: key, value
  - Stores theme preference, currency, etc.

#### DAOs (Data Access Objects)
Each entity has a corresponding DAO with CRUD operations:
- ExpenseDao: Query expenses by date range, category, calculate totals
- CategoryDao: Manage categories
- SmsTemplateDao: Handle SMS templates
- UserSettingDao: Store/retrieve settings

#### Repositories
Repository pattern abstracts data source:
- ExpenseRepository
- CategoryRepository
- SmsTemplateRepository

### 2. UI Layer (Jetpack Compose)

#### Theme System
- **Material 3** with custom color scheme
- **Light Mode**: Clean whites, subtle accents
- **Dark Mode**: True black (OLED-friendly), muted accents
- **Typography**: Roboto with carefully selected weights
- **Shapes**: Rounded corners (16-20dp) for cards and buttons

#### Screens

**HomeScreen**
- Today's expense list
- Total amount card
- Floating Action Button for adding expenses
- Add/Edit expense bottom sheet

**AnalyticsScreen**
- Time filter chips (Day/Week/Month/Year/Custom)
- Total spent card
- Category breakdown with pie chart placeholder
- Spending trends with bar chart placeholder
- Category list with amounts and percentages

**SettingsScreen**
- User profile card
- Smart features (SMS onboarding, notifications)
- Appearance (theme, currency)
- Data management (categories, backup)
- About section

#### Navigation
- Bottom Navigation Bar with 3 tabs
- NavHost manages screen transitions
- Deep linking support for notifications

### 3. SMS Integration

#### SmsReceiver (BroadcastReceiver)
- Listens for incoming SMS
- Filters for transaction-related messages
- Triggers SMS parsing

#### SmsParser
- **Template-based parsing**: Uses user-registered patterns
- **Fallback detection**: Common debit keywords and amount patterns
- **Bank identification**: Extracts bank name from sender or message
- **Amount extraction**: Regex patterns for various formats (Rs., INR, ₹)

Supported amount patterns:
```
Rs. 1,234.56
INR 1234.56
₹ 1234
1234.56 debited
```

Common banks recognized:
HDFC, ICICI, SBI, AXIS, KOTAK, PNB, BOB, CANARA, etc.

### 4. Notification System

#### NotificationHelper
- Creates notification channel on app start
- Shows transaction alerts when SMS detected
- **Notification format**: "₹X debited from [Bank]. What was this for?"
- Tapping opens app with amount pre-filled
- Supports Android 13+ notification permissions

## Data Flow

### Adding an Expense (Manual)
```
User taps FAB → Bottom sheet opens → User fills details → 
User taps Save → ViewModel.addExpense() → Repository.insertExpense() → 
DAO.insertExpense() → Room DB → Flow updates → UI refreshes
```

### SMS Auto-Detection
```
Bank sends SMS → SmsReceiver intercepts → SmsParser.parseSms() → 
Matches templates or fallback → Extracts amount & bank → 
NotificationHelper shows alert → User taps notification → 
App opens with QuickAdd screen (amount pre-filled)
```

### Viewing Analytics
```
User switches to Analytics tab → ViewModel loads data → 
Repository queries expenses by date range → 
DAO aggregates by category → Flow emits data → 
UI displays charts and breakdowns
```

## Key Features

### 1. Expense Tracking
- Add expenses with title, amount, category, notes
- View today's expenses in chronological order
- Edit or delete existing expenses
- See daily total at a glance

### 2. Smart Categories
- 8 pre-loaded categories with distinct colors
- Custom icon for each category (Material Icons)
- Category-based filtering and analysis
- User can manage categories in settings

### 3. Analytics & Insights
- Time-based filtering (Day, Week, Month, Year, Custom)
- Total expenditure summaries
- Category breakdown with percentages
- Visual charts (pie and bar charts - placeholders for now)
- Spending patterns and comparisons

### 4. SMS Onboarding
- User selects a bank SMS from inbox
- Highlights the amount portion
- Marks as debit transaction
- System generates regex pattern
- Stores as template for future auto-detection
- Supports multiple banks with different formats

### 5. Theme Support
- System-aware dark/light mode
- Manual theme override option
- Smooth transitions between themes
- Optimized for OLED displays in dark mode

## Technical Decisions

### Why Jetpack Compose?
- Modern, declarative UI
- Less boilerplate than XML
- Better performance
- Easy animations and transitions
- Future of Android UI

### Why Room?
- Type-safe SQL queries
- Compile-time verification
- LiveData/Flow support
- Migration support
- Part of Jetpack

### Why Coroutines/Flow?
- Async operations without callback hell
- Cancellation support
- Structured concurrency
- Reactive data updates
- Kotlin-first approach

## Security Considerations

### Permissions
- SMS permissions requested at runtime
- Clear explanation of why permission is needed
- Graceful degradation if denied
- No SMS sent, only received

### Data Privacy
- All data stored locally (Room DB)
- No cloud sync (can be added)
- No analytics or tracking
- SMS content not stored, only patterns

### Best Practices
- Input validation for amounts
- Safe currency formatting
- Error handling for SMS parsing
- Permission checks before operations

## Performance Optimizations

### Database
- Indexed columns for fast queries
- Flow for reactive updates (no manual refresh)
- Efficient date range queries
- Pagination ready (LazyColumn)

### UI
- Compose recomposition optimization
- Remember for expensive calculations
- LazyColumn for efficient scrolling
- State hoisting for better performance

### Memory
- No memory leaks (ViewModel lifecycle-aware)
- Efficient bitmap handling for icons
- Proper cleanup in receivers

## Testing Strategy

### Unit Tests
- ViewModel business logic
- Repository data operations
- SMS parser regex patterns
- Currency formatting

### Integration Tests
- Database operations
- Navigation flows
- Permission handling

### UI Tests
- Screen compositions
- User interactions
- Navigation

## Future Enhancements

### Short-term
1. Complete ViewModel integration
2. Implement chart libraries (Vico)
3. SMS onboarding wizard UI
4. Budget limits and warnings
5. Search and filter expenses

### Medium-term
1. Recurring expenses
2. Multiple currency support
3. Export to CSV/PDF
4. Cloud backup (optional)
5. Widgets

### Long-term
1. Split expenses (group/friends)
2. Receipt photo attachment
3. Bill reminders
4. Investment tracking
5. Financial goals

## Build Configuration

### Gradle Versions
- AGP: 8.2.0
- Kotlin: 1.9.20
- Compose: 1.5.4 (compiler)
- Compose BOM: 2023.10.01

### Dependencies
- Core: AndroidX KTX, Lifecycle
- UI: Compose (UI, Material3, Navigation)
- Database: Room 2.6.1
- Async: Coroutines 1.7.3
- Charts: Vico 1.13.1, MPAndroidChart 3.1.0

### Build Variants
- Debug: Development build with debugging enabled
- Release: Production build with minification

## Development Guidelines

### Code Style
- Follow Kotlin coding conventions
- Use meaningful variable names
- Comment complex logic
- Keep functions small and focused

### Compose Best Practices
- Use `remember` for state
- Hoist state when possible
- Extract reusable composables
- Use preview annotations

### Git Workflow
- Feature branches for new features
- Descriptive commit messages
- PR reviews before merge
- Keep commits focused

## Troubleshooting

### Common Issues

**SMS not detected**
- Check if SMS permission granted
- Verify SMS format matches templates
- Check LogCat for parsing errors

**Notifications not showing**
- Verify POST_NOTIFICATIONS permission (Android 13+)
- Check notification settings
- Ensure channel is created

**Database errors**
- Clear app data and reinstall
- Check entity schema
- Verify Room version compatibility

**Build errors**
- Sync Gradle files
- Invalidate caches and restart
- Update Android Studio

## Resources

- [Jetpack Compose Docs](https://developer.android.com/jetpack/compose)
- [Material Design 3](https://m3.material.io/)
- [Room Persistence Library](https://developer.android.com/training/data-storage/room)
- [Android SMS APIs](https://developer.android.com/reference/android/telephony/SmsMessage)

## Contact & Support

For issues, questions, or contributions, please refer to the repository.
