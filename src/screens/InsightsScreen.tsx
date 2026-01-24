import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  FlatList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { PieChart, BarChart } from 'react-native-chart-kit';
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  subMonths,
  startOfYear,
  endOfYear,
  format,
  eachDayOfInterval,
  eachMonthOfInterval,
} from 'date-fns';

import { useTheme } from '../context/ThemeContext';
import { useSettings } from '../context/SettingsContext';
import { Card, ListItem, EmptyState } from '../components';
import {
  getExpensesByDateRange,
  getActiveCategories,
  getExpenseSummaryByCategory,
  getDailyExpenseSummary,
} from '../services/database';
import { Expense, Category, CategorySummary } from '../models/types';
import { formatCurrency } from '../constants/currencies';
import { Spacing, FontSizes, BorderRadius } from '../constants/theme';

type FilterPeriod = 'week' | 'month' | '6months' | 'year';

type RootStackParamList = {
  InsightsMain: undefined;
  CategoryDetail: { categoryId: string; startDate: string; endDate: string };
  EditExpense: { expenseId: string };
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const screenWidth = Dimensions.get('window').width;

export function InsightsScreen() {
  const { colors, isDark } = useTheme();
  const { currency } = useSettings();
  const navigation = useNavigation<NavigationProp>();
  const insets = useSafeAreaInsets();

  const [period, setPeriod] = useState<FilterPeriod>('month');
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categorySummaries, setCategorySummaries] = useState<CategorySummary[]>([]);
  const [dailyData, setDailyData] = useState<{ date: string; amount: number }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const getDateRange = useCallback((p: FilterPeriod): { start: Date; end: Date } => {
    const now = new Date();
    switch (p) {
      case 'week':
        return { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) };
      case 'month':
        return { start: startOfMonth(now), end: endOfMonth(now) };
      case '6months':
        return { start: startOfMonth(subMonths(now, 5)), end: endOfMonth(now) };
      case 'year':
        return { start: startOfYear(now), end: endOfYear(now) };
      default:
        return { start: startOfMonth(now), end: endOfMonth(now) };
    }
  }, []);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const { start, end } = getDateRange(period);
      const startStr = start.toISOString();
      const endStr = end.toISOString();

      const [expensesData, categoriesData, summaryData, dailySummary] = await Promise.all([
        getExpensesByDateRange(startStr, endStr),
        getActiveCategories(),
        getExpenseSummaryByCategory(startStr, endStr),
        getDailyExpenseSummary(startStr, endStr),
      ]);

      setExpenses(expensesData);
      setCategories(categoriesData);
      setDailyData(dailySummary);

      // Calculate category summaries with percentages
      const totalAmount = summaryData.reduce((sum, s) => sum + s.totalAmount, 0);
      const summaries: CategorySummary[] = summaryData.map((s) => {
        const category = categoriesData.find((c) => c.id === s.categoryId);
        return {
          categoryId: s.categoryId,
          categoryName: category?.name || 'Unknown',
          categoryColor: category?.color || '#6B7280',
          categoryIcon: category?.icon || 'ellipsis-horizontal-circle',
          totalAmount: s.totalAmount,
          percentage: totalAmount > 0 ? (s.totalAmount / totalAmount) * 100 : 0,
          transactionCount: s.count,
        };
      });

      setCategorySummaries(summaries);
    } catch (error) {
      console.error('Failed to load insights data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [period, getDateRange]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const totalAmount = expenses.reduce((sum, e) => sum + e.amount, 0);

  const getPeriodLabel = () => {
    const { start, end } = getDateRange(period);
    switch (period) {
      case 'week':
        return `${format(start, 'MMM d')} - ${format(end, 'MMM d')}`;
      case 'month':
        return format(start, 'MMMM yyyy');
      case '6months':
        return `${format(start, 'MMM')} - ${format(end, 'MMM yyyy')}`;
      case 'year':
        return format(start, 'yyyy');
      default:
        return '';
    }
  };

  const pieChartData = categorySummaries.slice(0, 6).map((summary) => ({
    name: summary.categoryName,
    amount: summary.totalAmount,
    color: summary.categoryColor,
    legendFontColor: colors.textSecondary,
    legendFontSize: 12,
  }));

  const getBarChartData = () => {
    if (period === 'week' || period === 'month') {
      // Daily data
      const { start, end } = getDateRange(period);
      const days = eachDayOfInterval({ start, end });
      const labels = days.map((d) => format(d, period === 'week' ? 'EEE' : 'd'));
      const data = days.map((d) => {
        const dateStr = format(d, 'yyyy-MM-dd');
        const dayData = dailyData.find((dd) => dd.date === dateStr);
        return dayData?.amount || 0;
      });

      return {
        labels: labels.slice(0, 7), // Limit labels for readability
        datasets: [{ data: data.slice(0, 7) }],
      };
    } else {
      // Monthly data
      const { start, end } = getDateRange(period);
      const months = eachMonthOfInterval({ start, end });
      const labels = months.map((m) => format(m, 'MMM'));
      const data = months.map((m) => {
        const monthStart = startOfMonth(m);
        const monthEnd = endOfMonth(m);
        return dailyData
          .filter((d) => {
            const date = new Date(d.date);
            return date >= monthStart && date <= monthEnd;
          })
          .reduce((sum, d) => sum + d.amount, 0);
      });

      return {
        labels,
        datasets: [{ data }],
      };
    }
  };

  const chartConfig = {
    backgroundColor: colors.surface,
    backgroundGradientFrom: colors.surface,
    backgroundGradientTo: colors.surface,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(79, 70, 229, ${opacity})`,
    labelColor: () => colors.textSecondary,
    style: {
      borderRadius: BorderRadius.lg,
    },
    propsForBackgroundLines: {
      strokeDasharray: '',
      stroke: colors.border,
    },
  };

  const handleCategoryPress = (categoryId: string) => {
    const { start, end } = getDateRange(period);
    navigation.navigate('CategoryDetail', {
      categoryId,
      startDate: start.toISOString(),
      endDate: end.toISOString(),
    });
  };

  const renderFilterButtons = () => (
    <View style={styles.filterContainer}>
      {(['week', 'month', '6months', 'year'] as FilterPeriod[]).map((p) => (
        <TouchableOpacity
          key={p}
          style={[
            styles.filterButton,
            {
              backgroundColor: period === p ? colors.primary : colors.surfaceVariant,
            },
          ]}
          onPress={() => setPeriod(p)}
        >
          <Text
            style={[
              styles.filterButtonText,
              { color: period === p ? '#FFFFFF' : colors.textSecondary },
            ]}
          >
            {p === 'week' ? 'Week' : p === 'month' ? 'Month' : p === '6months' ? '6 Months' : 'Year'}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  if (expenses.length === 0 && !isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Insights</Text>
        </View>
        {renderFilterButtons()}
        <EmptyState
          icon="bar-chart-outline"
          title="No data yet"
          message="Start tracking expenses to see your spending insights here."
        />
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Insights</Text>
        <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
          {getPeriodLabel()}
        </Text>
      </View>

      {renderFilterButtons()}

      {/* Total Summary */}
      <Card style={styles.summaryCard}>
        <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
          Total Spending
        </Text>
        <Text style={[styles.summaryAmount, { color: colors.text }]}>
          {formatCurrency(totalAmount, currency)}
        </Text>
        <Text style={[styles.summarySubtext, { color: colors.textSecondary }]}>
          {expenses.length} transaction{expenses.length !== 1 ? 's' : ''}
        </Text>
      </Card>

      {/* Pie Chart */}
      {pieChartData.length > 0 && (
        <Card style={styles.chartCard}>
          <Text style={[styles.chartTitle, { color: colors.text }]}>By Category</Text>
          <PieChart
            data={pieChartData}
            width={screenWidth - Spacing.md * 4}
            height={200}
            chartConfig={chartConfig}
            accessor="amount"
            backgroundColor="transparent"
            paddingLeft="15"
            absolute
          />
        </Card>
      )}

      {/* Bar Chart */}
      {dailyData.length > 0 && (
        <Card style={styles.chartCard}>
          <Text style={[styles.chartTitle, { color: colors.text }]}>
            {period === 'week' || period === 'month' ? 'Daily Spending' : 'Monthly Spending'}
          </Text>
          <BarChart
            data={getBarChartData()}
            width={screenWidth - Spacing.md * 4}
            height={200}
            chartConfig={chartConfig}
            style={styles.barChart}
            yAxisLabel={currency.symbol}
            yAxisSuffix=""
            fromZero
            showValuesOnTopOfBars
          />
        </Card>
      )}

      {/* Category Breakdown */}
      <Card style={styles.categoryCard}>
        <Text style={[styles.chartTitle, { color: colors.text }]}>Category Breakdown</Text>
        {categorySummaries.map((summary) => (
          <TouchableOpacity
            key={summary.categoryId}
            style={[styles.categoryItem, { borderBottomColor: colors.border }]}
            onPress={() => handleCategoryPress(summary.categoryId)}
          >
            <View style={[styles.categoryIcon, { backgroundColor: summary.categoryColor }]}>
              <Ionicons name={summary.categoryIcon as any} size={18} color="#FFFFFF" />
            </View>
            <View style={styles.categoryInfo}>
              <Text style={[styles.categoryName, { color: colors.text }]}>
                {summary.categoryName}
              </Text>
              <View style={styles.categoryMeta}>
                <Text style={[styles.categoryCount, { color: colors.textSecondary }]}>
                  {summary.transactionCount} transaction{summary.transactionCount !== 1 ? 's' : ''}
                </Text>
              </View>
            </View>
            <View style={styles.categoryRight}>
              <Text style={[styles.categoryAmount, { color: colors.text }]}>
                {formatCurrency(summary.totalAmount, currency)}
              </Text>
              <Text style={[styles.categoryPercent, { color: colors.textSecondary }]}>
                {summary.percentage.toFixed(1)}%
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
          </TouchableOpacity>
        ))}
      </Card>

      {/* Top Transactions */}
      <Card style={{ ...styles.categoryCard, marginBottom: Spacing.xxl }}>
        <Text style={[styles.chartTitle, { color: colors.text }]}>Largest Transactions</Text>
        {expenses
          .sort((a, b) => b.amount - a.amount)
          .slice(0, 5)
          .map((expense) => {
            const category = categories.find((c) => c.id === expense.categoryId);
            return (
              <TouchableOpacity
                key={expense.id}
                style={[styles.categoryItem, { borderBottomColor: colors.border }]}
                onPress={() => navigation.navigate('EditExpense', { expenseId: expense.id })}
              >
                <View
                  style={[
                    styles.categoryIcon,
                    { backgroundColor: category?.color || colors.textTertiary },
                  ]}
                >
                  <Ionicons
                    name={(category?.icon as any) || 'ellipsis-horizontal-circle'}
                    size={18}
                    color="#FFFFFF"
                  />
                </View>
                <View style={styles.categoryInfo}>
                  <Text style={[styles.categoryName, { color: colors.text }]}>
                    {category?.name || 'Unknown'}
                  </Text>
                  <Text style={[styles.categoryCount, { color: colors.textSecondary }]}>
                    {format(new Date(expense.dateTime), 'MMM d, h:mm a')}
                  </Text>
                </View>
                <Text style={[styles.categoryAmount, { color: colors.text }]}>
                  {formatCurrency(expense.amount, currency)}
                </Text>
              </TouchableOpacity>
            );
          })}
      </Card>
    </ScrollView>
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
  headerSubtitle: {
    fontSize: FontSizes.md,
    marginTop: Spacing.xs,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  filterButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  filterButtonText: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
  },
  summaryCard: {
    margin: Spacing.md,
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  summaryLabel: {
    fontSize: FontSizes.md,
  },
  summaryAmount: {
    fontSize: FontSizes.xxxl,
    fontWeight: '700',
    marginVertical: Spacing.xs,
  },
  summarySubtext: {
    fontSize: FontSizes.sm,
  },
  chartCard: {
    margin: Spacing.md,
    padding: Spacing.md,
  },
  chartTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    marginBottom: Spacing.md,
  },
  barChart: {
    borderRadius: BorderRadius.lg,
    marginLeft: -Spacing.md,
  },
  categoryCard: {
    margin: Spacing.md,
    padding: Spacing.md,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  categoryIcon: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: FontSizes.md,
    fontWeight: '500',
  },
  categoryMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  categoryCount: {
    fontSize: FontSizes.sm,
  },
  categoryRight: {
    alignItems: 'flex-end',
    marginRight: Spacing.sm,
  },
  categoryAmount: {
    fontSize: FontSizes.md,
    fontWeight: '600',
  },
  categoryPercent: {
    fontSize: FontSizes.sm,
  },
});
