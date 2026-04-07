import { useState } from "react";
import { useNavigate } from "react-router-dom";
import NavBar_Donor from "../../components/NavBar_Donor";
import api from "../../services/api";

// ── PRESET AMOUNTS ────────────────────────────────────────────────────────────
const PRESETS = [500, 1000, 2000, 5000];

// ── COMPONENT ────────────────────────────────────────────────────────────────
export default function Donor_Donate_Financial() {
  const navigate = useNavigate();

  const [selectedPreset, setSelectedPreset] = useState(null);
  const [customAmount,   setCustomAmount]   = useState("");
  const [message,        setMessage]        = useState("");
  const [errors,         setErrors]         = useState({});
  const [status,         setStatus]         = useState(null);

  // Preset takes priority over custom input
  const effectiveAmount = selectedPreset ?? (customAmount ? Number(customAmount) : null);

  const handlePreset = (val) => {
    setSelectedPreset(val);
    setCustomAmount("");
    if (errors.amount) setErrors((p) => ({ ...p, amount: null }));
  };

  const handleCustom = (e) => {
    setCustomAmount(e.target.value);
    setSelectedPreset(null);
    if (errors.amount) setErrors((p) => ({ ...p, amount: null }));
  };

  const validate = () => {
    const e = {};
    if (!effectiveAmount || isNaN(effectiveAmount) || effectiveAmount < 100)
      e.amount = "Minimum donation is ₱100.";
    return e;
  };

  const handleSubmit = async () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setStatus("redirecting");
    try {
      const res = await api.post("/donor/donations/paymongo", {
        amount:  effectiveAmount,
        message: message.trim() || null,
      });
      window.location.href = res.data.checkout_url;
    } catch {
      setStatus("error");
    }
  };

  // ── Shared field style (inside amber card) ────────────────────────────────
  const fieldInput = (hasErr = false) => ({
    width: "100%",
    padding: "12px 16px",
    background: "rgba(255,255,255,0.35)",
    border: hasErr ? "1.5px solid #e53935" : "1.5px solid rgba(255,255,255,0.5)",
    borderRadius: 10,
    fontSize: 15,
    color: "#fff",
    outline: "none",
    boxSizing: "border-box",
    fontFamily: "inherit",
    "::placeholder": { color: "rgba(255,255,255,0.6)" },
  });

  return (
    <div style={{ minHeight: "100vh", background: "#f5f0e8", fontFamily: "inherit" }}>
      <NavBar_Donor />

      <main style={{ padding: "0 24px 60px" }}>

        {/* ── PAGE HEADER ── */}
        <div style={{ textAlign: "center", padding: "36px 0 24px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14 }}>
            <img
              src="/images/Donor_Financial.png"
              alt="Financial Donation"
              style={{ width: 44, height: 44, objectFit: "contain" }}
            />
            <h1 style={{ fontSize: 32, fontWeight: 900, color: "#1a1a1a", margin: 0, letterSpacing: 0.5 }}>
              Financial Donation
            </h1>
          </div>
          <hr style={{ border: "none", borderTop: "1.5px solid #ddd", margin: "20px auto 0", maxWidth: 900 }} />
        </div>

        {/* ── AMBER CARD ── */}
        <div style={{
          maxWidth: 720,
          margin: "0 auto",
          background: "#f0b429",
          borderRadius: 20,
          padding: "32px 36px 36px",
        }}>

          {/* SELECT AMOUNT */}
          <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 10 }}>
            Select Amount
          </label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
            {PRESETS.map((val) => (
              <button
                key={val}
                onClick={() => handlePreset(val)}
                style={{
                  padding: "16px 12px",
                  background: selectedPreset === val ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.25)",
                  border: selectedPreset === val ? "2px solid #fff" : "2px solid rgba(255,255,255,0.4)",
                  borderRadius: 12,
                  fontSize: 20,
                  fontWeight: 800,
                  color: "#fff",
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                ₱ {val.toLocaleString()}
              </button>
            ))}
          </div>

          {/* CUSTOM AMOUNT */}
          <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 8 }}>
            Or enter custom amount (₱)
          </label>
          <div style={{ position: "relative", marginBottom: errors.amount ? 4 : 20 }}>
            <span style={{
              position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)",
              color: "rgba(255,255,255,0.75)", fontWeight: 700, fontSize: 15, pointerEvents: "none",
            }}>
              ₱
            </span>
            <input
              type="number"
              min="100"
              placeholder="0.00"
              value={customAmount}
              onChange={handleCustom}
              style={{
                ...fieldInput(!!errors.amount),
                paddingLeft: 32,
                fontSize: 16,
                fontWeight: 600,
              }}
            />
          </div>
          {errors.amount && (
            <p style={{ color: "#fff", fontSize: 12, fontWeight: 700, margin: "0 0 16px", background: "rgba(229,57,53,0.35)", borderRadius: 8, padding: "6px 12px" }}>
              ⚠ {errors.amount}
            </p>
          )}

          {/* PAYMENT METHOD */}
          <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 10 }}>
            Payment Method
          </label>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            background: "rgba(255,255,255,0.25)",
            border: "2px solid #fff",
            borderRadius: 12,
            padding: "14px 18px",
            marginBottom: 20,
          }}>
            <div style={{
              background: "rgba(255,255,255,0.30)",
              borderRadius: 10,
              width: 40,
              height: 40,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}>
              <span className="material-symbols-rounded" style={{ color: "#fff", fontSize: 22 }}>
                credit_card
              </span>
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontSize: 15, fontWeight: 800, color: "#fff" }}>PayMongo</p>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: "rgba(255,255,255,0.80)" }}>GCash, Maya, Cards</p>
            </div>
            <span className="material-symbols-rounded" style={{ color: "#fff", fontSize: 22 }}>
              check_circle
            </span>
          </div>

          {/* MESSAGE */}
          <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 8 }}>
            Service Description / Extra Notes{" "}
            <span style={{ fontWeight: 400, color: "rgba(255,255,255,0.75)" }}>(optional)</span>
          </label>
          <textarea
            placeholder="Leave a message for the food bank…"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            style={{
              ...fieldInput(),
              resize: "vertical",
              minHeight: 110,
              padding: "12px 16px",
            }}
          />

        </div>
        {/* end amber card */}

        {/* ── STATUS ── */}
        {status === "redirecting" && (
          <p style={{ textAlign: "center", color: "#c96a2e", fontWeight: 600, fontSize: 14, marginTop: 16 }}>
            ⏳ Preparing your PayMongo checkout… please wait.
          </p>
        )}
        {status === "error" && (
          <p style={{ textAlign: "center", color: "#e53935", fontWeight: 600, fontSize: 14, marginTop: 16 }}>
            Something went wrong. Please try again.
          </p>
        )}

        {/* ── ACTION BUTTONS ── */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 14, maxWidth: 720, margin: "24px auto 0" }}>
          <button
            onClick={() => navigate("/donor/donate")}
            disabled={status === "redirecting"}
            style={{
              padding: "13px 36px",
              borderRadius: 50,
              border: "1.5px solid #bbb",
              background: "#fff",
              color: "#444",
              fontSize: 15,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={status === "redirecting"}
            style={{
              padding: "13px 40px",
              borderRadius: 50,
              border: "none",
              background: status === "redirecting" ? "#aaa" : "#2d5a27",
              color: "#fff",
              fontSize: 15,
              fontWeight: 800,
              cursor: status === "redirecting" ? "not-allowed" : "pointer",
              fontFamily: "inherit",
              letterSpacing: 0.3,
            }}
          >
            {status === "redirecting" ? "Redirecting…" : "Submit"}
          </button>
        </div>

      </main>
    </div>
  );
}
