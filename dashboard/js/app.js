'use strict';

// ─── Constants ────────────────────────────────────────────────────────────────

const DATA_URL = './data/dashboard_data.json';

const DOMAIN_META = {
  housing: {
    label: 'Housing',
    color: '#f59e0b',
    colors: ['#f59e0b', '#fb923c', '#fbbf24', '#d97706', '#f97316', '#b45309', '#fde68a', '#78350f'],
  },
  labor: {
    label: 'Labor',
    color: '#06b6d4',
    colors: ['#06b6d4', '#0ea5e9', '#38bdf8', '#0284c7', '#7dd3fc', '#0369a1', '#bae6fd', '#075985'],
  },
  rates: {
    label: 'Rates',
    color: '#22c55e',
    colors: ['#22c55e', '#4ade80', '#86efac', '#16a34a', '#bbf7d0', '#15803d', '#a3e635', '#166534'],
  },
  gdp_income: {
    label: 'GDP & Income',
    color: '#a855f7',
    colors: ['#a855f7', '#c084fc', '#d8b4fe', '#9333ea', '#e9d5ff', '#7c3aed', '#ddd6fe', '#6d28d9'],
  },
};

// Default series highlighted per domain (by FRED ID)
const DEFAULT_SELECTED = {
  housing:    ['MORTGAGE30US', 'MORTGAGE15US'],
  labor:      ['UNRATE', 'CPIAUCSL'],
  rates:      ['DGS10', 'DGS2'],
  gdp_income: ['GDP', 'GDPC1'],
};

const WINDOW_DAYS = { '2yr': 730, '5yr': 1825, 'all': Infinity };

// ─── State ────────────────────────────────────────────────────────────────────

const state = {
  data:     null,
  tab:      'housing',
  selected: new Set(),
  window:   '2yr',
  chart:    null,
};

// ─── Formatters ───────────────────────────────────────────────────────────────

function fmtValue(s) {
  const v = s.latest_value;
  switch (s.unit) {
    case '%':
      return v.toFixed(2) + '%';
    case 'billions $':
      return '$' + (v / 1000).toFixed(2) + 'T';
    case 'thousands':
      if (v >= 1e6) return (v / 1e6).toFixed(2) + 'M';
      return v.toLocaleString('en-US', { maximumFractionDigits: 0 }) + 'K';
    case 'number':
      if (v >= 1e6) return (v / 1e6).toFixed(2) + 'M';
      if (v >= 1e3) return (v / 1e3).toFixed(0) + 'K';
      return v.toLocaleString('en-US');
    case 'index':
      return v.toFixed(2);
    default:
      return v.toLocaleString('en-US');
  }
}

function fmtChange(s) {
  // YoY preferred for inflation / home-price index series
  if (s.yoy_change_pct != null) {
    const sign = s.yoy_change_pct >= 0 ? '+' : '';
    return `${sign}${s.yoy_change_pct.toFixed(2)}% YoY`;
  }
  // Basis points for rate series
  if (s.unit === '%' && s.change_bps != null) {
    const sign = s.change_bps >= 0 ? '+' : '';
    return `${sign}${s.change_bps.toFixed(0)} bps`;
  }
  // Dollar change for GDP / income
  if (s.unit === 'billions $' && s.change != null) {
    const sign = s.change >= 0 ? '+' : '';
    return `${sign}$${Math.abs(s.change).toFixed(1)}B`;
  }
  // Thousands (payrolls, housing starts, etc.)
  if (s.unit === 'thousands' && s.change != null) {
    const sign = s.change >= 0 ? '+' : '';
    const abs  = Math.abs(s.change);
    return abs >= 1000
      ? `${sign}${(s.change / 1000).toFixed(1)}M`
      : `${sign}${s.change.toLocaleString('en-US', { maximumFractionDigits: 0 })}K`;
  }
  // Raw number
  if (s.unit === 'number' && s.change != null) {
    const sign = s.change >= 0 ? '+' : '';
    const abs  = Math.abs(s.change);
    return abs >= 1000 ? `${sign}${(s.change / 1000).toFixed(0)}K` : `${sign}${s.change}`;
  }
  // Fallback: percentage change
  if (s.change_pct != null) {
    const sign = s.change_pct >= 0 ? '+' : '';
    return `${sign}${s.change_pct.toFixed(2)}%`;
  }
  return '—';
}

