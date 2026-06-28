'use client';

import React from 'react';
import { Search, TrendingUp, TrendingDown, Eye, CheckCircle, Play } from 'lucide-react';

interface GraphVisualProps {
  currentNode: string;
}

export default function GraphVisual({ currentNode }: GraphVisualProps) {
  // Nodes sequence
  // 'START' -> 'research' -> ('bull_analyst' & 'bear_analyst') -> 'critic' -> 'END'
  const isCompleted = (node: string) => {
    if (currentNode === 'END') return true;
    
    if (node === 'START') return currentNode !== 'START';
    if (node === 'research') return currentNode !== 'START';
    if (node === 'analysts') {
      return (
        currentNode !== 'START' &&
        currentNode !== 'research' &&
        currentNode !== 'bull_analyst' &&
        currentNode !== 'bear_analyst'
      );
    }
    if (node === 'critic') return currentNode === 'critic' || currentNode === 'END';
    return false;
  };

  const isActive = (node: string) => {
    if (currentNode === 'END') return false;
    
    if (node === 'START') return currentNode === 'START';
    if (node === 'research') return currentNode === 'START';
    if (node === 'analysts') {
      return currentNode === 'research' || currentNode === 'bull_analyst';
    }
    if (node === 'critic') return currentNode === 'bear_analyst';
    return false;
  };

  return (
    <div className="glass panel-card" style={{ padding: '1.25rem 1.5rem', marginBottom: '1.5rem' }}>
      <div className="card-title-bar" style={{ paddingBottom: '0.75rem', marginBottom: '0.75rem' }}>
        <h3 className="card-title">
          <Play size={18} className="text-gradient-purple" />
          LangGraph Execution Pipeline
        </h3>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          Active State: <strong style={{ color: 'var(--primary)' }}>{currentNode.toUpperCase()}</strong>
        </span>
      </div>

      <div className="graph-container">
        {/* START NODE */}
        <div className={`graph-node ${isCompleted('START') ? 'completed' : ''} ${isActive('START') ? 'active' : ''}`}>
          <div className="node-icon-wrapper">
            <Play size={18} />
          </div>
          <span className="node-label">START</span>
          <span className="node-status-text">
            {isCompleted('START') ? 'Triggered' : isActive('START') ? 'Active' : 'Idle'}
          </span>
        </div>

        <div className={`graph-connector ${isCompleted('START') ? 'completed' : ''}`} />

        {/* RESEARCH NODE */}
        <div className={`graph-node ${isCompleted('research') ? 'completed' : ''} ${isActive('research') ? 'active' : ''}`}>
          <div className="node-icon-wrapper">
            <Search size={18} />
          </div>
          <span className="node-label">Research Node</span>
          <span className="node-status-text">
            {isCompleted('research') ? 'Data Gathered' : isActive('research') ? 'Analyzing...' : 'Waiting'}
          </span>
        </div>

        <div className={`graph-connector ${isCompleted('research') ? 'completed' : ''} ${isActive('research') ? 'active' : ''}`} />

        {/* ANALYSTS SPLIT NODE */}
        <div className={`graph-node ${isCompleted('analysts') ? 'completed' : ''} ${isActive('analysts') ? 'active' : ''}`} style={{ minWidth: '180px' }}>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <div className="node-icon-wrapper" style={{ margin: 0, width: '28px', height: '28px', color: 'var(--success)' }}>
              <TrendingUp size={14} />
            </div>
            <div className="node-icon-wrapper" style={{ margin: 0, width: '28px', height: '28px', color: 'var(--danger)' }}>
              <TrendingDown size={14} />
            </div>
          </div>
          <span className="node-label">Dialectic Analyst Debates</span>
          <span className="node-status-text">
            {isCompleted('analysts') ? 'Theses Created' : isActive('analysts') ? 'Debating (Parallel)...' : 'Waiting'}
          </span>
        </div>

        <div className={`graph-connector ${isCompleted('analysts') ? 'completed' : ''} ${isActive('analysts') ? 'active' : ''}`} />

        {/* CRITIC NODE */}
        <div className={`graph-node ${isCompleted('critic') ? 'completed' : ''} ${isActive('critic') ? 'active' : ''}`}>
          <div className="node-icon-wrapper">
            <Eye size={18} />
          </div>
          <span className="node-label">Critic Committee</span>
          <span className="node-status-text">
            {isCompleted('critic') ? 'Decision Made' : isActive('critic') ? 'Evaluating Math...' : 'Waiting'}
          </span>
        </div>

        <div className={`graph-connector ${isCompleted('critic') ? 'completed' : ''}`} />

        {/* END NODE */}
        <div className={`graph-node ${currentNode === 'END' ? 'completed' : ''}`}>
          <div className="node-icon-wrapper">
            <CheckCircle size={18} />
          </div>
          <span className="node-label">END</span>
          <span className="node-status-text">
            {currentNode === 'END' ? 'Finished' : 'Waiting'}
          </span>
        </div>
      </div>
    </div>
  );
}
