import React, { useState, useEffect } from "react";
import { styles } from "../DashboardStyles";

export default function StockLedgerPage({ onBack }) {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    product: "",
    unitCost: "",
    unit: "",
    onHand: "",
    freeToUse: "",
    incoming: "",
    outgoing: "",
  });

  // Sidebar open/close state
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Sidebar style objects (mirroring Dashboard aesthetics)
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

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("stockLedger")) || [];
    setProducts(stored);
  }, []);

  const saveProduct = () => {
    const updated = [...products, formData];
    setProducts(updated);
    localStorage.setItem("stockLedger", JSON.stringify(updated));
    setFormData({ product: "", unitCost: "", unit: "", onHand: "", freeToUse: "", incoming: "", outgoing: "" });
    setShowForm(false);
  };

  const filteredProducts = products.filter((p) =>
    (p.product || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.unit || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const calcTotalValue = (unitCost, onHand) => {
    const uc = parseFloat(unitCost) || 0;
    const oh = parseFloat(onHand) || 0;
    return (uc * oh).toFixed(2);
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
          <li>
            <button
              style={sidebarStyles.sidebarItem}
              onClick={() => { setSidebarOpen(false); if (onBack) onBack(); }}
            >
              Dashboard
            </button>
          </li>
          <li>
            <button
              style={{ ...sidebarStyles.sidebarItem, ...sidebarStyles.sidebarItemActive }}
              onClick={() => setSidebarOpen(false)}
            >
              Stock Ledger
            </button>
          </li>
        </ul>
      </nav>

      {/* Top Navigation Bar */}
      <header style={navbar.container}>
        <div style={navbar.left}>
          <button style={navbar.burger} onClick={() => setSidebarOpen(true)}>☰</button>
          <button style={navbar.newBtn} onClick={() => setShowForm(true)}>New</button>
        </div>
        <div style={navbar.center}>Stock Ledger</div>
        <div style={navbar.right}>
          <input
            type="text"
            placeholder="Search Product / Unit"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={navbar.search}
          />
        </div>
      </header>

      {/* Content */}
      <div style={{ padding: 24 }}>
        {/* Add/Edit Form */}
        {showForm && (
          <div style={{ marginBottom: 24, border: "1px solid #e0e0e0", padding: 16, borderRadius: 8 }}>
            <input
              type="text"
              placeholder="Product"
              value={formData.product}
              onChange={(e) => setFormData({ ...formData, product: e.target.value })}
              style={{ marginRight: 8, padding: 6 }}
            />
            <input
              type="number"
              placeholder="Unit Cost"
              value={formData.unitCost}
              onChange={(e) => setFormData({ ...formData, unitCost: e.target.value })}
              style={{ marginRight: 8, padding: 6 }}
            />
            <input
              type="text"
              placeholder="Unit"
              value={formData.unit}
              onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              style={{ marginRight: 8, padding: 6 }}
            />
            <input
              type="number"
              placeholder="On Hand"
              value={formData.onHand}
              onChange={(e) => setFormData({ ...formData, onHand: e.target.value })}
              style={{ marginRight: 8, padding: 6 }}
            />
            <input
              type="number"
              placeholder="Free to Use"
              value={formData.freeToUse}
              onChange={(e) => setFormData({ ...formData, freeToUse: e.target.value })}
              style={{ marginRight: 8, padding: 6 }}
            />
            <input
              type="number"
              placeholder="Incoming"
              value={formData.incoming}
              onChange={(e) => setFormData({ ...formData, incoming: e.target.value })}
              style={{ marginRight: 8, padding: 6 }}
            />
            <input
              type="number"
              placeholder="Outgoing"
              value={formData.outgoing}
              onChange={(e) => setFormData({ ...formData, outgoing: e.target.value })}
              style={{ marginRight: 8, padding: 6 }}
            />
            <button
              onClick={saveProduct}
              style={{ padding: "6px 12px", backgroundColor: "#1976d2", color: "#fff", border: "none", borderRadius: 6 }}
            >
              Save
            </button>
          </div>
        )}

        {/* Stock Table */}
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Product</th>
              <th style={styles.th}>Unit Cost</th>
              <th style={styles.th}>Unit</th>
              <th style={styles.th}>Total Value</th>
              <th style={styles.th}>On Hand</th>
              <th style={styles.th}>Free to Use</th>
              <th style={styles.th}>Incoming</th>
              <th style={styles.th}>Outgoing</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: "center", padding: 12 }}>
                  No products found.
                </td>
              </tr>
            ) : (
              filteredProducts.map((p, idx) => (
                <tr key={idx}>
                  <td style={styles.td}>{p.product}</td>
                  <td style={styles.td}>{p.unitCost}</td>
                  <td style={styles.td}>{p.unit}</td>
                  <td style={styles.td}>{calcTotalValue(p.unitCost, p.onHand)}</td>
                  <td style={styles.td}>{p.onHand}</td>
                  <td style={styles.td}>{p.freeToUse}</td>
                  <td style={styles.td}>{p.incoming}</td>
                  <td style={styles.td}>{p.outgoing}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
