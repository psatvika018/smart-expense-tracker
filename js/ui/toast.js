/**
 * Smart Expense Tracker - Accessible Toast Notification Manager
 */

class ToastManager {
  constructor() {
    this.container = null;
  }

  ensureContainer() {
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.className = 'toast-container';
      this.container.setAttribute('aria-live', 'polite');
      this.container.setAttribute('aria-atomic', 'true');
      document.body.appendChild(this.container);
    }
  }

  show(message, type = 'info', duration = 3500) {
    this.ensureContainer();

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.setAttribute('role', 'status');

    let icon = 'ℹ️';
    if (type === 'success') icon = '✓';
    if (type === 'error') icon = '✕';
    if (type === 'warning') icon = '⚠️';

    toast.innerHTML = `
      <span style="font-weight: bold; flex-shrink: 0;">${icon}</span>
      <span style="flex: 1;">${message}</span>
      <button type="button" class="btn-ghost btn-sm" aria-label="Close notification" style="padding: 2px 6px; font-size: 12px;">✕</button>
    `;

    const closeBtn = toast.querySelector('button');
    const dismiss = () => {
      toast.classList.add('toast-hiding');
      setTimeout(() => {
        if (toast.parentElement) {
          toast.parentElement.removeChild(toast);
        }
      }, 200);
    };

    closeBtn.addEventListener('click', dismiss);

    this.container.appendChild(toast);

    if (duration > 0) {
      setTimeout(dismiss, duration);
    }

    return toast;
  }

  success(msg) { return this.show(msg, 'success'); }
  error(msg) { return this.show(msg, 'error', 4500); }
  warning(msg) { return this.show(msg, 'warning', 4000); }
  info(msg) { return this.show(msg, 'info'); }
}

export const Toast = new ToastManager();
