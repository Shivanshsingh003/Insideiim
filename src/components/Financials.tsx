'use client';

import React from 'react';
import { CleanFinancials } from '../lib/tools/finance';
import { Landmark, Globe, Briefcase, Award } from 'lucide-react';

interface FinancialsProps {
  financials: CleanFinancials | null;
}

export default function Financials({ financials }: FinancialsProps) {
  if (!financials) {
    return (
      <div className="glass panel-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Search for a company to examine financial statements and metrics...
        </p>
      </div>
    );
  }

  const { summary, metrics, history } = financials;

  // Format Large Currency Numbers (e.g. market cap)
  const formatLargeNum = (num: number | null) => {
    if (num === null || num === undefined) return 'N/A';
    if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    return `$${num.toLocaleString()}`;
  };

  // Format percentage metrics
  const formatPercent = (val: number | null) => {
    if (val === null || val === undefined) return 'N/A';
    return `${(val * 100).toFixed(2)}%`;
  };

  // SVG Chart Dimensions & Computations
  const chartHeight = 140;
  const chartWidth = 360;
  const barPadding = 25;
  const graphHistory = history.revenue.slice(-4); // last 4 data points
  const maxRevenue = Math.max(...graphHistory.map(h => h.value), 1);
  const chartBars = graphHistory.map((h, i) => {
    const netIncomeVal = history.netIncome.find(n => n.year === h.year)?.value || 0;
    const revHeight = (h.value / maxRevenue) * chartHeight;
    const netHeight = (Math.abs(netIncomeVal) / maxRevenue) * chartHeight;
    const barWidth = 35;
    
    // X Positions
    const xPos = i * (chartWidth / graphHistory.length) + barPadding;
    
    return {
      year: h.year,
      revX: xPos,
      revY: chartHeight - revHeight,
      revHeight,
      netX: xPos + 12,
      netY: chartHeight - netHeight,
      netHeight,
      netIsNegative: netIncomeVal < 0,
      revRaw: formatLargeNum(h.value),
      netRaw: formatLargeNum(netIncomeVal),
    };
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Sector and Profile */}
      <div className="glass panel-card">
        <div className="card-title-bar">
          <h3 className="card-title">
            <Landmark size={20} className="text-gradient-purple" />
            Company Profile & Core Metrics
          </h3>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.875rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <Briefcase size={14} style={{ color: 'var(--primary)' }} />
              <span style={{ color: 'var(--text-muted)' }}>Sector / Industry</span>
            </div>
            <p style={{ fontWeight: '500' }}>{summary.sector} / {summary.industry}</p>
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <Globe size={14} style={{ color: 'var(--primary)' }} />
              <span style={{ color: 'var(--text-muted)' }}>Website</span>
            </div>
            {summary.website ? (
              <a href={summary.website} target="_blank" rel="noreferrer" style={{ color: 'var(--primary)', textDecoration: 'none' }}>
                {summary.website.replace(/^https?:\/\/(www\.)?/, '')}
              </a>
            ) : 'N/A'}
          </div>
        </div>

        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.4', marginTop: '0.5rem' }}>
          {summary.longBusinessSummary.slice(0, 220)}...
        </p>
      </div>

      {/* Numerical Health Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
        <div className="glass metric-box" style={{ padding: '1rem' }}>
          <div className="metric-val">{formatLargeNum(metrics.marketCap)}</div>
          <div className="metric-lbl">Market Capitalization</div>
        </div>
        <div className="glass metric-box" style={{ padding: '1rem' }}>
          <div className="metric-val">${metrics.currentPrice.toFixed(2)}</div>
          <div className="metric-lbl">Current Stock Price</div>
        </div>
        <div className="glass metric-box" style={{ padding: '1rem' }}>
          <div className="metric-val">{metrics.peRatio ? metrics.peRatio.toFixed(2) : 'N/A'}</div>
          <div className="metric-lbl">Trailing PE Ratio</div>
        </div>
        <div className="glass metric-box" style={{ padding: '1rem' }}>
          <div className="metric-val">{formatPercent(metrics.profitMargin)}</div>
          <div className="metric-lbl">Net Profit Margin</div>
        </div>
        <div className="glass metric-box" style={{ padding: '1rem' }}>
          <div className="metric-val">{metrics.debtToEquity ? (metrics.debtToEquity).toFixed(2) : 'N/A'}</div>
          <div className="metric-lbl">Debt to Equity Ratio</div>
        </div>
        <div className="glass metric-box" style={{ padding: '1rem' }}>
          <div className="metric-val">{formatLargeNum(metrics.freeCashFlow)}</div>
          <div className="metric-lbl">Free Cash Flow (FCF)</div>
        </div>
      </div>

      {/* SVG Historical Chart */}
      {chartBars.length > 0 && (
        <div className="glass panel-card">
          <div className="card-title-bar" style={{ marginBottom: '0.5rem' }}>
            <h3 className="card-title">
              <Award size={20} className="text-gradient-purple" />
              Annual Growth Trends (USD)
            </h3>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'center', margin: '1rem 0' }}>
            <svg width={chartWidth} height={chartHeight + 30} style={{ overflow: 'visible' }}>
              {chartBars.map((bar, idx) => (
                <g key={bar.year}>
                  {/* Revenue Bar */}
                  <rect
                    x={bar.revX}
                    y={bar.revY}
                    width={10}
                    height={bar.revHeight}
                    fill="var(--primary)"
                    rx={2}
                    opacity={0.85}
                  />
                  {/* Net Income Bar */}
                  <rect
                    x={bar.netX}
                    y={bar.netY}
                    width={10}
                    height={bar.netHeight}
                    fill={bar.netIsNegative ? 'var(--danger)' : 'var(--success)'}
                    rx={2}
                    opacity={0.85}
                  />
                  {/* Year Label */}
                  <text
                    x={bar.revX + 10}
                    y={chartHeight + 20}
                    fill="var(--text-muted)"
                    fontSize="10"
                    textAnchor="middle"
                    fontFamily="var(--font-mono)"
                  >
                    {bar.year}
                  </text>
                </g>
              ))}
              
              {/* Ground line */}
              <line
                x1={10}
                y1={chartHeight}
                x2={chartWidth}
                y2={chartHeight}
                stroke="rgba(255,255,255,0.1)"
                strokeWidth={1}
              />
            </svg>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <div style={{ width: '10px', height: '10px', background: 'var(--primary)', borderRadius: '2px' }} />
              Revenue
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <div style={{ width: '10px', height: '10px', background: 'var(--success)', borderRadius: '2px' }} />
              Net Income (Profitable)
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <div style={{ width: '10px', height: '10px', background: 'var(--danger)', borderRadius: '2px' }} />
              Net Income (Loss)
            </div>
          </div>
        </div>
      )}

      {/* Historical Stats Table */}
      <div className="glass panel-card">
        <div className="card-title-bar">
          <h4 style={{ fontSize: '0.95rem', fontWeight: '600' }}>Statement Breakdown (3-Year History)</h4>
        </div>
        <div className="financials-table-wrapper">
          <table className="financials-table">
            <thead>
              <tr>
                <th>Year</th>
                <th>Revenue</th>
                <th>Net Income</th>
                <th>Op. Cash Flow</th>
              </tr>
            </thead>
            <tbody>
              {history.revenue.map((r, i) => {
                const year = r.year;
                const netInc = history.netIncome.find(n => n.year === year)?.value ?? null;
                const ocf = history.operatingCashflow.find(o => o.year === year)?.value ?? null;
                return (
                  <tr key={i}>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>{year}</td>
                    <td>{formatLargeNum(r.value)}</td>
                    <td style={{ color: netInc && netInc < 0 ? 'var(--danger)' : 'var(--success)' }}>
                      {formatLargeNum(netInc)}
                    </td>
                    <td>{formatLargeNum(ocf)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
