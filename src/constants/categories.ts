import { Ionicons } from '@expo/vector-icons';

// Default expense categories
export interface Category {
  id: string;
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  isDefault: boolean;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export const DEFAULT_CATEGORIES: Omit<Category, 'createdAt' | 'updatedAt'>[] = [
  {
    id: 'food',
    name: 'Food',
    icon: 'restaurant',
    color: '#F97316',
    isDefault: true,
    isArchived: false,
  },
  {
    id: 'travel',
    name: 'Travel',
    icon: 'car',
    color: '#8B5CF6',
    isDefault: true,
    isArchived: false,
  },
  {
    id: 'grocery',
    name: 'Grocery',
    icon: 'cart',
    color: '#22C55E',
    isDefault: true,
    isArchived: false,
  },
  {
    id: 'shopping',
    name: 'Shopping',
    icon: 'bag-handle',
    color: '#EC4899',
    isDefault: true,
    isArchived: false,
  },
  {
    id: 'bills',
    name: 'Bills',
    icon: 'receipt',
    color: '#EAB308',
    isDefault: true,
    isArchived: false,
  },
  {
    id: 'entertainment',
    name: 'Entertainment',
    icon: 'game-controller',
    color: '#06B6D4',
    isDefault: true,
    isArchived: false,
  },
  {
    id: 'health',
    name: 'Health',
    icon: 'medical',
    color: '#EF4444',
    isDefault: true,
    isArchived: false,
  },
  {
    id: 'misc',
    name: 'Miscellaneous',
    icon: 'ellipsis-horizontal-circle',
    color: '#6B7280',
    isDefault: true,
    isArchived: false,
  },
];

// Available icons for category customization
export const CATEGORY_ICONS: (keyof typeof Ionicons.glyphMap)[] = [
  'restaurant',
  'car',
  'cart',
  'bag-handle',
  'receipt',
  'game-controller',
  'medical',
  'home',
  'school',
  'fitness',
  'airplane',
  'bus',
  'train',
  'bicycle',
  'cafe',
  'pizza',
  'beer',
  'wine',
  'gift',
  'heart',
  'star',
  'paw',
  'leaf',
  'water',
  'flash',
  'wifi',
  'phone-portrait',
  'laptop',
  'tv',
  'musical-notes',
  'film',
  'book',
  'newspaper',
  'briefcase',
  'construct',
  'hammer',
  'color-palette',
  'camera',
  'cut',
  'shirt',
  'ellipsis-horizontal-circle',
];

// Available colors for category customization
export const CATEGORY_COLORS: string[] = [
  '#F97316', // Orange
  '#8B5CF6', // Purple
  '#22C55E', // Green
  '#EC4899', // Pink
  '#EAB308', // Yellow
  '#06B6D4', // Cyan
  '#EF4444', // Red
  '#3B82F6', // Blue
  '#14B8A6', // Teal
  '#A855F7', // Violet
  '#F43F5E', // Rose
  '#84CC16', // Lime
  '#6B7280', // Gray
];
