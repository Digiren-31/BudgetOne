# Chillar - Personal Budget & Expense Tracker

A cross-platform mobile app for Android and iOS that helps you track expenses with smart SMS detection.

## Features

### 📱 Core Features
- **Today Tab**: View and manage today's expenses with real-time updates
- **Insights Tab**: Visualize spending with pie charts, bar charts, and category breakdowns
- **Settings Tab**: Customize your profile, currency, notifications, and categories

### 🔔 Smart SMS Detection (Android)
- Automatically detect expense transactions from bank SMS
- AI-powered pattern recognition for any bank format
- Instant push notifications with quick category selection
- One-time setup, works for all future messages

### 📊 Insights & Analytics
- Weekly, monthly, 6-month, and yearly views
- Category-wise expense breakdown
- Daily/monthly spending trends
- Top transactions list

### ⚙️ Customization
- Multiple currency support (10+ currencies)
- Custom expense categories
- Dark and light themes
- Notification preferences

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (Mac) or Android Emulator

### Installation

1. Clone the repository and navigate to the project:
```bash
cd Chillar
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

4. Run on your preferred platform:
```bash
# For iOS
npm run ios

# For Android
npm run android
```

## Project Structure

```
Chillar/
├── App.tsx                 # Main app entry point
├── src/
│   ├── components/         # Reusable UI components
│   │   ├── common.tsx      # Card, ListItem, EmptyState, etc.
│   │   └── ExpenseItem.tsx # Expense display components
│   ├── constants/          # App constants
│   │   ├── theme.ts        # Colors, spacing, typography
│   │   ├── currencies.ts   # Currency configurations
│   │   └── categories.ts   # Default expense categories
│   ├── context/            # React context providers
│   │   ├── ThemeContext.tsx    # Theme management
│   │   └── SettingsContext.tsx # App settings
│   ├── hooks/              # Custom React hooks
│   │   └── useNotificationHandler.ts
│   ├── models/             # TypeScript type definitions
│   │   └── types.ts        # Expense, Category, Pattern types
│   ├── navigation/         # Navigation configuration
│   │   └── AppNavigator.tsx
│   ├── screens/            # App screens
│   │   ├── TodayScreen.tsx
│   │   ├── InsightsScreen.tsx
│   │   ├── SettingsScreen.tsx
│   │   ├── AddExpenseScreen.tsx
│   │   ├── EditExpenseScreen.tsx
│   │   ├── ManageCategoriesScreen.tsx
│   │   ├── SmsOnboardingScreen.tsx
│   │   └── ...
│   └── services/           # Business logic & API
│       ├── database.ts     # SQLite database operations
│       ├── aiPatternService.ts  # AI pattern recognition
│       ├── smsService.ts   # SMS reading & processing
│       └── notificationService.ts
└── assets/                 # Images, icons, fonts
```

## Key Technologies

- **React Native** with Expo
- **TypeScript** for type safety
- **expo-sqlite** for local data persistence
- **expo-notifications** for push notifications
- **react-native-chart-kit** for data visualization
- **@react-navigation** for navigation

## SMS Pattern Recognition

The app uses AI-powered pattern recognition to understand bank SMS formats:

1. User selects a sample SMS from their bank
2. App sends the SMS to the AI pattern recognition API
3. API returns a regex pattern for amount/date extraction
4. Pattern is stored locally for future SMS matching
5. When matching SMS arrives, expense is auto-detected

### Fallback Patterns
The app includes fallback patterns for common Indian bank SMS formats:
- HDFC, ICICI, SBI, Axis, Kotak, etc.
- Supports Rs., INR, and ₹ currency symbols
- Handles various transaction formats

## API Integration

### AI Pattern Recognition Endpoint
```
POST /api/sms-pattern
```

Request:
```json
{
  "sms_text": "Rs.1,250.00 debited from a/c **1234...",
  "sender_id": "HDFCBK",
  "timestamp": "2026-01-24T14:30:00Z"
}
```

Response:
```json
{
  "sender_regex": "^HDFCBK$",
  "amount_regex": "Rs\\.?\\s*([\\d,]+(?:\\.\\d{2})?)",
  "datetime_regex": null,
  "amount_group": 1,
  "confidence": 0.95
}
```

## Privacy

- All expense data is stored locally on device
- SMS content is only sent to AI API during pattern setup
- No cloud sync or data sharing
- SMS reading is opt-in and clearly explained

## License

MIT License - feel free to use and modify for your needs.
