import React, { useState, useEffect } from "react";
import { styles } from "../DashboardStyles";

export default function StockLedgerPage() {
  const [products, setProducts] = useState([]);
  const [editingIndex, setEditingIndex] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

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

  const saveData = (updated) => {
    setProducts(updated);
    localStorage.setItem("stockLedger", JSON.stringify(updated));
  };

  const handleNew = () => {
    setFormData({
      product: "",
      unitCost: "",
      unit: "",
      onHand: "",
      freeToUse: "",
      incoming: "",
      outgoing: "",
    });
    setEditingIndex(products.length);
  };

  const handleSave = () => {
    const updated = [...products];
    updated[editingIndex] = formData;
    saveData(updated);
    setEditingIndex(null);
  };

  const handleEdit = (index) => {
    setFormData(products[index]);
    setEditingIndex(index);
  };

  const handleDelete = (index) => {
    const updated = [...products];
    updated.splice(index, 1);
    saveData(updated);
  };

  const filtered = products.filter(
    (p) =>
      p.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.unit && p.unit.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div style={{ padding: 24 }}>
      {/* Top Bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <button style={styles.newButton} onClick={handleNew}>New</button>
        <h2>Stock Ledger</h2>
        <input
          type="text"
          placeholder="Search Product or Unit"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ padding: 8, borderRadius: 6, border: "1px solid #ccc" }}
        />
      </div>

      {/* Table */}
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
            <th style={styles.th}>Action</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((p, idx) => (
            <tr key={idx} style={editingIndex === idx ? { background: "#f0f6ff" } : {}}>
              <td style={styles.td}>{p.product}</td>
              <td style={styles.td}>{p.unitCost}</td>
              <td style={styles.td}>{p.unit}</td>
              <td style={styles.td}>{(p.unitCost * p.onHand).toFixed(2)}</td>
              <td style={styles.td}>{p.onHand}</td>
              <td style={styles.td}>{p.freeToUse}</td>
              <td style={styles.td}>{p.incoming}</td>
              <td style={styles.td}>{p.outgoing}</td>
              <td style={styles.td}>
                <button onClick={() => handleEdit(idx)} style={{ marginRight: 6 }}>Edit</button>
                <button onClick={() => handleDelete(idx)} style={{ color: "red" }}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Form */}
      {editingIndex !== null && (
        <div style={{ marginTop: 24, padding: 16, border: "1px solid #eaeaea", borderRadius: 8, background: "#fff" }}>
          <div style={{ marginBottom: 12, display: "flex", justifyContent: "space-between" }}>
            <button onClick={() => setEditingIndex(null)}>Back</button>
            <button onClick={handleSave}>Save</button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
            <input
              placeholder="Product"
              value={formData.product}
              onChange={(e) => setFormData({ ...formData, product: e.target.value })}
            />
            <input
              type="number"
              placeholder="Unit Cost"
              value={formData.unitCost}
              onChange={(e) => setFormData({ ...formData, unitCost: parseFloat(e.target.value) })}
            />
            <input
              placeholder="Unit"
              value={formData.unit}
              onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
            />
            <input
              type="number"
              placeholder="On Hand"
              value={formData.onHand}
              onChange={(e) => setFormData({ ...formData, onHand: parseFloat(e.target.value) })}
            />
            <input
              type="number"
              placeholder="Free to Use"
              value={formData.freeToUse}
              onChange={(e) => setFormData({ ...formData, freeToUse: parseFloat(e.target.value) })}
            />
            <input
              type="number"
              placeholder="Incoming"
              value={formData.incoming}
              onChange={(e) => setFormData({ ...formData, incoming: parseFloat(e.target.value) })}
            />
            <input
              type="number"
              placeholder="Outgoing"
              value={formData.outgoing}
              onChange={(e) => setFormData({ ...formData, outgoing: parseFloat(e.target.value) })}
            />
            <input
              placeholder="Total Value"
              value={(formData.unitCost * formData.onHand).toFixed(2)}
              readOnly
              style={{ background: "#f2f5fa" }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
