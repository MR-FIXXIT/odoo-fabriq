import React, { useState, useEffect } from "react";

// Styles
const pageStyles = {
  background: "#212a36",
  color: "#fff",
  minHeight: "100vh",
  padding: 24,
  fontFamily: "Arial, sans-serif",
};
const kpiCard = {
  background: "#283040",
  padding: 20,
  borderRadius: 8,
  flex: 1,
  margin: 8,
  boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
  transition: "transform 0.2s",
};
const kpiNumber = { fontSize: 28, fontWeight: "bold", marginBottom: 4 };
const kpiText = { fontSize: 14, color: "#aaa" };
const barChartContainer = { background: "#283040", borderRadius: 8, padding: 16, marginTop: 24 };
const bar = { height: 20, borderRadius: 4, marginBottom: 6 };

// Status colors
const statusColors = {
  Draft: "#f78a1d",
  Confirmed: "#00cfff",
  "In-Progress": "#147efb",
  "To Close": "#1976d2",
  "Not Assigned": "#f78a1d",
  Late: "#ff4d4f",
};

export default function AnalysisPage() {
  const [orders, setOrders] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [timeFilter, setTimeFilter] = useState("7d");
  const [filteredOrders, setFilteredOrders] = useState([]);

  // Load data from localStorage
  useEffect(() => {
    const storedOrders = JSON.parse(localStorage.getItem("orders")) || [];
    const storedTasks = JSON.parse(localStorage.getItem("tasks")) || [];
    setOrders(storedOrders);
    setTasks(storedTasks);
  }, []);

  // Filter orders by time
  useEffect(() => {
    let filtered = [...orders];
    if (timeFilter === "7d") {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      filtered = filtered.filter((o) => new Date(o.startDate) >= sevenDaysAgo);
    } else if (timeFilter === "30d") {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      filtered = filtered.filter((o) => new Date(o.startDate) >= thirtyDaysAgo);
    }
    setFilteredOrders(filtered);
  }, [orders, timeFilter]);

  // KPIs
  const totalOrders = filteredOrders.length;
  const completedOrders = filteredOrders.filter((o) => o.state === "Confirmed" || o.state === "To Close").length;
  const unitsProduced = filteredOrders.reduce((sum, o) => sum + Number(o.quantity || 0), 0);
  const onTimeRate = totalOrders ? ((completedOrders / totalOrders) * 100).toFixed(1) + "%" : "0%";
  const avgLeadTime = filteredOrders.length
    ? (
        filteredOrders.reduce((sum, o) => {
          const start = new Date(o.startDate);
          const end = new Date();
          return sum + (end - start) / (1000 * 60 * 60 * 24);
        }, 0) / filteredOrders.length
      ).toFixed(1) + "d"
    : "0d";

  // Production Volume
  const productionVolume = filteredOrders.map((o) => ({ day: o.startDate, value: Number(o.quantity || 0) }));

  // Live Order Status
  const orderStatusMap = {};
  filteredOrders.forEach((o) => {
    const key = o.state || "Draft";
    orderStatusMap[key] = (orderStatusMap[key] || 0) + 1;
  });

  // Problem Orders: Late or Not Assigned
  const problemOrders = filteredOrders.filter((o) => o.state === "Late" || o.state === "Not Assigned");

  // Top Products
  const productMap = {};
  filteredOrders.forEach((o) => {
    productMap[o.finishedProduct] = (productMap[o.finishedProduct] || 0) + Number(o.quantity || 0);
  });
  const topProducts = Object.entries(productMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([product, units]) => ({ product, units }));

  return (
    <div style={pageStyles}>
      <h2>Analysis Dashboard</h2>

      {/* Time Filter */}
      <div style={{ marginTop: 16, display: "flex", gap: 12 }}>
        {["7d", "30d", "custom"].map((tf) => (
          <button
            key={tf}
            style={{
              padding: "6px 14px",
              borderRadius: 20,
              border: "none",
              background: timeFilter === tf ? "#147efb" : "#283040",
              color: "#fff",
              cursor: "pointer",
            }}
            onClick={() => setTimeFilter(tf)}
          >
            {tf === "7d" ? "Last 7 Days" : tf === "30d" ? "Last 30 Days" : "Custom Range"}
          </button>
        ))}
      </div>

      {/* KPI Cards */}
      <div style={{ display: "flex", marginTop: 24 }}>
        <div style={kpiCard}>
          <div style={kpiNumber}>{completedOrders}</div>
          <div style={kpiText}>Orders Completed</div>
        </div>
        <div style={kpiCard}>
          <div style={kpiNumber}>{unitsProduced}</div>
          <div style={kpiText}>Units Produced</div>
        </div>
        <div style={kpiCard}>
          <div style={kpiNumber}>{onTimeRate}</div>
          <div style={kpiText}>On-Time Rate</div>
        </div>
        <div style={kpiCard}>
          <div style={kpiNumber}>{avgLeadTime}</div>
          <div style={kpiText}>Avg Lead Time</div>
        </div>
      </div>

      {/* Production Volume */}
      <div style={barChartContainer}>
        <h4>Production Volume</h4>
        {productionVolume.map((item, idx) => (
          <div key={idx}>
            <div style={{ marginBottom: 2 }}>{new Date(item.day).toLocaleDateString()}</div>
            <div style={{ ...bar, width: `${Math.min(item.value, 300) / 3}%`, background: "#147efb" }}></div>
          </div>
        ))}
      </div>

      {/* Live Order Status */}
      <div style={{ marginTop: 24, background: "#283040", padding: 16, borderRadius: 8 }}>
        <h4>Live Order Status</h4>
        <div style={{ display: "flex", gap: 16, marginTop: 12 }}>
          {Object.entries(orderStatusMap).map(([status, count], idx) => (
            <div key={idx} style={{ flex: count }}>
              <div
                style={{
                  height: 100,
                  borderRadius: "50%",
                  background: statusColors[status] || "#ccc",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: "bold",
                }}
                title={`${status}: ${count}`}
              >
                {count}
              </div>
              <div style={{ textAlign: "center", marginTop: 8 }}>{status}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Problem Orders */}
      <div style={{ marginTop: 24, background: "#2c3544", padding: 16, borderRadius: 8 }}>
        <h4>Problem Orders</h4>
        <table style={{ width: "100%", color: "#fff", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left", borderBottom: "1px solid #555" }}>Reference</th>
              <th style={{ textAlign: "left", borderBottom: "1px solid #555" }}>Product</th>
              <th style={{ textAlign: "left", borderBottom: "1px solid #555" }}>State</th>
            </tr>
          </thead>
          <tbody>
            {problemOrders.length === 0 ? (
              <tr>
                <td colSpan={3} style={{ textAlign: "center", padding: 12 }}>
                  No problem orders.
                </td>
              </tr>
            ) : problemOrders.map((po, idx) => (
              <tr key={idx} style={{ borderBottom: "1px solid #555" }}>
                <td>{po.reference}</td>
                <td>{po.finishedProduct}</td>
                <td>{po.state}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Top Products */}
      <div style={{ marginTop: 24, background: "#2c3544", padding: 16, borderRadius: 8 }}>
        <h4>Top Products</h4>
        <table style={{ width: "100%", color: "#fff", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left", borderBottom: "1px solid #555" }}>Product</th>
              <th style={{ textAlign: "left", borderBottom: "1px solid #555" }}>Units Produced</th>
            </tr>
          </thead>
          <tbody>
            {topProducts.length === 0 ? (
              <tr>
                <td colSpan={2} style={{ textAlign: "center", padding: 12 }}>
                  No products yet.
                </td>
              </tr>
            ) : topProducts.map((tp, idx) => (
              <tr key={idx} style={{ borderBottom: "1px solid #555" }}>
                <td>{tp.product}</td>
                <td>{tp.units}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}