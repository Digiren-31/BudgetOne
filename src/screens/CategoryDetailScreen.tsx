import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useTheme } from '../context/ThemeContext';
import { useSettings } from '../context/SettingsContext';
import { ExpenseItem, ExpenseSummaryCard, EmptyState } from '../components';
import { getExpensesByDateRange, getCategoryById } from '../services/database';
import { Expense, Category } from '../models/types';
import { formatCurrency } from '../constants/currencies';
import { format } from 'date-fns';
import { Spacing, FontSizes } from '../constants/theme';

type RootStackParamList = {
  CategoryDetail: { categoryId: string; startDate: string; endDate: string };
  EditExpense: { expenseId: string };
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type CategoryDetailRouteProp = RouteProp<RootStackParamList, 'CategoryDetail'>;

export function CategoryDetailScreen() {
  const { colors } = useTheme();
  const { currency } = useSettings();
  const route = useRoute<CategoryDetailRouteProp>();
  const navigation = useNavigation<NavigationProp>();

  const { categoryId, startDate, endDate } = route.params;

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [category, setCategory] = useState<Category | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [categoryId, startDate, endDate]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [allExpenses, categoryData] = await Promise.all([
        getExpensesByDateRange(startDate, endDate),
        getCategoryById(categoryId),
      ]);

      const filteredExpenses = allExpenses.filter((e) => e.categoryId === categoryId);
      setExpenses(filteredExpenses);
      setCategory(categoryData);
    } catch (error) {
      console.error('Failed to load category details:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const totalAmount = expenses.reduce((sum, e) => sum + e.amount, 0);

  const handleExpensePress = (expense: Expense) => {
    navigation.navigate('EditExpense', { expenseId: expense.id });
  };

  const renderExpenseItem = ({ item }: { item: Expense }) => (
    <ExpenseItem
      expense={item}
      category={category}
      onPress={() => handleExpensePress(item)}
    />
  );

  const renderHeader = () => (
    <ExpenseSummaryCard
      totalAmount={totalAmount}
      transactionCount={expenses.length}
      subtitle={`${format(new Date(startDate), 'MMM d')} - ${format(new Date(endDate), 'MMM d, yyyy')}`}
    />
  );

  if (expenses.length === 0 && !isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <EmptyState
          icon="receipt-outline"
          title="No transactions"
          message={`No ${category?.name || ''} expenses in this period.`}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={expenses}
        renderItem={renderExpenseItem}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingBottom: Spacing.xl,
  },
});
