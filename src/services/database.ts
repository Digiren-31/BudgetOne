import * as SQLite from 'expo-sqlite';
import { Category, Expense, SmsPattern, ExpenseSuggestion } from '../models/types';
import { DEFAULT_CATEGORIES } from '../constants/categories';

let db: SQLite.SQLiteDatabase | null = null;

export async function initDatabase(): Promise<void> {
  db = await SQLite.openDatabaseAsync('budgetone.db');

  // Create tables
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      icon TEXT NOT NULL,
      color TEXT NOT NULL,
      isDefault INTEGER NOT NULL DEFAULT 0,
      isArchived INTEGER NOT NULL DEFAULT 0,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );
    
    CREATE TABLE IF NOT EXISTS expenses (
      id TEXT PRIMARY KEY NOT NULL,
      amount REAL NOT NULL,
      categoryId TEXT NOT NULL,
      remark TEXT,
      dateTime TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      source TEXT NOT NULL DEFAULT 'manual',
      isConfirmed INTEGER NOT NULL DEFAULT 1,
      smsPatternId TEXT,
      originalSmsText TEXT,
      FOREIGN KEY (categoryId) REFERENCES categories (id)
    );
    
    CREATE TABLE IF NOT EXISTS sms_patterns (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      senderId TEXT NOT NULL,
      description TEXT,
      pattern TEXT NOT NULL,
      isEnabled INTEGER NOT NULL DEFAULT 1,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );
    
    CREATE TABLE IF NOT EXISTS expense_suggestions (
      id TEXT PRIMARY KEY NOT NULL,
      amount REAL NOT NULL,
      dateTime TEXT NOT NULL,
      merchant TEXT,
      originalSmsText TEXT NOT NULL,
      smsSenderId TEXT NOT NULL,
      patternId TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending'
    );
    
    CREATE INDEX IF NOT EXISTS idx_expenses_dateTime ON expenses (dateTime);
    CREATE INDEX IF NOT EXISTS idx_expenses_categoryId ON expenses (categoryId);
    CREATE INDEX IF NOT EXISTS idx_sms_patterns_senderId ON sms_patterns (senderId);
  `);

  // Initialize default categories if not exist
  await initDefaultCategories();
}

async function initDefaultCategories(): Promise<void> {
  if (!db) throw new Error('Database not initialized');

  const existingCategories = await db.getAllAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM categories WHERE isDefault = 1'
  );

  if (existingCategories[0].count === 0) {
    const now = new Date().toISOString();
    for (const category of DEFAULT_CATEGORIES) {
      await db.runAsync(
        `INSERT INTO categories (id, name, icon, color, isDefault, isArchived, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [category.id, category.name, category.icon, category.color, 1, 0, now, now]
      );
    }
  }
}

// Category operations
export async function getAllCategories(): Promise<Category[]> {
  if (!db) throw new Error('Database not initialized');

  const rows = await db.getAllAsync<any>('SELECT * FROM categories ORDER BY isDefault DESC, name ASC');
  return rows.map(row => ({
    ...row,
    isDefault: Boolean(row.isDefault),
    isArchived: Boolean(row.isArchived),
  }));
}

export async function getActiveCategories(): Promise<Category[]> {
  if (!db) throw new Error('Database not initialized');

  const rows = await db.getAllAsync<any>(
    'SELECT * FROM categories WHERE isArchived = 0 ORDER BY isDefault DESC, name ASC'
  );
  return rows.map(row => ({
    ...row,
    isDefault: Boolean(row.isDefault),
    isArchived: Boolean(row.isArchived),
  }));
}

export async function getCategoryById(id: string): Promise<Category | null> {
  if (!db) throw new Error('Database not initialized');

  const rows = await db.getAllAsync<any>('SELECT * FROM categories WHERE id = ?', [id]);
  if (rows.length === 0) return null;
  return {
    ...rows[0],
    isDefault: Boolean(rows[0].isDefault),
    isArchived: Boolean(rows[0].isArchived),
  };
}

export async function createCategory(
  id: string,
  name: string,
  icon: string,
  color: string
): Promise<Category> {
  if (!db) throw new Error('Database not initialized');

  const now = new Date().toISOString();
  await db.runAsync(
    `INSERT INTO categories (id, name, icon, color, isDefault, isArchived, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, 0, 0, ?, ?)`,
    [id, name, icon, color, now, now]
  );

  return {
    id,
    name,
    icon,
    color,
    isDefault: false,
    isArchived: false,
    createdAt: now,
    updatedAt: now,
  };
}

export async function updateCategory(
  id: string,
  updates: { name?: string; icon?: string; color?: string }
): Promise<void> {
  if (!db) throw new Error('Database not initialized');

  const sets: string[] = [];
  const values: any[] = [];

  if (updates.name !== undefined) {
    sets.push('name = ?');
    values.push(updates.name);
  }
  if (updates.icon !== undefined) {
    sets.push('icon = ?');
    values.push(updates.icon);
  }
  if (updates.color !== undefined) {
    sets.push('color = ?');
    values.push(updates.color);
  }

  if (sets.length > 0) {
    sets.push('updatedAt = ?');
    values.push(new Date().toISOString());
    values.push(id);

    await db.runAsync(
      `UPDATE categories SET ${sets.join(', ')} WHERE id = ?`,
      values
    );
  }
}

