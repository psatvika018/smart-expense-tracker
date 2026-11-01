/**
 * Smart Expense Tracker - Transactions View & Ledger Controller
 */

import { store, CATEGORIES, ACCOUNTS } from '../store.js';
import { Formatters } from '../formatters.js';
import { SmartEngine } from '../smart-engine.js';
import { Modal } from './modal.js';
import { Toast } from './toast.js';

export const TransactionsView = {
  filters: {
    search: '',
    type: 'all',
    category: 'all',
    account: 'all',
    dateRange: 'this_month',
    sortBy: 'date_desc'
  },

  activeEditId: null,
  activeReceiptImage: null,

  render() {
    const container = document.getElementById('view-transactions');
    if (!container) return;

    const state = store.getState();
    const { transactions, settings } = state;
    const currency = settings.currency;

    const filtered = this.getFilteredTransactions(transactions);
    const duplicatePairs = SmartEngine.findDuplicatePairs(transactions);

    // Compute total filtered sum (income - expense or expense total)
    const filteredExpenseTotal = filtered.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const filteredIncomeTotal = filtered.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);

    container.innerHTML = `
      <div class="page-header">
        <div class="page-title-wrap">
          <h1>Transactions Ledger</h1>
          <p class="page-subtitle">Search, filter, categorize, and audit your expense activity</p>
        </div>
        <div>
          <button class="btn btn-primary" id="tx-btn-new">
            <span>+</span> Add Transaction
          </button>
        </div>
      </div>

      <!-- Duplicate Transactions Alert Banner (if any detected) -->
      ${duplicatePairs.length > 0 ? `
        <div class="duplicate-alert-banner" style="background: rgba(245, 158, 11, 0.12); border-color: rgba(245, 158, 11, 0.35); margin-bottom: var(--space-lg);">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          <div style="flex: 1;">
            <strong>Possible Duplicate Transactions Detected</strong>
            <div style="font-size: 0.8125rem; color: var(--text-secondary); margin-top: 2px;">
              Smart engine found ${duplicatePairs.length} potential duplicate pair(s) matching by merchant, amount, and date.
            </div>
          </div>
          <button class="btn btn-secondary btn-sm" id="btn-show-duplicates-only">
            Inspect Duplicates
          </button>
        </div>
      ` : ''}

      <!-- Filter & Search Toolbar -->
      <div class="filter-toolbar">
        <div class="search-input-wrap">
          <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          <input type="text" class="input" id="tx-search-input" placeholder="Search merchant, category, notes..." value="${this.filters.search}">
        </div>

        <!-- Type Segmented Tabs -->
        <div class="segmented-control" style="max-width: 260px;">
          <button type="button" class="segmented-option ${this.filters.type === 'all' ? 'active' : ''}" data-type="all">All</button>
          <button type="button" class="segmented-option ${this.filters.type === 'expense' ? 'active' : ''}" data-type="expense">Expenses</button>
          <button type="button" class="segmented-option ${this.filters.type === 'income' ? 'active' : ''}" data-type="income">Income</button>
        </div>

        <!-- Category Filter -->
        <select class="select filter-select" id="tx-filter-category" aria-label="Filter by category">
          <option value="all">All Categories</option>
          ${CATEGORIES.map(c => `
            <option value="${c.name}" ${this.filters.category === c.name ? 'selected' : ''}>${c.icon} ${c.name}</option>
          `).join('')}
        </select>

        <!-- Account Filter -->
        <select class="select filter-select" id="tx-filter-account" aria-label="Filter by account">
          <option value="all">All Accounts</option>
          ${ACCOUNTS.map(a => `
            <option value="${a.name}" ${this.filters.account === a.name ? 'selected' : ''}>${a.name}</option>
          `).join('')}
        </select>

        <!-- Date Range Filter -->
        <select class="select filter-select" id="tx-filter-date" aria-label="Filter by date range">
          <option value="all" ${this.filters.dateRange === 'all' ? 'selected' : ''}>All Time</option>
          <option value="this_month" ${this.filters.dateRange === 'this_month' ? 'selected' : ''}>This Month</option>
          <option value="last_month" ${this.filters.dateRange === 'last_month' ? 'selected' : ''}>Last Month</option>
          <option value="last_90" ${this.filters.dateRange === 'last_90' ? 'selected' : ''}>Last 90 Days</option>
        </select>

        <!-- Sort Filter -->
        <select class="select filter-select" id="tx-filter-sort" aria-label="Sort transactions">
          <option value="date_desc" ${this.filters.sortBy === 'date_desc' ? 'selected' : ''}>Date (Newest)</option>
          <option value="date_asc" ${this.filters.sortBy === 'date_asc' ? 'selected' : ''}>Date (Oldest)</option>
          <option value="amount_desc" ${this.filters.sortBy === 'amount_desc' ? 'selected' : ''}>Amount (Highest)</option>
          <option value="amount_asc" ${this.filters.sortBy === 'amount_asc' ? 'selected' : ''}>Amount (Lowest)</option>
          <option value="merchant_asc" ${this.filters.sortBy === 'merchant_asc' ? 'selected' : ''}>Merchant (A-Z)</option>
        </select>
      </div>

      <!-- Summary Info Bar -->
      <div class="transactions-summary-bar">
        <span>Showing <strong>${filtered.length}</strong> of ${transactions.length} entries</span>
        <div style="display: flex; gap: var(--space-md);">
          <span>Expenses: <strong style="color: var(--color-expense);">${Formatters.currency(filteredExpenseTotal, currency)}</strong></span>
          ${filteredIncomeTotal > 0 ? `<span>Income: <strong style="color: var(--color-income);">${Formatters.currency(filteredIncomeTotal, currency)}</strong></span>` : ''}
        </div>
      </div>

      <!-- Transactions List / Table -->
      ${filtered.length === 0 ? `
        <div class="card empty-state">
          <div class="empty-state-icon">🔍</div>
          <div class="empty-state-title">No transactions found</div>
          <p class="empty-state-desc">No entries match your search criteria or active filters. Try resetting the filters or adding a new transaction.</p>
          <button class="btn btn-secondary btn-sm" id="tx-btn-reset-filters">Reset All Filters</button>
        </div>
      ` : `
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th style="width: 50px;"></th>
                <th>Merchant / Details</th>
                <th>Category</th>
                <th>Account</th>
                <th>Date</th>
                <th style="text-align: right;">Amount</th>
                <th style="text-align: right; width: 100px;">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${filtered.map(tx => {
                const cat = CATEGORIES.find(c => c.name === tx.category) || { icon: '✨', name: tx.category };
                return `
                  <tr data-id="${tx.id}">
                    <td style="padding-right: 0;">
                      <div class="tx-category-icon" aria-hidden="true">${cat.icon}</div>
                    </td>
                    <td>
                      <div class="tx-details">
                        <div style="display: flex; align-items: center; gap: 6px;">
                          <span class="tx-merchant-name">${tx.merchant}</span>
                          ${tx.receipt ? `<button type="button" class="btn-ghost btn-sm tx-view-receipt-btn" data-id="${tx.id}" title="View Receipt" style="padding: 0 4px; font-size: 13px;">📎</button>` : ''}
                        </div>
                        ${tx.note ? `<span class="tx-note">${tx.note}</span>` : ''}
                      </div>
                    </td>
                    <td>
                      <span class="badge-category">${cat.icon} ${tx.category}</span>
                    </td>
                    <td>
                      <span class="badge badge-neutral">${tx.account}</span>
                    </td>
                    <td style="color: var(--text-secondary); font-size: 0.8125rem;">
                      ${Formatters.date(tx.date, settings.dateFormat)}
                    </td>
                    <td style="text-align: right;">
                      <span class="tx-amount ${tx.type === 'income' ? 'tx-income' : 'tx-expense'}">
                        ${tx.type === 'income' ? '+' : '-'}${Formatters.currency(tx.amount, currency)}
                      </span>
                    </td>
                    <td>
                      <div class="row-actions">
                        <button type="button" class="btn-icon tx-edit-btn" data-id="${tx.id}" aria-label="Edit transaction" title="Edit">
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                        </button>
                        <button type="button" class="btn-icon tx-delete-btn" data-id="${tx.id}" aria-label="Delete transaction" title="Delete" style="color: var(--color-expense);">
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      `}
    `;

    this.attachEvents();
  },

  getFilteredTransactions(transactions) {
    const { search, type, category, account, dateRange, sortBy } = this.filters;
    const now = new Date();
    const curMonth = now.getMonth();
    const curYear = now.getFullYear();

    return transactions.filter(t => {
      // Search filter
      if (search) {
        const query = search.toLowerCase();
        const match = t.merchant.toLowerCase().includes(query) ||
                      t.category.toLowerCase().includes(query) ||
                      (t.note && t.note.toLowerCase().includes(query)) ||
                      t.account.toLowerCase().includes(query);
        if (!match) return false;
      }

      // Type filter
      if (type !== 'all' && t.type !== type) return false;

      // Category filter
      if (category !== 'all' && t.category !== category) return false;

      // Account filter
      if (account !== 'all' && t.account !== account) return false;

      // Date range filter
      if (dateRange === 'this_month') {
        const d = new Date(t.date);
        if (d.getMonth() !== curMonth || d.getFullYear() !== curYear) return false;
      } else if (dateRange === 'last_month') {
        const d = new Date(t.date);
        const prevMonth = curMonth === 0 ? 11 : curMonth - 1;
        const prevYear = curMonth === 0 ? curYear - 1 : curYear;
        if (d.getMonth() !== prevMonth || d.getFullYear() !== prevYear) return false;
      } else if (dateRange === 'last_90') {
        const d = new Date(t.date);
        const diffDays = (now - d) / (1000 * 60 * 60 * 24);
        if (diffDays > 90) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'date_desc') return new Date(b.date) - new Date(a.date);
      if (sortBy === 'date_asc') return new Date(a.date) - new Date(b.date);
      if (sortBy === 'amount_desc') return b.amount - a.amount;
      if (sortBy === 'amount_asc') return a.amount - b.amount;
      if (sortBy === 'merchant_asc') return a.merchant.localeCompare(b.merchant);
      return 0;
    });
  },

  attachEvents() {
    // New transaction button
    const newBtn = document.getElementById('tx-btn-new');
    if (newBtn) {
      newBtn.addEventListener('click', () => this.openTransactionModal());
    }

    // Reset filters
    const resetBtn = document.getElementById('tx-btn-reset-filters');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        this.filters = {
          search: '',
          type: 'all',
          category: 'all',
          account: 'all',
          dateRange: 'all',
          sortBy: 'date_desc'
        };
        this.render();
      });
    }

    // Show duplicates filter
    const showDupsBtn = document.getElementById('btn-show-duplicates-only');
    if (showDupsBtn) {
      showDupsBtn.addEventListener('click', () => {
        const pairs = SmartEngine.findDuplicatePairs(store.getState().transactions);
        if (pairs.length > 0) {
          this.filters.search = pairs[0].txA.merchant;
          this.render();
          Toast.info(`Filtered by "${pairs[0].txA.merchant}" to compare potential duplicate charges.`);
        }
      });
    }

    // Search input
    const searchInput = document.getElementById('tx-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.filters.search = e.target.value;
        this.render();
      });
    }

    // Type pills
    const typeButtons = document.querySelectorAll('.filter-toolbar .segmented-option');
    typeButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        this.filters.type = btn.getAttribute('data-type');
        this.render();
      });
    });

    // Dropdowns
    const catSelect = document.getElementById('tx-filter-category');
    if (catSelect) {
      catSelect.addEventListener('change', (e) => {
        this.filters.category = e.target.value;
        this.render();
      });
    }

    const accSelect = document.getElementById('tx-filter-account');
    if (accSelect) {
      accSelect.addEventListener('change', (e) => {
        this.filters.account = e.target.value;
        this.render();
      });
    }

    const dateSelect = document.getElementById('tx-filter-date');
    if (dateSelect) {
      dateSelect.addEventListener('change', (e) => {
        this.filters.dateRange = e.target.value;
        this.render();
      });
    }

    const sortSelect = document.getElementById('tx-filter-sort');
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        this.filters.sortBy = e.target.value;
        this.render();
      });
    }

    // Edit transaction buttons
    const editButtons = document.querySelectorAll('.tx-edit-btn');
    editButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        this.openTransactionModal(id);
      });
    });

    // Delete transaction buttons
    const deleteButtons = document.querySelectorAll('.tx-delete-btn');
    deleteButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        this.confirmDelete(id);
      });
    });

    // View receipt buttons
    const receiptButtons = document.querySelectorAll('.tx-view-receipt-btn');
    receiptButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        this.viewReceipt(id);
      });
    });
  },

  openTransactionModal(editId = null, prefillType = 'expense') {
    this.activeEditId = editId;
    this.activeReceiptImage = null;

    const modalTitle = document.getElementById('modal-tx-title');
    const form = document.getElementById('form-transaction');
    const typeExpBtn = document.getElementById('modal-type-expense');
    const typeIncBtn = document.getElementById('modal-type-income');
    const amountInput = document.getElementById('modal-tx-amount');
    const merchantInput = document.getElementById('modal-tx-merchant');
    const catSelect = document.getElementById('modal-tx-category');
    const accSelect = document.getElementById('modal-tx-account');
    const dateInput = document.getElementById('modal-tx-date');
    const noteInput = document.getElementById('modal-tx-note');
    const duplicateBanner = document.getElementById('modal-duplicate-banner');
    const suggestionChip = document.getElementById('modal-suggestion-chip');
    const receiptPreviewWrap = document.getElementById('modal-receipt-preview-wrap');
    const receiptThumb = document.getElementById('modal-receipt-thumb');

    // Reset states
    duplicateBanner.style.display = 'none';
    suggestionChip.style.display = 'none';
    receiptPreviewWrap.style.display = 'none';
    receiptThumb.src = '';
    form.reset();

    // Populate category dropdown
    catSelect.innerHTML = CATEGORIES.map(c => `<option value="${c.name}">${c.icon} ${c.name}</option>`).join('');

    // Populate account dropdown
    accSelect.innerHTML = ACCOUNTS.map(a => `<option value="${a.name}">${a.name}</option>`).join('');

    if (editId) {
      modalTitle.textContent = 'Edit Transaction';
      const tx = store.getState().transactions.find(t => t.id === editId);
      if (tx) {
        amountInput.value = tx.amount;
        merchantInput.value = tx.merchant;
        catSelect.value = tx.category;
        accSelect.value = tx.account;
        dateInput.value = tx.date;
        noteInput.value = tx.note || '';

        if (tx.type === 'income') {
          typeIncBtn.classList.add('active-income');
          typeExpBtn.classList.remove('active-expense');
          form.setAttribute('data-type', 'income');
        } else {
          typeExpBtn.classList.add('active-expense');
          typeIncBtn.classList.remove('active-income');
          form.setAttribute('data-type', 'expense');
        }

        if (tx.receipt) {
          this.activeReceiptImage = tx.receipt;
          receiptThumb.src = tx.receipt;
          receiptPreviewWrap.style.display = 'flex';
        }
      }
    } else {
      modalTitle.textContent = 'Add Transaction';
      dateInput.value = new Date().toISOString().split('T')[0];
      if (prefillType === 'income') {
        typeIncBtn.classList.add('active-income');
        typeExpBtn.classList.remove('active-expense');
        form.setAttribute('data-type', 'income');
      } else {
        typeExpBtn.classList.add('active-expense');
        typeIncBtn.classList.remove('active-income');
        form.setAttribute('data-type', 'expense');
      }
    }

    Modal.open('dialog-transaction');
  },

  confirmDelete(id) {
    const tx = store.getState().transactions.find(t => t.id === id);
    if (!tx) return;

    if (confirm(`Are you sure you want to delete the transaction "${tx.merchant}" (${Formatters.currency(tx.amount, store.getState().settings.currency)})?`)) {
      store.deleteTransaction(id);
      Toast.success('Transaction removed successfully.');
      this.render();
    }
  },

  viewReceipt(id) {
    const tx = store.getState().transactions.find(t => t.id === id);
    if (!tx || !tx.receipt) return;

    const img = document.getElementById('receipt-modal-img');
    const label = document.getElementById('receipt-modal-title');
    if (img && label) {
      img.src = tx.receipt;
      label.textContent = `Receipt: ${tx.merchant} (${Formatters.date(tx.date)})`;
      Modal.open('dialog-receipt-viewer');
    }
  }
};
