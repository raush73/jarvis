'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import {
  mockOrder,
  Bucket,
  Candidate,
  Trade,
  getBucketTradeBreakdown,
  getOpenSlots,
} from '@/data/mockRecruitingData';
import { BucketTradeSummary } from '@/components/BucketTradeSummary';
import { RecruitingSourcingPanel } from '@/components/RecruitingSourcingPanel';

/**
 * Recruiting Page v2 — Canonical Flow
 * 
 * Implements the recruiting pipeline with conditional Customer-Held gate:
 * - Recruiting (Identified/Interested/Vetted combined view)
 * - Customer-Held (conditional gate - only when pre-approval required)
 * - Staging
 * - Dispatched
 * - No-Show (distinct bucket for workers who no-showed)
 * 
 * Trade counts show Open / Total Required.
 * Open only changes at Dispatch.
 */

// Mock PPE list (FULL list always shown per spec)
const REQUIRED_PPE = [
  'Hard hat',
  'Safety glasses',
  'Hi-vis vest',
  'Gloves',
  'Steel-toe boots',
  'FR clothing',
];

// Mock tools list (required for job, but only missing shown to workers)
const REQUIRED_TOOLS = [
  'Torque Wrenches',
  'Dial Indicators',
  'Laser Alignment Kit',
  'Rigging Equipment',
  'Multimeter',
  'Pipe Wrenches',
];

// Mock certifications required
const REQUIRED_CERTS = [
  'OSHA 30',
  'First Aid/CPR',
  'Confined Space Entry',
];

// Mock No-Show candidates
const MOCK_NO_SHOWS: Candidate[] = [
  {
    id: 'noshow_001',
    name: 'Carlos Mendez',
    tradeId: 'trade_elec',
    tradeName: 'Electrician',
    phone: '(555) 999-1111',
    email: 'carlos.m@email.com',
    distance: 15,
    sourceType: 'recruiter',
    certifications: [
      { id: 'cert_ns1', name: 'Journeyman Electrician', verified: true },
    ],
    availability: 'available',
    dispatchStartDate: '2026-01-27',
  },
];

