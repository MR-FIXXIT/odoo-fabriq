import React, { useState } from "react";
import ManufacturingOrderPage from "./ManufacturingOrderPage";
import { styles } from "../DashboardStyles";

export default function DashboardPage() {
  const [view, setView] = useState("dashboard"); // "dashboard" | "order"
  const [orders, setOrders] = useState([]); // dynamic orders
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [activeTab, setActiveTab] = useState("All");

  const handleNewOrder = () => {
    setSelectedOrder(null);
    setView("order");
  };

  const handleEditOrder = (order) => {
    setSelectedOrder(order);
    setView("order");
  };

  const handleBack = () => setView("dashboard");

  const handleSaveOrder = (order) => {
    if (selectedOrder) {
      // Update existing order
      setOrders((prev) => prev.map((o) => (o.id === selectedOrder.id ? order : o)));
    } else {
      // Add new order with unique id
      setOrders((prev) => [...prev, { ...order, id: Date.now() }]);
    }
    setView("dashboard");
  };

  // Filter orders by tab
  const filteredOrders = activeTab === "All" ? orders : orders.filter(o => o.state === activeTab);

  if (view === "order") {
    return (
      <ManufacturingOrderPage
        orderData={selectedOrder}
        onBack={handleBack}
        onSave={handleSaveOrder}
      />
    );
  }

  return (
    <div style={styles.pageContainer}>
      <header style={styles.header}>
        <div style={styles.headerCenter}>
          <img src="src/components/Logo.png" alt="App Logo" style={styles.logo} />
          <img src="src/components/nameimage.jpeg" alt="Company Name" style={styles.appNameImage} />
        </div>
      </header>

      {/* Navigation Bar */}
      <nav style={styles.navBar}>
        <button style={styles.newButton} onClick={handleNewOrder}>
          New
        </button>
        <span style={styles.navTitle}>Manufacturing Orders</span>
        <input type="text" placeholder="Search..." style={styles.searchInput} />
      </nav>

      {/* Tabs */}
      <div style={styles.tabRow}>
        {["All", "Draft", "Confirmed", "In-Progress", "To Close", "Done", "Cancelled"].map((tab) => (
          <span
            key={tab}
            style={{
              ...styles.tabItem,
              backgroundColor: activeTab === tab ? "#d0d7de" : "#ecf0f1",
              cursor: "pointer",
            }}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </span>
        ))}
      </div>

      {/* Orders Table */}
      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}></th>
              <th style={styles.th}>Reference</th>
              <th style={styles.th}>Finished Product</th>
              <th style={styles.th}>Quantity</th>
              <th style={styles.th}>Unit</th>
              <th style={styles.th}>State</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", padding: "20px", color: "#7f8c8d" }}>
                  No manufacturing orders available.
                </td>
              </tr>
            ) : (
              filteredOrders.map((order) => (
                <tr key={order.id} style={{ cursor: "pointer" }} onClick={() => handleEditOrder(order)}>
                  <td style={styles.td}>
                    <input type="checkbox" />
                  </td>
                  <td style={styles.td}>{order.reference}</td>
                  <td style={styles.td}>{order.finishedProduct}</td>
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
