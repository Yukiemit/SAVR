import { useState, useEffect, useRef } from "react";
import NavBar_Staff from "../../components/NavBar_Staff";
import api from "../../services/api";

// ── CONSTANTS (mirrored from Donor_Donate_Food.jsx) ───────────────────────────
const FOOD_TYPES = [
  "Meat",
  "Protein Alternatives",
  "Fruits",
  "Vegetables",
  "Grains & Cereals",
  "Dairy",
  "Fats & Oils",
  "Sugars & Sweets",
  "Canned Goods",
  "Dry Goods",
];

const UNITS = ["g", "kg", "lbs", "L", "ml", "gal", "meal", "oz"];

const LOW_STOCK_THRESHOLD = 10;

// ── DUMMY DATA ────────────────────────────────────────────────────────────────
const DUMMY_ITEMS = [
  // Raw Ingredients
  {
    id: 1,
    meal_type: "Raw Ingredients",
    food_name: "Rice",
    category: "Grains & Cereals",
    unit: "kg",
    quantity: 48,
    expiration_date: "2026-06-30",
    special_notes: "",
    photo: null,
    donor_name: "Juan dela Cruz",
  },
  {
    id: 2,
    meal_type: "Raw Ingredients",
    food_name: "Canned Sardines",
    category: "Canned Goods",
    unit: "oz",
    quantity: 680,
    expiration_date: "2026-06-30",
    special_notes: "Store in cool dry place.",
    photo: null,
    donor_name: "ABC Logistics",
  },
  {
    id: 3,
    meal_type: "Raw Ingredients",
    food_name: "Chicken",
    category: "Meat",
    unit: "kg",
    quantity: 7,
    expiration_date: "2026-06-30",
    special_notes: "Keep refrigerated.",
    photo: null,
    donor_name: "Maria Santos",
  },
  {
    id: 4,
    meal_type: "Raw Ingredients",
    food_name: "Mango",
    category: "Fruits",
    unit: "kg",
    quantity: 48,
    expiration_date: "2026-06-30",
    special_notes: "",
    photo: null,
    donor_name: "Juan dela Cruz",
  },
  {
    id: 5,
    meal_type: "Raw Ingredients",
    food_name: "Milk",
    category: "Dairy",
    unit: "L",
    quantity: 5,
    expiration_date: "2026-03-01",
    special_notes: "Refrigerate immediately.",
    photo: null,
    donor_name: "Cebu Helps NGO",
  },
  {
    id: 6,
    meal_type: "Raw Ingredients",
    food_name: "Eggs",
    category: "Protein Alternatives",
    unit: "oz",
    quantity: 17,
    expiration_date: "2026-06-30",
    special_notes: "",
    photo: null,
    donor_name: "Maria Santos",
  },
  // Prepared Meals
  {
    id: 7,
    meal_type: "Prepared Meals",
    food_name: "Chicken Adobo",
    category: "Meat",
    unit: "meal",
    quantity: 48,
    expiration_date: "2026-06-30",
    special_notes: "Reheat before serving.",
    photo: null,
    donor_name: "Jollibee Foundation",
  },
  {
    id: 8,
    meal_type: "Prepared Meals",
    food_name: "Vegetable Stir Fry",
    category: "Vegetables",
    unit: "meal",
    quantity: 8,
    expiration_date: "2026-06-30",
    special_notes: "",
    photo: null,
    donor_name: "Maria Santos",
  },
  {
    id: 9,
    meal_type: "Prepared Meals",
    food_name: "Cinnamon Roll",
    category: "Sugars & Sweets",
    unit: "meal",
    quantity: 680,
    expiration_date: "2026-06-30",
    special_notes: "",
    photo: null,
    donor_name: "Starbucks PH",
  },
];

// ── HELPERS ───────────────────────────────────────────────────────────────────
function isExpired(dateStr) {
  if (!dateStr) return false;
  return new Date(dateStr) < new Date(new Date().toDateString());
}

function formatDateDisplay(dateStr) {
  if (!dateStr) return "–";
  return dateStr;
}

function getStatus(item) {
  if (isExpired(item.expiration_date)) return "expired";
  if (item.quantity < LOW_STOCK_THRESHOLD) return "low_stock";
  return "in_stock";
}