export async function archiveCategory(id: string): Promise<void> {
  if (!db) throw new Error('Database not initialized');

  await db.runAsync(
    'UPDATE categories SET isArchived = 1, updatedAt = ? WHERE id = ?',
    [new Date().toISOString(), id]
  );
}

export async function deleteCategory(id: string): Promise<void> {
  if (!db) throw new Error('Database not initialized');

  // Check if category has expenses
  const expenses = await db.getAllAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM expenses WHERE categoryId = ?',
    [id]
  );

  if (expenses[0].count > 0) {
    throw new Error('Cannot delete category with existing expenses. Archive it instead.');
  }

  await db.runAsync('DELETE FROM categories WHERE id = ?', [id]);
}

// Expense operations
export async function getAllExpenses(): Promise<Expense[]> {
  if (!db) throw new Error('Database not initialized');

  const rows = await db.getAllAsync<any>('SELECT * FROM expenses ORDER BY dateTime DESC');
  return rows.map(row => ({
    ...row,
    isConfirmed: Boolean(row.isConfirmed),
  }));
}

export async function getExpensesByDateRange(startDate: string, endDate: string): Promise<Expense[]> {
  if (!db) throw new Error('Database not initialized');

  const rows = await db.getAllAsync<any>(
    'SELECT * FROM expenses WHERE dateTime >= ? AND dateTime <= ? ORDER BY dateTime DESC',
    [startDate, endDate]
  );
  return rows.map(row => ({
    ...row,
    isConfirmed: Boolean(row.isConfirmed),
  }));
}

export async function getTodayExpenses(): Promise<Expense[]> {
  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);
  const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

  return getExpensesByDateRange(startOfDay.toISOString(), endOfDay.toISOString());
}

export async function getExpenseById(id: string): Promise<Expense | null> {
  if (!db) throw new Error('Database not initialized');

  const rows = await db.getAllAsync<any>('SELECT * FROM expenses WHERE id = ?', [id]);
  if (rows.length === 0) return null;
  return {
    ...rows[0],
    isConfirmed: Boolean(rows[0].isConfirmed),
  };
}

export async function createExpense(expense: Omit<Expense, 'createdAt' | 'updatedAt'>): Promise<Expense> {
  if (!db) throw new Error('Database not initialized');

  const now = new Date().toISOString();
  await db.runAsync(
    `INSERT INTO expenses (id, amount, categoryId, remark, dateTime, createdAt, updatedAt, source, isConfirmed, smsPatternId, originalSmsText)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      expense.id,
      expense.amount,
      expense.categoryId,
      expense.remark,
      expense.dateTime,
      now,
      now,
      expense.source,
      expense.isConfirmed ? 1 : 0,
      expense.smsPatternId,
      expense.originalSmsText,
    ]
  );

  return {
    ...expense,
    createdAt: now,
    updatedAt: now,
  };
}

export async function updateExpense(
  id: string,
  updates: Partial<Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<void> {
  if (!db) throw new Error('Database not initialized');

  const sets: string[] = [];
  const values: any[] = [];

  if (updates.amount !== undefined) {
    sets.push('amount = ?');
    values.push(updates.amount);
  }
  if (updates.categoryId !== undefined) {
    sets.push('categoryId = ?');
    values.push(updates.categoryId);
  }
  if (updates.remark !== undefined) {
    sets.push('remark = ?');
    values.push(updates.remark);
  }
  if (updates.dateTime !== undefined) {
    sets.push('dateTime = ?');
    values.push(updates.dateTime);
  }
  if (updates.isConfirmed !== undefined) {
    sets.push('isConfirmed = ?');
    values.push(updates.isConfirmed ? 1 : 0);
  }

  if (sets.length > 0) {
    sets.push('updatedAt = ?');
    values.push(new Date().toISOString());
    values.push(id);

    await db.runAsync(
      `UPDATE expenses SET ${sets.join(', ')} WHERE id = ?`,
      values
    );
  }
}

export async function deleteExpense(id: string): Promise<void> {
  if (!db) throw new Error('Database not initialized');

  await db.runAsync('DELETE FROM expenses WHERE id = ?', [id]);
}

export async function getExpenseSummaryByCategory(
  startDate: string,
  endDate: string
): Promise<{ categoryId: string; totalAmount: number; count: number }[]> {
  if (!db) throw new Error('Database not initialized');

  const rows = await db.getAllAsync<{ categoryId: string; totalAmount: number; count: number }>(
    `SELECT categoryId, SUM(amount) as totalAmount, COUNT(*) as count
     FROM expenses
     WHERE dateTime >= ? AND dateTime <= ?
     GROUP BY categoryId
     ORDER BY totalAmount DESC`,
    [startDate, endDate]
  );

  return rows;
}

export async function getDailyExpenseSummary(
  startDate: string,
  endDate: string
): Promise<{ date: string; amount: number }[]> {
  if (!db) throw new Error('Database not initialized');

  const rows = await db.getAllAsync<{ date: string; amount: number }>(
    `SELECT date(dateTime) as date, SUM(amount) as amount
     FROM expenses
     WHERE dateTime >= ? AND dateTime <= ?
     GROUP BY date(dateTime)
     ORDER BY date ASC`,
    [startDate, endDate]
  );

  return rows;
}

// SMS Pattern operations
export async function getAllSmsPatterns(): Promise<SmsPattern[]> {
  if (!db) throw new Error('Database not initialized');

  const rows = await db.getAllAsync<any>('SELECT * FROM sms_patterns ORDER BY createdAt DESC');
  return rows.map(row => ({
    ...row,
    pattern: JSON.parse(row.pattern),
    isEnabled: Boolean(row.isEnabled),
  }));
}

export async function getEnabledSmsPatterns(): Promise<SmsPattern[]> {
  if (!db) throw new Error('Database not initialized');

  const rows = await db.getAllAsync<any>(
    'SELECT * FROM sms_patterns WHERE isEnabled = 1 ORDER BY createdAt DESC'
  );
  return rows.map(row => ({
    ...row,
    pattern: JSON.parse(row.pattern),
    isEnabled: Boolean(row.isEnabled),
  }));
}

export async function getSmsPatternById(id: string): Promise<SmsPattern | null> {
  if (!db) throw new Error('Database not initialized');

  const rows = await db.getAllAsync<any>('SELECT * FROM sms_patterns WHERE id = ?', [id]);
  if (rows.length === 0) return null;
  return {
    ...rows[0],
    pattern: JSON.parse(rows[0].pattern),
    isEnabled: Boolean(rows[0].isEnabled),
  };
}

export async function createSmsPattern(pattern: Omit<SmsPattern, 'createdAt' | 'updatedAt'>): Promise<SmsPattern> {
  if (!db) throw new Error('Database not initialized');

  const now = new Date().toISOString();
  await db.runAsync(
    `INSERT INTO sms_patterns (id, name, senderId, description, pattern, isEnabled, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      pattern.id,
      pattern.name,
      pattern.senderId,
      pattern.description,
      JSON.stringify(pattern.pattern),
      pattern.isEnabled ? 1 : 0,
      now,
      now,
    ]
  );

  return {
    ...pattern,
    createdAt: now,
    updatedAt: now,
  };
}

