import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../context/ThemeContext';
import { Card, FloatingButton, EmptyState } from '../components';
import {
  getAllCategories,
  createCategory,
  updateCategory,
  archiveCategory,
  deleteCategory,
} from '../services/database';
import { Category } from '../models/types';
import { generateUUID } from '../utils/uuid';
import { CATEGORY_ICONS, CATEGORY_COLORS } from '../constants/categories';
import { Spacing, FontSizes, BorderRadius } from '../constants/theme';

export function ManageCategoriesScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation();

  const [categories, setCategories] = useState<Category[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryName, setCategoryName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState<string>(CATEGORY_ICONS[0]);
  const [selectedColor, setSelectedColor] = useState<string>(CATEGORY_COLORS[0]);
  const [isLoading, setIsLoading] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadCategories();
    }, [])
  );

  const loadCategories = async () => {
    try {
      const cats = await getAllCategories();
      setCategories(cats);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const openAddModal = () => {
    setEditingCategory(null);
    setCategoryName('');
    setSelectedIcon(CATEGORY_ICONS[0]);
    setSelectedColor(CATEGORY_COLORS[0]);
    setShowModal(true);
  };

  const openEditModal = (category: Category) => {
    setEditingCategory(category);
    setCategoryName(category.name);
    setSelectedIcon(category.icon);
    setSelectedColor(category.color);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingCategory(null);
    setCategoryName('');
  };

  const handleSave = async () => {
    if (!categoryName.trim()) {
      Alert.alert('Invalid Name', 'Please enter a category name.');
      return;
    }

    setIsLoading(true);
    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, {
          name: categoryName.trim(),
          icon: selectedIcon,
          color: selectedColor,
        });
      } else {
        await createCategory(generateUUID(), categoryName.trim(), selectedIcon, selectedColor);
      }
      closeModal();
      loadCategories();
    } catch (error) {
      console.error('Failed to save category:', error);
      Alert.alert('Error', 'Failed to save category.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleArchive = (category: Category) => {
    Alert.alert(
      'Archive Category',
      `Archive "${category.name}"? It will be hidden from new expenses but existing expenses will keep this category.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Archive',
          onPress: async () => {
            try {
              await archiveCategory(category.id);
              loadCategories();
            } catch (error) {
              console.error('Failed to archive category:', error);
              Alert.alert('Error', 'Failed to archive category.');
            }
          },
        },
      ]
    );
  };

  const handleDelete = (category: Category) => {
    Alert.alert(
      'Delete Category',
      `Delete "${category.name}"? This can only be done if no expenses use this category.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteCategory(category.id);
              loadCategories();
            } catch (error: any) {
              Alert.alert('Cannot Delete', error.message || 'Failed to delete category.');
            }
          },
        },
      ]
    );
  };

  const renderCategoryItem = ({ item }: { item: Category }) => (
    <TouchableOpacity
      style={[
        styles.categoryItem,
        { backgroundColor: colors.surface, borderColor: colors.border },
        item.isArchived && styles.archivedItem,
      ]}
      onPress={() => openEditModal(item)}
    >
      <View style={[styles.categoryIcon, { backgroundColor: item.color }]}>
        <Ionicons name={item.icon as any} size={20} color="#FFFFFF" />
      </View>
      <View style={styles.categoryInfo}>
        <Text style={[styles.categoryName, { color: colors.text }]}>{item.name}</Text>
        <View style={styles.categoryMeta}>
          {item.isDefault && (
            <View style={[styles.badge, { backgroundColor: colors.primary + '20' }]}>
              <Text style={[styles.badgeText, { color: colors.primary }]}>Default</Text>
            </View>
          )}
          {item.isArchived && (
            <View style={[styles.badge, { backgroundColor: colors.textTertiary + '30' }]}>
              <Text style={[styles.badgeText, { color: colors.textSecondary }]}>Archived</Text>
            </View>
          )}
        </View>
      </View>
      <View style={styles.categoryActions}>
        {!item.isDefault && !item.isArchived && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleArchive(item)}
          >
            <Ionicons name="archive" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
        {!item.isDefault && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleDelete(item)}
          >
            <Ionicons name="trash" size={20} color={colors.error} />
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={categories}
        renderItem={renderCategoryItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <EmptyState
            icon="pricetags-outline"
            title="No categories"
            message="Create your first expense category to start organizing."
            action={{ label: 'Add Category', onPress: openAddModal }}
          />
        }
      />

      <FloatingButton icon="add" onPress={openAddModal} />

      {/* Add/Edit Modal */}
      <Modal visible={showModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {editingCategory ? 'Edit Category' : 'New Category'}
              </Text>
              <TouchableOpacity onPress={closeModal}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Name</Text>
            <TextInput
              style={[
                styles.input,
                { color: colors.text, backgroundColor: colors.surfaceVariant },
              ]}
              placeholder="Category name"
              placeholderTextColor={colors.textTertiary}
              value={categoryName}
              onChangeText={setCategoryName}
            />

            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Icon</Text>
            <FlatList
              data={CATEGORY_ICONS}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item}
              contentContainerStyle={styles.iconList}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.iconOption,
                    { backgroundColor: colors.surfaceVariant },
                    selectedIcon === item && { backgroundColor: selectedColor },
                  ]}
                  onPress={() => setSelectedIcon(item)}
                >
                  <Ionicons
                    name={item as any}
                    size={20}
                    color={selectedIcon === item ? '#FFFFFF' : colors.text}
                  />
                </TouchableOpacity>
              )}
            />

            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Color</Text>
            <View style={styles.colorGrid}>
              {CATEGORY_COLORS.map((color) => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.colorOption,
                    { backgroundColor: color },
                    selectedColor === color && styles.colorSelected,
                  ]}
                  onPress={() => setSelectedColor(color)}
                >
                  {selectedColor === color && (
                    <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={[
                styles.saveButton,
                { backgroundColor: colors.primary },
                isLoading && styles.saveButtonDisabled,
              ]}
              onPress={handleSave}
              disabled={isLoading}
            >
              <Text style={styles.saveButtonText}>
                {isLoading ? 'Saving...' : 'Save Category'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  archivedItem: {
    opacity: 0.6,
  },
  categoryIcon: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: FontSizes.lg,
    fontWeight: '500',
  },
  categoryMeta: {
    flexDirection: 'row',
    marginTop: 4,
  },
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    marginRight: Spacing.xs,
  },
  badgeText: {
    fontSize: FontSizes.xs,
    fontWeight: '600',
  },
  categoryActions: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: Spacing.sm,
    marginLeft: Spacing.xs,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.lg,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  modalTitle: {
    fontSize: FontSizes.xl,
    fontWeight: '600',
  },
  inputLabel: {
    fontSize: FontSizes.md,
    fontWeight: '500',
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
  },
  input: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    fontSize: FontSizes.lg,
  },
  iconList: {
    paddingVertical: Spacing.sm,
  },
  iconOption: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: Spacing.sm,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: Spacing.sm,
    marginBottom: Spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorSelected: {
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  saveButton: {
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    marginTop: Spacing.xl,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: FontSizes.lg,
    fontWeight: '600',
  },
});
