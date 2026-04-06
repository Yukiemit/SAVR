import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import NavBar_Donor from "../../components/NavBar_Donor";
import api from "../../services/api";

// ── DUMMY DATA ───────────────────────────────────────────────────────────────
const DUMMY_PICKUPS = [
  {
    id: 1,
    date: "11 / 18 / 2026",
    time_start: "10:00 AM",
    time_end: "12:00 PM",
    address: "123 Main Street",
    contact_name: "John Doe",
    contact_number: "09064082424",
  },
  {
    id: 2,
    date: "11 / 25 / 2026",
    time_start: "9:00 AM",
    time_end: "11:00 AM",
    address: "456 Rizal Avenue",
    contact_name: "Maria Santos",
    contact_number: "09171234567",
  },
];

// ── FOOD TYPES & UNITS ───────────────────────────────────────────────────────
const FOOD_TYPES = [
  "Rice", "Flour", "Corn", "Beans", "Canned Goods",
  "Vegetables", "Fruits", "Cooking Oil", "Noodles", "Others",
];
const UNITS = ["kg", "g", "lbs", "pcs", "cans", "bags", "liters", "boxes"];

// ── SERVICE TYPES ────────────────────────────────────────────────────────────
const SERVICE_TYPES = [
  "Transportation / Delivery",
  "Volunteer Labor",
  "Logistics Support",
  "Warehouse / Storage",
  "Others",
];

// ── DONATION CATEGORY CARDS ──────────────────────────────────────────────────
const CATEGORIES = [
  { key: "financial", label: "Financial Donation", icon: "/images/Donor_Financial.png"       },
  { key: "food",      label: "Food Donation",      icon: "/images/Donor_Food.png"   },
  { key: "service",   label: "Service Donation",   icon: "/images/Donor_Service.png" },
];

// ── EMPTY FORM STATES ────────────────────────────────────────────────────────
const EMPTY_FINANCIAL = {
  amount: "", payment_method: "", reference_number: "", notes: "",
};

const EMPTY_FOOD = {
  food_type: "", quantity: "", unit: "",
  pickup_date: "", pickup_time_start: "", pickup_time_end: "",
  address: "", contact_name: "", contact_number: "", notes: "",
};

const EMPTY_SERVICE = {
  service_type: "", description: "",
  scheduled_date: "", scheduled_time: "",
  address: "", contact_name: "", contact_number: "", notes: "",
};

const EMPTY_PICKUP_EDIT = {
  date: "", time_start: "", time_end: "",
  address: "", contact_name: "", contact_number: "",
};

// ── MODAL TITLE MAP ──────────────────────────────────────────────────────────
const MODAL_TITLE = {
  financial: "Financial Donation",
  food:      "Food Donation",
  service:   "Service Donation",
};

