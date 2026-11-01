/**
 * Smart Expense Tracker - Core Application Controller
 */

import { store, CATEGORIES, ACCOUNTS } from './store.js';
import { Formatters } from './formatters.js';
import { SmartEngine } from './smart-engine.js';
import { Toast } from './ui/toast.js';
import { Modal } from './ui/modal.js';

import { DashboardView } from './ui/dashboard.js';
import { TransactionsView } from './ui/transactions.js';
import { BudgetsView } from './ui/budgets.js';
import { ReportsView } from './ui/reports.js';
import { RecurringView } from './ui/recurring.js';
import { InsightsView } from './ui/insights.js';
import { SettingsView } from './ui/settings.js';

class App {
  constructor() {
    this.currentView = 'dashboard';
    this.activeReceiptDataUrl = null;
  }

  init() {
    // 1. Initialize Theme
    const state = store.getState();
    const currentTheme = state.settings.theme || 'dark';
    document.documentElement.setAttribute('data-theme', currentTheme);

    // 2. Setup Global Event Listeners
    this.setupNavigation();
    this.setupTransactionModalHandlers();
    this.setupBudgetModalHandlers();
    this.setupRecurringModalHandlers();
    this.setupGlobalShortcuts();
    this.setupMobileMenu();

    // 3. Store Subscriptions
    store.subscribe('state:changed', () => {
      this.updateBadges();
    });

    // Custom Event Bus listeners
    window.addEventListener('app:navigate', (e) => {
      this.switchView(e.detail);
    });

    window.addEventListener('app:open-add-modal', (e) => {
      const type = e.detail?.type || 'expense';
      TransactionsView.openTransactionModal(null, type);
    });

    window.addEventListener('app:toast', (e) => {
      Toast.show(e.detail.message, e.detail.type || 'info');
    });

    window.addEventListener('app:rerender-active-view', () => {
      this.renderCurrentView();
    });

    // 4. Initial Render
    this.switchView('dashboard');
    this.updateBadges();

    console.log('Smart Expense Tracker initialized successfully.');
  }

