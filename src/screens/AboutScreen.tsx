import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../context/ThemeContext';
import { Card, ListItem } from '../components';
import { Spacing, FontSizes, BorderRadius } from '../constants/theme';

export function AboutScreen() {
  const { colors } = useTheme();

  const handlePrivacyPolicy = () => {
    // Placeholder - would open a web link
    Linking.openURL('https://budgetone.app/privacy');
  };

  const handleTerms = () => {
    // Placeholder - would open a web link
    Linking.openURL('https://budgetone.app/terms');
  };

  const handleSupport = () => {
    Linking.openURL('mailto:support@budgetone.app');
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* App Info */}
      <View style={styles.header}>
        <View style={[styles.appIcon, { backgroundColor: colors.primary }]}>
          <Ionicons name="wallet" size={48} color="#FFFFFF" />
        </View>
        <Text style={[styles.appName, { color: colors.text }]}>BudgetOne</Text>
        <Text style={[styles.version, { color: colors.textSecondary }]}>Version 1.0.0</Text>
        <Text style={[styles.tagline, { color: colors.textSecondary }]}>
          Smart expense tracking with SMS detection
        </Text>
      </View>

      {/* Features */}
      <Card style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Features</Text>
        
        <View style={styles.feature}>
          <View style={[styles.featureIcon, { backgroundColor: colors.primary + '20' }]}>
            <Ionicons name="sparkles" size={20} color={colors.primary} />
          </View>
          <View style={styles.featureContent}>
            <Text style={[styles.featureTitle, { color: colors.text }]}>
              Smart SMS Detection
            </Text>
            <Text style={[styles.featureDescription, { color: colors.textSecondary }]}>
              Automatically detect expenses from your bank SMS notifications
            </Text>
          </View>
        </View>

        <View style={styles.feature}>
          <View style={[styles.featureIcon, { backgroundColor: colors.secondary + '20' }]}>
            <Ionicons name="pie-chart" size={20} color={colors.secondary} />
          </View>
          <View style={styles.featureContent}>
            <Text style={[styles.featureTitle, { color: colors.text }]}>
              Detailed Insights
            </Text>
            <Text style={[styles.featureDescription, { color: colors.textSecondary }]}>
              Visualize your spending with charts and category breakdowns
            </Text>
          </View>
        </View>

        <View style={styles.feature}>
          <View style={[styles.featureIcon, { backgroundColor: colors.warning + '20' }]}>
            <Ionicons name="notifications" size={20} color={colors.warning} />
          </View>
          <View style={styles.featureContent}>
            <Text style={[styles.featureTitle, { color: colors.text }]}>
              Instant Notifications
            </Text>
            <Text style={[styles.featureDescription, { color: colors.textSecondary }]}>
              Get notified immediately when an expense is detected
            </Text>
          </View>
        </View>

        <View style={styles.feature}>
          <View style={[styles.featureIcon, { backgroundColor: colors.info + '20' }]}>
            <Ionicons name="shield-checkmark" size={20} color={colors.info} />
          </View>
          <View style={styles.featureContent}>
            <Text style={[styles.featureTitle, { color: colors.text }]}>
              Privacy First
            </Text>
            <Text style={[styles.featureDescription, { color: colors.textSecondary }]}>
              All data stays on your device. No cloud sync required.
            </Text>
          </View>
        </View>
      </Card>

      {/* Privacy & Legal */}
      <Card style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Legal</Text>
        
        <ListItem
          title="Privacy Policy"
          leftIcon="document-text"
          leftIconColor={colors.info}
          showChevron
          onPress={handlePrivacyPolicy}
        />
        
        <ListItem
          title="Terms of Service"
          leftIcon="reader"
          leftIconColor={colors.secondary}
          showChevron
          onPress={handleTerms}
        />
        
        <ListItem
          title="Contact Support"
          leftIcon="mail"
          leftIconColor={colors.primary}
          showChevron
          onPress={handleSupport}
        />
      </Card>

      {/* Data Privacy Notice */}
      <Card style={[styles.section, { marginBottom: Spacing.xxl }]}>
        <View style={styles.privacyNotice}>
          <Ionicons name="lock-closed" size={32} color={colors.success} />
          <Text style={[styles.privacyTitle, { color: colors.text }]}>
            Your Data, Your Device
          </Text>
          <Text style={[styles.privacyText, { color: colors.textSecondary }]}>
            BudgetOne stores all your expense data locally on your device. 
            We only access SMS messages that you explicitly choose for pattern recognition.
            {'\n\n'}
            SMS content is only sent to our AI service during pattern setup to help 
            detect transaction formats. This data is processed securely and not stored 
            on our servers.
            {'\n\n'}
            We never sell or share your personal data.
          </Text>
        </View>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    padding: Spacing.xl,
  },
  appIcon: {
    width: 100,
    height: 100,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  appName: {
    fontSize: FontSizes.xxl,
    fontWeight: '700',
  },
  version: {
    fontSize: FontSizes.md,
    marginTop: Spacing.xs,
  },
  tagline: {
    fontSize: FontSizes.md,
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
  section: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    padding: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    marginBottom: Spacing.md,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: FontSizes.md,
    fontWeight: '600',
  },
  featureDescription: {
    fontSize: FontSizes.sm,
    marginTop: 2,
    lineHeight: 18,
  },
  privacyNotice: {
    alignItems: 'center',
    padding: Spacing.md,
  },
  privacyTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    marginTop: Spacing.md,
  },
  privacyText: {
    fontSize: FontSizes.sm,
    marginTop: Spacing.sm,
    textAlign: 'center',
    lineHeight: 20,
  },
});
