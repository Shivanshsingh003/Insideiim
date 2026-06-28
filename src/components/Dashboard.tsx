'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Search, ShieldAlert, Cpu, Check, AlertCircle, Newspaper, ArrowUpRight } from 'lucide-react';
import GraphVisual from './GraphVisual';
import DebateArena from './DebateArena';
import Financials from './Financials';
import { CleanFinancials, NewsArticle } from '../lib/tools/finance';

export default function Dashboard() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  // Agent State
  const [ticker, setTicker] = useState('');
  const [financials, setFinancials] = useState<CleanFinancials | null>(null);
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [bullPoints, setBullPoints] = useState<string[]>([]);
  const [bearPoints, setBearPoints] = useState<string[]>([]);
  const [recommendation, setRecommendation] = useState<"INVEST" | "PASS" | "HOLD" | null>(null);
  const [confidenceScore, setConfidenceScore] = useState<number>(0);
  const [reasoningSummary, setReasoningSummary] = useState('');
  const [criticFeedback, setCriticFeedback] = useState('');
  const [logs, setLogs] = useState<string[]>([]);
  const [currentNode, setCurrentNode] = useState('START');

  const consoleEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll logs terminal to bottom
  useEffect(() => {
    if (consoleEndRef.current) {
      consoleEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    // Reset State for New Run
    setLoading(true);
    setTicker('');
    setFinancials(null);
    setNews([]);
    setBullPoints([]);
    setBearPoints([]);
    setRecommendation(null);
    setConfidenceScore(0);
    setReasoningSummary('');
    setCriticFeedback('');
    setLogs([`[System] Initializing pipeline for "${query}"`]);
    setCurrentNode('START');
    setStatusMessage('Spawning agent threads...');

    try {
      const response = await fetch('/api/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyName: query }),
      });

      if (!response.body) {
        throw new Error("ReadableStream is not supported by this server/client.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        
        // Parse SSE framing: data: {...}\n\n
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || ''; // keep trailing partial line

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const jsonStr = line.slice(6);
            try {
              const payload = JSON.parse(jsonStr);
              handleStreamUpdate(payload);
            } catch (err) {
              console.error("Failed to parse SSE JSON chunk:", err);
            }
          }
        }
      }
    } catch (error: any) {
      console.error("Search fetch error:", error);
      setLogs(prev => [...prev, `[System] FATAL ERROR: ${error.message || String(error)}`]);
      setLoading(false);
    }
  };

  const handleStreamUpdate = (payload: any) => {
    const { type, node, state, msg, error } = payload;

    if (type === 'start') {
      setStatusMessage(msg);
      setLogs(prev => [...prev, `[System] ${msg}`]);
    } else if (type === 'update') {
      setCurrentNode(node);
      
      // Update relevant state segments as they stream in
      if (state.ticker) setTicker(state.ticker);
      if (state.financials) setFinancials(state.financials);
      if (state.news) setNews(state.news);
      if (state.bullCasePoints) setBullPoints(state.bullCasePoints);
      if (state.bearCasePoints) setBearPoints(state.bearCasePoints);
      if (state.recommendation) setRecommendation(state.recommendation);
      if (state.confidenceScore) setConfidenceScore(state.confidenceScore);
      if (state.reasoningSummary) setReasoningSummary(state.reasoningSummary);
      if (state.criticFeedback) setCriticFeedback(state.criticFeedback);
      
      if (state.logs && state.logs.length > 0) {
        setLogs(prev => {
          // Add logs that aren't already present
          const uniqueLogs = state.logs.filter((l: string) => !prev.includes(l));
          return [...prev, ...uniqueLogs];
        });
      }

      // Update loader status messages
      if (node === 'research') setStatusMessage('Fetching data and parsing market news...');
      if (node === 'bull_analyst') setStatusMessage('Bull Analyst generating growth drivers...');
      if (node === 'bear_analyst') setStatusMessage('Bear Analyst auditing risk profiles...');
      if (node === 'critic') setStatusMessage('Investment committee validating facts and metrics...');
    } else if (type === 'complete') {
      setCurrentNode('END');
      setStatusMessage('Analysis complete.');
      setLogs(prev => [...prev, `[System] ${msg}`]);
      setLoading(false);
    } else if (type === 'error') {
      setLogs(prev => [...prev, `[System] CRITICAL GRAPH ERROR: ${error}`]);
      setLoading(false);
      setStatusMessage('Analysis aborted due to error.');
    }
  };

  return (
    <div className="dashboard-container">
      {/* Header */}
      <header className="dashboard-header">
        <div className="brand-section">
          <div className="brand-logo">A</div>
          <div>
            <h1 className="brand-title text-gradient">Altuni AI Labs</h1>
            <p className="brand-subtitle">Investment Intelligence System</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          <Cpu size={14} className="animate-spin-slow" style={{ color: 'var(--secondary)' }} />
          <span>Active Agent Core: LangGraph v0.2</span>
        </div>
      </header>

      {/* Search Input Bar */}
      <form onSubmit={handleSearch} className="search-container">
        <div className="search-input-wrapper">
          <Search size={20} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Enter company name or ticker (e.g. Apple, TSLA, Nvidia)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={loading}
          />
          <button type="submit" className="search-button" disabled={loading}>
            {loading ? 'Analyzing...' : 'Investigate'}
          </button>
        </div>
        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', marginTop: '0.75rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            <div className="loader" />
            <span>{statusMessage}</span>
          </div>
        )}
      </form>

      {/* Graph Node Steps Pipeline */}
      {(loading || ticker) && <GraphVisual currentNode={currentNode} />}

      {/* Core Grid */}
      <div className="dashboard-grid">
        
        {/* Left Side: Decision, Debates, News */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Decision Results (INVEST / PASS / HOLD) */}
          {recommendation && (
            <div className={`glass decision-card ${recommendation.toLowerCase() === 'invest' ? 'invest' : recommendation.toLowerCase() === 'pass' ? 'pass' : ''}`}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>
                Agent Committee Decision
              </div>
              
              <div className={`decision-badge ${recommendation.toLowerCase() === 'invest' ? 'invest' : recommendation.toLowerCase() === 'pass' ? 'pass' : ''}`}>
                {recommendation === 'INVEST' && <Check size={24} style={{ marginRight: '0.25rem' }} />}
                {recommendation === 'PASS' && <ShieldAlert size={24} style={{ marginRight: '0.25rem' }} />}
                {recommendation === 'HOLD' && <AlertCircle size={24} style={{ marginRight: '0.25rem' }} />}
                {recommendation}
              </div>

              {/* Confidence Circle/Rating */}
              <div className="confidence-ring-container">
                <div style={{ position: 'relative', width: '90px', height: '90px', borderRadius: '50%', background: 'rgba(255,255,255,0.03)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '2px solid rgba(99, 102, 241, 0.2)', boxShadow: '0 0 15px rgba(99, 102, 241, 0.1)' }}>
                  <span style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-primary)' }}>{confidenceScore}%</span>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Confidence</span>
                </div>
              </div>

              <div style={{ padding: '0 1rem' }}>
                <p style={{ fontSize: '0.95rem', fontWeight: '500', lineHeight: '1.5', color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
                  {reasoningSummary}
                </p>
                {criticFeedback && (
                  <div style={{ background: 'rgba(255,255,255,0.02)', padding: '0.75rem', borderRadius: '8px', border: '1px dashed rgba(255,255,255,0.08)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    <strong>Math & Data Audit Check:</strong> {criticFeedback}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Dialectic Debate Arena */}
          {(loading || bullPoints.length > 0 || bearPoints.length > 0) && (
            <DebateArena bullPoints={bullPoints} bearPoints={bearPoints} />
          )}

          {/* Recent Market News Feed */}
          {news.length > 0 && (
            <div className="glass panel-card">
              <div className="card-title-bar">
                <h3 className="card-title">
                  <Newspaper size={20} className="text-gradient-purple" />
                  Recent Sentiment Catalysts
                </h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {news.map((item, idx) => (
                  <a
                    key={idx}
                    href={item.link}
                    target="_blank"
                    rel="noreferrer"
                    className="glass glass-interactive"
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', borderRadius: '10px', textDecoration: 'none', color: 'inherit', fontSize: '0.85rem' }}
                  >
                    <div style={{ paddingRight: '1rem' }}>
                      <p style={{ fontWeight: '500', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>{item.title}</p>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {item.publisher} &bull; {item.pubDate}
                      </span>
                    </div>
                    <ArrowUpRight size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                  </a>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Right Side: Financials, Metric Metrics & Agent Console Logs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Financial Statements & Profile Viewer */}
          {(loading || financials) && <Financials financials={financials} />}

          {/* Real-time Agent Log Console Terminal */}
          {(loading || logs.length > 0) && (
            <div className="glass panel-card">
              <div className="card-title-bar" style={{ paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>
                <h4 style={{ fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ width: '8px', height: '8px', background: 'var(--primary)', borderRadius: '50%', display: 'inline-block' }} />
                  Agent Execution Console Logs
                </h4>
              </div>
              <div className="terminal-panel">
                {logs.map((log, index) => {
                  let styleClass = 'system';
                  if (log.includes('[Research]')) styleClass = 'system';
                  if (log.includes('[Bull Analyst]')) styleClass = 'success';
                  if (log.includes('[Bear Analyst]')) styleClass = 'danger';
                  if (log.includes('[Critic]')) styleClass = 'warning';
                  if (log.includes('ERROR')) styleClass = 'danger';

                  return (
                    <div key={index} className="log-entry">
                      <span className="log-time">[{new Date().toLocaleTimeString()}]</span>
                      <span className={`log-text ${styleClass}`}>{log}</span>
                    </div>
                  );
                })}
                <div ref={consoleEndRef} />
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
