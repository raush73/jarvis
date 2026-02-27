"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";

type ToolType = {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export default function ToolsPage() {
  const [tools, setTools] = useState<ToolType[]>([]);
  const [loading, setLoading] = useState(true);

  const [statusFilter, setStatusFilter] = useState<"active" | "inactive" | "all">("active");
  const [search, setSearch] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const [busyId, setBusyId] = useState<string | null>(null);
  const [banner, setBanner] = useState<{ type: "error" | "success"; text: string } | null>(null);

  const fetchTools = async (filter: "active" | "inactive" | "all") => {
    setLoading(true);
    try {
      let data: ToolType[];

      if (filter === "active") {
        data = await apiFetch("/tool-types?activeOnly=true");
      } else {
        data = await apiFetch("/tool-types");
      }

      if (filter === "inactive") {
        data = data.filter((t: ToolType) => !t.isActive);
      }

      setTools(data);
    } catch (err: any) {
      console.error("Failed to fetch tools", err);
      setBanner({ type: "error", text: err?.message || "Failed to fetch tools." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTools(statusFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const filteredTools = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return tools;
    return tools.filter((t) => t.name.toLowerCase().includes(q));
  }, [tools, search]);

  const toggleActive = async (tool: ToolType) => {
    try {
      setBusyId(tool.id);
      setBanner(null);

      await apiFetch(`/tool-types/${tool.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          isActive: !tool.isActive,
        }),
      });

      await fetchTools(statusFilter);
    } catch (err: any) {
      setBanner({ type: "error", text: err?.message || "Failed to update tool status." });
    } finally {
      setBusyId(null);
    }
  };

  const startEdit = (tool: ToolType) => {
    setBanner(null);
    setEditingId(tool.id);
    setEditName(tool.name);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName("");
  };

  const saveEdit = async (tool: ToolType) => {
    if (!editName.trim()) return;

    try {
      setBusyId(tool.id);
      setBanner(null);

      await apiFetch(`/tool-types/${tool.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          name: editName.trim(),
        }),
      });

      setEditingId(null);
      setEditName("");
      await fetchTools(statusFilter);
      setBanner({ type: "success", text: "Tool updated." });
    } catch (err: any) {
      setBanner({ type: "error", text: err?.message || "Failed to update tool." });
    } finally {
      setBusyId(null);
    }
  };

  const deleteTool = async (tool: ToolType) => {
    const ok = window.confirm(`Delete "${tool.name}"?\n\nThis cannot be undone.`);
    if (!ok) return;

    try {
      setBusyId(tool.id);
      setBanner(null);

      await apiFetch(`/tool-types/${tool.id}`, {
        method: "DELETE",
      });

      await fetchTools(statusFilter);
      setBanner({ type: "success", text: "Tool deleted." });
    } catch (err: any) {
      // If backend returns 409, apiFetch should surface message
      setBanner({
        type: "error",
        text: err?.message || "Cannot delete tool. Deactivate it instead.",
      });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div style={{ padding: "24px 40px 60px", maxWidth: 1000, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 600, marginBottom: 6 }}>Tool Catalog</h1>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 14 }}>
            Master list of tools available for job orders and dispatch.
          </p>
        </div>

        <Link href="/admin/tools/new">
          <button
            style={{
              padding: "10px 18px",
              background: "#3b82f6",
              border: "none",
              borderRadius: 8,
              color: "#fff",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            + Add Tool
          </button>
        </Link>
      </div>

      {banner && (
        <div
          style={{
            marginBottom: 14,
            padding: "10px 12px",
            borderRadius: 8,
            border: banner.type === "error"
              ? "1px solid rgba(239, 68, 68, 0.35)"
              : "1px solid rgba(34, 197, 94, 0.35)",
            background: banner.type === "error"
              ? "rgba(239, 68, 68, 0.08)"
              : "rgba(34, 197, 94, 0.08)",
            color: banner.type === "error" ? "#ef4444" : "#22c55e",
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          {banner.text}
        </div>
      )}

      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 18 }}>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          style={{
            padding: "8px 12px",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 6,
            color: "#fff",
          }}
        >
          <option value="active" style={{ backgroundColor: "#1f2937", color: "#ffffff" }}>
            Active Only
          </option>
          <option value="inactive" style={{ backgroundColor: "#1f2937", color: "#ffffff" }}>
            Inactive Only
          </option>
          <option value="all" style={{ backgroundColor: "#1f2937", color: "#ffffff" }}>
            All
          </option>
        </select>

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search tools…"
          style={{
            flex: 1,
            padding: "8px 12px",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 6,
            color: "#fff",
          }}
        />
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ textAlign: "left", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
              <th style={{ padding: "12px 8px" }}>Name</th>
              <th style={{ padding: "12px 8px" }}>Status</th>
              <th style={{ padding: "12px 8px" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredTools.map((tool) => (
              <tr key={tool.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <td style={{ padding: "12px 8px" }}>
                  {editingId === tool.id ? (
                    <input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      style={{
                        padding: "6px 8px",
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: 6,
                        color: "#fff",
                        width: "100%",
                        maxWidth: 420,
                      }}
                    />
                  ) : (
                    tool.name
                  )}
                </td>

                <td style={{ padding: "12px 8px" }}>{tool.isActive ? "Active" : "Inactive"}</td>

                <td style={{ padding: "12px 8px", display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {editingId === tool.id ? (
                    <>
                      <button
                        onClick={() => saveEdit(tool)}
                        disabled={busyId === tool.id}
                        style={{
                          padding: "6px 10px",
                          borderRadius: 6,
                          border: "none",
                          background: "#3b82f6",
                          color: "#fff",
                          cursor: "pointer",
                          opacity: busyId === tool.id ? 0.6 : 1,
                        }}
                      >
                        {busyId === tool.id ? "Saving..." : "Save"}
                      </button>
                      <button
                        onClick={cancelEdit}
                        disabled={busyId === tool.id}
                        style={{
                          padding: "6px 10px",
                          borderRadius: 6,
                          border: "1px solid rgba(255,255,255,0.15)",
                          background: "transparent",
                          color: "#fff",
                          cursor: "pointer",
                          opacity: busyId === tool.id ? 0.6 : 1,
                        }}
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => startEdit(tool)}
                        disabled={busyId === tool.id}
                        style={{
                          padding: "6px 10px",
                          borderRadius: 6,
                          border: "1px solid rgba(255,255,255,0.15)",
                          background: "transparent",
                          color: "#fff",
                          cursor: "pointer",
                          opacity: busyId === tool.id ? 0.6 : 1,
                        }}
                      >
                        Edit
                      </button>

                      <button
                        onClick={() => toggleActive(tool)}
                        disabled={busyId === tool.id}
                        style={{
                          padding: "6px 10px",
                          borderRadius: 6,
                          border: "1px solid rgba(255,255,255,0.15)",
                          background: "transparent",
                          color: "#fff",
                          cursor: "pointer",
                          opacity: busyId === tool.id ? 0.6 : 1,
                        }}
                      >
                        {tool.isActive ? "Deactivate" : "Activate"}
                      </button>

                      <button
                        onClick={() => deleteTool(tool)}
                        disabled={busyId === tool.id}
                        style={{
                          padding: "6px 10px",
                          borderRadius: 6,
                          border: "1px solid rgba(239, 68, 68, 0.45)",
                          background: "rgba(239, 68, 68, 0.08)",
                          color: "#ef4444",
                          cursor: "pointer",
                          opacity: busyId === tool.id ? 0.6 : 1,
                        }}
                      >
                        Delete
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}

            {filteredTools.length === 0 && (
              <tr>
                <td colSpan={3} style={{ padding: "16px 8px", color: "rgba(255,255,255,0.5)" }}>
                  No tools match your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
