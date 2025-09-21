import React, { useEffect, useState } from "react";
import api from "../lib/api";

/**
 * AnalyticsOverview fetches /api/analytics/overview/?days={n}
 * Expects Authorization Bearer token in localStorage as "access"
 *
 * Backend URL used:
 * GET /api/analytics/overview/?days=30
 *
 * Replace fetching auth method to match your app (cookies, context, redux, etc).
 */

function formatNumber(v) {
    if (v === null || v === undefined) return "-";
    const n = Number(v);
    if (Number.isNaN(n)) return String(v);
    return n.toLocaleString();
}

function smallPercent(v) {
    const n = Number(v) * 100;
    if (Number.isNaN(n)) return "-";
    return `${n.toFixed(1)}%`;
}

export function AnalyticsOverview() {
    const [days, setDays] = useState(30);
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        let mounted = true;
        setLoading(true);
        setError(null);

        api.get('/api/analytics/overview/', { params: { days } })
            .then((res) => {
                if (!mounted) return;
                // Expect JSON body
                setData(res.data || null);
            })
            .catch((err) => {
                if (!mounted) return;
                const msg = err?.response?.data?.detail || err?.response?.data || err?.message || "Failed to load analytics";
                setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
            })
            .finally(() => {
                if (mounted) setLoading(false);
            });

        return () => { mounted = false; };
    }, [days]);

    if (loading) return <div>Loading analytics...</div>;
    if (error) return <div style={{ color: "red" }}>Error: {error}</div>;
    if (!data) return null;

    // parse / normalize
    const mosCompleted = data.mos_completed ?? 0;
    const unitsProduced = data.units_produced ?? "0";
    const avgLead = data.avg_lead_time_hours ?? 0;
    const onTime = data.on_time_completion_rate ?? 0;

    const weekly = data.production_volume_by_week || [];
    const statusBreakdown = data.order_status_breakdown || {};
    const topProducts = data.top_products || [];
    const delayed = data.delayed_orders || [];
    const topRaw = data.top_raw_materials_by_qty || [];
    const topFinished = data.top_finished_products_by_qty || [];

    // status pie -> compute total
    const statusTotal = Object.values(statusBreakdown).reduce((s, v) => s + (v || 0), 0);

    return (
        <div style={{ fontFamily: "Arial, sans-serif", padding: 16 }}>
            <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h2>Production Overview ({days} days)</h2>
                <div>
                    <select value={days} onChange={(e) => setDays(Number(e.target.value))}>
                        <option value={7}>Last 7 days</option>
                        <option value={30}>Last 30 days</option>
                        <option value={90}>Last 90 days</option>
                        <option value={180}>Last 180 days</option>
                    </select>
                </div>
            </header>

            <section style={{ display: "flex", gap: 12, marginTop: 12, flexWrap: "wrap" }}>
                <Card title="Orders Completed" value={formatNumber(mosCompleted)} />
                <Card title="Units Produced" value={formatNumber(unitsProduced)} />
                <Card title="Avg Lead Time (hrs)" value={formatNumber(avgLead)} />
                <Card title="On-Time Rate" value={smallPercent(onTime)} />
            </section>

            <section style={{ display: "flex", gap: 16, marginTop: 20, flexWrap: "wrap" }}>
                <Panel style={{ flex: 1, minWidth: 360 }}>
                    <h3>Production Volume by Week</h3>
                    {weekly.length === 0 ? (
                        <div>No production data</div>
                    ) : (
                        <BarChart data={weekly} labelKey="week_start" valueKey="units" />
                    )}
                </Panel>

                <Panel style={{ width: 320 }}>
                    <h3>Order Status Breakdown</h3>
                    <div>
                        {Object.keys(statusBreakdown).length === 0 ? (
                            <div>No active orders</div>
                        ) : (
                            <ul style={{ listStyle: "none", padding: 0 }}>
                                {Object.entries(statusBreakdown).map(([k, v]) => {
                                    const pct = statusTotal ? ((v / statusTotal) * 100).toFixed(1) : "0.0";
                                    return (
                                        <li key={k} style={{ marginBottom: 8 }}>
                                            <strong>{k}</strong> — {v} ({pct}%)
                                            <div style={{ height: 8, background: "#eee", borderRadius: 4, marginTop: 6 }}>
                                                <div style={{ width: `${pct}%`, height: "100%", background: "#3b82f6", borderRadius: 4 }} />
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </div>
                </Panel>
            </section>

            <section style={{ display: "flex", gap: 16, marginTop: 20, alignItems: "flex-start", flexWrap: "wrap" }}>
                <Panel style={{ flex: 1, minWidth: 420 }}>
                    <h3>Top {topProducts.length} Produced Products</h3>
                    {topProducts.length === 0 ? (
                        <div>No products</div>
                    ) : (
                        <ol>
                            {topProducts.map((p) => (
                                <li key={p.product_id} style={{ marginBottom: 6 }}>
                                    <strong>{p.sku}</strong> — {p.name} — {formatNumber(p.units)} units
                                </li>
                            ))}
                        </ol>
                    )}
                </Panel>

                <Panel style={{ width: 420 }}>
                    <h3>Inventory Snapshot</h3>
                    <h4>Top Raw Materials</h4>
                    <SimpleTable rows={topRaw} columns={["sku", "name", "available_qty"]} />
                    <h4 style={{ marginTop: 8 }}>Top Finished</h4>
                    <SimpleTable rows={topFinished} columns={["sku", "name", "available_qty"]} />
                </Panel>
            </section>

            <section style={{ marginTop: 20 }}>
                <Panel>
                    <h3>Active Orders with Delays</h3>
                    {delayed.length === 0 ? (
                        <div>No delayed active orders</div>
                    ) : (
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                            <thead>
                            <tr>
                                <th style={th}>MO</th>
                                <th style={th}>Product</th>
                                <th style={th}>Qty</th>
                                <th style={th}>Due Date</th>
                                <th style={th}>Status</th>
                            </tr>
                            </thead>
                            <tbody>
                            {delayed.map((mo) => (
                                <tr key={mo.id}>
                                    <td style={td}>{mo.mo_number || mo.id}</td>
                                    <td style={td}>{mo.product_id}</td>
                                    <td style={td}>{mo.qty}</td>
                                    <td style={td}>{mo.due_date}</td>
                                    <td style={td}>{mo.status}</td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    )}
                </Panel>
            </section>
        </div>
    );
}

// Presentational helpers used by the analytics page
function Card({ title, value }) {
  return (
    <div style={{ background: "#fff", padding: 12, borderRadius: 8, boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
      <div style={{ color: "#666", fontSize: 13 }}>{title}</div>
      <div style={{ fontSize: 20, fontWeight: 700 }}>{value}</div>
    </div>
  );
}

function Panel({ children, style }) {
  return (
    <div style={{ background: "#fff", padding: 12, borderRadius: 8, boxShadow: "0 1px 2px rgba(0,0,0,0.05)", ...style }}>
      {children}
    </div>
  );
}

function BarChart({ data = [], labelKey = "week_start", valueKey = "units" }) {
  const values = data.map((d) => Number(d[valueKey] || 0));
  const max = Math.max(...values, 1);
  return (
    <div>
      {data.map((d, i) => {
        const label = d[labelKey] ? new Date(d[labelKey]).toLocaleDateString() : `#${i+1}`;
        const val = Number(d[valueKey] || 0);
        const pct = (val / max) * 100;
        return (
          <div key={i} style={{ marginBottom: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <div style={{ fontSize: 13 }}>{label}</div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{formatNumber(val)}</div>
            </div>
            <div style={{ height: 14, background: "#eee", borderRadius: 6 }}>
              <div style={{ width: `${pct}%`, height: "100%", background: "#10b981", borderRadius: 6 }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SimpleTable({ rows = [], columns = [] }) {
  if (!rows || rows.length === 0) return <div>No data</div>;
  return (
    <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 6 }}>
      <thead>
        <tr>
          {columns.map((c) => (
            <th key={c} style={th}>{c.replace(/_/g, " ").toUpperCase()}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, idx) => (
          <tr key={r.product_id || r.sku || idx}>
            {columns.map((c) => (
              <td key={c} style={td}>{r[c]}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default AnalyticsOverview;

const th = {
  textAlign: "left",
  borderBottom: "1px solid #eee",
  padding: "6px 8px",
  fontSize: 13,
};

const td = {
  padding: "6px 8px",
  borderBottom: "1px solid #fafafa",
  fontSize: 13,
};