export default function RecruitingPage() {
  const params = useParams();
  const orderId = params?.id as string;
  
  // Use mock data
  const order = mockOrder;
  
  // State for customer pre-approval toggle (UI-only)
  const [requiresPreApproval, setRequiresPreApproval] = useState(order.requiresCustomerPreApproval);
  
  // State for dispatch modal
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [dispatchDate, setDispatchDate] = useState('');
  
  // State for Dispatch Order Preview panel
  const [showDispatchPreview, setShowDispatchPreview] = useState(false);
  const [previewCandidate, setPreviewCandidate] = useState<Candidate | null>(null);
  
  // State for No-Show candidates (UI-only mock)
  const [noShowCandidates, setNoShowCandidates] = useState<Candidate[]>(MOCK_NO_SHOWS);

  // Filter buckets: show Customer-Held only if requiresPreApproval toggle is ON
  const visibleBuckets = order.buckets.filter(bucket => {
    if (bucket.id === 'customer_held') {
      return requiresPreApproval;
    }
    return true;
  });

  // Separate primary pipeline from conditional gate
  const primaryBuckets = visibleBuckets.filter(b => b.id !== 'customer_held');
  const customerHeldBucket = visibleBuckets.find(b => b.id === 'customer_held');

  // Handler for adding to Identified (mock)
  const handleAddToIdentified = (candidate: Candidate) => {
    console.log('Adding to Identified:', candidate.name);
    // UI-only: no actual state change
  };

  // Handler for dispatch
  const handleDispatch = (candidate: Candidate) => {
    setSelectedCandidate(candidate);
    setShowDispatchModal(true);
  };

  // Handler for viewing Dispatch Order Preview
  const handleViewDispatchOrder = (candidate: Candidate) => {
    setPreviewCandidate(candidate);
    setShowDispatchPreview(true);
  };
  
  // Handler for redispatching a no-show
  const handleRedispatch = (candidate: Candidate) => {
    // UI-only: remove from no-show list (mock behavior)
    setNoShowCandidates(prev => prev.filter(c => c.id !== candidate.id));
    console.log('Redispatching:', candidate.name, 'back to Recruiting/Staging');
  };

  // Calculate total candidates and dispatched
  const totalCandidates = order.buckets.reduce((sum, b) => sum + b.candidates.length, 0);
  const dispatchedCount = order.buckets.find(b => b.id === 'dispatched')?.candidates.length || 0;
  const totalRequired = order.trades.reduce((sum, t) => sum + t.totalRequired, 0);

  return (
    <div className="recruiting-page">
      {/* Order Context Header */}
      <header className="order-header">
        <div className="header-left">
          <div className="breadcrumb">
            <span className="breadcrumb-item">Orders</span>
            <span className="breadcrumb-sep">/</span>
            <span className="breadcrumb-item active">{order.id}</span>
            <span className="breadcrumb-sep">/</span>
            <span className="breadcrumb-item active">Recruiting</span>
          </div>
          <h1 className="order-title">{order.projectName}</h1>
          <div className="order-meta">
            <span className="meta-item">
              <span className="meta-icon">🏢</span>
              {order.customerName}
            </span>
            <span className="meta-item">
              <span className="meta-icon">📍</span>
              {order.location}
            </span>
          </div>
        </div>
        <div className="header-right">
          {/* Trade Chips showing Open/Total */}
          <div className="trade-chips">
            {order.trades.map(trade => {
              const open = getOpenSlots(trade);
              // Create short trade code
              const code = trade.name.split(' ').map(w => w[0]).join('').toUpperCase();
              return (
                <span key={trade.id} className="trade-chip">
                  <span className="chip-code">{code}</span>
                  <span className="chip-counts">{open}/{trade.totalRequired}</span>
                </span>
              );
            })}
          </div>
          
          {/* Customer Pre-Approval Toggle */}
          <div className="preapproval-toggle">
            <label className="toggle-label">
              <span className="toggle-text">Customer requires pre-approval</span>
              <div className="toggle-switch">
                <input
                  type="checkbox"
                  checked={requiresPreApproval}
                  onChange={(e) => setRequiresPreApproval(e.target.checked)}
                />
                <span className="toggle-slider"></span>
              </div>
              <span className={`toggle-state ${requiresPreApproval ? 'on' : 'off'}`}>
                {requiresPreApproval ? 'ON' : 'OFF'}
              </span>
            </label>
          </div>
        </div>
      </header>

      {/* Customer Visibility Reminder */}
      <div className="customer-visibility-note">
        <span className="note-icon">👁️</span>
        <span className="note-text">Customer view includes only workers who worked (no recruiting activity or no-shows).</span>
      </div>

      {/* Sourcing Section */}
      <section className="sourcing-section">
        <h2 className="section-title">Candidate Sourcing</h2>
        <RecruitingSourcingPanel onAddToIdentified={handleAddToIdentified} />
      </section>

      {/* Recruiting Pipeline */}
      <section className="pipeline-section">
        <h2 className="section-title">Recruiting Pipeline</h2>
        <p className="section-desc">
          {totalCandidates} candidates in pipeline • {dispatchedCount} dispatched / {totalRequired} required
        </p>

        <div className="pipeline-container">
          {/* Primary Pipeline Buckets */}
          <div className="primary-pipeline">
            {primaryBuckets.map((bucket, index) => (
              <BucketColumn
                key={bucket.id}
                bucket={bucket}
                trades={order.trades}
                isLast={index === primaryBuckets.length - 1}
                onDispatch={handleDispatch}
                onViewDispatchOrder={handleViewDispatchOrder}
              />
            ))}
            
            {/* No-Show Bucket */}
            <NoShowBucket
              candidates={noShowCandidates}
              onRedispatch={handleRedispatch}
            />
          </div>

          {/* Customer-Held Side Rail (conditional) */}
          {customerHeldBucket && (
            <div className="conditional-rail">
              <div className="rail-label">
                <span className="rail-icon">🔒</span>
                Conditional Gate
              </div>
              <BucketColumn
                bucket={customerHeldBucket}
                trades={order.trades}
                isConditional
                onDispatch={handleDispatch}
                onViewDispatchOrder={handleViewDispatchOrder}
              />
            </div>
          )}
        </div>
      </section>

      {/* Trade Requirements Summary Table */}
      <section className="trade-summary-section">
        <h2 className="section-title">Trade Requirements Summary</h2>
        <table className="trade-summary-table">
          <thead>
            <tr>
              <th>Trade</th>
              <th>Total Required</th>
              <th>Dispatched</th>
              <th>Open</th>
            </tr>
          </thead>
          <tbody>
            {order.trades.map(trade => {
              const open = getOpenSlots(trade);
              return (
                <tr key={trade.id}>
                  <td className="trade-name-cell">{trade.name}</td>
                  <td className="count-cell">{trade.totalRequired}</td>
                  <td className="count-cell dispatched">{trade.dispatched}</td>
                  <td className="count-cell open">{open}</td>
                </tr>
              );
            })}
            <tr className="totals-row">
              <td className="trade-name-cell"><strong>Total</strong></td>
              <td className="count-cell"><strong>{totalRequired}</strong></td>
              <td className="count-cell dispatched"><strong>{dispatchedCount}</strong></td>
              <td className="count-cell open"><strong>{totalRequired - dispatchedCount}</strong></td>
            </tr>
          </tbody>
        </table>
        <p className="summary-note">Open count changes only when a worker is dispatched.</p>
      </section>

      {/* Dispatch Modal */}
      {showDispatchModal && selectedCandidate && (
        <DispatchModal
          candidate={selectedCandidate}
          dispatchDate={dispatchDate}
          onDateChange={setDispatchDate}
          onClose={() => {
            setShowDispatchModal(false);
            setSelectedCandidate(null);
            setDispatchDate('');
          }}
          onConfirm={() => {
            console.log('Dispatching:', selectedCandidate.name, 'on', dispatchDate);
            setShowDispatchModal(false);
            setSelectedCandidate(null);
            setDispatchDate('');
          }}
        />
      )}
      
      {/* Dispatch Order Preview Panel */}
      {showDispatchPreview && previewCandidate && (
        <DispatchOrderPreview
          candidate={previewCandidate}
          requiredPPE={REQUIRED_PPE}
          requiredTools={REQUIRED_TOOLS}
          requiredCerts={REQUIRED_CERTS}
          onClose={() => {
            setShowDispatchPreview(false);
            setPreviewCandidate(null);
          }}
        />
      )}

      <style jsx>{`
        .recruiting-page {
          min-height: 100vh;
          background: linear-gradient(180deg, #0c0f14 0%, #111827 100%);
          color: #fff;
          padding: 24px;
          font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif;
        }

        /* Order Header */
        .order-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding: 20px 24px;
          background: linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.9) 100%);
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          margin-bottom: 16px;
        }

        .breadcrumb {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
        }

        .breadcrumb-item {
          font-size: 13px;
          color: rgba(255, 255, 255, 0.5);
        }

        .breadcrumb-item.active {
          color: rgba(255, 255, 255, 0.8);
        }

        .breadcrumb-sep {
          color: rgba(255, 255, 255, 0.3);
        }

        .order-title {
          margin: 0 0 12px 0;
          font-size: 24px;
          font-weight: 700;
          background: linear-gradient(135deg, #fff 0%, #94a3b8 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .order-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 20px;
        }

        .meta-item {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          color: rgba(255, 255, 255, 0.7);
        }

        .meta-icon {
          font-size: 14px;
        }

        .header-right {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 14px;
        }

        /* Trade Chips */
        .trade-chips {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .trade-chip {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 10px;
          background: rgba(59, 130, 246, 0.15);
          border: 1px solid rgba(59, 130, 246, 0.3);
          border-radius: 6px;
          font-size: 12px;
        }

        .chip-code {
          font-weight: 700;
          color: #60a5fa;
        }

        .chip-counts {
          color: rgba(255, 255, 255, 0.8);
          font-family: 'SF Mono', monospace;
        }

        /* Pre-Approval Toggle */
        .preapproval-toggle {
          background: rgba(0, 0, 0, 0.3);
          padding: 10px 14px;
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .toggle-label {
          display: flex;
          align-items: center;
          gap: 12px;
          cursor: pointer;
        }

        .toggle-text {
          font-size: 13px;
          color: rgba(255, 255, 255, 0.8);
        }

        .toggle-switch {
          position: relative;
          width: 44px;
          height: 24px;
        }

        .toggle-switch input {
          opacity: 0;
          width: 0;
          height: 0;
        }

        .toggle-slider {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(255, 255, 255, 0.15);
          transition: 0.3s;
          border-radius: 24px;
        }

        .toggle-slider:before {
          position: absolute;
          content: "";
          height: 18px;
          width: 18px;
          left: 3px;
          bottom: 3px;
          background-color: white;
          transition: 0.3s;
          border-radius: 50%;
        }

        .toggle-switch input:checked + .toggle-slider {
          background-color: #f59e0b;
        }

        .toggle-switch input:checked + .toggle-slider:before {
          transform: translateX(20px);
        }

        .toggle-state {
          font-size: 11px;
          font-weight: 600;
          padding: 2px 8px;
          border-radius: 4px;
        }

        .toggle-state.on {
          background: rgba(245, 158, 11, 0.2);
          color: #fbbf24;
        }

        .toggle-state.off {
          background: rgba(255, 255, 255, 0.1);
          color: rgba(255, 255, 255, 0.5);
        }

        /* Customer Visibility Note */
        .customer-visibility-note {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 16px;
          background: rgba(59, 130, 246, 0.1);
          border: 1px solid rgba(59, 130, 246, 0.2);
          border-radius: 8px;
          margin-bottom: 24px;
        }

        .note-icon {
          font-size: 16px;
        }

        .note-text {
          font-size: 13px;
          color: rgba(255, 255, 255, 0.8);
        }

        /* Section Styles */
        .section-title {
          font-size: 16px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.9);
          margin: 0 0 16px 0;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .section-desc {
          font-size: 13px;
          color: rgba(255, 255, 255, 0.5);
          margin: -8px 0 16px 0;
        }

        /* Sourcing Section */
        .sourcing-section {
          margin-bottom: 24px;
        }

        /* Pipeline Section */
        .pipeline-section {
          margin-bottom: 24px;
        }

        .pipeline-container {
          display: flex;
          gap: 20px;
        }

        .primary-pipeline {
          display: flex;
          gap: 12px;
          flex: 1;
          overflow-x: auto;
          padding-bottom: 12px;
        }

        .conditional-rail {
          min-width: 280px;
          max-width: 300px;
          background: rgba(245, 158, 11, 0.05);
          border: 1px dashed rgba(245, 158, 11, 0.3);
          border-radius: 12px;
          padding: 12px;
        }

        .rail-label {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #fbbf24;
          margin-bottom: 12px;
          padding-bottom: 8px;
          border-bottom: 1px solid rgba(245, 158, 11, 0.2);
        }

        .rail-icon {
          font-size: 14px;
        }

        /* Trade Summary Section */
        .trade-summary-section {
          margin-bottom: 24px;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          padding: 20px;
        }

        .trade-summary-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 12px;
        }

        .trade-summary-table th,
        .trade-summary-table td {
          padding: 12px 16px;
          text-align: left;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }

        .trade-summary-table th {
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: rgba(255, 255, 255, 0.5);
          background: rgba(0, 0, 0, 0.2);
        }

        .trade-name-cell {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.9);
        }

        .count-cell {
          font-size: 14px;
          font-family: 'SF Mono', monospace;
          color: rgba(255, 255, 255, 0.7);
          text-align: center;
        }

        .count-cell.dispatched {
          color: #34d399;
        }

        .count-cell.open {
          color: #60a5fa;
        }

        .totals-row {
          background: rgba(255, 255, 255, 0.03);
        }

        .totals-row td {
          border-bottom: none;
        }

        .summary-note {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.5);
          font-style: italic;
          margin: 0;
        }
      `}</style>
    </div>
  );
}

