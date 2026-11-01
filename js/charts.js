/**
 * Smart Expense Tracker - High-Fidelity SVG Charts
 * Pure, lightweight, responsive SVG charts with tooltips and animations.
 */

import { Formatters } from './formatters.js';

export const Charts = {
  /**
   * Render an interactive Area/Line Spending Trend Chart
   */
  renderAreaChart(containerId, dataPoints = [], currencyCode = 'USD') {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';

    if (!dataPoints || dataPoints.length === 0) {
      container.innerHTML = '<div class="empty-state"><p>No spending trend data available</p></div>';
      return;
    }

    const width = 640;
    const height = 260;
    const padX = 45;
    const padY = 30;
    const chartW = width - padX * 2;
    const chartH = height - padY * 2;

    const maxVal = Math.max(...dataPoints.map(d => d.value), 10);
    const minVal = 0;

    // Coordinate mapping
    const getX = (index) => padX + (index / (dataPoints.length - 1)) * chartW;
    const getY = (val) => height - padY - ((val - minVal) / (maxVal - minVal)) * chartH;

    // Generate Path Data
    const pts = dataPoints.map((d, i) => ({ x: getX(i), y: getY(d.value), ...d }));
    
    // Smooth Catmull-Rom or clean polyline
    let linePath = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 1; i < pts.length; i++) {
      const prev = pts[i - 1];
      const curr = pts[i];
      const cpX = (prev.x + curr.x) / 2;
      linePath += ` C ${cpX} ${prev.y}, ${cpX} ${curr.y}, ${curr.x} ${curr.y}`;
    }

    const areaPath = `${linePath} L ${pts[pts.length - 1].x} ${height - padY} L ${pts[0].x} ${height - padY} Z`;

    // Horizontal grid lines (4 lines)
    let gridLinesSvg = '';
    const gridSteps = 4;
    for (let i = 0; i <= gridSteps; i++) {
      const val = (maxVal / gridSteps) * i;
      const y = getY(val);
      gridLinesSvg += `
        <line x1="${padX}" y1="${y}" x2="${width - padX}" y2="${y}" stroke="var(--border-subtle)" stroke-dasharray="4,4" />
        <text x="${padX - 8}" y="${y + 4}" fill="var(--text-muted)" font-size="10" text-anchor="end">${Formatters.currency(val, currencyCode).replace('.00', '')}</text>
      `;
    }

    // Interactive Data Points
    let pointsSvg = '';
    pts.forEach((pt, i) => {
      // Only render circle markers for every few or on hover if too many
      const isVisible = pts.length <= 15 || i % Math.ceil(pts.length / 10) === 0 || i === pts.length - 1;
      pointsSvg += `
        <g class="chart-point-group" tabindex="0" role="img" aria-label="${pt.label}: ${Formatters.currency(pt.value, currencyCode)}">
          <circle cx="${pt.x}" cy="${pt.y}" r="4" fill="var(--color-primary)" stroke="var(--bg-surface)" stroke-width="2" class="chart-point" />
          <circle cx="${pt.x}" cy="${pt.y}" r="14" fill="transparent" class="chart-hitbox" data-label="${pt.label}" data-val="${Formatters.currency(pt.value, currencyCode)}" />
          ${isVisible ? `<text x="${pt.x}" y="${height - padY + 18}" fill="var(--text-muted)" font-size="10" text-anchor="middle">${pt.label}</text>` : ''}
        </g>
      `;
    });

    const svgHtml = `
      <svg viewBox="0 0 ${width} ${height}" class="chart-svg" preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="var(--color-primary)" stop-opacity="0.32" />
            <stop offset="100%" stop-color="var(--color-primary)" stop-opacity="0.0" />
          </linearGradient>
        </defs>
        ${gridLinesSvg}
        <path d="${areaPath}" fill="url(#areaGradient)" />
        <path d="${linePath}" fill="none" stroke="var(--color-primary)" stroke-width="2.5" stroke-linecap="round" />
        ${pointsSvg}
      </svg>
      <div class="chart-tooltip" id="${containerId}_tooltip"></div>
    `;

    container.innerHTML = svgHtml;

    // Attach Hover Tooltip
    const tooltip = document.getElementById(`${containerId}_tooltip`);
    const hitboxes = container.querySelectorAll('.chart-hitbox');

    hitboxes.forEach(hitbox => {
      hitbox.addEventListener('mouseenter', (e) => {
        const label = hitbox.getAttribute('data-label');
        const val = hitbox.getAttribute('data-val');
        tooltip.innerHTML = `<strong>${val}</strong><br><span style="color:var(--text-muted)">${label}</span>`;
        tooltip.style.opacity = '1';

        const rect = container.getBoundingClientRect();
        const ptX = (parseFloat(hitbox.getAttribute('cx')) / width) * rect.width;
        const ptY = (parseFloat(hitbox.getAttribute('cy')) / height) * rect.height;

        tooltip.style.left = `${ptX}px`;
        tooltip.style.top = `${ptY}px`;
      });

      hitbox.addEventListener('mouseleave', () => {
        tooltip.style.opacity = '0';
      });
    });
  },

  /**
   * Render an interactive Donut Category Breakdown Chart
   */
  renderDonutChart(containerId, slices = [], currencyCode = 'USD') {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';

    const total = slices.reduce((sum, s) => sum + s.value, 0);
    if (total === 0 || slices.length === 0) {
      container.innerHTML = '<div class="empty-state"><p>No expense data in this period</p></div>';
      return;
    }

    const size = 260;
    const strokeWidth = 36;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;

    let accumulatedAngle = 0;
    let pathsSvg = '';

    slices.forEach((slice, idx) => {
      const fraction = slice.value / total;
      const strokeDashoffset = circumference * (1 - fraction);
      const rotation = (accumulatedAngle / total) * 360 - 90;

      pathsSvg += `
        <circle 
          cx="${size / 2}" 
          cy="${size / 2}" 
          r="${radius}" 
          fill="none" 
          stroke="${slice.color || '#6366F1'}" 
          stroke-width="${strokeWidth}" 
          stroke-dasharray="${circumference}" 
          stroke-dashoffset="${strokeDashoffset}" 
          transform="rotate(${rotation} ${size / 2} ${size / 2})"
          class="donut-segment"
          data-label="${slice.label}"
          data-val="${Formatters.currency(slice.value, currencyCode)}"
          data-pct="${Math.round(fraction * 100)}%"
          tabindex="0"
          role="img"
          aria-label="${slice.label}: ${Formatters.currency(slice.value, currencyCode)} (${Math.round(fraction * 100)}%)"
          style="cursor: pointer; transition: stroke-width 0.2s ease, opacity 0.2s ease;"
        />
      `;

      accumulatedAngle += slice.value;
    });

    const svgHtml = `
      <div style="position: relative; width: ${size}px; height: ${size}px; margin: 0 auto;">
        <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" class="chart-svg">
          ${pathsSvg}
        </svg>
        <div style="position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; pointer-events: none; text-align: center;">
          <span style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted);">Total Spend</span>
          <span style="font-family: var(--font-display); font-size: 1.375rem; font-weight: 700; color: var(--text-primary);">${Formatters.currency(total, currencyCode).replace('.00', '')}</span>
        </div>
        <div class="chart-tooltip" id="${containerId}_tooltip"></div>
      </div>
      <div class="chart-legend">
        ${slices.slice(0, 6).map(s => `
          <div class="legend-item">
            <span class="legend-color-dot" style="background: ${s.color};"></span>
            <span>${s.label} (${Math.round((s.value / total) * 100)}%)</span>
          </div>
        `).join('')}
      </div>
    `;

    container.innerHTML = svgHtml;

    // Attach Tooltip & hover animations
    const tooltip = document.getElementById(`${containerId}_tooltip`);
    const segments = container.querySelectorAll('.donut-segment');

    segments.forEach(segment => {
      segment.addEventListener('mouseenter', (e) => {
        segment.style.strokeWidth = `${strokeWidth + 6}px`;
        const label = segment.getAttribute('data-label');
        const val = segment.getAttribute('data-val');
        const pct = segment.getAttribute('data-pct');

        tooltip.innerHTML = `<strong>${label}</strong><br>${val} (${pct})`;
        tooltip.style.opacity = '1';
        tooltip.style.left = '50%';
        tooltip.style.top = '15%';
      });

      segment.addEventListener('mouseleave', () => {
        segment.style.strokeWidth = `${strokeWidth}px`;
        tooltip.style.opacity = '0';
      });
    });
  },

  /**
   * Render Cash Flow Comparison Bar Chart (Income vs Expense)
   */
  renderCashFlowBarChart(containerId, monthlyPairs = [], currencyCode = 'USD') {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';

    if (!monthlyPairs || monthlyPairs.length === 0) {
      container.innerHTML = '<div class="empty-state"><p>No cash flow data</p></div>';
      return;
    }

    const width = 640;
    const height = 240;
    const padX = 40;
    const padY = 30;
    const chartW = width - padX * 2;
    const chartH = height - padY * 2;

    const maxVal = Math.max(
      ...monthlyPairs.map(p => Math.max(p.income, p.expense)),
      100
    ) * 1.15;

    const groupWidth = chartW / monthlyPairs.length;
    const barWidth = Math.min(24, groupWidth * 0.35);

    let barsSvg = '';
    monthlyPairs.forEach((pair, idx) => {
      const groupCenterX = padX + (idx + 0.5) * groupWidth;

      const incHeight = (pair.income / maxVal) * chartH;
      const incY = height - padY - incHeight;
      const incX = groupCenterX - barWidth - 3;

      const expHeight = (pair.expense / maxVal) * chartH;
      const expY = height - padY - expHeight;
      const expX = groupCenterX + 3;

      barsSvg += `
        <g class="bar-group" role="img" aria-label="${pair.month}: Income ${Formatters.currency(pair.income, currencyCode)}, Expense ${Formatters.currency(pair.expense, currencyCode)}">
          <!-- Income Bar -->
          <rect x="${incX}" y="${incY}" width="${barWidth}" height="${incHeight}" rx="4" fill="var(--color-income)" class="cashflow-bar" data-label="${pair.month} Income" data-val="${Formatters.currency(pair.income, currencyCode)}" />
          
          <!-- Expense Bar -->
          <rect x="${expX}" y="${expY}" width="${barWidth}" height="${expHeight}" rx="4" fill="var(--color-expense)" class="cashflow-bar" data-label="${pair.month} Expense" data-val="${Formatters.currency(pair.expense, currencyCode)}" />

          <!-- Month Label -->
          <text x="${groupCenterX}" y="${height - padY + 18}" fill="var(--text-muted)" font-size="11" text-anchor="middle">${pair.month}</text>
        </g>
      `;
    });

    const svgHtml = `
      <svg viewBox="0 0 ${width} ${height}" class="chart-svg" preserveAspectRatio="xMidYMid meet">
        <line x1="${padX}" y1="${height - padY}" x2="${width - padX}" y2="${height - padY}" stroke="var(--border-subtle)" stroke-width="1" />
        ${barsSvg}
      </svg>
      <div class="chart-legend" style="margin-top: 4px;">
        <div class="legend-item">
          <span class="legend-color-dot" style="background: var(--color-income);"></span>
          <span>Income</span>
        </div>
        <div class="legend-item">
          <span class="legend-color-dot" style="background: var(--color-expense);"></span>
          <span>Expenses</span>
        </div>
      </div>
      <div class="chart-tooltip" id="${containerId}_tooltip"></div>
    `;

    container.innerHTML = svgHtml;

    // Attach tooltips
    const tooltip = document.getElementById(`${containerId}_tooltip`);
    const bars = container.querySelectorAll('.cashflow-bar');

    bars.forEach(bar => {
      bar.addEventListener('mouseenter', () => {
        const label = bar.getAttribute('data-label');
        const val = bar.getAttribute('data-val');
        tooltip.innerHTML = `<strong>${label}</strong><br>${val}`;
        tooltip.style.opacity = '1';

        const rect = container.getBoundingClientRect();
        const barX = (parseFloat(bar.getAttribute('x')) / width) * rect.width + 10;
        const barY = (parseFloat(bar.getAttribute('y')) / height) * rect.height;

        tooltip.style.left = `${barX}px`;
        tooltip.style.top = `${barY}px`;
      });

      bar.addEventListener('mouseleave', () => {
        tooltip.style.opacity = '0';
      });
    });
  }
};
