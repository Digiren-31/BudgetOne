import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle, StyleProp } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { BorderRadius, FontSizes, Spacing } from '../constants/theme';

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
}

export function Card({ children, style, onPress }: CardProps) {
  const { colors } = useTheme();

  const cardStyle = [
    styles.card,
    { backgroundColor: colors.surface, borderColor: colors.border },
    style,
  ];

  if (onPress) {
    return (
      <TouchableOpacity style={cardStyle} onPress={onPress} activeOpacity={0.7}>
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={cardStyle}>{children}</View>;
}

interface ListItemProps {
  title: string;
  subtitle?: string;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  leftIconColor?: string;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  rightText?: string;
  rightTextColor?: string;
  onPress?: () => void;
  showChevron?: boolean;
  badge?: string;
}

export function ListItem({
  title,
  subtitle,
  leftIcon,
  leftIconColor,
  rightIcon,
  rightText,
  rightTextColor,
  onPress,
  showChevron = false,
  badge,
}: ListItemProps) {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      style={[styles.listItem, { borderBottomColor: colors.border }]}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={0.7}
    >
      {leftIcon && (
        <View style={[styles.iconContainer, { backgroundColor: leftIconColor || colors.primary }]}>
          <Ionicons name={leftIcon} size={18} color="#FFFFFF" />
        </View>
      )}
      <View style={styles.listItemContent}>
        <Text style={[styles.listItemTitle, { color: colors.text }]}>{title}</Text>
        {subtitle && (
          <Text style={[styles.listItemSubtitle, { color: colors.textSecondary }]}>{subtitle}</Text>
        )}
      </View>
      {rightText && (
        <Text style={[styles.listItemRightText, { color: rightTextColor || colors.textSecondary }]}>
          {rightText}
        </Text>
      )}
      {badge && (
        <View style={[styles.badge, { backgroundColor: colors.primary }]}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      )}
      {rightIcon && <Ionicons name={rightIcon} size={20} color={colors.textSecondary} />}
      {showChevron && (
        <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
      )}
    </TouchableOpacity>
  );
}

interface SectionHeaderProps {
  title: string;
  action?: {
    label: string;
    onPress: () => void;
  };
}

export function SectionHeader({ title, action }: SectionHeaderProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.sectionHeader}>
      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{title}</Text>
      {action && (
        <TouchableOpacity onPress={action.onPress}>
          <Text style={[styles.sectionAction, { color: colors.primary }]}>{action.label}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

interface EmptyStateProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  message: string;
  action?: {
    label: string;
    onPress: () => void;
  };
}

export function EmptyState({ icon, title, message, action }: EmptyStateProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.emptyState}>
      <Ionicons name={icon} size={64} color={colors.textTertiary} />
      <Text style={[styles.emptyTitle, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.emptyMessage, { color: colors.textSecondary }]}>{message}</Text>
      {action && (
        <TouchableOpacity
          style={[styles.emptyButton, { backgroundColor: colors.primary }]}
          onPress={action.onPress}
        >
          <Text style={styles.emptyButtonText}>{action.label}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

interface FloatingButtonProps {
  icon?: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
}

export function FloatingButton({ icon = 'add', onPress }: FloatingButtonProps) {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      style={[styles.floatingButton, { backgroundColor: colors.primary }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Ionicons name={icon} size={28} color="#FFFFFF" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderBottomWidth: 1,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  listItemContent: {
    flex: 1,
  },
  listItemTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '500',
  },
  listItemSubtitle: {
    fontSize: FontSizes.sm,
    marginTop: 2,
  },
  listItemRightText: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    marginRight: Spacing.sm,
  },
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    marginRight: Spacing.sm,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: FontSizes.xs,
    fontWeight: '600',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionAction: {
    fontSize: FontSizes.md,
    fontWeight: '500',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  emptyTitle: {
    fontSize: FontSizes.xl,
    fontWeight: '600',
    marginTop: Spacing.md,
  },
  emptyMessage: {
    fontSize: FontSizes.md,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
  emptyButton: {
    marginTop: Spacing.lg,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: FontSizes.md,
    fontWeight: '600',
  },
  floatingButton: {
    position: 'absolute',
    bottom: Spacing.lg,
    right: Spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
});