// Trade Requirement Card
function TradeRequirementCard({ trade }: { trade: Trade }) {
  const openSlots = getOpenSlots(trade);
  const fillPercentage = (trade.dispatched / trade.totalRequired) * 100;

  return (
    <div className="trade-card">
      <div className="trade-header">
        <span className="trade-name">{trade.name}</span>
        <span className="trade-count">
          {openSlots} <span className="count-label">open</span> / {trade.totalRequired}
        </span>
      </div>
      <div className="progress-bar">
        <div
          className="progress-fill"
          style={{ width: `${Math.min(fillPercentage, 100)}%` }}
        />
      </div>
      <div className="trade-footer">
        <span className="dispatched-count">{trade.dispatched} dispatched</span>
      </div>

      <style jsx>{`
        .trade-card {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 10px;
          padding: 14px;
        }

        .trade-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
        }

        .trade-name {
          font-size: 14px;
          font-weight: 600;
          color: #fff;
        }

        .trade-count {
          font-size: 14px;
          font-weight: 700;
          color: #60a5fa;
        }

        .count-label {
          font-weight: 400;
          color: rgba(255, 255, 255, 0.5);
        }

        .progress-bar {
          height: 6px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 3px;
          overflow: hidden;
          margin-bottom: 8px;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #3b82f6 0%, #8b5cf6 100%);
          border-radius: 3px;
          transition: width 0.3s ease;
        }

        .trade-footer {
          display: flex;
          justify-content: flex-end;
        }

        .dispatched-count {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.5);
        }
      `}</style>
    </div>
  );
}

