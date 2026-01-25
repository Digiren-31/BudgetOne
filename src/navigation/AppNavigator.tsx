import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../context/ThemeContext';
import { useOnboarding } from '../context/OnboardingContext';
import {
  TodayScreen,
  InsightsScreen,
  SettingsScreen,
  AddExpenseScreen,
  EditExpenseScreen,
  ManageCategoriesScreen,
  SmsOnboardingScreen,
  AboutScreen,
  EditProfileScreen,
  SelectCurrencyScreen,
  CategoryDetailScreen,
  NotificationSettingsScreen,
  UntrackedExpensesScreen,
} from '../screens';
import {
  WelcomeScreen,
  SmsSetupScreen,
  PermissionsScreen,
} from '../screens/onboarding';

// Type definitions for navigation

// Onboarding stack
export type OnboardingStackParamList = {
  Welcome: undefined;
  SmsSetup: undefined;
  Permissions: undefined;
};

// Main app stack
export type RootStackParamList = {
  MainTabs: undefined;
  AddExpense: {
    prefillAmount?: number;
    prefillDateTime?: string;
    prefillCategoryId?: string;
    suggestionId?: string;
  };
  EditExpense: { expenseId: string };
  ManageCategories: undefined;
  SmsOnboarding: undefined;
  NotificationSettings: undefined;
  UntrackedExpenses: undefined;
  About: undefined;
  EditProfile: undefined;
  SelectCurrency: undefined;
  CategoryDetail: { categoryId: string; startDate: string; endDate: string };
};

export type TabParamList = {
  Today: undefined;
  Insights: undefined;
  Settings: undefined;
};

const OnboardingStack = createNativeStackNavigator<OnboardingStackParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

// Onboarding Navigator
export function OnboardingNavigator() {
  const { colors } = useTheme();
  const { currentStep } = useOnboarding();

  const screenOptions = {
    headerShown: false,
    contentStyle: {
      backgroundColor: colors.background,
    },
    animation: 'slide_from_right' as const,
  };

  // Determine initial route based on current step
  const getInitialRoute = (): keyof OnboardingStackParamList => {
    switch (currentStep) {
      case 'sms_setup':
        return 'SmsSetup';
      case 'permissions':
        return 'Permissions';
      default:
        return 'Welcome';
    }
  };

  return (
    <OnboardingStack.Navigator
      initialRouteName={getInitialRoute()}
      screenOptions={screenOptions}
    >
      <OnboardingStack.Screen name="Welcome" component={WelcomeScreen} />
      <OnboardingStack.Screen name="SmsSetup" component={SmsSetupScreen} />
      <OnboardingStack.Screen name="Permissions" component={PermissionsScreen} />
    </OnboardingStack.Navigator>
  );
}

function TabNavigator() {
  const { colors } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'Today') {
            iconName = focused ? 'today' : 'today-outline';
          } else if (route.name === 'Insights') {
            iconName = focused ? 'bar-chart' : 'bar-chart-outline';
          } else {
            iconName = focused ? 'settings' : 'settings-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTintColor: colors.text,
        headerShadowVisible: false,
        headerShown: false,
      })}
    >
      <Tab.Screen
        name="Today"
        component={TodayScreen}
        options={{ tabBarLabel: 'Today' }}
      />
      <Tab.Screen
        name="Insights"
        component={InsightsScreen}
        options={{ tabBarLabel: 'Insights' }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ tabBarLabel: 'Settings' }}
      />
    </Tab.Navigator>
  );
}

export function AppNavigator() {
  const { colors } = useTheme();

  const screenOptions = {
    headerStyle: {
      backgroundColor: colors.background,
    },
    headerTintColor: colors.text,
    headerShadowVisible: false,
    contentStyle: {
      backgroundColor: colors.background,
    },
  };

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="MainTabs"
        component={TabNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="AddExpense"
        component={AddExpenseScreen}
        options={{
          title: 'Add Expense',
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="EditExpense"
        component={EditExpenseScreen}
        options={{
          title: 'Edit Expense',
        }}
      />
      <Stack.Screen
        name="ManageCategories"
        component={ManageCategoriesScreen}
        options={{
          title: 'Manage Categories',
        }}
      />
      <Stack.Screen
        name="SmsOnboarding"
        component={SmsOnboardingScreen}
        options={{
          title: 'SMS Tracking',
        }}
      />
      <Stack.Screen
        name="NotificationSettings"
        component={NotificationSettingsScreen}
        options={{
          title: 'Notification Settings',
        }}
      />
      <Stack.Screen
        name="UntrackedExpenses"
        component={UntrackedExpensesScreen}
        options={{
          title: 'Untracked Expenses',
        }}
      />
      <Stack.Screen
        name="About"
        component={AboutScreen}
        options={{
          title: 'About',
        }}
      />
      <Stack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={{
          title: 'Edit Profile',
        }}
      />
      <Stack.Screen
        name="SelectCurrency"
        component={SelectCurrencyScreen}
        options={{
          title: 'Select Currency',
        }}
      />
      <Stack.Screen
        name="CategoryDetail"
        component={CategoryDetailScreen}
        options={({ route }) => ({
          title: 'Category Details',
        })}
      />
    </Stack.Navigator>
  );
}
