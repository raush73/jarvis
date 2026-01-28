"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";

// Mock customer details data
const MOCK_CUSTOMER_DETAILS: Record<string, {
  id: string;
  name: string;
  status: string;
  city: string;
  state: string;
  address: string;
  mainPhone: string;
  website: string;
  ownerSalespersonName: string;
  contacts: Array<{
    id: string;
    name: string;
    title: string;
    email: string;
    officePhone: string;
    cellPhone: string;
    notes: string;
    isPrimary: boolean;
  }>;
  tools: string[];
  ppe: string[];
  orders: Array<{
    id: string;
    site: string;
    startDate: string;
    status: string;
  }>;
}> = {
  "CUST-001": {
    id: "CUST-001",
    name: "Turner Construction",
    status: "Active",
    city: "Los Angeles",
    state: "CA",
    address: "450 S Grand Ave, Suite 2100, Los Angeles, CA 90071",
    mainPhone: "(213) 555-1000",
    website: "https://turnerconstruction.com",
    ownerSalespersonName: "Jordan Miles",
    contacts: [
      {
        id: "CON-001",
        name: "Michael Torres",
        title: "VP of Operations",
        email: "mtorres@turnerconstruction.com",
        officePhone: "(213) 555-1001",
        cellPhone: "(310) 555-2001",
        notes: "Prefers email communication",
        isPrimary: true,
      },
      {
        id: "CON-002",
        name: "Lisa Chen",
        title: "Project Director",
        email: "lchen@turnerconstruction.com",
        officePhone: "(213) 555-1002",
        cellPhone: "(310) 555-2002",
        notes: "",
        isPrimary: false,
      },
      {
        id: "CON-003",
        name: "Robert Williams",
        title: "Safety Manager",
        email: "rwilliams@turnerconstruction.com",
        officePhone: "(213) 555-1003",
        cellPhone: "(310) 555-2003",
        notes: "Contact for safety certifications",
        isPrimary: false,
      },
      {
        id: "CON-004",
        name: "Amanda Foster",
        title: "Procurement Specialist",
        email: "afoster@turnerconstruction.com",
        officePhone: "(213) 555-1004",
        cellPhone: "(310) 555-2004",
        notes: "Handles equipment requests",
        isPrimary: false,
      },
    ],
    tools: ["Torque Wrenches (Calibrated)", "Laser Alignment Kits", "Rigging Equipment", "Dial Indicators", "Portable Crane (10-ton)"],
    ppe: ["Hard Hat (ANSI Type II)", "Safety Glasses (ANSI Z87.1)", "Steel-Toe Boots", "Hi-Vis Vest (Class 3)", "Cut-Resistant Gloves", "Fall Protection Harness"],
    orders: [
      { id: "ORD-2024-001", site: "Downtown Tower — Los Angeles, CA", startDate: "2024-02-15", status: "Active" },
      { id: "ORD-2024-010", site: "Westside Medical Center — Santa Monica, CA", startDate: "2024-04-01", status: "Pending" },
    ],
  },
};

// Default fallback for any customer ID
const DEFAULT_CUSTOMER = {
  id: "CUST-XXX",
  name: "Sample Customer",
  status: "Active",
  city: "City",
  state: "ST",
  address: "123 Main St, Suite 100, City, ST 00000",
  mainPhone: "(000) 000-0000",
  website: "https://example.com",
  ownerSalespersonName: "Sales Rep",
  contacts: [
    {
      id: "CON-001",
      name: "John Smith",
      title: "Operations Manager",
      email: "jsmith@example.com",
      officePhone: "(000) 000-0001",
      cellPhone: "(000) 000-1001",
      notes: "Primary point of contact",
      isPrimary: true,
    },
    {
      id: "CON-002",
      name: "Jane Doe",
      title: "Project Manager",
      email: "jdoe@example.com",
      officePhone: "(000) 000-0002",
      cellPhone: "(000) 000-1002",
      notes: "",
      isPrimary: false,
    },
  ],
  tools: ["Standard Tool Kit", "Measuring Equipment"],
  ppe: ["Hard Hat", "Safety Glasses", "Steel-Toe Boots"],
  orders: [
    { id: "ORD-2024-001", site: "Sample Site — City, ST", startDate: "2024-03-01", status: "Active" },
  ],
};

type TabKey = "contacts" | "tools" | "ppe" | "orders";

