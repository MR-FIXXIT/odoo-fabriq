import React, { useState, useEffect, useRef } from "react";
import { styles } from "../DashboardStyles";
import BillsOfMaterialsPage from "./BillsOfMaterialsPage";
import StockLedgerPage from "./StockLedgerPage";
import { useNavigate } from "react-router-dom";
import AnalysisPage from "./AnalysisPage";

// Sidebar style objects
const sidebarStyles = {
    sidebar: {
        position: "fixed", top: 0, left: 0, height: "100vh", width: 250,
        background: "#fff", borderRight: "1px solid #eaeaea", boxShadow: "2px 0 8px rgba(0,0,0,0.06)",
        padding: "0 0 16px 0", zIndex: 2000, transform: "translateX(0)", transition: "transform 0.25s"
    },
    sidebarClosed: { transform: "translateX(-100%)" },
    sidebarOverlay: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.08)", zIndex: 1999 },
    menuHeader: { fontWeight: 600, fontSize: 20, padding: "18px 16px 12px 22px", borderBottom: "1px solid #ececec", display: "flex", alignItems: "center", justifyContent: "space-between" },
    sidebarList: { listStyle: "none", padding: 0, margin: 0, marginTop: 12 },
    sidebarItem: { display: "block", background: "none", border: "none", width: "100%", textAlign: "left", fontSize: 16, padding: "14px 26px", color: "#34495e", cursor: "pointer", marginBottom: 2, borderRadius: 4, transition: "background 0.11s" },
    sidebarItemActive: { background: "#f0f6ff", fontWeight: 600, color: "#1976d2" },
    sidebarClose: { fontSize: 22, background: "none", border: "none", cursor: "pointer", padding: "2px 8px" },
};

const menuItems = [
    { key: "dashboard", label: "Dashboard" },
    { key: "boms", label: "Bills of Materials" },
    { key: "stockledger", label: "Stock Ledger" },
    { key: "analysis", label: "Analysis", icon: "📊" }, // Analysis menu
];


const allStates = ["Draft", "Confirmed", "In-Progress", "To Close", "Not Assigned", "Late"];