// ── COMPONENT ─────────────────────────────────────────────────────────────────
export default function Staff_InventoryFood() {
  const [items, setItems]               = useState([]);
  const [loading, setLoading]           = useState(true);
  const [mealTab, setMealTab]           = useState("Raw Ingredients"); // "Raw Ingredients" | "Prepared Meals"
  const [foodTypeFilter, setFoodTypeFilter] = useState("All");
  const [search, setSearch]             = useState("");
  const [showFoodTypeDropdown, setShowFoodTypeDropdown] = useState(false);

  // ── Popups ──
  const [editTarget,   setEditTarget]   = useState(null); // item being edited
  const [deleteTarget, setDeleteTarget] = useState(null); // item to confirm delete
  const [printTarget,  setPrintTarget]  = useState(null); // item to print label for
  const [deleteLoading, setDeleteLoading] = useState(false);

  // ── Toast ──
  const [toast, setToast]   = useState(null);
  const toastTimer          = useRef(null);

  // ── Add new item modal ──
  const [showAddModal, setShowAddModal] = useState(false);

  const dropdownRef = useRef(null);
  const editRef     = useRef(null);
  const deleteRef   = useRef(null);
  const printRef    = useRef(null);
  const addRef      = useRef(null);

  // ── Fetch ──
  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get("/staff/inventory/food");
        setItems(res.data);
      } catch {
        setItems(DUMMY_ITEMS);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  // Close food type dropdown on outside click
  useEffect(() => {
    const h = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target))
        setShowFoodTypeDropdown(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  // Close modals on outside click
  useEffect(() => {
    const h = (e) => {
      if (editRef.current   && !editRef.current.contains(e.target))   setEditTarget(null);
      if (deleteRef.current && !deleteRef.current.contains(e.target)) setDeleteTarget(null);
      if (printRef.current  && !printRef.current.contains(e.target))  setPrintTarget(null);
      if (addRef.current    && !addRef.current.contains(e.target))    setShowAddModal(false);
    };
    if (editTarget || deleteTarget || printTarget || showAddModal)
      document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [editTarget, deleteTarget, printTarget, showAddModal]);

  // ── Toast helper ──
  const showToast = (message, type = "success") => {
    clearTimeout(toastTimer.current);
    setToast({ message, type });
    toastTimer.current = setTimeout(() => setToast(null), 3200);
  };

  // ── Filtered items ──
  const filtered = items.filter((it) => {
    if (it.meal_type !== mealTab) return false;
    if (foodTypeFilter !== "All" && it.category !== foodTypeFilter) return false;
    const q = search.toLowerCase();
    if (q && !it.food_name.toLowerCase().includes(q) &&
             !it.category?.toLowerCase().includes(q) &&
             !it.donor_name?.toLowerCase().includes(q)) return false;
    return true;
  });

  const totalForTab = items.filter((it) => it.meal_type === mealTab).length;

  // ── Edit save ──
  const handleEditSave = async (updated) => {
    try {
      await api.put(`/staff/inventory/food/${updated.id}`, updated);
    } catch { /* local fallback */ }
    setItems((prev) => prev.map((it) => (it.id === updated.id ? updated : it)));
    setEditTarget(null);
    showToast(`"${updated.food_name}" has been updated.`);
  };

  // ── Delete ──
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await api.delete(`/staff/inventory/food/${deleteTarget.id}`);
    } catch { /* local fallback */ }
    setItems((prev) => prev.filter((it) => it.id !== deleteTarget.id));
    showToast(`"${deleteTarget.food_name}" has been removed.`, "success");
    setDeleteTarget(null);
    setDeleteLoading(false);
  };

  // ── Add new item ──
  const handleAddSave = async (newItem) => {
    const item = {
      ...newItem,
      id: Date.now(),
      meal_type: mealTab,
    };
    try {
      const res = await api.post("/staff/inventory/food", item);
      setItems((prev) => [...prev, res.data]);
    } catch {
      setItems((prev) => [...prev, item]);
    }
    setShowAddModal(false);
    showToast(`"${item.food_name}" has been added.`);
  };

  const now = new Date();
  const lastUpdated =
    now.toLocaleDateString("en-PH", { month: "long", day: "numeric", year: "numeric" }) +
    " " + now.toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="sif-wrapper">
      <NavBar_Staff />

      <main className="sif-main">

        {/* ── PAGE HEADER ── */}
        <div className="sif-page-header">
          <div>
            <h1 className="sif-page-title">
              Foods Inventory &nbsp;<span className="sif-title-divider">|</span>&nbsp;
              <span className="sif-title-tab">{mealTab}</span>
            </h1>
            <p className="sif-page-sub">Identify, track, and update inventory items to ensure accurate stock levels</p>
          </div>

          {/* ── MEAL TYPE TOGGLE — top-right of header ── */}
          <div className="sif-meal-toggle">
            {["Raw Ingredients", "Prepared Meals"].map((tab) => (
              <button
                key={tab}
                className={`sif-meal-btn${mealTab === tab ? " sif-meal-btn-active" : ""}`}
                onClick={() => { setMealTab(tab); setFoodTypeFilter("All"); setSearch(""); }}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <hr className="sif-divider" />

        {/* ── TOOLBAR ── */}
        <div className="sif-toolbar-wrap">

          {/* Search + Food Type + Add */}
          <div className="sif-toolbar">
            <div className="sif-search-wrap">
              <input
                type="text"
                className="sif-search"
                placeholder="Search items........."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <span className="material-symbols-rounded sif-search-icon">search</span>
            </div>

            {/* Food Type dropdown */}
            <div className="sif-foodtype-wrap" ref={dropdownRef}>
              <button
                className="sif-foodtype-btn"
                onClick={() => setShowFoodTypeDropdown((v) => !v)}
              >
                {foodTypeFilter === "All" ? "Food Type" : foodTypeFilter}
                <span className="material-symbols-rounded sif-foodtype-caret">
                  {showFoodTypeDropdown ? "expand_less" : "expand_more"}
                </span>
              </button>
              {showFoodTypeDropdown && (
                <div className="sif-foodtype-dropdown">
                  <button
                    className={`sif-foodtype-option${foodTypeFilter === "All" ? " sif-foodtype-option-active" : ""}`}
                    onClick={() => { setFoodTypeFilter("All"); setShowFoodTypeDropdown(false); }}
                  >
                    All Types
                  </button>
                  {FOOD_TYPES.map((ft) => (
                    <button
                      key={ft}
                      className={`sif-foodtype-option${foodTypeFilter === ft ? " sif-foodtype-option-active" : ""}`}
                      onClick={() => { setFoodTypeFilter(ft); setShowFoodTypeDropdown(false); }}
                    >
                      {ft}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              className="sif-add-btn"
              onClick={() => setShowAddModal(true)}
            >
              + Add new items
            </button>
          </div>
        </div>

        {/* ── TABLE ── */}
        <div className="sif-table-wrap">
          <table className="sif-table">
            <thead>
              <tr>
                <th>ITEM NAME</th>
                <th>FOOD TYPE</th>
                <th>UNIT</th>
                <th style={{ textAlign: "center" }}>QUANTITY</th>
                <th>EXPIRY DATE</th>
                <th>STATUS</th>
                <th style={{ textAlign: "center" }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="sif-empty">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="sif-empty">No items found.</td></tr>
              ) : (
                filtered.map((item) => {
                  const status = getStatus(item);
                  return (
                    <tr key={item.id}>
                      <td className="sif-td-name">{item.food_name}</td>
                      <td>{item.category}</td>
                      <td>{item.unit}</td>
                      <td className="sif-td-center">
                        <span className="sif-qty-badge">{item.quantity}</span>
                      </td>
                      <td>
                        <span className={`sif-expiry${status === "expired" ? " sif-expiry-expired" : ""}`}>
                          {status === "expired" ? "EXPIRED" : formatDateDisplay(item.expiration_date)}
                        </span>
                      </td>
                      <td>
                        <span className={`sif-status-badge sif-status-${status}`}>
                          {status === "in_stock"  ? "in stock"  :
                           status === "low_stock" ? "low stock" : "expired"}
                        </span>
                      </td>
                      <td>
                        <div className="sif-actions">
                          {/* Edit */}
                          <button
                            className="sif-action-btn sif-action-edit"
                            title="Edit"
                            onClick={() => setEditTarget({ ...item })}
                          >
                            <span className="material-symbols-rounded">edit</span>
                          </button>
                          {/* Delete */}
                          <button
                            className="sif-action-btn sif-action-delete"
                            title="Delete"
                            onClick={() => setDeleteTarget(item)}
                          >
                            <span className="material-symbols-rounded">delete</span>
                          </button>
                          {/* Print label */}
                          <button
                            className="sif-action-btn sif-action-print"
                            title="Print Label"
                            onClick={() => setPrintTarget(item)}
                          >
                            <span className="material-symbols-rounded">print</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ── FOOTER BAR ── */}
        <div className="sif-footer-bar">
          <span>
            <span className="material-symbols-rounded sif-footer-clock">schedule</span>
            Last updated: {lastUpdated}
          </span>
          <span className="sif-footer-total">Total Items: {filtered.length}</span>
        </div>

      </main>

      {/* ══════════════════════════════════════════════════════════
          EDIT POPUP
      ══════════════════════════════════════════════════════════ */}
      {editTarget && (
        <div className="sif-overlay">
          <div className="sif-modal sif-edit-modal" ref={editRef}>
            <div className="sif-modal-header">
              <h3 className="sif-modal-title">Edit Item</h3>
              <button className="sif-modal-close" onClick={() => setEditTarget(null)}>
                <span className="material-symbols-rounded">close</span>
              </button>
            </div>
            <hr className="sif-modal-divider" />
            <EditForm
              item={editTarget}
              onChange={setEditTarget}
              onSave={handleEditSave}
              onCancel={() => setEditTarget(null)}
            />
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          DELETE CONFIRM POPUP
      ══════════════════════════════════════════════════════════ */}
      {deleteTarget && (
        <div className="sif-overlay">
          <div className="sif-confirm-dialog" ref={deleteRef}>
            <div className="sif-confirm-icon-wrap sif-confirm-icon-delete">
              <span className="material-symbols-rounded sif-confirm-icon">delete_forever</span>
            </div>
            <h3 className="sif-confirm-title">Delete Item?</h3>
            <p className="sif-confirm-desc">
              You are about to permanently delete <strong>"{deleteTarget.food_name}"</strong>.
              This action cannot be undone.
            </p>
            <div className="sif-confirm-actions">
              <button
                className="sif-confirm-cancel-btn"
                onClick={() => setDeleteTarget(null)}
                disabled={deleteLoading}
              >
                Cancel
              </button>
              <button
                className="sif-confirm-ok-btn sif-confirm-ok-delete"
                onClick={handleDeleteConfirm}
                disabled={deleteLoading}
              >
                {deleteLoading ? "Deleting..." : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          PRINT LABEL POPUP
      ══════════════════════════════════════════════════════════ */}
      {printTarget && (
        <PrintModal
          item={printTarget}
          now={now}
          onClose={() => setPrintTarget(null)}
          onPrint={(batchNo) => {
            window.print();
            setPrintTarget(null);
            showToast(`Label for "${printTarget.food_name}" (Batch ${batchNo || "—"}) sent to printer.`);
          }}
          printRef={printRef}
        />
      )}

      {/* ══════════════════════════════════════════════════════════
          ADD NEW ITEM POPUP
      ══════════════════════════════════════════════════════════ */}
      {showAddModal && (
        <div className="sif-overlay">
          <div className="sif-modal sif-edit-modal" ref={addRef}>
            <div className="sif-modal-header">
              <h3 className="sif-modal-title">Add New Item — {mealTab}</h3>
              <button className="sif-modal-close" onClick={() => setShowAddModal(false)}>
                <span className="material-symbols-rounded">close</span>
              </button>
            </div>
            <hr className="sif-modal-divider" />
            <EditForm
              item={{
                food_name: "", category: "", unit: "", quantity: "",
                expiration_date: "", special_notes: "", donor_name: "",
              }}
              onChange={() => {}}
              onSave={handleAddSave}
              onCancel={() => setShowAddModal(false)}
              isNew
            />
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          TOAST
      ══════════════════════════════════════════════════════════ */}
      {toast && (
        <div className={`sif-toast sif-toast-${toast.type}`}>
          <span className="material-symbols-rounded sif-toast-icon">
            {toast.type === "success" ? "check_circle" : "error"}
          </span>
          <span className="sif-toast-msg">{toast.message}</span>
          <button className="sif-toast-close" onClick={() => setToast(null)}>
            <span className="material-symbols-rounded">close</span>
          </button>
        </div>
      )}
    </div>
  );
}

// ── PRINT MODAL ──────────────────────────────────────────────────────────────
function PrintModal({ item, now, onClose, onPrint, printRef }) {
  const [batchNo, setBatchNo] = useState("");
  const status = getStatus(item);

  return (
    <div className="sif-overlay">
      <div className="sif-print-modal" ref={printRef}>

        {/* Header */}
        <div className="sif-modal-header">
          <h3 className="sif-modal-title">
            <span className="material-symbols-rounded" style={{ verticalAlign: "middle", marginRight: 6, fontSize: 20 }}>label</span>
            Expiry Food Labelling
          </h3>
          <button className="sif-modal-close" onClick={onClose}>
            <span className="material-symbols-rounded">close</span>
          </button>
        </div>
        <hr className="sif-modal-divider" />

        {/* Batch number input */}
        <div className="sif-print-batch-row">
          <label className="sif-print-batch-label">
            <span className="material-symbols-rounded sif-print-batch-icon">tag</span>
            Batch No.
          </label>
          <input
            className="sif-print-batch-input"
            type="text"
            placeholder="e.g. A1, B2, 001…"
            maxLength={20}
            value={batchNo}
            onChange={(e) => setBatchNo(e.target.value)}
          />
        </div>

        {/* Label preview */}
        <div className="sif-print-preview">
          <p className="sif-print-preview-caption">Label Preview</p>
          <div className="sif-print-label" id="sif-print-label-content">
            <div className="sif-print-label-header">
              {isExpired(item.expiration_date) && (
                <div className="sif-print-expired-banner">⚠ EXPIRED</div>
              )}
              <p className="sif-print-label-org">Philippine FoodBank Foundation, Inc.</p>
            </div>

            <p className="sif-print-label-name">{item.food_name}</p>

            <div className="sif-print-label-details">
              <span><strong>Type:</strong> {item.category}</span>
              <span><strong>Qty:</strong> {item.quantity} {item.unit}</span>
              <span><strong>Expiry:</strong> {formatDateDisplay(item.expiration_date)}</span>
              <span>
                <strong>Status:</strong>{" "}
                <span style={{
                  color: status === "expired" ? "#c0392b" : status === "low_stock" ? "#e67e22" : "#2e7d32",
                  fontWeight: 700,
                }}>
                  {status === "expired" ? "EXPIRED" : status === "low_stock" ? "LOW STOCK" : "IN STOCK"}
                </span>
              </span>
            </div>

            {batchNo && (
              <div className="sif-print-label-batch">
                <strong>Batch:</strong> {batchNo}
              </div>
            )}

            {item.special_notes && (
              <p className="sif-print-label-notes">📝 {item.special_notes}</p>
            )}

            <p className="sif-print-label-printed">Printed: {now.toLocaleDateString("en-PH")}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="sif-print-actions">
          <button className="sif-confirm-cancel-btn" onClick={onClose}>
            Cancel
          </button>
          <button
            className="sif-confirm-ok-btn sif-confirm-ok-print"
            onClick={() => onPrint(batchNo)}
          >
            <span className="material-symbols-rounded" style={{ fontSize: 16, verticalAlign: "middle", marginRight: 4 }}>print</span>
            Print Label
          </button>
        </div>

      </div>
    </div>
  );
}

// ── EDIT / ADD FORM ───────────────────────────────────────────────────────────
function EditForm({ item, onChange, onSave, onCancel, isNew = false }) {
  const [form, setForm]   = useState({ ...item });
  const [errors, setErrors] = useState({});

  const update = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((p) => ({ ...p, [field]: null }));
  };

  const validate = () => {
    const e = {};
    if (!form.food_name?.trim())   e.food_name       = "Required.";
    if (!form.category)            e.category        = "Required.";
    if (!form.unit)                e.unit            = "Required.";
    if (!form.quantity || isNaN(Number(form.quantity)) || Number(form.quantity) < 0)
                                   e.quantity        = "Enter a valid number.";
    if (!form.expiration_date)     e.expiration_date = "Required.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    onSave({ ...form, quantity: Number(form.quantity) });
  };

  const inp = (field) => `sif-edit-input${errors[field] ? " sif-edit-input-err" : ""}`;

  return (
    <div className="sif-edit-form">

      <div className="sif-edit-row">
        <div className="sif-edit-field sif-edit-field-grow">
          <label className="sif-edit-label">Food Item Name</label>
          <input
            className={inp("food_name")}
            type="text"
            placeholder="e.g., Canned Vegetables"
            value={form.food_name}
            onChange={(e) => update("food_name", e.target.value)}
          />
          {errors.food_name && <span className="sif-edit-err">{errors.food_name}</span>}
        </div>
      </div>

      <div className="sif-edit-row">
        <div className="sif-edit-field sif-edit-field-grow">
          <label className="sif-edit-label">Food Type / Category</label>
          <select
            className={inp("category") + " sif-edit-select"}
            value={form.category}
            onChange={(e) => update("category", e.target.value)}
          >
            <option value="" disabled>Select category</option>
            {FOOD_TYPES.map((ft) => <option key={ft} value={ft}>{ft}</option>)}
          </select>
          {errors.category && <span className="sif-edit-err">{errors.category}</span>}
        </div>

        <div className="sif-edit-field sif-edit-field-sm">
          <label className="sif-edit-label">Unit</label>
          <select
            className={inp("unit") + " sif-edit-select"}
            value={form.unit}
            onChange={(e) => update("unit", e.target.value)}
          >
            <option value="" disabled>–</option>
            {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
          </select>
          {errors.unit && <span className="sif-edit-err">{errors.unit}</span>}
        </div>

        <div className="sif-edit-field sif-edit-field-sm">
          <label className="sif-edit-label">Quantity</label>
          <input
            className={inp("quantity")}
            type="number"
            min="0"
            placeholder="0"
            value={form.quantity}
            onChange={(e) => update("quantity", e.target.value)}
          />
          {errors.quantity && <span className="sif-edit-err">{errors.quantity}</span>}
        </div>
      </div>

      <div className="sif-edit-row">
        <div className="sif-edit-field sif-edit-field-grow">
          <label className="sif-edit-label">Expiration Date</label>
          <input
            className={inp("expiration_date")}
            type="date"
            value={form.expiration_date}
            onChange={(e) => update("expiration_date", e.target.value)}
          />
          {errors.expiration_date && <span className="sif-edit-err">{errors.expiration_date}</span>}
        </div>

        <div className="sif-edit-field sif-edit-field-grow">
          <label className="sif-edit-label">Donor Name <span className="sif-edit-opt">(optional)</span></label>
          <input
            className="sif-edit-input"
            type="text"
            placeholder="Donor / source"
            value={form.donor_name || ""}
            onChange={(e) => update("donor_name", e.target.value)}
          />
        </div>
      </div>

      <div className="sif-edit-row">
        <div className="sif-edit-field sif-edit-field-grow">
          <label className="sif-edit-label">Special Notes <span className="sif-edit-opt">(optional)</span></label>
          <textarea
            className="sif-edit-input sif-edit-textarea"
            placeholder="Storage requirements, allergies, etc."
            value={form.special_notes || ""}
            onChange={(e) => update("special_notes", e.target.value)}
          />
        </div>
      </div>

      <div className="sif-edit-footer">
        <button className="sif-confirm-cancel-btn" onClick={onCancel}>Cancel</button>
        <button className="sif-confirm-ok-btn sif-confirm-ok-save" onClick={handleSave}>
          {isNew ? "Add Item" : "Save Changes"}
        </button>
      </div>
    </div>
  );
}
