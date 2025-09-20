import React, { useState, useEffect } from "react";
import { styles } from "../DashboardStyles"; // existing industrial-standard styles
import ManufacturingOrderPage from "./ManufacturingOrderPage";

export default function DashboardPage() {
  const [view, setView] = useState("dashboard"); // dashboard | mo | workcenter
  const [orders, setOrders] = useState([]);
  const [workCenters, setWorkCenters] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [newCenter, setNewCenter] = useState({ name: "", costPerHour: "" });

  // Load persisted data
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

  // ----- Work Center Functions -----
  const addWorkCenter = () => {
    if (!newCenter.name || !newCenter.costPerHour) return;
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

  // ----- Render Views -----
  if (view === "mo") {
    return <ManufacturingOrderPage onBack={() => setView("dashboard")} />;
  }

  if (view === "workcenter") {
    return (
      <div style={styles.pageContainer}>
        {/* Header */}
        <header style={styles.header}>
          <div style={styles.headerCenter}>
            <img src="src/components/Logo.png" alt="Logo" style={styles.logo} />
            <img
              src="src/components/nameimage.jpeg"
              alt="Company"
              style={styles.appNameImage}
            />
          </div>
        </header>

        {/* Top Bar */}
        <nav style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
          <button
            style={styles.newButton}
            onClick={addWorkCenter}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#2980b9")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#3498db")}
          >
            New
          </button>

          <span style={styles.navTitle}>Work Center</span>

          <input
            type="text"
            placeholder="Search..."
            style={styles.searchInput}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <button style={styles.buttonSecondary} onClick={() => setView("dashboard")}>
            Back
          </button>
        </nav>

        {/* Work Center Inputs */}
        <div style={{ display: "flex", gap: "10px", marginBottom: "15px", flexWrap: "wrap" }}>
          <input
            style={styles.input}
            placeholder="Work Center Name"
            value={newCenter.name}
            onChange={(e) => setNewCenter({ ...newCenter, name: e.target.value })}
          />
          <input
            style={styles.inputSmall}
            type="number"
            placeholder="Cost per Hour"
            value={newCenter.costPerHour}
            onChange={(e) => setNewCenter({ ...newCenter, costPerHour: e.target.value })}
          />
        </div>

        {/* Table */}
        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Work Center</th>
                <th style={styles.th}>Cost per Hour</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCenters.length === 0 ? (
                <tr>
                  <td colSpan={3} style={{ textAlign: "center", padding: "15px" }}>
                    No work centers found.
                  </td>
                </tr>
              ) : (
                filteredCenters.map((wc, idx) => (
                  <tr key={idx}>
                    <td style={styles.td}>{wc.name}</td>
                    <td style={styles.td}>{wc.costPerHour}</td>
                    <td style={styles.td}>
                      <button style={styles.buttonSecondary} onClick={() => deleteWorkCenter(idx)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // ----- Default Dashboard View -----
  return (
    <div style={styles.pageContainer}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerCenter}>
          <img src="src/components/Logo.png" alt="Logo" style={styles.logo} />
          <img src="src/components/nameimage.jpeg" alt="Company" style={styles.appNameImage} />
        </div>
      </header>

      {/* Navigation Bar */}
      <nav style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
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
                  <td style={styles.td}>{order.startDate}</td>
                  <td style={styles.td}>{order.finishedProduct}</td>
                  <td style={styles.td}>{order.componentStatus}</td>
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
