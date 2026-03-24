import { useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const API_DONATION_URL = "http://localhost:8000/api/contact/donation-request";
const API_INQUIRY_URL  = "http://localhost:8000/api/contact/inquiry";

const EMPTY_DONATION = {
  name: "", email: "", contact: "", address: "",
  urgency: "", pax: "", reason: "",
};

const EMPTY_INQUIRY = {
  name: "", email: "", message: "",
};

export default function Contact() {

  // ── Donation Form State ───────────────────────────────────
  const [donation, setDonation]               = useState(EMPTY_DONATION);
  const [donationErrors, setDonationErrors]   = useState({});
  const [donationStatus, setDonationStatus]   = useState(null);

  // ── Inquiry Form State ────────────────────────────────────
  const [inquiry, setInquiry]                 = useState(EMPTY_INQUIRY);
  const [inquiryErrors, setInquiryErrors]     = useState({});
  const [inquiryStatus, setInquiryStatus]     = useState(null);

  // ── Handlers ──────────────────────────────────────────────
  const handleDonationChange = (e) => {
    setDonation((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (donationErrors[e.target.name]) {
      setDonationErrors((prev) => ({ ...prev, [e.target.name]: null }));
    }
  };

  const handleInquiryChange = (e) => {
    setInquiry((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (inquiryErrors[e.target.name]) {
      setInquiryErrors((prev) => ({ ...prev, [e.target.name]: null }));
    }
  };

  // ── Donation Validation ───────────────────────────────────
  const validateDonation = () => {
    const e = {};

    if (!donation.name.trim())
      e.name = "Name is required.";

    if (!donation.email.trim()) {
      e.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(donation.email)) {
      e.email = 'Email must contain "@" and ".".';
    }

    if (!donation.contact.trim()) {
      e.contact = "Contact number is required.";
    } else if (!/^\d{11}$/.test(donation.contact.trim())) {
      e.contact = "Contact number must be exactly 11 digits.";
    }

    if (!donation.address.trim())
      e.address = "Address is required.";

    if (!donation.urgency)
      e.urgency = "Please select an urgency level.";

    if (!donation.pax) {
      e.pax = "Pax is required.";
    } else if (Number(donation.pax) < 1) {
      e.pax = "Pax must be at least 1.";
    }

    if (!donation.reason.trim())
      e.reason = "Please explain why you are requesting.";

    return e;
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
  const handleDonationSubmit = async () => {
    const clientErrors = validateDonation();
    if (Object.keys(clientErrors).length > 0) {
      setDonationErrors(clientErrors);
      return;
    }

    setDonationStatus("loading");
    setDonationErrors({});

    try {
      const res = await fetch(API_DONATION_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(donation),
      });
      if (!res.ok) throw new Error("Server error");
      setDonationStatus("success");
      setDonation(EMPTY_DONATION);
    } catch {
      setDonationStatus("error");
    }
  };

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
  const donationErrorList = Object.entries(donationErrors)
    .filter(([_, msg]) => msg)
    .map(([field, msg]) => ({ field, msg }));

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

      {/* ── REQUEST DONATION FORM ── */}
      <section className="contact-section">
        <div className="contact-card">

          {/* Header */}
          <div className="contact-card-header">
            <h2 className="contact-card-title">Request Donation Form</h2>
            <span className="material-symbols-rounded contact-card-icon">volunteer_activism</span>
          </div>
          <hr className="contact-card-divider" />

          {/* Name */}
          <input
            className={`contact-input ${donationErrors.name ? "input-error" : ""}`}
            type="text"
            name="name"
            placeholder="Name"
            value={donation.name}
            onChange={handleDonationChange}
          />

          {/* Email + Contact */}
          <div className="contact-row">
            <input
              className={`contact-input ${donationErrors.email ? "input-error" : ""}`}
              type="email"
              name="email"
              placeholder="Email"
              value={donation.email}
              onChange={handleDonationChange}
            />
            <input
              className={`contact-input ${donationErrors.contact ? "input-error" : ""}`}
              type="text"
              name="contact"
              placeholder="Contact #"
              value={donation.contact}
              onChange={handleDonationChange}
            />
          </div>

          {/* Address */}
          <input
            className={`contact-input ${donationErrors.address ? "input-error" : ""}`}
            type="text"
            name="address"
            placeholder="Address"
            value={donation.address}
            onChange={handleDonationChange}
          />

          {/* Urgency + Pax */}
          <div className="contact-row">
            <select
              className={`contact-input contact-select ${donationErrors.urgency ? "input-error" : ""}`}
              name="urgency"
              value={donation.urgency}
              onChange={handleDonationChange}
            >
              <option value="" disabled>Urgency</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
            <input
              className={`contact-input contact-pax ${donationErrors.pax ? "input-error" : ""}`}
              type="number"
              name="pax"
              placeholder="Pax"
              min="1"
              value={donation.pax}
              onChange={handleDonationChange}
            />
          </div>

          {/* Reason */}
          <textarea
            className={`contact-input contact-textarea ${donationErrors.reason ? "input-error" : ""}`}
            name="reason"
            placeholder="Why are you requesting?"
            value={donation.reason}
            onChange={handleDonationChange}
          />

          <p className="contact-note">Every request is reviewed.</p>

          {/* ✅ ERROR SUMMARY — BELOW FORM, ABOVE BUTTON */}
          {donationErrorList.length > 0 && (
            <div className="error-summary">
              <p className="error-summary-title">⚠️ Please fix the following:</p>
              <ul className="error-summary-list">
                {donationErrorList.map(({ field, msg }) => (
                  <li key={field}>{msg}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Server status messages */}
          {donationStatus === "success" && (
            <p className="contact-status contact-success">Your request has been submitted successfully!</p>
          )}
          {donationStatus === "error" && (
            <p className="contact-status contact-error">Something went wrong. Please try again.</p>
          )}

        </div>

        <button
          className="contact-btn"
          onClick={handleDonationSubmit}
          disabled={donationStatus === "loading"}
        >
          {donationStatus === "loading" ? "Submitting..." : "Submit Request"}
        </button>
      </section>

      <hr className="contact-section-divider" />

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
