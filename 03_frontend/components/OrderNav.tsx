"use client";

import { useRouter, usePathname, useParams } from "next/navigation";

/**
 * OrderNav — Order-Level Navigation Component
 * 
 * Provides consistent order-scoped navigation for internal users
 * navigating between order-related views within /orders/[id].
 * 
 * ORDER-CONTEXT ROUTING ENFORCEMENT:
 * - ALL tabs resolve to order-scoped pages (/orders/[id]/*)
 * - NO tab routes to list-level views (/orders, /dispatch, etc.)
 * - Dispatch tab routes to /orders/[id]/dispatch-order (NOT recruiting queue)
 * 
 * UI Shell only — no data fetching, no permissions.
 */

/**
 * ORDER_TABS Configuration (LOCKED)
 * 
 * Tab routing is STRICTLY order-scoped:
 * - Overview   → /orders/[id]
 * - Vetting    → /orders/[id]/vetting
 * - Dispatch   → /orders/[id]/dispatch-order (Order-specific dispatch document)
 * - Time       → /orders/[id]/time
 * - Invoicing  → /orders/[id]/invoicing
 * - Documents  → /orders/[id]/documents
 * 
 * DO NOT modify these paths to point to list-level routes.
 */
const ORDER_TABS = [
  { key: "overview", label: "Overview", path: "" },
  { key: "vetting", label: "Vetting", path: "/vetting" },
  { key: "dispatch", label: "Dispatch", path: "/dispatch-order" },
  { key: "time", label: "Time", path: "/time" },
  { key: "timesheets", label: "Timesheets", path: "/timesheets" },
  { key: "invoicing", label: "Invoicing", path: "/invoicing" },
  { key: "documents", label: "Documents", path: "/documents" },
] as const;

export default function OrderNav() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const orderId = params?.id as string;

  // Base path for this order — ALL navigation stays within this context
  const basePath = `/orders/${orderId}`;

  /**
   * Determine active tab based on pathname
   * 
   * ORDER-CONTEXT ENFORCEMENT:
   * - Only matches paths within /orders/[id]/*
   * - Falls back to "overview" for the base path or unknown routes
   */
  const getActiveTab = (): string => {
    if (!pathname || !orderId) return "overview";
    
    // Remove base path to get the remaining segment
    const remainingPath = pathname.replace(basePath, "");
    
    // Normalize: remove leading slash for comparison
    const normalizedPath = remainingPath.startsWith("/") 
      ? remainingPath 
      : `/${remainingPath}`;
    
    // Find matching tab (exact match or starts with for nested routes)
    for (const tab of ORDER_TABS) {
      const tabPath = tab.path || "";
      const normalizedTabPath = tabPath.startsWith("/") ? tabPath : `/${tabPath}`;
      
      // Exact match for empty path (overview)
      if (tabPath === "" && (normalizedPath === "" || normalizedPath === "/")) {
        return tab.key;
      }
      
      // Match for non-empty paths
      if (tabPath !== "" && normalizedPath.startsWith(normalizedTabPath)) {
        return tab.key;
      }
    }
    
    // Default to overview if no match (handles invalid routes gracefully)
    return "overview";
  };

  const activeTab = getActiveTab();

  /**
   * Handle tab navigation
   * 
   * ORDER-CONTEXT ENFORCEMENT:
   * - ALWAYS routes to /orders/[id]/* paths
   * - NEVER routes to list-level pages
   */
  const handleTabClick = (tab: typeof ORDER_TABS[number]) => {
    const targetPath = `${basePath}${tab.path}`;
    router.push(targetPath);
  };

  return (
    <nav className="order-nav">
      <div className="order-nav-container">
        {ORDER_TABS.map((tab) => (
          <button
            key={tab.key}
            className={`order-nav-tab ${tab.key === activeTab ? "active" : ""}`}
            type="button"
            onClick={() => handleTabClick(tab)}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </nav>
  );
}

