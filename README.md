# SmartExpense — Premium Personal Financial Intelligence & Tracker

A polished, production-ready smart expense tracker web application built with a modern fintech aesthetic. Designed to help you understand, manage, and optimize your spending with minimal effort.

---

## 🌟 Key Features

### 1. Intuitive Dashboard
- **Dynamic KPI Cards**: Real-time Total Spend, Total Income, Net Cash Flow with Savings Rate, and Month-over-Month (% MoM) deltas.
- **Spending Pacing Bar**: Monthly budget envelope tracking with safe daily allowance calculations.
- **Interactive Trend Curve**: Crisp SVG daily spending curve over the past 14 days with hover tooltips.
- **Recent Transactions & Upcoming Bills Preview**: Instant status checks and quick actions.

### 2. Full Transactions Ledger
- **Multi-parameter Search & Filtering**: Real-time search across merchants, notes, categories, and accounts.
- **Segmented Type Filtering**: Filter by All, Expenses, or Income.
- **Category & Account Dropdowns**: Filter by any category or financial account (Checking, Savings, Credit, Cash).
- **Date Presets & Sorting**: This Month, Last Month, Last 90 Days, All Time; Sort by date, amount, or merchant.
- **Receipt Attachment**: Upload receipt images with thumbnail previews and modal magnification.
- **In-place Actions**: Edit entries or delete with confirmation modals.

### 3. Smart Intelligence Engine
- **Intelligent Category Auto-Suggestions**: Suggests categories in real-time as you type merchant names (e.g., Starbucks &rarr; Food & Dining, Whole Foods &rarr; Groceries, Uber &rarr; Transportation).
- **Proactive Duplicate Detection**: Warns inline if a similar transaction (matching merchant, amount, and date proximity within 3 days) is being entered, preventing accidental double-charges.
- **Unusual Spending Diagnostics**: Flags category anomalies (purchases &gt;2x historical category average) with clear, calm explanations.
- **Actionable Financial Coaching**: Delivers grounded insights on savings margins, budget deficits, and upcoming 7-day cash commitments.

### 4. Category Budget Envelopes
- **Visual Progress Indicators**: Smooth progress bars color-coded by threshold (Safe &lt;80%, Warning 80%–99%, Alert &ge;100%).
- **Remaining Balance & Daily Allowance**: Displays exact surplus or deficit along with recommended daily spending limits.
- **Budget Configuration**: Add or edit monthly category budget thresholds anytime.

### 5. Interactive Reports & Visualizations
- **Pure SVG Donut Breakdown Chart**: Slice percentages, dynamic legend, and hover interaction.
- **Cash Flow Dynamics**: Grouped multi-month comparison bar chart (Income vs. Expense).
- **Spending Over Time Area Chart**: Detailed historical spending trend with tooltip data points.
- **Top Merchants Ranking**: Breakdown of top payees by spend and percentage share.

### 6. Recurring Transactions & Bill Reminders
- **Subscription Tracking**: Monitor Netflix, Spotify, Rent, Utilities, Gym memberships, and recurring salary deposits.
- **Countdown Badges**: "Due Today", "Due in X days", and overdue alerts.
- **One-Click "Mark as Paid"**: Records the transaction in your ledger for today and automatically advances the next billing date.

### 7. Regional Settings & Data Sovereignty
- **Multi-Currency Support**: Switch between USD ($), EUR (€), GBP (£), INR (₹), JPY (¥), CAD (CA$), AUD (A$), and CHF (Fr).
- **Date Formatting Options**: `YYYY-MM-DD`, `DD/MM/YYYY`, `MM/DD/YYYY`.
- **Theme Modes**: Seamless Dark Mode (Slate Obsidian) and Light Mode.
- **Account Management**: Add custom accounts with initial balances.
- **Full Offline Local Storage**: All data persists in your browser.
- **Backup & Restore**: Export full JSON backups, import past records, or restore sample demo data with one click.

---

## 🚀 Getting Started

The app is built with vanilla HTML5, CSS3, and ES6+ modules—requiring **zero build steps** and zero external runtime dependencies.

### Option A: Open directly in your browser
Simply double-click `index.html` or open it with your browser.

### Option B: Local development server
You can run any local static file server:

```bash
# Using Python
python -m http.server 4173

# Or using Node.js
npx serve -l 4173 .
```

Then visit [http://localhost:4173](http://localhost:4173) in your browser.

---

## 📁 Architecture

```
SmartExpenseTracker/
├── index.html                 # Semantic HTML5 single-page application shell
├── README.md                  # Project overview and documentation
├── css/
│   ├── variables.css          # Design tokens, color system, dark/light themes
│   ├── base.css               # Resets, typography, layout foundation, skip links
│   ├── components.css         # Cards, buttons, forms, modals, toasts, skeletons
│   ├── views.css              # View layouts (Dashboard, Ledger, Budgets, Reports)
│   └── responsive.css         # Breakpoints, mobile bottom bar & navigation drawer
└── js/
    ├── app.js                 # Application coordinator, routing, shortcuts
    ├── store.js               # State management, localStorage persistence, demo data
    ├── formatters.js          # Currency, date, and percentage formatters
    ├── smart-engine.js        # Auto-categorization, duplicate detector, anomaly analysis
    ├── charts.js              # Pure SVG interactive charts (Donut, Area, Bars)
    └── ui/
        ├── dashboard.js       # Dashboard view renderer
        ├── transactions.js    # Transactions ledger, filters, and edit modal
        ├── budgets.js         # Category budget envelopes
        ├── reports.js         # Spending reports & visual analytics
        ├── recurring.js       # Recurring subscriptions & bill reminders
        ├── insights.js        # Smart diagnostic insights panel
        ├── settings.js        # Currency, theme, and data export/import
        ├── modal.js           # Accessible native <dialog> controller
        └── toast.js           # ARIA-live toast notification manager
```
