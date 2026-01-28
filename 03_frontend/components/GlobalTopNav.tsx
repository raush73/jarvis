"use client";

const DOMAINS = [
  { key: "kpi", label: "KPI" },
  { key: "friday", label: "Friday" },
  { key: "orders", label: "Orders" },
  { key: "customers", label: "Customers" },
  { key: "employees", label: "Employees" },
  { key: "accounting", label: "Accounting" },
  { key: "admin", label: "Admin" },
];

// Mocked active domain for UI demonstration
const MOCKED_ACTIVE_DOMAIN = "kpi";

export default function GlobalTopNav() {
  return (
    <nav className="global-top-nav">
      {/* Jarvis Prime Logo - Visual Anchor */}
      <div className="nav-logo">
        <img
          src="/branding/jarvis-prime-logo.png"
          alt="Jarvis Prime"
          style={{ height: '38px', width: 'auto', cursor: 'pointer' }}
        />
      </div>

      {/* Domain Navigation */}
      <div className="nav-domains">
        {DOMAINS.map((domain) => (
          <button
            key={domain.key}
            className={`nav-domain-item ${
              domain.key === MOCKED_ACTIVE_DOMAIN ? "active" : ""
            }`}
            type="button"
          >
            {domain.label}
          </button>
        ))}
      </div>
    </nav>
  );
}

