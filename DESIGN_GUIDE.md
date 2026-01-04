# BudgetOne - UI/UX Design Guide

## Design Philosophy

BudgetOne follows an **Apple-inspired design aesthetic** characterized by:
- Clean, minimal interfaces
- Generous whitespace
- Subtle animations
- High-quality typography
- Intuitive interactions
- Attention to detail

## Color System

### Light Mode Palette
```
Primary:              #007AFF (Apple Blue)
Primary Container:    #D6E4FF
Secondary:            #5856D6 (Apple Purple)
Tertiary:             #FF3B30 (Apple Red)
Background:           #FFFBFF (Clean White)
Surface:              #FFFBFF
Surface Variant:      #E1E2EC
```

### Dark Mode Palette
```
Primary:              #0A84FF (Bright Blue)
Primary Container:    #004A77
Secondary:            #5E5CE6 (Vibrant Purple)
Tertiary:             #FF453A (Bright Red)
Background:           #000000 (True Black - OLED)
Surface:              #1C1B1F
Surface Variant:      #44474F
```

### Category Colors
```
Food & Dining:        #FF6B6B (Warm Red)
Transportation:       #4ECDC4 (Teal)
Shopping:             #45B7D1 (Sky Blue)
Entertainment:        #FFA07A (Light Salmon)
Bills & Utilities:    #98D8C8 (Mint)
Health:               #F7DC6F (Yellow)
Education:            #BB8FCE (Lavender)
Other:                #95A5A6 (Gray)
```

## Typography Scale

### Display
- **Display Large**: 57sp, Bold
- **Display Medium**: 45sp, Bold
- **Display Small**: 36sp, Bold

### Headline
- **Headline Large**: 32sp, SemiBold
- **Headline Medium**: 28sp, SemiBold
- **Headline Small**: 24sp, SemiBold

### Title
- **Title Large**: 22sp, SemiBold
- **Title Medium**: 16sp, SemiBold
- **Title Small**: 14sp, Medium

### Body
- **Body Large**: 16sp, Normal
- **Body Medium**: 14sp, Normal
- **Body Small**: 12sp, Normal

### Label
- **Label Large**: 14sp, Medium
- **Label Medium**: 12sp, Medium
- **Label Small**: 11sp, Medium

## Spacing System

Following an 8dp grid:
```
XXS: 4dp
XS:  8dp
S:   12dp
M:   16dp
L:   24dp
XL:  32dp
XXL: 48dp
```

## Components

### Cards
```
Corner Radius: 16-20dp
Elevation: 2dp (light), 4dp (emphasized)
Padding: 16-24dp
Color: Surface Variant
```

### Buttons
```
Primary:
  - Filled
  - Corner Radius: 12dp
  - Padding: 12dp horizontal, 16dp vertical

Secondary:
  - Outlined
  - Corner Radius: 12dp
  - Border Width: 1dp

Text:
  - No background
  - Medium weight text
```

### Input Fields
```
Style: Outlined
Corner Radius: 12dp
Border Width: 1dp
Label: Floating
Height: 56dp
Focus Border: 2dp
```

### Bottom Sheets
```
Corner Radius: 28dp (top corners)
Handle: 32dp wide, 4dp tall, centered
Padding: 24dp
Background: Surface
```

### FAB (Floating Action Button)
```
Shape: Circle
Size: 56dp diameter
Elevation: 6dp
Icon Size: 24dp
Color: Primary
Position: Bottom-right, 16dp from edges
```

### Bottom Navigation
```
Height: 80dp
Icon Size: 24dp
Label: 12sp
Selected: Primary color
Unselected: OnSurface Variant
Active Indicator: Pill shape
```

## Screen Layouts

