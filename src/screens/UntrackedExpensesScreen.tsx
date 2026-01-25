import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';

import { useTheme } from '../context/ThemeContext';
import { useSettings } from '../context/SettingsContext';
import { Card, EmptyState } from '../components';
import { getPendingSuggestions, updateSuggestionStatus } from '../services/database';
import { ExpenseSuggestion } from '../models/types';
import { formatCurrency } from '../constants/currencies';
import { Spacing, FontSizes, BorderRadius } from '../constants/theme';
import { RootStackParamList } from '../navigation/AppNavigator';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export function UntrackedExpensesScreen() {
  const { colors } = useTheme();
  const { currency } = useSettings();
  const navigation = useNavigation<NavigationProp>();
  const insets = useSafeAreaInsets();

  const [suggestions, setSuggestions] = useState<ExpenseSuggestion[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const data = await getPendingSuggestions();
      setSuggestions(data);
    } catch (error) {
      console.error('Failed to load untracked expenses:', error);
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

  const handleTrack = (suggestion: ExpenseSuggestion) => {
    navigation.navigate('AddExpense', {
      prefillAmount: suggestion.amount,
      prefillDateTime: suggestion.dateTime,
      suggestionId: suggestion.id,
    });
  };

  const handleSuspend = async (suggestion: ExpenseSuggestion) => {
    Alert.alert(
      'Suspend Expense',
      `Are you sure you want to suspend this ₹${suggestion.amount.toFixed(2)} expense? It will be dismissed and won't appear again.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Suspend',
          style: 'destructive',
          onPress: async () => {
            try {
              await updateSuggestionStatus(suggestion.id, 'dismissed');
              await loadData();
            } catch (error) {
              console.error('Failed to suspend expense:', error);
              Alert.alert('Error', 'Failed to suspend expense. Please try again.');
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: ExpenseSuggestion }) => {
    const formattedAmount = formatCurrency(item.amount, currency);
    const formattedDate = format(new Date(item.dateTime), 'dd MMM, h:mm a');

    return (
      <Card style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.amountContainer}>
            <Text style={[styles.amount, { color: colors.text }]}>{formattedAmount}</Text>
            {item.merchant && (
              <Text style={[styles.merchant, { color: colors.textSecondary }]}>
                {item.merchant}
              </Text>
            )}
          </View>
          <Text style={[styles.date, { color: colors.textTertiary }]}>{formattedDate}</Text>
        </View>

        <View style={[styles.smsPreview, { backgroundColor: colors.background }]}>
          <Ionicons name="chatbubble-outline" size={14} color={colors.textTertiary} />
          <Text
            style={[styles.smsText, { color: colors.textSecondary }]}
            numberOfLines={2}
          >
            {item.originalSmsText}
          </Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.suspendButton, { borderColor: colors.border }]}
            onPress={() => handleSuspend(item)}
          >
            <Ionicons name="close-circle-outline" size={18} color={colors.error} />
            <Text style={[styles.actionText, { color: colors.error }]}>Suspend</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.trackButton, { backgroundColor: colors.primary }]}
            onPress={() => handleTrack(item)}
          >
            <Ionicons name="add-circle-outline" size={18} color="#FFFFFF" />
            <Text style={[styles.actionText, { color: '#FFFFFF' }]}>Track</Text>
          </TouchableOpacity>
        </View>
      </Card>
    );
  };

  const renderEmptyComponent = () => (
    <EmptyState
      icon="checkmark-circle-outline"
      title="All caught up!"
      message="No untracked expenses. All detected transactions have been processed."
    />
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={suggestions}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={renderEmptyComponent}
        contentContainerStyle={suggestions.length === 0 ? styles.emptyContainer : styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    padding: Spacing.md,
    paddingBottom: 100,
  },
  emptyContainer: {
    flexGrow: 1,
  },
  card: {
    marginBottom: Spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  amountContainer: {
    flex: 1,
  },
  amount: {
    fontSize: FontSizes.xxl,
    fontWeight: '700',
  },
  merchant: {
    fontSize: FontSizes.md,
    marginTop: 2,
  },
  date: {
    fontSize: FontSizes.sm,
  },
  smsPreview: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    gap: Spacing.xs,
  },
  smsText: {
    flex: 1,
    fontSize: FontSizes.sm,
    lineHeight: 18,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
  },
  suspendButton: {
    borderWidth: 1,
  },
  trackButton: {},
  actionText: {
    fontSize: FontSizes.md,
    fontWeight: '600',
  },
});
