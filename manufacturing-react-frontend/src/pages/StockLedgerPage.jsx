import React, { useState, useEffect, useMemo } from "react";
import PageTemplate from "../components/PageTemplate";
import { useLocation, useNavigate } from "react-router-dom";
import { listProducts } from "../api/products";

export default function StockLedgerPage({ onBack }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
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
    if (isCreate) return; // skip fetch during create mode
    let active = true;
    setLoading(true);
    setError("");
    listProducts()
      .then((data) => {
        if (!active) return;
        const items = Array.isArray(data?.results) ? data.results : Array.isArray(data) ? data : [];
        setProducts(items);
      })
      .catch((err) => {
        console.error("Failed to load products", err);
        if (!active) return;
        setError(err?.response?.data?.detail || err?.message || "Failed to load products");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [isCreate]);

  const rows = useMemo(() => {
    // Map backend product objects into the ledger row shape with safe fallbacks
    const mapped = products.map((p) => ({
      product: p?.name ?? p?.product ?? p?.display_name ?? p?.code ?? "",
      unitCost: p?.unit_cost ?? p?.cost ?? p?.standard_price ?? "",
      unit: p?.unit ?? p?.uom ?? p?.unit_of_measure ?? p?.uom_name ?? "",
      onHand: p?.on_hand ?? p?.qty_available ?? "",
      freeToUse: p?.free_to_use ?? "",
      incoming: p?.incoming ?? "",
      outgoing: p?.outgoing ?? "",
    }));

    if (!searchTerm) return mapped;
    const q = searchTerm.toLowerCase();
    return mapped.filter((r) =>
      String(r.product).toLowerCase().includes(q) ||
      String(r.unit).toLowerCase().includes(q)
    );
  }, [products, searchTerm]);

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
            onClick={() => { /* creating via backend not defined yet; keep placeholder */ navigate("/stockledger"); }}
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

  // Optional banners for loading/error in list mode
  const listBanners = (!isCreate) ? (
    <div style={{ marginBottom: 12 }}>
      {loading && <div style={{ padding: 8, background: "#f7f8fa", border: "1px solid #e0e0e0", borderRadius: 6 }}>Loading products…</div>}
      {error && <div style={{ padding: 8, background: "#ffecec", color: "#b00020", border: "1px solid #ffcdd2", borderRadius: 6 }}>{error}</div>}
    </div>
  ) : null;

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
      rows={!isCreate ? rows : []}
      rowKey={(row, idx) => (row.product || "row") + "-" + idx}
      emptyMessage={loading ? "" : "No products found."}
      beforeContent={isCreate ? createForm : listBanners}
    />
  );
}