function changeDir(s) {
  const v = s.yoy_change_pct ?? s.change;
  if (v == null) return 'neutral';
  return v > 0 ? 'up' : v < 0 ? 'down' : 'neutral';
}

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d + 'T12:00:00Z').toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

function freqLabel(f) {
  return { daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly', quarterly: 'Quarterly' }[f] ?? f;
}

function fmtChartY(v, unit) {
  switch (unit) {
    case '%':          return v.toFixed(2) + '%';
    case 'billions $': return '$' + (v / 1000).toFixed(1) + 'T';
    case 'thousands':
      if (Math.abs(v) >= 1e6) return (v / 1e6).toFixed(1) + 'M';
      return v.toFixed(0) + 'K';
    case 'number':
      if (Math.abs(v) >= 1e6) return (v / 1e6).toFixed(1) + 'M';
      if (Math.abs(v) >= 1e3) return (v / 1e3).toFixed(0) + 'K';
      return v.toFixed(0);
    case 'index':      return v.toFixed(1);
    default:           return v.toFixed(2);
  }
}

// ─── Data helpers ─────────────────────────────────────────────────────────────

function filterHistory(history, windowKey) {
  if (!history?.length) return [];
  if (windowKey === 'all') return history;
  const cutoff = Date.now() - WINDOW_DAYS[windowKey] * 86400000;
  return history.filter(pt => new Date(pt.date).getTime() >= cutoff);
}

function normalizeToIndex(history) {
  if (!history.length) return history;
  const base = history[0].value;
  if (base === 0) return history;
  return history.map(pt => ({ date: pt.date, value: (pt.value / base) * 100 }));
}

function needsNormalization(series) {
  return new Set(series.map(s => s.unit)).size > 1;
}

// ─── Renderers ────────────────────────────────────────────────────────────────

function renderHeader() {
  const d   = new Date(state.data.meta.updated_at);
  const fmt = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
            + ' · ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZoneName: 'short' });
  document.getElementById('updated-at').textContent = fmt;
}

function renderTabs() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    const d = btn.dataset.domain;
    btn.classList.toggle('active', d === state.tab);
    btn.style.setProperty('--tab-color', DOMAIN_META[d].color);
  });
}

function renderKpiCards() {
  const el     = document.getElementById('kpi-cards');
  const series = Object.values(state.data.series).filter(s => s.category === state.tab);
  const color  = DOMAIN_META[state.tab].color;

  el.innerHTML = series.map(s => {
    const active = state.selected.has(s.id);
    const dir    = changeDir(s);
    const arrow  = dir === 'up' ? '▲' : dir === 'down' ? '▼' : '–';

    return `
      <div class="kpi-card ${active ? 'active' : ''}" data-id="${s.id}" style="--card-color:${color}">
        <div class="kpi-name">${s.name}</div>
        <div class="kpi-value">${fmtValue(s)}</div>
        <div class="kpi-change ${dir}"><span>${arrow}</span><span>${fmtChange(s)}</span></div>
        <div class="kpi-meta">
          <span class="kpi-date">${fmtDate(s.latest_date)}</span>
          <span class="freq-badge">${freqLabel(s.frequency)}</span>
        </div>
      </div>`;
  }).join('');

  el.querySelectorAll('.kpi-card').forEach(card => {
    card.addEventListener('click', () => {
      const id = card.dataset.id;
      if (state.selected.has(id)) {
        if (state.selected.size > 1) state.selected.delete(id);
      } else {
        state.selected.add(id);
      }
      syncAndRender();
    });
  });
}

function renderCheckboxes() {
  const el     = document.getElementById('series-checkboxes');
  const series = Object.values(state.data.series).filter(s => s.category === state.tab);
  const colors = DOMAIN_META[state.tab].colors;

  el.innerHTML = series.map((s, i) => `
    <label class="series-cb ${state.selected.has(s.id) ? 'active' : ''}" style="--cb-color:${colors[i % colors.length]}">
      <input type="checkbox" value="${s.id}" ${state.selected.has(s.id) ? 'checked' : ''}>
      <span class="cb-dot"></span>
      <span>${s.name}</span>
    </label>`).join('');

  el.querySelectorAll('input[type="checkbox"]').forEach(cb => {
    cb.addEventListener('change', () => {
      if (!cb.checked && state.selected.size === 1) { cb.checked = true; return; }
      if (cb.checked) state.selected.add(cb.value);
      else            state.selected.delete(cb.value);
      syncAndRender();
    });
  });
}

