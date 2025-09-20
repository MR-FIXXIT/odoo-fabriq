import React, { useState, useEffect } from "react";
import { styles } from "../DashboardStyles"; 
import ManufacturingOrderPage from "./ManufacturingOrderPage";

// Sidebar style objects
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
  sidebarClosed: {
    transform: "translateX(-100%)",
  },
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
  sidebarList: {
    listStyle: "none",
    padding: 0,
    margin: 0,
    marginTop: 12,
  },
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
  sidebarItemActive: {
    background: "#f0f6ff",
    fontWeight: 600,
    color: "#1976d2",
  },
  sidebarClose: {
    fontSize: 22,
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: "2px 8px",
  },
};

// Sidebar menu
const menuItems = [
  { key: "dashboard", label: "Dashboard" },
  { key: "mo", label: "Manufacturing Orders" },
  { key: "workorders", label: "Work Orders" },
  { key: "boms", label: "Bills of Materials" },
  { key: "workcenter", label: "Work Center" },
  { key: "stockledger", label: "Stock Ledger" },
];

export default function DashboardPage() {
  const [view, setView] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [orders, setOrders] = useState([]);
  const [workCenters, setWorkCenters] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [newCenter, setNewCenter] = useState({ name: "", costPerHour: "" });

  // Load saved data
  useEffect(() => {
    const storedOrders = JSON.parse(localStorage.getItem("orders")) || [];
    setOrders(storedOrders);
    const storedCenters = JSON.parse(localStorage.getItem("workCenters")) || [];
    setWorkCenters(storedCenters);
  }, []);

  const saveOrders = (updated) => {
    setOrders(updated);
    localStorage.setItem("orders", JSON.stringify(updated));
  };

  const saveWorkCenters = (updated) => {
    setWorkCenters(updated);
    localStorage.setItem("workCenters", JSON.stringify(updated));
  };

  // Work Center
  const addWorkCenter = () => {
    if (!newCenter.name || !newCenter.costPerHour)
      return alert("Enter all fields");
    const updated = [...workCenters, { ...newCenter }];
    saveWorkCenters(updated);
    setNewCenter({ name: "", costPerHour: "" });
  };
  const deleteWorkCenter = (index) => {
    const updated = [...workCenters];
    updated.splice(index, 1);
    saveWorkCenters(updated);
  };
  const filteredCenters = workCenters.filter((wc) =>
    wc.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // View handling
  if (view === "mo") {
    return (
      <ManufacturingOrderPage
        onBack={() => setView("dashboard")}
        orders={orders}
        saveOrders={saveOrders}
      />
    );
  }

  if (view === "workcenter") {
    return (
      <div style={styles.pageContainer}>
        <header style={headerStyles}>
          {/* Left: Burger */}
          <div style={{ flex: "0 0 auto", display: "flex", alignItems: "center" }}>
            <button
              style={burgerButton}
              aria-label="Open main menu"
              onClick={() => setSidebarOpen(true)}
            >
              ☰
            </button>
          </div>
          {/* Center */}
          <div style={headerCenter}>
            <img src="src/components/Logo.png" alt="Logo" style={{ height: 40, marginRight: 12 }} />
            <span style={appTitle}>Fabriq</span>
          </div>
          {/* Right */}
          <div style={headerRight}>
            <span style={userChip}>User</span>
          </div>
        </header>
        {/* ... rest of Work Center view ... */}
      </div>
    );
  }

  // --- Main dashboard view ---
  return (
    <div style={styles.pageContainer}>
      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div
          style={sidebarStyles.sidebarOverlay}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Drawer */}
      <nav
        style={{
          ...sidebarStyles.sidebar,
          ...(sidebarOpen ? {} : sidebarStyles.sidebarClosed),
        }}
      >
        <div style={sidebarStyles.menuHeader}>
          Master Menu
          <button
            style={sidebarStyles.sidebarClose}
            aria-label="Close"
            onClick={() => setSidebarOpen(false)}
          >
            ×
          </button>
        </div>
        <ul style={sidebarStyles.sidebarList}>
          {menuItems.map((menu) => (
            <li key={menu.key}>
              <button
                style={{
                  ...sidebarStyles.sidebarItem,
                  ...(view === menu.key ? sidebarStyles.sidebarItemActive : {}),
                }}
                onClick={() => {
                  setSidebarOpen(false);
                  setView(menu.key);
                }}
              >
                {menu.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Header */}
      <header style={headerStyles}>
        <div style={{ flex: "0 0 auto", display: "flex", alignItems: "center" }}>
          <button
            style={burgerButton}
            aria-label="Open main menu"
            onClick={() => setSidebarOpen(true)}
          >
            ☰
          </button>
        </div>
        <div style={headerCenter}>
          <img src="src/components/Logo.png" alt="Logo" style={{ height: 40, marginRight: 12 }} />
          <span style={appTitle}>Fabriq</span>
        </div>
        <div style={headerRight}>
          <span style={userChip}>User</span>
        </div>
      </header>

      {/* Nav Bar */}
      <nav style={styles.dashboardNavBar}>
        <button style={styles.newButton} onClick={() => setView("mo")}>
          New Manufacturing Order
        </button>
        <button style={styles.newButton} onClick={() => setView("workcenter")}>
          Work Center
        </button>
        <span style={styles.navTitle}>Dashboard</span>
      </nav>

      {/* Orders Table */}
      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Reference</th>
              <th style={styles.th}>Start Date</th>
              <th style={styles.th}>Finished Product</th>
              <th style={styles.th}>Component Status</th>
              <th style={styles.th}>Quantity</th>
              <th style={styles.th}>Unit</th>
              <th style={styles.th}>State</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", padding: "15px" }}>
                  No orders available.
                </td>
              </tr>
            ) : (
              orders.map((order, idx) => (
                <tr key={idx}>
                  <td style={styles.td}>{order.reference}</td>
                  <td style={styles.td}>{order.startDate || "-"}</td>
                  <td style={styles.td}>{order.finishedProduct}</td>
                  <td style={styles.td}>{order.componentStatus || "-"}</td>
                  <td style={styles.td}>{order.quantity}</td>
                  <td style={styles.td}>{order.unit}</td>
                  <td style={styles.td}>{order.state}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// --- Header styles ---
const headerStyles = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  backgroundColor: "#fff",
  padding: "0 24px",
  height: 72,
  borderBottom: "1px solid #eaeaea",
  boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
  position: "sticky",
  top: 0,
  zIndex: 1500,
};
const burgerButton = {
  background: "none",
  border: "none",
  fontSize: 26,
  marginRight: 16,
  cursor: "pointer",
  color: "#34495e",
  padding: "4px 8px",
  borderRadius: 6,
};
const headerCenter = {
  flex: "1 1 auto",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};
const appTitle = {
  fontWeight: 700,
  fontSize: 22,
  color: "#183153",
  letterSpacing: 0.5,
};
const headerRight = {
  flex: "0 0 auto",
  display: "flex",
  alignItems: "center",
};
const userChip = {
  marginLeft: 10,
  fontSize: 16,
  fontWeight: 500,
  color: "#34495e",
  borderRadius: 20,
  background: "#f2f5fa",
  padding: "8px 18px",
};