export async function updateSmsPattern(
  id: string,
  updates: { name?: string; isEnabled?: boolean }
): Promise<void> {
  if (!db) throw new Error('Database not initialized');

  const sets: string[] = [];
  const values: any[] = [];

  if (updates.name !== undefined) {
    sets.push('name = ?');
    values.push(updates.name);
  }
  if (updates.isEnabled !== undefined) {
    sets.push('isEnabled = ?');
    values.push(updates.isEnabled ? 1 : 0);
  }

  if (sets.length > 0) {
    sets.push('updatedAt = ?');
    values.push(new Date().toISOString());
    values.push(id);

    await db.runAsync(
      `UPDATE sms_patterns SET ${sets.join(', ')} WHERE id = ?`,
      values
    );
  }
}

export async function deleteSmsPattern(id: string): Promise<void> {
  if (!db) throw new Error('Database not initialized');

  await db.runAsync('DELETE FROM sms_patterns WHERE id = ?', [id]);
}

// Expense suggestions operations
export async function getPendingSuggestions(): Promise<ExpenseSuggestion[]> {
  if (!db) throw new Error('Database not initialized');

  const rows = await db.getAllAsync<ExpenseSuggestion>(
    "SELECT * FROM expense_suggestions WHERE status = 'pending' ORDER BY createdAt DESC"
  );
  return rows;
}

export async function createExpenseSuggestion(suggestion: ExpenseSuggestion): Promise<void> {
  if (!db) throw new Error('Database not initialized');

  await db.runAsync(
    `INSERT INTO expense_suggestions (id, amount, dateTime, merchant, originalSmsText, smsSenderId, patternId, createdAt, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      suggestion.id,
      suggestion.amount,
      suggestion.dateTime,
      suggestion.merchant,
      suggestion.originalSmsText,
      suggestion.smsSenderId,
      suggestion.patternId,
      suggestion.createdAt,
      suggestion.status,
    ]
  );
}

export async function updateSuggestionStatus(
  id: string,
  status: 'confirmed' | 'dismissed'
): Promise<void> {
  if (!db) throw new Error('Database not initialized');

  await db.runAsync(
    'UPDATE expense_suggestions SET status = ? WHERE id = ?',
    [status, id]
  );
}

export async function deleteSuggestion(id: string): Promise<void> {
  if (!db) throw new Error('Database not initialized');

  await db.runAsync('DELETE FROM expense_suggestions WHERE id = ?', [id]);
}
