import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import NavBar_Beneficiary from "../../components/NavBar_Beneficiary";
import api from "../../services/api";

export default function Beneficiary_Profile_Individual() {
  const navigate = useNavigate();

  const [profile,           setProfile]           = useState(null);
  const [loading,           setLoading]           = useState(true);
  const [editing,           setEditing]           = useState(false);
  const [saving,            setSaving]            = useState(false);
  const [status,            setStatus]            = useState({ type: "", msg: "" });
  const [form,              setForm]              = useState({});
  const [deactivateConfirm, setDeactivateConfirm] = useState(false);
  const [deactivating,      setDeactivating]      = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get("/beneficiary/profile");
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
      const res = await api.put("/beneficiary/profile", form);
      setProfile(res.data);
      setForm(res.data);
      const stored = JSON.parse(localStorage.getItem("user") || "{}");
      localStorage.setItem("user", JSON.stringify({
        ...stored,
        name: `${res.data.first_name ?? ""} ${res.data.last_name ?? ""}`.trim(),
      }));
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
      await api.post("/beneficiary/deactivate");
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
      <NavBar_Beneficiary />

      <main className="dp-main">

        <h2 className="dp-page-title">My Profile</h2>

        {/* ── HEADER CARD ── */}
        <div className="dp-header-card dp-header-card-ben">
          <div className="dp-header-avatar">
            <span className="material-symbols-rounded dp-header-avatar-icon">account_circle</span>
          </div>
          <div className="dp-header-info">
            <h1 className="dp-header-name">
              {loading
                ? "—"
                : `${profile?.first_name ?? ""} ${profile?.middle_name ? profile.middle_name[0] + "." : ""} ${profile?.last_name ?? ""}`.trim() || "—"}
            </h1>
            <p className="dp-header-sub">Manage your personal information and account details</p>
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

        {/* ── BENEFICIARY INFO CARD ── */}
        <div className="dp-info-card">
          <div className="dp-info-card-header">
            <div>
              <span className="dp-info-eyebrow">BENEFICIARY DETAILS</span>
              <h3 className="dp-info-title">
                Your <span className="dp-info-title-accent">Information</span>
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

              {/* Row 1: Name */}
              <DpField label="First Name"   name="first_name"   val={val} editing={editing} onChange={handleChange} />
              <DpField label="Last Name"    name="last_name"    val={val} editing={editing} onChange={handleChange} />

              {/* Row 2: Middle, Suffix, Gender */}
              <DpField label="Middle Name"  name="middle_name"  val={val} editing={editing} onChange={handleChange} />
              <DpField label="Suffix"       name="suffix"       val={val} editing={editing} onChange={handleChange} small />
              <DpField label="Gender"       name="gender"       val={val} editing={editing} onChange={handleChange}
                type="select" options={["Male", "Female", "Prefer not to say"]} small />

              {/* Row 3: DOB, House, Brgy */}
              <DpField label="Date of Birth"  name="dob"          val={val} editing={editing} onChange={handleChange} type="date" />
              <DpField label="House #"         name="house"        val={val} editing={editing} onChange={handleChange} xs />
              <DpField label="Brgy."           name="barangay"     val={val} editing={editing} onChange={handleChange} />

              {/* Row 4: Street, City */}
              <DpField label="Street"           name="street"      val={val} editing={editing} onChange={handleChange} full />
              <DpField label="City / Municipality" name="city"     val={val} editing={editing} onChange={handleChange} full />

              {/* Row 5: Province, ZIP */}
              <DpField label="Province / Region" name="province"   val={val} editing={editing} onChange={handleChange} full />
              <DpField label="Postal / ZIP Code" name="zip"        val={val} editing={editing} onChange={handleChange} />

              {/* Row 6: Email, Contact */}
              <DpField label="Email Address"    name="email"       val={val} editing={editing} onChange={handleChange} full type="email" />
              <DpField label="Contact Number"   name="contact"     val={val} editing={editing} onChange={handleChange} full />

            </div>
          )}

          {editing && (
            <div className="dp-edit-actions">
              <button className="dp-cancel-btn" onClick={handleCancel} disabled={saving}>Cancel</button>
              <button className="dp-save-btn dp-save-btn-ben" onClick={handleSave} disabled={saving}>
                {saving ? "Saving…" : "Save Changes"}
              </button>
            </div>
          )}
        </div>

        {/* ── DEACTIVATE ── */}
        <div className="dp-deactivate-row">
          <button className="dp-deactivate-btn" onClick={() => setDeactivateConfirm(true)}>
            Deactivate My Account
          </button>
        </div>

      </main>

      {/* ── DEACTIVATE CONFIRM MODAL ── */}
      {deactivateConfirm && (
        <div className="dp-overlay">
          <div className="dp-confirm-modal">
            <span className="material-symbols-rounded dp-confirm-icon">warning</span>
            <h3 className="dp-confirm-title">Deactivate Account?</h3>
            <p className="dp-confirm-desc">
              This action will deactivate your account. You will be logged out immediately.
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
          <input className="dp-field-input dp-field-input-ben" type={type} name={name} value={val(name)} onChange={onChange} />
        )
      ) : (
        <p className="dp-field-value">{val(name)}</p>
      )}
    </div>
  );
}
