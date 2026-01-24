import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';

import { useTheme } from '../context/ThemeContext';
import { useSettings } from '../context/SettingsContext';
import { Card, CategoryChip } from '../components';
import { getExpenseById, updateExpense, deleteExpense, getActiveCategories } from '../services/database';
import { Expense, Category } from '../models/types';
import { formatCurrency } from '../constants/currencies';
import { Spacing, FontSizes, BorderRadius } from '../constants/theme';

type RootStackParamList = {
  EditExpense: { expenseId: string };
  TodayMain: undefined;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type EditExpenseRouteProp = RouteProp<RootStackParamList, 'EditExpense'>;

export function EditExpenseScreen() {
  const { colors } = useTheme();
  const { currency } = useSettings();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<EditExpenseRouteProp>();

  const [expense, setExpense] = useState<Expense | null>(null);
  const [amount, setAmount] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [remark, setRemark] = useState('');
  const [dateTime, setDateTime] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadData();
  }, [route.params.expenseId]);

  const loadData = async () => {
    try {
      const [expenseData, catsData] = await Promise.all([
        getExpenseById(route.params.expenseId),
        getActiveCategories(),
      ]);

      setCategories(catsData);

      if (expenseData) {
        setExpense(expenseData);
        setAmount(expenseData.amount.toString());
        setSelectedCategory(expenseData.categoryId);
        setRemark(expenseData.remark || '');
        setDateTime(new Date(expenseData.dateTime));
      } else {
        Alert.alert('Error', 'Expense not found');
        navigation.goBack();
      }
    } catch (error) {
      console.error('Failed to load expense:', error);
      Alert.alert('Error', 'Failed to load expense');
      navigation.goBack();
    }
  };

  const handleSave = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid expense amount.');
      return;
    }

    if (!selectedCategory) {
      Alert.alert('Select Category', 'Please select a category for this expense.');
      return;
    }

    setIsLoading(true);
    try {
      await updateExpense(route.params.expenseId, {
        amount: parseFloat(amount),
        categoryId: selectedCategory,
        remark: remark.trim() || null,
        dateTime: dateTime.toISOString(),
        isConfirmed: true, // Mark as confirmed if it was a suggestion
      });
      navigation.goBack();
    } catch (error) {
      console.error('Failed to update expense:', error);
      Alert.alert('Error', 'Failed to update expense. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Expense',
      'Are you sure you want to delete this expense? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            try {
              await deleteExpense(route.params.expenseId);
              navigation.goBack();
            } catch (error) {
              console.error('Failed to delete expense:', error);
              Alert.alert('Error', 'Failed to delete expense.');
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const newDateTime = new Date(dateTime);
      newDateTime.setFullYear(selectedDate.getFullYear());
      newDateTime.setMonth(selectedDate.getMonth());
      newDateTime.setDate(selectedDate.getDate());
      setDateTime(newDateTime);
    }
  };

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(false);
    if (selectedTime) {
      const newDateTime = new Date(dateTime);
      newDateTime.setHours(selectedTime.getHours());
      newDateTime.setMinutes(selectedTime.getMinutes());
      setDateTime(newDateTime);
    }
  };

  if (!expense) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text }}>Loading...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Auto-detected badge */}
        {!expense.isConfirmed && (
          <View style={[styles.suggestionBanner, { backgroundColor: colors.warning + '20' }]}>
            <Ionicons name="sparkles" size={20} color={colors.warning} />
            <View style={styles.suggestionContent}>
              <Text style={[styles.suggestionTitle, { color: colors.warning }]}>
                Auto-detected Expense
              </Text>
              <Text style={[styles.suggestionText, { color: colors.textSecondary }]}>
                Review and confirm the details below
              </Text>
            </View>
          </View>
        )}

        {/* Amount Input */}
        <Card style={styles.amountCard}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Amount</Text>
          <View style={styles.amountRow}>
            <Text style={[styles.currencySymbol, { color: colors.primary }]}>
              {currency.symbol}
            </Text>
            <TextInput
              style={[styles.amountInput, { color: colors.text }]}
              placeholder="0.00"
              placeholderTextColor={colors.textTertiary}
              keyboardType="decimal-pad"
              value={amount}
              onChangeText={setAmount}
            />
          </View>
        </Card>

        {/* Category Selection */}
        <Card style={styles.section}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Category</Text>
          <View style={styles.categoryGrid}>
            {categories.map((category) => (
              <CategoryChip
                key={category.id}
                category={category}
                isSelected={selectedCategory === category.id}
                onPress={() => setSelectedCategory(category.id)}
              />
            ))}
          </View>
        </Card>

        {/* Date & Time */}
        <Card style={styles.section}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Date & Time</Text>
          <View style={styles.dateTimeRow}>
            <TouchableOpacity
              style={[styles.dateTimeButton, { backgroundColor: colors.surfaceVariant }]}
              onPress={() => setShowDatePicker(true)}
            >
              <Ionicons name="calendar" size={20} color={colors.primary} />
              <Text style={[styles.dateTimeText, { color: colors.text }]}>
                {format(dateTime, 'EEE, MMM d, yyyy')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.dateTimeButton, { backgroundColor: colors.surfaceVariant }]}
              onPress={() => setShowTimePicker(true)}
            >
              <Ionicons name="time" size={20} color={colors.primary} />
              <Text style={[styles.dateTimeText, { color: colors.text }]}>
                {format(dateTime, 'h:mm a')}
              </Text>
            </TouchableOpacity>
          </View>
        </Card>

        {/* Remark */}
        <Card style={styles.section}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>
            Remark (Optional)
          </Text>
          <TextInput
            style={[
              styles.remarkInput,
              { color: colors.text, backgroundColor: colors.surfaceVariant },
            ]}
            placeholder="Add a note..."
            placeholderTextColor={colors.textTertiary}
            value={remark}
            onChangeText={setRemark}
            multiline
            numberOfLines={3}
          />
        </Card>

        {/* Original SMS (if from SMS) */}
        {expense.originalSmsText && (
          <Card style={styles.section}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Original SMS</Text>
            <Text style={[styles.originalSms, { color: colors.textSecondary }]}>
              {expense.originalSmsText}
            </Text>
          </Card>
        )}

        {/* Action Buttons */}
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.deleteButton, { borderColor: colors.error }]}
            onPress={handleDelete}
            disabled={isDeleting}
          >
            <Ionicons name="trash" size={20} color={colors.error} />
            <Text style={[styles.deleteButtonText, { color: colors.error }]}>
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.saveButton,
              { backgroundColor: colors.primary },
              isLoading && styles.saveButtonDisabled,
            ]}
            onPress={handleSave}
            disabled={isLoading}
          >
            <Ionicons name="checkmark" size={20} color="#FFFFFF" />
            <Text style={styles.saveButtonText}>
              {isLoading ? 'Saving...' : expense.isConfirmed ? 'Save Changes' : 'Confirm'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {showDatePicker && (
        <DateTimePicker
          value={dateTime}
          mode="date"
          display="default"
          onChange={handleDateChange}
          maximumDate={new Date()}
        />
      )}

      {showTimePicker && (
        <DateTimePicker
          value={dateTime}
          mode="time"
          display="default"
          onChange={handleTimeChange}
        />
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  suggestionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
  },
  suggestionContent: {
    marginLeft: Spacing.sm,
  },
  suggestionTitle: {
    fontSize: FontSizes.md,
    fontWeight: '600',
  },
  suggestionText: {
    fontSize: FontSizes.sm,
    marginTop: 2,
  },
  amountCard: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  label: {
    fontSize: FontSizes.md,
    fontWeight: '500',
    marginBottom: Spacing.sm,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currencySymbol: {
    fontSize: FontSizes.xxxl,
    fontWeight: '700',
    marginRight: Spacing.sm,
  },
  amountInput: {
    fontSize: 48,
    fontWeight: '700',
    minWidth: 150,
    textAlign: 'center',
  },
  section: {
    marginTop: Spacing.md,
    padding: Spacing.md,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dateTimeRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  dateTimeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  dateTimeText: {
    fontSize: FontSizes.md,
    marginLeft: Spacing.sm,
  },
  remarkInput: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    fontSize: FontSizes.md,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  originalSms: {
    fontSize: FontSizes.sm,
    fontStyle: 'italic',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.xl,
  },
  deleteButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
  },
  deleteButtonText: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    marginLeft: Spacing.sm,
  },
  saveButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: FontSizes.md,
    fontWeight: '600',
    marginLeft: Spacing.sm,
  },
});