export default function DashboardPage() {
    const navigate = useNavigate();
    const profileRef = useRef();

    const [view, setView] = useState("dashboard");
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);

    const [orders, setOrders] = useState([]);
    const [editingOrder, setEditingOrder] = useState(null);

    // Order form now has components[] and workTasks[]
    const [orderForm, setOrderForm] = useState({
        reference: "",
        startDate: "",
        finishedProduct: "",
        quantity: "",
        unit: "",
        state: "Draft",
        components: [],
        workTasks: []
    });

    const [tasks, setTasks] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [newTask, setNewTask] = useState({ name: "", duration: "" });

    const [selectedState, setSelectedState] = useState("All");
    const [orderSearchTerm, setOrderSearchTerm] = useState("");

    useEffect(() => {
        const storedOrders = JSON.parse(localStorage.getItem("orders")) || [];
        setOrders(storedOrders);
        const storedTasks = JSON.parse(localStorage.getItem("tasks")) || [];
        setTasks(storedTasks);

        const handleClick = (e) => {
            if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
        };
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    const saveOrders = (updated) => {
        setOrders(updated);
        localStorage.setItem("orders", JSON.stringify(updated));
    };

    const saveTasks = (updated) => {
        setTasks(updated);
        localStorage.setItem("tasks", JSON.stringify(updated));
    };

    const handleOrderChange = (field, value) =>
        setOrderForm({ ...orderForm, [field]: value });

    const saveOrder = () => {
        if (!orderForm.reference) return alert("Reference is required");
        let updatedOrders = [...orders];
        if (editingOrder !== null) updatedOrders[editingOrder] = orderForm;
        else updatedOrders.push(orderForm);
        saveOrders(updatedOrders);
        setEditingOrder(null);
        setOrderForm({ reference: "", startDate: "", finishedProduct: "", quantity: "", unit: "", state: "Draft", components: [], workTasks: [] });
    };

    const editOrder = (idx) => {
        setEditingOrder(idx);
        setOrderForm(orders[idx]);
    };

    const deleteOrder = (idx) => {
        const updated = [...orders];
        updated.splice(idx, 1);
        saveOrders(updated);
    };

    const addTask = () => {
        if (!newTask.name || !newTask.duration) return alert("Enter all fields");
        const updated = [...tasks, { ...newTask }];
        saveTasks(updated);
        setNewTask({ name: "", duration: "" });
    };

    const deleteTask = (idx) => {
        const updated = tasks.filter((_, i) => i !== idx);
        saveTasks(updated);
    };

    const filteredTasks = tasks.filter((t) =>
        t.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Filter orders
    const filteredOrders = orders.filter((order) => {
        const term = orderSearchTerm.toLowerCase();
        return (
            order.reference.toLowerCase().includes(term) ||
            order.startDate.toLowerCase().includes(term) ||
            order.finishedProduct.toLowerCase().includes(term) ||
            order.quantity.toString().includes(term) ||
            order.unit.toLowerCase().includes(term) ||
            order.state.toLowerCase().includes(term)
        );
    });
    const filteredByState =
        selectedState === "All"
            ? filteredOrders
            : filteredOrders.filter((o) => o.state === selectedState);

    if (view === "boms") return <BillsOfMaterialsPage onBack={() => setView("dashboard")} />;
    if (view === "stockledger") return <StockLedgerPage onBack={() => setView("dashboard")} />;
    if (view === "analysis") return <AnalysisPage />;
    return (
        <div style={styles.pageContainer}>
            {sidebarOpen && <div style={sidebarStyles.sidebarOverlay} onClick={() => setSidebarOpen(false)} />}
            <nav style={{ ...sidebarStyles.sidebar, ...(sidebarOpen ? {} : sidebarStyles.sidebarClosed) }}>
                <div style={sidebarStyles.menuHeader}>
                    Master Menu
                    <button style={sidebarStyles.sidebarClose} onClick={() => setSidebarOpen(false)}>×</button>
                </div>
                <ul style={sidebarStyles.sidebarList}>
                    {menuItems.map((menu) => (
                        <li key={menu.key}>
                            <button
                                style={{ ...sidebarStyles.sidebarItem, ...(view === menu.key ? sidebarStyles.sidebarItemActive : {}) }}
                                onClick={() => { setSidebarOpen(false); setView(menu.key); }}
                            >
                                {menu.label}
                            </button>
                        </li>
                    ))}
                </ul>
            </nav>

            {/* Header */}
            <header style={headerStyles}>
                <div style={{ display: "flex", alignItems: "center" }}>
                    <button style={burgerButton} onClick={() => setSidebarOpen(true)}>☰</button>
                </div>
                <div style={headerCenter}>
                    <img src="src/components/Logo.png" alt="Logo" style={{ height: 40, marginRight: 12 }} />
                    <span style={appTitle}>Fabriq</span>
                </div>
                <div style={headerRight} ref={profileRef}>
                    <button onClick={() => setProfileOpen((v) => !v)} style={{ border: "none", background: "none", cursor: "pointer" }}>
                        <img src="src/components/Logo1.png" alt="User" style={{ width: 40, height: 40, borderRadius: "50%" }} />
                    </button>
                    {profileOpen && (
                        <div style={profileSidebarStyles.sidebar}>
                            <button style={profileSidebarStyles.closeBtn} onClick={() => setProfileOpen(false)}>×</button>
                            <ul style={profileSidebarStyles.list}>
                                <li style={profileSidebarStyles.item} onClick={() => { localStorage.clear(); navigate("/login"); }}>Logout</li>
                            </ul>
                        </div>
                    )}
                </div>
            </header>

            {/* Main content */}
            <div style={{ padding: 24 }}>
                <h2>Dashboard</h2>

                {/* State filter buttons */}
                <div style={{ display: "flex", gap: 12, marginBottom: 12, flexWrap: "wrap" }}>
                    <button
                        style={{
                            padding: "10px 18px", borderRadius: 20, border: "none",
                            background: selectedState === "All" ? "#1976d2" : "#f1f5fb",
                            color: selectedState === "All" ? "#fff" : "#34495e", fontWeight: 600, cursor: "pointer"
                        }}
                        onClick={() => setSelectedState("All")}
                    >All</button>
                    {allStates.map((state) => (
                        <button
                            key={state}
                            style={{
                                padding: "10px 18px", borderRadius: 20, border: "none",
                                background: selectedState === state ? "#1976d2" : "#f1f5fb",
                                color: selectedState === state ? "#fff" : "#34495e", fontWeight: 600, cursor: "pointer"
                            }}
                            onClick={() => setSelectedState(state)}
                        >{state}</button>
                    ))}
                </div>

                {/* Search Input */}
                <input
                    type="text"
                    placeholder="Search Manufacturing Orders..."
                    value={orderSearchTerm}
                    onChange={(e) => setOrderSearchTerm(e.target.value)}
                    style={{ marginBottom: 16, padding: 8, width: "100%", maxWidth: 400 }}
                />

                {/* Manufacturing Orders Table */}
                <div style={{ marginTop: 20 }}>
                    <h3>Manufacturing Orders</h3>
                    <table style={styles.table}>
                        <thead>
                        <tr>
                            <th style={styles.th}>Reference</th>
                            <th style={styles.th}>Start Date</th>
                            <th style={styles.th}>Finished Product</th>
                            <th style={styles.th}>Quantity</th>
                            <th style={styles.th}>Unit</th>
                            <th style={styles.th}>State</th>
                            <th style={styles.th}>Components</th>
                            <th style={styles.th}>Work Tasks</th>
                            <th style={styles.th}>Actions</th>
                        </tr>
                        </thead>
                        <tbody>
                        {filteredByState.length === 0 ? (
                            <tr><td colSpan={9} style={{ textAlign: "center", padding: 12 }}>No manufacturing orders found.</td></tr>
                        ) : filteredByState.map((order, idx) => (
                            <tr key={idx}>
                                <td style={styles.td}>{order.reference}</td>
                                <td style={styles.td}>{order.startDate}</td>
                                <td style={styles.td}>{order.finishedProduct}</td>
                                <td style={styles.td}>{order.quantity}</td>
                                <td style={styles.td}>{order.unit}</td>
                                <td style={styles.td}>{order.state}</td>
                                <td style={styles.td}>
                                    {order.components?.length ? order.components.map((c, i) => (
                                        <div key={i}>{c.name} ({c.status})</div>
                                    )) : "—"}
                                </td>
                                <td style={styles.td}>
                                    {order.workTasks?.length ? order.workTasks.join(", ") : "—"}
                                </td>
                                <td style={styles.td}>
                                    <button onClick={() => editOrder(idx)} style={{ marginRight: 6 }}>Edit</button>
                                    <button onClick={() => deleteOrder(idx)} style={{ color: "red" }}>Delete</button>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>

                    {/* Order Form */}
                    <div style={{ marginTop: 16 }}>
                        <h4>{editingOrder !== null ? "Edit Order" : "Add New Order"}</h4>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                            <input type="text" placeholder="Reference" value={orderForm.reference} onChange={(e) => handleOrderChange("reference", e.target.value)} style={{ padding: 6, minWidth: 120 }} />
                            <input type="date" placeholder="Start Date" value={orderForm.startDate} onChange={(e) => handleOrderChange("startDate", e.target.value)} style={{ padding: 6, minWidth: 140 }} />
                            <input type="text" placeholder="Finished Product" value={orderForm.finishedProduct} onChange={(e) => handleOrderChange("finishedProduct", e.target.value)} style={{ padding: 6, minWidth: 140 }} />
                            <input type="number" placeholder="Quantity" value={orderForm.quantity} onChange={(e) => handleOrderChange("quantity", e.target.value)} style={{ padding: 6, minWidth: 120 }} />
                            <input type="text" placeholder="Unit" value={orderForm.unit} onChange={(e) => handleOrderChange("unit", e.target.value)} style={{ padding: 6, minWidth: 120 }} />
                            <select value={orderForm.state} onChange={(e) => handleOrderChange("state", e.target.value)} style={{ padding: 6, minWidth: 140 }}>
                                {allStates.map((option) => <option key={option} value={option}>{option}</option>)}
                            </select>
                        </div>

                        {/* Components input */}
                        <div style={{ marginTop: 12 }}>
                            <h5>Components</h5>
                            {orderForm.components.map((c, i) => (
                                <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6 }}>
                                    <input type="text" placeholder="Component name" value={c.name} onChange={(e) => {
                                        const updated = [...orderForm.components];
                                        updated[i].name = e.target.value;
                                        handleOrderChange("components", updated);
                                    }} />
                                    <input type="text" placeholder="Status" value={c.status} onChange={(e) => {
                                        const updated = [...orderForm.components];
                                        updated[i].status = e.target.value;
                                        handleOrderChange("components", updated);
                                    }} />
                                    <button onClick={() => {
                                        const updated = orderForm.components.filter((_, idx) => idx !== i);
                                        handleOrderChange("components", updated);
                                    }}>Remove</button>
                                </div>
                            ))}
                            <button onClick={() => handleOrderChange("components", [...orderForm.components, { name: "", status: "" }])}>
                                + Add Component
                            </button>
                        </div>

                        {/* Work Tasks selection */}
                        <div style={{ marginTop: 12 }}>
                            <h5>Assign Work Tasks</h5>
                            <select multiple value={orderForm.workTasks} onChange={(e) => {
                                const options = Array.from(e.target.selectedOptions, o => o.value);
                                handleOrderChange("workTasks", options);
                            }}>
                                {tasks.map((task, i) => (
                                    <option key={i} value={task.name}>{task.name}</option>
                                ))}
                            </select>
                        </div>

                        <button style={{ ...styles.newButton, marginTop: 12 }} onClick={saveOrder}>
                            {editingOrder !== null ? "Update Order" : "Add Order"}
                        </button>
                    </div>
                </div>

                {/* Work Tasks Section */}
                <div style={{ marginTop: 40 }}>
                    <h3>Work Tasks</h3>
                    <div style={{ marginBottom: 12 }}>
                        <input type="text" placeholder="Search tasks" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ padding: 8, marginRight: 8 }} />
                        <input type="text" placeholder="Task name" value={newTask.name} onChange={(e) => setNewTask({ ...newTask, name: e.target.value })} style={{ padding: 8, marginRight: 8 }} />
                        <input type="number" placeholder="Duration (hrs)" value={newTask.duration} onChange={(e) => setNewTask({ ...newTask, duration: e.target.value })} style={{ padding: 8, marginRight: 8 }} />
                        <button style={styles.newButton} onClick={addTask}>Add</button>
                    </div>
                    <table style={styles.table}>
                        <thead>
                        <tr>
                            <th style={styles.th}>Task Name</th>
                            <th style={styles.th}>Duration (hrs)</th>
                            <th style={styles.th}>Action</th>
                        </tr>
                        </thead>
                        <tbody>
                        {filteredTasks.length === 0 ? (
                            <tr><td colSpan={3} style={{ textAlign: "center", padding: 12 }}>No tasks found.</td></tr>
                        ) : filteredTasks.map((task, idx) => (
                            <tr key={idx}>
                                <td style={styles.td}>{task.name}</td>
                                <td style={styles.td}>{task.duration}</td>
                                <td style={styles.td}>
                                    <button onClick={() => deleteTask(idx)} style={{ color: "red", cursor: "pointer" }}>Delete</button>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

// Header & profile styles
const headerStyles = { display: "flex", alignItems: "center", justifyContent: "space-between", backgroundColor: "#fff", padding: "0 24px", height: 72, borderBottom: "1px solid #eaeaea", boxShadow: "0 2px 10px rgba(0,0,0,0.04)", position: "sticky", top: 0, zIndex: 1500 };
const burgerButton = { background: "none", border: "none", fontSize: 26, marginRight: 16, cursor: "pointer", color: "#34495e", padding: "4px 8px", borderRadius: 6 };
const headerCenter = { flex: "1 1 auto", display: "flex", alignItems: "center", justifyContent: "center" };
const appTitle = { fontWeight: 700, fontSize: 22, color: "#183153", letterSpacing: 0.5 };
const headerRight = { flex: "0 0 auto", display: "flex", alignItems: "center", position: "relative" };
const profileSidebarStyles = {
    sidebar: { position: "absolute", right: 0, top: 50, width: 120, background: "#fff", border: "1px solid #eaeaea", borderRadius: 8, padding: 8, zIndex: 1600, boxShadow: "0 4px 16px rgba(0,0,0,0.08)" },
    closeBtn: { position: "absolute", top: 4, right: 6, background: "none", border: "none", fontSize: 18, cursor: "pointer" },
    list: { listStyle: "none", padding: 0, margin: 0 },
    item: { padding: "8px 6px", cursor: "pointer", borderRadius: 4, textAlign: "center", color: "red", background: "#f7f8fa" }
};