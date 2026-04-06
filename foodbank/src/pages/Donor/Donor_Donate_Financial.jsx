import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import NavBar_Donor from "../../components/NavBar_Donor";
import api from "../../services/api";

// ── CONSTANTS ────────────────────────────────────────────────────────────────

const EWALLET_CHOICES = ["GCash", "Bank Transfer"];

// ── EMPTY FORM STATE ─────────────────────────────────────────────────────────

const EMPTY_FORM = {
  payment_method:   "",       // "GCash" | "Bank Transfer"
  receipt:          null,     // File object
  receipt_preview:  null,     // local object URL for preview
  receipt_number:   "",
  amount:           "",       // in PHP peso
  date:             "",
  time:             "",
  message:          "",       // optional
};

// ── COMPONENT ────────────────────────────────────────────────────────────────

export default function Donor_Donate_Financial() {
  const navigate   = useNavigate();
  const fileRef    = useRef(null);

  const [form,   setForm]   = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState(null); // null | "loading" | "success" | "error"
  const [qrZoomed, setQrZoomed] = useState(false);

  // ── Field change handler ─────────────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
  };

  // ── Receipt file upload ──────────────────────────────────────────────────
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type — accept images and PDF only
    const allowed = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (!allowed.includes(file.type)) {
      setErrors((prev) => ({ ...prev, receipt: "Only JPG, PNG, WEBP, or PDF files are allowed." }));
      return;
    }

    // Validate size — max 5 MB
    if (file.size > 5 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, receipt: "File must be under 5 MB." }));
      return;
    }

    const preview = file.type.startsWith("image/") ? URL.createObjectURL(file) : null;
    setForm((prev) => ({ ...prev, receipt: file, receipt_preview: preview }));
    setErrors((prev) => ({ ...prev, receipt: null }));
  };

  const handleRemoveFile = () => {
    if (form.receipt_preview) URL.revokeObjectURL(form.receipt_preview);
    setForm((prev) => ({ ...prev, receipt: null, receipt_preview: null }));
    if (fileRef.current) fileRef.current.value = "";
  };

  // ── Validation ───────────────────────────────────────────────────────────
  const validate = () => {
    const e = {};

    if (!form.payment_method)
      e.payment_method = "Please select a payment method.";

    if (!form.receipt)
      e.receipt = "Please upload your receipt.";

    if (!form.receipt_number.trim())
      e.receipt_number = "Receipt number is required.";

    if (!form.amount || isNaN(Number(form.amount)) || Number(form.amount) < 1)
      e.amount = "Enter a valid donation amount (₱1 minimum).";

    if (!form.date)
      e.date = "Please select a date.";

    if (!form.time)
      e.time = "Please select a time.";

    // message is optional — no validation

    return e;
  };

  // ── Submit ───────────────────────────────────────────────────────────────
  // Backend: POST /api/donor/donations  (multipart/form-data)
  // Fields:
  //   type             → "financial"
  //   payment_method   → "GCash" | "Bank Transfer"
  //   receipt          → File (binary)
  //   receipt_number   → string
  //   amount           → number (PHP peso)
  //   date             → "YYYY-MM-DD"
  //   time             → "HH:MM"
  //   message          → string | null
  // Returns: { id, status: "pending", created_at, ... }
  const handleSubmit = async () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setStatus("loading");
    try {
      const fd = new FormData();
      fd.append("type",           "financial");
      fd.append("payment_method", form.payment_method);
      fd.append("receipt",        form.receipt);
      fd.append("receipt_number", form.receipt_number);
      fd.append("amount",         form.amount);
      fd.append("date",           form.date);
      fd.append("time",           form.time);
      if (form.message.trim()) fd.append("message", form.message);

      await api.post("/donor/donations", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setStatus("success");
      // Revoke preview URL to free memory
      if (form.receipt_preview) URL.revokeObjectURL(form.receipt_preview);
      setForm(EMPTY_FORM);
      if (fileRef.current) fileRef.current.value = "";
    } catch {
      setStatus("error");
    }
  };

  // ── Helpers ──────────────────────────────────────────────────────────────
  const inp = (name) =>
    `don-fin-input${errors[name] ? " don-fin-input-err" : ""}`;

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="don-fin-wrapper">

      {/* ── NAVBAR ── */}
      <NavBar_Donor />

      <main className="don-fin-main">

        {/* ── PAGE HEADER ── */}
        <div className="don-fin-page-header">
          <div className="don-fin-title-row">
            <img
              src="/images/Donor_Financial.png"
              alt="Financial Donation"
              className="don-fin-title-icon"
            />
            <h1 className="don-fin-page-title">Financial Donation</h1>
          </div>
          <hr className="don-fin-page-divider" />
        </div>

        {/* ── FORM CARD ── */}
        <div className="don-fin-card">

          {/* ── LEFT COLUMN ── */}
          <div className="don-fin-left">

            {/* Payment Method */}
            <div className="don-fin-field">
              <label className="don-fin-label">Payment Method</label>
              <select
                className={inp("payment_method") + " don-fin-select"}
                name="payment_method"
                value={form.payment_method}
                onChange={handleChange}
              >
                <option value="" disabled>Select E-Wallet</option>
                {EWALLET_CHOICES.map((w) => (
                  <option key={w} value={w}>{w}</option>
                ))}
              </select>
              {errors.payment_method && (
                <span className="don-fin-err">{errors.payment_method}</span>
              )}
            </div>

            {/* Upload Receipt */}
            <div className="don-fin-field">
              <div
                className={`don-fin-upload-box${errors.receipt ? " don-fin-upload-err" : ""}${form.receipt ? " don-fin-upload-has-file" : ""}`}
                onClick={() => fileRef.current?.click()}
              >
                {form.receipt_preview ? (
                  <img
                    src={form.receipt_preview}
                    alt="Receipt preview"
                    className="don-fin-receipt-preview"
                  />
                ) : (
                  <>
                    <span className="material-symbols-rounded don-fin-upload-icon">upload</span>
                    <span className="don-fin-upload-text">
                      {form.receipt ? form.receipt.name : "Upload Receipt"}
                    </span>
                  </>
                )}
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                style={{ display: "none" }}
                onChange={handleFileChange}
              />
              {form.receipt && (
                <button
                  className="don-fin-remove-file-btn"
                  onClick={handleRemoveFile}
                  type="button"
                >
                  ✕ Remove file
                </button>
              )}
              {errors.receipt && (
                <span className="don-fin-err">{errors.receipt}</span>
              )}
            </div>

            {/* Receipt Number + E-Wallet row */}
            <div className="don-fin-row">
              <div className="don-fin-field don-fin-field-grow">
                <input
                  className={inp("receipt_number")}
                  type="text"
                  name="receipt_number"
                  placeholder="Receipt Number"
                  value={form.receipt_number}
                  onChange={handleChange}
                />
                {errors.receipt_number && (
                  <span className="don-fin-err">{errors.receipt_number}</span>
                )}
              </div>
              <div className="don-fin-field don-fin-field-sm">
                {/* Read-only mirror of payment_method for display */}
                <div className="don-fin-ewallet-badge">
                  {form.payment_method || "E-wallet"}
                </div>
              </div>
            </div>

            {/* Donation Amount */}
            <div className="don-fin-field">
              <label className="don-fin-label">Donation Amount</label>
              <div className="don-fin-amount-wrap">
                <span className="don-fin-peso-sign">₱</span>
                <input
                  className={inp("amount") + " don-fin-amount-input"}
                  type="number"
                  name="amount"
                  min="1"
                  placeholder="Enter Donation Amount"
                  value={form.amount}
                  onChange={handleChange}
                />
              </div>
              {errors.amount && (
                <span className="don-fin-err">{errors.amount}</span>
              )}
            </div>

            {/* Date + Time row */}
            <div className="don-fin-row">
              <div className="don-fin-field don-fin-field-half">
                <label className="don-fin-label">Date</label>
                <input
                  className={inp("date")}
                  type="date"
                  name="date"
                  value={form.date}
                  onChange={handleChange}
                />
                {errors.date && (
                  <span className="don-fin-err">{errors.date}</span>
                )}
              </div>
              <div className="don-fin-field don-fin-field-half">
                <label className="don-fin-label">Time</label>
                <input
                  className={inp("time")}
                  type="time"
                  name="time"
                  value={form.time}
                  onChange={handleChange}
                />
                {errors.time && (
                  <span className="don-fin-err">{errors.time}</span>
                )}
              </div>
            </div>

            {/* Message (optional) */}
            <div className="don-fin-field">
              <label className="don-fin-label">
                Message{" "}
                <span className="don-fin-label-opt">(Optional)</span>
              </label>
              <textarea
                className="don-fin-input don-fin-textarea"
                name="message"
                placeholder="Leave a message…"
                value={form.message}
                onChange={handleChange}
              />
            </div>

          </div>
          {/* end left */}

          {/* ── RIGHT COLUMN — QR ── */}
          <div className="don-fin-right">
            <p className="don-fin-qr-label">Scan First to Donate</p>
            <div className="don-fin-qr-frame" onClick={() => setQrZoomed(true)}>
                <img src="/images/QR_SAMPLE.png" alt="Donation QR Code" className="don-fin-qr-img" />
                <div className="don-fin-qr-shine" />
            </div>

            {qrZoomed && (
                <div className="don-fin-qr-overlay" onClick={() => setQrZoomed(false)}>
                    <div className="don-fin-qr-zoom-box" onClick={(e) => e.stopPropagation()}>
                    <img src="/images/QR_SAMPLE.png" alt="Donation QR Code" className="don-fin-qr-zoom-img" />
                    <p className="don-fin-qr-zoom-hint">Tap outside to close</p>
                    </div>
                </div>
            )}
            <p className="don-fin-qr-hint">
              Scan the QR code, complete your payment, then upload your receipt above.
            </p>
          </div>

        </div>
        {/* end don-fin-card */}

        {/* ── STATUS MESSAGES ── */}
        {status === "success" && (
          <p className="don-fin-status don-fin-status-success">
            ✓ Financial donation submitted successfully!
          </p>
        )}
        {status === "error" && (
          <p className="don-fin-status don-fin-status-error">
            Something went wrong. Please try again.
          </p>
        )}

        {/* ── SUBMIT ROW ── */}
        <div className="don-fin-submit-row">
          <button
            className="don-fin-cancel-btn"
            onClick={() => navigate("/donor/donate")}
          >
            Cancel
          </button>
          <button
            className="don-fin-submit-btn"
            onClick={handleSubmit}
            disabled={status === "loading" || status === "success"}
          >
            {status === "loading"
              ? "Submitting…"
              : status === "success"
              ? "Submitted ✓"
              : "Submit"}
          </button>
        </div>

      </main>
    </div>
  );
}
