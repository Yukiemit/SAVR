import { useState, useEffect, useCallback, useRef } from "react";
import NavBar_Staff from "../../components/NavBar_Staff";
import api from "../../services/api";

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────
const TOAST_DURATION = 3500;

// ─────────────────────────────────────────────────────────────────────────────
// DUMMY DATA — FROM DONOR
// Replace with: api.get("/staff/donations/journey/from-donor")
// ─────────────────────────────────────────────────────────────────────────────
const DUMMY_FROM_DONOR = [
  {
    id: 1,
    donor_name: "Starbuck Corporation",
    overall_status: "completed",
    items: [
      {
        id: 101,
        food_name: "Canned Sardines",
        quantity: 680,
        unit: "Pieces",
        category: "Preserved Food",
        expiration_date: "2026-06-30",
        special_notes: "Keep in cool dry place.",
        photo_url: null,
      },
      {
        id: 102,
        food_name: "White Rice",
        quantity: 50,
        unit: "kg",
        category: "Grains & Cereals",
        expiration_date: "2026-12-31",
        special_notes: "",
        photo_url: null,
      },
    ],
    mode: "pickup",
    pickup_address: "312 A. Mabini, Caloocan City",
    preferred_date: "2026-02-26",
    time_slot_start: "13:00",
    time_slot_end: "15:00",
    stages: {
      preparing: { timestamp: "2023-10-19T12:30:00", status: "done" },
      transit: { timestamp: "2023-10-20T13:00:00", status: "done" },
      received: { timestamp: "2023-10-20T13:45:00", status: "done" },
    },
  },
  {
    id: 2,
    donor_name: "Jollibee",
    overall_status: "pending",
    items: [
      {
        id: 201,
        food_name: "Chicken Joy Pieces",
        quantity: 200,
        unit: "meal",
        category: "Meat",
        expiration_date: "2026-04-15",
        special_notes: "Best consumed within 24 hours.",
        photo_url: null,
      },
    ],
    mode: "pickup",
    pickup_address: "G/F Jollibee Espana, Manila",
    preferred_date: "2026-05-10",
    time_slot_start: "10:00",
    time_slot_end: "12:00",
    stages: {
      preparing: { timestamp: null, status: "awaiting_accept" },
      transit: { timestamp: null, status: "pending" },
      received: { timestamp: null, status: "pending" },
    },
  },
  {
    id: 3,
    donor_name: "Jollibee",
    overall_status: "pending",
    items: [
      {
        id: 301,
        food_name: "Spaghetti",
        quantity: 100,
        unit: "meal",
        category: "Grains & Cereals",
        expiration_date: "2026-04-20",
        special_notes: "",
        photo_url: null,
      },
    ],
    mode: "delivery",
    pickup_address: null,
    preferred_date: "2026-05-12",
    time_slot_start: "09:00",
    time_slot_end: "11:00",
    stages: {
      preparing: { timestamp: "2023-10-19T12:30:00", status: "done" },
      transit: { timestamp: null, status: "awaiting_transit" },
      received: { timestamp: null, status: "pending" },
    },
  },
  {
    id: 4,
    donor_name: "Starbuck Corporation",
    overall_status: "cancelled",
    items: [
      {
        id: 401,
        food_name: "Pastries Assorted",
        quantity: 150,
        unit: "Pieces",
        category: "Sugars & Sweets",
        expiration_date: "2026-04-10",
        special_notes: "Gluten-free options included.",
        photo_url: null,
      },
    ],
    mode: "pickup",
    pickup_address: "Starbucks BGC, Taguig City",
    preferred_date: "2026-04-08",
    time_slot_start: "08:00",
    time_slot_end: "10:00",
    stages: {
      preparing: { timestamp: "2023-10-19T12:30:00", status: "done" },
      transit: { timestamp: "2023-10-20T13:00:00", status: "cancelled" },
      received: { timestamp: null, status: "pending" },
    },
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// DUMMY DATA — TO BENEFICIARY
// Replace with: api.get("/staff/donations/journey/to-beneficiary")
// Expected shape: donation drives that have been allocated
// ─────────────────────────────────────────────────────────────────────────────
const DUMMY_TO_BENEFICIARY = [
  {
    id: 10,
    donor_name: "Jollibee",
    drive_title: "Poblacion Food Drive",
    beneficiary_name: "Barangay Poblacion Relief",
    overall_status: "for_approval",
    // Items from the donation drive's inventory allocation
    items: [
      {
        id: 1001,
        food_name: "Bread",
        goal_qty: 1000,       // locked goal (No. of Request)
        allocated_qty: 0,     // how much staff has already allocated/sent
        expiration_date: "2026-06-30",
      },
      {
        id: 1002,
        food_name: "Bread",
        goal_qty: 1000,
        allocated_qty: 0,
        expiration_date: "2026-06-30",
      },
      {
        id: 1003,
        food_name: "Bread",
        goal_qty: 1000,
        allocated_qty: 0,
        expiration_date: "2026-06-30",
      },
    ],
    preferred_date: "2026-05-10",
    address: "Barangay Poblacion, Makati City",
  },
  {
    id: 11,
    donor_name: "McDonald's Philippines",
    drive_title: "Cubao Relief Pack",
    beneficiary_name: "Cubao Community Center",
    overall_status: "in_transit",
    prepared_at: "2026-05-19T10:00:00",  
    transit_at: null,
    received_at: null,                    
    items: [
      {
        id: 1101,
        food_name: "Burger Patties",
        goal_qty: 300,
        allocated_qty: 300,
        expiration_date: "2026-05-01",
      },
    ],
    preferred_date: "2026-05-20",
    address: "Cubao, Quezon City",
  },
  {
    id: 12,
    donor_name: "Starbuck Corporation",
    drive_title: "BGC Community Drive",
    beneficiary_name: "BGC Shelter",
    overall_status: "completed",
    items: [
      {
        id: 1201,
        food_name: "Canned Sardines",
        goal_qty: 500,
        allocated_qty: 500,
        expiration_date: "2026-08-15",
      },
    ],
    preferred_date: "2026-04-15",
    address: "BGC, Taguig City",
  },
  {
    id: 13,
    donor_name: "Jollibee",
    drive_title: "Pasay Food Pack",
    beneficiary_name: "Pasay Relocation Site",
    overall_status: "cancelled",
    items: [
      {
        id: 1301,
        food_name: "Spaghetti",
        goal_qty: 200,
        allocated_qty: 0,
        expiration_date: "2026-04-20",
      },
    ],
    preferred_date: "2026-04-18",
    address: "Pasay City",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────
function fmtDateTime(iso) {
  if (!iso) return "--/--/---- · --:--";
  const d = new Date(iso);
  return `${d.toLocaleDateString("en-PH", {
    month: "2-digit", day: "2-digit", year: "numeric",
  })} · ${d.toLocaleTimeString("en-PH", {
    hour: "2-digit", minute: "2-digit", hour12: true,
  })}`;
}

function fmtTime(t) {
  if (!t) return "--:--";
  const [h, m] = t.split(":");
  const d = new Date();
  d.setHours(+h, +m);
  return d.toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit", hour12: true });
}

function isExpiringToday(dateStr) {
  if (!dateStr) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const exp = new Date(dateStr);
  exp.setHours(0, 0, 0, 0);
  return exp.getTime() === today.getTime();
}

// ─────────────────────────────────────────────────────────────────────────────
// TOAST COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
function Toast({ toasts, onDismiss }) {
  return (
    <div className="djt-toast-stack">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`djt-toast djt-toast-${t.type}`}
        >
          <span className="material-symbols-rounded djt-toast-icon">
            {t.type === "success" ? "check_circle" :
             t.type === "error"   ? "cancel"       :
             t.type === "warning" ? "warning"       : "info"}
          </span>
          <div className="djt-toast-body">
            <p className="djt-toast-label">{t.label}</p>
            {t.sub && <p className="djt-toast-sub">{t.sub}</p>}
          </div>
          <button className="djt-toast-close" onClick={() => onDismiss(t.id)}>
            <span className="material-symbols-rounded" style={{ fontSize: 16 }}>close</span>
          </button>
        </div>
      ))}
    </div>
  );
}

