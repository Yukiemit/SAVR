import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import NavBar_Admin from "../../components/NavBar_Admin";
import api from "../../services/api";

const GENDER_OPTIONS = ["Male", "Female", "Non-binary", "Prefer not to say"];

export default function Admin_Profile() {
  const navigate = useNavigate();

  // ── Profile state ──
  const [form, setForm] = useState({
    first_name: "", middle_name: "", last_name: "",
    contact: "", department: "", gender: "", dob: "",
  });
  const [email,    setEmail]    = useState("—");
  const [username, setUsername] = useState("—");
  const [role,     setRole]     = useState("admin");
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);

  // ── Password state ──
  const [pwForm, setPwForm] = useState({
    current_password: "", new_password: "", new_password_confirmation: "",
  });
  const [pwLoading, setPwLoading] = useState(false);
  const [showPw, setShowPw] = useState({
    current: false, new: false, confirm: false,
  });

  // ── Toast ──
  const [toast, setToast]   = useState(null);
  const toastTimer           = useRef(null);

  const showToast = (message, type = "success") => {
    clearTimeout(toastTimer.current);
    setToast({ message, type });
    toastTimer.current = setTimeout(() => setToast(null), 3500);
  };

  // ── Fetch profile ──
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get("/admin/profile");
        const p = res.data;
        setForm({
          first_name:  p.first_name  || "",
          middle_name: p.middle_name || "",
          last_name:   p.last_name   || "",
          contact:     p.contact     || "",
          department:  p.department  || "",
          gender:      p.gender      || "",
          dob:         p.dob         || "",
        });
        setEmail(p.email     || "—");
        setUsername(p.username || "—");
        setRole(p.role       || "admin");
      } catch {
        showToast("Failed to load profile.", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const update = (field, value) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  // ── Save profile ──
  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put("/admin/profile", form);
      showToast("Profile updated successfully.");
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to update profile.", "error");
    } finally {
      setSaving(false);
    }
  };

  // ── Change password ──
  const updatePw = (field, value) =>
    setPwForm((prev) => ({ ...prev, [field]: value }));

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (pwForm.new_password !== pwForm.new_password_confirmation) {
      showToast("New passwords do not match.", "error");
      return;
    }
    if (pwForm.new_password.length < 8) {
      showToast("New password must be at least 8 characters.", "error");
      return;
    }
    setPwLoading(true);
    try {
      await api.post("/admin/change-password", pwForm);
      showToast("Password changed successfully.");
      setPwForm({ current_password: "", new_password: "", new_password_confirmation: "" });
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to change password.", "error");
    } finally {
      setPwLoading(false);
    }
  };

  const inp = "sp-input";

  return (
    <div className="sp-wrapper">
      <NavBar_Admin />

      <main className="sp-main">

        {/* ── PAGE HEADER ── */}
        <div className="sp-page-header">
          <button className="sp-back-btn" onClick={() => navigate("/admin/dashboard")}>
            <span className="material-symbols-rounded">arrow_back</span>
          </button>
          <div>
            <h1 className="sp-page-title">My Profile</h1>
            <p className="sp-page-sub">Manage your personal information and account settings</p>
          </div>
        </div>

        <hr className="sp-divider" />

        {loading ? (
          <div className="sp-loading">Loading profile…</div>
        ) : (
          <div className="sp-body">

            {/* ══ LEFT — Avatar + read-only info ══ */}
            <div className="sp-sidebar">
              <div className="sp-avatar-wrap">
                <span className="material-symbols-rounded sp-avatar-icon">account_circle</span>
              </div>
              <p className="sp-sidebar-name">
                {[form.first_name, form.last_name].filter(Boolean).join(" ") || "Admin"}
              </p>
              <span className="sp-role-badge">{role}</span>

              <div className="sp-sidebar-info">
                <div className="sp-sidebar-row">
                  <span className="material-symbols-rounded sp-sidebar-icon">mail</span>
                  <span className="sp-sidebar-val">{email}</span>
                </div>
                <div className="sp-sidebar-row">
                  <span className="material-symbols-rounded sp-sidebar-icon">person</span>
                  <span className="sp-sidebar-val">@{username}</span>
                </div>
                {form.department && (
                  <div className="sp-sidebar-row">
                    <span className="material-symbols-rounded sp-sidebar-icon">corporate_fare</span>
                    <span className="sp-sidebar-val">{form.department}</span>
                  </div>
                )}
              </div>
            </div>

            {/* ══ RIGHT — Forms ══ */}
            <div className="sp-forms">

              {/* ── Personal Info ── */}
              <form className="sp-card" onSubmit={handleSave}>
                <h2 className="sp-card-title">
                  <span className="material-symbols-rounded sp-card-icon">badge</span>
                  Personal Information
                </h2>
                <hr className="sp-card-divider" />

                <div className="sp-form-grid">
                  <div className="sp-field">
                    <label className="sp-label">First Name</label>
                    <input className={inp} type="text" placeholder="First name"
                      value={form.first_name}
                      onChange={(e) => update("first_name", e.target.value)} />
                  </div>
                  <div className="sp-field">
                    <label className="sp-label">Middle Name <span className="sp-opt">(optional)</span></label>
                    <input className={inp} type="text" placeholder="Middle name"
                      value={form.middle_name}
                      onChange={(e) => update("middle_name", e.target.value)} />
                  </div>
                  <div className="sp-field">
                    <label className="sp-label">Last Name</label>
                    <input className={inp} type="text" placeholder="Last name"
                      value={form.last_name}
                      onChange={(e) => update("last_name", e.target.value)} />
                  </div>
                  <div className="sp-field">
                    <label className="sp-label">Contact Number</label>
                    <input className={inp} type="text" placeholder="+63 9XX XXX XXXX"
                      value={form.contact}
                      onChange={(e) => update("contact", e.target.value)} />
                  </div>
                  <div className="sp-field">
                    <label className="sp-label">Department</label>
                    <input className={inp} type="text" placeholder="e.g., Administration"
                      value={form.department}
                      onChange={(e) => update("department", e.target.value)} />
                  </div>
                  <div className="sp-field">
                    <label className="sp-label">Gender</label>
                    <select className={inp + " sp-select"}
                      value={form.gender}
                      onChange={(e) => update("gender", e.target.value)}>
                      <option value="">Select gender</option>
                      {GENDER_OPTIONS.map((g) => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>
                  <div className="sp-field">
                    <label className="sp-label">Date of Birth</label>
                    <input className={inp} type="date"
                      value={form.dob}
                      onChange={(e) => update("dob", e.target.value)} />
                  </div>
                  <div className="sp-field sp-field-readonly">
                    <label className="sp-label">Email Address</label>
                    <input className={inp + " sp-input-readonly"} type="email" value={email} readOnly />
                  </div>
                  <div className="sp-field sp-field-readonly">
                    <label className="sp-label">Username</label>
                    <input className={inp + " sp-input-readonly"} type="text" value={username} readOnly />
                  </div>
                </div>

                <div className="sp-form-footer">
                  <button type="submit" className="sp-save-btn" disabled={saving}>
                    {saving ? (
                      <><span className="sp-spinner" /> Saving…</>
                    ) : (
                      <><span className="material-symbols-rounded">save</span> Save Changes</>
                    )}
                  </button>
                </div>
              </form>

              {/* ── Change Password ── */}
              <form className="sp-card" onSubmit={handleChangePassword}>
                <h2 className="sp-card-title">
                  <span className="material-symbols-rounded sp-card-icon">lock</span>
                  Change Password
                </h2>
                <hr className="sp-card-divider" />

                <div className="sp-pw-fields">
                  {[
                    { field: "current_password", label: "Current Password",  key: "current" },
                    { field: "new_password",     label: "New Password",      key: "new" },
                    { field: "new_password_confirmation", label: "Confirm New Password", key: "confirm" },
                  ].map(({ field, label, key }) => (
                    <div className="sp-field" key={field}>
                      <label className="sp-label">{label}</label>
                      <div className="sp-pw-wrap">
                        <input
                          className={inp}
                          type={showPw[key] ? "text" : "password"}
                          placeholder={label}
                          value={pwForm[field]}
                          onChange={(e) => updatePw(field, e.target.value)}
                          autoComplete="off"
                        />
                        <button
                          type="button"
                          className="sp-pw-eye"
                          onClick={() => setShowPw((p) => ({ ...p, [key]: !p[key] }))}
                        >
                          <span className="material-symbols-rounded">
                            {showPw[key] ? "visibility_off" : "visibility"}
                          </span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="sp-form-footer">
                  <button type="submit" className="sp-save-btn sp-save-btn-pw" disabled={pwLoading}>
                    {pwLoading ? (
                      <><span className="sp-spinner" /> Updating…</>
                    ) : (
                      <><span className="material-symbols-rounded">key</span> Update Password</>
                    )}
                  </button>
                </div>
              </form>

            </div>
          </div>
        )}
      </main>

      {/* ── TOAST ── */}
      {toast && (
        <div className={`sp-toast sp-toast-${toast.type}`}>
          <span className="material-symbols-rounded sp-toast-icon">
            {toast.type === "success" ? "check_circle" : "error"}
          </span>
          <span>{toast.message}</span>
          <button className="sp-toast-close" onClick={() => setToast(null)}>
            <span className="material-symbols-rounded">close</span>
          </button>
        </div>
      )}
    </div>
  );
}