// No-Show Bucket Component
function NoShowBucket({
  candidates,
  onRedispatch,
}: {
  candidates: Candidate[];
  onRedispatch: (candidate: Candidate) => void;
}) {
  return (
    <div className="noshow-bucket">
      <div className="bucket-header">
        <div className="bucket-title-row">
          <h3 className="bucket-name">No-Show</h3>
          <span className="bucket-count">{candidates.length}</span>
        </div>
        <span className="bucket-desc">Dispatched workers who did not report</span>
      </div>

      <div className="bucket-candidates">
        {candidates.length === 0 ? (
          <div className="empty-state">No no-shows</div>
        ) : (
          candidates.map(candidate => (
            <div key={candidate.id} className="noshow-card">
              <div className="card-header">
                <span className="candidate-name">{candidate.name}</span>
                <span className="noshow-badge">No-Show (0 hrs)</span>
              </div>
              <div className="card-details">
                <span className="trade-badge">{candidate.tradeName}</span>
                <span className="dispatch-date">Was: {candidate.dispatchStartDate}</span>
              </div>
              <button className="redispatch-btn" onClick={() => onRedispatch(candidate)}>
                ↩ Redispatch
              </button>
            </div>
          ))
        )}
      </div>

      <style jsx>{`
        .noshow-bucket {
          min-width: 260px;
          max-width: 280px;
          flex-shrink: 0;
          background: rgba(239, 68, 68, 0.08);
          border-radius: 12px;
          border: 1px solid rgba(239, 68, 68, 0.2);
          display: flex;
          flex-direction: column;
        }

        .bucket-header {
          padding: 14px;
          border-bottom: 2px solid #ef4444;
          background: rgba(239, 68, 68, 0.1);
          border-radius: 12px 12px 0 0;
        }

        .bucket-title-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .bucket-name {
          margin: 0;
          font-size: 14px;
          font-weight: 600;
          color: #f87171;
        }

        .bucket-count {
          font-size: 13px;
          font-weight: 700;
          color: #fff;
          padding: 2px 10px;
          border-radius: 12px;
          background: #ef4444;
        }

        .bucket-desc {
          display: block;
          margin-top: 4px;
          font-size: 11px;
          color: rgba(255, 255, 255, 0.5);
        }

        .bucket-candidates {
          flex: 1;
          padding: 12px;
          overflow-y: auto;
          max-height: 400px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .empty-state {
          text-align: center;
          padding: 24px;
          color: rgba(255, 255, 255, 0.4);
          font-size: 13px;
          font-style: italic;
        }

        .noshow-card {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.25);
          border-radius: 8px;
          padding: 12px;
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 8px;
        }

        .candidate-name {
          font-size: 13px;
          font-weight: 600;
          color: #fff;
        }

        .noshow-badge {
          font-size: 10px;
          font-weight: 600;
          padding: 3px 8px;
          background: rgba(239, 68, 68, 0.3);
          color: #fca5a5;
          border-radius: 4px;
        }

        .card-details {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 10px;
        }

        .trade-badge {
          font-size: 10px;
          padding: 2px 6px;
          background: rgba(99, 102, 241, 0.2);
          color: #a5b4fc;
          border-radius: 4px;
        }

        .dispatch-date {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.5);
        }

        .redispatch-btn {
          width: 100%;
          padding: 8px;
          background: rgba(59, 130, 246, 0.2);
          border: 1px solid rgba(59, 130, 246, 0.3);
          border-radius: 6px;
          color: #60a5fa;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .redispatch-btn:hover {
          background: rgba(59, 130, 246, 0.3);
          border-color: rgba(59, 130, 246, 0.5);
        }
      `}</style>
    </div>
  );
}