export default function Donor_Donate() {
  const navigate = useNavigate();

  // ── Modal ────────────────────────────────────────────────────────────────
  const [activeModal,  setActiveModal]  = useState(null);

  // ── Form states ──────────────────────────────────────────────────────────
  const [financial,    setFinancial]    = useState(EMPTY_FINANCIAL);
  const [food,         setFood]         = useState(EMPTY_FOOD);
  const [service,      setService]      = useState(EMPTY_SERVICE);
  const [errors,       setErrors]       = useState({});
  const [formStatus,   setFormStatus]   = useState(null);

  // ── Pickups ──────────────────────────────────────────────────────────────
  const [pickups,        setPickups]        = useState([]);
  const [pickupsLoading, setPickupsLoading] = useState(true);
  const [editingPickup,  setEditingPickup]  = useState(null);
  const [editForm,       setEditForm]       = useState(EMPTY_PICKUP_EDIT);
  const [editStatus,     setEditStatus]     = useState(null);
  const [deleteConfirm,  setDeleteConfirm]  = useState(null);

  // ── Fetch pickups ────────────────────────────────────────────────────────
  // Backend: GET /api/donor/pickups
  // Returns: [{ id, date, time_start, time_end, address, contact_name, contact_number }]
  useEffect(() => {
    const fetchPickups = async () => {
      try {
        const res = await api.get("/donor/pickups");
        setPickups(res.data || DUMMY_PICKUPS);
      } catch {
        setPickups(DUMMY_PICKUPS);
      } finally {
        setPickupsLoading(false);
      }
    };
    fetchPickups();
  }, []);

  // ── Open / close modal ───────────────────────────────────────────────────
  const openModal = (key) => {
    setActiveModal(key);
    setErrors({});
    setFormStatus(null);
  };

  const closeModal = () => {
    setActiveModal(null);
    setErrors({});
    setFormStatus(null);
    setEditingPickup(null);
    setEditStatus(null);
    setDeleteConfirm(null);
  };

  // ── Validation ───────────────────────────────────────────────────────────
  const validateFinancial = () => {
    const e = {};
    if (!financial.amount || Number(financial.amount) < 1) e.amount = "Enter a valid amount.";
    if (!financial.payment_method) e.payment_method = "Select a payment method.";
    return e;
  };

  const validateFood = () => {
    const e = {};
    if (!food.food_type)  e.food_type   = "Select a food type.";
    if (!food.quantity || Number(food.quantity) < 1) e.quantity = "Enter a valid quantity.";
    if (!food.unit)       e.unit        = "Select a unit.";
    if (!food.pickup_date) e.pickup_date = "Select a pickup date.";
    if (!food.address.trim())        e.address        = "Address is required.";
    if (!food.contact_name.trim())   e.contact_name   = "Contact name is required.";
    if (!food.contact_number.trim()) e.contact_number = "Contact number is required.";
    return e;
  };

  const validateService = () => {
    const e = {};
    if (!service.service_type)         e.service_type   = "Select a service type.";
    if (!service.description.trim())   e.description    = "Please describe the service.";
    if (!service.scheduled_date)       e.scheduled_date = "Select a date.";
    if (!service.address.trim())       e.address        = "Address is required.";
    if (!service.contact_name.trim())  e.contact_name   = "Contact name is required.";
    if (!service.contact_number.trim()) e.contact_number = "Contact number is required.";
    return e;
  };

  // ── Submit donation ──────────────────────────────────────────────────────
  // Backend: POST /api/donor/donations
  // Body (financial): { type, amount, payment_method, reference_number, notes }
  // Body (food):      { type, food_type, quantity, unit, pickup_date,
  //                     pickup_time_start, pickup_time_end,
  //                     address, contact_name, contact_number, notes }
  // Body (service):   { type, service_type, description, scheduled_date,
  //                     scheduled_time, address, contact_name, contact_number, notes }
  // Returns: { id, status: "pending", created_at, ... }
  const handleSubmit = async () => {
    let errs = {};
    if (activeModal === "financial") errs = validateFinancial();
    if (activeModal === "food")      errs = validateFood();
    if (activeModal === "service")   errs = validateService();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setFormStatus("loading");
    try {
      let payload = { type: activeModal };
      if (activeModal === "financial") payload = { ...payload, ...financial };
      if (activeModal === "food")      payload = { ...payload, ...food };
      if (activeModal === "service")   payload = { ...payload, ...service };

      await api.post("/donor/donations", payload);

      // Optimistically add pickup row when food donation is submitted
      if (activeModal === "food") {
        setPickups((prev) => [
          ...prev,
          {
            id: Date.now(),
            date: food.pickup_date,
            time_start: food.pickup_time_start || "TBD",
            time_end: food.pickup_time_end || "",
            address: food.address,
            contact_name: food.contact_name,
            contact_number: food.contact_number,
          },
        ]);
      }

      setFormStatus("success");
      if (activeModal === "financial") setFinancial(EMPTY_FINANCIAL);
      if (activeModal === "food")      setFood(EMPTY_FOOD);
      if (activeModal === "service")   setService(EMPTY_SERVICE);
    } catch {
      setFormStatus("error");
    }
  };

  // ── Edit pickup ──────────────────────────────────────────────────────────
  // Backend: PUT /api/donor/pickups/:id
  // Body: { date, time_start, time_end, address, contact_name, contact_number }
  const handleEditSave = async () => {
    setEditStatus("loading");
    try {
      await api.put(`/donor/pickups/${editingPickup.id}`, editForm);
      setPickups((prev) =>
        prev.map((p) => p.id === editingPickup.id ? { ...p, ...editForm } : p)
      );
      setEditStatus("success");
      setTimeout(closeModal, 1200);
    } catch {
      setEditStatus("error");
    }
  };

  // ── Delete pickup ────────────────────────────────────────────────────────
  // Backend: DELETE /api/donor/pickups/:id
  const handleDelete = async (id) => {
    try { await api.delete(`/donor/pickups/${id}`); } catch {}
    setPickups((prev) => prev.filter((p) => p.id !== id));
    setDeleteConfirm(null);
  };

  // ── Field change helpers ─────────────────────────────────────────────────
  const finChange  = (e) => { setFinancial((p) => ({ ...p, [e.target.name]: e.target.value })); if (errors[e.target.name]) setErrors((p) => ({ ...p, [e.target.name]: null })); };
  const foodChange = (e) => { setFood((p)      => ({ ...p, [e.target.name]: e.target.value })); if (errors[e.target.name]) setErrors((p) => ({ ...p, [e.target.name]: null })); };
  const svcChange  = (e) => { setService((p)   => ({ ...p, [e.target.name]: e.target.value })); if (errors[e.target.name]) setErrors((p) => ({ ...p, [e.target.name]: null })); };
  const editChange = (e) => setEditForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const inp = (name) => `don-input${errors[name] ? " don-input-err" : ""}`;

  return (
    <div className="dd-wrapper">

      {/* ── NAVBAR ── */}
      <NavBar_Donor />

      {/* ══════════════ PAGE CONTENT ══════════════ */}
      <main className="don-main">

        {/* ── PAGE TITLE ── */}
        <div className="don-page-header">
          <h1 className="don-page-title">Donation Type</h1>
          <hr className="don-page-divider" />
        </div>

        {/* ── CATEGORY CARDS ── */}
        <div className="don-categories">
            {CATEGORIES.map((cat) => (
                <button
                    key={cat.key}
                    className="don-cat-card"
                    onClick={() => navigate(`/donor/donate/${cat.key}`)}
                >
                    <img src={cat.icon} alt={cat.label} className="don-cat-icon" />
                    <p className="don-cat-label">{cat.label}</p>
                </button>
            ))}
        </div>

        <hr className="don-page-divider don-section-divider" />

        {/* ── UPCOMING PICKUPS ── */}
        <div className="don-pickups-section">
          <div className="don-pickups-header">
            <h2 className="don-pickups-title">Upcoming Pickups</h2>
            <button className="don-viewall-btn" onClick={() => setActiveModal("pickups")}>
              View All
            </button>
          </div>

          <div className="don-pickups-list">
            {pickupsLoading ? (
              <p className="don-pickups-loading">Loading pickups…</p>
            ) : pickups.length === 0 ? (
              <p className="don-pickups-empty">No upcoming pickups.</p>
            ) : (
              pickups.slice(0, 2).map((p) => (
                <PickupRow
                  key={p.id}
                  pickup={p}
                  onEdit={() => {
                    setEditingPickup(p);
                    setEditForm({
                      date: p.date, time_start: p.time_start, time_end: p.time_end,
                      address: p.address, contact_name: p.contact_name, contact_number: p.contact_number,
                    });
                    setActiveModal("edit_pickup");
                  }}
                  onDelete={() => setDeleteConfirm(p.id)}
                />
              ))
            )}
          </div>
        </div>

      </main>

      {/* ══════════════ MODALS ══════════════ */}

      {/* ── DONATION FORM MODAL ── */}
      {(activeModal === "financial" || activeModal === "food" || activeModal === "service") && (
        <ModalOverlay onClose={closeModal}>
          <div className="don-modal">

            <div className="don-modal-header">
              <div className="don-modal-title-wrap">
                <img
                    src={CATEGORIES.find((c) => c.key === activeModal)?.icon}
                    alt="icon"
                    className="don-modal-title-icon"
                />
                <h2 className="don-modal-title">{MODAL_TITLE[activeModal]}</h2>
              </div>
              <button className="don-close-btn" onClick={closeModal}>
                <span className="material-symbols-rounded">close</span>
              </button>
            </div>

            <hr className="don-modal-divider" />

            {/* ── FINANCIAL FORM ── */}
            {activeModal === "financial" && (
              <div className="don-form">
                <div className="don-field">
                  <label className="don-label">Amount (₱)</label>
                  <input className={inp("amount")} type="number" name="amount" min="1" placeholder="e.g. 5000" value={financial.amount} onChange={finChange} />
                  {errors.amount && <span className="don-err-msg">{errors.amount}</span>}
                </div>
                <div className="don-field">
                  <label className="don-label">Payment Method</label>
                  <select className={inp("payment_method") + " don-select"} name="payment_method" value={financial.payment_method} onChange={finChange}>
                    <option value="" disabled>Select Method</option>
                    <option value="GCash">GCash</option>
                    <option value="Maya">Maya</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Cash">Cash</option>
                    <option value="Check">Check</option>
                  </select>
                  {errors.payment_method && <span className="don-err-msg">{errors.payment_method}</span>}
                </div>
                <div className="don-field">
                  <label className="don-label">Reference Number <span className="don-label-opt">(optional)</span></label>
                  <input className="don-input" type="text" name="reference_number" placeholder="Transaction / reference no." value={financial.reference_number} onChange={finChange} />
                </div>
                <div className="don-field">
                  <label className="don-label">Notes <span className="don-label-opt">(optional)</span></label>
                  <textarea className="don-input don-textarea" name="notes" placeholder="Any additional notes…" value={financial.notes} onChange={finChange} />
                </div>
              </div>
            )}

            {/* ── FOOD FORM ── */}
            {activeModal === "food" && (
              <div className="don-form">
                <div className="don-form-row">
                  <div className="don-field don-field-grow">
                    <label className="don-label">Type of Food</label>
                    <select className={inp("food_type") + " don-select"} name="food_type" value={food.food_type} onChange={foodChange}>
                      <option value="" disabled>Select Food Type</option>
                      {FOOD_TYPES.map((f) => <option key={f} value={f}>{f}</option>)}
                    </select>
                    {errors.food_type && <span className="don-err-msg">{errors.food_type}</span>}
                  </div>
                  <div className="don-field don-field-sm">
                    <label className="don-label">Quantity</label>
                    <input className={inp("quantity")} type="number" name="quantity" min="1" placeholder="##" value={food.quantity} onChange={foodChange} />
                    {errors.quantity && <span className="don-err-msg">{errors.quantity}</span>}
                  </div>
                  <div className="don-field don-field-sm">
                    <label className="don-label">Unit</label>
                    <select className={inp("unit") + " don-select"} name="unit" value={food.unit} onChange={foodChange}>
                      <option value="" disabled>Unit</option>
                      {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                    </select>
                    {errors.unit && <span className="don-err-msg">{errors.unit}</span>}
                  </div>
                </div>
                <div className="don-field">
                  <label className="don-label">Pickup Date</label>
                  <input className={inp("pickup_date")} type="date" name="pickup_date" value={food.pickup_date} onChange={foodChange} />
                  {errors.pickup_date && <span className="don-err-msg">{errors.pickup_date}</span>}
                </div>
                <div className="don-form-row">
                  <div className="don-field don-field-half">
                    <label className="don-label">Time Start <span className="don-label-opt">(optional)</span></label>
                    <input className="don-input" type="time" name="pickup_time_start" value={food.pickup_time_start} onChange={foodChange} />
                  </div>
                  <div className="don-field don-field-half">
                    <label className="don-label">Time End <span className="don-label-opt">(optional)</span></label>
                    <input className="don-input" type="time" name="pickup_time_end" value={food.pickup_time_end} onChange={foodChange} />
                  </div>
                </div>
                <div className="don-field">
                  <label className="don-label">Pickup Address</label>
                  <input className={inp("address")} type="text" name="address" placeholder="Full address for pickup" value={food.address} onChange={foodChange} />
                  {errors.address && <span className="don-err-msg">{errors.address}</span>}
                </div>
                <div className="don-form-row">
                  <div className="don-field don-field-half">
                    <label className="don-label">Contact Name</label>
                    <input className={inp("contact_name")} type="text" name="contact_name" placeholder="Full name" value={food.contact_name} onChange={foodChange} />
                    {errors.contact_name && <span className="don-err-msg">{errors.contact_name}</span>}
                  </div>
                  <div className="don-field don-field-half">
                    <label className="don-label">Contact Number</label>
                    <input className={inp("contact_number")} type="text" name="contact_number" placeholder="09XXXXXXXXX" value={food.contact_number} onChange={foodChange} />
                    {errors.contact_number && <span className="don-err-msg">{errors.contact_number}</span>}
                  </div>
                </div>
                <div className="don-field">
                  <label className="don-label">Notes <span className="don-label-opt">(optional)</span></label>
                  <textarea className="don-input don-textarea" name="notes" placeholder="Any special instructions…" value={food.notes} onChange={foodChange} />
                </div>
              </div>
            )}

            {/* ── SERVICE FORM ── */}
            {activeModal === "service" && (
              <div className="don-form">
                <div className="don-field">
                  <label className="don-label">Type of Service</label>
                  <select className={inp("service_type") + " don-select"} name="service_type" value={service.service_type} onChange={svcChange}>
                    <option value="" disabled>Select Service Type</option>
                    {SERVICE_TYPES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                  {errors.service_type && <span className="don-err-msg">{errors.service_type}</span>}
                </div>
                <div className="don-field">
                  <label className="don-label">Description</label>
                  <textarea className={`don-input don-textarea${errors.description ? " don-input-err" : ""}`} name="description" placeholder="Describe the service you are offering…" value={service.description} onChange={svcChange} />
                  {errors.description && <span className="don-err-msg">{errors.description}</span>}
                </div>
                <div className="don-form-row">
                  <div className="don-field don-field-half">
                    <label className="don-label">Scheduled Date</label>
                    <input className={inp("scheduled_date")} type="date" name="scheduled_date" value={service.scheduled_date} onChange={svcChange} />
                    {errors.scheduled_date && <span className="don-err-msg">{errors.scheduled_date}</span>}
                  </div>
                  <div className="don-field don-field-half">
                    <label className="don-label">Scheduled Time <span className="don-label-opt">(optional)</span></label>
                    <input className="don-input" type="time" name="scheduled_time" value={service.scheduled_time} onChange={svcChange} />
                  </div>
                </div>
                <div className="don-field">
                  <label className="don-label">Address / Location</label>
                  <input className={inp("address")} type="text" name="address" placeholder="Service location" value={service.address} onChange={svcChange} />
                  {errors.address && <span className="don-err-msg">{errors.address}</span>}
                </div>
                <div className="don-form-row">
                  <div className="don-field don-field-half">
                    <label className="don-label">Contact Name</label>
                    <input className={inp("contact_name")} type="text" name="contact_name" placeholder="Full name" value={service.contact_name} onChange={svcChange} />
                    {errors.contact_name && <span className="don-err-msg">{errors.contact_name}</span>}
                  </div>
                  <div className="don-field don-field-half">
                    <label className="don-label">Contact Number</label>
                    <input className={inp("contact_number")} type="text" name="contact_number" placeholder="09XXXXXXXXX" value={service.contact_number} onChange={svcChange} />
                    {errors.contact_number && <span className="don-err-msg">{errors.contact_number}</span>}
                  </div>
                </div>
                <div className="don-field">
                  <label className="don-label">Notes <span className="don-label-opt">(optional)</span></label>
                  <textarea className="don-input don-textarea" name="notes" placeholder="Any additional info…" value={service.notes} onChange={svcChange} />
                </div>
              </div>
            )}

            {/* ── STATUS ── */}
            {formStatus === "success" && <p className="don-status don-status-success">✓ Donation submitted successfully!</p>}
            {formStatus === "error"   && <p className="don-status don-status-error">Something went wrong. Please try again.</p>}

            {/* ── ACTIONS ── */}
            <div className="don-modal-actions">
              <button className="don-cancel-btn" onClick={closeModal}>Cancel</button>
              <button
                className="don-submit-btn"
                onClick={handleSubmit}
                disabled={formStatus === "loading" || formStatus === "success"}
              >
                {formStatus === "loading" ? "Submitting…" : formStatus === "success" ? "Submitted ✓" : "Submit Donation"}
              </button>
            </div>

          </div>
        </ModalOverlay>
      )}

      {/* ── VIEW ALL PICKUPS MODAL ── */}
      {activeModal === "pickups" && (
        <ModalOverlay onClose={closeModal}>
          <div className="don-modal don-modal-wide">
            <div className="don-modal-header">
              <h2 className="don-modal-title">All Upcoming Pickups</h2>
              <button className="don-close-btn" onClick={closeModal}>
                <span className="material-symbols-rounded">close</span>
              </button>
            </div>
            <hr className="don-modal-divider" />
            {pickups.length === 0 ? (
              <p className="don-pickups-empty">No upcoming pickups scheduled.</p>
            ) : (
              <div className="don-modal-scroll-list">
                {pickups.map((p) => (
                  <PickupRow
                    key={p.id}
                    pickup={p}
                    onEdit={() => {
                      setEditingPickup(p);
                      setEditForm({
                        date: p.date, time_start: p.time_start, time_end: p.time_end,
                        address: p.address, contact_name: p.contact_name, contact_number: p.contact_number,
                      });
                      setActiveModal("edit_pickup");
                    }}
                    onDelete={() => setDeleteConfirm(p.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </ModalOverlay>
      )}

      {/* ── EDIT PICKUP MODAL ── */}
      {activeModal === "edit_pickup" && editingPickup && (
        <ModalOverlay onClose={closeModal}>
          <div className="don-modal don-modal-sm">
            <div className="don-modal-header">
              <h2 className="don-modal-title">Edit Pickup</h2>
              <button className="don-close-btn" onClick={closeModal}>
                <span className="material-symbols-rounded">close</span>
              </button>
            </div>
            <hr className="don-modal-divider" />
            <div className="don-form">
              <div className="don-field">
                <label className="don-label">Date</label>
                <input className="don-input" type="text" name="date" value={editForm.date} onChange={editChange} placeholder="MM / DD / YYYY" />
              </div>
              <div className="don-form-row">
                <div className="don-field don-field-half">
                  <label className="don-label">Time Start</label>
                  <input className="don-input" type="text" name="time_start" value={editForm.time_start} onChange={editChange} placeholder="10:00 AM" />
                </div>
                <div className="don-field don-field-half">
                  <label className="don-label">Time End</label>
                  <input className="don-input" type="text" name="time_end" value={editForm.time_end} onChange={editChange} placeholder="12:00 PM" />
                </div>
              </div>
              <div className="don-field">
                <label className="don-label">Address</label>
                <input className="don-input" type="text" name="address" value={editForm.address} onChange={editChange} />
              </div>
              <div className="don-form-row">
                <div className="don-field don-field-half">
                  <label className="don-label">Contact Name</label>
                  <input className="don-input" type="text" name="contact_name" value={editForm.contact_name} onChange={editChange} />
                </div>
                <div className="don-field don-field-half">
                  <label className="don-label">Contact Number</label>
                  <input className="don-input" type="text" name="contact_number" value={editForm.contact_number} onChange={editChange} />
                </div>
              </div>
            </div>
            {editStatus === "success" && <p className="don-status don-status-success">✓ Pickup updated!</p>}
            {editStatus === "error"   && <p className="don-status don-status-error">Failed to save. Try again.</p>}
            <div className="don-modal-actions">
              <button className="don-cancel-btn" onClick={closeModal}>Cancel</button>
              <button className="don-submit-btn" onClick={handleEditSave} disabled={editStatus === "loading"}>
                {editStatus === "loading" ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </div>
        </ModalOverlay>
      )}

      {/* ── DELETE CONFIRM MODAL ── */}
      {deleteConfirm !== null && (
        <ModalOverlay onClose={() => setDeleteConfirm(null)}>
          <div className="don-modal don-modal-confirm">
            <span className="material-symbols-rounded don-confirm-icon">delete_forever</span>
            <h2 className="don-confirm-title">Delete Pickup?</h2>
            <p className="don-confirm-desc">
              This action cannot be undone. The pickup schedule will be permanently removed.
            </p>
            <div className="don-modal-actions don-modal-actions-center">
              <button className="don-cancel-btn" onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button className="don-delete-confirm-btn" onClick={() => handleDelete(deleteConfirm)}>
                Yes, Delete
              </button>
            </div>
          </div>
        </ModalOverlay>
      )}

    </div>
  );
}

// ── SUB-COMPONENTS ───────────────────────────────────────────────────────────

function ModalOverlay({ children, onClose }) {
  return (
    <div
      className="don-overlay"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {children}
    </div>
  );
}

function PickupRow({ pickup, onEdit, onDelete }) {
  const timeRange = pickup.time_end
    ? `${pickup.time_start} - ${pickup.time_end}`
    : pickup.time_start;

  return (
    <div className="don-pickup-row">
      <div className="don-pickup-info">
        <p className="don-pickup-main">
          {pickup.date}&nbsp;&nbsp;|&nbsp;&nbsp;{timeRange}
        </p>
        <p className="don-pickup-sub">
          Address: {pickup.address}&nbsp;&nbsp;|&nbsp;&nbsp;
          Contact: {pickup.contact_name} ({pickup.contact_number})
        </p>
      </div>
      <div className="don-pickup-actions">
        <button className="don-edit-link" onClick={onEdit}>edit</button>
        <span className="don-pickup-sep">/</span>
        <button className="don-delete-link" onClick={onDelete}>delete</button>
      </div>
    </div>
  );
}