### Home Screen
```
┌─────────────────────────────┐
│  Today's Expenses           │ ← TopAppBar
│  Monday, January 1          │
├─────────────────────────────┤
│ ┌─────────────────────────┐ │
│ │   Total Today           │ │
│ │      ₹0.00              │ │ ← Total Card
│ └─────────────────────────┘ │
│                             │
│ ┌─────────────────────────┐ │
│ │ [Icon] Food Title       │ │
│ │ Food & Dining • 10:30   │ │ ← Expense Item
│ │                  ₹250   │ │
│ └─────────────────────────┘ │
│                             │
│ ┌─────────────────────────┐ │
│ │ [Icon] Transport        │ │
│ │ Transport • 9:15        │ │
│ │                  ₹100   │ │
│ └─────────────────────────┘ │
│                             │
│                        [+]  │ ← FAB
├─────────────────────────────┤
│ [Home] [Analytics] [Settings]│ ← Bottom Nav
└─────────────────────────────┘
```

### Analytics Screen
```
┌─────────────────────────────┐
│  Analytics                  │ ← TopAppBar
├─────────────────────────────┤
│ [Day][Week][Month][Year]    │ ← Filter Chips
│                             │
│ ┌─────────────────────────┐ │
│ │   Total Spent           │ │
│ │      ₹0.00              │ │ ← Total Card
│ └─────────────────────────┘ │
│                             │
│  Category Breakdown         │
│ ┌─────────────────────────┐ │
│ │                         │ │
│ │    [Pie Chart]          │ │ ← Chart
│ │                         │ │
│ └─────────────────────────┘ │
│                             │
│ ┌─────────────────────────┐ │
│ │ [●] Food & Dining       │ │
│ │ 0% of total      ₹0.00  │ │ ← Category Item
│ └─────────────────────────┘ │
│                             │
│  Spending Trends            │
│ ┌─────────────────────────┐ │
│ │    [Bar Chart]          │ │
│ └─────────────────────────┘ │
├─────────────────────────────┤
│ [Home] [Analytics] [Settings]│
└─────────────────────────────┘
```

### Settings Screen
```
┌─────────────────────────────┐
│  Settings                   │ ← TopAppBar
├─────────────────────────────┤
│ ┌─────────────────────────┐ │
│ │ [Avatar] User Name      │ │
│ │ Tap to edit profile  [>]│ │ ← Profile Card
│ └─────────────────────────┘ │
│                             │
│  SMART FEATURES             │ ← Section Header
│ ┌─────────────────────────┐ │
│ │ [📱] SMS Onboarding     │ │
│ │ Register bank SMS...  [>]│ │
│ └─────────────────────────┘ │
│ ┌─────────────────────────┐ │
│ │ [🔔] Smart Notifications│ │
│ │ Get alerts for...     [>]│ │
│ └─────────────────────────┘ │
│                             │
│  APPEARANCE                 │
│ ┌─────────────────────────┐ │
│ │ [🎨] Theme              │ │
│ │ Light, Dark, System   [>]│ │
│ └─────────────────────────┘ │
│ ┌─────────────────────────┐ │
│ │ [₹] Currency            │ │
│ │ ₹ INR                 [>]│ │
│ └─────────────────────────┘ │
├─────────────────────────────┤
│ [Home] [Analytics] [Settings]│
└─────────────────────────────┘
```

### Add Expense Bottom Sheet
```
┌─────────────────────────────┐
│    ̄ ̄ ̄                      │ ← Handle
│                             │
│  Add Expense                │
│                             │
│ ┌─────────────────────────┐ │
│ │ Title                   │ │
│ │                         │ │ ← Text Field
│ └─────────────────────────┘ │
│                             │
│ ┌─────────────────────────┐ │
│ │ ₹ Amount                │ │
│ │                         │ │
│ └─────────────────────────┘ │
│                             │
│ ┌─────────────────────────┐ │
│ │ Select Category       ▼ │ │
│ └─────────────────────────┘ │
│                             │
│ ┌─────────────────────────┐ │
│ │ Notes (Optional)        │ │
│ │                         │ │
│ │                         │ │
│ └─────────────────────────┘ │
│                             │
│ ┌─────────────────────────┐ │
│ │    Save Expense         │ │ ← Button
│ └─────────────────────────┘ │
│                             │
└─────────────────────────────┘
```

## Animations

### Micro-interactions
- **Button Press**: Scale 0.95, duration 100ms
- **FAB Rotation**: 45° on press, 0° on release
- **Card Elevation**: Increase on press
- **Ripple Effect**: Material ripple on all interactive elements

