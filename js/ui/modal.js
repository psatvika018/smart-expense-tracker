/**
 * Smart Expense Tracker - Modal Dialog Controller
 * Uses native <dialog> with accessible focus handling, keyboard Escape, and light dismiss.
 */

export const Modal = {
  open(dialogId) {
    const dialog = document.getElementById(dialogId);
    if (!dialog) return;

    if (typeof dialog.showModal === 'function') {
      dialog.showModal();
    } else {
      dialog.setAttribute('open', '');
    }

    // Light dismiss: close when clicking on backdrop
    const handleBackdropClick = (e) => {
      const rect = dialog.getBoundingClientRect();
      const isInDialog = (
        rect.top <= e.clientY && e.clientY <= rect.top + rect.height &&
        rect.left <= e.clientX && e.clientX <= rect.left + rect.width
      );
      if (!isInDialog) {
        dialog.close();
      }
    };

    dialog.addEventListener('click', handleBackdropClick);

    // Auto-focus first input or close button
    setTimeout(() => {
      const focusable = dialog.querySelector('input:not([type="hidden"]), select, textarea, button:not(.btn-close)');
      if (focusable) focusable.focus();
    }, 50);
  },

  close(dialogId) {
    const dialog = document.getElementById(dialogId);
    if (dialog && typeof dialog.close === 'function') {
      dialog.close();
    }
  }
};