function useToast() {
  const [toasts, setToasts] = useState([]);
  const timerRefs = useRef({});

  const addToast = useCallback(({ label, sub, type = "success" }) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, label, sub, type }]);
    timerRefs.current[id] = setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
      delete timerRefs.current[id];
    }, TOAST_DURATION);
    return id;
  }, []);

  const dismiss = useCallback((id) => {
    clearTimeout(timerRefs.current[id]);
    delete timerRefs.current[id];
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { toasts, addToast, dismiss };
}

// ─────────────────────────────────────────────────────────────────────────────
// STAGE ICON — FROM DONOR
// ─────────────────────────────────────────────────────────────────────────────
function StageIcon({ stage, status }) {
  const icons = { preparing: "inventory_2", transit: "local_shipping", received: "check_circle" };
  const isDone = status === "done";
  const isCancelled = status === "cancelled";
  return (
    <div className={`djt-stage-icon${isDone ? " djt-stage-icon-done" : ""}${isCancelled ? " djt-stage-icon-cancelled" : ""}`}>
      <span
        className="material-symbols-rounded"
        style={{
          fontVariationSettings: isDone
            ? "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24"
            : "'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24",
        }}
      >
        {isCancelled ? "cancel" : icons[stage]}
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// VIEW DETAILS MODAL — FROM DONOR
// ─────────────────────────────────────────────────────────────────────────────
function ViewDetailsModal({ donation, onClose }) {
  if (!donation) return null;
  const { items, mode, pickup_address, preferred_date, time_slot_start, time_slot_end } = donation;

  return (
    <div className="djt-modal-overlay" onClick={onClose}>
      <div className="djt-modal-wrapper" onClick={(e) => e.stopPropagation()}>
        <div className="djt-modal-left">
          <div className="djt-modal-left-header">
            <h3 className="djt-modal-donor-name">{donation.donor_name}</h3>
            <button className="djt-modal-close" onClick={onClose}>
              <span className="material-symbols-rounded">close</span>
            </button>
          </div>
          <div className="djt-modal-items-list">
            {items.map((item, idx) => (
              <div key={item.id} className="djt-modal-item-block">
                {items.length > 1 && <p className="djt-modal-item-num">Item #{idx + 1}</p>}
                <div className="djt-modal-grid">
                  <span className="djt-modal-key">Food Item Name</span>
                  <span className="djt-modal-val">{item.food_name || "—"}</span>
                  <span className="djt-modal-key">Qty / Units</span>
                  <span className="djt-modal-val">{item.quantity} / {item.unit}</span>
                  <span className="djt-modal-key">Category</span>
                  <span className="djt-modal-val">{item.category || "—"}</span>
                  <span className="djt-modal-key">Expiration Date</span>
                  <span className="djt-modal-val">{item.expiration_date || "—"}</span>
                  {item.special_notes && (
                    <>
                      <span className="djt-modal-key">Special Notes</span>
                      <span className="djt-modal-val djt-modal-notes">{item.special_notes}</span>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
          <hr className="djt-modal-divider" />
          <div className="djt-modal-grid">
            <span className="djt-modal-key">{mode === "pickup" ? "Pickup Address" : "Delivery Mode"}</span>
            <span className="djt-modal-val">{mode === "pickup" ? (pickup_address || "—") : "Drop-off at Warehouse"}</span>
            <span className="djt-modal-key">Preferred Date</span>
            <span className="djt-modal-val">{preferred_date || "—"}</span>
            <span className="djt-modal-key">Time Slot</span>
            <span className="djt-modal-val">{fmtTime(time_slot_start)} - {fmtTime(time_slot_end)}</span>
          </div>
        </div>
        <div className="djt-modal-right">
          {items.map((item, idx) => (
            <div key={item.id} className="djt-modal-img-block">
              {items.length > 1 && <p className="djt-modal-img-label">Item #{idx + 1} Photo</p>}
              {item.photo_url ? (
                <>
                  <p className="djt-modal-img-label">Image Uploaded</p>
                  <img src={item.photo_url} alt={item.food_name} className="djt-modal-img" />
                </>
              ) : (
                <div className="djt-modal-no-img">
                  <span className="material-symbols-rounded">image_not_supported</span>
                  <p>No image uploaded</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FROM DONOR CARD
// ─────────────────────────────────────────────────────────────────────────────
function DonationCard({ donation, onAccept, onDecline, onReceived, onCancelled, onViewDetails }) {
  const { donor_name, overall_status, items, stages, mode, pickup_address, preferred_date, time_slot_start, time_slot_end } = donation;
  const isCancelled = overall_status === "cancelled";
  const isCompleted = overall_status === "completed";

  const itemSummary = items
    .map((it) => `${it.category} | ${it.food_name} | ${it.quantity} ${it.unit}`)
    .join("  ·  ");

  const addressLine = mode === "pickup" ? (pickup_address || "—") : "Drop-off at Warehouse";
  const timeLine    = `${preferred_date} · ${fmtTime(time_slot_start)} - ${fmtTime(time_slot_end)}`;

  let donorBadgeClass = "djt-donor-badge-pending";
  if (isCompleted) donorBadgeClass = "djt-donor-badge-completed";
  if (isCancelled) donorBadgeClass = "djt-donor-badge-cancelled";

  const getStageClass = (stageStatus) => {
    if (stageStatus === "done")             return "djt-stage-active";
    if (stageStatus === "cancelled")        return "djt-stage-cancelled-row";
    if (stageStatus === "awaiting_accept")  return "djt-stage-choice";
    if (stageStatus === "awaiting_transit") return "djt-stage-choice";
    return "djt-stage-muted";
  };

  return (
    <div className={`djt-card${isCancelled ? " djt-card-cancelled" : ""}${isCompleted ? " djt-card-completed" : ""}`}>
      <div className="djt-card-header">
        <span className={`djt-donor-badge ${donorBadgeClass}`}>{donor_name}</span>
        <button className="djt-view-details-btn" onClick={() => onViewDetails(donation)}>
          View More Details
        </button>
      </div>

      {/* Stage 1 */}
      <div className={`djt-stage ${getStageClass(stages.preparing.status)}`}>
        <StageIcon stage="preparing" status={stages.preparing.status} />
        <div className="djt-stage-body">
          <div className="djt-stage-top">
            <span className="djt-stage-title">Preparing Donation</span>
            <span className="djt-stage-time">
              <span className="material-symbols-rounded djt-time-icon">calendar_today</span>
              {fmtDateTime(stages.preparing.timestamp)}
            </span>
          </div>
          <p className="djt-stage-sub">{itemSummary}</p>
          {stages.preparing.status === "awaiting_accept" && (
            <div className="djt-stage-actions">
              <button className="djt-accept-btn" onClick={() => onAccept(donation.id)}>
                <span className="material-symbols-rounded">check_circle</span> Accept
              </button>
              <button className="djt-decline-btn" onClick={() => onDecline(donation.id)}>
                <span className="material-symbols-rounded">cancel</span> Decline
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Stage 2 */}
      <div className={`djt-stage ${getStageClass(stages.transit.status)}`}>
        <StageIcon stage="transit" status={stages.transit.status === "cancelled" ? "cancelled" : stages.transit.status} />
        <div className="djt-stage-body">
          <div className="djt-stage-top">
            <span className="djt-stage-title">Delivery in Transit</span>
            <span className="djt-stage-time">
              <span className="material-symbols-rounded djt-time-icon">calendar_today</span>
              {fmtDateTime(stages.transit.timestamp)}
            </span>
          </div>
          <p className="djt-stage-sub">{addressLine} | {timeLine}</p>
          {stages.transit.status === "awaiting_transit" && (
            <div className="djt-stage-actions">
              <button className="djt-received-btn" onClick={() => onReceived(donation.id)}>
                <span className="material-symbols-rounded">check_circle</span> Received
              </button>
              <button className="djt-cancelled-transit-btn" onClick={() => onCancelled(donation.id)}>
                <span className="material-symbols-rounded">cancel</span> Canceled
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Stage 3 */}
      <div className={`djt-stage ${getStageClass(stages.received.status)}`}>
        <StageIcon stage="received" status={stages.received.status} />
        <div className="djt-stage-body">
          <div className="djt-stage-top">
            <span className="djt-stage-title">Donation Received</span>
            <span className="djt-stage-time">
              <span className="material-symbols-rounded djt-time-icon">calendar_today</span>
              {fmtDateTime(stages.received.timestamp)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TO BENEFICIARY — FOR APPROVAL CARD
// ─────────────────────────────────────────────────────────────────────────────
function BeneficiaryApprovalCard({ drive, onAccept, onDecline }) {
  // inputQtys: { [itemId]: number }
  const [inputQtys, setInputQtys] = useState(() =>
    Object.fromEntries(drive.items.map((it) => [it.id, 0]))
  );

  const remaining = (item) => item.goal_qty - item.allocated_qty;

  const setQty = (id, val, item) => {
    const max = remaining(item);
    const qty = Math.max(0, Math.min(max, Number(val) || 0));
    setInputQtys((prev) => ({ ...prev, [id]: qty }));
  };

  const handleAccept = () => {
    const allocations = drive.items.map((it) => ({
      item_id: it.id,
      qty: inputQtys[it.id] ?? 0,
    }));
    onAccept(drive.id, allocations);
  };

  return (
    <div className="djt-card djt-card-benef">
      {/* Card header */}
      <div className="djt-card-header">
        <span className="djt-donor-badge djt-donor-badge-approval">{drive.donor_name}</span>
        <span style={{ fontSize: 12, color: "#888", fontWeight: 600 }}>{drive.drive_title}</span>
      </div>

      {/* Items table */}
      <div className="djt-benef-table-wrap">
        <table className="djt-benef-table">
          <thead>
            <tr>
              <th style={{ width: 160 }}></th>
              <th>NO. OF REQUEST</th>
              <th>FOOD NAME</th>
              <th>EXP. DATE</th>
            </tr>
          </thead>
          <tbody>
            {drive.items.map((item) => {
              const rem       = remaining(item);
              const qty       = inputQtys[item.id] ?? 0;
              const expToday  = isExpiringToday(item.expiration_date);
              return (
                <tr key={item.id}>
                  {/* Stepper */}
                  <td>
                    <div className="djt-benef-stepper">
                      <button
                        className="djt-benef-stepper-btn"
                        onClick={() => setQty(item.id, qty - 1, item)}
                        disabled={qty <= 0}
                      >−</button>
                      <input
                        className="djt-benef-stepper-input"
                        type="number"
                        min={0}
                        max={rem}
                        value={qty}
                        onChange={(e) => setQty(item.id, e.target.value, item)}
                      />
                      <button
                        className="djt-benef-stepper-btn"
                        onClick={() => setQty(item.id, qty + 1, item)}
                        disabled={qty >= rem}
                      >+</button>
                    </div>
                  </td>
                  {/* No. of Request: allocated / goal */}
                  <td>
                    <span className="djt-benef-goal">
                      <span className="djt-benef-goal-current">{item.allocated_qty.toLocaleString()}</span>
                      <span className="djt-benef-goal-sep">/</span>
                      <span className="djt-benef-goal-total">{item.goal_qty.toLocaleString()}</span>
                    </span>
                  </td>
                  {/* Food Name */}
                  <td style={{ fontWeight: 600, color: "#333" }}>{item.food_name}</td>
                  {/* Exp Date */}
                  <td>
                    <span className={`djt-benef-exp${expToday ? " djt-benef-exp-today" : ""}`}>
                      {item.expiration_date}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Actions */}
      <div className="djt-benef-actions">
        <button className="djt-accept-btn" onClick={handleAccept}>
          <span className="material-symbols-rounded">check_circle</span> Accept
        </button>
        <button className="djt-decline-btn" onClick={() => onDecline(drive.id)}>
          <span className="material-symbols-rounded">cancel</span> Decline
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TO BENEFICIARY — STATUS CARD (in_transit / completed / cancelled)
// Now mirrors the From Donor 3-stage tracker layout
// ─────────────────────────────────────────────────────────────────────────────
function BeneficiaryStatusCard({ drive, onReceived, onCancelled }) {
  const isCancelled = drive.overall_status === "cancelled";
  const isCompleted = drive.overall_status === "completed";
  const isInTransit = drive.overall_status === "in_transit";

  // Build the item summary string from allocated items (qty comes from allocated_qty)
  const itemSummary = drive.items
    .map((it) => `${it.food_name} | ${it.allocated_qty} pcs | Exp: ${it.expiration_date}`)
    .join("  ·  ");

  let donorBadgeClass = "djt-donor-badge-pending";
  if (isCompleted) donorBadgeClass = "djt-donor-badge-completed";
  if (isCancelled) donorBadgeClass = "djt-donor-badge-cancelled";

  // Stage statuses derived from overall_status
  const preparingStatus = "done"; // always done once past for_approval
  const transitStatus   = isCancelled ? "cancelled"
                        : isCompleted ? "done"
                        : isInTransit ? "awaiting_transit"
                        : "pending";
  const receivedStatus  = isCompleted ? "done" : "pending";

  const getStageClass = (stageStatus) => {
    if (stageStatus === "done")             return "djt-stage-active";
    if (stageStatus === "cancelled")        return "djt-stage-cancelled-row";
    if (stageStatus === "awaiting_transit") return "djt-stage-choice";
    return "djt-stage-muted";
  };

  return (
    <div className={`djt-card${isCancelled ? " djt-card-cancelled" : ""}${isCompleted ? " djt-card-completed" : ""}`}>
      {/* Card Header */}
      <div className="djt-card-header">
        <span className={`djt-donor-badge ${donorBadgeClass}`}>{drive.donor_name}</span>
        <span style={{ fontSize: 12, color: "#888", fontWeight: 600 }}>{drive.drive_title}</span>
      </div>

      {/* Stage 1 — Preparing Donation (food list from allocated qty) */}
      <div className={`djt-stage ${getStageClass(preparingStatus)}`}>
        <StageIcon stage="preparing" status={preparingStatus} />
        <div className="djt-stage-body">
          <div className="djt-stage-top">
            <span className="djt-stage-title">Preparing Donation</span>
            <span className="djt-stage-time">
              <span className="material-symbols-rounded djt-time-icon">calendar_today</span>
              {drive.prepared_at ? fmtDateTime(drive.prepared_at) : fmtDateTime(new Date().toISOString())}
            </span>
          </div>
          <p className="djt-stage-sub">{itemSummary}</p>
        </div>
      </div>

      {/* Stage 2 — Delivery in Transit */}
      <div className={`djt-stage ${getStageClass(transitStatus)}`}>
        <StageIcon
          stage="transit"
          status={transitStatus === "cancelled" ? "cancelled" : transitStatus}
        />
        <div className="djt-stage-body">
          <div className="djt-stage-top">
            <span className="djt-stage-title">Delivery in Transit</span>
            <span className="djt-stage-time">
              <span className="material-symbols-rounded djt-time-icon">calendar_today</span>
              {drive.transit_at ? fmtDateTime(drive.transit_at) : "--/--/---- · --:--"}
            </span>
          </div>
          <p className="djt-stage-sub">
            {drive.address} | {drive.preferred_date}
          </p>
          {transitStatus === "awaiting_transit" && (
            <div className="djt-stage-actions">
              <button className="djt-received-btn" onClick={() => onReceived(drive.id)}>
                <span className="material-symbols-rounded">check_circle</span> Received
              </button>
              <button className="djt-cancelled-transit-btn" onClick={() => onCancelled(drive.id)}>
                <span className="material-symbols-rounded">cancel</span> Canceled
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Stage 3 — Donation Received */}
      <div className={`djt-stage ${getStageClass(receivedStatus)}`}>
        <StageIcon stage="received" status={receivedStatus} />
        <div className="djt-stage-body">
          <div className="djt-stage-top">
            <span className="djt-stage-title">Donation Received</span>
            <span className="djt-stage-time">
              <span className="material-symbols-rounded djt-time-icon">calendar_today</span>
              {drive.received_at ? fmtDateTime(drive.received_at) : "--/--/---- · --:--"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function Staff_DonationJourneyTracker() {
  // ── Mode toggle ────────────────────────────────────────────────────────────
  const [mode, setMode] = useState("from_donor"); // "from_donor" | "to_beneficiary"

  // ── FROM DONOR state ───────────────────────────────────────────────────────
  const [donations,      setDonations]      = useState(DUMMY_FROM_DONOR);
  const [donorFilter,    setDonorFilter]    = useState("all");
  const [donorSearch,    setDonorSearch]    = useState("");
  const [detailDonation, setDetailDonation] = useState(null);

  // ── TO BENEFICIARY state ───────────────────────────────────────────────────
  const [drives,         setDrives]         = useState(DUMMY_TO_BENEFICIARY);
  const [benefFilter,    setBenefFilter]    = useState("all");
  const [benefSearch,    setBenefSearch]    = useState("");

  const [loading, setLoading] = useState(false);

  // ── Toast ──────────────────────────────────────────────────────────────────
  const { toasts, addToast, dismiss } = useToast();

  // ── Fetch FROM DONOR ───────────────────────────────────────────────────────
  // useEffect(() => {
  //   if (mode !== "from_donor") return;
  //   setLoading(true);
  //   api.get("/staff/donations/journey/from-donor")
  //     .then((res) => setDonations(res.data))
  //     .catch(console.error)
  //     .finally(() => setLoading(false));
  // }, [mode]);

  // ── Fetch TO BENEFICIARY ───────────────────────────────────────────────────
  // useEffect(() => {
  //   if (mode !== "to_beneficiary") return;
  //   setLoading(true);
  //   api.get("/staff/donations/journey/to-beneficiary")
  //     .then((res) => setDrives(res.data))
  //     .catch(console.error)
  //     .finally(() => setLoading(false));
  // }, [mode]);

  // ─────────────────────────────────────────────────────────────────────────
  // FROM DONOR actions
  // ─────────────────────────────────────────────────────────────────────────
  const handleAccept = useCallback((id) => {
    setDonations((cur) =>
      cur.map((d) =>
        d.id !== id ? d : {
          ...d,
          overall_status: "pending",
          stages: {
            ...d.stages,
            preparing: { timestamp: new Date().toISOString(), status: "done" },
            transit:   { timestamp: null, status: "awaiting_transit" },
          },
        }
      )
    );
    addToast({ label: "Donation accepted", sub: "Moved to Delivery in Transit.", type: "success" });
    // await api.patch(`/staff/donations/journey/${id}/accept`);
  }, [addToast]);

  const handleDecline = useCallback((id) => {
    setDonations((cur) => cur.filter((d) => d.id !== id));
    addToast({ label: "Donation declined", sub: "The donation has been removed.", type: "error" });
    // await api.delete(`/staff/donations/journey/${id}`);
  }, [addToast]);

  const handleReceived = useCallback((id) => {
    const now = new Date().toISOString();
    setDonations((cur) =>
      cur.map((d) =>
        d.id !== id ? d : {
          ...d,
          overall_status: "completed",
          stages: {
            ...d.stages,
            transit:  { timestamp: now, status: "done" },
            received: { timestamp: now, status: "done" },
          },
        }
      )
    );
    addToast({ label: "Donation received", sub: "Marked as completed.", type: "success" });
    // await api.patch(`/staff/donations/journey/${id}/received`);
  }, [addToast]);

  const handleCancelled = useCallback((id) => {
    const now = new Date().toISOString();
    setDonations((cur) =>
      cur.map((d) =>
        d.id !== id ? d : {
          ...d,
          overall_status: "cancelled",
          stages: {
            ...d.stages,
            transit: { timestamp: now, status: "cancelled" },
          },
        }
      )
    );
    addToast({ label: "Transit cancelled", sub: "Donation marked as cancelled.", type: "warning" });
    // await api.patch(`/staff/donations/journey/${id}/cancel`);
  }, [addToast]);

  // ─────────────────────────────────────────────────────────────────────────
  // TO BENEFICIARY actions
  // ─────────────────────────────────────────────────────────────────────────
  const handleBenefAccept = useCallback((driveId, allocations) => {
    setDrives((cur) =>
      cur.map((d) => {
        if (d.id !== driveId) return d;
        // Update allocated_qty for each item based on what was input
        const updatedItems = d.items.map((item) => {
          const alloc = allocations.find((a) => a.item_id === item.id);
          const addedQty = alloc ? alloc.qty : 0;
          return {
            ...item,
            allocated_qty: item.allocated_qty + addedQty,
          };
        });
        // Check if all goals are met → in_transit, else keep for_approval with updated counts
        const allMet = updatedItems.every((it) => it.allocated_qty >= it.goal_qty);
        return {
          ...d,
          items: updatedItems,
          overall_status: allMet ? "in_transit" : "for_approval",
        };
      })
    );
    addToast({ label: "Allocation accepted", sub: "Drive moved to In Transit.", type: "success" });
    // await api.post(`/staff/donations/journey/to-beneficiary/${driveId}/accept`, { allocations });
  }, [addToast]);

  const handleBenefDecline = useCallback((driveId) => {
    setDrives((cur) =>
      cur.map((d) =>
        d.id !== driveId ? d : { ...d, overall_status: "cancelled" }
      )
    );
    addToast({ label: "Drive declined", sub: "Moved to Cancelled.", type: "error" });
    // await api.post(`/staff/donations/journey/to-beneficiary/${driveId}/decline`);
  }, [addToast]);

  const handleBenefReceived = useCallback((driveId) => {
    setDrives((cur) =>
      cur.map((d) =>
        d.id !== driveId ? d : {
          ...d,
          overall_status: "completed",
          received_at: new Date().toISOString(),
        }
      )
    );
    addToast({ label: "Donation received", sub: "Drive marked as completed.", type: "success" });
    // await api.post(`/staff/donations/journey/to-beneficiary/${driveId}/received`);
  }, [addToast]);

  const handleBenefCancelled = useCallback((driveId) => {
    setDrives((cur) =>
      cur.map((d) =>
        d.id !== driveId ? d : {
          ...d,
          overall_status: "cancelled",
          transit_at: new Date().toISOString(),
        }
      )
    );
    addToast({ label: "Transit cancelled", sub: "Drive marked as cancelled.", type: "warning" });
    // await api.post(`/staff/donations/journey/to-beneficiary/${driveId}/cancel`);
  }, [addToast]);

  // ─────────────────────────────────────────────────────────────────────────
  // FILTER — FROM DONOR
  // ─────────────────────────────────────────────────────────────────────────
  const filteredDonations = donations.filter((d) => {
    const matchFilter =
      donorFilter === "all" ||
      (donorFilter === "completed"    && d.overall_status === "completed") ||
      (donorFilter === "cancelled"    && d.overall_status === "cancelled") ||
      (donorFilter === "for approval" && d.stages.preparing.status === "awaiting_accept") ||
      (donorFilter === "in transit"   && d.stages.transit.status === "awaiting_transit");

    const q = donorSearch.toLowerCase();
    const matchSearch =
      !q ||
      d.donor_name.toLowerCase().includes(q) ||
      d.items.some((it) =>
        it.food_name.toLowerCase().includes(q) ||
        it.category.toLowerCase().includes(q)
      );

    return matchFilter && matchSearch;
  });

  // ─────────────────────────────────────────────────────────────────────────
  // FILTER — TO BENEFICIARY
  // ─────────────────────────────────────────────────────────────────────────
  const filteredDrives = drives.filter((d) => {
    const matchFilter =
      benefFilter === "all"          ? true :
      benefFilter === "for_approval" ? d.overall_status === "for_approval" :
      benefFilter === "in_transit"   ? d.overall_status === "in_transit"   :
      benefFilter === "completed"    ? d.overall_status === "completed"    :
      benefFilter === "cancelled"    ? d.overall_status === "cancelled"    :
      true;

    const q = benefSearch.toLowerCase();
    const matchSearch =
      !q ||
      d.donor_name.toLowerCase().includes(q) ||
      d.drive_title.toLowerCase().includes(q) ||
      d.items.some((it) => it.food_name.toLowerCase().includes(q));

    return matchFilter && matchSearch;
  });

  const DONOR_FILTERS    = ["all", "for approval", "in transit", "completed", "cancelled"];
  const BENEFICIARY_FILTERS = [
    { key: "all",          label: "All"          },
    { key: "for_approval", label: "For Approval" },
    { key: "in_transit",   label: "In Transit"   },
    { key: "completed",    label: "Completed"    },
    { key: "cancelled",    label: "Cancelled"    },
  ];

  return (
    <div className="djt-wrapper">
      <NavBar_Staff />

      <main className="djt-main">

        {/* PAGE HEADER */}
        <div className="djt-page-header">
          <div>
            <h1 className="djt-page-title">Donation Journey Tracker</h1>
            <p className="djt-page-sub">Real-time tracking of donations from source to beneficiaries</p>
          </div>

          {/* MODE TOGGLE — replaces pending count badge */}
          <div className="djt-mode-toggle">
            <button
              className={`djt-mode-btn${mode === "from_donor" ? " djt-mode-btn-active" : ""}`}
              onClick={() => setMode("from_donor")}
            >
              From Donor
            </button>
            <button
              className={`djt-mode-btn${mode === "to_beneficiary" ? " djt-mode-btn-active" : ""}`}
              onClick={() => setMode("to_beneficiary")}
            >
              To Beneficiary
            </button>
          </div>
        </div>

        {/* ── FROM DONOR ── */}
        {mode === "from_donor" && (
          <>
            <div className="djt-toolbar">
              <div className="djt-filters">
                {DONOR_FILTERS.map((f) => (
                  <button
                    key={f}
                    className={`djt-filter-tab${donorFilter === f ? " djt-filter-active" : ""}`}
                    onClick={() => setDonorFilter(f)}
                  >
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>
              <div className="djt-search-wrap">
                <input
                  className="djt-search"
                  type="text"
                  placeholder="Search"
                  value={donorSearch}
                  onChange={(e) => setDonorSearch(e.target.value)}
                />
                <span className="material-symbols-rounded djt-search-icon">search</span>
              </div>
            </div>

            {loading ? (
              <p className="djt-empty">Loading donations…</p>
            ) : filteredDonations.length === 0 ? (
              <p className="djt-empty">No donations found.</p>
            ) : (
              <div className="djt-cards-list">
                {filteredDonations.map((d) => (
                  <DonationCard
                    key={d.id}
                    donation={d}
                    onAccept={handleAccept}
                    onDecline={handleDecline}
                    onReceived={handleReceived}
                    onCancelled={handleCancelled}
                    onViewDetails={setDetailDonation}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* ── TO BENEFICIARY ── */}
        {mode === "to_beneficiary" && (
          <>
            <div className="djt-toolbar">
              <div className="djt-filters">
                {BENEFICIARY_FILTERS.map((f) => (
                  <button
                    key={f.key}
                    className={`djt-filter-tab${benefFilter === f.key ? " djt-filter-active" : ""}`}
                    onClick={() => setBenefFilter(f.key)}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
              <div className="djt-search-wrap">
                <input
                  className="djt-search"
                  type="text"
                  placeholder="Search"
                  value={benefSearch}
                  onChange={(e) => setBenefSearch(e.target.value)}
                />
                <span className="material-symbols-rounded djt-search-icon">search</span>
              </div>
            </div>

            {loading ? (
              <p className="djt-empty">Loading drives…</p>
            ) : filteredDrives.length === 0 ? (
              <p className="djt-empty">No drives found.</p>
            ) : (
              <div className="djt-cards-list">
                {filteredDrives.map((d) =>
                  d.overall_status === "for_approval" ? (
                    <BeneficiaryApprovalCard
                      key={d.id}
                      drive={d}
                      onAccept={handleBenefAccept}
                      onDecline={handleBenefDecline}
                    />
                  ) : (
                    <BeneficiaryStatusCard
                      key={d.id}
                      drive={d}
                      onReceived={handleBenefReceived}
                      onCancelled={handleBenefCancelled}
                    />
                  )
                )}
              </div>
            )}
          </>
        )}

      </main>

      {/* VIEW DETAILS MODAL */}
      {detailDonation && (
        <ViewDetailsModal
          donation={detailDonation}
          onClose={() => setDetailDonation(null)}
        />
      )}

      {/* TOAST STACK */}
      <Toast toasts={toasts} onDismiss={dismiss} />
    </div>
  );
}
