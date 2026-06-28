'use client';

import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface DebateArenaProps {
  bullPoints: string[];
  bearPoints: string[];
}

export default function DebateArena({ bullPoints, bearPoints }: DebateArenaProps) {
  const hasArguments = bullPoints.length > 0 || bearPoints.length > 0;

  if (!hasArguments) {
    return (
      <div className="glass panel-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '200px' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Awaiting dialectic analysis from the Bull and Bear agents...
        </p>
      </div>
    );
  }

  return (
    <div className="debate-arena">
      {/* Bull Case */}
      <div className="glass panel-card bull-case-card">
        <div className="card-title-bar">
          <h3 className="card-title" style={{ color: 'var(--success)' }}>
            <TrendingUp size={20} />
            Bull Analyst Case (Growth Factors)
          </h3>
          <span style={{ fontSize: '0.75rem', color: 'var(--success)', fontWeight: 'bold' }}>LONG THESIS</span>
        </div>
        <ul className="point-list" style={{ listStyle: 'none' }}>
          {bullPoints.map((point, index) => (
            <li key={index} className="point-item">
              <span className="point-bullet bull-bullet">▲</span>
              <span>{point}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Bear Case */}
      <div className="glass panel-card bear-case-card">
        <div className="card-title-bar">
          <h3 className="card-title" style={{ color: 'var(--danger)' }}>
            <TrendingDown size={20} />
            Bear Analyst Case (Risk Factors)
          </h3>
          <span style={{ fontSize: '0.75rem', color: 'var(--danger)', fontWeight: 'bold' }}>SHORT THESIS</span>
        </div>
        <ul className="point-list" style={{ listStyle: 'none' }}>
          {bearPoints.map((point, index) => (
            <li key={index} className="point-item">
              <span className="point-bullet bear-bullet">▼</span>
              <span>{point}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
