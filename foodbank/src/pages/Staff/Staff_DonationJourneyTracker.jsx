import { useState, useEffect, useCallback, useRef } from "react";
import NavBar_Staff from "../../components/NavBar_Staff";
import api from "../../services/api";

// ── DUMMY DATA (remove when backend is ready) ─────────────────────────────────
const DUMMY_DONATIONS = [
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
        special_notes: "Keep in cool dry place. Do not expose to direct sunlight.",
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
      transit:   { timestamp: "2023-10-20T13:00:00", status: "done" },
      received:  { timestamp: "2023-10-20T13:45:00", status: "done" },
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
        special_notes: "Best consumed within 24 hours of pickup.",
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
      transit:   { timestamp: null, status: "pending" },
      received:  { timestamp: null, status: "pending" },
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
      transit:   { timestamp: null, status: "awaiting_transit" },
      received:  { timestamp: null, status: "pending" },
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
      transit:   { timestamp: "2023-10-20T13:00:00", status: "cancelled" },
      received:  { timestamp: null, status: "pending" },
    },
  },
  {
    id: 5,
    donor_name: "McDonald's Philippines",
    overall_status: "pending",
    items: [
      {
        id: 501,
        food_name: "Burger Patties",
        quantity: 300,
        unit: "Pieces",
        category: "Meat",
        expiration_date: "2026-05-01",
        special_notes: "Frozen. Keep at -18°C.",
        photo_url: null,
      },
    ],
    mode: "pickup",
    pickup_address: "McDonald's Cubao, Quezon City",
    preferred_date: "2026-05-20",
    time_slot_start: "14:00",
    time_slot_end: "16:00",
    stages: {
      preparing: { timestamp: null, status: "awaiting_accept" },
      transit:   { timestamp: null, status: "pending" },
      received:  { timestamp: null, status: "pending" },
    },
  },
];
// ── END DUMMY DATA ─────────────────────────────────────────────────────────────

const UNDO_DURATION = 5000; // ms

// ── HELPERS ───────────────────────────────────────────────────────────────────
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

function pendingCount(donations) {
  return donations.filter((d) => d.overall_status === "pending").length;
}

