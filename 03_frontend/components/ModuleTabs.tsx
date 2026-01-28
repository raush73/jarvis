"use client";

// Tab definitions per domain
const MODULE_TABS: Record<string, { key: string; label: string }[]> = {
  kpi: [
    { key: "overview", label: "Overview" },
    { key: "operations", label: "Operations" },
    { key: "finance", label: "Finance" },
    { key: "safety", label: "Safety" },
  ],
  friday: [
    { key: "dashboard", label: "Dashboard" },
    { key: "assistant", label: "Assistant" },
  ],
  orders: [
    { key: "recruiting", label: "Recruiting" },
    { key: "dispatch", label: "Dispatch" },
    { key: "time", label: "Time" },
    { key: "invoicing", label: "Invoicing" },
    { key: "documents", label: "Documents" },
  ],
  customers: [
    { key: "list", label: "Customer List" },
    { key: "contracts", label: "Contracts" },
  ],
  employees: [
    { key: "roster", label: "Roster" },
    { key: "scheduling", label: "Scheduling" },
  ],
  accounting: [
    { key: "gl", label: "GL" },
    { key: "ar", label: "AR" },
    { key: "ap", label: "AP" },
    { key: "assets", label: "Assets" },
    { key: "statements", label: "Statements" },
  ],
  admin: [
    { key: "users", label: "Users" },
    { key: "settings", label: "Settings" },
  ],
};

// Mocked current domain and active tab for UI demonstration
const MOCKED_CURRENT_DOMAIN = "kpi";
const MOCKED_ACTIVE_TAB = "overview";

export default function ModuleTabs() {
  const tabs = MODULE_TABS[MOCKED_CURRENT_DOMAIN] || [];

  if (tabs.length === 0) return null;

  return (
    <div className="module-tabs">
      <div className="module-tabs-container">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            className={`module-tab-item ${
              tab.key === MOCKED_ACTIVE_TAB ? "active" : ""
            }`}
            type="button"
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}

