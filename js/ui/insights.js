/**
 * Smart Expense Tracker - Smart Insights & Anomaly Analysis View
 */

import { store } from '../store.js';
import { Formatters } from '../formatters.js';
import { SmartEngine } from '../smart-engine.js';

export const InsightsView = {
  render() {
    const container = document.getElementById('view-insights');
    if (!container) return;

    const state = store.getState();
    const { transactions, settings } = state;
    const currency = settings.currency;

    const insights = SmartEngine.generateInsights(state);
    const anomalies = SmartEngine.findUnusualSpending(transactions);
    const duplicates = SmartEngine.findDuplicatePairs(transactions);

    container.innerHTML = `
      <div class="page-header">
        <div class="page-title-wrap">
          <h1>Smart Financial Insights</h1>
          <p class="page-subtitle">Algorithmic spending diagnostics, anomaly detections, and savings coaching</p>
        </div>
      </div>

      <!-- Main Actionable Insights Cards Grid -->
      <div style="display: flex; flex-direction: column; gap: var(--space-md); margin-bottom: var(--space-xl);">
        ${insights.map(item => `
          <div class="card" style="border-left: 4px solid ${item.type === 'warning' ? 'var(--color-warning)' : item.type === 'success' ? 'var(--color-income)' : 'var(--color-primary)'};">
            <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: var(--space-md); flex-wrap: wrap;">
              <div style="display: flex; gap: var(--space-md); align-items: flex-start;">
                <div class="insight-icon" style="background: ${item.type === 'warning' ? 'var(--color-warning-light)' : item.type === 'success' ? 'var(--color-income-light)' : 'var(--color-primary-light)'}; color: ${item.type === 'warning' ? 'var(--color-warning)' : item.type === 'success' ? 'var(--color-income)' : 'var(--color-primary)'};" aria-hidden="true">
                  ${item.icon}
                </div>
                <div>
                  <h2 class="card-title" style="font-size: 1.0625rem; margin-bottom: 4px;">${item.title}</h2>
                  <p style="font-size: 0.875rem; color: var(--text-secondary); max-width: 640px;">${item.message}</p>
                </div>
              </div>
              <button class="btn btn-secondary btn-sm insight-nav-btn" data-target="${item.targetView}">
                ${item.actionLabel} &rarr;
              </button>
            </div>
          </div>
        `).join('')}
      </div>

      <!-- Notable Unusual Spending Section -->
      <div class="card" style="margin-bottom: var(--space-xl);">
        <div class="card-header">
          <div>
            <h2 class="card-title">🔍 Unusual Spending Diagnostics</h2>
            <span class="card-subtitle">Transactions that significantly deviate from your historical average</span>
          </div>
        </div>

        ${anomalies.length === 0 ? `
          <div class="empty-state" style="padding: var(--space-lg);">
            <div class="empty-state-icon" style="width: 44px; height: 44px;">✨</div>
            <div class="empty-state-title" style="font-size: 1rem;">No unusual outliers detected</div>
            <p class="empty-state-desc" style="font-size: 0.8125rem;">All your transactions match expected historical category baselines.</p>
          </div>
        ` : `
          <div class="table-container" style="border: none; box-shadow: none;">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Transaction</th>
                  <th>Category</th>
                  <th>Amount</th>
                  <th>Diagnosis & Explanation</th>
                </tr>
              </thead>
              <tbody>
                ${anomalies.map(a => `
                  <tr>
                    <td><strong>${a.transaction.merchant}</strong><br><span style="font-size: 0.75rem; color: var(--text-muted);">${Formatters.date(a.transaction.date, settings.dateFormat)}</span></td>
                    <td><span class="badge-category">${a.transaction.category}</span></td>
                    <td><strong style="color: var(--color-expense);">${Formatters.currency(a.transaction.amount, currency)}</strong></td>
                    <td style="color: var(--text-secondary); font-size: 0.8125rem;">
                      ${a.reason}
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `}
      </div>

      <!-- Duplicate Detection Audit Section -->
      <div class="card">
        <div class="card-header">
          <div>
            <h2 class="card-title">⚠️ Duplicate Charges Audit</h2>
            <span class="card-subtitle">Matching merchant, amount, and date proximity within 3 days</span>
          </div>
        </div>

        ${duplicates.length === 0 ? `
          <div class="empty-state" style="padding: var(--space-lg);">
            <div class="empty-state-icon" style="width: 44px; height: 44px;">🛡️</div>
            <div class="empty-state-title" style="font-size: 1rem;">No duplicates found</div>
            <p class="empty-state-desc" style="font-size: 0.8125rem;">Your transaction ledger is clean with no repeated charges identified.</p>
          </div>
        ` : `
          <div class="table-container" style="border: none; box-shadow: none;">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Merchant</th>
                  <th>Amount</th>
                  <th>Transaction A Date</th>
                  <th>Transaction B Date</th>
                  <th style="text-align: right;">Action</th>
                </tr>
              </thead>
              <tbody>
                ${duplicates.map(d => `
                  <tr>
                    <td><strong>${d.txA.merchant}</strong></td>
                    <td><strong style="color: var(--color-expense);">${Formatters.currency(d.txA.amount, currency)}</strong></td>
                    <td>${Formatters.date(d.txA.date, settings.dateFormat)}</td>
                    <td>${Formatters.date(d.txB.date, settings.dateFormat)}</td>
                    <td style="text-align: right;">
                      <button class="btn btn-outline btn-sm btn-view-dup-tx" data-merchant="${d.txA.merchant}">
                        Inspect in Ledger &rarr;
                      </button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `}
      </div>
    `;

    this.attachEvents();
  },

  attachEvents() {
    const navButtons = document.querySelectorAll('.insight-nav-btn');
    navButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const target = btn.getAttribute('data-target');
        if (target === 'modal_add') {
          window.dispatchEvent(new CustomEvent('app:open-add-modal', { detail: { type: 'expense' } }));
        } else if (target) {
          window.dispatchEvent(new CustomEvent('app:navigate', { detail: target }));
        }
      });
    });

    const dupButtons = document.querySelectorAll('.btn-view-dup-tx');
    dupButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const merchant = btn.getAttribute('data-merchant');
        window.dispatchEvent(new CustomEvent('app:navigate', { detail: 'transactions' }));
        setTimeout(() => {
          const searchInput = document.getElementById('tx-search-input');
          if (searchInput) {
            searchInput.value = merchant;
            searchInput.dispatchEvent(new Event('input'));
          }
        }, 100);
      });
    });
  }
};