// ── STAGE ICON ────────────────────────────────────────────────────────────────
function StageIcon({ stage, status }) {
  const icons = { preparing: "inventory_2", transit: "local_shipping", received: "check_circle" };
  const isDone      = status === "done";
  const isCancelled = status === "cancelled";
  return (
    <div
      className={`djt-stage-icon${isDone ? " djt-stage-icon-done" : ""}${isCancelled ? " djt-stage-icon-cancelled" : ""}`}
    >
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

// ── VIEW DETAILS MODAL ────────────────────────────────────────────────────────
function ViewDetailsModal({ donation, onClose }) {
  if (!donation) return null;
  const { items, mode, pickup_address, preferred_date, time_slot_start, time_slot_end } = donation;

  return (
    <div className="djt-modal-overlay" onClick={onClose}>
      <div className="djt-modal-wrapper" onClick={(e) => e.stopPropagation()}>

        {/* LEFT: Details */}
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
            <span className="djt-modal-key">
              {mode === "pickup" ? "Pickup Address" : "Delivery Mode"}
            </span>
            <span className="djt-modal-val">
              {mode === "pickup" ? (pickup_address || "—") : "Drop-off at Warehouse"}
            </span>
            <span className="djt-modal-key">Preferred Date</span>
            <span className="djt-modal-val">{preferred_date || "—"}</span>
            <span className="djt-modal-key">Time Slot</span>
            <span className="djt-modal-val">
              {fmtTime(time_slot_start)} - {fmtTime(time_slot_end)}
            </span>
          </div>
        </div>

        {/* RIGHT: Image */}
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

// ── DONATION CARD ─────────────────────────────────────────────────────────────
function DonationCard({ donation, onAccept, onDecline, onReceived, onCancelled, onViewDetails }) {
  const {
    donor_name, overall_status, items, stages,
    mode, pickup_address, preferred_date, time_slot_start, time_slot_end,
  } = donation;

  const isCancelled = overall_status === "cancelled";
  const isCompleted = overall_status === "completed";

  const itemSummary = items
    .map((it) => `${it.category} | ${it.food_name} | ${it.quantity} ${it.unit}`)
    .join("  ·  ");

  const addressLine = mode === "pickup" ? (pickup_address || "—") : "Drop-off at Warehouse";
  const timeLine    = `${preferred_date} · ${fmtTime(time_slot_start)} - ${fmtTime(time_slot_end)}`;

  // Donor badge colour
  let donorBadgeClass = "djt-donor-badge-pending";
  if (isCompleted) donorBadgeClass = "djt-donor-badge-completed";
  if (isCancelled) donorBadgeClass = "djt-donor-badge-cancelled";

  // Stage class logic
  // "awaiting_accept" / "awaiting_transit" → gray bg, full opacity (djt-stage-choice)
  const getStageClass = (stageStatus) => {
    if (stageStatus === "done")             return "djt-stage-active";
    if (stageStatus === "cancelled")        return "djt-stage-cancelled-row";
    if (stageStatus === "awaiting_accept")  return "djt-stage-choice";
    if (stageStatus === "awaiting_transit") return "djt-stage-choice";
    return "djt-stage-muted";
  };

  return (
    <div
      className={`djt-card${isCancelled ? " djt-card-cancelled" : ""}${isCompleted ? " djt-card-completed" : ""}`}
    >
      {/* Card Header */}
      <div className="djt-card-header">
        <span className={`djt-donor-badge ${donorBadgeClass}`}>{donor_name}</span>
        <button className="djt-view-details-btn" onClick={() => onViewDetails(donation)}>
          View More Details
        </button>
      </div>

      {/* Stage 1 — Preparing Donation */}
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

      {/* Stage 2 — Delivery in Transit */}
      <div className={`djt-stage ${getStageClass(stages.transit.status)}`}>
        <StageIcon
          stage="transit"
          status={stages.transit.status === "cancelled" ? "cancelled" : stages.transit.status}
        />
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

      {/* Stage 3 — Donation Received */}
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

// ── UNDO TOAST ────────────────────────────────────────────────────────────────
function UndoToast({ toast, onUndo, onDismiss }) {
  const [progress, setProgress] = useState(1);
  const rafRef   = useRef(null);
  const startRef = useRef(null);

  useEffect(() => {
    if (!toast) return;
    startRef.current = performance.now();
    setProgress(1);

    const tick = (now) => {
      const elapsed   = now - startRef.current;
      const remaining = Math.max(0, 1 - elapsed / UNDO_DURATION);
      setProgress(remaining);
      if (remaining > 0) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [toast]);

  if (!toast) return null;

  const isDestructive = toast.actionType === "decline" || toast.actionType === "cancel";

  return (
    <div className={`djt-undo-toast${isDestructive ? " djt-undo-toast-destructive" : " djt-undo-toast-neutral"}`}>
      {/* Countdown progress bar — drains left to right */}
      <div className="djt-undo-progress-track">
        <div
          className={`djt-undo-progress-fill${isDestructive ? " djt-undo-progress-destructive" : " djt-undo-progress-neutral"}`}
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      <div className="djt-undo-content">
        {/* Icon */}
        <div className={`djt-undo-icon-wrap${isDestructive ? " djt-undo-icon-destructive" : " djt-undo-icon-neutral"}`}>
          <span
            className="material-symbols-rounded"
            style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24", fontSize: 20 }}
          >
            {isDestructive ? "warning" : "check_circle"}
          </span>
        </div>

        {/* Text */}
        <div className="djt-undo-text">
          <p className="djt-undo-label">{toast.label}</p>
          <p className="djt-undo-sub">{toast.sub}</p>
        </div>

        {/* Undo button */}
        <button className="djt-undo-btn" onClick={onUndo}>
          <span className="material-symbols-rounded" style={{ fontSize: 16 }}>undo</span>
          Undo
        </button>

        {/* Dismiss */}
        <button className="djt-undo-dismiss" onClick={onDismiss} title="Dismiss">
          <span className="material-symbols-rounded" style={{ fontSize: 18 }}>close</span>
        </button>
      </div>
    </div>
  );
}

// ── MAIN COMPONENT ────────────────────────────────────────────────────────────
export default function Staff_DonationJourneyTracker() {
  const [donations,      setDonations]      = useState(DUMMY_DONATIONS);
  const [filter,         setFilter]         = useState("all");
  const [search,         setSearch]         = useState("");
  const [detailDonation, setDetailDonation] = useState(null);
  const [loading,        setLoading]        = useState(false);

  // Undo state — { label, sub, actionType, revertFn }
  const [undoToast,    setUndoToast]    = useState(null);
  const commitTimerRef                  = useRef(null);

  // ── Fetch from backend (uncomment when ready) ────────────────────────────
  // useEffect(() => {
  //   setLoading(true);
  //   api.get("/staff/donations/journey")
  //     .then((res) => setDonations(res.data))
  //     .catch(console.error)
  //     .finally(() => setLoading(false));
  // }, []);

  // ── Undo helpers ──────────────────────────────────────────────────────────
  const clearUndo = useCallback(() => {
    clearTimeout(commitTimerRef.current);
    setUndoToast(null);
  }, []);

  /**
   * opts:
   *   label      — main toast message
   *   sub        — secondary detail
   *   actionType — "accept" | "decline" | "received" | "cancel"
   *   revertFn   — () => void   reverse the optimistic update
   *   commitFn   — async () => void   API call after 5 s
   */
  const showUndo = useCallback(({ label, sub, actionType, revertFn, commitFn }) => {
    // Clear any existing undo first
    clearTimeout(commitTimerRef.current);

    setUndoToast({ label, sub, actionType, revertFn });

    commitTimerRef.current = setTimeout(async () => {
      setUndoToast(null);
      try {
        await commitFn?.();
      } catch {
        // If the API call fails after timeout, silently revert
        revertFn?.();
      }
    }, UNDO_DURATION);
  }, []);

  const handleUndo = useCallback(() => {
    if (!undoToast) return;
    clearTimeout(commitTimerRef.current);
    undoToast.revertFn?.();
    setUndoToast(null);
  }, [undoToast]);

  // ── Accept ────────────────────────────────────────────────────────────────
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

    showUndo({
      label:      "Donation accepted",
      sub:        "Moved to Delivery in Transit. Commit in 5 s…",
      actionType: "accept",
      revertFn: () =>
        setDonations((cur) =>
          cur.map((d) =>
            d.id !== id ? d : {
              ...d,
              overall_status: "pending",
              stages: {
                ...d.stages,
                preparing: { timestamp: null, status: "awaiting_accept" },
                transit:   { timestamp: null, status: "pending" },
              },
            }
          )
        ),
      commitFn: async () => {
        // await api.patch(`/staff/donations/journey/${id}/accept`);
      },
    });
  }, [showUndo]);

  // ── Decline ───────────────────────────────────────────────────────────────
  const handleDecline = useCallback((id) => {
    let removed = null;

    setDonations((cur) => {
      removed = cur.find((d) => d.id === id) || null;
      return cur.filter((d) => d.id !== id);
    });

    showUndo({
      label:      "Donation declined",
      sub:        "The donation was removed. Commit in 5 s…",
      actionType: "decline",
      revertFn: () => {
        if (!removed) return;
        setDonations((cur) => {
          if (cur.find((d) => d.id === id)) return cur;
          return [...cur, removed].sort((a, b) => a.id - b.id);
        });
      },
      commitFn: async () => {
        // await api.delete(`/staff/donations/journey/${id}`);
      },
    });
  }, [showUndo]);

  // ── Received ──────────────────────────────────────────────────────────────
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

    showUndo({
      label:      "Donation received",
      sub:        "Marked as completed. Commit in 5 s…",
      actionType: "received",
      revertFn: () =>
        setDonations((cur) =>
          cur.map((d) =>
            d.id !== id ? d : {
              ...d,
              overall_status: "pending",
              stages: {
                ...d.stages,
                transit:  { timestamp: null, status: "awaiting_transit" },
                received: { timestamp: null, status: "pending" },
              },
            }
          )
        ),
      commitFn: async () => {
        // await api.patch(`/staff/donations/journey/${id}/received`);
      },
    });
  }, [showUndo]);

  // ── Cancelled (transit) ───────────────────────────────────────────────────
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

    showUndo({
      label:      "Donation cancelled",
      sub:        "Transit marked as cancelled. Commit in 5 s…",
      actionType: "cancel",
      revertFn: () =>
        setDonations((cur) =>
          cur.map((d) =>
            d.id !== id ? d : {
              ...d,
              overall_status: "pending",
              stages: {
                ...d.stages,
                transit: { timestamp: null, status: "awaiting_transit" },
              },
            }
          )
        ),
      commitFn: async () => {
        // await api.patch(`/staff/donations/journey/${id}/cancel`);
      },
    });
  }, [showUndo]);

  // ── Filter + Search ───────────────────────────────────────────────────────
  const filtered = donations.filter((d) => {
    const matchFilter =
        filter === "all" ||
        (filter === "completed"    && d.overall_status === "completed") ||
        (filter === "cancelled"    && d.overall_status === "cancelled") ||
        (filter === "for approval" && d.overall_status === "pending" &&
            d.stages.preparing.status === "awaiting_accept") ||
        (filter === "in transit"   && d.overall_status === "pending" &&
            d.stages.transit.status === "awaiting_transit");

    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      d.donor_name.toLowerCase().includes(q) ||
      d.items.some(
        (it) =>
          it.food_name.toLowerCase().includes(q) ||
          it.category.toLowerCase().includes(q)
      );

    return matchFilter && matchSearch;
  });

  const pending = pendingCount(donations);

  return (
    <div className="djt-wrapper">
      <NavBar_Staff />

      <main className="djt-main">

        {/* PAGE HEADER */}
        <div className="djt-page-header">
          <div>
            <h1 className="djt-page-title">Donation Journey Tracker</h1>
            <p className="djt-page-sub">
              Real-time tracking of donations from source to beneficiaries
            </p>
          </div>
          {pending > 0 && (
            <div className="djt-pending-badge">
              <span className="material-symbols-rounded djt-pending-icon">schedule</span>
              {pending} Pending
            </div>
          )}
        </div>

        {/* TOOLBAR */}
        <div className="djt-toolbar">
          <div className="djt-filters">
            {["all", "for approval", "in transit", "completed", "cancelled"].map((f) => (
                <button
                    key={f}
                    className={`djt-filter-tab${filter === f ? " djt-filter-active" : ""}`}
                    onClick={() => setFilter(f)}
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
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <span className="material-symbols-rounded djt-search-icon">search</span>
          </div>
        </div>

        {/* CARDS */}
        {loading ? (
          <p className="djt-empty">Loading donations…</p>
        ) : filtered.length === 0 ? (
          <p className="djt-empty">No donations found.</p>
        ) : (
          <div className="djt-cards-list">
            {filtered.map((d) => (
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

      </main>

      {/* VIEW DETAILS MODAL */}
      {detailDonation && (
        <ViewDetailsModal
          donation={detailDonation}
          onClose={() => setDetailDonation(null)}
        />
      )}

      {/* UNDO TOAST */}
      <UndoToast
        toast={undoToast}
        onUndo={handleUndo}
        onDismiss={clearUndo}
      />
    </div>
  );
}
