"use client";

import { clearAccessToken } from "@/lib/api";
import { useRouter, usePathname } from "next/navigation";

const DOMAINS = [
  { key: "kpi", label: "KPI" },
  { key: "friday", label: "Friday" },
  { key: "orders", label: "Orders" },
  { key: "customers", label: "Customers" },
  { key: "employees", label: "Employees" },
  { key: "time-entry", label: "Time Entry" },
  { key: "accounting", label: "Accounting" },
  { key: "admin", label: "Admin" },
];

export default function GlobalTopNav() {
  const router = useRouter();
  const pathname = usePathname();

  // Derive active domain from the first URL path segment
  const pathSegments = pathname.split("/").filter(Boolean);
  const activeDomain = pathSegments[0] || "";

  return (
    <nav className="global-top-nav">
      {/* Jarvis Prime Logo - Visual Anchor */}
      <div className="nav-logo">
        <img
          src="/branding/jarvis-prime-logo.png"
          alt="Jarvis Prime"
          style={{ height: '38px', width: 'auto', cursor: 'pointer' }}
          onClick={() => router.push("/orders")}
        />
      </div>

      {/* Domain Navigation */}
      <div className="nav-domains">
        {DOMAINS.map((domain) => (
          <button
            key={domain.key}
            className={`nav-domain-item ${
              domain.key === activeDomain ? "active" : ""
            }`}
            type="button"
            onClick={() => router.push(`/${domain.key}`)}
          >
            {domain.label}
          </button>
        ))}
      </div>
      {/* Logout Button */}
      <div style={{ marginLeft: "auto", paddingRight: "16px" }}>
        <button
          type="button"
          onClick={() => { clearAccessToken(); router.push("/login"); }}
          style={{
            background: "transparent",
            border: "1px solid rgba(255,255,255,0.3)",
            color: "#fff",
            padding: "6px 12px",
            borderRadius: "6px",
            cursor: "pointer"
          }}
        >
          Logout
        </button>
      </div>
    </nav>
  );
}
