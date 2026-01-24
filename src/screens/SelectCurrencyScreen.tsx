import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../context/ThemeContext';
import { useSettings } from '../context/SettingsContext';
import { CURRENCIES, Currency } from '../constants/currencies';
import { Spacing, FontSizes, BorderRadius } from '../constants/theme';

export function SelectCurrencyScreen() {
  const { colors } = useTheme();
  const { currency, setCurrency } = useSettings();
  const navigation = useNavigation();

  const handleSelect = (selectedCurrency: Currency) => {
    setCurrency(selectedCurrency);
    navigation.goBack();
  };

  const renderItem = ({ item }: { item: Currency }) => {
    const isSelected = item.code === currency.code;

    return (
      <TouchableOpacity
        style={[
          styles.item,
          { backgroundColor: colors.surface, borderColor: colors.border },
          isSelected && { borderColor: colors.primary, borderWidth: 2 },
        ]}
        onPress={() => handleSelect(item)}
      >
        <View style={styles.currencyInfo}>
          <Text style={[styles.symbol, { color: colors.primary }]}>{item.symbol}</Text>
          <View style={styles.textContainer}>
            <Text style={[styles.code, { color: colors.text }]}>{item.code}</Text>
            <Text style={[styles.name, { color: colors.textSecondary }]}>{item.name}</Text>
          </View>
        </View>
        {isSelected && (
          <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={CURRENCIES}
        renderItem={renderItem}
        keyExtractor={(item) => item.code}
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
    padding: Spacing.md,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  currencyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  symbol: {
    fontSize: FontSizes.xxl,
    fontWeight: '700',
    width: 50,
  },
  textContainer: {
    marginLeft: Spacing.sm,
  },
  code: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
  },
  name: {
    fontSize: FontSizes.sm,
    marginTop: 2,
  },
});
