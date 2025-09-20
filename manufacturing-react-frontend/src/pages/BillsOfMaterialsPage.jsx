import React, { useState, useEffect } from "react";
import { styles } from "../DashboardStyles";

export default function BillsOfMaterialsPage({ onBack }) {
  const [boms, setBoms] = useState([]);
  const [viewForm, setViewForm] = useState(false);
  const [currentBOM, setCurrentBOM] = useState({
    finishedProduct: "",
    reference: "",
    quantity: "",
    unit: "",
    components: [],
    workOrders: [],
  });

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("boms")) || [];
    setBoms(stored);
  }, []);

  const saveBOMs = (updated) => {
    setBoms(updated);
    localStorage.setItem("boms", JSON.stringify(updated));
  };

  const handleAddBOM = () => {
    setCurrentBOM({ finishedProduct: "", reference: "", quantity: "", unit: "", components: [], workOrders: [] });
    setViewForm(true);
  };

  const handleSaveBOM = () => {
    const updated = [...boms, currentBOM];
    saveBOMs(updated);
    setViewForm(false);
  };

  const handleEditBOM = (index) => {
    setCurrentBOM(boms[index]);
    setViewForm(true);
  };

  // Components & Work Orders add/remove
  const addComponent = () => {
    setCurrentBOM({ ...currentBOM, components: [...currentBOM.components, { name: "", qty: "" }] });
  };
  const deleteComponent = (idx) => {
    const updated = currentBOM.components.filter((_, i) => i !== idx);
    setCurrentBOM({ ...currentBOM, components: updated });
  };
  const addWorkOrder = () => {
    setCurrentBOM({ ...currentBOM, workOrders: [...currentBOM.workOrders, { name: "", qty: "" }] });
  };
  const deleteWorkOrder = (idx) => {
    const updated = currentBOM.workOrders.filter((_, i) => i !== idx);
    setCurrentBOM({ ...currentBOM, workOrders: updated });
  };

  if (viewForm) {
    return (
      <div style={{ padding: 24 }}>
        <div style={{ marginBottom: 12 }}>
          <button style={styles.newButton} onClick={() => setViewForm(false)}>
            ← Back
          </button>
          <button style={{ ...styles.newButton, marginLeft: 8 }} onClick={handleSaveBOM}>
            Save
          </button>
        </div>
        <h2>BOM Form</h2>
        <div style={{ marginBottom: 12 }}>
          <input placeholder="Finished Product" value={currentBOM.finishedProduct} onChange={(e) => setCurrentBOM({ ...currentBOM, finishedProduct: e.target.value })} style={{ padding: 8, marginRight: 8 }} />
          <input placeholder="Reference" maxLength={8} value={currentBOM.reference} onChange={(e) => setCurrentBOM({ ...currentBOM, reference: e.target.value })} style={{ padding: 8, marginRight: 8 }} />
          <input placeholder="Quantity" type="number" value={currentBOM.quantity} onChange={(e) => setCurrentBOM({ ...currentBOM, quantity: e.target.value })} style={{ padding: 8, marginRight: 8 }} />
          <input placeholder="Unit" value={currentBOM.unit} onChange={(e) => setCurrentBOM({ ...currentBOM, unit: e.target.value })} style={{ padding: 8 }} />
        </div>

        {/* Components */}
        <h3>Components</h3>
        <button style={styles.newButton} onClick={addComponent}>Add Component</button>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Name</th>
              <th style={styles.th}>Qty</th>
              <th style={styles.th}>Action</th>
            </tr>
          </thead>
          <tbody>
            {currentBOM.components.map((c, idx) => (
              <tr key={idx}>
                <td style={styles.td}><input value={c.name} onChange={(e) => { const updated = [...currentBOM.components]; updated[idx].name = e.target.value; setCurrentBOM({ ...currentBOM, components: updated }); }} /></td>
                <td style={styles.td}><input type="number" value={c.qty} onChange={(e) => { const updated = [...currentBOM.components]; updated[idx].qty = e.target.value; setCurrentBOM({ ...currentBOM, components: updated }); }} /></td>
                <td style={styles.td}><button onClick={() => deleteComponent(idx)} style={{ color: "red" }}>Delete</button></td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Work Orders */}
        <h3>Work Orders</h3>
        <button style={styles.newButton} onClick={addWorkOrder}>Add Work Order</button>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Name</th>
              <th style={styles.th}>Qty</th>
              <th style={styles.th}>Action</th>
            </tr>
          </thead>
          <tbody>
            {currentBOM.workOrders.map((w, idx) => (
              <tr key={idx}>
                <td style={styles.td}><input value={w.name} onChange={(e) => { const updated = [...currentBOM.workOrders]; updated[idx].name = e.target.value; setCurrentBOM({ ...currentBOM, workOrders: updated }); }} /></td>
                <td style={styles.td}><input type="number" value={w.qty} onChange={(e) => { const updated = [...currentBOM.workOrders]; updated[idx].qty = e.target.value; setCurrentBOM({ ...currentBOM, workOrders: updated }); }} /></td>
                <td style={styles.td}><button onClick={() => deleteWorkOrder(idx)} style={{ color: "red" }}>Delete</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // --- List View ---
  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
        <button style={styles.newButton} onClick={handleAddBOM}>New</button>
        <h2>Bills of Materials</h2>
        <input placeholder="Search Finished Product" style={{ padding: 6 }} />
      </div>

      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>Finished Product</th>
            <th style={styles.th}>Reference</th>
          </tr>
        </thead>
        <tbody>
          {boms.length === 0 ? (
            <tr><td colSpan={2} style={{ textAlign: "center", padding: 12 }}>No BOMs available.</td></tr>
          ) : (
            boms.map((b, idx) => (
              <tr key={idx} onClick={() => handleEditBOM(idx)} style={{ cursor: "pointer" }}>
                <td style={styles.td}>{b.finishedProduct}</td>
                <td style={styles.td}>{b.reference}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
