/**
 * Smart Expense Tracker - Central State Store
 * Handles localStorage persistence, state mutations, and event subscriptions
 */

const STORAGE_KEY = 'smart_expense_tracker_state_v1';

export const CATEGORIES = [
  { id: 'food_dining', name: 'Food & Dining', icon: '🍔', color: '#F59E0B' },
  { id: 'groceries', name: 'Groceries', icon: '🛒', color: '#10B981' },
  { id: 'housing', name: 'Housing & Rent', icon: '🏠', color: '#6366F1' },
  { id: 'utilities', name: 'Utilities & Bills', icon: '⚡', color: '#0EA5E9' },
  { id: 'transportation', name: 'Transportation', icon: '🚗', color: '#EC4899' },
  { id: 'entertainment', name: 'Entertainment', icon: '🎬', color: '#8B5CF6' },
  { id: 'shopping', name: 'Shopping', icon: '🛍️', color: '#F43F5E' },
  { id: 'health', name: 'Health & Fitness', icon: '💪', color: '#14B8A6' },
  { id: 'income_salary', name: 'Salary & Income', icon: '💼', color: '#10B981' },
  { id: 'investments', name: 'Investments', icon: '📈', color: '#3B82F6' },
  { id: 'other', name: 'General & Other', icon: '✨', color: '#64748B' }
];

export const ACCOUNTS = [
  { id: 'acc_checking', name: 'Chase Checking', type: 'Checking', balance: 4250.00, color: '#3B82F6' },
  { id: 'acc_savings', name: 'High Yield Savings', type: 'Savings', balance: 14850.00, color: '#10B981' },
  { id: 'acc_credit', name: 'Amex Gold Card', type: 'Credit Card', balance: -820.00, color: '#F59E0B' },
  { id: 'acc_cash', name: 'Cash Wallet', type: 'Cash', balance: 185.00, color: '#64748B' }
];

