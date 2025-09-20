import React, { useState, useEffect, useRef } from "react";
import { styles } from "../DashboardStyles";
import ManufacturingOrderPage from "./ManufacturingOrderPage";

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

// Sidebar menu (Work Orders removed)
const menuItems = [
  { key: "dashboard", label: "Dashboard" },
  { key: "mo", label: "Manufacturing Orders" },
  { key: "boms", label: "Bills of Materials" },
  { key: "stockledger", label: "Stock Ledger" },
];

export default function DashboardPage() {
  const [view, setView] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef();

  const [orders, setOrders] = useState([]);
  const [workCenters, setWorkCenters] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [newCenter, setNewCenter] = useState({ name: "", costPerHour: "" });

  // Load data
  useEffect(() => {
    setOrders(JSON.parse(localStorage.getItem("orders")) || []);
    setWorkCenters(JSON.parse(localStorage.getItem("workCenters")) || []);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const saveOrders = (updated) => {
    setOrders(updated);
    localStorage.setItem("orders", JSON.stringify(updated));
  };

  const saveWorkCenters = (updated) => {
    setWorkCenters(updated);
    localStorage.setItem("workCenters", JSON.stringify(updated));
  };

  const addWorkCenter = () => {
    if (!newCenter.name || !newCenter.costPerHour) return alert("Enter all fields");
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

  if (view === "mo") {
    return <ManufacturingOrderPage onBack={() => setView("dashboard")} orders={orders} saveOrders={saveOrders} />;
  }

  return (
    <div style={styles.pageContainer}>
      {/* Sidebar Overlay */}
      {sidebarOpen && <div style={sidebarStyles.sidebarOverlay} onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar Drawer */}
      <nav style={{ ...sidebarStyles.sidebar, ...(sidebarOpen ? {} : sidebarStyles.sidebarClosed) }}>
        <div style={sidebarStyles.menuHeader}>
          Master Menu
          <button style={sidebarStyles.sidebarClose} aria-label="Close" onClick={() => setSidebarOpen(false)}>
            ×
          </button>
        </div>
        <ul style={sidebarStyles.sidebarList}>
          {menuItems.map((menu) => (
            <li key={menu.key}>
              <button
                style={{ ...sidebarStyles.sidebarItem, ...(view === menu.key ? sidebarStyles.sidebarItemActive : {}) }}
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
        <div style={{ display: "flex", alignItems: "center" }}>
          <button style={burgerButton} aria-label="Open menu" onClick={() => setSidebarOpen(true)}>
            ☰
          </button>
        </div>
        <div style={headerCenter}>
          <img src="src/components/Logo.png" alt="Logo" style={{ height: 40, marginRight: 12 }} />
          <span style={appTitle}>Fabriq</span>
        </div>
        <div style={headerRight} ref={profileRef}>
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            style={{ border: "none", background: "none", cursor: "pointer", borderRadius: "50%", width: 44, height: 44 }}
          >
            <img src="/user-avatar.png" alt="User" style={{ width: 44, height: 44, borderRadius: "50%", background: "#f0f3fa" }} />
          </button>

          {/* Profile Drawer */}
          {profileOpen && (
            <div style={profileDrawer}>
              <div style={profileHeader}>
                Profile
                <button onClick={() => setProfileOpen(false)} style={profileClose}>
                  ×
                </button>
              </div>
              <button style={profileButton} onClick={() => alert("My Profile clicked")}>
                My Profile
              </button>
              <button style={profileButton} onClick={() => alert("My Reports clicked")}>
                My Reports
              </button>
              <button style={profileButton} onClick={() => alert("Logged Out")}>
                Log Out
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Dashboard Content */}
      <main style={{ padding: 24 }}>
        <h2>Manufacturing Orders</h2>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Reference</th>
              <th style={styles.th}>Finished Product</th>
              <th style={styles.th}>Quantity</th>
              <th style={styles.th}>Unit</th>
              <th style={styles.th}>State</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: "center", padding: 12 }}>
                  No orders available
                </td>
              </tr>
            ) : (
              orders.map((order, idx) => (
                <tr key={idx}>
                  <td style={styles.td}>{order.reference || "-"}</td>
                  <td style={styles.td}>{order.finishedProduct || "-"}</td>
                  <td style={styles.td}>{order.quantity || "-"}</td>
                  <td style={styles.td}>{order.unit || "-"}</td>
                  <td style={styles.td}>{order.state || "-"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <h2 style={{ marginTop: 40 }}>Work Centers</h2>
        <div style={{ marginBottom: 12 }}>
          <input
            type="text"
            placeholder="Search work centers"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ padding: 8, marginRight: 8 }}
          />
          <input
            type="text"
            placeholder="Center name"
            value={newCenter.name}
            onChange={(e) => setNewCenter({ ...newCenter, name: e.target.value })}
            style={{ padding: 8, marginRight: 8 }}
          />
          <input
            type="number"
            placeholder="Cost per hour"
            value={newCenter.costPerHour}
            onChange={(e) => setNewCenter({ ...newCenter, costPerHour: e.target.value })}
            style={{ padding: 8, marginRight: 8 }}
          />
          <button style={styles.newButton} onClick={addWorkCenter}>
            Add
          </button>
        </div>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Name</th>
              <th style={styles.th}>Cost per Hour</th>
              <th style={styles.th}>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredCenters.length === 0 ? (
              <tr>
                <td colSpan={3} style={{ textAlign: "center", padding: 12 }}>
                  No work centers found
                </td>
              </tr>
            ) : (
              filteredCenters.map((wc, idx) => (
                <tr key={idx}>
                  <td style={styles.td}>{wc.name}</td>
                  <td style={styles.td}>{wc.costPerHour}</td>
                  <td style={styles.td}>
                    <button onClick={() => deleteWorkCenter(idx)} style={{ color: "red", cursor: "pointer" }}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </main>
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
const burgerButton = { background: "none", border: "none", fontSize: 26, marginRight: 16, cursor: "pointer", color: "#34495e", padding: "4px 8px", borderRadius: 6 };
const headerCenter = { flex: "1 1 auto", display: "flex", alignItems: "center", justifyContent: "center" };
const appTitle = { fontWeight: 700, fontSize: 22, color: "#183153", letterSpacing: 0.5 };
const headerRight = { flex: "0 0 auto", display: "flex", alignItems: "center", position: "relative" };

// --- Profile drawer styles ---
const profileDrawer = {
  position: "absolute",
  top: 56,
  right: 0,
  width: 240,
  background: "#fff",
  boxShadow: "0 4px 32px rgba(30,48,110,0.12)",
  border: "1.5px solid #e8eaf1",
  borderRadius: 12,
  zIndex: 1500,
  display: "flex",
  flexDirection: "column",
};
const profileHeader = { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderBottom: "1px solid #f0f1f3", fontWeight: 700, fontSize: 18 };
const profileClose = { background: "none", border: "none", fontSize: 22, cursor: "pointer" };
const profileButton = { background: "none", border: "none", width: "100%", textAlign: "left", padding: "18px 16px", fontSize: 16, cursor: "pointer", borderBottom: "1px solid #f0f1f8" };