// Bucket Column Component
function BucketColumn({
  bucket,
  trades,
  isLast,
  isConditional,
  onDispatch,
  onViewDispatchOrder,
}: {
  bucket: Bucket;
  trades: Trade[];
  isLast?: boolean;
  isConditional?: boolean;
  onDispatch: (candidate: Candidate) => void;
  onViewDispatchOrder: (candidate: Candidate) => void;
}) {
  const tradeBreakdown = getBucketTradeBreakdown(bucket, trades);
  const isDispatchedBucket = bucket.id === 'dispatched';
  const isPreDispatchBucket = bucket.id === 'pre_dispatch';

  // Bucket color mapping
  const bucketColors: Record<string, string> = {
    identified: '#6366f1',
    interested: '#8b5cf6',
    vetted: '#a855f7',
    customer_held: '#f59e0b',
    pre_dispatch: '#22c55e',
    dispatched: '#10b981',
  };

  const accentColor = bucketColors[bucket.id] || '#6366f1';

  return (
    <div className={`bucket-column ${isConditional ? 'conditional' : ''}`}>
      <div className="bucket-header" style={{ borderColor: accentColor }}>
        <div className="bucket-title-row">
          <h3 className="bucket-name">{bucket.name}</h3>
          <span className="bucket-count" style={{ background: accentColor }}>
            {bucket.candidates.length}
          </span>
        </div>
        <BucketTradeSummary tradeCounts={tradeBreakdown} />
      </div>

      <div className="bucket-candidates">
        {bucket.candidates.length === 0 ? (
          <div className="empty-state">No candidates</div>
        ) : (
          bucket.candidates.map(candidate => (
            <CandidateCard
              key={candidate.id}
              candidate={candidate}
              bucketId={bucket.id}
              showDispatchButton={isPreDispatchBucket}
              showDispatchDate={isDispatchedBucket}
              onDispatch={() => onDispatch(candidate)}
              onViewDispatchOrder={() => onViewDispatchOrder(candidate)}
            />
          ))
        )}
      </div>

      {!isLast && !isConditional && !isDispatchedBucket && (
        <div className="bucket-actions">
          <button className="action-btn" disabled>
            Move Selected →
          </button>
        </div>
      )}

      <style jsx>{`
        .bucket-column {
          min-width: 280px;
          max-width: 320px;
          flex-shrink: 0;
          background: rgba(0, 0, 0, 0.2);
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          display: flex;
          flex-direction: column;
        }

        .bucket-column.conditional {
          border-color: rgba(245, 158, 11, 0.3);
        }

        .bucket-header {
          padding: 14px;
          border-bottom: 2px solid;
          background: rgba(255, 255, 255, 0.02);
          border-radius: 12px 12px 0 0;
        }

        .bucket-title-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .bucket-name {
          margin: 0;
          font-size: 14px;
          font-weight: 600;
          color: #fff;
        }

        .bucket-count {
          font-size: 13px;
          font-weight: 700;
          color: #fff;
          padding: 2px 10px;
          border-radius: 12px;
        }

        .bucket-candidates {
          flex: 1;
          padding: 12px;
          overflow-y: auto;
          max-height: 400px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .bucket-candidates::-webkit-scrollbar {
          width: 6px;
        }

        .bucket-candidates::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.2);
          border-radius: 3px;
        }

        .bucket-candidates::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.15);
          border-radius: 3px;
        }

        .empty-state {
          text-align: center;
          padding: 24px;
          color: rgba(255, 255, 255, 0.4);
          font-size: 13px;
          font-style: italic;
        }

        .bucket-actions {
          padding: 12px;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
        }

        .action-btn {
          width: 100%;
          padding: 10px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 6px;
          color: rgba(255, 255, 255, 0.6);
          font-size: 12px;
          font-weight: 500;
          cursor: not-allowed;
          opacity: 0.6;
        }
      `}</style>
    </div>
  );
}

