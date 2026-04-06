import { useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const API_INQUIRY_URL  = "http://localhost:8000/api/contact/inquiry";

const EMPTY_INQUIRY = {
  name: "", email: "", message: "",
};

export default function Contact() {
  
  // ── Inquiry Form State ────────────────────────────────────
  const [inquiry, setInquiry]                 = useState(EMPTY_INQUIRY);
  const [inquiryErrors, setInquiryErrors]     = useState({});
  const [inquiryStatus, setInquiryStatus]     = useState(null);

  // ── Handlers ──────────────────────────────────────────────

  const handleInquiryChange = (e) => {
    setInquiry((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (inquiryErrors[e.target.name]) {
      setInquiryErrors((prev) => ({ ...prev, [e.target.name]: null }));
    }
  };

  // ── Inquiry Validation ────────────────────────────────────
  const validateInquiry = () => {
    const e = {};

    if (!inquiry.name.trim())
      e.name = "Name is required.";

    if (!inquiry.email.trim()) {
      e.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inquiry.email)) {
      e.email = 'Email must contain "@" and ".".';
    }

    if (!inquiry.message.trim())
      e.message = "Message is required.";

    return e;
  };

  // ── Submit Handlers ───────────────────────────────────────

  const handleInquirySubmit = async () => {
    const clientErrors = validateInquiry();
    if (Object.keys(clientErrors).length > 0) {
      setInquiryErrors(clientErrors);
      return;
    }

    setInquiryStatus("loading");
    setInquiryErrors({});

    try {
      const res = await fetch(API_INQUIRY_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(inquiry),
      });
      if (!res.ok) throw new Error("Server error");
      setInquiryStatus("success");
      setInquiry(EMPTY_INQUIRY);
    } catch {
      setInquiryStatus("error");
    }
  };

  // ── Error List Helpers ────────────────────────────────────

  const inquiryErrorList = Object.entries(inquiryErrors)
    .filter(([_, msg]) => msg)
    .map(([field, msg]) => ({ field, msg }));

  return (
    <div>

      {/* NAVBAR */}
      <Navbar />

      {/* HERO */}
      <div className="hero contact-hero">
        <div className="hero-overlay center">
          <h1 className="about-title">CONTACT</h1>
        </div>
      </div>

      {/* ── INQUIRY FORM ── */}
      <section className="contact-section">
        <div className="contact-card">

          {/* Header */}
          <div className="contact-card-header">
            <h2 className="contact-card-title">Do you have any question ?</h2>
            <span className="material-symbols-rounded contact-card-icon">contact_phone</span>
          </div>
          <hr className="contact-card-divider" />

          <p className="contact-desc">Your involvement and curiosity are key to driving our efforts forward.</p>
          <p className="contact-desc">Contact us today, and let's work together towards a hunger-free Philippines!</p>

          {/* Name */}
          <input
            className={`contact-input ${inquiryErrors.name ? "input-error" : ""}`}
            type="text"
            name="name"
            placeholder="Name"
            value={inquiry.name}
            onChange={handleInquiryChange}
          />

          {/* Email */}
          <input
            className={`contact-input ${inquiryErrors.email ? "input-error" : ""}`}
            type="email"
            name="email"
            placeholder="Email"
            value={inquiry.email}
            onChange={handleInquiryChange}
          />

          {/* Message */}
          <textarea
            className={`contact-input contact-textarea ${inquiryErrors.message ? "input-error" : ""}`}
            name="message"
            placeholder="Message"
            value={inquiry.message}
            onChange={handleInquiryChange}
          />

          {/* ✅ ERROR SUMMARY — BELOW FORM, ABOVE BUTTON */}
          {inquiryErrorList.length > 0 && (
            <div className="error-summary">
              <p className="error-summary-title">⚠️ Please fix the following:</p>
              <ul className="error-summary-list">
                {inquiryErrorList.map(({ field, msg }) => (
                  <li key={field}>{msg}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Server status messages */}
          {inquiryStatus === "success" && (
            <p className="contact-status contact-success">Your message has been sent successfully!</p>
          )}
          {inquiryStatus === "error" && (
            <p className="contact-status contact-error">Something went wrong. Please try again.</p>
          )}

        </div>

        <button
          className="contact-btn"
          onClick={handleInquirySubmit}
          disabled={inquiryStatus === "loading"}
        >
          {inquiryStatus === "loading" ? "Sending..." : "Send"}
        </button>
      </section>

      {/* FOOTER */}
      <Footer />
    </div>
  );
}
