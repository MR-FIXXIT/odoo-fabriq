import React, { useState, useEffect } from "react";
import PageTemplate from "../components/PageTemplate";
import { useLocation, useNavigate } from "react-router-dom";

export default function BillsOfMaterialsPage({ onBack }) {
  const [boms, setBoms] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({ finishedProduct: "", reference: "", quantity: "", unit: "" });

  const location = useLocation();
  const navigate = useNavigate();
  const isCreate = (location.pathname || "").endsWith("/new");

  useEffect(() => {
    const storedBoms = JSON.parse(localStorage.getItem("boms")) || [];
    setBoms(storedBoms);
  }, []);

  const filteredBoms = boms.filter((bom) =>
    (bom.finishedProduct || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    { label: "Finished Product", accessor: "finishedProduct", align: "left" },
    { label: "Reference", accessor: "reference", align: "center" },
  ];

  const saveBOM = () => {
    const updated = [...boms, formData];
    setBoms(updated);
    localStorage.setItem("boms", JSON.stringify(updated));
    setFormData({ finishedProduct: "", reference: "", quantity: "", unit: "" });
    navigate("/boms");
  };

  const createForm = (
    <div style={{ marginBottom: 24, border: "1px solid #e0e0e0", padding: 16, borderRadius: 8 }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        <input
          type="text"
          placeholder="Finished Product"
          value={formData.finishedProduct}
          onChange={(e) => setFormData({ ...formData, finishedProduct: e.target.value })}
          style={{ padding: 6, minWidth: 200 }}
        />
        <input
          type="text"
          placeholder="Reference"
          maxLength={8}
          value={formData.reference}
          onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
          style={{ padding: 6, minWidth: 160 }}
        />
        <input
          type="number"
          placeholder="Quantity"
          value={formData.quantity}
          onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
          style={{ padding: 6, minWidth: 120 }}
        />
        <input
          type="text"
          placeholder="Unit"
          value={formData.unit}
          onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
          style={{ padding: 6, minWidth: 120 }}
        />
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={saveBOM}
            style={{ padding: "8px 14px", backgroundColor: "#1976d2", color: "#fff", border: "none", borderRadius: 6 }}
          >
            Save
          </button>
          <button
            onClick={() => navigate("/boms")}
            style={{ padding: "8px 14px", backgroundColor: "#ecf0f1", color: "#2c3e50", border: "none", borderRadius: 6 }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <PageTemplate
      title={isCreate ? "Create BOM" : "Bills of Materials"}
      sidebarItems={[
        { label: "Dashboard", onClick: () => onBack && onBack() },
        { label: "Bills of Materials", active: true },
      ]}
      {...(!isCreate ? { newTo: "/boms/new", newLabel: "New" } : {})}
      {...(!isCreate ? { searchValue: searchTerm, onSearch: (val) => setSearchTerm(val), searchPlaceholder: "Search Finished Product" } : {})}
      columns={!isCreate ? columns : []}
      rows={!isCreate ? filteredBoms : []}
      rowKey={(row, idx) => (row.reference || "ref") + "-" + idx}
      emptyMessage="No BOMs found."
      beforeContent={isCreate ? createForm : null}
    />
  );
}
