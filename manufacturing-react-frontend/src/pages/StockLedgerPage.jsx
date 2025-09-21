import React, { useState, useEffect } from "react";
import PageTemplate from "../components/PageTemplate";
import { useLocation, useNavigate } from "react-router-dom";

export default function StockLedgerPage({ onBack }) {
  const [products, setProducts] = useState([]);
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

  const location = useLocation();
  const navigate = useNavigate();
  const isCreate = (location.pathname || "").endsWith("/new");

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("stockLedger")) || [];
    setProducts(stored);
  }, []);

  const saveProduct = () => {
    const updated = [...products, formData];
    setProducts(updated);
    localStorage.setItem("stockLedger", JSON.stringify(updated));
    setFormData({ product: "", unitCost: "", unit: "", onHand: "", freeToUse: "", incoming: "", outgoing: "" });
    // After save, navigate back to listing
    navigate("/stockledger");
  };

  const filteredProducts = products.filter((p) =>
    (p.product || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.unit || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const calcTotalValue = (unitCost, onHand) => {
    const uc = parseFloat(unitCost) || 0;
    const oh = parseFloat(onHand) || 0;
    return (uc * oh).toFixed(2);
  };

  const columns = [
    { label: "Product", accessor: "product", align: "left" },
    { label: "Unit Cost", accessor: (row) => row.unitCost, align: "right" },
    { label: "Unit", accessor: "unit", align: "center" },
    { label: "Total Value", accessor: (row) => calcTotalValue(row.unitCost, row.onHand), align: "right" },
    { label: "On Hand", accessor: "onHand", align: "right" },
    { label: "Free to Use", accessor: "freeToUse", align: "right" },
    { label: "Incoming", accessor: "incoming", align: "right" },
    { label: "Outgoing", accessor: "outgoing", align: "right" },
  ];

  const createForm = (
    <div style={{ marginBottom: 24, border: "1px solid #e0e0e0", padding: 16, borderRadius: 8 }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        <input
          type="text"
          placeholder="Product"
          value={formData.product}
          onChange={(e) => setFormData({ ...formData, product: e.target.value })}
          style={{ padding: 6, minWidth: 160 }}
        />
        <input
          type="number"
          placeholder="Unit Cost"
          value={formData.unitCost}
          onChange={(e) => setFormData({ ...formData, unitCost: e.target.value })}
          style={{ padding: 6, minWidth: 140 }}
        />
        <input
          type="text"
          placeholder="Unit"
          value={formData.unit}
          onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
          style={{ padding: 6, minWidth: 120 }}
        />
        <input
          type="number"
          placeholder="On Hand"
          value={formData.onHand}
          onChange={(e) => setFormData({ ...formData, onHand: e.target.value })}
          style={{ padding: 6, minWidth: 120 }}
        />
        <input
          type="number"
          placeholder="Free to Use"
          value={formData.freeToUse}
          onChange={(e) => setFormData({ ...formData, freeToUse: e.target.value })}
          style={{ padding: 6, minWidth: 140 }}
        />
        <input
          type="number"
          placeholder="Incoming"
          value={formData.incoming}
          onChange={(e) => setFormData({ ...formData, incoming: e.target.value })}
          style={{ padding: 6, minWidth: 120 }}
        />
        <input
          type="number"
          placeholder="Outgoing"
          value={formData.outgoing}
          onChange={(e) => setFormData({ ...formData, outgoing: e.target.value })}
          style={{ padding: 6, minWidth: 120 }}
        />
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={saveProduct}
            style={{ padding: "8px 14px", backgroundColor: "#1976d2", color: "#fff", border: "none", borderRadius: 6 }}
          >
            Save
          </button>
          <button
            onClick={() => navigate("/stockledger")}
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
      title={isCreate ? "Create Stock Item" : "Stock Ledger"}
      sidebarItems={[
        { label: "Dashboard", onClick: () => onBack && onBack() },
        { label: "Stock Ledger", active: true },
      ]}
      {...(!isCreate ? { newTo: "/stockledger/new", newLabel: "New" } : {})}
      {...(!isCreate ? { searchValue: searchTerm, onSearch: (val) => setSearchTerm(val), searchPlaceholder: "Search Product / Unit" } : {})}
      columns={!isCreate ? columns : []}
      rows={!isCreate ? filteredProducts : []}
      rowKey={(row, idx) => row.product + "-" + idx}
      emptyMessage="No products found."
      beforeContent={isCreate ? createForm : null}
    />
  );
}
