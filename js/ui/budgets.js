/**
 * Smart Expense Tracker - Budgets View & Allocation Manager
 */

import { store, CATEGORIES } from '../store.js';
import { Formatters } from '../formatters.js';
import { Modal } from './modal.js';
import { Toast } from './toast.js';

export const BudgetsView = {
  render() {
    const container = document.getElementById('view-budgets');
    if (!container) return;

    const state = store.getState();
    const { transactions, budgets, settings } = state;
    const currency = settings.currency;

    const now = new Date();
    const curMonth = now.getMonth();
    const curYear = now.getFullYear();

    // Days remaining in current month
    const totalDaysInMonth = new Date(curYear, curMonth + 1, 0).getDate();
    const daysLeft = Math.max(1, totalDaysInMonth - now.getDate());

    // Current month expenses
    const curExpenses = transactions.filter(t => {
      const d = new Date(t.date);
      return t.type === 'expense' && d.getMonth() === curMonth && d.getFullYear() === curYear;
    });

    const totalSpent = curExpenses.reduce((s, t) => s + t.amount, 0);
    const totalLimit = budgets.reduce((s, b) => s + b.monthlyLimit, 0);
    const overallRemaining = totalLimit - totalSpent;
    const overallPct = totalLimit > 0 ? Math.round((totalSpent / totalLimit) * 100) : 0;
    const dailySafeSpend = overallRemaining > 0 ? overallRemaining / daysLeft : 0;

    // Map spending per category
    const categorySpendMap = {};
    curExpenses.forEach(t => {
      categorySpendMap[t.category] = (categorySpendMap[t.category] || 0) + t.amount;
    });

    container.innerHTML = `
      <div class="page-header">
        <div class="page-title-wrap">
          <h1>Monthly Budgets</h1>
          <p class="page-subtitle">Set category boundaries and stay proactive about discretionary pacing</p>
        </div>
        <button class="btn btn-primary" id="btn-add-budget">
          <span>+</span> Set Category Budget
        </button>
      </div>

      <!-- Hero Summary Card -->
      <div class="budget-hero-card">
        <div class="card-header" style="margin-bottom: var(--space-sm);">
          <div>
            <h2 class="card-title">${Formatters.monthYear(now)} Budget Envelope</h2>
            <span class="card-subtitle">${daysLeft} days remaining in this billing cycle</span>
          </div>
          <span class="badge ${overallPct >= 100 ? 'badge-negative' : overallPct >= 80 ? 'badge-warning' : 'badge-positive'}" style="font-size: 0.8125rem; padding: 4px 10px;">
            ${overallPct}% Allocated
          </span>
        </div>

        <div class="progress-track" style="height: 12px; margin: var(--space-md) 0;">
          <div class="progress-fill ${overallPct >= 100 ? 'fill-danger' : overallPct >= 80 ? 'fill-warning' : 'fill-safe'}" style="width: ${Math.min(overallPct, 100)}%;"></div>
        </div>

        <div class="budget-hero-grid">
          <div>
            <div class="metric-label">Total Spent</div>
            <div class="metric-value" style="font-size: 1.5rem; color: var(--color-expense);">
              ${Formatters.currency(totalSpent, currency)}
            </div>
          </div>
          <div>
            <div class="metric-label">Total Allocated Limit</div>
            <div class="metric-value" style="font-size: 1.5rem; color: var(--text-primary);">
              ${Formatters.currency(totalLimit, currency)}
            </div>
          </div>
          <div>
            <div class="metric-label">Safe Daily Allowance</div>
            <div class="metric-value" style="font-size: 1.5rem; color: ${overallRemaining >= 0 ? 'var(--color-income)' : 'var(--color-expense)'};">
              ${Formatters.currency(dailySafeSpend, currency)}<span style="font-size: 0.875rem; color: var(--text-muted);">/day</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Category Budget Cards Grid -->
      <div class="budget-cards-grid">
        ${budgets.map(b => {
          const spent = categorySpendMap[b.category] || 0;
          const limit = b.monthlyLimit;
          const remaining = limit - spent;
          const pct = limit > 0 ? Math.round((spent / limit) * 100) : 0;
          const cat = CATEGORIES.find(c => c.name === b.category) || { icon: '✨' };

          let statusBadge = '';
          let fillClass = 'fill-safe';

          if (pct >= 100) {
            fillClass = 'fill-danger';
            statusBadge = `<span class="badge badge-negative">Exceeded by ${Formatters.currency(Math.abs(remaining), currency)}</span>`;
          } else if (pct >= 80) {
            fillClass = 'fill-warning';
            statusBadge = `<span class="badge badge-warning">${pct}% used</span>`;
          } else {
            statusBadge = `<span class="badge badge-positive">${Formatters.currency(remaining, currency)} left</span>`;
          }

          return `
            <div class="budget-card">
              <div class="budget-card-header">
                <div class="budget-cat-info">
                  <div class="tx-category-icon" aria-hidden="true">${cat.icon}</div>
                  <div>
                    <strong style="font-size: 1rem; color: var(--text-primary);">${b.category}</strong>
                  </div>
                </div>
                ${statusBadge}
              </div>

              <div class="budget-numbers">
                <span class="budget-spent-val">${Formatters.currency(spent, currency)}</span>
                <span class="budget-limit-val">of ${Formatters.currency(limit, currency)}</span>
              </div>

              <div class="progress-track">
                <div class="progress-fill ${fillClass}" style="width: ${Math.min(pct, 100)}%;"></div>
              </div>

              <div class="budget-footer">
                <span>${pct}% used</span>
                <div style="display: flex; gap: 4px;">
                  <button class="btn btn-ghost btn-sm btn-edit-budget" data-category="${b.category}" data-limit="${b.monthlyLimit}">
                    Edit
                  </button>
                  <button class="btn btn-ghost btn-sm btn-del-budget" data-id="${b.id}" style="color: var(--color-expense);">
                    Remove
                  </button>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;

    this.attachEvents();
  },

  attachEvents() {
    // Add budget button
    const addBtn = document.getElementById('btn-add-budget');
    if (addBtn) {
      addBtn.addEventListener('click', () => this.openBudgetModal());
    }

    // Edit budget buttons
    const editBtns = document.querySelectorAll('.btn-edit-budget');
    editBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const cat = btn.getAttribute('data-category');
        const limit = btn.getAttribute('data-limit');
        this.openBudgetModal(cat, limit);
      });
    });

    // Delete budget buttons
    const delBtns = document.querySelectorAll('.btn-del-budget');
    delBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        if (confirm('Are you sure you want to delete this category budget limit?')) {
          store.deleteBudget(id);
          Toast.success('Budget removed.');
          this.render();
        }
      });
    });
  },

  openBudgetModal(category = null, limit = '') {
    const catSelect = document.getElementById('modal-budget-category');
    const limitInput = document.getElementById('modal-budget-limit');

    // Populate category dropdown with expense categories
    const expenseCategories = CATEGORIES.filter(c => c.id !== 'income_salary');
    catSelect.innerHTML = expenseCategories.map(c => `
      <option value="${c.name}" ${category === c.name ? 'selected' : ''}>${c.icon} ${c.name}</option>
    `).join('');

    limitInput.value = limit || '';
    Modal.open('dialog-budget');
  }
};
