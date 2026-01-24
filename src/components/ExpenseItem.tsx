import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useSettings } from '../context/SettingsContext';
import { Expense, Category } from '../models/types';
import { formatCurrency } from '../constants/currencies';
import { format } from 'date-fns';
import { BorderRadius, FontSizes, Spacing } from '../constants/theme';

interface ExpenseItemProps {
  expense: Expense;
  category: Category | null;
  onPress: () => void;
}

export function ExpenseItem({ expense, category, onPress }: ExpenseItemProps) {
  const { colors } = useTheme();
  const { currency } = useSettings();

  const timeString = format(new Date(expense.dateTime), 'h:mm a');
  const amountString = formatCurrency(expense.amount, currency);

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, { backgroundColor: category?.color || colors.textTertiary }]}>
        <Ionicons
          name={(category?.icon as any) || 'ellipsis-horizontal-circle'}
          size={20}
          color="#FFFFFF"
        />
      </View>

      <View style={styles.content}>
        <View style={styles.topRow}>
          <Text style={[styles.category, { color: colors.text }]}>
            {category?.name || 'Unknown'}
          </Text>
          <Text style={[styles.amount, { color: colors.text }]}>{amountString}</Text>
        </View>

        <View style={styles.bottomRow}>
          <Text style={[styles.time, { color: colors.textSecondary }]}>{timeString}</Text>
          {expense.remark && (
            <Text
              style={[styles.remark, { color: colors.textSecondary }]}
              numberOfLines={1}
            >
              {expense.remark}
            </Text>
          )}
        </View>

        {!expense.isConfirmed && (
          <View style={[styles.suggestionBadge, { backgroundColor: colors.warning + '20' }]}>
            <Ionicons name="sparkles" size={12} color={colors.warning} />
            <Text style={[styles.suggestionText, { color: colors.warning }]}>
              Auto-detected
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

interface ExpenseSummaryCardProps {
  totalAmount: number;
  transactionCount: number;
  subtitle?: string;
}

export function ExpenseSummaryCard({ totalAmount, transactionCount, subtitle }: ExpenseSummaryCardProps) {
  const { colors } = useTheme();
  const { currency } = useSettings();

  const formattedTotal = formatCurrency(totalAmount, currency);

  return (
    <View style={[styles.summaryCard, { backgroundColor: colors.primary }]}>
      <Text style={styles.summaryLabel}>Total Spent</Text>
      <Text style={styles.summaryAmount}>{formattedTotal}</Text>
      <Text style={styles.summarySubtext}>
        {transactionCount} transaction{transactionCount !== 1 ? 's' : ''}
        {subtitle ? ` • ${subtitle}` : ''}
      </Text>
    </View>
  );
}

interface CategoryChipProps {
  category: Category;
  isSelected: boolean;
  onPress: () => void;
}

export function CategoryChip({ category, isSelected, onPress }: CategoryChipProps) {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      style={[
        styles.categoryChip,
        {
          backgroundColor: isSelected ? category.color : colors.surfaceVariant,
          borderColor: isSelected ? category.color : colors.border,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Ionicons
        name={category.icon as any}
        size={16}
        color={isSelected ? '#FFFFFF' : colors.text}
      />
      <Text
        style={[
          styles.categoryChipText,
          { color: isSelected ? '#FFFFFF' : colors.text },
        ]}
      >
        {category.name}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    marginHorizontal: Spacing.md,
    marginVertical: Spacing.xs,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  content: {
    flex: 1,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  category: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
  },
  amount: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  time: {
    fontSize: FontSizes.sm,
  },
  remark: {
    fontSize: FontSizes.sm,
    marginLeft: Spacing.sm,
    flex: 1,
  },
  suggestionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  suggestionText: {
    fontSize: FontSizes.xs,
    fontWeight: '600',
    marginLeft: 4,
  },
  summaryCard: {
    marginHorizontal: Spacing.md,
    marginVertical: Spacing.sm,
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
  },
  summaryLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: FontSizes.md,
    fontWeight: '500',
  },
  summaryAmount: {
    color: '#FFFFFF',
    fontSize: FontSizes.xxxl,
    fontWeight: '700',
    marginVertical: Spacing.xs,
  },
  summarySubtext: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: FontSizes.sm,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    marginRight: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  categoryChipText: {
    fontSize: FontSizes.sm,
    fontWeight: '500',
    marginLeft: Spacing.xs,
  },
});
