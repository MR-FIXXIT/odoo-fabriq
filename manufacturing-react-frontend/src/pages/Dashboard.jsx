import React from "react";

/* ---------- Sample Data ---------- */
const orders = [
  {
    reference: "AO-000001",
    startDate: "Tomorrow",
    finishedProduct: "Dining Table",
    componentStatus: "Not Available",
    quantity: 5,
    unit: "Units",
    state: "Confirmed",
  },
  {
    reference: "AO-000002",
    startDate: "Yesterday",
    finishedProduct: "Drawer",
    componentStatus: "Available",
    quantity: 2,
    unit: "Units",
    state: "In-Progress",
  },
];

/* ---------- Dashboard Page ---------- */
export default function DashboardPage() {
  return (
    <div style={styles.pageContainer}>
      
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={styles.hamburger}>☰</div>
        </div>
        <div style={styles.headerCenter}>
          <img src="/logo.png" alt="Company Logo" style={styles.logo} />
          <span style={styles.appName}>Fabriq</span>
        </div>
        <div style={styles.headerRight}>
          <div style={styles.avatar}>User Avatar</div>
        </div>
      </header>

      {/* Navigation Bar */}
      <nav style={styles.navBar}>
        <button style={styles.newButton}>New</button>
        <span style={styles.navTitle}>Manufacturing Order</span>
        <input
          type="text"
          placeholder="Search..."
          style={styles.searchInput}
        />
        <div style={styles.navIcons}>
          <button style={styles.iconButton}>☰</button>
          <button style={styles.iconButton}>▣</button>
        </div>
      </nav>

      {/* Tabs / Filters */}
      <div style={styles.tabRow}>
        <span style={styles.tabLabel}>All:</span>
        <span style={styles.tabItem}>2 Draft</span>
        <span style={styles.tabItem}>7 Confirmed</span>
        <span style={styles.tabItem}>1 In-Progress</span>
        <span style={styles.tabItem}>5 To Close</span>
        <span style={styles.tabItem}>11 Not Assigned</span>
        <span style={styles.tabItem}>11 Late</span>
      </div>
      <div style={styles.tabRow}>
        <span style={styles.tabLabel}>My:</span>
        <span style={styles.tabItem}>7 Confirmed</span>
        <span style={styles.tabItem}>1 In-Progress</span>
        <span style={styles.tabItem}>5 To Close</span>
        <span style={styles.tabItem}>8 Late</span>
      </div>

      {/* Table */}
      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th></th>
              <th>Reference</th>
              <th>Start Date</th>
              <th>Finished Product</th>
              <th>Component Status</th>
              <th>Quantity</th>
              <th>Unit</th>
              <th>State</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((row, idx) => (
              <tr key={idx}>
                <td>
                  <input type="checkbox" />
                </td>
                <td>{row.reference}</td>
                <td>{row.startDate}</td>
                <td>{row.finishedProduct}</td>
                <td>{row.componentStatus}</td>
                <td>{row.quantity.toFixed(2)}</td>
                <td>{row.unit}</td>
                <td>{row.state}</td>
              </tr>
            ))}
            {/* Empty Rows */}
            {[...Array(5)].map((_, i) => (
              <tr key={i + 100}>
                <td><input type="checkbox" /></td>
                <td colSpan={7}></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ---------- Styles ---------- */
const styles = {
  pageContainer: {
    fontFamily: "Roboto, sans-serif",
    backgroundColor: "#f5f6f8",
    minHeight: "100vh",
    padding: "20px",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#ffffff",
    padding: "10px 20px",
    borderRadius: "12px",
    boxShadow: "0 4px 10px rgba(0,0,0,0.08)",
    marginBottom: "20px",
  },
  headerLeft: { flex: 1 },
  headerCenter: {
    flex: 2,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
  },
  headerRight: { flex: 1, display: "flex", justifyContent: "flex-end" },
  hamburger: { fontSize: "24px", cursor: "pointer" },
  logo: { height: "40px", width: "40px" },
  appName: { fontSize: "20px", fontWeight: 600, color: "#34495E" },
  avatar: {
    backgroundColor: "#ecf0f1",
    padding: "6px 12px",
    borderRadius: "20px",
    fontSize: "14px",
  },
  navBar: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "10px",
  },
  newButton: {
    backgroundColor: "#3498db",
    color: "#fff",
    padding: "8px 16px",
    borderRadius: "8px",
    border: "none",
    cursor: "pointer",
  },
  navTitle: { fontWeight: 500, fontSize: "16px", marginLeft: "10px" },
  searchInput: {
    flex: 1,
    padding: "6px 12px",
    borderRadius: "8px",
    border: "1px solid #dcdde1",
  },
  navIcons: { display: "flex", gap: "5px" },
  iconButton: {
    border: "1px solid #dcdde1",
    backgroundColor: "#fff",
    padding: "6px 8px",
    borderRadius: "6px",
    cursor: "pointer",
  },
  tabRow: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "6px",
    flexWrap: "wrap",
  },
  tabLabel: { fontWeight: 600, fontSize: "14px", marginRight: "10px" },
  tabItem: {
    backgroundColor: "#ecf0f1",
    padding: "4px 10px",
    borderRadius: "12px",
    fontSize: "13px",
  },
  tableContainer: {
    backgroundColor: "#fff",
    borderRadius: "12px",
    boxShadow: "0 4px 10px rgba(0,0,0,0.08)",
    padding: "10px",
    overflowX: "auto",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "14px",
  },
};
