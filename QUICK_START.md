# BudgetOne - Quick Start Guide

## Prerequisites

Before you begin, ensure you have:

- **Android Studio**: Hedgehog (2023.1.1) or newer
- **JDK**: Version 17 or higher
- **Android SDK**: 
  - Compile SDK: 34 (Android 14)
  - Min SDK: 26 (Android 8.0)
  - Target SDK: 34
- **Kotlin**: 1.9.20 (bundled with Android Studio)

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/Digiren-31/BudgetOne.git
cd BudgetOne
```

### 2. Open in Android Studio

1. Launch Android Studio
2. Click "Open" and select the `BudgetOne` folder
3. Wait for Gradle sync to complete (this may take a few minutes)

### 3. Sync Gradle Files

If Gradle doesn't sync automatically:
- Click the "Sync Project with Gradle Files" button (elephant icon)
- Or go to: File → Sync Project with Gradle Files

### 4. Build the Project

```bash
# Using Gradle wrapper
./gradlew build

# Or in Android Studio
Build → Make Project (Ctrl+F9 / Cmd+F9)
```

### 5. Run the App

**Option A: Using Android Studio**
1. Select a device (emulator or physical device)
2. Click the Run button (green play icon)
3. Or press Shift+F10 (Windows/Linux) or Ctrl+R (Mac)

**Option B: Using Command Line**
```bash
# Install on connected device
./gradlew installDebug

# Run on specific device
adb -s <device_id> shell am start -n com.budgetone.app/.MainActivity
```

## Project Structure Overview

```
BudgetOne/
├── app/
│   ├── src/
│   │   └── main/
│   │       ├── java/com/budgetone/app/
│   │       │   ├── data/           # Database layer
│   │       │   ├── ui/             # Jetpack Compose UI
│   │       │   ├── viewmodel/      # ViewModels
│   │       │   ├── sms/            # SMS parsing
│   │       │   ├── notification/   # Notifications
│   │       │   ├── MainActivity.kt
│   │       │   └── BudgetOneApplication.kt
│   │       ├── res/                # Resources
│   │       └── AndroidManifest.xml
│   └── build.gradle.kts
├── build.gradle.kts
├── settings.gradle.kts
├── gradle.properties
└── Documentation files
```

## Testing the App

### Testing on Emulator

1. **Create an Emulator** (if not already created):
   - Tools → Device Manager
   - Create Device → Select a phone model
   - Choose Android 13 (API 33) or higher
   - Finish and launch

2. **Run the App**:
   - Select the emulator from device dropdown
   - Click Run

3. **Grant Permissions**:
   - When prompted, allow SMS and Notification permissions
   - Note: SMS reading will only work on physical devices

### Testing on Physical Device

1. **Enable Developer Options**:
   - Go to Settings → About Phone
   - Tap "Build Number" 7 times
   - Go back to Settings → Developer Options
   - Enable "USB Debugging"

2. **Connect Device**:
   - Connect via USB
   - Accept USB debugging prompt on device

3. **Run the App**:
   - Device should appear in Android Studio
   - Click Run

4. **Test SMS Features** (Physical device only):
   - Grant SMS permissions
   - Send test SMS to device
   - Check if notification appears

## Key Files to Understand

### 1. MainActivity.kt
Entry point of the app. Handles:
- Jetpack Compose setup
- Permission requests
- Theme application

### 2. MainNavigation.kt
Defines app navigation:
- Bottom navigation bar
- Screen routing
- Navigation graph

### 3. BudgetDatabase.kt
Room database configuration:
- Entity definitions
- DAO registration
- Pre-population logic

### 4. Theme.kt
Material 3 theming:
- Color schemes (light/dark)
- Typography
- Dynamic color support

### 5. HomeScreen.kt
Main expense tracking screen:
- Expense list
- Add expense bottom sheet
- Daily total display

## Common Development Tasks

### Adding a New Screen

1. Create Composable in `ui/screens/<section>/`
2. Add route to `Screen.kt`
3. Add to NavHost in `MainNavigation.kt`
4. Create ViewModel if needed

Example:
```kotlin
// 1. Create screen
@Composable
fun NewScreen(navController: NavController) {
    // Your UI here
}

// 2. Add route
object NewScreen : Screen("new_screen")

// 3. Add to NavHost
composable(Screen.NewScreen.route) {
    NewScreen(navController)
}
```

### Adding a New Entity

1. Create data class in `data/entity/`
2. Annotate with @Entity
3. Create DAO in `data/dao/`
4. Add to BudgetDatabase entities list
5. Increment database version
6. Add migration if needed

### Modifying Theme Colors

Edit `ui/theme/Color.kt`:
```kotlin
val CustomColor = Color(0xFFRRGGBB)
```

Then update color scheme in `Theme.kt`.

### Adding Dependencies

Edit `app/build.gradle.kts`:
```kotlin
dependencies {
    implementation("group:artifact:version")
}
```

Then sync Gradle.

## Development Workflow

### 1. Create a Feature Branch
```bash
git checkout -b feature/your-feature-name
```

### 2. Make Changes
- Edit code
- Test thoroughly
- Follow existing patterns

### 3. Build and Test
```bash
./gradlew build
./gradlew test
```

### 4. Commit Changes
```bash
git add .
git commit -m "Description of changes"
```

### 5. Push and Create PR
```bash
git push origin feature/your-feature-name
```

## Debugging

### Logcat Filtering
In Android Studio Logcat:
```
tag:BudgetOne
```

Or in code:
```kotlin
import android.util.Log

