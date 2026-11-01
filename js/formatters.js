/**
 * Smart Expense Tracker - Formatting Utilities
 */

const CURRENCY_MAP = {
  USD: { symbol: '$', locale: 'en-US' },
  EUR: { symbol: '€', locale: 'de-DE' },
  GBP: { symbol: '£', locale: 'en-GB' },
  INR: { symbol: '₹', locale: 'en-IN' },
  JPY: { symbol: '¥', locale: 'ja-JP', noDecimals: true },
  CAD: { symbol: 'CA$', locale: 'en-CA' },
  AUD: { symbol: 'A$', locale: 'en-AU' },
  CHF: { symbol: 'CHF', locale: 'de-CH' }
};

export const Formatters = {
  /**
   * Format currency amount based on active settings
   */
  currency(amount, currencyCode = 'USD') {
    const config = CURRENCY_MAP[currencyCode] || CURRENCY_MAP.USD;
    const num = Number(amount) || 0;
    
    return new Intl.NumberFormat(config.locale, {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: config.noDecimals ? 0 : 2,
      maximumFractionDigits: config.noDecimals ? 0 : 2
    }).format(num);
  },

  /**
   * Format date string (YYYY-MM-DD) according to format preference
   */
  date(dateStr, format = 'YYYY-MM-DD') {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const [year, month, day] = parts;

    switch (format) {
      case 'DD/MM/YYYY':
        return `${day}/${month}/${year}`;
      case 'MM/DD/YYYY':
        return `${month}/${day}/${year}`;
      case 'YYYY-MM-DD':
      default:
        return `${year}-${month}-${day}`;
    }
  },

  /**
   * Human readable month label (e.g. "October 2026")
   */
  monthYear(dateObj = new Date()) {
    return dateObj.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  },

  /**
   * Relative date string (e.g., "Today", "Yesterday", "In 3 days", "2 days overdue")
   */
  relativeDate(targetDateStr) {
    if (!targetDateStr) return '';
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [year, month, day] = targetDateStr.split('-').map(Number);
    const target = new Date(year, month - 1, day);
    target.setHours(0, 0, 0, 0);

    const diffDays = Math.round((target - today) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays === -1) return 'Yesterday';
    if (diffDays > 1) return `In ${diffDays} days`;
    return `${Math.abs(diffDays)} days overdue`;
  },

  /**
   * Format percentage with +/- sign
   */
  percent(val) {
    const num = Number(val) || 0;
    const sign = num > 0 ? '+' : '';
    return `${sign}${num.toFixed(1)}%`;
  }
};
