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
import { createExpense, getActiveCategories } from '../services/database';
import { Expense, Category } from '../models/types';
import { formatCurrency } from '../constants/currencies';
import { generateUUID } from '../utils/uuid';
import { Spacing, FontSizes, BorderRadius } from '../constants/theme';

type RootStackParamList = {
  AddExpense: {
    prefillAmount?: number;
    prefillDateTime?: string;
    prefillCategoryId?: string;
    suggestionId?: string;
  };
  TodayMain: undefined;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type AddExpenseRouteProp = RouteProp<RootStackParamList, 'AddExpense'>;

export function AddExpenseScreen() {
  const { colors } = useTheme();
  const { currency } = useSettings();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<AddExpenseRouteProp>();

  const [amount, setAmount] = useState(route.params?.prefillAmount?.toString() || '');
  const [selectedCategory, setSelectedCategory] = useState<string>(
    route.params?.prefillCategoryId || ''
  );
  const [remark, setRemark] = useState('');
  const [dateTime, setDateTime] = useState<Date>(
    route.params?.prefillDateTime ? new Date(route.params.prefillDateTime) : new Date()
  );
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const cats = await getActiveCategories();
      setCategories(cats);
      if (!selectedCategory && cats.length > 0) {
        setSelectedCategory(cats[0].id);
      }
    } catch (error) {
      console.error('Failed to load categories:', error);
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
      const expense: Omit<Expense, 'createdAt' | 'updatedAt'> = {
        id: generateUUID(),
        amount: parseFloat(amount),
        categoryId: selectedCategory,
        remark: remark.trim() || null,
        dateTime: dateTime.toISOString(),
        source: route.params?.suggestionId ? 'sms' : 'manual',
        isConfirmed: true,
        smsPatternId: null,
        originalSmsText: null,
      };

      await createExpense(expense);
      navigation.goBack();
    } catch (error) {
      console.error('Failed to save expense:', error);
      Alert.alert('Error', 'Failed to save expense. Please try again.');
    } finally {
      setIsLoading(false);
    }
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

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
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
              autoFocus
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

        {/* Save Button */}
        <TouchableOpacity
          style={[
            styles.saveButton,
            { backgroundColor: colors.primary },
            isLoading && styles.saveButtonDisabled,
          ]}
          onPress={handleSave}
          disabled={isLoading}
        >
          <Ionicons name="checkmark" size={24} color="#FFFFFF" />
          <Text style={styles.saveButtonText}>
            {isLoading ? 'Saving...' : 'Save Expense'}
          </Text>
        </TouchableOpacity>
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
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.xl,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: FontSizes.lg,
    fontWeight: '600',
    marginLeft: Spacing.sm,
  },
});
