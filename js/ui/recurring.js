/**
 * Smart Expense Tracker - Recurring Transactions & Bill Reminders View
 */

import { store, CATEGORIES, ACCOUNTS } from '../store.js';
import { Formatters } from '../formatters.js';
import { Modal } from './modal.js';
import { Toast } from './toast.js';

export const RecurringView = {
  render() {
    const container = document.getElementById('view-recurring');
    if (!container) return;

    const state = store.getState();
    const { recurring, settings } = state;
    const currency = settings.currency;
    const now = new Date();

    const monthlyCommitment = recurring
      .filter(r => r.type === 'expense')
      .reduce((sum, r) => {
        let monthly = r.amount;
        if (r.frequency === 'weekly') monthly = r.amount * 4.33;
        else if (r.frequency === 'biweekly') monthly = r.amount * 2.16;
        else if (r.frequency === 'yearly') monthly = r.amount / 12;
        return sum + monthly;
      }, 0);

    const upcoming7Days = recurring.filter(r => {
      const diff = Math.ceil((new Date(r.nextDueDate) - now) / (1000 * 60 * 60 * 24));
      return diff >= 0 && diff <= 7;
    });

    const totalUpcoming7 = upcoming7Days.reduce((s, r) => s + r.amount, 0);

    container.innerHTML = `
      <div class="page-header">
        <div class="page-title-wrap">
          <h1>Recurring Transactions & Bills</h1>
          <p class="page-subtitle">Track subscriptions, scheduled invoices, and upcoming due dates</p>
        </div>
        <button class="btn btn-primary" id="btn-add-recurring">
          <span>+</span> Add Recurring Item
        </button>
      </div>

      <!-- Overview Cards -->
      <div class="metrics-grid">
        <div class="metric-card metric-expense">
          <span class="metric-label">Estimated Monthly Fixed</span>
          <div class="metric-value">${Formatters.currency(monthlyCommitment, currency)}</div>
          <span class="metric-footer">Across ${recurring.filter(r => r.type === 'expense').length} scheduled expenses</span>
        </div>

        <div class="metric-card metric-budget">
          <span class="metric-label">Due in Next 7 Days</span>
          <div class="metric-value">${Formatters.currency(totalUpcoming7, currency)}</div>
          <span class="metric-footer">${upcoming7Days.length} items requiring upcoming cash</span>
        </div>

        <div class="metric-card metric-income">
          <span class="metric-label">Scheduled Subscriptions</span>
          <div class="metric-value">${recurring.length}</div>
          <span class="metric-footer">Active automated commitments</span>
        </div>
      </div>

      <!-- Bills List -->
      ${recurring.length === 0 ? `
        <div class="card empty-state">
          <div class="empty-state-icon">📅</div>
          <div class="empty-state-title">No recurring bills added</div>
          <p class="empty-state-desc">Keep track of rent, subscriptions, utility bills, and salary schedules here.</p>
          <button class="btn btn-primary btn-sm" id="btn-empty-add-recurring">+ Add Recurring Bill</button>
        </div>
      ` : `
        <div class="bills-list">
          ${recurring.map(bill => {
            const cat = CATEGORIES.find(c => c.name === bill.category) || { icon: '✨' };
            const diffDays = Math.ceil((new Date(bill.nextDueDate) - now) / (1000 * 60 * 60 * 24));

            let statusBadge = '';
            if (diffDays < 0) {
              statusBadge = `<span class="badge badge-negative">${Math.abs(diffDays)} days overdue</span>`;
            } else if (diffDays === 0) {
              statusBadge = `<span class="badge badge-negative">Due Today</span>`;
            } else if (diffDays <= 3) {
              statusBadge = `<span class="badge badge-warning">Due in ${diffDays} days</span>`;
            } else {
              statusBadge = `<span class="badge badge-neutral">Due in ${diffDays} days</span>`;
            }

            return `
              <div class="bill-item">
                <div class="bill-info">
                  <div class="bill-icon" aria-hidden="true">${cat.icon}</div>
                  <div class="bill-meta">
                    <div style="display: flex; align-items: center; gap: var(--space-xs);">
                      <span class="bill-name">${bill.name}</span>
                      <span class="badge badge-neutral" style="text-transform: capitalize;">${bill.frequency}</span>
                    </div>
                    <span class="bill-due-date">
                      Next Due: <strong>${Formatters.date(bill.nextDueDate, settings.dateFormat)}</strong> • Account: ${bill.account}
                    </span>
                  </div>
                </div>

                <div class="bill-right">
                  <div style="text-align: right;">
                    <div class="tx-amount ${bill.type === 'income' ? 'tx-income' : 'tx-expense'}">
                      ${bill.type === 'income' ? '+' : '-'}${Formatters.currency(bill.amount, currency)}
                    </div>
                    <div style="margin-top: 4px;">${statusBadge}</div>
                  </div>

                  <div style="display: flex; align-items: center; gap: var(--space-xs);">
                    <button class="btn btn-secondary btn-sm btn-mark-paid" data-id="${bill.id}">
                      ✓ Mark Paid
                    </button>
                    <button class="btn-icon btn-del-bill" data-id="${bill.id}" aria-label="Delete recurring item" title="Delete" style="color: var(--color-expense);">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                    </button>
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `}
    `;

    this.attachEvents();
  },

  attachEvents() {
    const addBtn = document.getElementById('btn-add-recurring');
    if (addBtn) {
      addBtn.addEventListener('click', () => this.openRecurringModal());
    }

    const emptyAddBtn = document.getElementById('btn-empty-add-recurring');
    if (emptyAddBtn) {
      emptyAddBtn.addEventListener('click', () => this.openRecurringModal());
    }

    // Mark paid buttons
    const markPaidBtns = document.querySelectorAll('.btn-mark-paid');
    markPaidBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        store.markRecurringPaid(id);
        Toast.success('Recorded payment and moved next billing cycle forward.');
        this.render();
      });
    });

    // Delete buttons
    const delBtns = document.querySelectorAll('.btn-del-bill');
    delBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        if (confirm('Delete this recurring subscription/bill?')) {
          store.deleteRecurring(id);
          Toast.success('Recurring item removed.');
          this.render();
        }
      });
    });
  },

  openRecurringModal() {
    const form = document.getElementById('form-recurring');
    const catSelect = document.getElementById('modal-rec-category');
    const accSelect = document.getElementById('modal-rec-account');
    const dateInput = document.getElementById('modal-rec-date');

    form.reset();
    catSelect.innerHTML = CATEGORIES.map(c => `<option value="${c.name}">${c.icon} ${c.name}</option>`).join('');
    accSelect.innerHTML = ACCOUNTS.map(a => `<option value="${a.name}">${a.name}</option>`).join('');
    dateInput.value = new Date().toISOString().split('T')[0];

    Modal.open('dialog-recurring');
  }
};
