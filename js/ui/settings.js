/**
 * Smart Expense Tracker - Settings View
 */

import { store } from '../store.js';
import { Formatters } from '../formatters.js';
import { Toast } from './toast.js';

export const SettingsView = {
  render() {
    const container = document.getElementById('view-settings');
    if (!container) return;

    const state = store.getState();
    const { settings, accounts } = state;

    container.innerHTML = `
      <div class="page-header">
        <div class="page-title-wrap">
          <h1>Application Settings</h1>
          <p class="page-subtitle">Configure regional currencies, date representations, accounts, and data backups</p>
        </div>
      </div>

      <!-- Regional & Appearance Preferences -->
      <div class="settings-section">
        <h2 class="settings-section-title">Regional & Display Preferences</h2>
        <p class="settings-section-desc">Customize how numbers, symbols, and dates are presented across the application.</p>

        <div class="settings-grid">
          <div class="form-group">
            <label class="form-label" for="setting-currency">Display Currency</label>
            <select class="select" id="setting-currency">
              <option value="USD" ${settings.currency === 'USD' ? 'selected' : ''}>USD ($) - US Dollar</option>
              <option value="EUR" ${settings.currency === 'EUR' ? 'selected' : ''}>EUR (€) - Euro</option>
              <option value="GBP" ${settings.currency === 'GBP' ? 'selected' : ''}>GBP (£) - British Pound</option>
              <option value="INR" ${settings.currency === 'INR' ? 'selected' : ''}>INR (₹) - Indian Rupee</option>
              <option value="JPY" ${settings.currency === 'JPY' ? 'selected' : ''}>JPY (¥) - Japanese Yen</option>
              <option value="CAD" ${settings.currency === 'CAD' ? 'selected' : ''}>CAD (CA$) - Canadian Dollar</option>
              <option value="AUD" ${settings.currency === 'AUD' ? 'selected' : ''}>AUD (A$) - Australian Dollar</option>
              <option value="CHF" ${settings.currency === 'CHF' ? 'selected' : ''}>CHF (Fr) - Swiss Franc</option>
            </select>
            <span class="form-hint">Updates all ledger entries and summaries immediately</span>
          </div>

          <div class="form-group">
            <label class="form-label" for="setting-date-format">Date Format</label>
            <select class="select" id="setting-date-format">
              <option value="YYYY-MM-DD" ${settings.dateFormat === 'YYYY-MM-DD' ? 'selected' : ''}>YYYY-MM-DD (ISO standard)</option>
              <option value="DD/MM/YYYY" ${settings.dateFormat === 'DD/MM/YYYY' ? 'selected' : ''}>DD/MM/YYYY (Day-Month-Year)</option>
              <option value="MM/DD/YYYY" ${settings.dateFormat === 'MM/DD/YYYY' ? 'selected' : ''}>MM/DD/YYYY (Month-Day-Year)</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label" for="setting-theme">Color Theme</label>
            <select class="select" id="setting-theme">
              <option value="dark" ${settings.theme === 'dark' ? 'selected' : ''}>Dark Mode (Fintech Slate)</option>
              <option value="light" ${settings.theme === 'light' ? 'selected' : ''}>Light Mode (Crisp White)</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Accounts Management -->
      <div class="settings-section">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: var(--space-md); margin-bottom: var(--space-md);">
          <div>
            <h2 class="settings-section-title">Connected Accounts & Wallets</h2>
            <p class="settings-section-desc" style="margin-bottom: 0;">Manage checking accounts, savings envelopes, and credit cards</p>
          </div>
          <button class="btn btn-secondary btn-sm" id="btn-toggle-add-account">+ Add Account</button>
        </div>

        <!-- Add account inline drawer form -->
        <div id="add-account-form-wrap" style="display: none; background: var(--bg-surface-elevated); padding: var(--space-md); border-radius: var(--radius-md); margin-bottom: var(--space-md); border: 1px solid var(--border-default);">
          <form id="form-new-account" style="display: flex; gap: var(--space-md); flex-wrap: wrap; align-items: flex-end;">
            <div style="flex: 1; min-width: 180px;">
              <label class="form-label" for="acc-new-name">Account Name</label>
              <input type="text" class="input" id="acc-new-name" placeholder="e.g. Apple Card" required>
            </div>
            <div style="width: 140px;">
              <label class="form-label" for="acc-new-type">Account Type</label>
              <select class="select" id="acc-new-type">
                <option value="Checking">Checking</option>
                <option value="Credit Card">Credit Card</option>
                <option value="Savings">Savings</option>
                <option value="Cash">Cash</option>
              </select>
            </div>
            <div style="width: 140px;">
              <label class="form-label" for="acc-new-balance">Balance</label>
              <input type="number" step="0.01" class="input" id="acc-new-balance" placeholder="0.00" required>
            </div>
            <button type="submit" class="btn btn-primary btn-sm">Save Account</button>
            <button type="button" class="btn btn-ghost btn-sm" id="btn-cancel-account">Cancel</button>
          </form>
        </div>

        <div class="account-card-list">
          ${accounts.map(a => `
            <div class="account-card">
              <div class="account-card-name">
                <span>${a.name}</span>
                <span class="badge badge-neutral">${a.type}</span>
              </div>
              <div class="account-card-balance" style="color: ${a.balance >= 0 ? 'var(--text-primary)' : 'var(--color-expense)'};">
                ${Formatters.currency(a.balance, settings.currency)}
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Data Management & Backups -->
      <div class="settings-section">
        <h2 class="settings-section-title">Data Storage & Backup Management</h2>
        <p class="settings-section-desc">All information is securely stored locally in your browser's private local storage. Export to keep offline JSON copies.</p>

        <div style="display: flex; flex-wrap: wrap; gap: var(--space-md);">
          <button class="btn btn-secondary" id="btn-export-json">
            <span>💾</span> Export Backup (JSON)
          </button>
          <label class="btn btn-secondary" style="cursor: pointer;">
            <span>📂</span> Import Backup (JSON)
            <input type="file" id="input-import-json" accept=".json" style="display: none;">
          </label>
          <button class="btn btn-outline" id="btn-reset-demo" style="color: var(--color-warning);">
            <span>🔄</span> Restore Sample Demo Data
          </button>
          <button class="btn btn-outline" id="btn-clear-all" style="color: var(--color-expense);">
            <span>🗑️</span> Wipe All Data
          </button>
        </div>
      </div>
    `;

    this.attachEvents();
  },

  attachEvents() {
    // Currency change
    const curSelect = document.getElementById('setting-currency');
    if (curSelect) {
      curSelect.addEventListener('change', (e) => {
        store.updateSettings({ currency: e.target.value });
        Toast.success(`Currency changed to ${e.target.value}.`);
        window.dispatchEvent(new CustomEvent('app:rerender-active-view'));
      });
    }

    // Date format change
    const dateSelect = document.getElementById('setting-date-format');
    if (dateSelect) {
      dateSelect.addEventListener('change', (e) => {
        store.updateSettings({ dateFormat: e.target.value });
        Toast.success(`Date format set to ${e.target.value}.`);
        window.dispatchEvent(new CustomEvent('app:rerender-active-view'));
      });
    }

    // Theme change
    const themeSelect = document.getElementById('setting-theme');
    if (themeSelect) {
      themeSelect.addEventListener('change', (e) => {
        const theme = e.target.value;
        store.updateSettings({ theme });
        document.documentElement.setAttribute('data-theme', theme);
        Toast.success(`Theme switched to ${theme} mode.`);
      });
    }

    // Toggle add account
    const toggleAccBtn = document.getElementById('btn-toggle-add-account');
    const accWrap = document.getElementById('add-account-form-wrap');
    const cancelAccBtn = document.getElementById('btn-cancel-account');
    const formAcc = document.getElementById('form-new-account');

    if (toggleAccBtn && accWrap) {
      toggleAccBtn.addEventListener('click', () => {
        accWrap.style.display = accWrap.style.display === 'none' ? 'block' : 'none';
      });
    }

    if (cancelAccBtn && accWrap) {
      cancelAccBtn.addEventListener('click', () => {
        accWrap.style.display = 'none';
      });
    }

    if (formAcc) {
      formAcc.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('acc-new-name').value.trim();
        const type = document.getElementById('acc-new-type').value;
        const balance = parseFloat(document.getElementById('acc-new-balance').value) || 0;

        if (name) {
          store.addAccount({ name, type, balance });
          Toast.success(`Account "${name}" created.`);
          this.render();
        }
      });
    }

    // Export JSON
    const exportBtn = document.getElementById('btn-export-json');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(store.exportJSON());
        const dlAnchor = document.createElement('a');
        dlAnchor.setAttribute('href', dataStr);
        dlAnchor.setAttribute('download', `smart_expense_tracker_backup_${new Date().toISOString().split('T')[0]}.json`);
        document.body.appendChild(dlAnchor);
        dlAnchor.click();
        dlAnchor.remove();
        Toast.success('Backup JSON file exported.');
      });
    }

    // Import JSON
    const importInput = document.getElementById('input-import-json');
    if (importInput) {
      importInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
          const success = store.importJSON(event.target.result);
          if (success) {
            Toast.success('Data imported successfully!');
            this.render();
            window.dispatchEvent(new CustomEvent('app:rerender-active-view'));
          } else {
            Toast.error('Failed to import JSON file. Invalid format.');
          }
        };
        reader.readAsText(file);
      });
    }

    // Reset demo
    const resetBtn = document.getElementById('btn-reset-demo');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        if (confirm('Reset to sample demo data? Your current changes will be overwritten.')) {
          store.resetToDemo();
          Toast.success('Demo data restored.');
          this.render();
          window.dispatchEvent(new CustomEvent('app:rerender-active-view'));
        }
      });
    }

    // Clear all
    const clearBtn = document.getElementById('btn-clear-all');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        if (confirm('Wipe all transactions, budgets, and bills? This cannot be undone.')) {
          store.clearAllData();
          Toast.warning('All transaction records wiped.');
          this.render();
          window.dispatchEvent(new CustomEvent('app:rerender-active-view'));
        }
      });
    }
  }
};
