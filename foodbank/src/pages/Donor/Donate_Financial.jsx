import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import NavBar_Donor from "../../components/NavBar_Donor";
import api from "../../services/api";

const INITIAL_FORM = {
  receipt_number:  "",
  payment_method:  "",
  amount:          "",
  date:            "",
  time:            "",
  message:         "",
};

export default function DonateFinancial() {
  const navigate = useNavigate();

  const [form, setForm]               = useState(INITIAL_FORM);
  const [errors, setErrors]           = useState({});
  const [submitting, setSubmitting]   = useState(false);
  const [submitted, setSubmitted]     = useState(false);
  const [qrZoom, setQrZoom]           = useState(false);

  // Receipt file state
  const [receiptFile, setReceiptFile]         = useState(null);
  const [receiptPreview, setReceiptPreview]   = useState(null);
  const [extracting, setExtracting]           = useState(false); // OCR flag — wire up backend later
  const fileInputRef = useRef(null);

  // ── Field change ────────────────────────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  // ── Receipt upload ──────────────────────────────────────────────────────────
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowed = ["image/png", "image/jpeg", "image/jpg"];
    if (!allowed.includes(file.type)) {
      setErrors((prev) => ({ ...prev, receipt: "Only PNG or JPEG files are allowed." }));
      return;
    }

    setErrors((prev) => ({ ...prev, receipt: "" }));
    setReceiptFile(file);
    setReceiptPreview(URL.createObjectURL(file));

    // ── OCR / text-image detector hook ─────────────────────────────────────
    // TODO: When backend OCR is ready, uncomment and implement:
    //
    // setExtracting(true);
    // try {
    //   const formData = new FormData();
    //   formData.append("receipt", file);
    //   const res = await api.post("/donor/donations/financial/extract-receipt", formData, {
    //     headers: { "Content-Type": "multipart/form-data" },
    //   });
    //   // Auto-fill fields from OCR result — user can still edit after
    //   setForm((prev) => ({
    //     ...prev,
    //     receipt_number: res.data.receipt_number ?? prev.receipt_number,
    //     amount:         res.data.amount         ?? prev.amount,
    //     date:           res.data.date           ?? prev.date,   // expect "YYYY-MM-DD"
    //     time:           res.data.time           ?? prev.time,   // expect "HH:MM"
    //   }));
    // } catch (err) {
    //   console.error("OCR extraction error:", err);
    // } finally {
    //   setExtracting(false);
    // }
  };

  const handleRemoveFile = () => {
    setReceiptFile(null);
    setReceiptPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ── Validation ──────────────────────────────────────────────────────────────
  const validate = () => {
    const errs = {};

    if (!receiptFile) errs.receipt = "Please upload a receipt (PNG or JPEG).";

    if (!form.receipt_number.trim())
      errs.receipt_number = "Receipt number is required.";

    if (!form.payment_method)
      errs.payment_method = "Please select a payment method.";

    if (!form.amount) {
      errs.amount = "Donation amount is required.";
    } else if (isNaN(form.amount) || Number(form.amount) <= 0) {
      errs.amount = "Enter a valid amount greater than 0.";
    }

    if (!form.date) errs.date = "Date is required.";
    if (!form.time) errs.time = "Time is required.";

    return errs;
  };

  // ── Submit ──────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setSubmitting(true);
    try {
      // Send as multipart/form-data so receipt image is included
      const payload = new FormData();
      payload.append("receipt_image",  receiptFile);
      payload.append("receipt_number", form.receipt_number);
      payload.append("payment_method", form.payment_method);
      payload.append("amount",         form.amount);
      payload.append("date",           form.date);
      payload.append("time",           form.time);
      payload.append("message",        form.message);

      await api.post("/donor/donations/financial", payload, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setSubmitted(true);
    } catch (err) {
      console.error("Financial donation submit error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Success screen ──────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="df-wrapper">
        <NavBar_Donor />
        <div className="df-success-screen">
          <div className="df-success-card">
            <span className="material-symbols-rounded df-success-icon">check_circle</span>
            <h2 className="df-success-title">Financial Donation Submitted!</h2>
            <p className="df-success-sub">
              Thank you for your generous contribution. We will verify your receipt shortly.
            </p>
            <div className="df-success-btns">
              <button className="df-success-btn-home" onClick={() => navigate("/donate")}>
                Back to Donate
              </button>
              <button className="df-success-btn-dash" onClick={() => navigate("/donor/dashboard")}>
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="df-wrapper">
      <NavBar_Donor />

      {/* ── QR ZOOM MODAL ── */}
      {qrZoom && (
        <div className="df-qr-modal-overlay" onClick={() => setQrZoom(false)}>
          <div className="df-qr-modal" onClick={(e) => e.stopPropagation()}>
            <button className="df-qr-modal-close" onClick={() => setQrZoom(false)}>
              <span className="material-symbols-rounded">close</span>
            </button>
            <p className="df-qr-modal-label">Scan to Donate</p>
            <img
              src="/images/donate_qr.png"
              alt="QR Code"
              className="df-qr-modal-img"
            />
            <p className="df-qr-modal-hint">Click anywhere outside to close</p>
          </div>
        </div>
      )}

      <div className="df-page">

        {/* ── PAGE TITLE ── */}
        <div className="df-title-section">
          <h1 className="df-page-title">
            <img
              src="/images/Donor_Financial_Dark.png"
              alt="Financial"
              className="df-title-icon"
            />
            Financial Donation
          </h1>
          <hr className="df-title-divider" />
        </div>

        {/* ── FORM CARD ── */}
        <form className="df-form-card" onSubmit={handleSubmit} noValidate>

          {/* TOP ROW: Left (upload + receipt/method) | Right (QR) */}
          <div className="df-top-row">

            {/* LEFT COLUMN */}
            <div className="df-left-col">

              {/* Payment Method label */}
              <label className="df-label">Payment Method</label>

              {/* Upload Receipt */}
              <div
                className={`df-upload-zone ${receiptFile ? "df-upload-zone-filled" : ""} ${errors.receipt ? "df-upload-error" : ""}`}
                onClick={() => !receiptFile && fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png, image/jpeg"
                  className="df-file-input"
                  onChange={handleFileChange}
                />

                {receiptFile ? (
                  <div className="df-upload-preview-row">
                    <img src={receiptPreview} alt="Receipt" className="df-receipt-thumb" />
                    <div className="df-upload-preview-info">
                      <p className="df-upload-filename">{receiptFile.name}</p>
                      {extracting && (
                        <p className="df-extracting-text">
                          <span className="material-symbols-rounded df-extracting-spin">autorenew</span>
                          Reading receipt…
                        </p>
                      )}
                      <button
                        type="button"
                        className="df-upload-remove"
                        onClick={(e) => { e.stopPropagation(); handleRemoveFile(); }}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="df-upload-placeholder">
                    <span className="material-symbols-rounded df-upload-icon">upload</span>
                    <span className="df-upload-text">Upload Receipt</span>
                    <span className="df-upload-hint">PNG or JPEG only</span>
                  </div>
                )}
              </div>
              {errors.receipt && <p className="df-error">{errors.receipt}</p>}

              {/* Receipt Number + E-Wallet row */}
              <div className="df-inline-row">
                <div className="df-field df-field-grow">
                  <input
                    type="text"
                    name="receipt_number"
                    placeholder="Receipt Number"
                    className={`df-input ${errors.receipt_number ? "df-input-error" : ""}`}
                    value={form.receipt_number}
                    onChange={handleChange}
                  />
                  {errors.receipt_number && <p className="df-error">{errors.receipt_number}</p>}
                </div>

                <div className="df-field df-field-method">
                  <select
                    name="payment_method"
                    className={`df-input df-select ${errors.payment_method ? "df-input-error" : ""}`}
                    value={form.payment_method}
                    onChange={handleChange}
                  >
                    <option value="">E-Wallet</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="GCash">GCash</option>
                  </select>
                  {errors.payment_method && <p className="df-error">{errors.payment_method}</p>}
                </div>
              </div>

            </div>

            {/* RIGHT: QR Code */}
            <div className="df-qr-col">
              <p className="df-qr-label">Scan First to Donate</p>
              <div className="df-qr-box df-qr-box-clickable" onClick={() => setQrZoom(true)} title="Click to zoom">
                {/* ── DUMMY QR — replace src with real QR image when ready ── */}
                <img
                  src="/images/donate_qr.png"
                  alt="QR Code"
                  className="df-qr-img"
                  onError={(e) => {
                    e.target.style.display = "none";
                    e.target.nextSibling.style.display = "flex";
                  }}
                />
                {/* Fallback placeholder (hidden when image loads) */}
                <div className="df-qr-placeholder" style={{ display: "none" }}>
                  <span className="material-symbols-rounded df-qr-placeholder-icon">qr_code_2</span>
                  <span className="df-qr-placeholder-text">QR Code</span>
                </div>
                <div className="df-qr-zoom-hint">
                  <span className="material-symbols-rounded">zoom_in</span>
                </div>
              </div>
            </div>

          </div>

          {/* DONATION AMOUNT + DATE + TIME */}
          <div className="df-row">

            <div className="df-field df-field-amount">
              <label className="df-label">Donation Amount</label>
              <div className="df-amount-wrap">
                <span className="df-peso-sign">₱</span>
                <input
                  type="number"
                  name="amount"
                  min="1"
                  step="0.01"
                  placeholder="Enter Donation Amount"
                  className={`df-input df-amount-input ${errors.amount ? "df-input-error" : ""}`}
                  value={form.amount}
                  onChange={handleChange}
                />
              </div>
              {errors.amount && <p className="df-error">{errors.amount}</p>}
            </div>

            <div className="df-field">
              <label className="df-label">Date</label>
              <input
                type="date"
                name="date"
                className={`df-input df-input-center ${errors.date ? "df-input-error" : ""}`}
                value={form.date}
                onChange={handleChange}
              />
              {errors.date && <p className="df-error">{errors.date}</p>}
            </div>

            <div className="df-field">
              <label className="df-label">Time</label>
              <input
                type="time"
                name="time"
                className={`df-input df-input-center ${errors.time ? "df-input-error" : ""}`}
                value={form.time}
                onChange={handleChange}
              />
              {errors.time && <p className="df-error">{errors.time}</p>}
            </div>

          </div>

          {/* MESSAGE (Optional) */}
          <div className="df-field">
            <label className="df-label">
              Message
              <span className="df-optional"> (Optional)</span>
            </label>
            <textarea
              name="message"
              placeholder="Leave a message (optional)…"
              className="df-input df-textarea"
              value={form.message}
              onChange={handleChange}
              rows={4}
            />
          </div>

        </form>

        {/* ── SUBMIT BUTTON ── */}
        <div className="df-submit-row">
          <button
            className="df-submit-btn"
            onClick={handleSubmit}
            disabled={submitting || extracting}
          >
            {submitting ? "Submitting…" : "Submit"}
          </button>
        </div>

      </div>
    </div>
  );
}
