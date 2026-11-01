/**
 * Smart Expense Tracker - Dashboard View
 */

import { store, CATEGORIES } from '../store.js';
import { Formatters } from '../formatters.js';
import { SmartEngine } from '../smart-engine.js';
import { Charts } from '../charts.js';

export const DashboardView = {
  render() {
    const container = document.getElementById('view-dashboard');
    if (!container) return;

    const state = store.getState();
    const { transactions, budgets, recurring, settings } = state;
    const currency = settings.currency;

    const now = new Date();
    const curMonth = now.getMonth();
    const curYear = now.getFullYear();

    // Current month transactions
    const curExpenses = transactions.filter(t => {
      const d = new Date(t.date);
      return t.type === 'expense' && d.getMonth() === curMonth && d.getFullYear() === curYear;
    });

    const curIncome = transactions.filter(t => {
      const d = new Date(t.date);
      return t.type === 'income' && d.getMonth() === curMonth && d.getFullYear() === curYear;
    });

    // Previous month transactions (for MoM delta)
    const prevMonth = curMonth === 0 ? 11 : curMonth - 1;
    const prevYear = curMonth === 0 ? curYear - 1 : curYear;

    const prevExpenses = transactions.filter(t => {
      const d = new Date(t.date);
      return t.type === 'expense' && d.getMonth() === prevMonth && d.getFullYear() === prevYear;
    });

    const prevIncome = transactions.filter(t => {
      const d = new Date(t.date);
      return t.type === 'income' && d.getMonth() === prevMonth && d.getFullYear() === prevYear;
    });

    // Totals
    const totalSpent = curExpenses.reduce((sum, t) => sum + t.amount, 0);
    const totalIncome = curIncome.reduce((sum, t) => sum + t.amount, 0);
    const netSavings = totalIncome - totalSpent;

    const prevTotalSpent = prevExpenses.reduce((sum, t) => sum + t.amount, 0);
    const prevTotalIncome = prevIncome.reduce((sum, t) => sum + t.amount, 0);

    // Month-over-month deltas
    const spendDelta = prevTotalSpent > 0 ? ((totalSpent - prevTotalSpent) / prevTotalSpent) * 100 : 0;
    const incomeDelta = prevTotalIncome > 0 ? ((totalIncome - prevTotalIncome) / prevTotalIncome) * 100 : 0;

    // Budget totals
    const totalBudgetLimit = budgets.reduce((sum, b) => sum + b.monthlyLimit, 0);
    const budgetPct = totalBudgetLimit > 0 ? Math.min(Math.round((totalSpent / totalBudgetLimit) * 100), 100) : 0;
    const budgetRemaining = Math.max(0, totalBudgetLimit - totalSpent);

    // Insights
    const insights = SmartEngine.generateInsights(state);
    const featuredInsight = insights[0] || null;

    // Upcoming Bills (next 14 days)
    const upcomingBills = recurring
      .filter(r => r.type === 'expense')
      .map(r => {
        const diffDays = Math.ceil((new Date(r.nextDueDate) - now) / (1000 * 60 * 60 * 24));
        return { ...r, diffDays };
      })
      .filter(r => r.diffDays >= 0 && r.diffDays <= 14)
      .sort((a, b) => a.diffDays - b.diffDays)
      .slice(0, 4);

    // Recent Transactions (top 5)
    const recentTx = [...transactions]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5);

    container.innerHTML = `
      <div class="page-header">
        <div class="page-title-wrap">
          <h1>Financial Dashboard</h1>
          <p class="page-subtitle">${Formatters.monthYear(now)} spending, cash flow, and financial health</p>
        </div>
        <div class="quick-actions-bar">
          <button class="btn btn-primary" id="dash-btn-add-expense">
            <span>+</span> Add Expense
          </button>
          <button class="btn btn-secondary" id="dash-btn-add-income">
            <span>+</span> Add Income
          </button>
        </div>
      </div>

      <!-- Key Financial Metrics -->
      <div class="metrics-grid">
        <!-- Spent Metric -->
        <div class="metric-card metric-expense">
          <div class="metric-header">
            <span class="metric-label">Total Spent</span>
            <div class="metric-icon-wrap" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M12 19V5M5 12l7 7 7-7"/></svg>
            </div>
          </div>
          <div class="metric-value">${Formatters.currency(totalSpent, currency)}</div>
          <div class="metric-footer">
            <span class="badge ${spendDelta <= 0 ? 'badge-positive' : 'badge-negative'}">
              ${Formatters.percent(spendDelta)}
            </span>
            <span>vs last month</span>
          </div>
        </div>

        <!-- Income Metric -->
        <div class="metric-card metric-income">
          <div class="metric-header">
            <span class="metric-label">Total Income</span>
            <div class="metric-icon-wrap" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M12 5v14M5 12l7-7 7 7"/></svg>
            </div>
          </div>
          <div class="metric-value">${Formatters.currency(totalIncome, currency)}</div>
          <div class="metric-footer">
            <span class="badge ${incomeDelta >= 0 ? 'badge-positive' : 'badge-negative'}">
              ${Formatters.percent(incomeDelta)}
            </span>
            <span>vs last month</span>
          </div>
        </div>

        <!-- Net Savings Metric -->
        <div class="metric-card metric-balance">
          <div class="metric-header">
            <span class="metric-label">Net Cash Flow</span>
            <div class="metric-icon-wrap" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/></svg>
            </div>
          </div>
          <div class="metric-value ${netSavings >= 0 ? 'color-income' : 'color-expense'}">
            ${Formatters.currency(netSavings, currency)}
          </div>
          <div class="metric-footer">
            <span>Savings Rate:</span>
            <strong style="color: ${netSavings >= 0 ? 'var(--color-income)' : 'var(--color-expense)'};">
              ${totalIncome > 0 ? Math.round((netSavings / totalIncome) * 100) : 0}%
            </strong>
          </div>
        </div>

        <!-- Budget Remaining Metric -->
        <div class="metric-card metric-budget">
          <div class="metric-header">
            <span class="metric-label">Remaining Budget</span>
            <div class="metric-icon-wrap" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M19 5H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2Z"/><path d="M16 12h.01"/></svg>
            </div>
          </div>
          <div class="metric-value">${Formatters.currency(budgetRemaining, currency)}</div>
          <div class="metric-footer">
            <div class="progress-track" style="height: 6px; flex: 1;">
              <div class="progress-fill ${budgetPct >= 90 ? 'fill-danger' : budgetPct >= 75 ? 'fill-warning' : 'fill-safe'}" style="width: ${budgetPct}%;"></div>
            </div>
            <span style="font-weight: 600;">${budgetPct}% used</span>
          </div>
        </div>
      </div>

      <!-- Smart Insights Banner -->
      ${featuredInsight ? `
        <div class="insight-banner">
          <div class="insight-banner-content">
            <div class="insight-icon" aria-hidden="true">${featuredInsight.icon}</div>
            <div>
              <div class="insight-title">${featuredInsight.title}</div>
              <div class="insight-desc">${featuredInsight.message}</div>
            </div>
          </div>
          <button class="btn btn-secondary btn-sm" id="btn-insight-action" data-target="${featuredInsight.targetView}">
            ${featuredInsight.actionLabel} &rarr;
          </button>
        </div>
      ` : ''}

      <!-- Main Dashboard Grid -->
      <div class="dashboard-grid">
        <!-- Left Column: Spending Trend & Recent Transactions -->
        <div class="dashboard-col">
          <!-- Spending Trend Card -->
          <div class="card">
            <div class="card-header">
              <div>
                <h2 class="card-title">Daily Spending Trend</h2>
                <span class="card-subtitle">Spending distribution over the last 14 days</span>
              </div>
              <button class="btn btn-ghost btn-sm" id="dash-view-reports-btn">Full Analytics &rarr;</button>
            </div>
            <div id="dash-spending-chart" class="chart-wrap"></div>
          </div>

          <!-- Recent Transactions Card -->
          <div class="card">
            <div class="card-header">
              <div>
                <h2 class="card-title">Recent Transactions</h2>
                <span class="card-subtitle">Your latest account activity</span>
              </div>
              <button class="btn btn-ghost btn-sm" id="dash-view-all-tx-btn">View All (${transactions.length}) &rarr;</button>
            </div>

            ${recentTx.length === 0 ? `
              <div class="empty-state">
                <div class="empty-state-icon">💸</div>
                <div class="empty-state-title">No transactions yet</div>
                <p class="empty-state-desc">Start adding expenses or income to track your cash flow.</p>
                <button class="btn btn-primary btn-sm" id="dash-empty-add-btn">+ Add First Transaction</button>
              </div>
            ` : `
              <div class="table-container" style="border: none; box-shadow: none;">
                <table class="data-table">
                  <tbody>
                    ${recentTx.map(tx => {
                      const cat = CATEGORIES.find(c => c.name === tx.category) || { icon: '✨' };
                      return `
                        <tr>
                          <td style="width: 48px; padding-right: 0;">
                            <div class="tx-category-icon" aria-hidden="true">${cat.icon}</div>
                          </td>
                          <td>
                            <div class="tx-details">
                              <span class="tx-merchant-name">${tx.merchant}</span>
                              <span class="tx-note">${tx.category} • ${Formatters.date(tx.date, settings.dateFormat)}</span>
                            </div>
                          </td>
                          <td style="text-align: right;">
                            <span class="tx-amount ${tx.type === 'income' ? 'tx-income' : 'tx-expense'}">
                              ${tx.type === 'income' ? '+' : '-'}${Formatters.currency(tx.amount, currency)}
                            </span>
                          </td>
                        </tr>
                      `;
                    }).join('')}
                  </tbody>
                </table>
              </div>
            `}
          </div>
        </div>

        <!-- Right Column: Budgets Preview & Upcoming Bills -->
        <div class="dashboard-col">
          <!-- Upcoming Bills Card -->
          <div class="card">
            <div class="card-header">
              <div>
                <h2 class="card-title">Upcoming Bills</h2>
                <span class="card-subtitle">Due within the next 14 days</span>
              </div>
              <button class="btn btn-ghost btn-sm" id="dash-view-bills-btn">Manage &rarr;</button>
            </div>

            ${upcomingBills.length === 0 ? `
              <div class="empty-state" style="padding: var(--space-lg) var(--space-md);">
                <div class="empty-state-icon" style="width: 44px; height: 44px; font-size: 1.25rem;">🎉</div>
                <div class="empty-state-title" style="font-size: 0.9375rem;">No bills due soon</div>
                <p class="empty-state-desc" style="font-size: 0.8125rem;">You are all caught up on scheduled recurring expenses.</p>
              </div>
            ` : `
              <div style="display: flex; flex-direction: column; gap: var(--space-sm);">
                ${upcomingBills.map(bill => `
                  <div style="display: flex; align-items: center; justify-content: space-between; padding: var(--space-sm); background: var(--bg-surface-elevated); border-radius: var(--radius-md); border: 1px solid var(--border-subtle);">
                    <div>
                      <div style="font-weight: 600; font-size: 0.875rem;">${bill.name}</div>
                      <div style="font-size: 0.75rem; color: var(--text-muted);">
                        ${Formatters.relativeDate(bill.nextDueDate)} • ${Formatters.currency(bill.amount, currency)}
                      </div>
                    </div>
                    <button class="btn btn-outline btn-sm dash-pay-bill-btn" data-id="${bill.id}" title="Record payment">
                      Pay
                    </button>
                  </div>
                `).join('')}
              </div>
            `}
          </div>

          <!-- Category Budget Overview -->
          <div class="card">
            <div class="card-header">
              <div>
                <h2 class="card-title">Budget Health</h2>
                <span class="card-subtitle">Monthly category allocation</span>
              </div>
              <button class="btn btn-ghost btn-sm" id="dash-view-budgets-btn">Budgets &rarr;</button>
            </div>

            <div style="display: flex; flex-direction: column; gap: var(--space-md);">
              ${budgets.slice(0, 4).map(b => {
                const catExpenses = curExpenses.filter(t => t.category === b.category);
                const spent = catExpenses.reduce((s, t) => s + t.amount, 0);
                const pct = b.monthlyLimit > 0 ? Math.round((spent / b.monthlyLimit) * 100) : 0;
                const statusClass = pct >= 100 ? 'fill-danger' : pct >= 80 ? 'fill-warning' : 'fill-safe';

                return `
                  <div>
                    <div style="display: flex; justify-content: space-between; font-size: 0.8125rem; margin-bottom: 4px;">
                      <span style="font-weight: 500;">${b.category}</span>
                      <span style="color: var(--text-secondary);">${Formatters.currency(spent, currency).replace('.00', '')} / ${Formatters.currency(b.monthlyLimit, currency).replace('.00', '')}</span>
                    </div>
                    <div class="progress-track" style="height: 6px;">
                      <div class="progress-fill ${statusClass}" style="width: ${Math.min(pct, 100)}%;"></div>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        </div>
      </div>
    `;

    // Render Spending Trend Chart
    this.renderSpendingTrendChart(curExpenses, currency);

    // Event listeners
    this.attachEvents();
  },

  renderSpendingTrendChart(expenses, currency) {
    const days = 14;
    const now = new Date();
    const dataPoints = [];

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const pad = (n) => String(n).padStart(2, '0');
      const dateStr = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
      
      const dayTotal = expenses
        .filter(t => t.date === dateStr)
        .reduce((sum, t) => sum + t.amount, 0);

      dataPoints.push({
        label: `${d.getMonth() + 1}/${d.getDate()}`,
        value: dayTotal
      });
    }

    Charts.renderAreaChart('dash-spending-chart', dataPoints, currency);
  },

  attachEvents() {
    // Quick Add Expense
    const addExpenseBtn = document.getElementById('dash-btn-add-expense');
    if (addExpenseBtn) {
      addExpenseBtn.addEventListener('click', () => {
        window.dispatchEvent(new CustomEvent('app:open-add-modal', { detail: { type: 'expense' } }));
      });
    }

    // Quick Add Income
    const addIncomeBtn = document.getElementById('dash-btn-add-income');
    if (addIncomeBtn) {
      addIncomeBtn.addEventListener('click', () => {
        window.dispatchEvent(new CustomEvent('app:open-add-modal', { detail: { type: 'income' } }));
      });
    }

    // Empty Add Button
    const emptyAddBtn = document.getElementById('dash-empty-add-btn');
    if (emptyAddBtn) {
      emptyAddBtn.addEventListener('click', () => {
        window.dispatchEvent(new CustomEvent('app:open-add-modal', { detail: { type: 'expense' } }));
      });
    }

    // Navigation links
    const viewAllTx = document.getElementById('dash-view-all-tx-btn');
    if (viewAllTx) {
      viewAllTx.addEventListener('click', () => window.dispatchEvent(new CustomEvent('app:navigate', { detail: 'transactions' })));
    }

    const viewReports = document.getElementById('dash-view-reports-btn');
    if (viewReports) {
      viewReports.addEventListener('click', () => window.dispatchEvent(new CustomEvent('app:navigate', { detail: 'reports' })));
    }

    const viewBudgets = document.getElementById('dash-view-budgets-btn');
    if (viewBudgets) {
      viewBudgets.addEventListener('click', () => window.dispatchEvent(new CustomEvent('app:navigate', { detail: 'budgets' })));
    }

    const viewBills = document.getElementById('dash-view-bills-btn');
    if (viewBills) {
      viewBills.addEventListener('click', () => window.dispatchEvent(new CustomEvent('app:navigate', { detail: 'recurring' })));
    }

    // Quick pay bill
    const payButtons = document.querySelectorAll('.dash-pay-bill-btn');
    payButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        store.markRecurringPaid(id);
        window.dispatchEvent(new CustomEvent('app:toast', { detail: { message: 'Bill marked as paid and added to transactions ledger!', type: 'success' } }));
        this.render();
      });
    });

    // Insight action
    const insightAction = document.getElementById('btn-insight-action');
    if (insightAction) {
      insightAction.addEventListener('click', () => {
        const target = insightAction.getAttribute('data-target');
        if (target === 'modal_add') {
          window.dispatchEvent(new CustomEvent('app:open-add-modal', { detail: { type: 'expense' } }));
        } else if (target) {
          window.dispatchEvent(new CustomEvent('app:navigate', { detail: target }));
        }
      });
    }
  }
};
