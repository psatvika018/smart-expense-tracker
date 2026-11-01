/**
 * Smart Expense Tracker - Reports & Analytics View
 */

import { store, CATEGORIES } from '../store.js';
import { Formatters } from '../formatters.js';
import { Charts } from '../charts.js';

export const ReportsView = {
  timeframe: 'this_month',

  render() {
    const container = document.getElementById('view-reports');
    if (!container) return;

    const state = store.getState();
    const { transactions, settings } = state;
    const currency = settings.currency;

    const { filteredExpenses, filteredIncome, daysCount } = this.getDataForTimeframe(transactions);

    const totalSpent = filteredExpenses.reduce((s, t) => s + t.amount, 0);
    const totalEarned = filteredIncome.reduce((s, t) => s + t.amount, 0);
    const avgDailySpend = daysCount > 0 ? totalSpent / daysCount : 0;

    // Largest transaction
    const largestExpense = filteredExpenses.reduce((max, t) => t.amount > (max ? max.amount : 0) ? t : max, null);

    // Category breakdown
    const categoryTotals = {};
    filteredExpenses.forEach(t => {
      categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
    });

    const categorySlices = Object.entries(categoryTotals)
      .map(([catName, val]) => {
        const catObj = CATEGORIES.find(c => c.name === catName) || { color: '#6366F1' };
        return { label: catName, value: val, color: catObj.color };
      })
      .sort((a, b) => b.value - a.value);

    const topCategory = categorySlices[0] || { label: 'None', value: 0 };
    const topCategoryPct = totalSpent > 0 ? Math.round((topCategory.value / totalSpent) * 100) : 0;

    // Top merchants
    const merchantTotals = {};
    filteredExpenses.forEach(t => {
      merchantTotals[t.merchant] = (merchantTotals[t.merchant] || 0) + t.amount;
    });
    const topMerchants = Object.entries(merchantTotals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    container.innerHTML = `
      <div class="page-header">
        <div class="page-title-wrap">
          <h1>Spending Reports & Analytics</h1>
          <p class="page-subtitle">Deep dive into category distribution, historical cash flows, and trends</p>
        </div>
        <div>
          <select class="select" id="reports-timeframe-select" style="min-width: 170px;">
            <option value="this_month" ${this.timeframe === 'this_month' ? 'selected' : ''}>This Month</option>
            <option value="last_30" ${this.timeframe === 'last_30' ? 'selected' : ''}>Last 30 Days</option>
            <option value="last_90" ${this.timeframe === 'last_90' ? 'selected' : ''}>Last 90 Days</option>
            <option value="all_time" ${this.timeframe === 'all_time' ? 'selected' : ''}>All Time</option>
          </select>
        </div>
      </div>

      <!-- Analytic KPIs -->
      <div class="metrics-grid">
        <div class="metric-card metric-expense">
          <span class="metric-label">Daily Average Spend</span>
          <div class="metric-value">${Formatters.currency(avgDailySpend, currency)}</div>
          <span class="metric-footer">Over active ${daysCount}-day period</span>
        </div>

        <div class="metric-card metric-budget">
          <span class="metric-label">Largest Expense</span>
          <div class="metric-value" style="font-size: 1.625rem;">
            ${largestExpense ? Formatters.currency(largestExpense.amount, currency) : '$0'}
          </div>
          <span class="metric-footer" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
            ${largestExpense ? largestExpense.merchant : 'None recorded'}
          </span>
        </div>

        <div class="metric-card metric-balance">
          <span class="metric-label">Top Expense Category</span>
          <div class="metric-value" style="font-size: 1.625rem;">
            ${topCategory.label}
          </div>
          <span class="metric-footer">
            <strong>${topCategoryPct}%</strong> of all expenses
          </span>
        </div>

        <div class="metric-card metric-income">
          <span class="metric-label">Period Savings Margin</span>
          <div class="metric-value" style="font-size: 1.625rem;">
            ${totalEarned > 0 ? Math.round(((totalEarned - totalSpent) / totalEarned) * 100) : 0}%
          </div>
          <span class="metric-footer">
            Net cash flow: ${Formatters.currency(totalEarned - totalSpent, currency)}
          </span>
        </div>
      </div>

      <!-- Charts Grid -->
      <div class="charts-grid">
        <!-- Category Donut Breakdown -->
        <div class="card">
          <div class="card-header">
            <div>
              <h2 class="card-title">Category Breakdown</h2>
              <span class="card-subtitle">Spending distribution across categories</span>
            </div>
          </div>
          <div id="reports-donut-chart" class="chart-wrap"></div>
        </div>

        <!-- Cash Flow Comparison (Income vs Expense) -->
        <div class="card">
          <div class="card-header">
            <div>
              <h2 class="card-title">Cash Flow Dynamics</h2>
              <span class="card-subtitle">Monthly Income vs Monthly Expense</span>
            </div>
          </div>
          <div id="reports-cashflow-chart" class="chart-wrap"></div>
        </div>

        <!-- Spending Over Time Trend Area Chart -->
        <div class="card chart-card-full">
          <div class="card-header">
            <div>
              <h2 class="card-title">Spending Over Time</h2>
              <span class="card-subtitle">Daily spend curve for the selected period</span>
            </div>
          </div>
          <div id="reports-area-chart" class="chart-wrap"></div>
        </div>
      </div>

      <!-- Top Merchants Ranking Card -->
      <div class="card">
        <div class="card-header">
          <div>
            <h2 class="card-title">Top Merchants & Payees</h2>
            <span class="card-subtitle">Where your money goes most frequently</span>
          </div>
        </div>
        <div class="table-container" style="border: none; box-shadow: none;">
          <table class="data-table">
            <thead>
              <tr>
                <th>Merchant</th>
                <th style="text-align: right;">Total Spent</th>
                <th style="text-align: right;">% of Period Spend</th>
              </tr>
            </thead>
            <tbody>
              ${topMerchants.map(([merchant, amt]) => {
                const pct = totalSpent > 0 ? Math.round((amt / totalSpent) * 100) : 0;
                return `
                  <tr>
                    <td><strong>${merchant}</strong></td>
                    <td style="text-align: right; font-weight: 600;">${Formatters.currency(amt, currency)}</td>
                    <td style="text-align: right;">
                      <span class="badge badge-neutral">${pct}%</span>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    // Render Charts
    this.renderCharts(filteredExpenses, transactions, categorySlices, currency);

    // Event listeners
    this.attachEvents();
  },

  getDataForTimeframe(transactions) {
    const now = new Date();
    const curMonth = now.getMonth();
    const curYear = now.getFullYear();

    let filtered = [];
    let daysCount = 30;

    if (this.timeframe === 'this_month') {
      daysCount = now.getDate();
      filtered = transactions.filter(t => {
        const d = new Date(t.date);
        return d.getMonth() === curMonth && d.getFullYear() === curYear;
      });
    } else if (this.timeframe === 'last_30') {
      daysCount = 30;
      filtered = transactions.filter(t => {
        const d = new Date(t.date);
        return (now - d) / (1000 * 60 * 60 * 24) <= 30;
      });
    } else if (this.timeframe === 'last_90') {
      daysCount = 90;
      filtered = transactions.filter(t => {
        const d = new Date(t.date);
        return (now - d) / (1000 * 60 * 60 * 24) <= 90;
      });
    } else {
      daysCount = 180;
      filtered = [...transactions];
    }

    return {
      filteredExpenses: filtered.filter(t => t.type === 'expense'),
      filteredIncome: filtered.filter(t => t.type === 'income'),
      daysCount: Math.max(1, daysCount)
    };
  },

  renderCharts(expenses, allTransactions, categorySlices, currency) {
    // 1. Donut
    Charts.renderDonutChart('reports-donut-chart', categorySlices, currency);

    // 2. Trend Area Chart
    const now = new Date();
    const numPoints = this.timeframe === 'last_90' ? 12 : 14;
    const dataPoints = [];

    for (let i = numPoints - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (i * (this.timeframe === 'last_90' ? 7 : 1)));
      const pad = (n) => String(n).padStart(2, '0');
      const dateStr = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

      let val = 0;
      if (this.timeframe === 'last_90') {
        // weekly sum
        val = expenses
          .filter(t => {
            const td = new Date(t.date);
            const diff = Math.abs(d - td) / (1000 * 60 * 60 * 24);
            return diff <= 3.5;
          })
          .reduce((s, t) => s + t.amount, 0);
      } else {
        val = expenses
          .filter(t => t.date === dateStr)
          .reduce((s, t) => s + t.amount, 0);
      }

      dataPoints.push({
        label: `${d.getMonth() + 1}/${d.getDate()}`,
        value: val
      });
    }
    Charts.renderAreaChart('reports-area-chart', dataPoints, currency);

    // 3. Cash Flow Comparison Bars (Past 3 months)
    const monthPairs = [];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    for (let i = 2; i >= 0; i--) {
      const mDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const m = mDate.getMonth();
      const y = mDate.getFullYear();

      const inc = allTransactions
        .filter(t => {
          const d = new Date(t.date);
          return t.type === 'income' && d.getMonth() === m && d.getFullYear() === y;
        })
        .reduce((s, t) => s + t.amount, 0);

      const exp = allTransactions
        .filter(t => {
          const d = new Date(t.date);
          return t.type === 'expense' && d.getMonth() === m && d.getFullYear() === y;
        })
        .reduce((s, t) => s + t.amount, 0);

      monthPairs.push({
        month: monthNames[m],
        income: inc,
        expense: exp
      });
    }
    Charts.renderCashFlowBarChart('reports-cashflow-chart', monthPairs, currency);
  },

  attachEvents() {
    const timeframeSelect = document.getElementById('reports-timeframe-select');
    if (timeframeSelect) {
      timeframeSelect.addEventListener('change', (e) => {
        this.timeframe = e.target.value;
        this.render();
      });
    }
  }
};