function generateSampleData() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  
  const getDateOffset = (dayOffset, monthOffset = 0) => {
    const d = new Date(now.getFullYear(), now.getMonth() + monthOffset, now.getDate() + dayOffset);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  };

  return {
    transactions: [
      // Income
      {
        id: 'tx_inc_1',
        type: 'income',
        amount: 3250.00,
        merchant: 'Acme Corp Payroll',
        category: 'Salary & Income',
        account: 'Chase Checking',
        date: getDateOffset(-6),
        note: 'Bi-weekly direct deposit paycheck',
        receipt: null
      },
      {
        id: 'tx_inc_2',
        type: 'income',
        amount: 450.00,
        merchant: 'Freelance Design Client',
        category: 'Salary & Income',
        account: 'Chase Checking',
        date: getDateOffset(-14),
        note: 'Landing page consulting invoice #104',
        receipt: null
      },
      // Current Month Expenses
      {
        id: 'tx_1',
        type: 'expense',
        amount: 1400.00,
        merchant: 'Avalon Bay Communities',
        category: 'Housing & Rent',
        account: 'Chase Checking',
        date: getDateOffset(-6),
        note: 'October rent payment',
        receipt: null
      },
      {
        id: 'tx_2',
        type: 'expense',
        amount: 88.50,
        merchant: 'Trader Joe\'s',
        category: 'Groceries',
        account: 'Amex Gold Card',
        date: getDateOffset(-1),
        note: 'Weekly organic groceries & produce',
        receipt: null
      },
      {
        id: 'tx_3',
        type: 'expense',
        amount: 42.20,
        merchant: 'Starbucks Coffee',
        category: 'Food & Dining',
        account: 'Chase Checking',
        date: getDateOffset(-2),
        note: 'Coffee meeting with client',
        receipt: null
      },
      {
        id: 'tx_4',
        type: 'expense',
        amount: 74.99,
        merchant: 'ConEdison Electric',
        category: 'Utilities & Bills',
        account: 'Chase Checking',
        date: getDateOffset(-3),
        note: 'Monthly power and heating bill',
        receipt: null
      },
      {
        id: 'tx_5',
        type: 'expense',
        amount: 34.50,
        merchant: 'Uber Rides',
        category: 'Transportation',
        account: 'Amex Gold Card',
        date: getDateOffset(-3),
        note: 'Airport transit ride',
        receipt: null
      },
      {
        id: 'tx_6',
        type: 'expense',
        amount: 15.99,
        merchant: 'Netflix Subscription',
        category: 'Entertainment',
        account: 'Chase Checking',
        date: getDateOffset(-4),
        note: 'Premium 4K streaming plan',
        receipt: null
      },
      {
        id: 'tx_7',
        type: 'expense',
        amount: 145.00,
        merchant: 'Nobu Japanese Dining',
        category: 'Food & Dining',
        account: 'Amex Gold Card',
        date: getDateOffset(-5),
        note: 'Anniversary dinner celebration',
        receipt: null
      },
      {
        id: 'tx_8',
        type: 'expense',
        amount: 65.00,
        merchant: 'Chevron Fuel',
        category: 'Transportation',
        account: 'Amex Gold Card',
        date: getDateOffset(-8),
        note: 'Full tank premium gas',
        receipt: null
      },
      {
        id: 'tx_9',
        type: 'expense',
        amount: 120.00,
        merchant: 'Target Superstore',
        category: 'Shopping',
        account: 'Amex Gold Card',
        date: getDateOffset(-10),
        note: 'Home decor & kitchen supplies',
        receipt: null
      },
      {
        id: 'tx_10',
        type: 'expense',
        amount: 45.00,
        merchant: 'Equinox Gym Class',
        category: 'Health & Fitness',
        account: 'Chase Checking',
        date: getDateOffset(-11),
        note: 'Cycling session pass',
        receipt: null
      },
      {
        id: 'tx_11',
        type: 'expense',
        amount: 88.50,
        merchant: 'Trader Joe\'s',
        category: 'Groceries',
        account: 'Amex Gold Card',
        date: getDateOffset(-1),
        note: 'Duplicate test sample entry',
        receipt: null
      },
      // Previous Month Sample Transactions (for MoM calculations)
      {
        id: 'tx_prev_1',
        type: 'expense',
        amount: 1400.00,
        merchant: 'Avalon Bay Communities',
        category: 'Housing & Rent',
        account: 'Chase Checking',
        date: getDateOffset(-15, -1),
        note: 'Previous month rent',
        receipt: null
      },
      {
        id: 'tx_prev_2',
        type: 'expense',
        amount: 480.00,
        merchant: 'Whole Foods Market',
        category: 'Groceries',
        account: 'Amex Gold Card',
        date: getDateOffset(-10, -1),
        note: 'Previous month groceries aggregate',
        receipt: null
      },
      {
        id: 'tx_prev_3',
        type: 'expense',
        amount: 420.00,
        merchant: 'Various Dining Out',
        category: 'Food & Dining',
        account: 'Amex Gold Card',
        date: getDateOffset(-8, -1),
        note: 'Previous month restaurants total',
        receipt: null
      },
      {
        id: 'tx_prev_4',
        type: 'income',
        amount: 3250.00,
        merchant: 'Acme Corp Payroll',
        category: 'Salary & Income',
        account: 'Chase Checking',
        date: getDateOffset(-15, -1),
        note: 'Previous month salary',
        receipt: null
      }
    ],
    budgets: [
      { id: 'b_1', category: 'Housing & Rent', monthlyLimit: 1400.00 },
      { id: 'b_2', category: 'Food & Dining', monthlyLimit: 300.00 },
      { id: 'b_3', category: 'Groceries', monthlyLimit: 450.00 },
      { id: 'b_4', category: 'Transportation', monthlyLimit: 200.00 },
      { id: 'b_5', category: 'Utilities & Bills', monthlyLimit: 180.00 },
      { id: 'b_6', category: 'Entertainment', monthlyLimit: 120.00 },
      { id: 'b_7', category: 'Shopping', monthlyLimit: 250.00 },
      { id: 'b_8', category: 'Health & Fitness', monthlyLimit: 100.00 }
    ],
    recurring: [
      {
        id: 'rec_1',
        name: 'Apartment Lease Rent',
        merchant: 'Avalon Bay Communities',
        category: 'Housing & Rent',
        amount: 1400.00,
        account: 'Chase Checking',
        frequency: 'monthly',
        nextDueDate: getDateOffset(4),
        type: 'expense'
      },
      {
        id: 'rec_2',
        name: 'Netflix Premium 4K',
        merchant: 'Netflix',
        category: 'Entertainment',
        amount: 15.99,
        account: 'Chase Checking',
        frequency: 'monthly',
        nextDueDate: getDateOffset(2),
        type: 'expense'
      },
      {
        id: 'rec_3',
        name: 'Spotify Premium Family',
        merchant: 'Spotify',
        category: 'Entertainment',
        amount: 16.99,
        account: 'Amex Gold Card',
        frequency: 'monthly',
        nextDueDate: getDateOffset(9),
        type: 'expense'
      },
      {
        id: 'rec_4',
        name: 'Verizon Fios Gigabit Fiber',
        merchant: 'Verizon Internet',
        category: 'Utilities & Bills',
        amount: 69.99,
        account: 'Chase Checking',
        frequency: 'monthly',
        nextDueDate: getDateOffset(7),
        type: 'expense'
      },
      {
        id: 'rec_5',
        name: 'Bi-Weekly Paycheck',
        merchant: 'Acme Corp Payroll',
        category: 'Salary & Income',
        amount: 3250.00,
        account: 'Chase Checking',
        frequency: 'biweekly',
        nextDueDate: getDateOffset(8),
        type: 'income'
      }
    ],
    accounts: [...ACCOUNTS],
    settings: {
      currency: 'USD',
      dateFormat: 'YYYY-MM-DD',
      theme: 'dark',
      demoMode: true
    }
  };
}