export default function CustomerDetailPage() {
  const router = useRouter();
  const params = useParams();
  const customerId = params.id as string;

  const [activeTab, setActiveTab] = useState<TabKey>("contacts");

  // Get customer data or use default
  const customer = MOCK_CUSTOMER_DETAILS[customerId] || { ...DEFAULT_CUSTOMER, id: customerId };

  const handleBackToCustomers = () => {
    router.push("/customers");
  };

  const tabs: { key: TabKey; label: string }[] = [
    { key: "contacts", label: "Contacts" },
    { key: "tools", label: "Tools" },
    { key: "ppe", label: "PPE" },
    { key: "orders", label: "Orders" },
  ];

  return (
    <div className="customer-detail-container">
      {/* Page Header */}
      <div className="detail-header">
        <div className="header-left">
          <button className="back-btn" onClick={handleBackToCustomers}>
            ← Back to Customers
          </button>
          <div className="header-title">
            <h1>{customer.name}</h1>
            <span className="customer-id-badge">{customer.id}</span>
            <span className={`status-badge ${customer.status.toLowerCase()}`}>{customer.status}</span>
          </div>
        </div>
      </div>

      {/* Summary Row */}
      <div className="summary-row">
        <div className="summary-item">
          <span className="summary-label">Default Salesperson</span>
          <div className="summary-value-row">
            <span className="summary-value">{customer.ownerSalespersonName}</span>
            <span className="read-only-badge">Read-only</span>
          </div>
        </div>
        <div className="summary-item">
          <span className="summary-label">Main Phone</span>
          <span className="summary-value mono">{customer.mainPhone}</span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Website</span>
          <a href={customer.website} className="summary-link" target="_blank" rel="noopener noreferrer">
            {customer.website.replace(/^https?:\/\//, "")}
          </a>
        </div>
        <div className="summary-item address-item">
          <span className="summary-label">Address</span>
          <span className="summary-value">{customer.address}</span>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="tabs-nav">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            className={`tab-btn ${activeTab === tab.key ? "active" : ""}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
            {tab.key === "contacts" && (
              <span className="tab-count">{customer.contacts.length}</span>
            )}
            {tab.key === "orders" && (
              <span className="tab-count">{customer.orders.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {/* Contacts Tab */}
        {activeTab === "contacts" && (
          <div className="contacts-panel">
            <div className="panel-header">
              <h2>Contacts Directory</h2>
              <span className="panel-note">Customer contact sprawl lives here — Job Orders only show PM</span>
            </div>
            <div className="contacts-table-wrap">
              <table className="contacts-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Title / Role</th>
                    <th>Email</th>
                    <th>Office Phone</th>
                    <th>Cell Phone</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {customer.contacts.map((contact) => (
                    <tr key={contact.id} className={contact.isPrimary ? "primary-contact" : ""}>
                      <td className="contact-name">
                        <span className="name-text">{contact.name}</span>
                        {contact.isPrimary && (
                          <span className="primary-badge">Primary</span>
                        )}
                      </td>
                      <td className="contact-title">{contact.title}</td>
                      <td className="contact-email">
                        <a href={`mailto:${contact.email}`}>{contact.email}</a>
                      </td>
                      <td className="contact-phone">{contact.officePhone}</td>
                      <td className="contact-phone">{contact.cellPhone}</td>
                      <td className="contact-notes">{contact.notes || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tools Tab */}
        {activeTab === "tools" && (
          <div className="tools-panel">
            <div className="panel-header">
              <h2>Customer-Level Tools</h2>
              <span className="panel-note">Tools commonly required at this customer&apos;s sites</span>
            </div>
            <ul className="item-list">
              {customer.tools.map((tool, idx) => (
                <li key={idx}>{tool}</li>
              ))}
            </ul>
            <div className="placeholder-note">
              <span className="placeholder-icon">🔧</span>
              <span>Customer-level tools live here. Site-specific tools can be defined per Job Order.</span>
            </div>
          </div>
        )}

        {/* PPE Tab */}
        {activeTab === "ppe" && (
          <div className="ppe-panel">
            <div className="panel-header">
              <h2>Customer-Level PPE</h2>
              <span className="panel-note">Standard PPE requirements for this customer</span>
            </div>
            <ul className="item-list">
              {customer.ppe.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
            <div className="placeholder-note">
              <span className="placeholder-icon">🦺</span>
              <span>Customer-level PPE requirements live here. Site-specific PPE can be defined per Job Order.</span>
            </div>
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === "orders" && (
          <div className="orders-panel">
            <div className="panel-header">
              <h2>Order History</h2>
              <span className="panel-note">All job orders associated with this customer</span>
            </div>
            <div className="orders-list">
              {customer.orders.map((order) => (
                <div
                  key={order.id}
                  className="order-card"
                  onClick={() => router.push(`/orders/${order.id}`)}
                >
                  <div className="order-info">
                    <span className="order-id">{order.id}</span>
                    <span className="order-site">{order.site}</span>
                  </div>
                  <div className="order-meta">
                    <span className="order-date">
                      Start: {new Date(order.startDate).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                    <span className={`order-status ${order.status.toLowerCase()}`}>
                      {order.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .customer-detail-container {
          padding: 24px 40px 60px;
          max-width: 1300px;
          margin: 0 auto;
        }

        .detail-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 28px;
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

        .customer-id-badge {
          font-family: var(--font-geist-mono), monospace;
          font-size: 13px;
          padding: 4px 10px;
          background: rgba(59, 130, 246, 0.15);
          color: #3b82f6;
          border-radius: 6px;
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

        /* Summary Row */
        .summary-row {
          display: flex;
          gap: 32px;
          padding: 20px 24px;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 12px;
          margin-bottom: 24px;
          flex-wrap: wrap;
        }

        .summary-item {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .summary-item.address-item {
          flex: 1;
          min-width: 200px;
        }

        .summary-label {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.45);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .summary-value {
          font-size: 14px;
          color: #fff;
        }

        .summary-value.mono {
          font-family: var(--font-geist-mono), monospace;
        }

        .summary-value-row {
          display: flex;
          align-items: center;
          gap: 10px;
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

        .summary-link {
          font-size: 14px;
          color: #3b82f6;
          text-decoration: none;
          transition: color 0.15s ease;
        }

        .summary-link:hover {
          color: #60a5fa;
          text-decoration: underline;
        }

        /* Tabs Navigation */
        .tabs-nav {
          display: flex;
          gap: 4px;
          margin-bottom: 24px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
          padding-bottom: 0;
        }

        .tab-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 20px;
          font-size: 14px;
          font-weight: 500;
          color: rgba(255, 255, 255, 0.5);
          background: transparent;
          border: none;
          border-bottom: 2px solid transparent;
          cursor: pointer;
          transition: all 0.15s ease;
          margin-bottom: -1px;
        }

        .tab-btn:hover {
          color: rgba(255, 255, 255, 0.8);
        }

        .tab-btn.active {
          color: #fff;
          border-bottom-color: #3b82f6;
        }

        .tab-count {
          font-size: 11px;
          padding: 2px 7px;
          background: rgba(255, 255, 255, 0.08);
          border-radius: 10px;
          color: rgba(255, 255, 255, 0.6);
        }

        .tab-btn.active .tab-count {
          background: rgba(59, 130, 246, 0.2);
          color: #60a5fa;
        }

        /* Tab Content */
        .tab-content {
          min-height: 300px;
        }

        /* Panel Header */
        .panel-header {
          display: flex;
          align-items: baseline;
          gap: 16px;
          margin-bottom: 20px;
        }

        .panel-header h2 {
          font-size: 18px;
          font-weight: 600;
          color: #fff;
          margin: 0;
        }

        .panel-note {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.4);
        }

        /* Contacts Table */
        .contacts-table-wrap {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 12px;
          overflow: hidden;
        }

        .contacts-table {
          width: 100%;
          border-collapse: collapse;
        }

        .contacts-table thead {
          background: rgba(255, 255, 255, 0.03);
        }

        .contacts-table th {
          padding: 12px 16px;
          text-align: left;
          font-size: 11px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.5);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }

        .contacts-table td {
          padding: 14px 16px;
          font-size: 13px;
          color: rgba(255, 255, 255, 0.85);
          border-bottom: 1px solid rgba(255, 255, 255, 0.04);
        }

        .contacts-table tr:last-child td {
          border-bottom: none;
        }

        .contacts-table tr.primary-contact {
          background: rgba(59, 130, 246, 0.05);
        }

        .contact-name {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .name-text {
          font-weight: 500;
          color: #fff;
        }

        .primary-badge {
          font-size: 9px;
          padding: 2px 6px;
          background: rgba(59, 130, 246, 0.2);
          color: #60a5fa;
          border-radius: 4px;
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }

        .contact-title {
          color: rgba(255, 255, 255, 0.7);
        }

        .contact-email a {
          color: #3b82f6;
          text-decoration: none;
        }

        .contact-email a:hover {
          text-decoration: underline;
        }

        .contact-phone {
          font-family: var(--font-geist-mono), monospace;
          font-size: 12px;
          color: rgba(255, 255, 255, 0.6);
        }

        .contact-notes {
          color: rgba(255, 255, 255, 0.5);
          font-style: italic;
          max-width: 200px;
        }

        /* Item Lists (Tools/PPE) */
        .item-list {
          list-style: none;
          margin: 0 0 24px;
          padding: 0;
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 10px;
        }

        .item-list li {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.85);
          padding: 12px 16px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 8px;
          position: relative;
          padding-left: 32px;
        }

        .item-list li::before {
          content: "•";
          position: absolute;
          left: 14px;
          color: #3b82f6;
          font-size: 18px;
        }

        .placeholder-note {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px 20px;
          background: rgba(59, 130, 246, 0.05);
          border: 1px dashed rgba(59, 130, 246, 0.2);
          border-radius: 10px;
          color: rgba(255, 255, 255, 0.5);
          font-size: 13px;
        }

        .placeholder-icon {
          font-size: 20px;
        }

        /* Orders List */
        .orders-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .order-card {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 18px 22px;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .order-card:hover {
          background: rgba(59, 130, 246, 0.08);
          border-color: rgba(59, 130, 246, 0.15);
        }

        .order-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .order-id {
          font-family: var(--font-geist-mono), monospace;
          font-size: 14px;
          font-weight: 500;
          color: #3b82f6;
        }

        .order-site {
          font-size: 13px;
          color: rgba(255, 255, 255, 0.7);
        }

        .order-meta {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .order-date {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.5);
        }

        .order-status {
          font-size: 11px;
          font-weight: 600;
          padding: 4px 10px;
          border-radius: 12px;
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }

        .order-status.active {
          background: rgba(34, 197, 94, 0.15);
          color: #22c55e;
        }

        .order-status.pending {
          background: rgba(245, 158, 11, 0.15);
          color: #f59e0b;
        }
      `}</style>
    </div>
  );
}

