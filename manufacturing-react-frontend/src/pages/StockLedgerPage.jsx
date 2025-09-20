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
    p.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.unit.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ padding: 24 }}>
      {/* Back + Add New + Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={onBack}
            style={{ padding: "6px 12px", borderRadius: 6, border: "none", cursor: "pointer", backgroundColor: "#1976d2", color: "#fff" }}
          >
            ← Back
          </button>
          <button
            onClick={() => setShowForm(true)}
            style={{ padding: "6px 12px", borderRadius: 6, border: "none", cursor: "pointer", backgroundColor: "#4caf50", color: "#fff" }}
          >
            + Add New
          </button>
        </div>

        <h2 style={{ textAlign: "center", flex: 1 }}>Stock Ledger</h2>
        <input
          type="text"
          placeholder="Search Product / Unit"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ padding: 6, borderRadius: 4, border: "1px solid #ccc" }}
        />
      </div>

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
                <td style={styles.td}>{(p.unitCost * p.onHand).toFixed(2)}</td>
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
  );
}
