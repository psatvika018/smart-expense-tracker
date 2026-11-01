/**
 * Smart Expense Tracker - Intelligent Analytics & Financial Heuristics Engine
 * Provides category suggestions, duplicate detection, anomaly alerts, and actionable insights.
 */

const MERCHANT_KEYWORD_RULES = [
  // Groceries
  { keywords: ['trader joe', 'whole foods', 'safeway', 'kroger', 'costco', 'aldi', 'grocer', 'supermarket', 'market', 'wegmans', 'sprouts'], category: 'Groceries' },
  // Food & Dining
  { keywords: ['starbucks', 'coffee', 'mcdonald', 'chipotle', 'burger', 'restaurant', 'cafe', 'diner', 'pizza', 'sushi', 'nobu', 'sweetgreen', 'taco', 'bakery', 'bar', 'grill'], category: 'Food & Dining' },
  // Housing & Rent
  { keywords: ['rent', 'lease', 'apartment', 'mortgage', 'landlord', 'avalon', 'equity residential'], category: 'Housing & Rent' },
  // Utilities
  { keywords: ['electric', 'conedison', 'pge', 'water', 'gas', 'power', 'verizon', 'at&t', 't-mobile', 'internet', 'fios', 'comcast', 'xfinity'], category: 'Utilities & Bills' },
  // Transportation
  { keywords: ['uber', 'lyft', 'chevron', 'shell', 'exxon', 'bp', 'gas', 'transit', 'subway', 'metro', 'train', 'flight', 'airline', 'parking', 'delta', 'united'], category: 'Transportation' },
  // Entertainment
  { keywords: ['netflix', 'spotify', 'hulu', 'disney', 'cinema', 'amc', 'steam', 'playstation', 'nintendo', 'concert', 'ticket', 'youtube', 'apple music', 'hbo'], category: 'Entertainment' },
  // Shopping
  { keywords: ['amazon', 'target', 'walmart', 'ebay', 'best buy', 'zara', 'nike', 'apple store', 'nordstrom', 'clothing', 'apparel'], category: 'Shopping' },
  // Health & Fitness
  { keywords: ['gym', 'fitness', 'equinox', 'planet fitness', 'pharmacy', 'cvs', 'walgreens', 'doctor', 'dental', 'clinic', 'yoga', 'hospital'], category: 'Health & Fitness' },
  // Income
  { keywords: ['payroll', 'salary', 'deposit', 'bonus', 'client invoice', 'freelance', 'dividend', 'interest payment'], category: 'Salary & Income' },
  // Investments
  { keywords: ['vanguard', 'fidelity', 'schwab', 'robinhood', 'coinbase', 'crypto', 'etf', 'index fund'], category: 'Investments' }
];