// Candidate Card Component
function CandidateCard({
  candidate,
  bucketId,
  showDispatchButton,
  showDispatchDate,
  onDispatch,
  onViewDispatchOrder,
}: {
  candidate: Candidate;
  bucketId: string;
  showDispatchButton?: boolean;
  showDispatchDate?: boolean;
  onDispatch: () => void;
  onViewDispatchOrder: () => void;
}) {
  // State for editable dispatch date (UI-only)
  const [editableDate, setEditableDate] = useState(candidate.dispatchStartDate || '');

  return (
    <div className="candidate-card" onClick={onViewDispatchOrder}>
      <div className="card-header">
        <div className="candidate-info">
          <span className="candidate-name">{candidate.name}</span>
          <div className="candidate-meta">
            <span className="trade-badge">{candidate.tradeName}</span>
            <span className={`source-badge source-${candidate.sourceType}`}>
              {candidate.sourceType === 'system' ? '🤖' : '👤'}
            </span>
          </div>
        </div>
        {candidate.matchConfidence && (
          <span className="confidence">{candidate.matchConfidence}%</span>
        )}
      </div>

      <div className="card-details">
        <span className="detail">📍 {candidate.distance} mi</span>
        <span className={`availability avail-${candidate.availability}`}>
          {candidate.availability === 'available' ? '✓' : '◐'}
        </span>
      </div>

      {candidate.certifications.length > 0 && (
        <div className="certs">
          {candidate.certifications.slice(0, 2).map(cert => (
            <span key={cert.id} className="cert">
              {cert.verified ? '✓' : '○'} {cert.name}
            </span>
          ))}
          {candidate.certifications.length > 2 && (
            <span className="cert more">+{candidate.certifications.length - 2} more</span>
          )}
        </div>
      )}

      {candidate.notes && (
        <div className="notes">{candidate.notes}</div>
      )}

      {showDispatchDate && (
        <div className="dispatch-date-edit">
          <label className="date-label">Official Start Date:</label>
          <input
            type="date"
            className="date-input"
            value={editableDate}
            onChange={(e) => setEditableDate(e.target.value)}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {showDispatchButton && (
        <button className="dispatch-btn" onClick={(e) => { e.stopPropagation(); onDispatch(); }}>
          🚀 Dispatch
        </button>
      )}

      <style jsx>{`
        .candidate-card {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 8px;
          padding: 10px;
          transition: all 0.2s ease;
          cursor: pointer;
        }

        .candidate-card:hover {
          background: rgba(255, 255, 255, 0.06);
          border-color: rgba(255, 255, 255, 0.12);
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 6px;
        }

        .candidate-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .candidate-name {
          font-size: 13px;
          font-weight: 600;
          color: #fff;
        }

        .candidate-meta {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .trade-badge {
          font-size: 10px;
          padding: 2px 6px;
          background: rgba(99, 102, 241, 0.2);
          color: #a5b4fc;
          border-radius: 4px;
        }

        .source-badge {
          font-size: 10px;
        }

        .confidence {
          font-size: 12px;
          font-weight: 700;
          color: #60a5fa;
          background: rgba(59, 130, 246, 0.15);
          padding: 2px 8px;
          border-radius: 4px;
        }

        .card-details {
          display: flex;
          gap: 10px;
          margin-bottom: 6px;
        }

        .detail {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.6);
        }

        .availability {
          font-size: 11px;
          font-weight: 500;
        }

        .avail-available {
          color: #34d399;
        }

        .avail-partial {
          color: #fbbf24;
        }

        .avail-unavailable {
          color: #f87171;
        }

        .certs {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
          margin-bottom: 6px;
        }

        .cert {
          font-size: 9px;
          padding: 2px 6px;
          background: rgba(255, 255, 255, 0.06);
          border-radius: 3px;
          color: rgba(255, 255, 255, 0.7);
        }

        .cert.more {
          background: transparent;
          color: rgba(255, 255, 255, 0.5);
        }

        .notes {
          font-size: 10px;
          color: rgba(255, 255, 255, 0.5);
          font-style: italic;
          padding: 4px 6px;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 4px;
          margin-bottom: 6px;
        }

        .dispatch-date-edit {
          display: flex;
          flex-direction: column;
          gap: 4px;
          padding: 8px;
          background: rgba(16, 185, 129, 0.1);
          border-radius: 6px;
          margin-top: 6px;
        }

        .date-label {
          font-size: 10px;
          color: rgba(255, 255, 255, 0.6);
        }

        .date-input {
          padding: 6px 8px;
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(16, 185, 129, 0.3);
          border-radius: 4px;
          color: #34d399;
          font-size: 12px;
          font-weight: 600;
        }

        .date-input:focus {
          outline: none;
          border-color: #34d399;
        }

        .dispatch-btn {
          width: 100%;
          padding: 8px;
          margin-top: 6px;
          background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
          border: none;
          border-radius: 6px;
          color: #fff;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .dispatch-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(34, 197, 94, 0.3);
        }
      `}</style>
    </div>
  );
}

// Dispatch Order Preview Panel
function DispatchOrderPreview({
  candidate,
  requiredPPE,
  requiredTools,
  requiredCerts,
  onClose,
}: {
  candidate: Candidate;
  requiredPPE: string[];
  requiredTools: string[];
  requiredCerts: string[];
  onClose: () => void;
}) {
  // Mock: determine which PPE is missing (UI-only)
  const workerPPE = ['Hard hat', 'Safety glasses', 'Steel-toe boots']; // mock worker has these
  const missingPPE = requiredPPE.filter(item => !workerPPE.includes(item));
  
  // Mock: determine which tools are missing (only show missing)
  const workerTools = ['Torque Wrenches', 'Multimeter', 'Pipe Wrenches']; // mock worker has these
  const missingTools = requiredTools.filter(tool => !workerTools.includes(tool));
  
  // Mock: determine which certs are missing
  const workerCertNames = candidate.certifications.map(c => c.name);
  const missingCerts = requiredCerts.filter(cert => !workerCertNames.includes(cert));

  return (
    <div className="preview-overlay" onClick={onClose}>
      <div className="preview-panel" onClick={e => e.stopPropagation()}>
        <div className="panel-header">
          <h2>📋 Dispatch Order Preview</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="panel-body">
          {/* Worker Info */}
          <div className="worker-info">
            <span className="worker-name">{candidate.name}</span>
            <span className="worker-trade">{candidate.tradeName}</span>
          </div>

          {/* PPE Section - ALWAYS show FULL list */}
          <div className="requirement-section">
            <h3 className="section-label">
              🦺 PPE Requirements
              <span className="section-hint">(Full list always shown for safety)</span>
            </h3>
            <ul className="requirement-list ppe-list">
              {requiredPPE.map(item => {
                const isMissing = missingPPE.includes(item);
                return (
                  <li key={item} className={isMissing ? 'missing' : 'satisfied'}>
                    <span className="item-icon">{isMissing ? '⚠️' : '✓'}</span>
                    <span className="item-name">{item}</span>
                    {isMissing && <span className="missing-label">MISSING</span>}
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Tools Section - Show ONLY missing */}
          <div className="requirement-section">
            <h3 className="section-label">
              🔧 Tools
              <span className="section-hint">(Missing only)</span>
            </h3>
            {missingTools.length === 0 ? (
              <div className="all-satisfied">
                <span className="satisfied-icon">✓</span>
                All required tools are satisfied.
              </div>
            ) : (
              <ul className="requirement-list tools-list">
                {missingTools.map(tool => (
                  <li key={tool} className="missing">
                    <span className="item-icon">⚠️</span>
                    <span className="item-name">{tool}</span>
                    <span className="missing-label">MISSING</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Certs Section - Show ONLY missing */}
          <div className="requirement-section">
            <h3 className="section-label">
              📜 Certifications
              <span className="section-hint">(Missing only)</span>
            </h3>
            {missingCerts.length === 0 ? (
              <div className="all-satisfied">
                <span className="satisfied-icon">✓</span>
                All required certifications verified.
              </div>
            ) : (
              <ul className="requirement-list certs-list">
                {missingCerts.map(cert => (
                  <li key={cert} className="missing">
                    <span className="item-icon">⚠️</span>
                    <span className="item-name">{cert}</span>
                    <span className="missing-label">MISSING</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="panel-footer">
          <button className="close-action" onClick={onClose}>Close</button>
        </div>

        <style jsx>{`
          .preview-overlay {
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.7);
            backdrop-filter: blur(4px);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
          }

          .preview-panel {
            width: 100%;
            max-width: 520px;
            max-height: 80vh;
            background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
            border-radius: 16px;
            border: 1px solid rgba(255, 255, 255, 0.1);
            overflow: hidden;
            display: flex;
            flex-direction: column;
          }

          .panel-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 16px 20px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.08);
            background: rgba(0, 0, 0, 0.2);
          }

          .panel-header h2 {
            margin: 0;
            font-size: 18px;
            font-weight: 600;
            color: #fff;
          }

          .close-btn {
            width: 32px;
            height: 32px;
            background: rgba(255, 255, 255, 0.1);
            border: none;
            border-radius: 8px;
            color: rgba(255, 255, 255, 0.7);
            font-size: 20px;
            cursor: pointer;
            transition: all 0.2s ease;
          }

          .close-btn:hover {
            background: rgba(255, 255, 255, 0.15);
            color: #fff;
          }

          .panel-body {
            padding: 20px;
            overflow-y: auto;
            flex: 1;
          }

          .worker-info {
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 16px;
            background: rgba(59, 130, 246, 0.1);
            border: 1px solid rgba(59, 130, 246, 0.2);
            border-radius: 10px;
            margin-bottom: 20px;
          }

          .worker-name {
            font-size: 18px;
            font-weight: 700;
            color: #fff;
          }

          .worker-trade {
            font-size: 13px;
            color: rgba(255, 255, 255, 0.6);
          }

          .requirement-section {
            margin-bottom: 20px;
          }

          .section-label {
            display: flex;
            align-items: center;
            gap: 8px;
            margin: 0 0 12px 0;
            font-size: 14px;
            font-weight: 600;
            color: rgba(255, 255, 255, 0.9);
          }

          .section-hint {
            font-size: 11px;
            font-weight: 400;
            color: rgba(255, 255, 255, 0.4);
          }

          .requirement-list {
            list-style: none;
            margin: 0;
            padding: 0;
            display: flex;
            flex-direction: column;
            gap: 8px;
          }

          .requirement-list li {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 10px 12px;
            border-radius: 6px;
            font-size: 13px;
          }

          .requirement-list li.satisfied {
            background: rgba(34, 197, 94, 0.1);
            border: 1px solid rgba(34, 197, 94, 0.2);
            color: #34d399;
          }

          .requirement-list li.missing {
            background: rgba(239, 68, 68, 0.1);
            border: 1px solid rgba(239, 68, 68, 0.25);
            color: #f87171;
          }

          .item-icon {
            font-size: 14px;
          }

          .item-name {
            flex: 1;
            color: rgba(255, 255, 255, 0.9);
          }

          .missing-label {
            font-size: 10px;
            font-weight: 700;
            padding: 2px 6px;
            background: rgba(239, 68, 68, 0.3);
            color: #fca5a5;
            border-radius: 3px;
          }

          .all-satisfied {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 14px 16px;
            background: rgba(34, 197, 94, 0.1);
            border: 1px solid rgba(34, 197, 94, 0.2);
            border-radius: 8px;
            font-size: 13px;
            color: #34d399;
          }

          .satisfied-icon {
            font-size: 16px;
          }

          .panel-footer {
            padding: 16px 20px;
            border-top: 1px solid rgba(255, 255, 255, 0.08);
            display: flex;
            justify-content: flex-end;
          }

          .close-action {
            padding: 10px 24px;
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 8px;
            color: rgba(255, 255, 255, 0.8);
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s ease;
          }

          .close-action:hover {
            background: rgba(255, 255, 255, 0.15);
            color: #fff;
          }
        `}</style>
      </div>
    </div>
  );
}

// Dispatch Modal Component
function DispatchModal({
  candidate,
  dispatchDate,
  onDateChange,
  onClose,
  onConfirm,
}: {
  candidate: Candidate;
  dispatchDate: string;
  onDateChange: (date: string) => void;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const canConfirm = dispatchDate.length > 0;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>🚀 Dispatch Worker</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <div className="worker-preview">
            <span className="worker-name">{candidate.name}</span>
            <span className="worker-trade">{candidate.tradeName}</span>
          </div>

          <div className="form-group">
            <label className="form-label">
              Official Start Date <span className="required">*</span>
            </label>
            <input
              type="date"
              className="date-input"
              value={dispatchDate}
              onChange={e => onDateChange(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
            />
            <span className="form-hint">Per-worker dispatch date is mandatory</span>
          </div>

          <div className="dispatch-preview">
            <h4>Dispatch Summary</h4>
            <div className="preview-row">
              <span className="preview-label">Worker:</span>
              <span className="preview-value">{candidate.name}</span>
            </div>
            <div className="preview-row">
              <span className="preview-label">Trade:</span>
              <span className="preview-value">{candidate.tradeName}</span>
            </div>
            <div className="preview-row">
              <span className="preview-label">Start Date:</span>
              <span className="preview-value">{dispatchDate || '—'}</span>
            </div>
          </div>

          <div className="cert-gate">
            <div className="gate-status enabled">
              <span className="gate-icon">✓</span>
              Cert Gate: Passed
            </div>
            <span className="gate-hint">All required certifications verified</span>
          </div>
        </div>

        <div className="modal-footer">
          <button className="cancel-btn" onClick={onClose}>Cancel</button>
          <button
            className="confirm-btn"
            onClick={onConfirm}
            disabled={!canConfirm}
          >
            Confirm Dispatch
          </button>
        </div>

        <style jsx>{`
          .modal-overlay {
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.7);
            backdrop-filter: blur(4px);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
          }

          .modal-content {
            width: 100%;
            max-width: 480px;
            background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
            border-radius: 16px;
            border: 1px solid rgba(255, 255, 255, 0.1);
            overflow: hidden;
          }

          .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 16px 20px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          }

          .modal-header h2 {
            margin: 0;
            font-size: 18px;
            font-weight: 600;
            color: #fff;
          }

          .close-btn {
            width: 32px;
            height: 32px;
            background: rgba(255, 255, 255, 0.1);
            border: none;
            border-radius: 8px;
            color: rgba(255, 255, 255, 0.7);
            font-size: 20px;
            cursor: pointer;
            transition: all 0.2s ease;
          }

          .close-btn:hover {
            background: rgba(255, 255, 255, 0.15);
            color: #fff;
          }

          .modal-body {
            padding: 20px;
          }

          .worker-preview {
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 16px;
            background: rgba(34, 197, 94, 0.1);
            border: 1px solid rgba(34, 197, 94, 0.2);
            border-radius: 10px;
            margin-bottom: 20px;
          }

          .worker-name {
            font-size: 18px;
            font-weight: 700;
            color: #fff;
          }

          .worker-trade {
            font-size: 13px;
            color: rgba(255, 255, 255, 0.6);
          }

          .form-group {
            margin-bottom: 20px;
          }

          .form-label {
            display: block;
            font-size: 13px;
            font-weight: 600;
            color: rgba(255, 255, 255, 0.9);
            margin-bottom: 8px;
          }

          .required {
            color: #f87171;
          }

          .date-input {
            width: 100%;
            padding: 12px 14px;
            background: rgba(0, 0, 0, 0.3);
            border: 1px solid rgba(255, 255, 255, 0.15);
            border-radius: 8px;
            color: #fff;
            font-size: 14px;
          }

          .date-input:focus {
            outline: none;
            border-color: #22c55e;
          }

          .form-hint {
            display: block;
            margin-top: 6px;
            font-size: 11px;
            color: rgba(255, 255, 255, 0.5);
          }

          .dispatch-preview {
            background: rgba(0, 0, 0, 0.2);
            border-radius: 8px;
            padding: 14px;
            margin-bottom: 16px;
          }

          .dispatch-preview h4 {
            margin: 0 0 12px 0;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: rgba(255, 255, 255, 0.6);
          }

          .preview-row {
            display: flex;
            justify-content: space-between;
            padding: 6px 0;
            border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          }

          .preview-row:last-child {
            border-bottom: none;
          }

          .preview-label {
            font-size: 13px;
            color: rgba(255, 255, 255, 0.6);
          }

          .preview-value {
            font-size: 13px;
            font-weight: 500;
            color: #fff;
          }

          .cert-gate {
            display: flex;
            flex-direction: column;
            gap: 4px;
          }

          .gate-status {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 13px;
            font-weight: 500;
          }

          .gate-status.enabled {
            color: #34d399;
          }

          .gate-status.disabled {
            color: #f87171;
          }

          .gate-icon {
            font-size: 14px;
          }

          .gate-hint {
            font-size: 11px;
            color: rgba(255, 255, 255, 0.5);
            margin-left: 22px;
          }

          .modal-footer {
            display: flex;
            justify-content: flex-end;
            gap: 12px;
            padding: 16px 20px;
            border-top: 1px solid rgba(255, 255, 255, 0.08);
          }

          .cancel-btn {
            padding: 10px 20px;
            background: transparent;
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 8px;
            color: rgba(255, 255, 255, 0.7);
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s ease;
          }

          .cancel-btn:hover {
            border-color: rgba(255, 255, 255, 0.3);
            color: #fff;
          }

          .confirm-btn {
            padding: 10px 24px;
            background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
            border: none;
            border-radius: 8px;
            color: #fff;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
          }

          .confirm-btn:hover:not(:disabled) {
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(34, 197, 94, 0.3);
          }

          .confirm-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }
        `}</style>
      </div>
    </div>
  );
}
