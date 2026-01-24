import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Platform,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';

import { useTheme } from '../context/ThemeContext';
import { useSettings } from '../context/SettingsContext';
import { ExpenseItem, ExpenseSummaryCard, FloatingButton, EmptyState } from '../components';
import { getTodayExpenses, getActiveCategories } from '../services/database';
import { Expense, Category } from '../models/types';
import { formatCurrency } from '../constants/currencies';
import { Spacing, FontSizes, BorderRadius } from '../constants/theme';

type RootStackParamList = {
  TodayMain: undefined;
  AddExpense: { expense?: Expense };
  EditExpense: { expenseId: string };
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export function TodayScreen() {
  const { colors } = useTheme();
  const { currency } = useSettings();
  const navigation = useNavigation<NavigationProp>();
  const insets = useSafeAreaInsets();

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const loadData = useCallback(async () => {
    try {
      const [expensesData, categoriesData] = await Promise.all([
        getTodayExpenses(),
        getActiveCategories(),
      ]);
      setExpenses(expensesData);
      setCategories(categoriesData);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to load today data:', error);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
    setIsRefreshing(false);
  };

  const getCategoryById = (id: string): Category | null => {
    return categories.find((c) => c.id === id) || null;
  };

  const totalAmount = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const confirmedExpenses = expenses.filter((e) => e.isConfirmed);
  const suggestedExpenses = expenses.filter((e) => !e.isConfirmed);

  const getLastUpdatedText = () => {
    const now = new Date();
    const diffMs = now.getTime() - lastUpdated.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Updated just now';
    if (diffMins < 60) return `Updated ${diffMins}m ago`;
    return `Updated at ${format(lastUpdated, 'h:mm a')}`;
  };

  const handleAddExpense = () => {
    navigation.navigate('AddExpense', {});
  };

  const handleExpensePress = (expense: Expense) => {
    navigation.navigate('EditExpense', { expenseId: expense.id });
  };

  const renderExpenseItem = ({ item }: { item: Expense }) => (
    <ExpenseItem
      expense={item}
      category={getCategoryById(item.categoryId)}
      onPress={() => handleExpensePress(item)}
    />
  );

  const renderHeader = () => (
    <View>
      <ExpenseSummaryCard
        totalAmount={totalAmount}
        transactionCount={expenses.length}
        subtitle={getLastUpdatedText()}
      />

      {suggestedExpenses.length > 0 && (
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="sparkles" size={18} color={colors.warning} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Suggested Expenses
              </Text>
            </View>
            <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
              Tap to confirm or edit
            </Text>
          </View>
          {suggestedExpenses.map((expense) => (
            <ExpenseItem
              key={expense.id}
              expense={expense}
              category={getCategoryById(expense.categoryId)}
              onPress={() => handleExpensePress(expense)}
            />
          ))}
        </View>
      )}

      {confirmedExpenses.length > 0 && (
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Today's Expenses
          </Text>
        </View>
      )}
    </View>
  );

  const renderEmptyComponent = () => {
    if (suggestedExpenses.length > 0) return null;

    return (
      <EmptyState
        icon="wallet-outline"
        title="No expenses today"
        message="Start tracking your spending by adding your first expense."
        action={{
          label: 'Add Expense',
          onPress: handleAddExpense,
        }}
      />
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Today</Text>
        <Text style={[styles.headerDate, { color: colors.textSecondary }]}>
          {format(new Date(), 'EEEE, MMMM d')}
        </Text>
      </View>

      <FlatList
        data={confirmedExpenses}
        renderItem={renderExpenseItem}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyComponent}
        contentContainerStyle={expenses.length === 0 ? styles.emptyContainer : styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      />

      <FloatingButton icon="add" onPress={handleAddExpense} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  headerTitle: {
    fontSize: FontSizes.xxxl,
    fontWeight: '700',
  },
  headerDate: {
    fontSize: FontSizes.md,
    marginTop: Spacing.xs,
  },
  listContent: {
    paddingBottom: 100,
  },
  emptyContainer: {
    flexGrow: 1,
  },
  sectionContainer: {
    marginTop: Spacing.md,
  },
  sectionHeader: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    marginLeft: Spacing.xs,
  },
  sectionSubtitle: {
    fontSize: FontSizes.sm,
    marginTop: 2,
  },
});