Log.d("BudgetOne", "Debug message")
Log.e("BudgetOne", "Error message", exception)
```

### Database Inspection
1. View → Tool Windows → App Inspection
2. Select your device
3. Go to Database Inspector
4. View tables and data

### Compose Layout Inspector
1. Run app
2. Tools → Layout Inspector
3. View Compose hierarchy
4. Inspect properties

## Troubleshooting

### Gradle Sync Failed
```bash
# Clean and rebuild
./gradlew clean
./gradlew build --refresh-dependencies
```

Or in Android Studio:
- Build → Clean Project
- Build → Rebuild Project

### App Crashes on Launch
1. Check Logcat for stack trace
2. Verify all permissions in manifest
3. Check database initialization
4. Ensure theme is applied correctly

### Compose Preview Not Working
1. Invalidate Caches: File → Invalidate Caches → Restart
2. Ensure preview annotations are correct:
```kotlin
@Preview(showBackground = true)
@Composable
fun PreviewFunction() {
    BudgetOneTheme {
        YourComposable()
    }
}
```

### SMS Receiver Not Triggering
- Only works on physical device
- Check SMS permissions granted
- Verify receiver registered in manifest
- Check Logcat for errors
- Test with actual bank SMS format

### Dark Mode Issues
- Test both themes:
```kotlin
@Preview(name = "Light Mode", showBackground = true)
@Preview(name = "Dark Mode", uiMode = Configuration.UI_MODE_NIGHT_YES)
@Composable
fun Preview() {
    BudgetOneTheme {
        YourScreen()
    }
}
```

## Next Steps for Development

### Immediate Tasks (High Priority)

1. **Connect ViewModels to UI**
   - File: `HomeScreen.kt`
   - Replace mock data with ViewModel state
   - Implement save/delete operations

2. **Add Loading States**
   - Show CircularProgressIndicator while loading
   - Handle error states gracefully

3. **Implement Charts**
   - Use Vico library
   - Create CategoryPieChart composable
   - Create SpendingBarChart composable

### Medium Priority Tasks

4. **SMS Onboarding UI**
   - Create wizard flow
   - SMS selection screen
   - Pattern preview

5. **Profile Edit**
   - Edit user name
   - Change avatar
   - Currency selection

6. **Category Management**
   - Add/edit/delete categories
   - Custom colors
   - Icon selection

### Low Priority Tasks

7. **Data Export**
   - CSV export
   - JSON backup

8. **Testing**
   - Unit tests
   - UI tests
   - Integration tests

## Resources

### Documentation
- [TECHNICAL_DOCS.md](TECHNICAL_DOCS.md) - Detailed architecture
- [DESIGN_GUIDE.md](DESIGN_GUIDE.md) - UI/UX specifications
- [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md) - What's done and what's left

### External Resources
- [Jetpack Compose Docs](https://developer.android.com/jetpack/compose)
- [Material Design 3](https://m3.material.io/)
- [Room Database](https://developer.android.com/training/data-storage/room)
- [Kotlin Coroutines](https://kotlinlang.org/docs/coroutines-overview.html)

### Useful Commands

```bash
# List connected devices
adb devices

# Clear app data
adb shell pm clear com.budgetone.app

# View app logs
adb logcat | grep BudgetOne

# Install APK
./gradlew installDebug

# Generate release APK
./gradlew assembleRelease

# Run tests
./gradlew test

# Check dependencies
./gradlew dependencies
```

## Getting Help

### If Something Doesn't Work:

1. **Check the documentation** in this repository
2. **Search existing issues** on GitHub
3. **Check Logcat** for error messages
4. **Clean and rebuild** the project
5. **Invalidate caches** and restart Android Studio

### Creating an Issue:

When reporting a problem, include:
- Android Studio version
- Device/Emulator specs
- Android version
- Complete error message from Logcat
- Steps to reproduce

## Code Style Guidelines

### Kotlin
- Follow [Kotlin Coding Conventions](https://kotlinlang.org/docs/coding-conventions.html)
- Use meaningful variable names
- Keep functions small and focused
- Add comments for complex logic

### Compose
- One screen per file
- Extract reusable composables
- Use `remember` for state
- Hoist state when possible

### Naming Conventions
```kotlin
// Files
HomeScreen.kt         // PascalCase
ExpenseViewModel.kt

// Composables
@Composable
fun ExpenseCard()     // PascalCase

// Variables
val totalAmount       // camelCase
val categoryList

// Constants
const val MAX_ITEMS   // UPPER_SNAKE_CASE
```

## Happy Coding! 🚀

You now have everything you need to continue developing BudgetOne. The foundation is solid, and the architecture is clean. Focus on connecting the ViewModels to the UI and implementing the chart visualizations first.

For questions or contributions, feel free to open an issue or submit a pull request!