### Transitions
- **Screen Navigation**: Slide in/out, 300ms
- **Bottom Sheet**: Slide up, 250ms with spring animation
- **List Items**: Fade in with stagger (50ms delay each)
- **Charts**: Draw animation, 500ms

### Loading States
- **Shimmer Effect**: Gradient sweep for skeleton screens
- **Progress Indicators**: Circular, indeterminate
- **Pull to Refresh**: Material-style refresh indicator

## Icons

### Icon Style
- Material Icons Extended
- 24dp default size
- Filled for selected states
- Outlined for unselected states

### Category Icons
```
Food & Dining:        restaurant
Transportation:       directions_car
Shopping:             shopping_bag
Entertainment:        movie
Bills & Utilities:    receipt_long
Health:               health_and_safety
Education:            school
Other:                category
```

### Navigation Icons
```
Home:                 home
Analytics:            analytics
Settings:             settings
Add:                  add
Edit:                 edit
Delete:               delete
```

## Accessibility

### Touch Targets
- Minimum size: 48dp x 48dp
- Spacing between: 8dp minimum

### Contrast Ratios
- Normal text: 4.5:1 minimum
- Large text: 3:1 minimum
- Icons: 3:1 minimum

### Text Scaling
- Support up to 200% text size
- Responsive layouts
- No text truncation at larger sizes

### Screen Readers
- All interactive elements have contentDescription
- Semantic HTML structure
- Announce state changes

## Dark Mode Considerations

### Color Adjustments
- Reduce saturation of bright colors
- Use darker surfaces (not pure black for cards)
- Increase contrast for text
- Dim images slightly

### OLED Optimization
- True black (#000000) for background
- Reduce always-on pixels
- Dark gray for surfaces

### Elevation in Dark Mode
- Use surface tint instead of shadows
- Lighter surfaces = higher elevation
- Surface at level 0: #1C1B1F
- Surface at level 1: #26252A (slightly lighter)

## Responsive Design

### Compact (Phones)
- Single column layout
- Bottom navigation
- Full-width cards
- Stack elements vertically

### Medium (Tablets)
- Two-column layout where applicable
- Navigation rail option
- Wider cards with max-width
- Side-by-side elements

### Expanded (Foldables)
- Three-column layout
- Permanent drawer navigation
- Master-detail pattern
- Utilize extra space for charts

## Best Practices

### Do's
✓ Use system fonts for consistency
✓ Maintain 8dp spacing grid
✓ Keep animations subtle (200-300ms)
✓ Use Material elevation system
✓ Test in both light and dark modes
✓ Ensure 48dp minimum touch targets
✓ Use semantic colors (error, success, etc.)
✓ Provide feedback for all interactions

### Don'ts
✗ Don't use more than 3 font weights per screen
✗ Don't animate longer than 500ms
✗ Don't use pure black in light mode
✗ Don't use pure white in dark mode
✗ Don't center-align body text
✗ Don't use images without alt text
✗ Don't ignore safe area insets

## Design Tokens

```kotlin
// Spacing
val SpacingXXS = 4.dp
val SpacingXS = 8.dp
val SpacingS = 12.dp
val SpacingM = 16.dp
val SpacingL = 24.dp
val SpacingXL = 32.dp
val SpacingXXL = 48.dp

// Corner Radius
val CornerRadiusS = 12.dp
val CornerRadiusM = 16.dp
val CornerRadiusL = 20.dp
val CornerRadiusXL = 28.dp

// Elevation
val ElevationNone = 0.dp
val ElevationLow = 2.dp
val ElevationMedium = 4.dp
val ElevationHigh = 6.dp
```

## Implementation Notes

All design specifications are implemented using:
- Jetpack Compose for declarative UI
- Material 3 theming system
- Custom color schemes
- Typography scales
- Shape theming

The design is optimized for:
- Performance (60fps minimum)
- Accessibility (WCAG AA compliance)
- Scalability (multiple screen sizes)
- Maintainability (design system)
