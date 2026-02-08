"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { CommercialMarginPanel } from "@/components/CommercialMarginPanel";

// Tab types for inline tabs
type TabKey = "overview" | "changeOrders";

const TABS: { key: TabKey; label: string }[] = [
  { key: "overview", label: "Overview" },
  { key: "changeOrders", label: "Change Orders" },
];

// Change Order types and mock data
type ChangeOrderStatus = "Draft" | "Pending" | "Approved" | "Rejected";
type ApprovalMethod = "Portal" | "Email Authorization";
type DeltaType = "hourly" | "shift";

type ChangeOrder = {
  id: string;
  status: ChangeOrderStatus;
  employee: string;
  changeType: string;
  delta: string;
  effectiveDate: string;
  requestedBy: string;
  approvalMethod: ApprovalMethod;
  proof: string;
  dispatchAmendment: string;
  requestedOn: string;
  // Detail fields
  fullSummary: string;
};

// Mock employees for dropdown
const MOCK_EMPLOYEES = ["John Smith", "Mike Johnson", "Sarah Lee"];

const MOCK_CHANGE_ORDERS: ChangeOrder[] = [
  {
    id: "CO-001",
    status: "Approved",
    employee: "Marcus Johnson",
    changeType: "Rate Change",
    delta: "+$3.00 / hr",
    effectiveDate: "2024-03-01",
    requestedBy: "Casey Rivers (PM)",
    approvalMethod: "Portal",
    proof: "Portal Approval",
    dispatchAmendment: "v2",
    requestedOn: "2024-02-25",
    fullSummary: "Rate increase for Marcus Johnson from $28.00/hr to $31.00/hr due to expanded scope including lead responsibilities on night shift crew.",
  },
  {
    id: "CO-002",
    status: "Approved",
    employee: "Sarah Chen",
    changeType: "Rate Change",
    delta: "+$150 / shift",
    effectiveDate: "2024-02-20",
    requestedBy: "Jordan Miles (Sales)",
    approvalMethod: "Email Authorization",
    proof: "Email Uploaded",
    dispatchAmendment: "v2",
    requestedOn: "2024-02-18",
    fullSummary: "Shift differential added for Sarah Chen for weekend coverage. Customer authorized via email on 2024-02-18.",
  },
  {
    id: "CO-003",
    status: "Pending",
    employee: "David Martinez",
    changeType: "Rate Change",
    delta: "+$2.50 / hr",
    effectiveDate: "2024-03-15",
    requestedBy: "Casey Rivers (PM)",
    approvalMethod: "Portal",
    proof: "Awaiting Approval",
    dispatchAmendment: "—",
    requestedOn: "2024-03-01",
    fullSummary: "Rate adjustment request for David Martinez to match market rate for certified welders. Pending customer approval.",
  },
  {
    id: "CO-004",
    status: "Draft",
    employee: "Emily Rodriguez",
    changeType: "Rate Change",
    delta: "+$4.00 / hr",
    effectiveDate: "2024-03-20",
    requestedBy: "Internal",
    approvalMethod: "Portal",
    proof: "—",
    dispatchAmendment: "—",
    requestedOn: "2024-03-05",
    fullSummary: "Draft rate change for Emily Rodriguez for hazard pay classification. Not yet submitted to customer.",
  },
  {
    id: "CO-005",
    status: "Rejected",
    employee: "James Wilson",
    changeType: "Rate Change",
    delta: "+$5.00 / hr",
    effectiveDate: "2024-02-15",
    requestedBy: "Jordan Miles (Sales)",
    approvalMethod: "Email Authorization",
    proof: "—",
    dispatchAmendment: "—",
    requestedOn: "2024-02-10",
    fullSummary: "Rate increase request for James Wilson was rejected by customer. Original rate to remain in effect.",
  },
];

// Mock order detail data
const MOCK_ORDER_DETAILS: Record<string, {
  id: string;
  customer: string;
  site: string;
  address: string;
  startDate: string;
  endDate: string;
  status: string;
  salesperson: { name: string };
  pmContact: { name: string; email: string; office: string; cell: string };
  trades: Array<{ trade: string; open: number; total: number }>;
  tools: string[];
  ppe: string[];
  dispatchChecklist: Array<{ item: string; done: boolean }>;
  auditLog: Array<{ action: string; user: string; time: string }>;
}> = {
  "ORD-2024-001": {
    id: "ORD-2024-001",
    customer: "Turner Construction",
    site: "Downtown Tower",
    address: "450 S Grand Ave, Los Angeles, CA 90071",
    startDate: "2024-02-15",
    endDate: "2024-08-30",
    status: "Active",
    salesperson: {
      name: "Jordan Miles",
    },
    pmContact: {
      name: "Casey Rivers",
      email: "pm@example.com",
      office: "(000) 000-0000",
      cell: "(000) 000-0000",
    },
    trades: [
      { trade: "Millwright", open: 3, total: 10 },
      { trade: "Pipefitter/Welder", open: 12, total: 30 },
      { trade: "Electrician", open: 2, total: 8 },
      { trade: "Iron Worker", open: 0, total: 5 },
    ],
    tools: ["Torque Wrenches", "Dial Indicators", "Laser Alignment Kit", "Rigging Equipment"],
    ppe: ["Hard Hat", "Safety Glasses", "Steel-Toe Boots", "Hi-Vis Vest", "Gloves"],
    dispatchChecklist: [
      { item: "Safety orientation completed", done: true },
      { item: "Background check cleared", done: true },
      { item: "Drug screening passed", done: true },
      { item: "Site credentials issued", done: false },
      { item: "Tool allocation confirmed", done: false },
    ],
    auditLog: [
      { action: "Trade request updated", user: "M. Rodriguez", time: "2 hours ago" },
      { action: "Contact info modified", user: "S. Mitchell", time: "1 day ago" },
      { action: "Order created", user: "System", time: "Jan 28, 2024" },
    ],
  },
};

