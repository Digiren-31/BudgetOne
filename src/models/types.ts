// Data models for the app

// Expense model
export interface Expense {
  id: string;
  amount: number;
  categoryId: string;
  remark: string | null;
  dateTime: string; // ISO string
  createdAt: string;
  updatedAt: string;
  source: 'manual' | 'sms';
  isConfirmed: boolean; // false = suggested/auto-detected, true = confirmed
  smsPatternId: string | null; // Reference to the pattern that detected this
  originalSmsText: string | null; // Original SMS text for reference
}

// Category model
export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  isDefault: boolean;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

// SMS Pattern model
export interface SmsPattern {
  id: string;
  name: string;
  senderId: string;
  description: string;
  pattern: PatternDefinition;
  isEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

// Pattern definition from AI
export interface PatternDefinition {
  senderRegex: string;
  amountRegex: string;
  dateTimeRegex: string | null;
  merchantRegex: string | null;
  // Optional: structured extraction hints
  amountGroup: number;
  dateTimeGroup: number | null;
  merchantGroup: number | null;
  dateTimeFormat: string | null; // e.g., "dd-MM-yyyy HH:mm"
}

// Pending expense suggestion
export interface ExpenseSuggestion {
  id: string;
  amount: number;
  dateTime: string;
  merchant: string | null;
  originalSmsText: string;
  smsSenderId: string;
  patternId: string;
  createdAt: string;
  status: 'pending' | 'confirmed' | 'dismissed';
}

// Category summary for insights
export interface CategorySummary {
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  categoryIcon: string;
  totalAmount: number;
  percentage: number;
  transactionCount: number;
}

// Period summary for insights
export interface PeriodSummary {
  startDate: string;
  endDate: string;
  totalAmount: number;
  transactionCount: number;
  categorySummaries: CategorySummary[];
  dailyAmounts: { date: string; amount: number }[];
  monthlyAmounts: { month: string; amount: number }[];
}

// Type for creating a new expense
export type CreateExpenseInput = Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>;

// Type for updating an expense
export type UpdateExpenseInput = Partial<Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>>;

// Type for creating a new category
export type CreateCategoryInput = Omit<Category, 'id' | 'createdAt' | 'updatedAt'>;

// Type for updating a category
export type UpdateCategoryInput = Partial<Omit<Category, 'id' | 'createdAt' | 'updatedAt'>>;
