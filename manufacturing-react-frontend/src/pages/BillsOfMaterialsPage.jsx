import React, { useState, useEffect } from "react";
import { styles } from "../DashboardStyles";

export default function BillsOfMaterialsPage({ onBack }) {
  const [boms, setBoms] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ finishedProduct: "", reference: "", quantity: "", unit: "" });

  useEffect(() => {
    const storedBoms = JSON.parse(localStorage.getItem("boms")) || [];
    setBoms(storedBoms);
  }, []);

  const saveBOM = () => {
    const updated = [...boms, formData];
    setBoms(updated);
    localStorage.setItem("boms", JSON.stringify(updated));
    setFormData({ finishedProduct: "", reference: "", quantity: "", unit: "" });
    setShowForm(false);
  };

  const filteredBoms = boms.filter((bom) =>
    bom.finishedProduct.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ padding: 24 }}>
      {/* Back + Add New + Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={onBack}
            style={{
              padding: "6px 12px",
              borderRadius: 6,
              border: "none",
              cursor: "pointer",
              backgroundColor: "#1976d2",
              color: "#fff",
            }}
          >
            ← Back
          </button>
          <button
            onClick={() => setShowForm(true)}
            style={{
              padding: "6px 12px",
              borderRadius: 6,
              border: "none",
              cursor: "pointer",
              backgroundColor: "#4caf50",
              color: "#fff",
            }}
          >
            + Add New
          </button>
        </div>

        <h2 style={{ textAlign: "center", flex: 1 }}>Bills of Materials</h2>
        <input
          type="text"
          placeholder="Search Finished Product"
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
            placeholder="Finished Product"
            value={formData.finishedProduct}
            onChange={(e) => setFormData({ ...formData, finishedProduct: e.target.value })}
            style={{ marginRight: 8, padding: 6 }}
          />
          <input
            type="text"
            placeholder="Reference"
            maxLength={8}
            value={formData.reference}
            onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
            style={{ marginRight: 8, padding: 6 }}
          />
          <input
            type="number"
            placeholder="Quantity"
            value={formData.quantity}
            onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
            style={{ marginRight: 8, padding: 6 }}
          />
          <input
            type="text"
            placeholder="Unit"
            value={formData.unit}
            onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
            style={{ marginRight: 8, padding: 6 }}
          />
          <button
            onClick={saveBOM}
            style={{ padding: "6px 12px", backgroundColor: "#1976d2", color: "#fff", border: "none", borderRadius: 6 }}
          >
            Save
          </button>
        </div>
      )}

      {/* BOM Table */}
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>Finished Product</th>
            <th style={styles.th}>Reference</th>
          </tr>
        </thead>
        <tbody>
          {filteredBoms.length === 0 ? (
            <tr>
              <td colSpan={2} style={{ textAlign: "center", padding: 12 }}>
                No BOMs found.
              </td>
            </tr>
          ) : (
            filteredBoms.map((bom, idx) => (
              <tr key={idx}>
                <td style={styles.td}>{bom.finishedProduct}</td>
                <td style={styles.td}>{bom.reference}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