function renderChart() {
  const sel = [...state.selected].map(id => state.data.series[id]).filter(Boolean);
  if (!sel.length) return;

  const domainSeries = Object.values(state.data.series).filter(s => s.category === state.tab);
  const colors       = DOMAIN_META[state.tab].colors;
  const normalize    = needsNormalization(sel);

  const datasets = sel.map((s) => {
    const idx   = domainSeries.findIndex(ds => ds.id === s.id);
    const color = colors[(idx >= 0 ? idx : 0) % colors.length];

    let hist = filterHistory(s.history, state.window);
    if (normalize) hist = normalizeToIndex(hist);

    return {
      label:           s.name,
      data:            hist.map(pt => ({ x: pt.date, y: pt.value })),
      borderColor:     color,
      backgroundColor: color + '14',
      borderWidth:     1.75,
      pointRadius:     0,
      pointHoverRadius: 4,
      tension:         0.3,
      fill:            sel.length === 1,  // fill area only for single series
    };
  });

  const yUnitLabel = normalize ? 'Index (100 = window start)' : sel[0].unit;

  document.getElementById('chart-note').textContent = normalize
    ? 'Different units — normalized to 100 at window start for comparison'
    : `Source: FRED  ·  Unit: ${sel[0].unit}`;

  const opts = {
    responsive:           true,
    maintainAspectRatio:  false,
    animation:            { duration: 220 },
    interaction:          { mode: 'index', intersect: false },
    plugins: {
      legend: {
        display: sel.length > 1,
        labels: {
          color:           '#8b949e',
          font:            { family: "'IBM Plex Sans', sans-serif", size: 12 },
          boxWidth:        10,
          padding:         18,
          usePointStyle:   true,
          pointStyleWidth: 10,
        },
      },
      tooltip: {
        backgroundColor: '#1c2128',
        titleColor:      '#c9d1d9',
        bodyColor:       '#8b949e',
        borderColor:     '#30363d',
        borderWidth:     1,
        titleFont: { family: "'IBM Plex Sans', sans-serif", size: 12 },
        bodyFont:  { family: "'IBM Plex Mono', monospace", size: 12 },
        padding:   12,
        callbacks: {
          title: items => {
            const d = new Date(items[0].parsed.x);
            return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
          },
          label: ctx => {
            const v    = ctx.parsed.y;
            const s    = sel[ctx.datasetIndex];
            const fmtd = normalize ? v.toFixed(2) : fmtChartY(v, s.unit);
            return `  ${ctx.dataset.label}: ${fmtd}`;
          },
        },
      },
    },
    scales: {
      x: {
        type: 'time',
        time: { unit: inferTimeUnit(), tooltipFormat: 'yyyy-MM-dd' },
        grid:   { color: '#21262d' },
        border: { color: '#30363d' },
        ticks:  {
          color:        '#8b949e',
          font:         { family: "'IBM Plex Sans', sans-serif", size: 11 },
          maxTicksLimit: 9,
        },
      },
      y: {
        grid:   { color: '#21262d' },
        border: { color: '#30363d' },
        ticks:  {
          color:         '#8b949e',
          font:          { family: "'IBM Plex Mono', monospace", size: 11 },
          maxTicksLimit:  7,
          callback:      v => normalize ? v.toFixed(0) : fmtChartY(v, sel[0].unit),
        },
        title: {
          display: true,
          text:    yUnitLabel,
          color:   '#8b949e',
          font:    { family: "'IBM Plex Sans', sans-serif", size: 11 },
        },
      },
    },
  };

  if (state.chart) {
    state.chart.data.datasets = datasets;
    state.chart.options       = opts;
    state.chart.update('active');
  } else {
    const ctx   = document.getElementById('main-chart').getContext('2d');
    state.chart = new Chart(ctx, { type: 'line', data: { datasets }, options: opts });
  }
}

function inferTimeUnit() {
  return state.window === 'all' ? 'quarter' : 'month';
}

// ─── State transitions ────────────────────────────────────────────────────────

