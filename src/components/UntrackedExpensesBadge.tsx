import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { BorderRadius, FontSizes, Spacing } from '../constants/theme';

interface UntrackedExpensesBadgeProps {
  count: number;
  onPress: () => void;
}

/**
 * Badge icon component for untracked expenses
 * Shows a notification-style icon with a count badge
 */
export function UntrackedExpensesBadge({ count, onPress }: UntrackedExpensesBadgeProps) {
  const { colors } = useTheme();

  if (count === 0) {
    return null;
  }

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <Ionicons name="receipt-outline" size={24} color={colors.text} />
      <View style={[styles.badge, { backgroundColor: colors.error }]}>
        <Text style={styles.badgeText}>{count > 99 ? '99+' : count}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    padding: Spacing.xs,
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: FontSizes.xs,
    fontWeight: '700',
  },
});
