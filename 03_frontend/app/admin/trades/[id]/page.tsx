"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { useParams } from "next/navigation";

interface Trade {
  id: string;
  name: string;
  code: string;
  category: string;
  description: string;
  status: string;
  notes: string;
  wcClassCode: string;
  createdAt: string;
  updatedAt: string;
}

export default function TradeDetailPage() {
  const params = useParams();
  const tradeId = params.id as string;

  const [trade, setTrade] = useState<Trade | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<{ type: "auth" | "notfound" | "other"; message: string } | null>(null);

  const [requiredTools, setRequiredTools] = useState<{ id: string; name: string }[]>([]);
  const [loadingRequiredTools, setLoadingRequiredTools] = useState(false);

  useEffect(() => {
    if (!tradeId) return;
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setError(null);
        const data: any = await apiFetch(`/trades/${tradeId}`);
        if (!cancelled) {
          setTrade({
            id: data.id,
            name: data.name,
            code: data.code,
            category: data.category ?? "Other",
            description: data.description ?? "",
            status: data.isActive ? "Active" : "Inactive",
            notes: data.notes ?? "",
            wcClassCode: data.wcClassCode ?? "",
            createdAt: data.createdAt ? new Date(data.createdAt).toLocaleDateString() : "",
            updatedAt: data.updatedAt ? new Date(data.updatedAt).toLocaleDateString() : "",
          });
        }
      } catch (e: any) {
        if (cancelled) return;
        const msg = e?.message ?? String(e);
        if (msg.includes("no access token") || msg.includes("401") || msg.includes("403")) {
          setError({ type: "auth", message: "Not authenticated. Please log in again." });
        } else if (msg.includes("404")) {
          setError({ type: "notfound", message: `Trade with ID "${tradeId}" not found.` });
        } else {
          setError({ type: "other", message: msg });
        }
        setTrade(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [tradeId]);

  useEffect(() => {
    if (!tradeId || !trade) return;
    let cancelled = false;

    (async () => {
      try {
        setLoadingRequiredTools(true);
        const resp: any = await apiFetch(`/trades/${tradeId}/tool-types`);
        const items = resp?.items ?? [];
        const requiredItems = items.filter((it: any) => it.isRequired);
        const mapped = requiredItems
          .map((r: any) => ({ id: r.id, name: r.toolType?.name }))
          .filter((t: any) => t.name)
          .sort((a: any, b: any) => a.name.localeCompare(b.name));
        if (!cancelled) setRequiredTools(mapped);
      } catch (e) {
        console.error("Failed to load trade tool template", e);
        if (!cancelled) setRequiredTools([]);
      } finally {
        if (!cancelled) setLoadingRequiredTools(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [tradeId, trade]);

  // Category badge style
  const getCategoryStyle = (category: string) => {
    switch (category) {
      case "Mechanical":
        return { bg: "rgba(59, 130, 246, 0.12)", color: "#3b82f6", border: "rgba(59, 130, 246, 0.25)" };
      case "Electrical":
        return { bg: "rgba(245, 158, 11, 0.12)", color: "#f59e0b", border: "rgba(245, 158, 11, 0.25)" };
      case "Structural":
        return { bg: "rgba(139, 92, 246, 0.12)", color: "#8b5cf6", border: "rgba(139, 92, 246, 0.25)" };
      case "Other":
        return { bg: "rgba(148, 163, 184, 0.12)", color: "#94a3b8", border: "rgba(148, 163, 184, 0.25)" };
      default:
        return { bg: "rgba(148, 163, 184, 0.12)", color: "#94a3b8", border: "rgba(148, 163, 184, 0.25)" };
    }
  };

  // Status badge style
  const getStatusStyle = (status: string) => {
    if (status === "Active") {
      return { bg: "rgba(34, 197, 94, 0.12)", color: "#22c55e", border: "rgba(34, 197, 94, 0.25)" };
    }
    return { bg: "rgba(107, 114, 128, 0.12)", color: "#6b7280", border: "rgba(107, 114, 128, 0.25)" };
  };

  if (loading) {
    return (
      <div className="trade-detail-container">
        <div className="page-header">
          <Link href="/admin/trades" className="back-link">
            ← Back to Trades
          </Link>
          <h1>Loading…</h1>
        </div>
        <style jsx>{`
          .trade-detail-container {
            padding: 24px 40px 60px;
            max-width: 900px;
            margin: 0 auto;
          }
          .page-header { margin-bottom: 24px; }
          .back-link {
            font-size: 13px;
            color: rgba(255, 255, 255, 0.5);
            text-decoration: none;
            display: inline-block;
            margin-bottom: 12px;
          }
          .back-link:hover { color: #3b82f6; }
          h1 {
            font-size: 28px;
            font-weight: 600;
            color: #fff;
            margin: 0;
          }
        `}</style>
      </div>
    );
  }

  if (error) {
    const title = error.type === "auth" ? "Authentication Required" : error.type === "notfound" ? "Trade Not Found" : "Error";
    return (
      <div className="trade-detail-container">
        <div className="page-header">
          <Link href="/admin/trades" className="back-link">
            ← Back to Trades
          </Link>
          <h1>{title}</h1>
          <p className="subtitle">{error.message}</p>
          {error.type === "auth" && (
            <Link href="/auth/login" className="login-link">Go to Login</Link>
          )}
        </div>
        <style jsx>{`
          .trade-detail-container {
            padding: 24px 40px 60px;
            max-width: 900px;
            margin: 0 auto;
          }
          .page-header { margin-bottom: 24px; }
          .back-link {
            font-size: 13px;
            color: rgba(255, 255, 255, 0.5);
            text-decoration: none;
            display: inline-block;
            margin-bottom: 12px;
          }
          .back-link:hover { color: #3b82f6; }
          h1 {
            font-size: 28px;
            font-weight: 600;
            color: #fff;
            margin: 0 0 8px;
          }
          .subtitle {
            font-size: 14px;
            color: rgba(255, 255, 255, 0.55);
            margin: 0;
          }
          .login-link {
            display: inline-block;
            margin-top: 16px;
            padding: 10px 20px;
            background: #3b82f6;
            color: #fff;
            border-radius: 6px;
            text-decoration: none;
            font-size: 14px;
          }
          .login-link:hover { background: #2563eb; }
        `}</style>
      </div>
    );
  }

  if (!trade) {
    return (
      <div className="trade-detail-container">
        <div className="page-header">
          <Link href="/admin/trades" className="back-link">
            ← Back to Trades
          </Link>
          <h1>Trade Not Found</h1>
          <p className="subtitle">
            The trade with ID &quot;{tradeId}&quot; could not be found.
          </p>
        </div>

        <style jsx>{`
          .trade-detail-container {
            padding: 24px 40px 60px;
            max-width: 900px;
            margin: 0 auto;
          }
          .page-header {
            margin-bottom: 24px;
          }
          .back-link {
            font-size: 13px;
            color: rgba(255, 255, 255, 0.5);
            text-decoration: none;
            transition: color 0.15s ease;
            display: inline-block;
            margin-bottom: 12px;
          }
          .back-link:hover {
            color: #3b82f6;
          }
          h1 {
            font-size: 28px;
            font-weight: 600;
            color: #fff;
            margin: 0 0 8px;
            letter-spacing: -0.5px;
          }
          .subtitle {
            font-size: 14px;
            color: rgba(255, 255, 255, 0.55);
            margin: 0;
          }
        `}</style>
      </div>
    );
  }
return (
    <div className="trade-detail-container">
      {/* Header with back link */}
      <div className="page-header">
        <Link href="/admin/trades" className="back-link">
          ← Back to Trades
        </Link>
        <h1>{trade.name}</h1>
<div className="mt-3">
  <a
    href={"/admin/trades/" + tradeId + "/tools"}
    className="inline-flex items-center rounded-md border px-3 py-1 text-sm hover:bg-gray-50"
  >
    Edit Tools Template →
  </a>
</div>
        <p className="subtitle">Trade details and configuration</p>
      </div>

      {/* Trade Details Card */}
      <div className="detail-card">
        <div className="card-header">
          <h2>Trade Details</h2>
        </div>
        <div className="card-body">
          <div className="detail-grid">
            <div className="detail-item">
              <span className="detail-label">Trade Name</span>
              <span className="detail-value">{trade.name}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Trade Code</span>
              <span className="detail-value code">{trade.code}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">WC Class Code</span>
              <span className="detail-value wc-code">{trade.wcClassCode || "—"}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Category</span>
              <span
                className="category-badge"
                style={{
                  backgroundColor: getCategoryStyle(trade.category).bg,
                  color: getCategoryStyle(trade.category).color,
                  borderColor: getCategoryStyle(trade.category).border,
                }}
              >
                {trade.category}
              </span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Status</span>
              <span
                className="status-badge"
                style={{
                  backgroundColor: getStatusStyle(trade.status).bg,
                  color: getStatusStyle(trade.status).color,
                  borderColor: getStatusStyle(trade.status).border,
                }}
              >
                {trade.status}
              </span>
            </div>
          </div>

          <div className="detail-item full-width">
            <span className="detail-label">Description</span>
            <span className="detail-value">{trade.description || "—"}</span>
          </div>

          {trade.notes && (
            <div className="detail-item full-width">
              <span className="detail-label">Notes</span>
              <span className="detail-value">{trade.notes}</span>
            </div>
          )}

          <div className="audit-section">
            <div className="audit-title">Audit Information</div>
            <div className="audit-grid">
              <div className="audit-item">
                <span className="audit-label">Created</span>
                <span className="audit-value">{trade.createdAt}</span>
              </div>
              <div className="audit-item">
                <span className="audit-label">Updated</span>
                <span className="audit-value">{trade.updatedAt}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* MW4H Minimal Tools (Template) - Summary Only */}
      <div className="detail-card tool-list-card">
        <div className="card-header">
          <h2>MW4H Minimal Tools (Template)</h2>
        </div>
        <div className="card-body">
          {loadingRequiredTools ? (
            <div className="empty-state">Loading tools…</div>
          ) : requiredTools.length === 0 ? (
            <div className="empty-state">No MW4H minimal tool template configured.</div>
          ) : (
            <>
              <div className="selected-pills">
                {requiredTools.map((tool) => (
                  <span key={tool.id} className="tool-pill">
                    {tool.name}
                  </span>
                ))}
              </div>
              <div style={{ marginTop: 12, fontSize: 12, opacity: 0.6 }}>
                {requiredTools.length} required tool(s).
              </div>
            </>
          )}
        </div>
      </div>

      <style jsx>{`
        .trade-detail-container {
          padding: 24px 40px 60px;
          max-width: 900px;
          margin: 0 auto;
        }

        /* Header */
        .page-header {
          margin-bottom: 24px;
        }

        .back-link {
          font-size: 13px;
          color: rgba(255, 255, 255, 0.5);
          text-decoration: none;
          transition: color 0.15s ease;
          display: inline-block;
          margin-bottom: 12px;
        }

        .back-link:hover {
          color: #3b82f6;
        }

        h1 {
          font-size: 28px;
          font-weight: 600;
          color: #fff;
          margin: 0 0 8px;
          letter-spacing: -0.5px;
        }

        .subtitle {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.55);
          margin: 0;
        }

        /* Detail Card */
        .detail-card {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 12px;
          margin-bottom: 24px;
        }

        .card-header {
          padding: 16px 20px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }

        .card-header h2 {
          font-size: 16px;
          font-weight: 600;
          color: #fff;
          margin: 0;
        }

        .card-body {
          padding: 20px;
        }

        .detail-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
          gap: 20px;
          margin-bottom: 20px;
        }

        .detail-item {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .detail-item.full-width {
          grid-column: 1 / -1;
          margin-bottom: 12px;
        }

        .detail-label {
          font-size: 11px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.5);
          text-transform: uppercase;
          letter-spacing: 0.4px;
        }

        .detail-value {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.9);
          line-height: 1.5;
        }

        .detail-value.code {
          font-family: var(--font-geist-mono), monospace;
          font-size: 13px;
          color: rgba(255, 255, 255, 0.7);
        }

        .detail-value.wc-code {
          font-family: var(--font-geist-mono), monospace;
          font-size: 13px;
          color: rgba(139, 92, 246, 0.9);
        }

        .category-badge,
        .status-badge {
          display: inline-block;
          padding: 4px 10px;
          font-size: 11px;
          font-weight: 600;
          border-radius: 4px;
          border: 1px solid;
          letter-spacing: 0.3px;
          width: fit-content;
        }

        /* Audit Section */
        .audit-section {
          padding: 16px;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 10px;
          margin-top: 8px;
        }

        .audit-title {
          font-size: 11px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.45);
          text-transform: uppercase;
          letter-spacing: 0.4px;
          margin-bottom: 14px;
        }

        .audit-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }

        .audit-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .audit-label {
          font-size: 10px;
          color: rgba(255, 255, 255, 0.4);
        }

        .audit-value {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.8);
        }

        /* MW4H Minimal Tool List Section */
        .tool-list-card {
          margin-top: 24px;
        }

        .section-intro {
          font-size: 13px;
          color: rgba(255, 255, 255, 0.6);
          margin: 0 0 16px;
          line-height: 1.5;
        }

        .tool-search {
          margin-bottom: 12px;
        }

        .tool-search input {
          width: 100%;
          padding: 10px 14px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 6px;
          font-size: 14px;
          color: #fff;
        }

        .tool-search input:focus {
          outline: none;
          border-color: #3b82f6;
        }

        .tool-search input::placeholder {
          color: rgba(255, 255, 255, 0.35);
        }

        .tool-list-scroll {
          max-height: 280px;
          overflow-y: auto;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 8px;
          background: rgba(0, 0, 0, 0.15);
        }

        .tool-row {
          display: flex;
          align-items: center;
          padding: 10px 14px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.04);
          cursor: pointer;
          transition: background 0.15s ease;
        }

        .tool-row:last-child {
          border-bottom: none;
        }

        .tool-row:hover {
          background: rgba(59, 130, 246, 0.06);
        }

        .tool-row input[type="checkbox"] {
          width: 16px;
          height: 16px;
          margin-right: 12px;
          accent-color: #3b82f6;
          cursor: pointer;
        }

        .tool-name {
          flex: 1;
          font-size: 13px;
          color: rgba(255, 255, 255, 0.85);
        }

        .tool-flags {
          display: flex;
          gap: 6px;
        }

        .flag-badge {
          padding: 2px 6px;
          font-size: 9px;
          font-weight: 700;
          border-radius: 3px;
          letter-spacing: 0.3px;
        }

        .flag-badge.cal {
          background: rgba(34, 197, 94, 0.15);
          color: #22c55e;
          border: 1px solid rgba(34, 197, 94, 0.3);
        }

        .flag-badge.heavy {
          background: rgba(245, 158, 11, 0.15);
          color: #f59e0b;
          border: 1px solid rgba(245, 158, 11, 0.3);
        }

        .flag-badge.prec {
          background: rgba(59, 130, 246, 0.15);
          color: #3b82f6;
          border: 1px solid rgba(59, 130, 246, 0.3);
        }

        .tool-empty-search {
          padding: 24px;
          text-align: center;
          color: rgba(255, 255, 255, 0.4);
          font-size: 13px;
        }

        /* Selected tools pills */
        .selected-tools-section {
          margin-top: 16px;
        }

        .selected-label {
          display: block;
          font-size: 11px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.5);
          text-transform: uppercase;
          letter-spacing: 0.4px;
          margin-bottom: 10px;
        }

        .selected-pills {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .tool-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 10px;
          background: rgba(59, 130, 246, 0.12);
          border: 1px solid rgba(59, 130, 246, 0.25);
          border-radius: 16px;
          font-size: 12px;
          color: #3b82f6;
        }

        .pill-remove {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 16px;
          height: 16px;
          padding: 0;
          font-size: 14px;
          color: rgba(59, 130, 246, 0.7);
          background: transparent;
          border: none;
          border-radius: 50%;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .pill-remove:hover {
          color: #fff;
          background: rgba(59, 130, 246, 0.3);
        }

        .empty-state {
          padding: 16px;
          text-align: center;
          color: rgba(255, 255, 255, 0.4);
          font-size: 13px;
          font-style: italic;
          background: rgba(255, 255, 255, 0.02);
          border: 1px dashed rgba(255, 255, 255, 0.1);
          border-radius: 8px;
        }

        /* Footer note */
        .tool-footer-note {
          margin-top: 16px;
          padding: 12px 14px;
          background: rgba(139, 92, 246, 0.08);
          border: 1px solid rgba(139, 92, 246, 0.15);
          border-radius: 6px;
          font-size: 12px;
          color: rgba(139, 92, 246, 0.9);
          line-height: 1.5;
        }
      `}</style>
    </div>
  );
}








