import { useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

// ── When your backend is ready, replace these URLs ────────────
const API_DONATION_URL = "http://localhost:8000/api/contact/donation-request";
const API_INQUIRY_URL  = "http://localhost:8000/api/contact/inquiry";

// ── Default empty states ──────────────────────────────────────
const EMPTY_DONATION = {
  name: "", email: "", contact: "", address: "",
  urgency: "", pax: "", reason: "",
};

const EMPTY_INQUIRY = {
  name: "", email: "", message: "",
};

export default function Contact() {

  // ── Donation Form State ───────────────────────────────────
  const [donation, setDonation]         = useState(EMPTY_DONATION);
  const [donationStatus, setDonationStatus] = useState(null); // null | "loading" | "success" | "error"

  // ── Inquiry Form State ────────────────────────────────────
  const [inquiry, setInquiry]           = useState(EMPTY_INQUIRY);
  const [inquiryStatus, setInquiryStatus]   = useState(null);

  // ── Handlers ──────────────────────────────────────────────
  const handleDonationChange = (e) => {
    setDonation((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleInquiryChange = (e) => {
    setInquiry((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleDonationSubmit = async () => {
    if (!donation.name || !donation.email || !donation.reason) {
      setDonationStatus("error-validation");
      return;
    }
    setDonationStatus("loading");
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
    if (!inquiry.name || !inquiry.email || !inquiry.message) {
      setInquiryStatus("error-validation");
      return;
    }
    setInquiryStatus("loading");
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

          {/* Fields */}
          <input
            className="contact-input"
            type="text"
            name="name"
            placeholder="Name"
            value={donation.name}
            onChange={handleDonationChange}
          />

          <div className="contact-row">
            <input
              className="contact-input"
              type="email"
              name="email"
              placeholder="Email"
              value={donation.email}
              onChange={handleDonationChange}
            />
            <input
              className="contact-input"
              type="text"
              name="contact"
              placeholder="Contact #"
              value={donation.contact}
              onChange={handleDonationChange}
            />
          </div>

          <input
            className="contact-input"
            type="text"
            name="address"
            placeholder="Address"
            value={donation.address}
            onChange={handleDonationChange}
          />

          <div className="contact-row">
            <select
              className="contact-input contact-select"
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
              className="contact-input contact-pax"
              type="number"
              name="pax"
              placeholder="Pax"
              min="1"
              value={donation.pax}
              onChange={handleDonationChange}
            />
          </div>

          <textarea
            className="contact-input contact-textarea"
            name="reason"
            placeholder="Why are you requesting?"
            value={donation.reason}
            onChange={handleDonationChange}
          />

          <p className="contact-note">Every request is reviewed.</p>

          {/* Status messages */}
          {donationStatus === "error-validation" && (
            <p className="contact-status contact-error">Please fill in Name, Email, and Reason.</p>
          )}
          {donationStatus === "success" && (
            <p className="contact-status contact-success">Your request has been submitted successfully!</p>
          )}
          {donationStatus === "error" && (
            <p className="contact-status contact-error">Something went wrong. Please try again.</p>
          )}

        </div>

        {/* Submit Button — outside the card like in the screenshot */}
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

          <input
            className="contact-input"
            type="text"
            name="name"
            placeholder="Name"
            value={inquiry.name}
            onChange={handleInquiryChange}
          />
          <input
            className="contact-input"
            type="email"
            name="email"
            placeholder="Email"
            value={inquiry.email}
            onChange={handleInquiryChange}
          />
          <textarea
            className="contact-input contact-textarea"
            name="message"
            placeholder="Message"
            value={inquiry.message}
            onChange={handleInquiryChange}
          />

          {/* Status messages */}
          {inquiryStatus === "error-validation" && (
            <p className="contact-status contact-error">Please fill in all fields.</p>
          )}
          {inquiryStatus === "success" && (
            <p className="contact-status contact-success">Your message has been sent successfully!</p>
          )}
          {inquiryStatus === "error" && (
            <p className="contact-status contact-error">Something went wrong. Please try again.</p>
          )}

        </div>

        {/* Send Button — outside the card */}
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