export const SmartEngine = {
  /**
   * Suggest a category based on merchant name, description, and user history
   */
  suggestCategory(merchantName = '', note = '', userTransactions = []) {
    const text = `${merchantName} ${note}`.toLowerCase().trim();
    if (!text) return null;

    // 1. Check user's own historical transactions for past categorization
    if (userTransactions && userTransactions.length > 0) {
      const match = userTransactions.find(t => 
        t.merchant && t.merchant.toLowerCase().trim() === merchantName.toLowerCase().trim()
      );
      if (match && match.category) {
        return {
          category: match.category,
          source: 'history',
          reason: `Based on your previous transaction at ${match.merchant}`
        };
      }
    }

    // 2. Keyword matching rules
    for (const rule of MERCHANT_KEYWORD_RULES) {
      for (const kw of rule.keywords) {
        if (text.includes(kw)) {
          return {
            category: rule.category,
            source: 'keyword',
            reason: `Matches '${kw}' keyword`
          };
        }
      }
    }

    return null;
  },

  /**
   * Detect if a new or edited transaction matches an existing transaction (potential duplicate)
   */
  detectDuplicate(candidateTx, allTransactions = []) {
    if (!candidateTx || !candidateTx.merchant || !candidateTx.amount) return null;

    const candAmount = parseFloat(candidateTx.amount);
    const candMerchant = candidateTx.merchant.toLowerCase().trim();
    const candDate = new Date(candidateTx.date || new Date());

    const matches = allTransactions.filter(tx => {
      // Don't compare with itself if editing
      if (candidateTx.id && tx.id === candidateTx.id) return false;
      if (tx.type !== candidateTx.type) return false;

      // Check amount exact match or within 0.5%
      const amountDiff = Math.abs(parseFloat(tx.amount) - candAmount);
      if (amountDiff > 0.05) return false;

      // Check merchant name similarity
      const txMerchant = tx.merchant.toLowerCase().trim();
      const isMerchantMatch = txMerchant === candMerchant || 
                              txMerchant.includes(candMerchant) || 
                              candMerchant.includes(txMerchant);
      if (!isMerchantMatch) return false;

      // Check date proximity (within 3 days)
      const txDate = new Date(tx.date);
      const diffTime = Math.abs(txDate - candDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 3;
    });

    if (matches.length > 0) {
      return {
        isDuplicate: true,
        matchCount: matches.length,
        matchedTransaction: matches[0],
        message: `Similar ${matches[0].type} of $${matches[0].amount.toFixed(2)} at "${matches[0].merchant}" was recorded on ${matches[0].date}.`
      };
    }

    return null;
  },

  /**
   * Scan entire ledger for potential duplicate pairs
   */
  findDuplicatePairs(transactions = []) {
    const pairs = [];
    const processedIds = new Set();

    for (let i = 0; i < transactions.length; i++) {
      const a = transactions[i];
      if (processedIds.has(a.id)) continue;

      for (let j = i + 1; j < transactions.length; j++) {
        const b = transactions[j];
        if (processedIds.has(b.id)) continue;
        if (a.type !== b.type) continue;

        if (Math.abs(a.amount - b.amount) < 0.01 && 
            a.merchant.toLowerCase().trim() === b.merchant.toLowerCase().trim()) {
          const diffDays = Math.abs(new Date(a.date) - new Date(b.date)) / (1000 * 60 * 60 * 24);
          if (diffDays <= 3) {
            pairs.push({ txA: a, txB: b });
            processedIds.add(b.id);
            break;
          }
        }
      }
    }
    return pairs;
  },

  /**
   * Identify unusual spending transactions (anomalies)
   */
  findUnusualSpending(transactions = []) {
    const expenses = transactions.filter(t => t.type === 'expense');
    if (expenses.length < 5) return [];

    // Calculate category averages
    const categoryTotals = {};
    const categoryCounts = {};

    expenses.forEach(t => {
      categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
      categoryCounts[t.category] = (categoryCounts[t.category] || 0) + 1;
    });

    const unusual = [];

    expenses.forEach(t => {
      const count = categoryCounts[t.category] || 1;
      const avg = categoryTotals[t.category] / count;

      // If single purchase is >= 2.5x the category average and amount > 50
      if (count >= 2 && t.amount >= avg * 2.2 && t.amount >= 50) {
        unusual.push({
          transaction: t,
          average: avg,
          multiplier: (t.amount / avg).toFixed(1),
          reason: `Charge of $${t.amount.toFixed(2)} at ${t.merchant} is ${ (t.amount / avg).toFixed(1) }x higher than your usual ${t.category} spend (avg: $${avg.toFixed(2)}).`
        });
      }
    });

    return unusual;
  },

  /**
   * Compute comprehensive financial insights grounded strictly in available user data
   */
  generateInsights(state) {
    const { transactions, budgets, recurring } = state;
    const insights = [];

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const currentMonthExpenses = transactions.filter(t => {
      const d = new Date(t.date);
      return t.type === 'expense' && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    const currentMonthIncome = transactions.filter(t => {
      const d = new Date(t.date);
      return t.type === 'income' && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    const totalSpent = currentMonthExpenses.reduce((sum, t) => sum + t.amount, 0);
    const totalEarned = currentMonthIncome.reduce((sum, t) => sum + t.amount, 0);

    // 1. Savings Rate Insight
    if (totalEarned > 0) {
      const savings = totalEarned - totalSpent;
      const savingsRate = Math.round((savings / totalEarned) * 100);
      if (savingsRate >= 20) {
        insights.push({
          id: 'insight_savings_healthy',
          type: 'success',
          icon: '🎯',
          title: 'Strong Savings Pace',
          message: `You're currently retaining ${savingsRate}% of this month's income ($${savings.toFixed(2)} saved). Excellent cash buffer!`,
          actionLabel: 'View Cash Flow',
          targetView: 'reports'
        });
      } else if (savingsRate < 0) {
        insights.push({
          id: 'insight_savings_deficit',
          type: 'warning',
          icon: '⚠️',
          title: 'Deficit Alert',
          message: `Spending exceeds income this month by $${Math.abs(savings).toFixed(2)}. Consider trimming discretionary expenses.`,
          actionLabel: 'Review Budgets',
          targetView: 'budgets'
        });
      }
    }

    // 2. Budget Overrun Checks
    const categorySpendMap = {};
    currentMonthExpenses.forEach(t => {
      categorySpendMap[t.category] = (categorySpendMap[t.category] || 0) + t.amount;
    });

    let overspentCat = null;
    let maxOverspentRatio = 0;

    budgets.forEach(b => {
      const spent = categorySpendMap[b.category] || 0;
      if (b.monthlyLimit > 0) {
        const ratio = spent / b.monthlyLimit;
        if (ratio > 1.0 && ratio > maxOverspentRatio) {
          maxOverspentRatio = ratio;
          overspentCat = { category: b.category, spent, limit: b.monthlyLimit, over: spent - b.monthlyLimit };
        }
      }
    });

    if (overspentCat) {
      insights.push({
        id: 'insight_budget_over',
        type: 'warning',
        icon: '🚨',
        title: `Budget Exceeded: ${overspentCat.category}`,
        message: `You have spent $${overspentCat.spent.toFixed(2)} of your $${overspentCat.limit.toFixed(2)} limit ($${overspentCat.over.toFixed(2)} over budget).`,
        actionLabel: 'Adjust Budget',
        targetView: 'budgets'
      });
    }

    // 3. Upcoming Bills in the Next 7 Days
    const upcoming7Days = recurring.filter(r => {
      const diffDays = Math.ceil((new Date(r.nextDueDate) - now) / (1000 * 60 * 60 * 24));
      return diffDays >= 0 && diffDays <= 7 && r.type === 'expense';
    });

    if (upcoming7Days.length > 0) {
      const billsTotal = upcoming7Days.reduce((s, r) => s + r.amount, 0);
      insights.push({
        id: 'insight_bills_due',
        type: 'info',
        icon: '📅',
        title: `${upcoming7Days.length} Upcoming Bill${upcoming7Days.length > 1 ? 's' : ''}`,
        message: `Total of $${billsTotal.toFixed(2)} is due in the next 7 days, including ${upcoming7Days[0].name}.`,
        actionLabel: 'View Schedule',
        targetView: 'recurring'
      });
    }

    // 4. Unusual Spending Alerts
    const anomalies = this.findUnusualSpending(transactions);
    if (anomalies.length > 0) {
      const topAnomaly = anomalies[0];
      insights.push({
        id: 'insight_anomaly',
        type: 'info',
        icon: '🔍',
        title: 'Notable Spending Pattern',
        message: topAnomaly.reason,
        actionLabel: 'Inspect Transactions',
        targetView: 'transactions'
      });
    }

    // Fallback general guidance if few insights
    if (insights.length === 0) {
      insights.push({
        id: 'insight_general',
        type: 'info',
        icon: '✨',
        title: 'Smart Spending Assistant Active',
        message: 'Keep logging your expenses to unlock deeper trend analyses, category forecasts, and anomaly detection.',
        actionLabel: 'Add Expense',
        targetView: 'modal_add'
      });
    }

    return insights;
  }
};
