import React, { useState } from "react";
import { styles } from "../DashboardStyles";

export default function ManufacturingOrderPage({ orderData, onBack, onSave }) {
  const [order, setOrder] = useState(orderData || {});
  const [components, setComponents] = useState(orderData?.components || []);
  const [workOrders, setWorkOrders] = useState(orderData?.workOrders || []);

  // Handle order form fields
  const handleChange = (field, value) => {
    setOrder((prev) => ({ ...prev, [field]: value }));
  };

  // Handle adding/removing rows
  const addComponent = () => setComponents((prev) => [...prev, { id: Date.now(), name: "", qty: 0 }]);
  const removeComponent = (id) => setComponents((prev) => prev.filter((c) => c.id !== id));
  const updateComponent = (id, field, value) => {
    setComponents((prev) => prev.map((c) => c.id === id ? { ...c, [field]: value } : c));
  };

  const addWorkOrder = () => setWorkOrders((prev) => [...prev, { id: Date.now(), task: "", duration: 0 }]);
  const removeWorkOrder = (id) => setWorkOrders((prev) => prev.filter((w) => w.id !== id));
  const updateWorkOrder = (id, field, value) => {
    setWorkOrders((prev) => prev.map((w) => w.id === id ? { ...w, [field]: value } : w));
  };

  // Total calculations
  const totalComponentQty = components.reduce((sum, c) => sum + Number(c.qty || 0), 0);
  const totalWorkDuration = workOrders.reduce((sum, w) => sum + Number(w.duration || 0), 0);

  const handleSave = () => {
    if (!order.reference || !order.finishedProduct) {
      alert("Reference and Finished Product are required!");
      return;
    }
    onSave({ ...order, components, workOrders });
  };

  return (
    <div style={styles.pageContainer}>
      {/* Buttons */}
      <div style={{ marginBottom: "20px" }}>
        <button style={styles.buttonSecondary} onClick={onBack}>Back</button>
        <button style={styles.buttonPrimary} onClick={handleSave}>Save</button>
      </div>

      <h2>Manufacturing Order</h2>

      {/* Order Form */}
      <div style={styles.formGroup}>
        <label>Reference:</label>
        <input type="text" value={order.reference || ""} onChange={(e) => handleChange("reference", e.target.value)} style={styles.input} />
      </div>

      <div style={styles.formGroup}>
        <label>Finished Product:</label>
        <input type="text" value={order.finishedProduct || ""} onChange={(e) => handleChange("finishedProduct", e.target.value)} style={styles.input} />
      </div>

      <div style={styles.formGroup}>
        <label>Quantity:</label>
        <input type="number" value={order.quantity || ""} onChange={(e) => handleChange("quantity", e.target.value)} style={styles.input} />
      </div>

      <div style={styles.formGroup}>
        <label>Unit:</label>
        <input type="text" value={order.unit || ""} onChange={(e) => handleChange("unit", e.target.value)} style={styles.input} />
      </div>

      <div style={styles.formGroup}>
        <label>State:</label>
        <select value={order.state || "Draft"} onChange={(e) => handleChange("state", e.target.value)} style={styles.input}>
          {["Draft", "Confirmed", "In-Progress", "To Close", "Done", "Cancelled"].map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {/* Components Table */}
      <h3>Components</h3>
      <button style={styles.buttonSecondary} onClick={addComponent}>Add Component</button>
      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Name</th>
              <th style={styles.th}>Quantity</th>
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {components.map((c) => (
              <tr key={c.id}>
                <td style={styles.td}>
                  <input type="text" value={c.name} onChange={(e) => updateComponent(c.id, "name", e.target.value)} style={styles.input} />
                </td>
                <td style={styles.td}>
                  <input type="number" value={c.qty} onChange={(e) => updateComponent(c.id, "qty", e.target.value)} style={styles.input} />
                </td>
                <td style={styles.td}>
                  <button style={styles.buttonSecondary} onClick={() => removeComponent(c.id)}>Remove</button>
                </td>
              </tr>
            ))}
            <tr>
              <td style={styles.td}><strong>Total</strong></td>
              <td style={styles.td}>{totalComponentQty}</td>
              <td></td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Work Orders Table */}
      <h3>Work Orders</h3>
      <button style={styles.buttonSecondary} onClick={addWorkOrder}>Add Work Order</button>
      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Task</th>
              <th style={styles.th}>Duration (hrs)</th>
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {workOrders.map((w) => (
              <tr key={w.id}>
                <td style={styles.td}>
                  <input type="text" value={w.task} onChange={(e) => updateWorkOrder(w.id, "task", e.target.value)} style={styles.input} />
                </td>
                <td style={styles.td}>
                  <input type="number" value={w.duration} onChange={(e) => updateWorkOrder(w.id, "duration", e.target.value)} style={styles.input} />
                </td>
                <td style={styles.td}>
                  <button style={styles.buttonSecondary} onClick={() => removeWorkOrder(w.id)}>Remove</button>
                </td>
              </tr>
            ))}
            <tr>
              <td style={styles.td}><strong>Total</strong></td>
              <td style={styles.td}>{totalWorkDuration}</td>
              <td></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

