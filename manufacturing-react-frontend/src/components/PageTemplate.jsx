import React, { useState } from "react";
import { styles as dashboardStyles } from "../DashboardStyles";
import { useNavigate } from "react-router-dom";

/**
 * Reusable page template with:
 * - Sticky top navbar: hamburger (opens sidebar), configurable New button, centered title, right-aligned search input
 * - Left sidebar (overlay) with configurable menu items
 * - Content area with optional beforeContent/afterContent slots
 * - Optional standard table rendering via columns/rows props
 *
 * Props:
 * - title: string
 * - sidebarItems: Array<{ label: string, onClick?: () => void, active?: boolean }>
 * - onNew?: () => void
 * - newLabel?: string (default "New")
 * - newTo?: string (route to navigate to when New is clicked)
 * - newState?: any (optional router state passed to navigate)
 * - searchValue?: string
 * - onSearch?: (value: string) => void
 * - searchPlaceholder?: string
 * - columns?: Array<{ label: string, accessor?: string | ((row: any) => React.ReactNode), align?: "left" | "center" | "right" }>
 * - rows?: any[]
 * - rowKey?: (row: any, index: number) => string | number
 * - emptyMessage?: string
 * - beforeContent?: React.ReactNode
 * - afterContent?: React.ReactNode
 */
export default function PageTemplate({
  title,
  sidebarItems = [],
  onNew,
  newLabel = "New",
  newTo,
  newState,
  searchValue = "",
  onSearch,
  searchPlaceholder = "Search...",
  columns = [],
  rows = [],
  rowKey,
  emptyMessage = "No records found.",
  beforeContent,
  afterContent,
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  // Sidebar style objects (shared look & feel)
  const sidebarStyles = {
    sidebar: {
      position: "fixed",
      top: 0,
      left: 0,
      height: "100vh",
      width: 250,
      background: "#fff",
      borderRight: "1px solid #eaeaea",
      boxShadow: "2px 0 8px rgba(0,0,0,0.06)",
      padding: "0 0 16px 0",
      zIndex: 2000,
      transform: "translateX(0)",
      transition: "transform 0.25s",
    },
    sidebarClosed: { transform: "translateX(-100%)" },
    sidebarOverlay: {
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: "rgba(0,0,0,0.08)",
      zIndex: 1999,
    },
    menuHeader: {
      fontWeight: 600,
      fontSize: 20,
      padding: "18px 16px 12px 22px",
      borderBottom: "1px solid #ececec",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
    },
    sidebarList: { listStyle: "none", padding: 0, margin: 0, marginTop: 12 },
    sidebarItem: {
      display: "block",
      background: "none",
      border: "none",
      width: "100%",
      textAlign: "left",
      fontSize: 16,
      padding: "14px 26px",
      color: "#34495e",
      cursor: "pointer",
      marginBottom: 2,
      borderRadius: 4,
      transition: "background 0.11s",
    },
    sidebarItemActive: { background: "#f0f6ff", fontWeight: 600, color: "#1976d2" },
    sidebarClose: { fontSize: 22, background: "none", border: "none", cursor: "pointer", padding: "2px 8px" },
  };

  // Top navigation bar styles
  const navbar = {
    container: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: "#fff",
      padding: "0 16px",
      height: 64,
      borderBottom: "1px solid #eaeaea",
      boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
      position: "sticky",
      top: 0,
      zIndex: 1500,
    },
    left: { display: "flex", alignItems: "center", gap: 8, minWidth: 200 },
    burger: { background: "none", border: "none", fontSize: 24, cursor: "pointer", color: "#34495e", padding: "6px 8px", borderRadius: 6 },
    newBtn: { backgroundColor: "#3498db", color: "#fff", padding: "8px 14px", borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 600 },
    center: { position: "absolute", left: "50%", transform: "translateX(-50%)", fontWeight: 700, fontSize: 18, color: "#183153" },
    right: { marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 },
    search: { padding: 8, borderRadius: 8, border: "1px solid #dcdde1", width: 260 },
  };

  // Table cell alignment helper
  const toTextAlign = (align) => (align === "center" || align === "right" ? align : "left");

  const handleNewClick = () => {
    if (newTo) {
      navigate(newTo, newState ? { state: newState } : undefined);
      return;
    }
    if (typeof onNew === "function") onNew();
  };

  return (
    <div style={{ padding: 0 }}>
      {/* Sidebar overlay and panel */}
      {sidebarOpen && <div style={sidebarStyles.sidebarOverlay} onClick={() => setSidebarOpen(false)} />}
      <nav style={{ ...sidebarStyles.sidebar, ...(sidebarOpen ? {} : sidebarStyles.sidebarClosed) }}>
        <div style={sidebarStyles.menuHeader}>
          Master Menu
          <button style={sidebarStyles.sidebarClose} onClick={() => setSidebarOpen(false)}>×</button>
        </div>
        <ul style={sidebarStyles.sidebarList}>
          {sidebarItems.map((item, idx) => (
            <li key={idx}>
              <button
                style={{
                  ...sidebarStyles.sidebarItem,
                  ...(item.active ? sidebarStyles.sidebarItemActive : {}),
                }}
                onClick={() => {
                  setSidebarOpen(false);
                  item.onClick && item.onClick();
                }}
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Top Navigation Bar */}
      <header style={navbar.container}>
        <div style={navbar.left}>
          <button style={navbar.burger} onClick={() => setSidebarOpen(true)}>☰</button>
          {(onNew || newTo) && (
            <button style={navbar.newBtn} onClick={handleNewClick}>{newLabel}</button>
          )}
        </div>
        <div style={navbar.center}>{title}</div>
        <div style={navbar.right}>
          {typeof onSearch === "function" && (
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={(e) => onSearch(e.target.value)}
              style={navbar.search}
            />
          )}
        </div>
      </header>

      {/* Content */}
      <div style={{ padding: 24 }}>
        {beforeContent}

        {/* Optional Standard Table */}
        {Array.isArray(columns) && columns.length > 0 && (
          <div style={dashboardStyles.tableContainer}>
            <table style={dashboardStyles.table}>
              <thead>
                <tr>
                  {columns.map((col, i) => (
                    <th key={i} style={{ ...dashboardStyles.th, textAlign: toTextAlign(col.align) }}>{col.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(!rows || rows.length === 0) ? (
                  <tr>
                    <td colSpan={columns.length} style={{ textAlign: "center", padding: 12 }}>
                      {emptyMessage}
                    </td>
                  </tr>
                ) : (
                  rows.map((row, rIdx) => (
                    <tr key={rowKey ? rowKey(row, rIdx) : rIdx}>
                      {columns.map((col, cIdx) => {
                        let value;
                        if (typeof col.accessor === "function") value = col.accessor(row);
                        else if (typeof col.accessor === "string") value = row[col.accessor];
                        else value = row[col.label];
                        return (
                          <td key={cIdx} style={{ ...dashboardStyles.td, textAlign: toTextAlign(col.align) }}>
                            {value}
                          </td>
                        );
                      })}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {afterContent}
      </div>
    </div>
  );
}