class Store {
  constructor() {
    this.subscribers = new Map();
    this.state = this.loadState();
  }

  loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        // Ensure defaults if schema updated
        return {
          ...generateSampleData(),
          ...parsed,
          settings: { ...generateSampleData().settings, ...(parsed.settings || {}) }
        };
      }
    } catch (e) {
      console.warn('Failed to parse state from localStorage, initializing fresh data', e);
    }
    const initial = generateSampleData();
    this.saveState(initial);
    return initial;
  }

  saveState(stateToSave = this.state) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
    } catch (e) {
      console.error('Error saving state to localStorage', e);
    }
  }

  getState() {
    return this.state;
  }

  subscribe(event, callback) {
    if (!this.subscribers.has(event)) {
      this.subscribers.set(event, new Set());
    }
    this.subscribers.get(event).add(callback);
    return () => {
      this.subscribers.get(event).delete(callback);
    };
  }

  emit(event, payload) {
    if (this.subscribers.has(event)) {
      this.subscribers.get(event).forEach(cb => {
        try { cb(payload, this.state); } catch (e) { console.error(e); }
      });
    }
    if (event !== 'state:changed' && this.subscribers.has('state:changed')) {
      this.subscribers.get('state:changed').forEach(cb => {
        try { cb(this.state); } catch (e) { console.error(e); }
      });
    }
  }

  // --- Transactions ---
  addTransaction(txData) {
    const id = 'tx_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);
    const newTx = {
      id,
      type: txData.type || 'expense',
      amount: parseFloat(txData.amount) || 0,
      merchant: txData.merchant.trim(),
      category: txData.category || 'General & Other',
      account: txData.account || 'Chase Checking',
      date: txData.date || new Date().toISOString().split('T')[0],
      note: txData.note || '',
      receipt: txData.receipt || null
    };

    this.state.transactions.unshift(newTx);
    this.saveState();
    this.emit('transaction:added', newTx);
    return newTx;
  }

  updateTransaction(id, updatedData) {
    const idx = this.state.transactions.findIndex(t => t.id === id);
    if (idx === -1) return null;

    this.state.transactions[idx] = {
      ...this.state.transactions[idx],
      ...updatedData,
      amount: parseFloat(updatedData.amount) || this.state.transactions[idx].amount
    };

    this.saveState();
    this.emit('transaction:updated', this.state.transactions[idx]);
    return this.state.transactions[idx];
  }

  deleteTransaction(id) {
    const idx = this.state.transactions.findIndex(t => t.id === id);
    if (idx === -1) return false;

    const removed = this.state.transactions.splice(idx, 1)[0];
    this.saveState();
    this.emit('transaction:deleted', removed);
    return true;
  }

  // --- Budgets ---
  setBudget(category, monthlyLimit) {
    const limit = parseFloat(monthlyLimit) || 0;
    const existing = this.state.budgets.find(b => b.category === category);
    if (existing) {
      existing.monthlyLimit = limit;
    } else {
      this.state.budgets.push({
        id: 'b_' + Date.now(),
        category,
        monthlyLimit: limit
      });
    }
    this.saveState();
    this.emit('budget:updated', { category, monthlyLimit: limit });
  }

  deleteBudget(id) {
    const idx = this.state.budgets.findIndex(b => b.id === id);
    if (idx !== -1) {
      this.state.budgets.splice(idx, 1);
      this.saveState();
      this.emit('budget:deleted', id);
    }
  }

  // --- Recurring Bills ---
  addRecurring(data) {
    const newBill = {
      id: 'rec_' + Date.now(),
      name: data.name,
      merchant: data.merchant || data.name,
      category: data.category || 'General & Other',
      amount: parseFloat(data.amount) || 0,
      account: data.account || 'Chase Checking',
      frequency: data.frequency || 'monthly',
      nextDueDate: data.nextDueDate,
      type: data.type || 'expense'
    };
    this.state.recurring.push(newBill);
    this.saveState();
    this.emit('recurring:added', newBill);
    return newBill;
  }

  deleteRecurring(id) {
    const idx = this.state.recurring.findIndex(r => r.id === id);
    if (idx !== -1) {
      this.state.recurring.splice(idx, 1);
      this.saveState();
      this.emit('recurring:deleted', id);
    }
  }

  markRecurringPaid(recurringId) {
    const bill = this.state.recurring.find(r => r.id === recurringId);
    if (!bill) return null;

    const todayStr = new Date().toISOString().split('T')[0];

    // Create transaction
    const tx = this.addTransaction({
      type: bill.type,
      amount: bill.amount,
      merchant: bill.merchant || bill.name,
      category: bill.category,
      account: bill.account,
      date: todayStr,
      note: `Recurring bill marked as paid (${bill.name})`
    });

    // Advance next due date by 1 month or 14 days
    const currentDue = new Date(bill.nextDueDate);
    if (bill.frequency === 'biweekly') {
      currentDue.setDate(currentDue.getDate() + 14);
    } else if (bill.frequency === 'yearly') {
      currentDue.setFullYear(currentDue.getFullYear() + 1);
    } else {
      currentDue.setMonth(currentDue.getMonth() + 1);
    }
    const pad = (n) => String(n).padStart(2, '0');
    bill.nextDueDate = `${currentDue.getFullYear()}-${pad(currentDue.getMonth() + 1)}-${pad(currentDue.getDate())}`;

    this.saveState();
    this.emit('recurring:updated', bill);
    return tx;
  }

  // --- Settings ---
  updateSettings(newSettings) {
    this.state.settings = { ...this.state.settings, ...newSettings };
    this.saveState();
    this.emit('settings:updated', this.state.settings);
  }

  addAccount(accountData) {
    const newAcc = {
      id: 'acc_' + Date.now(),
      name: accountData.name,
      type: accountData.type || 'Checking',
      balance: parseFloat(accountData.balance) || 0,
      color: accountData.color || '#6366F1'
    };
    this.state.accounts.push(newAcc);
    this.saveState();
    this.emit('account:added', newAcc);
    return newAcc;
  }

  // --- Reset & Import/Export ---
  resetToDemo() {
    this.state = generateSampleData();
    this.saveState();
    this.emit('state:reset', this.state);
  }

  clearAllData() {
    this.state = {
      transactions: [],
      budgets: [],
      recurring: [],
      accounts: [...ACCOUNTS],
      settings: { ...this.state.settings, demoMode: false }
    };
    this.saveState();
    this.emit('state:cleared', this.state);
  }

  exportJSON() {
    return JSON.stringify(this.state, null, 2);
  }

  importJSON(jsonString) {
    try {
      const parsed = JSON.parse(jsonString);
      if (Array.isArray(parsed.transactions)) {
        this.state = parsed;
        this.saveState();
        this.emit('state:imported', this.state);
        return true;
      }
    } catch (e) {
      console.error('Import error', e);
    }
    return false;
  }
}

export const store = new Store();