// Default fallback for any order ID
const DEFAULT_ORDER = {
  id: "ORD-XXXX-XXX",
  customer: "Sample Customer",
  site: "Sample Site",
  address: "123 Main St, City, ST 00000",
  startDate: "2024-03-01",
  endDate: "2024-09-30",
  status: "Active",
  salesperson: {
    name: "Jordan Miles",
  },
  pmContact: {
    name: "Casey Rivers",
    email: "pm@example.com",
    office: "(000) 000-0000",
    cell: "(000) 000-0000",
  },
  trades: [
    { trade: "Millwright", open: 5, total: 10 },
    { trade: "Pipefitter/Welder", open: 10, total: 20 },
  ],
  tools: ["Standard Tool Kit", "Safety Equipment"],
  ppe: ["Hard Hat", "Safety Glasses", "Steel-Toe Boots"],
  dispatchChecklist: [
    { item: "Safety orientation completed", done: false },
    { item: "Background check cleared", done: false },
    { item: "Drug screening passed", done: false },
  ],
  auditLog: [
    { action: "Order created", user: "System", time: "Recently" },
  ],
};

export default function OrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params.id as string;

  // Tab state
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  
  // Change Order detail panel state
  const [selectedChangeOrder, setSelectedChangeOrder] = useState<ChangeOrder | null>(null);

  // Change Orders list state (initialized with mock data)
  const [changeOrders, setChangeOrders] = useState<ChangeOrder[]>(MOCK_CHANGE_ORDERS);

  // Create RCO panel state
  const [showCreatePanel, setShowCreatePanel] = useState(false);
  const [createForm, setCreateForm] = useState({
    employee: "",
    deltaType: "hourly" as DeltaType,
    deltaAmount: "",
    effectiveDate: "",
    notes: "",
    approvalMethod: "Portal" as ApprovalMethod,
    emailProof: "",
  });

  // Reset form helper
  const resetCreateForm = () => {
    setCreateForm({
      employee: "",
      deltaType: "hourly",
      deltaAmount: "",
      effectiveDate: "",
      notes: "",
      approvalMethod: "Portal",
      emailProof: "",
    });
  };

  // Generate mock ID
  const generateMockId = () => {
    const num = changeOrders.length + 1;
    return `CO-${String(num).padStart(3, "0")}`;
  };

  // Format delta string
  const formatDelta = (amount: string, type: DeltaType) => {
    const prefix = "+$";
    const suffix = type === "hourly" ? " / hr" : " / shift";
    return `${prefix}${amount}${suffix}`;
  };

  // Handle Save Draft
  const handleSaveDraft = () => {
    if (!createForm.employee || !createForm.deltaAmount || !createForm.effectiveDate) {
      return; // Basic required field check
    }
    const newOrder: ChangeOrder = {
      id: generateMockId(),
      status: "Draft",
      employee: createForm.employee,
      changeType: "Rate Change",
      delta: formatDelta(createForm.deltaAmount, createForm.deltaType),
      effectiveDate: createForm.effectiveDate,
      requestedBy: "Internal",
      approvalMethod: createForm.approvalMethod,
      proof: createForm.approvalMethod === "Email Authorization" ? createForm.emailProof || "—" : "—",
      dispatchAmendment: "—",
      requestedOn: new Date().toISOString().split("T")[0],
      fullSummary: createForm.notes || `Draft rate change for ${createForm.employee}.`,
    };
    setChangeOrders([newOrder, ...changeOrders]);
    resetCreateForm();
    setShowCreatePanel(false);
  };

  // Handle Mark Pending
  const handleMarkPending = () => {
    if (!createForm.employee || !createForm.deltaAmount || !createForm.effectiveDate) {
      return; // Basic required field check
    }
    const newOrder: ChangeOrder = {
      id: generateMockId(),
      status: "Pending",
      employee: createForm.employee,
      changeType: "Rate Change",
      delta: formatDelta(createForm.deltaAmount, createForm.deltaType),
      effectiveDate: createForm.effectiveDate,
      requestedBy: "Internal",
      approvalMethod: createForm.approvalMethod,
      proof: createForm.approvalMethod === "Email Authorization" ? createForm.emailProof || "Awaiting Proof" : "Awaiting Approval",
      dispatchAmendment: "—",
      requestedOn: new Date().toISOString().split("T")[0],
      fullSummary: createForm.notes || `Rate change request for ${createForm.employee}. Pending customer approval.`,
    };
    setChangeOrders([newOrder, ...changeOrders]);
    resetCreateForm();
    setShowCreatePanel(false);
  };

  // Handle Cancel
  const handleCancelCreate = () => {
    resetCreateForm();
    setShowCreatePanel(false);
  };

  // Get order data or use default
  const order = MOCK_ORDER_DETAILS[orderId] || { ...DEFAULT_ORDER, id: orderId };

  const handleLogout = () => {
    router.push("/login");
  };

  const handleBackToOrders = () => {
    router.push("/orders");
  };

  const totalOpen = order.trades.reduce((sum, t) => sum + t.open, 0);
  const totalRequired = order.trades.reduce((sum, t) => sum + t.total, 0);

  // Status badge styling for change orders
  const getChangeOrderStatusStyle = (status: ChangeOrderStatus) => {
    switch (status) {
      case "Approved":
        return { bg: "rgba(34, 197, 94, 0.12)", color: "#4ade80", border: "rgba(34, 197, 94, 0.3)" };
      case "Pending":
        return { bg: "rgba(245, 158, 11, 0.12)", color: "#fbbf24", border: "rgba(245, 158, 11, 0.3)" };
      case "Rejected":
        return { bg: "rgba(239, 68, 68, 0.12)", color: "#f87171", border: "rgba(239, 68, 68, 0.3)" };
      default: // Draft
        return { bg: "rgba(148, 163, 184, 0.12)", color: "#94a3b8", border: "rgba(148, 163, 184, 0.3)" };
    }
  };

  return (
    <div className="order-detail-page">
      <div className="order-detail-container">
      {/* Page Header */}
      <div className="detail-header">
        <div className="header-left">
          <button className="back-btn" onClick={handleBackToOrders}>
            ← Back to Orders
          </button>
          <div className="header-title">
            <h1>{order.id}</h1>
            <span className={`status-badge ${order.status.toLowerCase()}`}>{order.status}</span>
            <span className="health-badge">Order Health: Coming soon</span>
          </div>
        </div>
        <div className="header-right">
          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="tab-bar">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            className={`tab-btn ${activeTab === tab.key ? "tab-btn-active" : ""}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
      <div className="detail-grid">
        {/* Header Summary Section */}
        <section className="detail-section summary-section">
          <h2>Order Summary</h2>
          <div className="summary-grid">
            <div className="summary-item">
              <span className="label">Customer</span>
              <span className="value">{order.customer}</span>
            </div>
            <div className="summary-item">
              <span className="label">Site</span>
              <span className="value">{order.site}</span>
            </div>
            <div className="summary-item">
              <span className="label">Start Date</span>
              <span className="value">{new Date(order.startDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</span>
            </div>
            <div className="summary-item">
              <span className="label">End Date</span>
              <span className="value">{new Date(order.endDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</span>
            </div>
          </div>
        </section>

        {/* Ownership & Contact */}
        <section className="detail-section">
          <h2>Ownership &amp; Contact</h2>
          <div className="ownership-grid">
            <div className="ownership-card salesperson-card">
              <div className="ownership-header">
                <span className="ownership-type">Salesperson</span>
                <span className="read-only-badge">Read-only</span>
              </div>
              <span className="ownership-name">{order.salesperson.name}</span>
            </div>
            <div className="ownership-card pm-card">
              <div className="ownership-header">
                <span className="ownership-type">Project Manager (PM)</span>
              </div>
              <span className="ownership-name">{order.pmContact.name}</span>
              <div className="pm-contact-details">
                <div className="contact-row">
                  <span className="contact-label">Email:</span>
                  <span className="contact-value">{order.pmContact.email}</span>
                </div>
                <div className="contact-row">
                  <span className="contact-label">Office:</span>
                  <span className="contact-value">{order.pmContact.office}</span>
                </div>
                <div className="contact-row">
                  <span className="contact-label">Cell:</span>
                  <span className="contact-value">{order.pmContact.cell}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* COMMERCIAL HEALTH — ESTIMATE (Slice A) */}
        {/* ============================================================ */}
        <CommercialMarginPanel
          mode="estimate"
          data={{
            estimatedGrossMargin: '29.5%',
            marginIndicator: '🟢',
            targetText: 'Target ≥ 28%',
            blendedMarginPerHour: '$8.40 / hr',
            blendedHelperText: 'Across all trades on this quote',
            trades: [],
          }}
        />

        {/* Trade Requirements */}
        <section className="detail-section">
          <h2>Trade Requirements</h2>
          <div className="trades-overview">
            <div className="trades-stat">
              <span className="stat-value">{totalOpen}</span>
              <span className="stat-label">Open Positions</span>
            </div>
            <div className="trades-stat">
              <span className="stat-value">{totalRequired}</span>
              <span className="stat-label">Total Required</span>
            </div>
          </div>
          <div className="trades-list">
            {order.trades.map((trade) => {
              const filled = trade.total - trade.open;
              const pct = trade.total > 0 ? (filled / trade.total) * 100 : 0;
              return (
                <div className="trade-row" key={trade.trade}>
                  <span className="trade-name">{trade.trade}</span>
                  <div className="trade-bar-wrap">
                    <div className="trade-bar" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="trade-nums">{filled} / {trade.total}</span>
                </div>
              );
            })}
          </div>
        </section>

        {/* Tools & PPE */}
        <section className="detail-section half-section">
          <h2>Tools Required</h2>
          <ul className="item-list">
            {order.tools.map((tool) => (
              <li key={tool}>{tool}</li>
            ))}
          </ul>
        </section>

        <section className="detail-section half-section">
          <h2>PPE Requirements</h2>
          <ul className="item-list">
            {order.ppe.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        {/* Dispatch Readiness Checklist */}
        <section className="detail-section">
          <h2>Dispatch Readiness Checklist</h2>
          <ul className="checklist">
            {order.dispatchChecklist.map((check, idx) => (
              <li key={idx} className={check.done ? "done" : ""}>
                <span className="check-icon">{check.done ? "✓" : "○"}</span>
                <span className="check-text">{check.item}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Audit / Activity Log */}
        <section className="detail-section">
          <h2>Activity Log</h2>
          <ul className="audit-log">
            {order.auditLog.map((entry, idx) => (
              <li key={idx}>
                <span className="audit-action">{entry.action}</span>
                <span className="audit-meta">{entry.user} • {entry.time}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
      )}

      {/* Change Orders Tab */}
      {activeTab === "changeOrders" && (
        <div className="change-orders-content">
          <section className="detail-section change-orders-section">
            <div className="co-section-header">
              <h2>Change Orders</h2>
              <button
                type="button"
                className="create-rco-btn"
                onClick={() => setShowCreatePanel(true)}
              >
                + Create Rate Change Order
              </button>
            </div>
            <div className="change-orders-table">
              <div className="co-table-header">
                <span className="co-col-status">Status</span>
                <span className="co-col-employee">Employee</span>
                <span className="co-col-type">Change Type</span>
                <span className="co-col-delta">Delta</span>
                <span className="co-col-effective">Effective Date</span>
                <span className="co-col-requested-by">Requested By</span>
                <span className="co-col-method">Approval Method</span>
                <span className="co-col-proof">Proof</span>
                <span className="co-col-amendment">Amendment</span>
                <span className="co-col-requested-on">Requested On</span>
              </div>
              {changeOrders.map((co) => {
                const statusStyle = getChangeOrderStatusStyle(co.status);
                const isApproved = co.status === "Approved";
                return (
                  <button
                    key={co.id}
                    type="button"
                    className={`co-table-row ${isApproved ? "co-row-approved" : ""}`}
                    onClick={() => setSelectedChangeOrder(co)}
                  >
                    <span className="co-col-status">
                      <span
                        className="co-status-badge"
                        style={{
                          background: statusStyle.bg,
                          color: statusStyle.color,
                          borderColor: statusStyle.border,
                        }}
                      >
                        {co.status}
                      </span>
                    </span>
                    <span className="co-col-employee">{co.employee}</span>
                    <span className="co-col-type">{co.changeType}</span>
                    <span className="co-col-delta">{co.delta}</span>
                    <span className="co-col-effective">{co.effectiveDate}</span>
                    <span className="co-col-requested-by">{co.requestedBy}</span>
                    <span className="co-col-method">{co.approvalMethod}</span>
                    <span className="co-col-proof">{co.proof}</span>
                    <span className="co-col-amendment">{co.dispatchAmendment}</span>
                    <span className="co-col-requested-on">{co.requestedOn}</span>
                  </button>
                );
              })}
            </div>
          </section>
        </div>
      )}

      {/* Change Order Detail Panel (Side Panel) */}
      {selectedChangeOrder && (
        <div className="co-detail-overlay" onClick={() => setSelectedChangeOrder(null)}>
          <div className="co-detail-panel" onClick={(e) => e.stopPropagation()}>
            <div className="co-detail-header">
              <h3>Change Order Details</h3>
              <button
                type="button"
                className="co-detail-close"
                onClick={() => setSelectedChangeOrder(null)}
              >
                ×
              </button>
            </div>
            <div className="co-detail-body">
              {/* Status Badge */}
              <div className="co-detail-status-row">
                {(() => {
                  const statusStyle = getChangeOrderStatusStyle(selectedChangeOrder.status);
                  const isApproved = selectedChangeOrder.status === "Approved";
                  return (
                    <>
                      <span
                        className="co-detail-status-badge"
                        style={{
                          background: statusStyle.bg,
                          color: statusStyle.color,
                          borderColor: statusStyle.border,
                        }}
                      >
                        {selectedChangeOrder.status}
                      </span>
                      {isApproved && (
                        <span className="co-immutable-badge">Immutable</span>
                      )}
                    </>
                  );
                })()}
              </div>

              {/* Full Summary */}
              <div className="co-detail-section">
                <h4>Change Summary</h4>
                <p className={`co-detail-summary ${selectedChangeOrder.status === "Approved" ? "co-summary-muted" : ""}`}>
                  {selectedChangeOrder.fullSummary}
                </p>
              </div>

              {/* Details Grid */}
              <div className="co-detail-section">
                <h4>Details</h4>
                <div className="co-detail-grid">
                  <div className="co-detail-item">
                    <span className="co-detail-label">Employee</span>
                    <span className="co-detail-value">{selectedChangeOrder.employee}</span>
                  </div>
                  <div className="co-detail-item">
                    <span className="co-detail-label">Change Type</span>
                    <span className="co-detail-value">{selectedChangeOrder.changeType}</span>
                  </div>
                  <div className="co-detail-item">
                    <span className="co-detail-label">Delta</span>
                    <span className="co-detail-value co-delta-value">{selectedChangeOrder.delta}</span>
                  </div>
                  <div className="co-detail-item">
                    <span className="co-detail-label">Effective Date</span>
                    <span className="co-detail-value">{selectedChangeOrder.effectiveDate}</span>
                  </div>
                  <div className="co-detail-item">
                    <span className="co-detail-label">Requested By</span>
                    <span className="co-detail-value">{selectedChangeOrder.requestedBy}</span>
                  </div>
                  <div className="co-detail-item">
                    <span className="co-detail-label">Requested On</span>
                    <span className="co-detail-value">{selectedChangeOrder.requestedOn}</span>
                  </div>
                </div>
              </div>

              {/* Approval Info */}
              <div className="co-detail-section">
                <h4>Approval Information</h4>
                <div className="co-detail-grid">
                  <div className="co-detail-item">
                    <span className="co-detail-label">Approval Method</span>
                    <span className="co-detail-value">{selectedChangeOrder.approvalMethod}</span>
                  </div>
                  <div className="co-detail-item">
                    <span className="co-detail-label">Proof</span>
                    <span className="co-detail-value">{selectedChangeOrder.proof}</span>
                  </div>
                </div>
              </div>

              {/* Dispatch Amendment */}
              {selectedChangeOrder.dispatchAmendment !== "—" && (
                <div className="co-detail-section">
                  <h4>Dispatch Amendment</h4>
                  <div className="co-amendment-badge">
                    Dispatch Amendment: {selectedChangeOrder.dispatchAmendment}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Rate Change Order Panel */}
      {showCreatePanel && (
        <div className="co-detail-overlay" onClick={handleCancelCreate}>
          <div className="co-detail-panel create-rco-panel" onClick={(e) => e.stopPropagation()}>
            <div className="co-detail-header">
              <h3>Create Rate Change Order</h3>
              <button
                type="button"
                className="co-detail-close"
                onClick={handleCancelCreate}
              >
                ×
              </button>
            </div>
            <div className="co-detail-body">
              {/* Employee Dropdown */}
              <div className="create-form-field">
                <label className="create-form-label">Employee *</label>
                <select
                  className="create-form-select"
                  value={createForm.employee}
                  onChange={(e) => setCreateForm({ ...createForm, employee: e.target.value })}
                >
                  <option value="">Select employee...</option>
                  {MOCK_EMPLOYEES.map((emp) => (
                    <option key={emp} value={emp}>{emp}</option>
                  ))}
                </select>
              </div>

              {/* Change Type (Read-only) */}
              <div className="create-form-field">
                <label className="create-form-label">Change Type</label>
                <div className="create-form-readonly">Rate Change</div>
              </div>

              {/* Delta Type Radio */}
              <div className="create-form-field">
                <label className="create-form-label">Delta Type *</label>
                <div className="create-form-radio-group">
                  <label className="create-form-radio">
                    <input
                      type="radio"
                      name="deltaType"
                      checked={createForm.deltaType === "hourly"}
                      onChange={() => setCreateForm({ ...createForm, deltaType: "hourly" })}
                    />
                    <span>$ / hour</span>
                  </label>
                  <label className="create-form-radio">
                    <input
                      type="radio"
                      name="deltaType"
                      checked={createForm.deltaType === "shift"}
                      onChange={() => setCreateForm({ ...createForm, deltaType: "shift" })}
                    />
                    <span>$ / shift</span>
                  </label>
                </div>
              </div>

              {/* Delta Amount */}
              <div className="create-form-field">
                <label className="create-form-label">Delta Amount *</label>
                <div className="create-form-input-wrapper">
                  <span className="create-form-input-prefix">$</span>
                  <input
                    type="number"
                    className="create-form-input create-form-input-with-prefix"
                    placeholder="0.00"
                    value={createForm.deltaAmount}
                    onChange={(e) => setCreateForm({ ...createForm, deltaAmount: e.target.value })}
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              {/* Effective Date */}
              <div className="create-form-field">
                <label className="create-form-label">Effective Date *</label>
                <input
                  type="date"
                  className="create-form-input"
                  value={createForm.effectiveDate}
                  onChange={(e) => setCreateForm({ ...createForm, effectiveDate: e.target.value })}
                />
              </div>

              {/* Reason / Notes */}
              <div className="create-form-field">
                <label className="create-form-label">Reason / Notes</label>
                <textarea
                  className="create-form-textarea"
                  placeholder="Enter reason for rate change..."
                  value={createForm.notes}
                  onChange={(e) => setCreateForm({ ...createForm, notes: e.target.value })}
                  rows={3}
                />
              </div>

              {/* Approval Method Radio */}
              <div className="create-form-field">
                <label className="create-form-label">Approval Method *</label>
                <div className="create-form-radio-group">
                  <label className="create-form-radio">
                    <input
                      type="radio"
                      name="approvalMethod"
                      checked={createForm.approvalMethod === "Portal"}
                      onChange={() => setCreateForm({ ...createForm, approvalMethod: "Portal" })}
                    />
                    <span>Portal Approval</span>
                  </label>
                  <label className="create-form-radio">
                    <input
                      type="radio"
                      name="approvalMethod"
                      checked={createForm.approvalMethod === "Email Authorization"}
                      onChange={() => setCreateForm({ ...createForm, approvalMethod: "Email Authorization" })}
                    />
                    <span>Email Authorization</span>
                  </label>
                </div>
              </div>

              {/* Email Proof (conditional) */}
              {createForm.approvalMethod === "Email Authorization" && (
                <div className="create-form-field">
                  <label className="create-form-label">Email on file</label>
                  <input
                    type="text"
                    className="create-form-input"
                    placeholder="Proof placeholder..."
                    value={createForm.emailProof}
                    onChange={(e) => setCreateForm({ ...createForm, emailProof: e.target.value })}
                  />
                </div>
              )}

              {/* Action Buttons */}
              <div className="create-form-actions">
                <button
                  type="button"
                  className="create-form-btn create-form-btn-secondary"
                  onClick={handleCancelCreate}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="create-form-btn create-form-btn-draft"
                  onClick={handleSaveDraft}
                >
                  Save Draft
                </button>
                <button
                  type="button"
                  className="create-form-btn create-form-btn-primary"
                  onClick={handleMarkPending}
                >
                  Mark Pending
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      </div>
      <style jsx>{`
        .order-detail-page {
          min-height: 100vh;
          background: linear-gradient(180deg, #0c0f14 0%, #111827 100%);
        }

        .order-detail-container {
          padding: 24px 40px 60px;
          max-width: 1200px;
          margin: 0 auto;
        }

        .detail-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 32px;
        }

        .header-left {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .back-btn {
          background: none;
          border: none;
          color: rgba(255, 255, 255, 0.5);
          font-size: 13px;
          cursor: pointer;
          padding: 0;
          transition: color 0.15s ease;
        }

        .back-btn:hover {
          color: #3b82f6;
        }

        .header-title {
          display: flex;
          align-items: center;
          gap: 14px;
          flex-wrap: wrap;
        }

        .header-title h1 {
          font-size: 28px;
          font-weight: 600;
          color: #fff;
          margin: 0;
          letter-spacing: -0.5px;
        }

        .status-badge {
          padding: 4px 12px;
          font-size: 12px;
          font-weight: 600;
          border-radius: 20px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .status-badge.active {
          background: rgba(34, 197, 94, 0.15);
          color: #22c55e;
        }

        .health-badge {
          padding: 4px 12px;
          font-size: 11px;
          font-weight: 500;
          border-radius: 6px;
          background: rgba(148, 163, 184, 0.15);
          color: rgba(148, 163, 184, 0.8);
          border: 1px dashed rgba(148, 163, 184, 0.3);
        }

        .header-right {
          display: flex;
          gap: 12px;
        }

        .logout-btn {
          padding: 8px 18px;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 6px;
          font-size: 13px;
          font-weight: 500;
          color: rgba(255, 255, 255, 0.7);
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .logout-btn:hover {
          background: rgba(239, 68, 68, 0.15);
          border-color: rgba(239, 68, 68, 0.3);
          color: #f87171;
        }

        .detail-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }

        .detail-section {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 12px;
          padding: 24px;
        }

        .detail-section.summary-section,
        .detail-section:nth-child(2),
        .detail-section:nth-child(3),
        .detail-section:nth-child(6),
        .detail-section:nth-child(7) {
          grid-column: span 2;
        }

        .detail-section.half-section {
          grid-column: span 1;
        }

        .detail-section h2 {
          font-size: 14px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.5);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin: 0 0 18px;
        }

        /* Summary Grid */
        .summary-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 24px;
        }

        .summary-item {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .summary-item .label {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.45);
        }

        .summary-item .value {
          font-size: 15px;
          color: #fff;
          font-weight: 500;
        }

        /* Ownership Grid */
        .ownership-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
        }

        .ownership-card {
          background: rgba(255, 255, 255, 0.03);
          border-radius: 10px;
          padding: 18px;
        }

        .ownership-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 8px;
        }

        .ownership-type {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.4);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .read-only-badge {
          font-size: 9px;
          padding: 2px 6px;
          background: rgba(148, 163, 184, 0.15);
          color: rgba(148, 163, 184, 0.8);
          border-radius: 4px;
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }

        .ownership-name {
          font-size: 17px;
          font-weight: 600;
          color: #fff;
          display: block;
        }

        .salesperson-card {
          border: 1px solid rgba(255, 255, 255, 0.06);
        }

        .pm-card {
          border: 1px solid rgba(59, 130, 246, 0.2);
          background: rgba(59, 130, 246, 0.05);
        }

        .pm-contact-details {
          margin-top: 14px;
          padding-top: 14px;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .contact-row {
          display: flex;
          gap: 8px;
          font-size: 13px;
        }

        .contact-label {
          color: rgba(255, 255, 255, 0.45);
          min-width: 50px;
        }

        .contact-value {
          color: rgba(255, 255, 255, 0.85);
        }

        /* Trades */
        .trades-overview {
          display: flex;
          gap: 40px;
          margin-bottom: 20px;
        }

        .trades-stat {
          display: flex;
          flex-direction: column;
        }

        .stat-value {
          font-size: 32px;
          font-weight: 700;
          color: #fff;
          line-height: 1;
        }

        .stat-label {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.45);
          margin-top: 4px;
        }

        .trades-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .trade-row {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .trade-name {
          width: 160px;
          font-size: 14px;
          color: rgba(255, 255, 255, 0.85);
        }

        .trade-bar-wrap {
          flex: 1;
          height: 8px;
          background: rgba(255, 255, 255, 0.08);
          border-radius: 4px;
          overflow: hidden;
        }

        .trade-bar {
          height: 100%;
          background: linear-gradient(90deg, #3b82f6 0%, #22c55e 100%);
          border-radius: 4px;
          transition: width 0.3s ease;
        }

        .trade-nums {
          width: 60px;
          text-align: right;
          font-size: 13px;
          font-family: var(--font-geist-mono), monospace;
          color: rgba(255, 255, 255, 0.6);
        }

        /* Item Lists */
        .item-list {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .item-list li {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.75);
          padding-left: 18px;
          position: relative;
        }

        .item-list li::before {
          content: "•";
          position: absolute;
          left: 0;
          color: #3b82f6;
        }

        /* Checklist */
        .checklist {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .checklist li {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 14px;
          color: rgba(255, 255, 255, 0.6);
        }

        .checklist li.done {
          color: rgba(255, 255, 255, 0.85);
        }

        .check-icon {
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          font-size: 12px;
          background: rgba(255, 255, 255, 0.06);
          color: rgba(255, 255, 255, 0.3);
        }

        .checklist li.done .check-icon {
          background: rgba(34, 197, 94, 0.2);
          color: #22c55e;
        }

        /* Audit Log */
        .audit-log {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .audit-log li {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          background: rgba(255, 255, 255, 0.02);
          border-radius: 6px;
        }

        .audit-action {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.85);
        }

        .audit-meta {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.4);
        }

        /* Tab Bar */
        .tab-bar {
          display: flex;
          gap: 6px;
          margin-bottom: 24px;
          flex-wrap: wrap;
        }

        .tab-btn {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: rgba(255, 255, 255, 0.65);
          padding: 10px 18px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 600;
          transition: all 0.15s ease;
        }

        .tab-btn:hover {
          background: rgba(255, 255, 255, 0.06);
          border-color: rgba(255, 255, 255, 0.12);
          color: rgba(255, 255, 255, 0.85);
        }

        .tab-btn-active {
          background: rgba(59, 130, 246, 0.15);
          border-color: rgba(59, 130, 246, 0.35);
          color: #93c5fd;
        }

        .tab-btn-active:hover {
          background: rgba(59, 130, 246, 0.18);
          border-color: rgba(59, 130, 246, 0.4);
          color: #93c5fd;
        }

        /* Change Orders Tab Content */
        .change-orders-content {
          width: 100%;
        }

        .change-orders-section {
          grid-column: span 2;
        }

        .change-orders-table {
          display: flex;
          flex-direction: column;
          gap: 2px;
          overflow-x: auto;
        }

        .co-table-header,
        .co-table-row {
          display: grid;
          grid-template-columns: 100px 140px 100px 110px 110px 150px 130px 120px 90px 110px;
          gap: 8px;
          padding: 12px 14px;
          align-items: center;
          min-width: 1160px;
        }

        .co-table-header {
          background: rgba(255, 255, 255, 0.03);
          border-radius: 6px;
          font-size: 11px;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.5);
          text-transform: uppercase;
          letter-spacing: 0.4px;
        }

        .co-table-row {
          background: rgba(255, 255, 255, 0.015);
          border: 1px solid transparent;
          border-radius: 6px;
          font-size: 13px;
          color: rgba(255, 255, 255, 0.85);
          cursor: pointer;
          transition: all 0.15s ease;
          text-align: left;
          width: 100%;
        }

        .co-table-row:hover {
          background: rgba(59, 130, 246, 0.08);
          border-color: rgba(59, 130, 246, 0.2);
        }

        .co-row-approved {
          opacity: 0.75;
        }

        .co-row-approved:hover {
          opacity: 1;
        }

        .co-status-badge {
          display: inline-block;
          padding: 4px 10px;
          border-radius: 999px;
          border: 1px solid;
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }

        .co-col-delta {
          font-weight: 600;
          color: #4ade80;
        }

        .co-col-amendment {
          font-family: monospace;
          color: rgba(255, 255, 255, 0.6);
        }

        /* Change Order Detail Panel (Side Panel) */
        .co-detail-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.6);
          z-index: 1000;
          display: flex;
          justify-content: flex-end;
        }

        .co-detail-panel {
          width: 480px;
          max-width: 90vw;
          height: 100%;
          background: #111827;
          border-left: 1px solid rgba(255, 255, 255, 0.1);
          display: flex;
          flex-direction: column;
          animation: slideIn 0.2s ease;
        }

        @keyframes slideIn {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }

        .co-detail-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 24px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }

        .co-detail-header h3 {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
          color: #fff;
        }

        .co-detail-close {
          background: none;
          border: none;
          color: rgba(255, 255, 255, 0.5);
          font-size: 28px;
          cursor: pointer;
          padding: 0;
          line-height: 1;
          transition: color 0.15s ease;
        }

        .co-detail-close:hover {
          color: #fff;
        }

        .co-detail-body {
          flex: 1;
          overflow-y: auto;
          padding: 24px;
        }

        .co-detail-status-row {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 24px;
        }

        .co-detail-status-badge {
          display: inline-block;
          padding: 6px 14px;
          border-radius: 999px;
          border: 1px solid;
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }

        .co-immutable-badge {
          display: inline-block;
          padding: 4px 10px;
          background: rgba(148, 163, 184, 0.15);
          color: rgba(148, 163, 184, 0.8);
          border: 1px dashed rgba(148, 163, 184, 0.3);
          border-radius: 4px;
          font-size: 10px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }

        .co-detail-section {
          margin-bottom: 24px;
        }

        .co-detail-section h4 {
          margin: 0 0 12px 0;
          font-size: 12px;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.5);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .co-detail-summary {
          margin: 0;
          font-size: 14px;
          line-height: 1.6;
          color: rgba(255, 255, 255, 0.85);
          padding: 14px;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.06);
        }

        .co-summary-muted {
          opacity: 0.7;
          border-style: dashed;
        }

        .co-detail-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .co-detail-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .co-detail-label {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.45);
          text-transform: uppercase;
          letter-spacing: 0.4px;
        }

        .co-detail-value {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.9);
        }

        .co-delta-value {
          color: #4ade80;
          font-weight: 600;
        }

        .co-amendment-badge {
          display: inline-block;
          padding: 8px 14px;
          background: rgba(59, 130, 246, 0.1);
          border: 1px solid rgba(59, 130, 246, 0.25);
          border-radius: 6px;
          font-size: 13px;
          font-weight: 600;
          color: #93c5fd;
        }

        /* Change Orders Section Header */
        .co-section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 18px;
        }

        .co-section-header h2 {
          margin: 0;
        }

        .create-rco-btn {
          background: rgba(59, 130, 246, 0.15);
          border: 1px solid rgba(59, 130, 246, 0.35);
          color: #93c5fd;
          padding: 10px 18px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 600;
          transition: all 0.15s ease;
        }

        .create-rco-btn:hover {
          background: rgba(59, 130, 246, 0.25);
          border-color: rgba(59, 130, 246, 0.5);
          color: #bfdbfe;
        }

        /* Create RCO Panel */
        .create-rco-panel {
          width: 520px;
        }

        .create-form-field {
          margin-bottom: 20px;
        }

        .create-form-label {
          display: block;
          font-size: 12px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.6);
          text-transform: uppercase;
          letter-spacing: 0.4px;
          margin-bottom: 8px;
        }

        .create-form-select,
        .create-form-input,
        .create-form-textarea {
          width: 100%;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 8px;
          padding: 12px 14px;
          font-size: 14px;
          color: #fff;
          transition: all 0.15s ease;
        }

        .create-form-select:focus,
        .create-form-input:focus,
        .create-form-textarea:focus {
          outline: none;
          border-color: rgba(59, 130, 246, 0.5);
          background: rgba(255, 255, 255, 0.06);
        }

        .create-form-select {
          cursor: pointer;
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23ffffff' fill-opacity='0.5' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 14px center;
          padding-right: 36px;
        }

        .create-form-select option {
          background: #1f2937;
          color: #fff;
        }

        .create-form-textarea {
          resize: vertical;
          min-height: 80px;
        }

        .create-form-readonly {
          padding: 12px 14px;
          background: rgba(255, 255, 255, 0.02);
          border: 1px dashed rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          font-size: 14px;
          color: rgba(255, 255, 255, 0.5);
        }

        .create-form-radio-group {
          display: flex;
          gap: 20px;
        }

        .create-form-radio {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          font-size: 14px;
          color: rgba(255, 255, 255, 0.85);
        }

        .create-form-radio input[type="radio"] {
          width: 18px;
          height: 18px;
          accent-color: #3b82f6;
          cursor: pointer;
        }

        .create-form-input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .create-form-input-prefix {
          position: absolute;
          left: 14px;
          font-size: 14px;
          color: rgba(255, 255, 255, 0.5);
          pointer-events: none;
        }

        .create-form-input-with-prefix {
          padding-left: 28px;
        }

        .create-form-actions {
          display: flex;
          gap: 12px;
          margin-top: 32px;
          padding-top: 24px;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
        }

        .create-form-btn {
          padding: 12px 20px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .create-form-btn-secondary {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: rgba(255, 255, 255, 0.7);
        }

        .create-form-btn-secondary:hover {
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(255, 255, 255, 0.2);
          color: #fff;
        }

        .create-form-btn-draft {
          background: rgba(148, 163, 184, 0.15);
          border: 1px solid rgba(148, 163, 184, 0.3);
          color: #94a3b8;
        }

        .create-form-btn-draft:hover {
          background: rgba(148, 163, 184, 0.25);
          border-color: rgba(148, 163, 184, 0.4);
          color: #cbd5e1;
        }

        .create-form-btn-primary {
          background: rgba(59, 130, 246, 0.2);
          border: 1px solid rgba(59, 130, 246, 0.4);
          color: #93c5fd;
          margin-left: auto;
        }

        .create-form-btn-primary:hover {
          background: rgba(59, 130, 246, 0.3);
          border-color: rgba(59, 130, 246, 0.5);
          color: #bfdbfe;
        }
      `}</style>
    </div>
  );
}