function syncAndRender() {
  renderTabs();
  renderKpiCards();
  renderCheckboxes();
  renderChart();
}

function setTab(domain) {
  state.tab      = domain;
  state.selected = new Set(DEFAULT_SELECTED[domain] ?? []);
  if (state.chart) { state.chart.destroy(); state.chart = null; }
  syncAndRender();
}

function setWindow(win) {
  state.window = win;
  document.querySelectorAll('.win-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.window === win);
  });
  renderChart();
}

// ─── Release calendar ─────────────────────────────────────────────────────────

const CAL_URL = './data/release_calendar.json';

const CATEGORY_COLORS = {
  housing:    '#f59e0b',
  labor:      '#06b6d4',
  rates:      '#22c55e',
  gdp_income: '#a855f7',
};

async function loadReleaseCalendar() {
  const el = document.getElementById('release-list');
  try {
    const res = await fetch(CAL_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const cal = await res.json();

    const now    = new Date();
    const cutoff = new Date(now.getTime() + 7 * 86400000);  // next 7 days

    const upcoming = cal.releases.filter(ev => {
      const d = new Date(ev.datetime_utc);
      return d >= now && d <= cutoff;
    });

    if (!upcoming.length) {
      el.innerHTML = '<p style="font-size:0.78rem;color:var(--text-4);padding:0.5rem 0">No releases in the next 7 days.</p>';
      return;
    }

    el.innerHTML = upcoming.map(ev => {
      const color   = CATEGORY_COLORS[ev.category] ?? '#8b949e';
      const dt      = new Date(ev.datetime_utc);
      const isToday = dt.toDateString() === now.toDateString();
      const dayStr  = isToday
        ? 'Today'
        : dt.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      const timeStr = dt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZoneName: 'short' });
      const whenCls = isToday ? 'release-today' : 'release-soon';

      return `
        <div class="release-item" style="--rel-color:${color}">
          <div class="release-dot"></div>
          <div class="release-info">
            <div class="release-name">${ev.name}</div>
            <div class="release-when ${whenCls}">${dayStr} · ${timeStr}</div>
          </div>
        </div>`;
    }).join('');

  } catch (err) {
    el.innerHTML = `<p style="font-size:0.72rem;color:var(--text-4)">Could not load release calendar.</p>`;
  }
}

// ─── About modal ──────────────────────────────────────────────────────────────

function initAboutModal() {
  const overlay  = document.getElementById('about-modal');
  const trigger  = document.getElementById('about-trigger');
  const closeBtn = document.getElementById('modal-close');
  const copyBtn  = document.getElementById('copy-cal-url');
  const copyLbl  = document.getElementById('copy-label');
  const calUrl   = document.getElementById('cal-url-text');

  function openModal()  { overlay.hidden = false; document.body.style.overflow = 'hidden'; }
  function closeModal() { overlay.hidden = true;  document.body.style.overflow = ''; }

  trigger.addEventListener('click', openModal);
  closeBtn.addEventListener('click', closeModal);
  overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !overlay.hidden) closeModal(); });

  copyBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(calUrl.textContent.trim()).then(() => {
      copyLbl.textContent = 'Copied!';
      setTimeout(() => { copyLbl.textContent = 'Copy'; }, 2000);
    });
  });
}

// ─── Init ─────────────────────────────────────────────────────────────────────

async function init() {
  try {
    const res = await fetch(DATA_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status} loading ${DATA_URL}`);
    state.data = await res.json();

    renderHeader();

    document.querySelectorAll('.tab-btn').forEach(btn =>
      btn.addEventListener('click', () => setTab(btn.dataset.domain))
    );
    document.querySelectorAll('.win-btn').forEach(btn =>
      btn.addEventListener('click', () => setWindow(btn.dataset.window))
    );

    // Mark 2yr window active on load
    document.querySelector('.win-btn[data-window="2yr"]').classList.add('active');

    setTab('housing');
    loadReleaseCalendar();  // independent — failure doesn't break main dashboard
    initAboutModal();

  } catch (err) {
    document.getElementById('app').innerHTML = `
      <div class="error-state">
        <p class="err-title">Failed to load dashboard data</p>
        <p class="err-detail">${err.message}</p>
      </div>`;
  }
}

document.addEventListener('DOMContentLoaded', init);