  setupNavigation() {
    // Sidebar nav items
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const targetView = item.getAttribute('data-view');
        if (targetView) this.switchView(targetView);
      });
    });

    // Mobile bottom nav items
    const mobileNavItems = document.querySelectorAll('.mobile-nav-item');
    mobileNavItems.forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const targetView = item.getAttribute('data-view');
        if (targetView) this.switchView(targetView);
      });
    });

    // Header buttons
    const headerAddBtn = document.getElementById('header-btn-add');
    if (headerAddBtn) {
      headerAddBtn.addEventListener('click', () => {
        TransactionsView.openTransactionModal(null, 'expense');
      });
    }

    const headerThemeBtn = document.getElementById('header-btn-theme-toggle');
    if (headerThemeBtn) {
      headerThemeBtn.addEventListener('click', () => {
        const curTheme = document.documentElement.getAttribute('data-theme') || 'dark';
        const nextTheme = curTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', nextTheme);
        store.updateSettings({ theme: nextTheme });
        Toast.info(`Switched to ${nextTheme} mode`);
      });
    }
  }

  switchView(viewName) {
    this.currentView = viewName;

    // Update active nav items
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.toggle('active', item.getAttribute('data-view') === viewName);
    });

    document.querySelectorAll('.mobile-nav-item').forEach(item => {
      item.classList.toggle('active', item.getAttribute('data-view') === viewName);
    });

    // Toggle view containers
    document.querySelectorAll('.view-container').forEach(c => c.classList.remove('active'));
    const targetContainer = document.getElementById(`view-${viewName}`);
    if (targetContainer) {
      targetContainer.classList.add('active');
    }

    // Close mobile sidebar if open
    document.querySelector('.app-sidebar')?.classList.remove('open');
    document.querySelector('.sidebar-overlay')?.classList.remove('active');

    // Render corresponding view
    this.renderCurrentView();

    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  renderCurrentView() {
    switch (this.currentView) {
      case 'dashboard':
        DashboardView.render();
        break;
      case 'transactions':
        TransactionsView.render();
        break;
      case 'budgets':
        BudgetsView.render();
        break;
      case 'reports':
        ReportsView.render();
        break;
      case 'recurring':
        RecurringView.render();
        break;
      case 'insights':
        InsightsView.render();
        break;
      case 'settings':
        SettingsView.render();
        break;
    }
  }

  updateBadges() {
    const state = store.getState();
    const txCountBadge = document.getElementById('badge-tx-count');
    if (txCountBadge) {
      txCountBadge.textContent = state.transactions.length;
    }

    const billsCountBadge = document.getElementById('badge-bills-count');
    if (billsCountBadge) {
      const now = new Date();
      const upcoming = state.recurring.filter(r => {
        const diff = Math.ceil((new Date(r.nextDueDate) - now) / (1000 * 60 * 60 * 24));
        return diff >= 0 && diff <= 7;
      }).length;
      billsCountBadge.textContent = upcoming;
      billsCountBadge.style.display = upcoming > 0 ? 'inline-block' : 'none';
    }
  }

  setupTransactionModalHandlers() {
    const form = document.getElementById('form-transaction');
    const typeExpBtn = document.getElementById('modal-type-expense');
    const typeIncBtn = document.getElementById('modal-type-income');
    const merchantInput = document.getElementById('modal-tx-merchant');
    const amountInput = document.getElementById('modal-tx-amount');
    const catSelect = document.getElementById('modal-tx-category');
    const dateInput = document.getElementById('modal-tx-date');
    const suggestionChip = document.getElementById('modal-suggestion-chip');
    const suggestionText = document.getElementById('modal-suggestion-text');
    const duplicateBanner = document.getElementById('modal-duplicate-banner');
    const duplicateText = document.getElementById('modal-duplicate-text');
    const receiptInput = document.getElementById('modal-receipt-file');
    const receiptUploadArea = document.getElementById('modal-receipt-upload-area');
    const receiptPreviewWrap = document.getElementById('modal-receipt-preview-wrap');
    const receiptThumb = document.getElementById('modal-receipt-thumb');
    const receiptRemoveBtn = document.getElementById('modal-receipt-remove');

    // Type toggles
    typeExpBtn.addEventListener('click', () => {
      typeExpBtn.classList.add('active-expense');
      typeIncBtn.classList.remove('active-income');
      form.setAttribute('data-type', 'expense');
    });

    typeIncBtn.addEventListener('click', () => {
      typeIncBtn.classList.add('active-income');
      typeExpBtn.classList.remove('active-expense');
      form.setAttribute('data-type', 'income');
    });

    // Real-time Smart Suggestion & Duplicate Check
    const checkSmartHelpers = () => {
      const merchant = merchantInput.value;
      const amount = amountInput.value;
      const date = dateInput.value;
      const type = form.getAttribute('data-type') || 'expense';

      // 1. Category Suggestion
      if (merchant.length >= 2) {
        const suggestion = SmartEngine.suggestCategory(merchant, '', store.getState().transactions);
        if (suggestion && suggestion.category !== catSelect.value) {
          suggestionText.textContent = `Suggested: ${suggestion.category} (${suggestion.reason})`;
          suggestionChip.style.display = 'inline-flex';
          suggestionChip.setAttribute('data-category', suggestion.category);
        } else {
          suggestionChip.style.display = 'none';
        }
      } else {
        suggestionChip.style.display = 'none';
      }

      // 2. Duplicate Detection
      if (merchant && amount && parseFloat(amount) > 0) {
        const dupResult = SmartEngine.detectDuplicate(
          { id: TransactionsView.activeEditId, merchant, amount, date, type },
          store.getState().transactions
        );

        if (dupResult) {
          duplicateText.textContent = dupResult.message;
          duplicateBanner.style.display = 'flex';
        } else {
          duplicateBanner.style.display = 'none';
        }
      } else {
        duplicateBanner.style.display = 'none';
      }
    };

    merchantInput.addEventListener('input', checkSmartHelpers);
    amountInput.addEventListener('input', checkSmartHelpers);
    dateInput.addEventListener('change', checkSmartHelpers);

    // Apply suggestion chip click
    suggestionChip.addEventListener('click', () => {
      const suggestedCat = suggestionChip.getAttribute('data-category');
      if (suggestedCat) {
        catSelect.value = suggestedCat;
        suggestionChip.style.display = 'none';
        Toast.info(`Category set to ${suggestedCat}`);
      }
    });

    // Receipt File Handling
    if (receiptUploadArea && receiptInput) {
      receiptUploadArea.addEventListener('click', () => receiptInput.click());
      receiptInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            this.activeReceiptDataUrl = event.target.result;
            receiptThumb.src = this.activeReceiptDataUrl;
            receiptPreviewWrap.style.display = 'flex';
          };
          reader.readAsDataURL(file);
        }
      });
    }

    if (receiptRemoveBtn) {
      receiptRemoveBtn.addEventListener('click', () => {
        this.activeReceiptDataUrl = null;
        receiptInput.value = '';
        receiptThumb.src = '';
        receiptPreviewWrap.style.display = 'none';
      });
    }

    // Transaction Form Submit
    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const amountVal = parseFloat(amountInput.value);
      const merchantVal = merchantInput.value.trim();

      if (!merchantVal) {
        Toast.error('Please enter a merchant or payee name.');
        merchantInput.focus();
        return;
      }

      if (isNaN(amountVal) || amountVal <= 0) {
        Toast.error('Please enter a valid amount greater than 0.');
        amountInput.focus();
        return;
      }

      const txData = {
        type: form.getAttribute('data-type') || 'expense',
        amount: amountVal,
        merchant: merchantVal,
        category: catSelect.value,
        account: document.getElementById('modal-tx-account').value,
        date: dateInput.value,
        note: document.getElementById('modal-tx-note').value.trim(),
        receipt: this.activeReceiptDataUrl || TransactionsView.activeReceiptImage
      };

      if (TransactionsView.activeEditId) {
        store.updateTransaction(TransactionsView.activeEditId, txData);
        Toast.success('Transaction updated successfully.');
      } else {
        store.addTransaction(txData);
        Toast.success('Transaction recorded.');
      }

      Modal.close('dialog-transaction');
      this.renderCurrentView();
    });

    // Close buttons for transaction dialog
    document.querySelectorAll('.close-modal-tx').forEach(b => {
      b.addEventListener('click', () => Modal.close('dialog-transaction'));
    });
  }

  setupBudgetModalHandlers() {
    const form = document.getElementById('form-budget');
    const catSelect = document.getElementById('modal-budget-category');
    const limitInput = document.getElementById('modal-budget-limit');

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const cat = catSelect.value;
      const limit = parseFloat(limitInput.value);

      if (isNaN(limit) || limit < 0) {
        Toast.error('Please enter a valid budget limit amount.');
        limitInput.focus();
        return;
      }

      store.setBudget(cat, limit);
      Toast.success(`Monthly budget for ${cat} set to ${Formatters.currency(limit, store.getState().settings.currency)}.`);
      Modal.close('dialog-budget');
      this.renderCurrentView();
    });

    document.querySelectorAll('.close-modal-budget').forEach(b => {
      b.addEventListener('click', () => Modal.close('dialog-budget'));
    });
  }

  setupRecurringModalHandlers() {
    const form = document.getElementById('form-recurring');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('modal-rec-name').value.trim();
      const amount = parseFloat(document.getElementById('modal-rec-amount').value);
      const category = document.getElementById('modal-rec-category').value;
      const account = document.getElementById('modal-rec-account').value;
      const frequency = document.getElementById('modal-rec-frequency').value;
      const nextDueDate = document.getElementById('modal-rec-date').value;
      const type = document.getElementById('modal-rec-type').value;

      if (!name) {
        Toast.error('Please provide a name for this recurring commitment.');
        return;
      }

      if (isNaN(amount) || amount <= 0) {
        Toast.error('Please provide a valid amount.');
        return;
      }

      store.addRecurring({ name, amount, category, account, frequency, nextDueDate, type });
      Toast.success(`Scheduled recurring item "${name}".`);
      Modal.close('dialog-recurring');
      this.renderCurrentView();
    });

    document.querySelectorAll('.close-modal-rec').forEach(b => {
      b.addEventListener('click', () => Modal.close('dialog-recurring'));
    });

    // Close receipt viewer dialog
    document.querySelectorAll('.close-modal-receipt').forEach(b => {
      b.addEventListener('click', () => Modal.close('dialog-receipt-viewer'));
    });
  }

  setupGlobalShortcuts() {
    window.addEventListener('keydown', (e) => {
      // Don't trigger shortcuts if focus is in an input
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;

      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        TransactionsView.openTransactionModal(null, 'expense');
      }
    });
  }

  setupMobileMenu() {
    const toggle = document.querySelector('.mobile-menu-toggle');
    const sidebar = document.querySelector('.app-sidebar');
    const overlay = document.querySelector('.sidebar-overlay');

    if (toggle && sidebar && overlay) {
      toggle.addEventListener('click', () => {
        sidebar.classList.toggle('open');
        overlay.classList.toggle('active');
      });

      overlay.addEventListener('click', () => {
        sidebar.classList.remove('open');
        overlay.classList.remove('active');
      });
    }
  }
}

// Instantiate and boot app on DOM load
window.addEventListener('DOMContentLoaded', () => {
  const app = new App();
  app.init();
});
