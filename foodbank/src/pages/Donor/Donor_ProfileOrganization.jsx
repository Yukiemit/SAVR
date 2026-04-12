import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import NavBar_Donor from "../../components/NavBar_Donor";
import api from "../../services/api";

export default function Donor_Profile_Organization() {
  const navigate = useNavigate();

  const [profile,           setProfile]           = useState(null);
  const [loading,           setLoading]           = useState(true);
  const [editing,           setEditing]           = useState(false);
  const [saving,            setSaving]            = useState(false);
  const [status,            setStatus]            = useState({ type: "", msg: "" });
  const [form,              setForm]              = useState({});
  const [deactivateConfirm, setDeactivateConfirm] = useState(false);
  const [deactivating,      setDeactivating]      = useState(false);

  // ── Change password (OTP flow) ────────────────────────────────────
  const [showPwModal, setShowPwModal] = useState(false);
  const [pwStep,      setPwStep]      = useState("request");
  const [pwOtp,       setPwOtp]       = useState("");
  const [pwNew,       setPwNew]       = useState("");
  const [pwConfirm,   setPwConfirm]   = useState("");
  const [pwLoading,   setPwLoading]   = useState(false);
  const [pwStatus,    setPwStatus]    = useState({ type: "", msg: "" });

  const openPwModal = () => {
    setShowPwModal(true);
    setPwStep("request");
    setPwOtp(""); setPwNew(""); setPwConfirm("");
    setPwStatus({ type: "", msg: "" });
  };

  const sendOtp = async () => {
    setPwLoading(true); setPwStatus({ type: "", msg: "" });
    try {
      await api.post("/donor/change-password/send-otp");
      setPwStep("verify");
      setPwStatus({ type: "success", msg: "OTP sent to your email." });
    } catch { setPwStatus({ type: "error", msg: "Failed to send OTP." }); }
    finally { setPwLoading(false); }
  };

  const submitNewPassword = async () => {
    if (pwNew !== pwConfirm) { setPwStatus({ type: "error", msg: "Passwords do not match." }); return; }
    if (pwNew.length < 6)    { setPwStatus({ type: "error", msg: "Password must be at least 6 characters." }); return; }
    setPwLoading(true); setPwStatus({ type: "", msg: "" });
    try {
      await api.post("/donor/change-password", { otp: pwOtp, password: pwNew, password_confirmation: pwConfirm });
      setPwStatus({ type: "success", msg: "Password changed successfully!" });
      setTimeout(() => setShowPwModal(false), 1500);
    } catch (err) { setPwStatus({ type: "error", msg: err.response?.data?.message || "Invalid OTP." }); }
    finally { setPwLoading(false); }
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get("/donor/profile");
        setProfile(res.data);
        setForm(res.data);
      } catch {
        setStatus({ type: "error", msg: "Failed to load profile." });
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setStatus({ type: "", msg: "" });
    try {
      const res = await api.put("/donor/profile", form);
      setProfile(res.data);
      setForm(res.data);
      const stored = JSON.parse(localStorage.getItem("user") || "{}");
      localStorage.setItem("user", JSON.stringify({ ...stored, name: res.data.org_name || res.data.name }));
      setEditing(false);
      setStatus({ type: "success", msg: "Profile updated successfully." });
    } catch {
      setStatus({ type: "error", msg: "Failed to save changes." });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setForm(profile);
    setEditing(false);
    setStatus({ type: "", msg: "" });
  };

  const handleDeactivate = async () => {
    setDeactivating(true);
    try {
      await api.post("/donor/deactivate");
      localStorage.clear();
      window.location.href = "/";
    } catch {
      setStatus({ type: "error", msg: "Failed to deactivate account." });
      setDeactivating(false);
      setDeactivateConfirm(false);
    }
  };

  const val = (key) => (editing ? form[key] ?? "" : profile?.[key] ?? "—");

  const updatedLabel = () => {
    if (!profile?.updated_at) return "";
    const diff = Math.floor((Date.now() - new Date(profile.updated_at)) / 1000);
    if (diff < 86400)  return "Updated Today";
    if (diff < 172800) return "Updated Yesterday";
    return `Updated ${new Date(profile.updated_at).toLocaleDateString()}`;
  };

  return (
    <div className="dp-wrapper">
      <NavBar_Donor />

      <main className="dp-main">

        <h2 className="dp-page-title">My Profile</h2>

        {/* ── HEADER CARD ── */}
        <div className="dp-header-card">
          <div className="dp-header-avatar">
            <span className="material-symbols-rounded dp-header-avatar-icon">corporate_fare</span>
          </div>
          <div className="dp-header-info">
            <h1 className="dp-header-name">
              {loading ? "—" : profile?.org_name || "—"}
            </h1>
            <p className="dp-header-sub">Manage your organization information and account details</p>
          </div>
          {!editing && (
            <button className="dp-edit-btn" onClick={() => { setEditing(true); setStatus({ type: "", msg: "" }); }}>
              <span className="material-symbols-rounded" style={{ fontSize: 15 }}>edit</span>
              Edit Details
            </button>
          )}
        </div>

        {status.msg && (
          <p className={`dp-status ${status.type === "success" ? "dp-status-success" : "dp-status-error"}`}>
            {status.msg}
          </p>
        )}

        {/* ── ORGANIZATION INFO CARD ── */}
        <div className="dp-info-card">
          <div className="dp-info-card-header">
            <div>
              <span className="dp-info-eyebrow">ORGANIZATION DETAILS</span>
              <h3 className="dp-info-title">
                Organization <span className="dp-info-title-accent">Information</span>
              </h3>
            </div>
            {!loading && profile?.updated_at && (
              <span className="dp-updated-badge">{updatedLabel()}</span>
            )}
          </div>

          {loading ? (
            <p className="dp-loading">Loading profile…</p>
          ) : (
            <div className="dp-fields-grid">
              <DpField label="Organization Name" name="org_name" val={val} editing={editing} onChange={handleChange} full />
              <DpField label="Website URL"        name="website"  val={val} editing={editing} onChange={handleChange} />
              <DpField label="Organization Type"  name="org_type" val={val} editing={editing} onChange={handleChange}
                type="select" options={["Private", "Public"]} small />
              <DpField label="Industry / Sector"  name="industry" val={val} editing={editing} onChange={handleChange}
                type="select" options={["Food", "NGO", "Corporate"]} small />
            </div>
          )}
        </div>

        {/* ── CONTACT PERSON CARD ── */}
        <div className="dp-info-card">
          <div className="dp-info-card-header">
            <div>
              <span className="dp-info-eyebrow">CONTACT PERSON</span>
              <h3 className="dp-info-title">
                Representative <span className="dp-info-title-accent">Details</span>
              </h3>
            </div>
          </div>

          {loading ? (
            <p className="dp-loading">Loading…</p>
          ) : (
            <div className="dp-fields-grid">
              <DpField label="First Name"      name="first_name" val={val} editing={editing} onChange={handleChange} />
              <DpField label="Last Name"       name="last_name"  val={val} editing={editing} onChange={handleChange} />
              <DpField label="Contact Number"  name="contact"    val={val} editing={editing} onChange={handleChange} />
              <DpField label="Email Address"   name="email"      val={val} editing={editing} onChange={handleChange} type="email" />
            </div>
          )}

          {editing && (
            <div className="dp-edit-actions">
              <button className="dp-cancel-btn" onClick={handleCancel} disabled={saving}>Cancel</button>
              <button className="dp-save-btn"   onClick={handleSave}   disabled={saving}>
                {saving ? "Saving…" : "Save Changes"}
              </button>
            </div>
          )}
        </div>

        {/* ── CHANGE PASSWORD + DEACTIVATE ── */}
        <div className="dp-deactivate-row">
          <button className="dp-change-pw-btn" onClick={openPwModal}>Change Password</button>
          <button className="dp-deactivate-btn" onClick={() => setDeactivateConfirm(true)}>Deactivate My Account</button>
        </div>

      </main>

      {/* ── CHANGE PASSWORD MODAL ── */}
      {showPwModal && (
        <div className="dp-overlay">
          <div className="dp-confirm-modal">
            <span className="material-symbols-rounded dp-confirm-icon" style={{ color: "#2d5a27" }}>lock_reset</span>
            <h3 className="dp-confirm-title">Change Password</h3>
            {pwStep === "request" && (
              <>
                <p className="dp-confirm-desc">We'll send a 6-digit OTP to <strong>{profile?.email}</strong>.</p>
                {pwStatus.msg && <p className={`dp-status ${pwStatus.type === "success" ? "dp-status-success" : "dp-status-error"}`}>{pwStatus.msg}</p>}
                <div className="dp-confirm-actions">
                  <button className="dp-cancel-btn" onClick={() => setShowPwModal(false)} disabled={pwLoading}>Cancel</button>
                  <button className="dp-save-btn" onClick={sendOtp} disabled={pwLoading}>{pwLoading ? "Sending…" : "Send OTP"}</button>
                </div>
              </>
            )}
            {pwStep === "verify" && (
              <>
                <p className="dp-confirm-desc">Enter the OTP and your new password.</p>
                <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 10, marginBottom: 10 }}>
                  <input className="dp-field-input" placeholder="6-digit OTP" value={pwOtp} onChange={e => setPwOtp(e.target.value)} maxLength={6} style={{ textAlign: "center", letterSpacing: 6, fontSize: 18 }} />
                  <input className="dp-field-input" type="password" placeholder="New Password" value={pwNew} onChange={e => setPwNew(e.target.value)} />
                  <input className="dp-field-input" type="password" placeholder="Confirm New Password" value={pwConfirm} onChange={e => setPwConfirm(e.target.value)} />
                </div>
                {pwStatus.msg && <p className={`dp-status ${pwStatus.type === "success" ? "dp-status-success" : "dp-status-error"}`}>{pwStatus.msg}</p>}
                <div className="dp-confirm-actions">
                  <button className="dp-cancel-btn" onClick={() => setShowPwModal(false)} disabled={pwLoading}>Cancel</button>
                  <button className="dp-save-btn" onClick={submitNewPassword} disabled={pwLoading}>{pwLoading ? "Saving…" : "Change Password"}</button>
                </div>
                <button style={{ marginTop: 8, background: "none", border: "none", color: "#888", cursor: "pointer", fontSize: 13 }} onClick={sendOtp} disabled={pwLoading}>Resend OTP</button>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── DEACTIVATE CONFIRM MODAL ── */}
      {deactivateConfirm && (
        <div className="dp-overlay">
          <div className="dp-confirm-modal">
            <span className="material-symbols-rounded dp-confirm-icon">warning</span>
            <h3 className="dp-confirm-title">Deactivate Account?</h3>
            <p className="dp-confirm-desc">
              This action will deactivate your organization account. You will be logged out immediately.
              Contact support to reactivate.
            </p>
            <div className="dp-confirm-actions">
              <button className="dp-cancel-btn" onClick={() => setDeactivateConfirm(false)} disabled={deactivating}>Cancel</button>
              <button className="dp-deactivate-confirm-btn" onClick={handleDeactivate} disabled={deactivating}>
                {deactivating ? "Deactivating…" : "Yes, Deactivate"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DpField({ label, name, val, editing, onChange, type = "text", options = [], small, xs, full }) {
  const className = `dp-field ${full ? "dp-field-full" : ""} ${small ? "dp-field-sm" : ""} ${xs ? "dp-field-xs" : ""}`;
  return (
    <div className={className}>
      <span className="dp-field-label">{label}</span>
      {editing ? (
        type === "select" ? (
          <select className="dp-field-input dp-field-select" name={name} value={val(name)} onChange={onChange}>
            <option value="">— Select —</option>
            {options.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        ) : (
          <input className="dp-field-input" type={type} name={name} value={val(name)} onChange={onChange} />
        )
      ) : (
        <p className="dp-field-value">{val(name)}</p>
      )}
    </div>
  );
}
